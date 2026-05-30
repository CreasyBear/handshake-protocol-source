/**
 * ZIP-215 policy edge: Handshake verify uses zip215:true (consensus-friendly).
 * Noble documents that small-order public keys accept arbitrary signatures under
 * ZIP-215 but fail strict RFC8032 verification — we pin that split here.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ed25519 } from "@noble/curves/ed25519";
import {
  certSignableBytes,
  certExtensionsCommitment,
} from "../../../src/integrations/a1-evidence/primitives/crypto.js";
import { verifySignedChain } from "../../../src/integrations/a1-evidence/verify-chain.js";
import { parseSignedChain } from "../../../src/integrations/a1-evidence/wire-types.js";

/** Ed25519 torsion / small-order public key (ZIP-215 accepts; RFC8032 rejects). */
const SMALL_ORDER_PUBLIC_KEY_HEX = "0000000000000000000000000000000000000000000000000000000000000000";
const ZERO_SIGNATURE_HEX = "0".repeat(128);

describe("a1-evidence ZIP-215 edge", () => {
  it("zip215:true and zip215:false disagree on small-order key with zero signature", () => {
    const message = new TextEncoder().encode("handshake-delegation-zip215-probe");
    const publicKey = Uint8Array.from(Buffer.from(SMALL_ORDER_PUBLIC_KEY_HEX, "hex"));
    const signature = Uint8Array.from(Buffer.from(ZERO_SIGNATURE_HEX, "hex"));

    const withZip215 = ed25519.verify(signature, message, publicKey, { zip215: true });
    const strict = ed25519.verify(signature, message, publicKey, { zip215: false });

    expect(withZip215).toBe(true);
    expect(strict).toBe(false);
    expect(withZip215).not.toBe(strict);
  });

  it("disagrees on a real cert signable preimage from valid-zip215-edge fixture", () => {
    const fixture = JSON.parse(
      readFileSync(join(process.cwd(), "test/fixtures/a1-evidence/valid-zip215-edge.json"), "utf8"),
    ) as { signedChain: unknown };
    const cert = parseSignedChain(fixture.signedChain).certs[0]!;
    const ext = certExtensionsCommitment(cert.version, cert.extensions);
    const message = certSignableBytes(cert, ext);
    const publicKey = Uint8Array.from(Buffer.from(SMALL_ORDER_PUBLIC_KEY_HEX, "hex"));
    const signature = Uint8Array.from(Buffer.from(ZERO_SIGNATURE_HEX, "hex"));

    expect(ed25519.verify(signature, message, publicKey, { zip215: true })).toBe(true);
    expect(ed25519.verify(signature, message, publicKey, { zip215: false })).toBe(false);
  });

  it("valid-zip215-edge.json chain verifies under Handshake zip215 policy", () => {
    const fixture = JSON.parse(
      readFileSync(join(process.cwd(), "test/fixtures/a1-evidence/valid-zip215-edge.json"), "utf8"),
    ) as {
      signedChain: unknown;
      executorPk: string;
      intentHash: string;
      merkleProof: { siblings: { hash: string; isLeft: boolean }[] };
      nowUnix: number;
      driftToleranceSecs: number;
      expected: { valid: boolean };
    };

    const outcome = verifySignedChain({
      signedChain: parseSignedChain(fixture.signedChain),
      executorPk: fixture.executorPk,
      intentHash: fixture.intentHash,
      merkleProof: fixture.merkleProof,
      nowUnix: fixture.nowUnix,
      driftToleranceSecs: fixture.driftToleranceSecs,
    });

    expect(outcome.valid).toBe(fixture.expected.valid);
  });
});
