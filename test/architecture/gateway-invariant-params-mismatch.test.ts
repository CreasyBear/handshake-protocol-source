import { describe, expect, it } from "bun:test";
import { createGreenlitContract } from "../support/fixtures";

// D3 promotion (05-14, D-65): architecture-level pin of AGENTS invariant
// "the gateway check is the enforcement point before consequence" /
// "an action contract is a proposed commitment, not execution authority"
// (Phase-05 invariants 1 & 3). Structural site:
//   src/protocol/areas/gateway-gate/gateway-policy.ts + transitions.ts
//   — the gate recomputes the observed params digest and refuses with
//     `params_mismatch` before any mutation attempt is created.
//
// Promoted from the adapter-level digest-drift assertion in
// test/adapters/x402-wallet-gateway.test.ts ("refuses changed observed
// parameters before signing") to a category-level architecture guard driving
// the generic greenlit-contract spine.
describe("gateway invariant: params drift refused before mutation (D3 promotion)", () => {
  it("refuses observed parameters that drift from the contract digest", async () => {
    const fixture = await createGreenlitContract();

    const result = await fixture.kernel.gatewayCheck({
      actionContractId: fixture.contract.actionContractId,
      greenlightId: fixture.greenlight.greenlightId,
      // Contract was greenlit for `{ package: "hono", ... }`; drift the package.
      observedParameters: { package: "left-pad", versionRange: "^4.12.19" },
      surfaceOperationRef: "surface-op:params-mismatch-promotion",
    });

    expect(result.gateAttempt.gateDecision).toBe("refused");
    expect(result.gateAttempt.gateDecisionReasonCode).toBe("params_mismatch");
    expect(result.mutationAttempt).toBeNull();
    expect(result.receipt.downstreamExecutionStatus).toBe("not_started");
    expect(fixture.store.countRecordsOfType("mutation_attempt")).toBe(0);
  });
});
