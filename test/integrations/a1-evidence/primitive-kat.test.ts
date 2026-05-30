/**
 * External known-answer tests for the primitives used by delegation-evidence verify.
 *
 * The chain composition is Handshake-owned and self-defined (see proof gap
 * `delegation_evidence_verify:self_defined_composition`), but the underlying
 * primitives are anchored on published external vectors so the cryptographic
 * floor is not self-referential:
 *   - BLAKE3: official test vectors (BLAKE3-team/BLAKE3 test_vectors.json).
 *   - Ed25519: RFC 8032 section 7.1 Test 1.
 */
import { describe, expect, it } from "bun:test";
import { blake3 } from "@noble/hashes/blake3";
import { ed25519 } from "@noble/curves/ed25519";

function hex(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("hex");
}

function fromHex(value: string): Uint8Array {
  return Uint8Array.from(Buffer.from(value, "hex"));
}

describe("a1-evidence primitive KATs", () => {
  // BLAKE3 official vectors. Inputs are the repeating byte ramp i % 251;
  // outputs are the first 32 bytes of the extended-output reference hash.
  it("BLAKE3 matches the official empty-input vector", () => {
    expect(hex(blake3(new Uint8Array(0)))).toBe("af1349b9f5f9a1a6a0404dea36dcc9499bcb25c9adc112b7cc9a93cae41f3262");
  });

  it("BLAKE3 matches the official 1-byte vector (input [0x00])", () => {
    expect(hex(blake3(Uint8Array.of(0)))).toBe("2d3adedff11b61f14c886e35afa036736dcd87a74d27b5c1510225d0f592e213");
  });

  it("BLAKE3 matches the official 2-byte vector (input [0x00,0x01])", () => {
    expect(hex(blake3(Uint8Array.of(0, 1)))).toBe("7b7015bb92cf0b318037702a6cdd81dee41224f734684c2c122cd6359cb1ee63");
  });

  // RFC 8032 section 7.1, Test 1 (empty message).
  const seed = fromHex("9d61b19deffd5a60ba844af492ec2cc44449c5697b326919703bac031cae7f60");
  const expectedPublicKey = "d75a980182b10ab7d54bfed3c964073a0ee172f3daa62325af021a68f707511a";
  const expectedSignature =
    "e5564300c360ac729086e2cc806e828a84877f1eb8e5d974d873e065224901555fb8821590a33bacc61e39701cf9b46bd25bf5f0595bbe24655141438e7a100b";
  const message = new Uint8Array(0);

  it("Ed25519 derives the RFC 8032 Test 1 public key from the seed", () => {
    expect(hex(ed25519.getPublicKey(seed))).toBe(expectedPublicKey);
  });

  it("Ed25519 produces the RFC 8032 Test 1 signature deterministically", () => {
    expect(hex(ed25519.sign(message, seed))).toBe(expectedSignature);
  });

  it("Ed25519 verifies the RFC 8032 Test 1 vector under both strict and zip215 policies", () => {
    const signature = fromHex(expectedSignature);
    const publicKey = fromHex(expectedPublicKey);
    // A canonical RFC vector must be accepted identically by both modes; the
    // production verifier uses zip215:true (see A1_VERIFIER_VERSION).
    expect(ed25519.verify(signature, message, publicKey, { zip215: false })).toBe(true);
    expect(ed25519.verify(signature, message, publicKey, { zip215: true })).toBe(true);
  });

  it("Ed25519 rejects a tampered signature under the zip215 policy", () => {
    const tampered = fromHex(expectedSignature);
    tampered[0] = (tampered[0]! ^ 0x01) & 0xff;
    expect(ed25519.verify(tampered, message, fromHex(expectedPublicKey), { zip215: true })).toBe(false);
  });
});
