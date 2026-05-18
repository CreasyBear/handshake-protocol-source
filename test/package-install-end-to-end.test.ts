import { describe, expect, it } from "bun:test";
import { runPackageInstallReceiver } from "../src/adapters/package-install/receiver";
import { proposePackageInstallActionContract } from "../src/runtime/package-install/tool-wrapper";
import { makeKernelFixture, registerFixtureObjects } from "./fixtures";
import {
  createPackageManifestSurface,
  packageInstallRuntimeConfig,
} from "./support/package-install-flow";

describe("package install end-to-end reference flow", () => {
  it("turns generated orchestration into one greenlit receiver-gated mutation chain", async () => {
    const fixture = makeKernelFixture();
    await registerFixtureObjects(fixture);
    const surface = await createPackageManifestSurface("handshake-package-e2e-");

    const proposed = await proposePackageInstallActionContract(fixture.kernel, packageInstallRuntimeConfig(fixture), {
      principalIntentRef: "intent:install hono",
      generatedCodeOrSpecRef: "code:codemode-package-install-wrapper",
      package: "hono",
      versionRange: "^4.12.19",
    });

    expect(proposed.outcome).toBe("action_contract_proposed");
    expect((await surface.readManifest()).dependencies).toEqual({});
    expect(surface.mutationCount).toBe(0);
    if (proposed.outcome !== "action_contract_proposed") throw new Error("expected action contract proposal");

    const policy = await fixture.kernel.evaluatePolicy({
      actionContractId: proposed.actionContract.actionContractId,
      envelopeId: fixture.envelope.envelopeId,
      signingSecret: "test-secret",
    });

    expect(policy.decision.decision).toBe("greenlight");
    expect(policy.greenlight).not.toBeNull();
    if (!policy.greenlight) throw new Error("expected greenlight");

    const receiverResult = await runPackageInstallReceiver({
      protocol: fixture.kernel,
      surface,
      actionContractId: proposed.actionContract.actionContractId,
      greenlightId: policy.greenlight.greenlightId,
      observedParameters: { package: "hono", versionRange: "^4.12.19" },
      receiverOperationRef: "receiver-op:e2e-package-install-hono",
    });

    expect(receiverResult.outcome).toBe("mutation_reconciled");
    expect(receiverResult.receiverGate.gateAttempt.gateDecision).toBe("passed");
    expect(receiverResult.receiverGate.receipt.finalityStatus).toBe("pending");
    expect(receiverResult.reconciliation?.finalityStatus).toBe("final");
    expect((await surface.readManifest()).dependencies).toEqual({ hono: "^4.12.19" });
    expect(surface.mutationCount).toBe(1);

    expect(fixture.store.countRecordsOfType("intent_compilation")).toBe(1);
    expect(fixture.store.countRecordsOfType("action_contract")).toBe(1);
    expect(fixture.store.countRecordsOfType("policy_decision")).toBe(1);
    expect(fixture.store.countRecordsOfType("greenlight")).toBe(1);
    expect(fixture.store.countRecordsOfType("receiver_gate_attempt")).toBe(1);
    expect(fixture.store.countRecordsOfType("mutation_attempt")).toBe(1);
    expect(fixture.store.countRecordsOfType("receiver_operation_reconciliation")).toBe(1);

    const events = fixture.store.listEventsForPartition(
      `stream_${proposed.actionContract.tenantId}_${proposed.actionContract.organizationId}`,
      `action:${proposed.actionContract.actionContractId}`,
    );
    expect(events.map((event) => event.eventType)).toEqual([
      "action_proposed",
      "policy_decision_recorded",
      "action_greenlit",
      "receiver_gate_checked",
      "mutation_attempted",
      "receipt_emitted",
      "receiver_operation_reconciled",
    ]);
    expect(events.map((event) => event.offset)).toEqual([0, 1, 2, 3, 4, 5, 6]);
    for (let index = 1; index < events.length; index += 1) {
      expect(events[index]?.previousEventDigest).toBe(events[index - 1]?.eventDigest);
    }
  });
});
