import { blake3 } from "@noble/hashes/blake3";
import { DOMAIN_VERIFY_OUTCOME } from "./domains.js";
import { toHexLower } from "../hex.js";

export type A1VerifyOutcomeDigestInput = {
  valid: boolean;
  reasonCodes: string[];
  chainDepth: number;
  principalPkFingerprint: Uint8Array;
  terminalPkFingerprint: Uint8Array;
  verifiedScopeRoot: Uint8Array;
  verifiedAtUnix: number;
};

export function computeA1VerifyOutcomeDigest(input: A1VerifyOutcomeDigestInput): Uint8Array {
  const h = blake3.create({ context: DOMAIN_VERIFY_OUTCOME });
  h.update(Uint8Array.of(input.valid ? 1 : 0));
  h.update(u64Be(input.reasonCodes.length));
  for (const code of input.reasonCodes) {
    const bytes = new TextEncoder().encode(code);
    h.update(u16Be(bytes.length));
    h.update(bytes);
  }
  h.update(Uint8Array.of(input.chainDepth));
  h.update(input.principalPkFingerprint);
  h.update(input.terminalPkFingerprint);
  h.update(input.verifiedScopeRoot);
  h.update(u64Be(input.verifiedAtUnix));
  return h.digest();
}

export function verifyOutcomeDigestHex(digest: Uint8Array): string {
  return toHexLower(digest);
}

function u16Be(value: number): Uint8Array {
  const buf = new ArrayBuffer(2);
  new DataView(buf).setUint16(0, value, false);
  return new Uint8Array(buf);
}

function u64Be(value: number): Uint8Array {
  const buf = new ArrayBuffer(8);
  new DataView(buf).setBigUint64(0, BigInt(value), false);
  return new Uint8Array(buf);
}
