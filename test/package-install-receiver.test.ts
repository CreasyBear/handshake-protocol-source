import { describe, expect, it } from "bun:test";
import { runPackageInstallReceiver } from "../src/adapters/package-install/receiver";
import { createGreenlitContract } from "./fixtures";
import { createPackageManifestSurface } from "./support/package-install-flow";

describe("reference package install receiver adapter", () => {
  it("mutates an external manifest only after a passed receiver gate and same-operation reconciliation", async () => {
    const fixture = await createGreenlitContract();
    const surface = await createPackageManifestSurface("handshake-package-receiver-");

    const result = await runPackageInstallReceiver({
      protocol: fixture.kernel,
      surface,
      actionContractId: fixture.contract.actionContractId,
      greenlightId: fixture.greenlight.greenlightId,
      observedParameters: { package: "hono", versionRange: "^4.12.19" },
      receiverOperationRef: "receiver-op:package-install-hono",
    });

    expect(result.outcome).toBe("mutation_reconciled");
    expect(result.receiverGate.gateAttempt.gateDecision).toBe("passed");
    expect(result.receiverGate.mutationAttempt?.outcome).toBe("submitted");
    expect(result.reconciliation?.finalityStatus).toBe("final");
    expect(result.mutationEvidence?.evidenceRef).toContain("evidence:package-manifest");
    expect((await surface.readManifest()).dependencies).toEqual({ hono: "^4.12.19" });
    expect(surface.mutationCount).toBe(1);
    expect(fixture.store.countRecordsOfType("mutation_attempt")).toBe(1);
    expect(fixture.store.countRecordsOfType("receiver_operation_reconciliation")).toBe(1);
  });

  it("does not mutate the manifest when observed parameters do not match the contract", async () => {
    const fixture = await createGreenlitContract();
    const surface = await createPackageManifestSurface("handshake-package-receiver-");

    const result = await runPackageInstallReceiver({
      protocol: fixture.kernel,
      surface,
      actionContractId: fixture.contract.actionContractId,
      greenlightId: fixture.greenlight.greenlightId,
      observedParameters: { package: "hono", versionRange: "^5.0.0" },
    });

    expect(result.outcome).toBe("receiver_gate_refused");
    expect(result.receiverGate.gateAttempt.gateDecision).toBe("refused");
    expect(result.receiverGate.gateAttempt.gateDecisionReasonCode).toBe("params_mismatch");
    expect(result.reconciliation).toBeNull();
    expect((await surface.readManifest()).dependencies).toEqual({});
    expect(surface.mutationCount).toBe(0);
    expect(fixture.store.countRecordsOfType("mutation_attempt")).toBe(0);
  });

  it("does not mutate the manifest when the receiver gate records a proof gap", async () => {
    const fixture = await createGreenlitContract();
    const proofGapGate = await fixture.kernel.receiverGate({
      actionContractId: fixture.contract.actionContractId,
      greenlightId: fixture.greenlight.greenlightId,
      observedParameters: { package: "hono", versionRange: "^4.12.19" },
      downstreamMode: "unknown",
    });
    const surface = await createPackageManifestSurface("handshake-package-receiver-");

    const result = await runPackageInstallReceiver({
      protocol: {
        receiverGate: async () => proofGapGate,
        reconcileReceiverOperation: async () => {
          throw new Error("proof-gap gate must not reconcile through the adapter");
        },
      },
      surface,
      actionContractId: fixture.contract.actionContractId,
      greenlightId: fixture.greenlight.greenlightId,
      observedParameters: { package: "hono", versionRange: "^4.12.19" },
    });

    expect(result.outcome).toBe("receiver_gate_not_authoritative");
    expect(result.receiverGate.gateAttempt.gateDecision).toBe("proof_gap");
    expect((await surface.readManifest()).dependencies).toEqual({});
    expect(surface.mutationCount).toBe(0);
  });

  it("does not mutate the manifest on a replayed greenlight", async () => {
    const fixture = await createGreenlitContract();
    const surface = await createPackageManifestSurface("handshake-package-receiver-");
    const input = {
      protocol: fixture.kernel,
      surface,
      actionContractId: fixture.contract.actionContractId,
      greenlightId: fixture.greenlight.greenlightId,
      observedParameters: { package: "hono" as const, versionRange: "^4.12.19" },
      receiverOperationRef: "receiver-op:package-install-replay",
    };

    await runPackageInstallReceiver(input);
    const replay = await runPackageInstallReceiver(input);

    expect(replay.outcome).toBe("receiver_gate_refused");
    expect(replay.receiverGate.gateAttempt.gateDecisionReasonCode).toBe("already_consumed");
    expect((await surface.readManifest()).dependencies).toEqual({ hono: "^4.12.19" });
    expect(surface.mutationCount).toBe(1);
  });
});
