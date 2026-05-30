/**
 * Handshake-domain conformance vectors (CI). Regenerate:
 * `bun scripts/a1-evidence/generate-vectors.ts`
 *
 * Archived A1-domain vectors (not CI): `test/fixtures/a1-evidence/archive/`.
 */
import { describe, expect, it } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { A1HandshakeReasonCode } from "../../../src/integrations/a1-evidence/reason-codes.js";
import { verifySignedChain } from "../../../src/integrations/a1-evidence/verify-chain.js";
import { toHexLower } from "../../../src/integrations/a1-evidence/hex.js";
import { parseSignedChain } from "../../../src/integrations/a1-evidence/wire-types.js";

const fixturesDir = join(process.cwd(), "test/fixtures/a1-evidence");

type VectorFixture = {
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
    _proofGap?: string;
  };
};

describe("a1-evidence conformance vectors", () => {
  const files = readdirSync(fixturesDir).filter((f) => f.endsWith(".json"));

  it("has at least four committed vector files", () => {
    expect(files.length).toBeGreaterThanOrEqual(4);
  });

  for (const file of files) {
    it(file, () => {
      const fixture = JSON.parse(readFileSync(join(fixturesDir, file), "utf8")) as VectorFixture;
      if (fixture.expected._proofGap) {
        throw new Error(`proof gap blocks vector: ${fixture.expected._proofGap}`);
      }

      const outcome = verifySignedChain({
        signedChain: parseSignedChain(fixture.signedChain),
        executorPk: fixture.executorPk,
        intentHash: fixture.intentHash,
        merkleProof: fixture.merkleProof,
        nowUnix: fixture.nowUnix,
        driftToleranceSecs: fixture.driftToleranceSecs,
      });

      expect(outcome.valid).toBe(fixture.expected.valid);
      if (fixture.expected.valid && outcome.valid) {
        expect(toHexLower(outcome.chainFingerprint)).toBe(fixture.expected.chainFingerprint);
        expect(outcome.certFingerprints.map(toHexLower)).toEqual(fixture.expected.certFingerprints);
      } else if (!fixture.expected.valid && !outcome.valid && fixture.expected.reasonCode) {
        expect(outcome.reasonCode).toBe(fixture.expected.reasonCode as A1HandshakeReasonCode);
      }
    });
  }
});
