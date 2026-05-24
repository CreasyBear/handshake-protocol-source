import { z } from "zod";
import {
  BypassProbeKindSchema,
  requiredGatewayCheckedBypassProbeKinds,
  type BypassProbeKind,
} from "../../protocol/areas/bypass-probe";
import { ProtectedActionAdapterPackSchema } from "../../install/protected-action-adapter-pack";
import {
  type ActionContract,
  type GatewayCheckAttempt,
  type Receipt,
  ReceiptSchema,
  type SurfaceOperationReconciliation,
  SurfaceOperationReconciliationSchema,
} from "../../protocol/public/schemas";
import { DigestSchema, IdSchema } from "../../protocol/foundation/schema-core";
import { PackageInstallParametersSchema, type PackageInstallParameters } from "./gateway";

export const packageInstallMaterialAdapterPack = ProtectedActionAdapterPackSchema.parse({
  adapterPackId: "adapter_pack_package_install_material",
  adapterPackVersion: "v1",
  actionFamily: "package.install",
  protectedSurfaceKind: "package_manager",
  parameterSchemaRef: "schema:package-install-parameters:v1",
  endpointEvidenceSchemaRef: "schema:package-install-material-evidence:v1",
  installCompilerRef: "compiler:package-install-material-proposal:v1",
  policyRulePackRef: "policy:package-install-material:v1",
  gatewayObservedParameterValidatorRef: "validator:package-install-observed-parameters:v1",
  receiptEvidenceMapperRef: "receipt-mapper:package-install-material:v1",
  bypassProbeKinds: requiredGatewayCheckedBypassProbeKinds satisfies BypassProbeKind[],
  hostileFixtureRefs: [
    "fixture:package-install:provenance-laundering",
    "fixture:package-install:lockfile-drift",
    "fixture:package-install:lifecycle-script-execution",
    "fixture:package-install:registry-substitution",
    "fixture:package-install:tarball-mismatch",
    "fixture:package-install:raw-sibling-bypass",
    "fixture:package-install:stale-policy",
    "fixture:package-install:credential-custody-ambiguity",
  ],
});

export const PackageInstallMaterialEvidenceStatusSchema = z.enum([
  "verified",
  "unavailable",
  "unverified",
  "not_requested",
  "proof_gap",
]);
export type PackageInstallMaterialEvidenceStatus = z.infer<typeof PackageInstallMaterialEvidenceStatusSchema>;

export const PackageInstallMaterialEvidenceSchema = z.strictObject({
  evidenceKind: z.literal("package_install_material_evidence"),
  adapterPackId: z.literal("adapter_pack_package_install_material"),
  packageName: z.string().min(1),
  versionRange: z.string().min(1),
  packageManager: z.string().min(1),
  registryRef: z.string().min(1),
  workspaceRef: z.string().min(1).nullable(),
  manifestRef: z.string().min(1).nullable(),
  lockfileRef: z.string().min(1).nullable(),
  manifestActivationBoundary: z.literal(true),
  lifecycleScriptPolicy: z.enum(["blocked", "allowed", "unknown"]),
  lifecycleScriptExecutionPosture: z.enum(["blocked_by_default", "separate_contract_required", "proof_gap"]),
  npmProvenanceStatus: PackageInstallMaterialEvidenceStatusSchema,
  npmSignatureStatus: PackageInstallMaterialEvidenceStatusSchema,
  registryIntegrityStatus: PackageInstallMaterialEvidenceStatusSchema,
  tarballIntegrityDigest: DigestSchema.nullable(),
  bunLockfileEvidenceRole: z.literal("local_reconstruction_only"),
  resolvedMaterialDigest: DigestSchema.nullable(),
  resolvedMaterialEvidenceRefs: z.array(z.string().min(1)),
  evidenceRefs: z.array(z.string().min(1)),
  proofGapReasonCodes: z.array(z.string().min(1)),
  packageSafetyProven: z.literal(false),
  provenanceProvesBenignCode: z.literal(false),
  bunProvenanceVerified: z.literal(false),
});
export type PackageInstallMaterialEvidence = z.infer<typeof PackageInstallMaterialEvidenceSchema>;

export const PackageInstallAdapterEvidenceReportSchema = z.strictObject({
  reportKind: z.literal("package_install_adapter_evidence_report"),
  adapterPackId: z.literal("adapter_pack_package_install_material"),
  adapterPackVersion: z.literal("v1"),
  action: z.strictObject({
    actionContractId: IdSchema,
    actionClass: z.literal("package.install"),
    resourceRef: z.string().min(1),
    packageName: z.string().min(1),
    versionRange: z.string().min(1),
  }),
  authority: z.strictObject({
    greenlightId: IdSchema,
    gatewayId: IdSchema,
    gateAttemptId: IdSchema,
    gatewayDecision: z.string().min(1),
    verifiedGatewayCheckRequired: z.literal(true),
    runtimeIngressAuthority: z.literal(false),
    cliAuthority: z.literal(false),
    mcpAuthority: z.literal(false),
    reportAuthority: z.literal(false),
  }),
  exactContract: z.strictObject({
    contractDigest: DigestSchema,
    paramsDigest: DigestSchema,
    idempotencyKey: z.string().min(1),
  }),
  evidence: PackageInstallMaterialEvidenceSchema,
  outcome: z.strictObject({
    receiptId: IdSchema,
    receiptDigest: DigestSchema,
    finalityStatus: ReceiptSchema.shape.finalityStatus,
    downstreamExecutionStatus: z.string().min(1),
    reconciliationStatus: z.string().min(1).nullable(),
  }),
  proofGaps: z.array(z.string().min(1)),
  bypassPosture: z.strictObject({
    requiredProbeKinds: z.array(BypassProbeKindSchema),
    hostileFixtureRefs: z.array(z.string().min(1)),
  }),
  reconstruction: z.strictObject({
    auditChainDigest: DigestSchema,
    streamEventIds: z.array(IdSchema),
    materialEvidenceRefs: z.array(z.string().min(1)),
  }),
  nonClaims: z.array(z.string().min(1)),
});
export type PackageInstallAdapterEvidenceReport = z.infer<typeof PackageInstallAdapterEvidenceReportSchema>;

export function projectPackageInstallMaterialEvidence(
  inputValue: PackageInstallParameters,
  overrides: Partial<
    Pick<
      PackageInstallMaterialEvidence,
      "npmProvenanceStatus" | "npmSignatureStatus" | "registryIntegrityStatus" | "tarballIntegrityDigest"
    >
  > = {},
): PackageInstallMaterialEvidence {
  const input = PackageInstallParametersSchema.parse(inputValue);
  const npmProvenanceStatus = overrides.npmProvenanceStatus ?? "unavailable";
  const npmSignatureStatus = overrides.npmSignatureStatus ?? "unavailable";
  const registryIntegrityStatus = overrides.registryIntegrityStatus ?? materialIntegrityStatus(input);
  const lifecycleScriptExecutionPosture = lifecyclePostureFor(input.lifecycleScriptPolicy);
  const proofGapReasonCodes = packageInstallMaterialProofGapReasonCodes({
    input,
    npmProvenanceStatus,
    npmSignatureStatus,
    registryIntegrityStatus,
  });
  return PackageInstallMaterialEvidenceSchema.parse({
    evidenceKind: "package_install_material_evidence",
    adapterPackId: packageInstallMaterialAdapterPack.adapterPackId,
    packageName: input.package,
    versionRange: input.versionRange,
    packageManager: input.packageManager,
    registryRef: input.registryRef,
    workspaceRef: input.workspaceRef,
    manifestRef: input.manifestRef,
    lockfileRef: input.lockfileRef,
    manifestActivationBoundary: true,
    lifecycleScriptPolicy: input.lifecycleScriptPolicy,
    lifecycleScriptExecutionPosture,
    npmProvenanceStatus,
    npmSignatureStatus,
    registryIntegrityStatus,
    tarballIntegrityDigest: overrides.tarballIntegrityDigest ?? input.resolvedMaterialDigest,
    bunLockfileEvidenceRole: "local_reconstruction_only",
    resolvedMaterialDigest: input.resolvedMaterialDigest,
    resolvedMaterialEvidenceRefs: input.resolvedMaterialEvidenceRefs,
    evidenceRefs: materialEvidenceRefs(input),
    proofGapReasonCodes,
    packageSafetyProven: false,
    provenanceProvesBenignCode: false,
    bunProvenanceVerified: false,
  });
}

export function projectPackageInstallAdapterEvidenceReport(input: {
  contract: ActionContract;
  gateAttempt: GatewayCheckAttempt;
  receipt: Receipt;
  reconciliation: SurfaceOperationReconciliation | null;
  materialEvidence: PackageInstallMaterialEvidence;
}): PackageInstallAdapterEvidenceReport {
  const reconciliation = input.reconciliation ? SurfaceOperationReconciliationSchema.parse(input.reconciliation) : null;
  return PackageInstallAdapterEvidenceReportSchema.parse({
    reportKind: "package_install_adapter_evidence_report",
    adapterPackId: packageInstallMaterialAdapterPack.adapterPackId,
    adapterPackVersion: packageInstallMaterialAdapterPack.adapterPackVersion,
    action: {
      actionContractId: input.contract.actionContractId,
      actionClass: "package.install",
      resourceRef: input.contract.resourceRef,
      packageName: input.materialEvidence.packageName,
      versionRange: input.materialEvidence.versionRange,
    },
    authority: {
      greenlightId: input.gateAttempt.greenlightId,
      gatewayId: input.gateAttempt.gatewayId,
      gateAttemptId: input.gateAttempt.gateAttemptId,
      gatewayDecision: input.gateAttempt.gateDecision,
      verifiedGatewayCheckRequired: true,
      runtimeIngressAuthority: false,
      cliAuthority: false,
      mcpAuthority: false,
      reportAuthority: false,
    },
    exactContract: {
      contractDigest: input.contract.actionContractDigest,
      paramsDigest: input.contract.paramsDigest,
      idempotencyKey: input.contract.idempotencyKey,
    },
    evidence: input.materialEvidence,
    outcome: {
      receiptId: input.receipt.receiptId,
      receiptDigest: requireDigest(input.receipt.receiptDigest, "receiptDigest"),
      finalityStatus: input.receipt.finalityStatus,
      downstreamExecutionStatus: input.receipt.downstreamExecutionStatus,
      reconciliationStatus: reconciliation?.reconciliationStatus ?? null,
    },
    proofGaps: [...input.materialEvidence.proofGapReasonCodes, ...input.receipt.proofGapIds],
    bypassPosture: {
      requiredProbeKinds: packageInstallMaterialAdapterPack.bypassProbeKinds,
      hostileFixtureRefs: packageInstallMaterialAdapterPack.hostileFixtureRefs,
    },
    reconstruction: {
      auditChainDigest: requireDigest(input.receipt.auditChainDigest, "auditChainDigest"),
      streamEventIds: input.receipt.streamEventIds,
      materialEvidenceRefs: input.materialEvidence.evidenceRefs,
    },
    nonClaims: [
      "not_package_safety_proof",
      "not_npm_audit_replacement",
      "not_bun_provenance_verification",
      "not_hosted_operation",
      "not_runtime_cli_or_mcp_enforcement",
    ],
  });
}

function requireDigest(value: string | null, fieldName: string): `sha256:${string}` {
  if (!value) throw new Error(`Package install evidence report requires ${fieldName}.`);
  return DigestSchema.parse(value) as `sha256:${string}`;
}

function lifecyclePostureFor(
  lifecycleScriptPolicy: PackageInstallParameters["lifecycleScriptPolicy"],
): PackageInstallMaterialEvidence["lifecycleScriptExecutionPosture"] {
  if (lifecycleScriptPolicy === "blocked") return "blocked_by_default";
  if (lifecycleScriptPolicy === "allowed") return "separate_contract_required";
  return "proof_gap";
}

function materialIntegrityStatus(input: PackageInstallParameters): PackageInstallMaterialEvidenceStatus {
  if (input.resolvedMaterialDigest && input.resolvedMaterialEvidenceRefs.length > 0) return "verified";
  if (input.resolvedMaterialDigest || input.resolvedMaterialEvidenceRefs.length > 0) return "unverified";
  return "proof_gap";
}

function materialEvidenceRefs(input: PackageInstallParameters): string[] {
  return [
    input.manifestRef,
    input.lockfileRef,
    ...input.resolvedMaterialEvidenceRefs,
    input.resolvedMaterialDigest ? `digest:${input.resolvedMaterialDigest}` : null,
  ].filter((ref): ref is string => Boolean(ref));
}

function packageInstallMaterialProofGapReasonCodes(input: {
  input: PackageInstallParameters;
  npmProvenanceStatus: PackageInstallMaterialEvidenceStatus;
  npmSignatureStatus: PackageInstallMaterialEvidenceStatus;
  registryIntegrityStatus: PackageInstallMaterialEvidenceStatus;
}): string[] {
  const reasonCodes: string[] = [];
  if (input.npmProvenanceStatus !== "verified") reasonCodes.push("npm_provenance_not_verified");
  if (input.npmSignatureStatus !== "verified") reasonCodes.push("npm_signature_not_verified");
  if (input.registryIntegrityStatus !== "verified") reasonCodes.push("registry_integrity_not_verified");
  if (!input.input.lockfileRef) reasonCodes.push("lockfile_reconstruction_evidence_missing");
  if (input.input.lifecycleScriptPolicy !== "blocked")
    reasonCodes.push("package_lifecycle_scripts_require_separate_contract");
  return [...new Set(reasonCodes)].sort();
}
