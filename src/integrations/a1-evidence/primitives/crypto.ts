/**
 * Delegation evidence digests and cert preimages (Handshake-owned domains).
 * Design lineage: MIT-licensed A1 (https://github.com/dyologician/A1) — see THIRD_PARTY_NOTICES.
 */
import { blake3 } from "@noble/hashes/blake3";
import {
  CERT_VERSION,
  DOMAIN_CERT_EXT,
  DOMAIN_CERT_FP,
  DOMAIN_CERT_SIG,
  DOMAIN_CHAIN_FP,
  DOMAIN_INTENT_LEAF,
  DOMAIN_MERKLE_NODE,
  DOMAIN_PK_FP,
  DOMAIN_SUBSCOPE,
  INNER_CERT_EXT,
  INNER_CERT_FP,
  INNER_CERT_SIG,
  INNER_CHAIN_FP,
  INNER_INTENT_LEAF,
  INNER_SUBSCOPE,
} from "./domains.js";
import type { SubScopeProofWire, WireDelegationCert } from "../wire-types.js";
import { parseHex16, parseHex32, parseHex64 } from "../hex.js";

export function deriveKey(domain: string, version: number): ReturnType<typeof blake3.create> {
  const h = blake3.create({ context: domain });
  h.update(Uint8Array.of(version));
  return h;
}

export function certSignableBytes(cert: WireDelegationCert, extCommitment: Uint8Array): Uint8Array {
  const delegatorPk = parseHex32(cert.delegator_pk, "delegator_pk");
  const delegatePk = parseHex32(cert.delegate_pk, "delegate_pk");
  const scopeRoot = parseHex32(cert.scope_root, "scope_root");
  const nonce = parseHex16(cert.nonce, "nonce");

  const h = deriveKey(DOMAIN_CERT_SIG, cert.version);
  h.update(new TextEncoder().encode(INNER_CERT_SIG));
  h.update(delegatorPk);
  h.update(delegatePk);
  h.update(scopeRoot);
  h.update(subscopeProofCommitment(cert.scope_proof));
  h.update(nonce);
  h.update(u64Be(cert.issued_at));
  h.update(u64Be(cert.expiration_unix));
  h.update(Uint8Array.of(cert.max_depth));
  h.update(extCommitment);
  return h.digest();
}

export function certFingerprint(cert: WireDelegationCert): Uint8Array {
  const signature = parseHex64(cert.signature, "signature");
  const h = deriveKey(DOMAIN_CERT_FP, cert.version);
  h.update(new TextEncoder().encode(INNER_CERT_FP));
  h.update(signature);
  return h.digest();
}

export function certExtensionsCommitment(version: number, extensions: Record<string, unknown> | undefined): Uint8Array {
  const h = deriveKey(DOMAIN_CERT_EXT, version);
  h.update(new TextEncoder().encode(INNER_CERT_EXT));
  const fields = unwrapExtensionFields(extensions);
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
    encodeExtValue(h, value);
  }
  return h.digest();
}

function encodeExtValue(h: ReturnType<typeof blake3.create>, value: unknown): void {
  if (typeof value === "string") {
    const bytes = new TextEncoder().encode(value);
    h.update(Uint8Array.of(0));
    h.update(u64Le(bytes.length));
    h.update(bytes);
    return;
  }
  if (typeof value === "number" && Number.isInteger(value) && value >= 0) {
    h.update(Uint8Array.of(1));
    h.update(u64Le(value));
    return;
  }
  if (Array.isArray(value) && value.every((item) => typeof item === "string")) {
    h.update(Uint8Array.of(2));
    h.update(u64Le(value.length));
    for (const item of value) {
      const bytes = new TextEncoder().encode(item);
      h.update(u64Le(bytes.length));
      h.update(bytes);
    }
    return;
  }
  throw new Error("unsupported CertExtensions value");
}

export function subscopeProofCommitment(proof: SubScopeProofWire): Uint8Array {
  const h = deriveKey(DOMAIN_SUBSCOPE, CERT_VERSION);
  h.update(new TextEncoder().encode(INNER_SUBSCOPE));
  h.update(u64Le(proof.subset_intents.length));
  for (const intent of proof.subset_intents) {
    h.update(parseHex32(intent, "subset_intents"));
  }
  h.update(u64Le(proof.proofs.length));
  for (const path of proof.proofs) {
    h.update(u64Le(path.length));
    for (const node of path) {
      h.update(parseHex32(node.hash, "proof sibling hash"));
      h.update(Uint8Array.of(node.is_left ? 1 : 0));
    }
  }
  return h.digest();
}

export function intentLeafHash(action: string, params: Record<string, string>): Uint8Array {
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

export function normalizeIntentParam(key: string, value: string): { key: string; value: string } {
  return { key: key.trim().toLowerCase(), value: value.trim().toLowerCase() };
}

export function intentFromAction(action: string, params: Record<string, string>): Uint8Array {
  const normalized: Record<string, string> = {};
  for (const [key, value] of Object.entries(params)) {
    const { key: k, value: v } = normalizeIntentParam(key, value);
    normalized[k] = v;
  }
  return intentLeafHash(action.trim().toLowerCase(), normalized);
}

export function merkleNode(left: Uint8Array, right: Uint8Array): Uint8Array {
  const h = deriveKey(DOMAIN_MERKLE_NODE, CERT_VERSION);
  h.update(left);
  h.update(right);
  return h.digest();
}

export function merkleProofVerify(
  leaf: Uint8Array,
  proof: { hash: Uint8Array; isLeft: boolean }[],
  expectedRoot: Uint8Array,
): boolean {
  let current = leaf;
  for (const node of proof) {
    current = node.isLeft ? merkleNode(node.hash, current) : merkleNode(current, node.hash);
  }
  return bytesEqual(current, expectedRoot);
}

export function chainFingerprint(input: {
  principalPk: Uint8Array;
  principalScope: Uint8Array;
  namespace?: string | undefined;
  certFingerprints: Uint8Array[];
}): Uint8Array {
  const h = blake3.create({ context: DOMAIN_CHAIN_FP });
  h.update(new TextEncoder().encode(INNER_CHAIN_FP));
  h.update(input.principalPk);
  h.update(input.principalScope);
  if (input.namespace !== undefined) {
    const nsBytes = new TextEncoder().encode(input.namespace);
    h.update(u64Be(nsBytes.length));
    h.update(nsBytes);
  } else {
    h.update(u64Be(0));
  }
  for (const fp of input.certFingerprints) {
    h.update(fp);
  }
  return h.digest();
}

export function pkFingerprint(pk: Uint8Array): Uint8Array {
  const h = blake3.create({ context: DOMAIN_PK_FP });
  h.update(pk);
  return h.digest();
}

function u64Be(value: number): Uint8Array {
  const buf = new ArrayBuffer(8);
  new DataView(buf).setBigUint64(0, BigInt(value), false);
  return new Uint8Array(buf);
}

function unwrapExtensionFields(extensions: Record<string, unknown> | undefined): Record<string, unknown> {
  if (!extensions) return {};
  if (
    "fields" in extensions &&
    extensions.fields &&
    typeof extensions.fields === "object" &&
    !Array.isArray(extensions.fields)
  ) {
    return extensions.fields as Record<string, unknown>;
  }
  return extensions;
}

function u64Le(value: number): Uint8Array {
  const buf = new ArrayBuffer(8);
  new DataView(buf).setBigUint64(0, BigInt(value), true);
  return new Uint8Array(buf);
}

function bytesEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i]! ^ b[i]!;
  return diff === 0;
}
