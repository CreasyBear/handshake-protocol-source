import { describe, expect, it } from "bun:test";
import {
  PackageInstallParametersSchema,
  runPackageInstallGateway,
  type PackageInstallGatewayInput,
  type PackageInstallMutationCommand,
  type PackageInstallMutationSurface,
} from "../../src/adapters/package-install/gateway";
import { proposePackageInstallActionContract } from "../../src/runtime/package-install/action-proposal";
import { makeKernelFixture, registerFixtureObjects } from "../support/fixtures";
import {
  createPackageManifestSurface,
  packageInstallObservedParameters,
  packageInstallRuntimeConfig,
} from "../support/package-install-flow";

describe("reference package install gateway adapter", () => {
  it("requires supply-chain metadata before package-install gateway admission", () => {
    expect(() =>
      PackageInstallParametersSchema.parse({
        package: "hono",
        versionRange: "^4.12.19",
      }),
    ).toThrow();
  });

  it("mutates an external manifest only after a passed gateway check and same-operation reconciliation", async () => {
    const fixture = await createGreenlitPackageInstallContract();
    const surface = await createPackageManifestSurface("handshake-package-gateway-");
    const commandsSeen: PackageInstallMutationCommand[] = [];
    const observingSurface: PackageInstallMutationSurface = {
      async applyPackageInstall(command) {
        commandsSeen.push(command);
        return surface.applyPackageInstall(command);
      },
    };

    const result = await runPackageInstallGateway({
      protocol: fixture.kernel,
      surface: observingSurface,
      actionContractId: fixture.contract.actionContractId,
      greenlightId: fixture.greenlight.greenlightId,
      observedParameters: packageInstallObservedParameters(),
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
    const command = commandsSeen[0];
    if (!command) throw new Error("expected package install mutation command");
    expect(command.parameters).toEqual(packageInstallObservedParameters());
    expect(command.lifecycleScriptPolicy).toBe("blocked");
    expect(command.lockfileRef).toBe("lockfile:bun.lock");
  });

  it("does not mutate the manifest when observed parameters do not match the contract", async () => {
    const fixture = await createGreenlitPackageInstallContract();
    const surface = await createPackageManifestSurface("handshake-package-gateway-");

    const result = await runPackageInstallGateway({
      protocol: fixture.kernel,
      surface,
      actionContractId: fixture.contract.actionContractId,
      greenlightId: fixture.greenlight.greenlightId,
      observedParameters: packageInstallObservedParameters({ versionRange: "^5.0.0" }),
    });

    expect(result.outcome).toBe("gateway_check_refused");
    expect(result.gatewayCheck.gateAttempt.gateDecision).toBe("refused");
    expect(result.gatewayCheck.gateAttempt.gateDecisionReasonCode).toBe("params_mismatch");
    expect(result.reconciliation).toBeNull();
    expect((await surface.readManifest()).dependencies).toEqual({});
    expect(surface.mutationCount).toBe(0);
    expect(fixture.store.countRecordsOfType("mutation_attempt")).toBe(0);
  });

  it("does not mutate when supply-chain observed parameters drift before the gate", async () => {
    const cases: Array<{
      name: string;
      observedParameters: PackageInstallGatewayInput["observedParameters"];
    }> = [
      {
        name: "lifecycle script policy",
        observedParameters: packageInstallObservedParameters({ lifecycleScriptPolicy: "allowed" }),
      },
      {
        name: "lockfile ref",
        observedParameters: packageInstallObservedParameters({ lockfileRef: null }),
      },
      {
        name: "resolved material digest",
        observedParameters: packageInstallObservedParameters({
          resolvedMaterialDigest: `sha256:${"a".repeat(64)}`,
          resolvedMaterialEvidenceRefs: ["evidence:registry-tarball-sha"],
        }),
      },
    ];

    for (const testCase of cases) {
      const fixture = await createGreenlitPackageInstallContract();
      const surface = await createPackageManifestSurface("handshake-package-gateway-drift-");

      const result = await runPackageInstallGateway({
        protocol: fixture.kernel,
        surface,
        actionContractId: fixture.contract.actionContractId,
        greenlightId: fixture.greenlight.greenlightId,
        observedParameters: testCase.observedParameters,
        surfaceOperationRef: `surface-op:package-install-drift-${testCase.name.replaceAll(" ", "-")}`,
      });

      expect(result.outcome).toBe("gateway_check_refused");
      expect(result.gatewayCheck.gateAttempt.gateDecisionReasonCode).toBe("params_mismatch");
      expect((await surface.readManifest()).dependencies).toEqual({});
      expect(surface.mutationCount).toBe(0);
    }
  });

  it("does not mutate the manifest when the gateway check records a proof gap", async () => {
    const fixture = await createGreenlitPackageInstallContract();
    const proofGapGate = await fixture.kernel.gatewayCheck({
      actionContractId: fixture.contract.actionContractId,
      greenlightId: fixture.greenlight.greenlightId,
      observedParameters: packageInstallObservedParameters(),
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
    const surface = await createPackageManifestSurface("handshake-package-gateway-");

    const result = await runPackageInstallGateway({
      protocol: {
        gatewayCheck: async () => nonAuthoritativeGate,
        reconcileSurfaceOperation: async () => {
          throw new Error("proof-gap gate must not reconcile through the adapter");
        },
      },
      surface,
      actionContractId: fixture.contract.actionContractId,
      greenlightId: fixture.greenlight.greenlightId,
      observedParameters: packageInstallObservedParameters(),
    });

    expect(result.outcome).toBe("gateway_check_not_authoritative");
    expect(result.gatewayCheck.gateAttempt.gateDecision).toBe("proof_gap");
    expect((await surface.readManifest()).dependencies).toEqual({});
    expect(surface.mutationCount).toBe(0);
  });

  it("does not mutate the manifest on a replayed greenlight", async () => {
    const fixture = await createGreenlitPackageInstallContract();
    const surface = await createPackageManifestSurface("handshake-package-gateway-");
    const input = {
      protocol: fixture.kernel,
      surface,
      actionContractId: fixture.contract.actionContractId,
      greenlightId: fixture.greenlight.greenlightId,
      observedParameters: packageInstallObservedParameters(),
      surfaceOperationRef: "surface-op:package-install-replay",
    };

    await runPackageInstallGateway(input);
    const replay = await runPackageInstallGateway(input);

    expect(replay.outcome).toBe("gateway_check_refused");
    expect(replay.gatewayCheck.gateAttempt.gateDecisionReasonCode).toBe("already_consumed");
    expect((await surface.readManifest()).dependencies).toEqual({ hono: "^4.12.19" });
    expect(surface.mutationCount).toBe(1);
  });

  it("records typed downstream failure evidence when the install surface throws", async () => {
    const fixture = await createGreenlitPackageInstallContract();
    let mutationCount = 0;
    const surface: PackageInstallMutationSurface = {
      async applyPackageInstall() {
        mutationCount += 1;
        throw Object.assign(new Error("registry unavailable"), {
          downstreamRetryability: "retryable",
          providerRequestRef: "provider-request:package-install:failed",
          providerOperationRef: "provider-operation:package-install:failed",
          traceRef: "trace:package-install:failed",
          spanRef: "span:package-install:failed",
          evidenceRefs: ["evidence:provider:package-install:failed"],
        });
      },
    };

    const result = await runPackageInstallGateway({
      protocol: fixture.kernel,
      surface,
      actionContractId: fixture.contract.actionContractId,
      greenlightId: fixture.greenlight.greenlightId,
      observedParameters: packageInstallObservedParameters(),
      surfaceOperationRef: "surface-op:package-install-failed",
    });

    expect(result.outcome).toBe("mutation_failed");
    expect(mutationCount).toBe(1);
    expect(result.reconciliation).toMatchObject({
      observedDownstreamStatus: "failed",
      downstreamRetryability: "retryable",
      providerRequestRef: "provider-request:package-install:failed",
      providerOperationRef: "provider-operation:package-install:failed",
      traceRef: "trace:package-install:failed",
      spanRef: "span:package-install:failed",
      diagnosticsRedactionPosture: "digest_only",
      evidenceRefs: [
        "evidence:package-install-failed:surface-op:package-install-failed",
        "evidence:provider:package-install:failed",
      ],
    });
    expect(result.reconciliation?.redactedDiagnosticsDigest).toMatch(/^sha256:/);
  });
});

async function createGreenlitPackageInstallContract() {
  const fixture = makeKernelFixture();
  await registerFixtureObjects(fixture);
  const proposed = await proposePackageInstallActionContract(fixture.kernel, packageInstallRuntimeConfig(fixture), {
    principalIntentRef: "intent:install hono",
    generatedCodeOrSpecRef: "code:package-install-gateway-test",
    package: "hono",
    versionRange: "^4.12.19",
  });
  if (proposed.outcome !== "action_contract_proposed") {
    throw new Error(`expected package install contract, got ${proposed.outcome}`);
  }
  const policy = await fixture.kernel.evaluatePolicy({
    actionContractId: proposed.actionContract.actionContractId,
    envelopeId: fixture.envelope.envelopeId,
    signingSecret: "test-secret",
  });
  if (!policy.greenlight) throw new Error("expected package install greenlight");
  return { ...fixture, contract: proposed.actionContract, greenlight: policy.greenlight };
}
