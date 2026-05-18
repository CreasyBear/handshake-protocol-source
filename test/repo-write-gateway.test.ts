import { describe, expect, it } from "bun:test";
import { runRepoWriteGateway } from "../src/adapters/repo-write/gateway";
import { createGreenlitContract } from "./fixtures";
import { createRepoWriteSurface } from "./support/repo-write-flow";

describe("reference repo write gateway adapter", () => {
  it("does not mutate repository files when the gateway check records a proof gap", async () => {
    const fixture = await createGreenlitContract();
    const proofGapGate = await fixture.kernel.gatewayCheck({
      actionContractId: fixture.contract.actionContractId,
      greenlightId: fixture.greenlight.greenlightId,
      observedParameters: { package: "hono", versionRange: "^4.12.19" },
    });
    const nonAuthoritativeGate = {
      ...proofGapGate,
      gateAttempt: {
        ...proofGapGate.gateAttempt,
        gateDecision: "proof_gap" as const,
        gateDecisionReasonCode: "gateway_receipt_unavailable",
        consumedGreenlight: false,
        mutationAttemptId: null,
      },
      mutationAttempt: null,
    };
    const surface = await createRepoWriteSurface("handshake-repo-write-proof-gap-");

    const result = await runRepoWriteGateway({
      protocol: {
        gatewayCheck: async () => nonAuthoritativeGate,
        reconcileSurfaceOperation: async () => {
          throw new Error("proof-gap gate must not reconcile through the adapter");
        },
      },
      surface,
      actionContractId: fixture.contract.actionContractId,
      greenlightId: fixture.greenlight.greenlightId,
      repositoryRef: "github:demo/repo",
      filePath: "src/generated.ts",
      content: "export const generatedValue = 42;\n",
    });

    expect(result.outcome).toBe("gateway_check_not_authoritative");
    expect(result.gatewayCheck.gateAttempt.gateDecision).toBe("proof_gap");
    expect(await surface.readFile("src/generated.ts")).toBeNull();
    expect(surface.mutationCount).toBe(0);
  });
});
