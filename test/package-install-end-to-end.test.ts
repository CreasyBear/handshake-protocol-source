import { describe, expect, it } from "bun:test";
import { runPackageInstallGateway } from "../src/adapters/package-install/gateway";
import { proposePackageInstallActionContract } from "../src/runtime/package-install/tool-wrapper";
import { makeKernelFixture, registerFixtureObjects } from "./fixtures";
import {
  createPackageManifestSurface,
  packageInstallRuntimeConfig,
} from "./support/package-install-flow";

describe("package install end-to-end reference flow", () => {
  it("turns generated orchestration into one greenlit gateway-checked mutation chain", async () => {
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

    const gatewayResult = await runPackageInstallGateway({
      protocol: fixture.kernel,
      surface,
      actionContractId: proposed.actionContract.actionContractId,
      greenlightId: policy.greenlight.greenlightId,
      observedParameters: { package: "hono", versionRange: "^4.12.19" },
      surfaceOperationRef: "surface-op:e2e-package-install-hono",
    });

    expect(gatewayResult.outcome).toBe("mutation_reconciled");
    expect(gatewayResult.gatewayCheck.gateAttempt.gateDecision).toBe("passed");
    expect(gatewayResult.gatewayCheck.receipt.finalityStatus).toBe("pending");
    expect(gatewayResult.reconciliation?.finalityStatus).toBe("final");
    expect((await surface.readManifest()).dependencies).toEqual({ hono: "^4.12.19" });
    expect(surface.mutationCount).toBe(1);

    expect(fixture.store.countRecordsOfType("intent_compilation")).toBe(1);
    expect(fixture.store.countRecordsOfType("action_contract")).toBe(1);
    expect(fixture.store.countRecordsOfType("policy_decision")).toBe(1);
    expect(fixture.store.countRecordsOfType("greenlight")).toBe(1);
    expect(fixture.store.countRecordsOfType("gateway_check_attempt")).toBe(1);
    expect(fixture.store.countRecordsOfType("mutation_attempt")).toBe(1);
    expect(fixture.store.countRecordsOfType("surface_operation_reconciliation")).toBe(1);

    const events = fixture.store.listEventsForPartition(
      `stream_${proposed.actionContract.tenantId}_${proposed.actionContract.organizationId}`,
      `action:${proposed.actionContract.actionContractId}`,
    );
    expect(events.map((event) => event.eventType)).toEqual([
      "action_proposed",
      "policy_decision_recorded",
      "action_greenlit",
      "gateway_checked",
      "mutation_attempted",
      "protected_surface_operation_claimed",
      "receipt_emitted",
      "surface_operation_reconciled",
      "protected_surface_operation_released",
    ]);
    expect(events.map((event) => event.offset)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
    for (let index = 1; index < events.length; index += 1) {
      expect(events[index]?.previousEventDigest).toBe(events[index - 1]?.eventDigest);
    }
  });
});
