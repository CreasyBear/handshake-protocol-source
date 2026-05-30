/** Normalize A1 serde JSON fixtures into lowercase hex wire form. */
import { toHexLower } from "./hex.js";

/** Coerce A1 serde JSON (byte arrays) into lowercase hex wire form. */
export function normalizeSignedChainWire(raw: unknown): unknown {
  if (!raw || typeof raw !== "object") return raw;
  const chain = raw as Record<string, unknown>;
  return {
    version: chain.version,
    principal_pk: coerceHex32(chain.principal_pk, "principal_pk"),
    principal_scope: coerceHex32(chain.principal_scope, "principal_scope"),
    certs: Array.isArray(chain.certs) ? chain.certs.map((cert) => normalizeCertWire(cert)) : [],
  };
}

function normalizeCertWire(raw: unknown): Record<string, unknown> {
  if (!raw || typeof raw !== "object") {
    throw new Error("invalid cert wire");
  }
  const cert = raw as Record<string, unknown>;
  const scopeProof = cert.scope_proof;
  return {
    version: cert.version,
    delegator_pk: coerceHex32(cert.delegator_pk, "delegator_pk"),
    delegate_pk: coerceHex32(cert.delegate_pk, "delegate_pk"),
    scope_root: coerceHex32(cert.scope_root, "scope_root"),
    scope_proof: normalizeSubscopeProof(scopeProof),
    nonce: coerceHex16(cert.nonce, "nonce"),
    issued_at: cert.issued_at,
    expiration_unix: cert.expiration_unix,
    max_depth: cert.max_depth,
    ...(cert.extensions !== undefined ? { extensions: normalizeExtensions(cert.extensions) } : {}),
    signature: coerceHex64(cert.signature, "signature"),
  };
}

function normalizeSubscopeProof(raw: unknown): Record<string, unknown> {
  if (!raw || typeof raw !== "object") {
    return { subset_intents: [], proofs: [] };
  }
  const proof = raw as Record<string, unknown>;
  const subset = Array.isArray(proof.subset_intents)
    ? proof.subset_intents.map((h) => coerceHex32(h, "subset_intents"))
    : [];
  const proofs = Array.isArray(proof.proofs)
    ? proof.proofs.map((path) =>
        Array.isArray(path)
          ? path.map((node) => {
              const n = node as Record<string, unknown>;
              return {
                hash: coerceHex32(n.hash, "sibling hash"),
                is_left: Boolean(n.is_left),
              };
            })
          : [],
      )
    : [];
  return { subset_intents: subset, proofs };
}

function normalizeExtensions(raw: unknown): Record<string, unknown> | undefined {
  if (raw === undefined || raw === null) return undefined;
  if (typeof raw !== "object") return undefined;
  const obj = raw as Record<string, unknown>;
  if ("fields" in obj && obj.fields && typeof obj.fields === "object") {
    const fields = obj.fields as Record<string, unknown>;
    return Object.keys(fields).length > 0 ? fields : undefined;
  }
  return Object.keys(obj).length > 0 ? obj : undefined;
}

function coerceHex32(value: unknown, field: string): string {
  if (typeof value === "string") return value.trim().toLowerCase();
  const bytes = coerceBytes(value, 32, field);
  return toHexLower(bytes);
}

function coerceHex16(value: unknown, field: string): string {
  if (typeof value === "string") return value.trim().toLowerCase();
  const bytes = coerceBytes(value, 16, field);
  return toHexLower(bytes);
}

function coerceHex64(value: unknown, field: string): string {
  if (typeof value === "string") return value.trim().toLowerCase();
  const bytes = coerceBytes(value, 64, field);
  return toHexLower(bytes);
}

function coerceBytes(value: unknown, length: number, field: string): Uint8Array {
  if (value instanceof Uint8Array) {
    if (value.length !== length) throw new Error(`${field} invalid byte length`);
    return value;
  }
  if (Array.isArray(value) && value.every((n) => typeof n === "number")) {
    if (value.length !== length) throw new Error(`${field} invalid array length`);
    return Uint8Array.from(value as number[]);
  }
  throw new Error(`${field} must be hex string or byte array`);
}
