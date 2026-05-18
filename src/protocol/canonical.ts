import type { JsonValue } from "./schema-core";

export const CANONICALIZER_VERSION = "handshake-jcs-lite-0.2";

export function canonicalize(value: JsonValue): string {
  if (value === null) return "null";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error("Cannot canonicalize non-finite number");
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) return `[${value.map((item) => canonicalize(item)).join(",")}]`;

  const keys = Object.keys(value).sort();
  const fields = keys.map((key) => `${JSON.stringify(key)}:${canonicalize(value[key] as JsonValue)}`);
  return `{${fields.join(",")}}`;
}

export async function digestCanonical(value: JsonValue): Promise<`sha256:${string}`> {
  const bytes = new TextEncoder().encode(canonicalize(value));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return `sha256:${toHex(digest)}`;
}

export async function signCanonicalHmac(value: JsonValue, secret: string): Promise<`hmac-sha256:${string}`> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(canonicalize(value)));
  return `hmac-sha256:${toHex(signature)}`;
}

export async function verifyCanonicalHmac(value: JsonValue, secret: string, expected: string): Promise<boolean> {
  return (await signCanonicalHmac(value, secret)) === expected;
}

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}
