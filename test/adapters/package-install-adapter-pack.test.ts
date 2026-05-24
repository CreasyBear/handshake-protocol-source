import { describe, expect, it } from "bun:test";
import {
  packageInstallMaterialAdapterPack,
  projectPackageInstallAdapterEvidenceReport,
  projectPackageInstallMaterialEvidence,
} from "../../src/adapters/package-install/adapter-pack";
import { runPackageInstallGateway } from "../../src/adapters/package-install/gateway";
import { requiredGatewayCheckedBypassProbeKinds } from "../../src/protocol/areas/bypass-probe";
import { proposePackageInstallActionContract } from "../../src/runtime/package-install/action-proposal";
import { makeKernelFixture, registerFixtureObjects } from "../support/fixtures";
import {
  createPackageManifestSurface,
  packageInstallObservedParameters,
  packageInstallRuntimeConfig,
} from "../support/package-install-flow";

describe("package-install adapter pack", () => {
  it("freezes the package-install material adapter pack as an activation boundary", async () => {
    const conformance = await import("../../src/conformance");

    expect(conformance.packageInstallMaterialAdapterPack).toBe(packageInstallMaterialAdapterPack);
    expect(packageInstallMaterialAdapterPack).toMatchObject({
      adapterPackId: "adapter_pack_package_install_material",
      actionFamily: "package.install",
      protectedSurfaceKind: "package_manager",
      parameterSchemaRef: "schema:package-install-parameters:v1",
      gatewayObservedParameterValidatorRef: "validator:package-install-observed-parameters:v1",
      receiptEvidenceMapperRef: "receipt-mapper:package-install-material:v1",
    });
    expect(packageInstallMaterialAdapterPack.bypassProbeKinds).toEqual(requiredGatewayCheckedBypassProbeKinds);
    expect(packageInstallMaterialAdapterPack.hostileFixtureRefs).toEqual([
      "fixture:package-install:provenance-laundering",
      "fixture:package-install:lockfile-drift",
      "fixture:package-install:lifecycle-script-execution",
      "fixture:package-install:registry-substitution",
      "fixture:package-install:tarball-mismatch",
      "fixture:package-install:raw-sibling-bypass",
      "fixture:package-install:stale-policy",
      "fixture:package-install:credential-custody-ambiguity",
    ]);
  });

  it("maps material evidence into proof gaps without claiming package safety", () => {
    const evidence = projectPackageInstallMaterialEvidence(packageInstallObservedParameters());

    expect(evidence).toMatchObject({
      evidenceKind: "package_install_material_evidence",
      manifestActivationBoundary: true,
      lifecycleScriptExecutionPosture: "blocked_by_default",
      npmProvenanceStatus: "unavailable",
      npmSignatureStatus: "unavailable",
      registryIntegrityStatus: "proof_gap",
      bunLockfileEvidenceRole: "local_reconstruction_only",
      packageSafetyProven: false,
      provenanceProvesBenignCode: false,
      bunProvenanceVerified: false,
    });
    expect(evidence.proofGapReasonCodes).toEqual([
      "npm_provenance_not_verified",
      "npm_signature_not_verified",
      "registry_integrity_not_verified",
    ]);

    const lifecycleEvidence = projectPackageInstallMaterialEvidence(
      packageInstallObservedParameters({ lifecycleScriptPolicy: "allowed" }),
    );
    expect(lifecycleEvidence.lifecycleScriptExecutionPosture).toBe("separate_contract_required");
    expect(lifecycleEvidence.proofGapReasonCodes).toContain("package_lifecycle_scripts_require_separate_contract");
  });

  it("projects a buyer-readable report bound to exact contract and receipt evidence", async () => {
    const fixture = makeKernelFixture();
    await registerFixtureObjects(fixture);
    const proposal = await proposePackageInstallActionContract(fixture.kernel, packageInstallRuntimeConfig(fixture), {
      principalIntentRef: "intent:install hono",
      generatedCodeOrSpecRef: "code:package-install-adapter-pack-report",
      package: "hono",
      versionRange: "^4.12.19",
    });
    if (proposal.outcome !== "action_contract_proposed") throw new Error("expected package install contract");
    const policy = await fixture.kernel.evaluatePolicy({
      actionContractId: proposal.actionContract.actionContractId,
      envelopeId: fixture.envelope.envelopeId,
      signingSecret: "test-secret",
    });
    if (!policy.greenlight) throw new Error("expected package install greenlight");

    const surface = await createPackageManifestSurface("handshake-package-adapter-pack-");
    const result = await runPackageInstallGateway({
      protocol: fixture.kernel,
      surface,
      actionContractId: proposal.actionContract.actionContractId,
      greenlightId: policy.greenlight.greenlightId,
      observedParameters: packageInstallObservedParameters(),
      surfaceOperationRef: "surface-op:package-install-adapter-pack-report",
    });
    if (result.outcome !== "mutation_reconciled") throw new Error(`unexpected outcome ${result.outcome}`);

    const materialEvidence = projectPackageInstallMaterialEvidence(packageInstallObservedParameters());
    const report = projectPackageInstallAdapterEvidenceReport({
      contract: proposal.actionContract,
      gateAttempt: result.gatewayCheck.gateAttempt,
      receipt: result.gatewayCheck.receipt,
      reconciliation: result.reconciliation,
      materialEvidence,
    });

    expect(report).toMatchObject({
      reportKind: "package_install_adapter_evidence_report",
      action: {
        actionContractId: proposal.actionContract.actionContractId,
        actionClass: "package.install",
        packageName: "hono",
        versionRange: "^4.12.19",
      },
      authority: {
        greenlightId: policy.greenlight.greenlightId,
        gatewayDecision: "passed",
        verifiedGatewayCheckRequired: true,
        runtimeIngressAuthority: false,
        cliAuthority: false,
        mcpAuthority: false,
        reportAuthority: false,
      },
      exactContract: {
        contractDigest: proposal.actionContract.actionContractDigest,
        paramsDigest: proposal.actionContract.paramsDigest,
        idempotencyKey: proposal.actionContract.idempotencyKey,
      },
      outcome: {
        receiptId: result.gatewayCheck.receipt.receiptId,
        finalityStatus: "pending",
        downstreamExecutionStatus: "pending",
        reconciliationStatus: "resolved",
      },
      bypassPosture: {
        requiredProbeKinds: requiredGatewayCheckedBypassProbeKinds,
        hostileFixtureRefs: packageInstallMaterialAdapterPack.hostileFixtureRefs,
      },
    });
    expect(report.proofGaps).toEqual(materialEvidence.proofGapReasonCodes);
    expect(report.nonClaims).toEqual([
      "not_package_safety_proof",
      "not_npm_audit_replacement",
      "not_bun_provenance_verification",
      "not_hosted_operation",
      "not_runtime_cli_or_mcp_enforcement",
    ]);
    expect(report.reconstruction.streamEventIds.length).toBeGreaterThan(0);
    expect(report.reconstruction.materialEvidenceRefs).toContain("manifest:package.json");
  });
});
