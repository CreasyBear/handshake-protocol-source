import { describe, expect, it } from "bun:test";
import { runPackageInstallGateway } from "../src/adapters/package-install/gateway";
import { createGreenlitContract } from "./fixtures";
import { createPackageManifestSurface } from "./support/package-install-flow";

describe("reference package install gateway adapter", () => {
  it("mutates an external manifest only after a passed gateway check and same-operation reconciliation", async () => {
    const fixture = await createGreenlitContract();
    const surface = await createPackageManifestSurface("handshake-package-gateway-");

    const result = await runPackageInstallGateway({
      protocol: fixture.kernel,
      surface,
      actionContractId: fixture.contract.actionContractId,
      greenlightId: fixture.greenlight.greenlightId,
      observedParameters: { package: "hono", versionRange: "^4.12.19" },
      surfaceOperationRef: "surface-op:package-install-hono",
    });

    expect(result.outcome).toBe("mutation_reconciled");
    expect(result.gatewayCheck.gateAttempt.gateDecision).toBe("passed");
    expect(result.gatewayCheck.mutationAttempt?.outcome).toBe("submitted");
    expect(result.reconciliation?.finalityStatus).toBe("final");
    expect(result.mutationEvidence?.evidenceRef).toContain("evidence:package-manifest");
    expect((await surface.readManifest()).dependencies).toEqual({ hono: "^4.12.19" });
    expect(surface.mutationCount).toBe(1);
    expect(fixture.store.countRecordsOfType("mutation_attempt")).toBe(1);
    expect(fixture.store.countRecordsOfType("surface_operation_reconciliation")).toBe(1);
  });

  it("does not mutate the manifest when observed parameters do not match the contract", async () => {
    const fixture = await createGreenlitContract();
    const surface = await createPackageManifestSurface("handshake-package-gateway-");

    const result = await runPackageInstallGateway({
      protocol: fixture.kernel,
      surface,
      actionContractId: fixture.contract.actionContractId,
      greenlightId: fixture.greenlight.greenlightId,
      observedParameters: { package: "hono", versionRange: "^5.0.0" },
    });

    expect(result.outcome).toBe("gateway_check_refused");
    expect(result.gatewayCheck.gateAttempt.gateDecision).toBe("refused");
    expect(result.gatewayCheck.gateAttempt.gateDecisionReasonCode).toBe("params_mismatch");
    expect(result.reconciliation).toBeNull();
    expect((await surface.readManifest()).dependencies).toEqual({});
    expect(surface.mutationCount).toBe(0);
    expect(fixture.store.countRecordsOfType("mutation_attempt")).toBe(0);
  });

  it("does not mutate the manifest when the gateway check records a proof gap", async () => {
    const fixture = await createGreenlitContract();
    const proofGapGate = await fixture.kernel.gatewayCheck({
      actionContractId: fixture.contract.actionContractId,
      greenlightId: fixture.greenlight.greenlightId,
      observedParameters: { package: "hono", versionRange: "^4.12.19" },
      downstreamMode: "unknown",
    });
    const surface = await createPackageManifestSurface("handshake-package-gateway-");

    const result = await runPackageInstallGateway({
      protocol: {
        gatewayCheck: async () => proofGapGate,
        reconcileSurfaceOperation: async () => {
          throw new Error("proof-gap gate must not reconcile through the adapter");
        },
      },
      surface,
      actionContractId: fixture.contract.actionContractId,
      greenlightId: fixture.greenlight.greenlightId,
      observedParameters: { package: "hono", versionRange: "^4.12.19" },
    });

    expect(result.outcome).toBe("gateway_check_not_authoritative");
    expect(result.gatewayCheck.gateAttempt.gateDecision).toBe("proof_gap");
    expect((await surface.readManifest()).dependencies).toEqual({});
    expect(surface.mutationCount).toBe(0);
  });

  it("does not mutate the manifest on a replayed greenlight", async () => {
    const fixture = await createGreenlitContract();
    const surface = await createPackageManifestSurface("handshake-package-gateway-");
    const input = {
      protocol: fixture.kernel,
      surface,
      actionContractId: fixture.contract.actionContractId,
      greenlightId: fixture.greenlight.greenlightId,
      observedParameters: { package: "hono" as const, versionRange: "^4.12.19" },
      surfaceOperationRef: "surface-op:package-install-replay",
    };

    await runPackageInstallGateway(input);
    const replay = await runPackageInstallGateway(input);

    expect(replay.outcome).toBe("gateway_check_refused");
    expect(replay.gatewayCheck.gateAttempt.gateDecisionReasonCode).toBe("already_consumed");
    expect((await surface.readManifest()).dependencies).toEqual({ hono: "^4.12.19" });
    expect(surface.mutationCount).toBe(1);
  });
});
