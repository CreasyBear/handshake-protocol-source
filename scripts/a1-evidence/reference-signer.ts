/**
 * Independent Handshake-domain reference signer for conformance fixtures.
 * Preimage construction mirrors A1 cert.rs layout but does not import verify-chain.
 */
import { ed25519 } from "@noble/curves/ed25519";
import { blake3 } from "@noble/hashes/blake3";
import {
  CERT_VERSION,
  DOMAIN_CERT_EXT,
  DOMAIN_CERT_FP,
  DOMAIN_CERT_SIG,
  DOMAIN_CHAIN_FP,
  DOMAIN_INTENT_LEAF,
  DOMAIN_MERKLE_NODE,
  DOMAIN_SUBSCOPE,
  INNER_CERT_EXT,
  INNER_CERT_FP,
  INNER_CERT_SIG,
  INNER_CHAIN_FP,
  INNER_INTENT_LEAF,
  INNER_SUBSCOPE,
} from "../../src/integrations/a1-evidence/primitives/domains.js";
import { toHexLower } from "../../src/integrations/a1-evidence/hex.js";
import type { SignedChainWire, WireDelegationCert } from "../../src/integrations/a1-evidence/wire-types.js";

export type ReferenceIdentity = {
  seed: number;
  secretKey: Uint8Array;
  publicKey: Uint8Array;
};

/** A1 DyoloIdentity::from_signing_bytes — raw 32-byte seed as secret key material. */
export function identityFromSigningBytes(seed: number): ReferenceIdentity {
  const bytes = new Uint8Array(32);
  for (let i = 0; i < 32; i++) bytes[i] = seed + i;
  const publicKey = ed25519.getPublicKey(bytes);
  return { seed, secretKey: bytes, publicKey };
}

export function fixedNonce(n: number): Uint8Array {
  const out = new Uint8Array(16);
  for (let i = 0; i < 16; i++) out[i] = n + i;
  return out;
}

function deriveKey(domain: string, version: number): ReturnType<typeof blake3.create> {
  const h = blake3.create({ context: domain });
  h.update(Uint8Array.of(version));
  return h;
}

function u64Be(value: number): Uint8Array {
  const buf = new ArrayBuffer(8);
  new DataView(buf).setBigUint64(0, BigInt(value), false);
  return new Uint8Array(buf);
}

function u64Le(value: number): Uint8Array {
  const buf = new ArrayBuffer(8);
  new DataView(buf).setBigUint64(0, BigInt(value), true);
  return new Uint8Array(buf);
}

function refSubscopeCommitment(
  subsetIntents: Uint8Array[],
  proofs: { hash: Uint8Array; isLeft: boolean }[][],
): Uint8Array {
  const h = deriveKey(DOMAIN_SUBSCOPE, CERT_VERSION);
  h.update(new TextEncoder().encode(INNER_SUBSCOPE));
  h.update(u64Le(subsetIntents.length));
  for (const intent of subsetIntents) h.update(intent);
  h.update(u64Le(proofs.length));
  for (const path of proofs) {
    h.update(u64Le(path.length));
    for (const node of path) {
      h.update(node.hash);
      h.update(Uint8Array.of(node.isLeft ? 1 : 0));
    }
  }
  return h.digest();
}

function refCertExtensionsCommitment(version: number, extensions: Record<string, unknown> | undefined): Uint8Array {
  const h = deriveKey(DOMAIN_CERT_EXT, version);
  h.update(new TextEncoder().encode(INNER_CERT_EXT));
  const fields =
    extensions && typeof extensions === "object" && "fields" in extensions
      ? (extensions.fields as Record<string, unknown>)
      : (extensions ?? {});
  const keys = Object.keys(fields).sort();
  if (keys.length === 0) {
    h.update(u64Le(0));
    return h.digest();
  }
  h.update(u64Le(keys.length));
  for (const key of keys) {
    const value = fields[key];
    const keyBytes = new TextEncoder().encode(key);
    h.update(u64Le(keyBytes.length));
    h.update(keyBytes);
    if (typeof value === "string") {
      const bytes = new TextEncoder().encode(value);
      h.update(Uint8Array.of(0));
      h.update(u64Le(bytes.length));
      h.update(bytes);
    } else if (typeof value === "number" && Number.isInteger(value) && value >= 0) {
      h.update(Uint8Array.of(1));
      h.update(u64Le(value));
    } else {
      throw new Error("unsupported extension value");
    }
  }
  return h.digest();
}

export function refCertSignableBytes(cert: {
  version: number;
  delegator_pk: Uint8Array;
  delegate_pk: Uint8Array;
  scope_root: Uint8Array;
  scope_proof: { subset_intents: Uint8Array[]; proofs: { hash: Uint8Array; isLeft: boolean }[][] };
  nonce: Uint8Array;
  issued_at: number;
  expiration_unix: number;
  max_depth: number;
  extensions?: Record<string, unknown>;
}): Uint8Array {
  const extCommit = refCertExtensionsCommitment(cert.version, cert.extensions);
  const h = deriveKey(DOMAIN_CERT_SIG, cert.version);
  h.update(new TextEncoder().encode(INNER_CERT_SIG));
  h.update(cert.delegator_pk);
  h.update(cert.delegate_pk);
  h.update(cert.scope_root);
  h.update(refSubscopeCommitment(cert.scope_proof.subset_intents, cert.scope_proof.proofs));
  h.update(cert.nonce);
  h.update(u64Be(cert.issued_at));
  h.update(u64Be(cert.expiration_unix));
  h.update(Uint8Array.of(cert.max_depth));
  h.update(extCommit);
  return h.digest();
}

export function refCertFingerprint(signature: Uint8Array, version: number): Uint8Array {
  const h = deriveKey(DOMAIN_CERT_FP, version);
  h.update(new TextEncoder().encode(INNER_CERT_FP));
  h.update(signature);
  return h.digest();
}

export function refIntentLeafHash(action: string, params: Record<string, string>): Uint8Array {
  const sortedKeys = Object.keys(params).sort();
  const h = deriveKey(DOMAIN_INTENT_LEAF, CERT_VERSION);
  h.update(new TextEncoder().encode(INNER_INTENT_LEAF));
  const actionBytes = new TextEncoder().encode(action);
  h.update(u64Le(actionBytes.length));
  h.update(actionBytes);
  h.update(u64Le(sortedKeys.length));
  for (const key of sortedKeys) {
    const keyBytes = new TextEncoder().encode(key);
    const valueBytes = new TextEncoder().encode(params[key] ?? "");
    h.update(u64Le(keyBytes.length));
    h.update(keyBytes);
    h.update(u64Le(valueBytes.length));
    h.update(valueBytes);
  }
  return h.digest();
}

export function refMerkleNode(left: Uint8Array, right: Uint8Array): Uint8Array {
  const h = deriveKey(DOMAIN_MERKLE_NODE, CERT_VERSION);
  h.update(left);
  h.update(right);
  return h.digest();
}

export function refIntentTreeRoot(leaves: Uint8Array[]): Uint8Array {
  const sorted = [...leaves].sort((a, b) => compareBytes(a, b));
  const deduped: Uint8Array[] = [];
  for (const leaf of sorted) {
    if (deduped.length === 0 || !bytesEqual(deduped[deduped.length - 1]!, leaf)) deduped.push(leaf);
  }
  let current = deduped;
  while (current.length > 1) {
    const next: Uint8Array[] = [];
    for (let i = 0; i < current.length; i += 2) {
      const left = current[i]!;
      const right = i + 1 < current.length ? current[i + 1]! : left;
      next.push(refMerkleNode(left, right));
    }
    current = next;
  }
  return current[0]!;
}

export function refChainFingerprint(input: {
  principalPk: Uint8Array;
  principalScope: Uint8Array;
  certFingerprints: Uint8Array[];
}): Uint8Array {
  const h = blake3.create({ context: DOMAIN_CHAIN_FP });
  h.update(new TextEncoder().encode(INNER_CHAIN_FP));
  h.update(input.principalPk);
  h.update(input.principalScope);
  h.update(u64Be(0));
  for (const fp of input.certFingerprints) h.update(fp);
  return h.digest();
}

export function signDelegationCert(input: {
  delegator: ReferenceIdentity;
  delegatePk: Uint8Array;
  scopeRoot: Uint8Array;
  nonce: Uint8Array;
  issuedAt: number;
  expirationUnix: number;
  maxDepth: number;
}): WireDelegationCert {
  const scopeProof = { subset_intents: [] as string[], proofs: [] as { hash: string; is_left: boolean }[][] };
  const partial = {
    version: CERT_VERSION,
    delegator_pk: input.delegator.publicKey,
    delegate_pk: input.delegatePk,
    scope_root: input.scopeRoot,
    scope_proof: { subset_intents: [] as Uint8Array[], proofs: [] as { hash: Uint8Array; isLeft: boolean }[][] },
    nonce: input.nonce,
    issued_at: input.issuedAt,
    expiration_unix: input.expirationUnix,
    max_depth: input.maxDepth,
    extensions: { fields: {} },
  };
  const msg = refCertSignableBytes(partial);
  const signature = ed25519.sign(msg, input.delegator.secretKey);
  return {
    version: CERT_VERSION,
    delegator_pk: toHexLower(input.delegator.publicKey),
    delegate_pk: toHexLower(input.delegatePk),
    scope_root: toHexLower(input.scopeRoot),
    scope_proof: scopeProof,
    nonce: toHexLower(input.nonce),
    issued_at: input.issuedAt,
    expiration_unix: input.expirationUnix,
    max_depth: input.maxDepth,
    extensions: { fields: {} },
    signature: toHexLower(signature),
  };
}

export function buildSignedChain(input: {
  principal: ReferenceIdentity;
  principalScope: Uint8Array;
  certs: WireDelegationCert[];
}): SignedChainWire {
  return {
    version: CERT_VERSION,
    principal_pk: toHexLower(input.principal.publicKey),
    principal_scope: toHexLower(input.principalScope),
    certs: input.certs,
  };
}

export function certFingerprintHex(cert: WireDelegationCert): string {
  const sig = hexToBytes64(cert.signature);
  return toHexLower(refCertFingerprint(sig, cert.version));
}

export function chainFingerprintHex(chain: SignedChainWire): string {
  const principalPk = hexToBytes32(chain.principal_pk);
  const principalScope = hexToBytes32(chain.principal_scope);
  const fps = chain.certs.map((c) => refCertFingerprint(hexToBytes64(c.signature), c.version));
  return toHexLower(refChainFingerprint({ principalPk, principalScope, certFingerprints: fps }));
}

function hexToBytes32(hex: string): Uint8Array {
  const out = new Uint8Array(32);
  for (let i = 0; i < 32; i++) out[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return out;
}

function hexToBytes64(hex: string): Uint8Array {
  const out = new Uint8Array(64);
  for (let i = 0; i < 64; i++) out[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return out;
}

function compareBytes(a: Uint8Array, b: Uint8Array): number {
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    const diff = a[i]! - b[i]!;
    if (diff !== 0) return diff;
  }
  return a.length - b.length;
}

function bytesEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i]! ^ b[i]!;
  return diff === 0;
}
