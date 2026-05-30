import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { verifySignedChain } from "../../../src/integrations/a1-evidence/verify-chain.js";
import type { SignedChainWire } from "../../../src/integrations/a1-evidence/wire-types.js";

type ChainFixture = {
  signedChain: SignedChainWire;
  executorPk: string;
  intentHash: string;
  merkleProof: { siblings: { hash: string; isLeft: boolean }[] };
  nowUnix: number;
  driftToleranceSecs: number;
};

function loadFixture(name: string): ChainFixture {
  return JSON.parse(readFileSync(join(process.cwd(), "test/fixtures/a1-evidence", name), "utf8")) as ChainFixture;
}

describe("a1-evidence parent-swap resistance", () => {
  it("rejects a cert borrowed from a different chain (linkage / identity mismatch)", () => {
    const oneHop = loadFixture("valid-1hop.json");
    const twoHop = loadFixture("valid-2hop.json");

    expect(twoHop.signedChain.certs.length).toBeGreaterThanOrEqual(2);

    // Keep the legitimate first hop of chain B (delegator = principal), then
    // graft chain A's leaf cert in the second slot. Its delegator_pk no longer
    // matches the upstream delegate_pk, so an append-only verifier that trusts
    // each block signature in isolation would accept it. Handshake re-verifies
    // upstream linkage, so this must be refused.
    const swapped: SignedChainWire = {
      ...twoHop.signedChain,
      certs: [twoHop.signedChain.certs[0]!, oneHop.signedChain.certs[0]!],
    };

    const outcome = verifySignedChain({
      signedChain: swapped,
      executorPk: twoHop.executorPk,
      intentHash: twoHop.intentHash,
      merkleProof: twoHop.merkleProof,
      nowUnix: twoHop.nowUnix,
      driftToleranceSecs: twoHop.driftToleranceSecs,
    });

    expect(outcome.valid).toBe(false);
    if (!outcome.valid) {
      expect(outcome.reasonCode).toBe("delegation_evidence_invalid:identity_mismatch");
    }
  });
});
