/**
 * Evidence-only delegation chain verifier (zip215:true). Does not issue greenlights.
 * Design lineage: MIT-licensed A1 (https://github.com/dyologician/A1) — see THIRD_PARTY_NOTICES.
 */
import { ed25519 } from "@noble/curves/ed25519";
import { A1_VERIFIER_VERSION, CERT_VERSION } from "./primitives/domains.js";
import {
  certExtensionsCommitment,
  certFingerprint,
  certSignableBytes,
  chainFingerprint,
  merkleNode,
  merkleProofVerify,
} from "./primitives/crypto.js";
import { parseHex32 } from "./hex.js";
import { mapStructuralFailure, type A1StructuralFailure } from "./reason-codes.js";
import type { A1VerifyInvalid, A1VerifyOutcome } from "./types.js";
import { parseSignedChain, type SignedChainWire, type SubScopeProofWire } from "./wire-types.js";

const ZIP215 = { zip215: true as const };

export type VerifySignedChainInput = {
  signedChain: SignedChainWire | string | Uint8Array;
  executorPk: Uint8Array | string;
  intentHash: Uint8Array | string;
  merkleProof: { siblings: { hash: Uint8Array | string; isLeft: boolean }[] };
  nowUnix?: number | undefined;
  driftToleranceSecs?: number | undefined;
};

export function verifySignedChain(input: VerifySignedChainInput): A1VerifyOutcome {
  try {
    const chain = parseSignedChain(input.signedChain);
    const executorPk =
      typeof input.executorPk === "string" ? parseHex32(input.executorPk, "executorPk") : input.executorPk;
    const intentHash =
      typeof input.intentHash === "string" ? parseHex32(input.intentHash, "intentHash") : input.intentHash;
    const merkleSiblings = input.merkleProof.siblings.map((sibling, index) => ({
      hash:
        typeof sibling.hash === "string"
          ? parseHex32(sibling.hash, `merkleProof.siblings[${index}].hash`)
          : sibling.hash,
      isLeft: sibling.isLeft,
    }));

    const nowUnix = input.nowUnix ?? Math.floor(Date.now() / 1000);
    const driftToleranceSecs = input.driftToleranceSecs ?? 15;

    const result = validateStructure(chain, executorPk, intentHash, merkleSiblings, nowUnix, driftToleranceSecs);
    if (!result.ok) {
      return invalidOutcome(result.failure);
    }

    return {
      valid: true,
      chainFingerprint: result.chainFingerprint,
      certFingerprints: result.certFingerprints,
      chainDepth: result.depth,
      principalPk: parseHex32(chain.principal_pk, "principal_pk"),
      terminalDelegatePk: executorPk,
      verifiedScopeRoot: result.verifiedScopeRoot,
      verifiedAtUnix: nowUnix,
      a1VerifierVersion: A1_VERIFIER_VERSION,
      verifyPath: "ts",
    };
  } catch {
    return invalidOutcome("malformed");
  }
}

function invalidOutcome(failure: A1StructuralFailure): A1VerifyInvalid {
  const reasonCode = mapStructuralFailure(failure);
  return {
    valid: false,
    reasonCode,
    reasonCodes: [reasonCode],
    a1VerifierVersion: A1_VERIFIER_VERSION,
    verifyPath: "ts",
  };
}

type ValidateOk = {
  ok: true;
  depth: number;
  verifiedScopeRoot: Uint8Array;
  certFingerprints: Uint8Array[];
  chainFingerprint: Uint8Array;
};

type ValidateErr = { ok: false; failure: A1StructuralFailure };

function validateStructure(
  chain: SignedChainWire,
  agentPk: Uint8Array,
  intent: Uint8Array,
  proof: { hash: Uint8Array; isLeft: boolean }[],
  now: number,
  driftTolerance: number,
): ValidateOk | ValidateErr {
  if (chain.certs.length === 0) return { ok: false, failure: "empty_chain" };

  const principalPk = parseHex32(chain.principal_pk, "principal_pk");
  if (!bytesEqual(parseHex32(chain.certs[0]!.delegator_pk, "delegator_pk"), principalPk)) {
    return { ok: false, failure: "root_mismatch" };
  }

  const toleratedEarly = now + driftTolerance;
  const toleratedLate = now - driftTolerance;
  if (chain.certs.length > 255) return { ok: false, failure: "max_depth_exceeded" };

  let currentScope = parseHex32(chain.principal_scope, "principal_scope");
  let expectedDelegator = principalPk;
  let depth = 0;
  let maxAllowedDepth = 255;
  let parentExpiry = Number.MAX_SAFE_INTEGER;
  const seenNonces: Uint8Array[] = [];
  const certFingerprints: Uint8Array[] = [];

  for (const cert of chain.certs) {
    const delegatorPk = parseHex32(cert.delegator_pk, "delegator_pk");
    if (!bytesEqual(delegatorPk, expectedDelegator)) {
      return { ok: false, failure: "broken_linkage" };
    }
    if (cert.version !== CERT_VERSION) {
      return { ok: false, failure: "unsupported_version" };
    }

    const extCommit = certExtensionsCommitment(cert.version, cert.extensions);
    const msg = certSignableBytes(cert, extCommit);
    const signature = hexToBytes64(cert.signature);
    if (!ed25519.verify(signature, msg, delegatorPk, ZIP215)) {
      return { ok: false, failure: "invalid_signature" };
    }

    if (toleratedEarly < cert.issued_at) return { ok: false, failure: "not_yet_valid" };
    if (cert.expiration_unix < toleratedLate) return { ok: false, failure: "expired" };
    if (cert.expiration_unix > parentExpiry) return { ok: false, failure: "temporal_violation" };

    depth += 1;
    if (depth > maxAllowedDepth) return { ok: false, failure: "max_depth_exceeded" };
    if (cert.max_depth < maxAllowedDepth) maxAllowedDepth = cert.max_depth;

    const nonce = parseHex16(cert.nonce);
    for (const seen of seenNonces) {
      if (bytesEqual(seen, nonce)) return { ok: false, failure: "nonce_replay" };
    }
    seenNonces.push(nonce);
    certFingerprints.push(certFingerprint(cert));

    const scopeRoot = parseHex32(cert.scope_root, "scope_root");
    const passthrough = cert.scope_proof.subset_intents.length === 0 && cert.scope_proof.proofs.length === 0;
    if (passthrough) {
      if (!bytesEqual(scopeRoot, currentScope)) return { ok: false, failure: "scope_escalation" };
    } else {
      const derived = verifyAndDeriveSubscopeRoot(cert.scope_proof, currentScope);
      if (!derived || !bytesEqual(derived, scopeRoot)) {
        return { ok: false, failure: "scope_escalation" };
      }
    }

    parentExpiry = cert.expiration_unix;
    currentScope = scopeRoot;
    expectedDelegator = parseHex32(cert.delegate_pk, "delegate_pk");
  }

  if (!bytesEqual(expectedDelegator, agentPk)) {
    return { ok: false, failure: "unauthorized_leaf" };
  }

  const intentAuthorized =
    proof.length === 0 ? bytesEqual(intent, currentScope) : merkleProofVerify(intent, proof, currentScope);
  if (!intentAuthorized) return { ok: false, failure: "scope_violation" };

  const chainFp = chainFingerprint({
    principalPk,
    principalScope: parseHex32(chain.principal_scope, "principal_scope"),
    certFingerprints,
  });

  return {
    ok: true,
    depth,
    verifiedScopeRoot: currentScope,
    certFingerprints,
    chainFingerprint: chainFp,
  };
}

function verifyAndDeriveSubscopeRoot(proof: SubScopeProofWire, parentRoot: Uint8Array): Uint8Array | null {
  if (proof.subset_intents.length === 0) return parentRoot;
  if (proof.subset_intents.length !== proof.proofs.length) return null;

  const leaves = proof.subset_intents.map((hex) => parseHex32(hex, "subset_intents"));
  for (let i = 0; i < leaves.length; i++) {
    const leaf = leaves[i]!;
    const path = proof.proofs[i] ?? [];
    const siblings = path.map((node) => ({
      hash: parseHex32(node.hash, "sibling"),
      isLeft: node.is_left,
    }));
    if (!merkleProofVerify(leaf, siblings, parentRoot)) return null;
  }

  return buildIntentTreeRoot(leaves);
}

function buildIntentTreeRoot(leaves: Uint8Array[]): Uint8Array | null {
  if (leaves.length === 0) return null;
  const sorted = [...leaves].sort((a, b) => compareBytes(a, b));
  const deduped: Uint8Array[] = [];
  for (const leaf of sorted) {
    if (deduped.length === 0 || !bytesEqual(deduped[deduped.length - 1]!, leaf)) {
      deduped.push(leaf);
    }
  }

  let current = deduped;
  while (current.length > 1) {
    const next: Uint8Array[] = [];
    for (let i = 0; i < current.length; i += 2) {
      const left = current[i]!;
      const right = i + 1 < current.length ? current[i + 1]! : left;
      next.push(merkleNode(left, right));
    }
    current = next;
  }
  return current[0] ?? null;
}

function compareBytes(a: Uint8Array, b: Uint8Array): number {
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    const diff = a[i]! - b[i]!;
    if (diff !== 0) return diff;
  }
  return a.length - b.length;
}

function parseHex16(value: string): Uint8Array {
  const normalized = value.trim().toLowerCase();
  if (!/^[0-9a-f]{32}$/.test(normalized)) throw new Error("invalid hex16");
  const out = new Uint8Array(16);
  for (let i = 0; i < 16; i++) out[i] = Number.parseInt(normalized.slice(i * 2, i * 2 + 2), 16);
  return out;
}

function hexToBytes64(hex: string): Uint8Array {
  const normalized = hex.trim().toLowerCase();
  const out = new Uint8Array(64);
  for (let i = 0; i < 64; i++) out[i] = Number.parseInt(normalized.slice(i * 2, i * 2 + 2), 16);
  return out;
}

function bytesEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i]! ^ b[i]!;
  return diff === 0;
}
