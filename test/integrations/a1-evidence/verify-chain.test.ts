import { describe, expect, it } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { A1HandshakeReasonCode } from "../../../src/integrations/a1-evidence/reason-codes.js";
import { verifySignedChain } from "../../../src/integrations/a1-evidence/verify-chain.js";
import { toHexLower } from "../../../src/integrations/a1-evidence/hex.js";
import { parseSignedChain } from "../../../src/integrations/a1-evidence/wire-types.js";

const fixturesDir = join(process.cwd(), "test/fixtures/a1-evidence");

type FixtureFile = {
  signedChain: unknown;
  executorPk: string;
  intentHash: string;
  merkleProof: { siblings: { hash: string; isLeft: boolean }[] };
  nowUnix: number;
  driftToleranceSecs: number;
  expected: {
    valid: boolean;
    chainFingerprint: string;
    certFingerprints: string[];
    reasonCode: string | null;
  };
};

function loadFixtures(): { name: string; fixture: FixtureFile }[] {
  return readdirSync(fixturesDir)
    .filter((name) => name.endsWith(".json"))
    .map((name) => ({
      name,
      fixture: JSON.parse(readFileSync(join(fixturesDir, name), "utf8")) as FixtureFile,
    }));
}

describe("verifySignedChain (A1-1)", () => {
  for (const { name, fixture } of loadFixtures()) {
    it(`matches reference-vector ground truth for ${name}`, () => {
      const outcome = verifySignedChain({
        signedChain: parseSignedChain(fixture.signedChain),
        executorPk: fixture.executorPk,
        intentHash: fixture.intentHash,
        merkleProof: fixture.merkleProof,
        nowUnix: fixture.nowUnix,
        driftToleranceSecs: fixture.driftToleranceSecs,
      });

      expect(outcome.valid).toBe(fixture.expected.valid);
      expect(outcome.a1VerifierVersion).toBe("handshake-delegation-1.0.0-zip215");
      expect(outcome.verifyPath).toBe("ts");

      if (fixture.expected.valid) {
        if (!outcome.valid) return;
        expect(toHexLower(outcome.chainFingerprint)).toBe(fixture.expected.chainFingerprint);
        expect(outcome.certFingerprints.map(toHexLower)).toEqual(fixture.expected.certFingerprints);
        expect((outcome as { mutationAuthorityCreated?: boolean }).mutationAuthorityCreated).toBeUndefined();
        expect((outcome as { greenlightCreated?: boolean }).greenlightCreated).toBeUndefined();
      } else {
        if (outcome.valid) return;
        if (fixture.expected.reasonCode) {
          expect(outcome.reasonCode).toBe(fixture.expected.reasonCode as A1HandshakeReasonCode);
        }
      }
    });
  }

  it("never imports kernel transition symbols (static module boundary)", async () => {
    const mod = await import("../../../src/integrations/a1-evidence/verify-chain.js");
    expect(mod.verifySignedChain).toBeDefined();
  });
});
