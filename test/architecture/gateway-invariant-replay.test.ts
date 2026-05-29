import { describe, expect, it } from "bun:test";
import { createGreenlitContract } from "../support/fixtures";

// D3 promotion (05-14, D-65): architecture-level pin of AGENTS invariant
// "a greenlight authorizes only one exact gateway-checked mutation attempt"
// (Phase-05 invariant 2). Structural site:
//   src/protocol/areas/gateway-gate/replay-refusal/index.ts (commitReplayRefusal)
//   src/protocol/areas/idempotency-ledger/entries.ts (single-use greenlight binding)
//   src/storage/*/index.ts (commitGatewayCheck consumption guard)
//
// Promoted from the adapter-level replay assertions in
// test/adapters/x402-wallet-gateway.test.ts ("refuses a consumed x402
// greenlight replay before signing or mutation") to a category-level
// architecture guard that drives the generic greenlit-contract spine — so the
// single-use invariant is pinned independent of any one adapter.
describe("gateway invariant: one greenlight = one mutation attempt (D3 promotion)", () => {
  it("refuses a consumed greenlight on replay before any second mutation", async () => {
    const fixture = await createGreenlitContract();
    const observedParameters = { package: "hono", versionRange: "^4.12.19" };

    const first = await fixture.kernel.gatewayCheck({
      actionContractId: fixture.contract.actionContractId,
      greenlightId: fixture.greenlight.greenlightId,
      observedParameters,
      surfaceOperationRef: "surface-op:replay-promotion:first",
    });

    expect(first.gateAttempt.gateDecision).toBe("passed");
    if (!first.mutationAttempt) throw new Error("expected first gateway check to mint a mutation attempt");

    const replay = await fixture.kernel.gatewayCheck({
      actionContractId: fixture.contract.actionContractId,
      greenlightId: fixture.greenlight.greenlightId,
      observedParameters,
      surfaceOperationRef: "surface-op:replay-promotion:replay",
    });

    expect(replay.gateAttempt.gateDecision).toBe("refused");
    expect(replay.gateAttempt.gateDecisionReasonCode).toBe("already_consumed");
    expect(replay.receipt.greenlightConsumptionStatus).toBe("replayed");
    expect(replay.mutationAttempt).toBeNull();

    // Exactly one mutation attempt was ever created across both gateway checks.
    expect(fixture.store.countRecordsOfType("mutation_attempt")).toBe(1);
  });
});
