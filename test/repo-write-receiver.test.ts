import { describe, expect, it } from "bun:test";
import { runRepoWriteReceiver } from "../src/adapters/repo-write/receiver";
import { createGreenlitContract } from "./fixtures";
import { createRepoWriteSurface } from "./support/repo-write-flow";

describe("reference repo write receiver adapter", () => {
  it("does not mutate repository files when the receiver gate records a proof gap", async () => {
    const fixture = await createGreenlitContract();
    const proofGapGate = await fixture.kernel.receiverGate({
      actionContractId: fixture.contract.actionContractId,
      greenlightId: fixture.greenlight.greenlightId,
      observedParameters: { package: "hono", versionRange: "^4.12.19" },
      downstreamMode: "unknown",
    });
    const surface = await createRepoWriteSurface("handshake-repo-write-proof-gap-");

    const result = await runRepoWriteReceiver({
      protocol: {
        receiverGate: async () => proofGapGate,
        reconcileReceiverOperation: async () => {
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

    expect(result.outcome).toBe("receiver_gate_not_authoritative");
    expect(result.receiverGate.gateAttempt.gateDecision).toBe("proof_gap");
    expect(await surface.readFile("src/generated.ts")).toBeNull();
    expect(surface.mutationCount).toBe(0);
  });
});
