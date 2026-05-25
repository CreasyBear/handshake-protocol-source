import { z } from "zod";
import { InstallProposalSchema, type InstallProposal } from "../install/install-proposal";
import { ProtectedActionAdapterPackSchema } from "../install/protected-action-adapter-pack";

const NonEmptyStringSchema = z.string().min(1);

export const AdapterSdkBindingStatusSchema = z.literal("definition_only");
export type AdapterSdkBindingStatus = z.infer<typeof AdapterSdkBindingStatusSchema>;

export const AdapterSdkAuthorityBoundarySchema = z.strictObject({
  authorityCreated: z.literal(false),
  authorityCertificateMinted: z.literal(false),
  credentialMaterialIncluded: z.literal(false),
  gatewayCheckPerformed: z.literal(false),
  greenlightCreated: z.literal(false),
  mutationAttempted: z.literal(false),
  mutationCommandIncluded: z.literal(false),
  policyDecisionCreated: z.literal(false),
  rawInternalRecordIncluded: z.literal(false),
  receiptExportCreated: z.literal(false),
  providerCustodyClaimed: z.literal(false),
  marketplaceCertificationClaimed: z.literal(false),
  settlementClaimed: z.literal(false),
});
export type AdapterSdkAuthorityBoundary = z.infer<typeof AdapterSdkAuthorityBoundarySchema>;

export const adapterSdkAuthorityBoundary: AdapterSdkAuthorityBoundary = AdapterSdkAuthorityBoundarySchema.parse({
  authorityCreated: false,
  authorityCertificateMinted: false,
  credentialMaterialIncluded: false,
  gatewayCheckPerformed: false,
  greenlightCreated: false,
  mutationAttempted: false,
  mutationCommandIncluded: false,
  policyDecisionCreated: false,
  rawInternalRecordIncluded: false,
  receiptExportCreated: false,
  providerCustodyClaimed: false,
  marketplaceCertificationClaimed: false,
  settlementClaimed: false,
});

export const adapterSdkRequiredNonClaims = [
  "adapter_sdk_does_not_create_authority",
  "adapter_sdk_does_not_evaluate_policy",
  "adapter_sdk_does_not_create_greenlights",
  "adapter_sdk_does_not_perform_gateway_checks",
  "adapter_sdk_does_not_attempt_mutations",
  "adapter_sdk_does_not_export_receipts",
  "adapter_sdk_does_not_hold_provider_custody",
  "adapter_sdk_does_not_certify_adapters",
  "adapter_sdk_does_not_register_marketplace_listings",
  "adapter_sdk_runtime_ingress_binding_is_source_owned",
] as const;
export type AdapterSdkRequiredNonClaim = (typeof adapterSdkRequiredNonClaims)[number];

export const AdapterSdkInstallCompilerContractSchema = z.strictObject({
  installCompilerRef: NonEmptyStringSchema,
  inputSchemaRef: NonEmptyStringSchema,
  outputSchemaRef: z.literal("handshake.install_proposal"),
  refusalBoundaryRef: NonEmptyStringSchema,
  statusIntegrityRequired: z.literal(true),
});
export type AdapterSdkInstallCompilerContract = z.infer<typeof AdapterSdkInstallCompilerContractSchema>;

export const AdapterSdkProtectedPathContractSchema = z.strictObject({
  protectedPathContractRef: NonEmptyStringSchema,
  observedParameterValidatorRef: NonEmptyStringSchema,
  receiptEvidenceMapperRef: NonEmptyStringSchema,
  bypassProbeKinds: ProtectedActionAdapterPackSchema.shape.bypassProbeKinds,
  bindingStatus: AdapterSdkBindingStatusSchema.default("definition_only"),
});
export type AdapterSdkProtectedPathContract = z.infer<typeof AdapterSdkProtectedPathContractSchema>;

export const AdapterSdkConformanceExpectationSchema = z.strictObject({
  expectationId: NonEmptyStringSchema,
  title: NonEmptyStringSchema,
  evidenceRef: NonEmptyStringSchema,
  required: z.literal(true),
});
export type AdapterSdkConformanceExpectation = z.infer<typeof AdapterSdkConformanceExpectationSchema>;

const AdapterSdkDefinitionBaseSchema = z.strictObject({
  adapterPack: ProtectedActionAdapterPackSchema,
  runtimeIngressBindingStatus: AdapterSdkBindingStatusSchema,
  protectedPathBindingStatus: AdapterSdkBindingStatusSchema,
  installCompilerContract: AdapterSdkInstallCompilerContractSchema,
  protectedPathContract: AdapterSdkProtectedPathContractSchema,
  conformanceExpectations: z.array(AdapterSdkConformanceExpectationSchema).min(1),
  authorityBoundary: AdapterSdkAuthorityBoundarySchema,
  nonClaims: z.array(NonEmptyStringSchema).min(adapterSdkRequiredNonClaims.length),
});
export const AdapterSdkDefinitionSchema = AdapterSdkDefinitionBaseSchema.superRefine((definition, context) => {
  for (const requiredNonClaim of adapterSdkRequiredNonClaims) {
    if (!definition.nonClaims.includes(requiredNonClaim)) {
      context.addIssue({
        code: "custom",
        message: `Adapter SDK definition must include ${requiredNonClaim}.`,
        path: ["nonClaims"],
      });
    }
  }
});
export type AdapterSdkDefinition = z.infer<typeof AdapterSdkDefinitionSchema>;

export const AdapterSdkDefinitionInputSchema = AdapterSdkDefinitionBaseSchema.omit({
  authorityBoundary: true,
  nonClaims: true,
  protectedPathBindingStatus: true,
  runtimeIngressBindingStatus: true,
}).extend({
  authorityBoundary: AdapterSdkAuthorityBoundarySchema.default(adapterSdkAuthorityBoundary),
  nonClaims: z.array(NonEmptyStringSchema).default([]),
  protectedPathBindingStatus: AdapterSdkBindingStatusSchema.default("definition_only"),
  runtimeIngressBindingStatus: AdapterSdkBindingStatusSchema.default("definition_only"),
});
export type AdapterSdkDefinitionInput = z.input<typeof AdapterSdkDefinitionInputSchema>;

const adapterSdkDefinitionIssueCodes = [
  "install_compiler_ref_mismatch",
  "observed_parameter_validator_ref_mismatch",
  "receipt_evidence_mapper_ref_mismatch",
  "bypass_probe_kinds_mismatch",
] as const;
export const AdapterSdkDefinitionIssueCodeSchema = z.enum(adapterSdkDefinitionIssueCodes);
export type AdapterSdkDefinitionIssueCode = (typeof adapterSdkDefinitionIssueCodes)[number];

export const AdapterSdkDefinitionReportSchema = z.strictObject({
  reportKind: z.literal("adapter_sdk_definition_report"),
  adapterPackId: NonEmptyStringSchema,
  adapterPackVersion: NonEmptyStringSchema,
  actionFamily: NonEmptyStringSchema,
  protectedSurfaceKind: NonEmptyStringSchema,
  status: z.enum(["ready_for_source_review", "invalid_definition"]),
  issueCodes: z.array(AdapterSdkDefinitionIssueCodeSchema),
  runtimeIngressBindingStatus: AdapterSdkBindingStatusSchema,
  protectedPathBindingStatus: AdapterSdkBindingStatusSchema,
  authorityBoundary: AdapterSdkAuthorityBoundarySchema,
  nonClaims: z.array(NonEmptyStringSchema),
});
export type AdapterSdkDefinitionReport = z.infer<typeof AdapterSdkDefinitionReportSchema>;

const adapterSdkInstallProposalIssueCodes = [
  "adapter_pack_id_mismatch",
  "adapter_pack_version_mismatch",
  "action_family_mismatch",
  "protected_surface_kind_mismatch",
  "ready_install_requires_compiled_records",
  "refusal_requires_reason_codes",
  "refusal_must_not_include_compiled_records",
] as const;
export const AdapterSdkInstallProposalIssueCodeSchema = z.enum(adapterSdkInstallProposalIssueCodes);
export type AdapterSdkInstallProposalIssueCode = (typeof adapterSdkInstallProposalIssueCodes)[number];

export const AdapterSdkInstallProposalReportSchema = z.strictObject({
  reportKind: z.literal("adapter_sdk_install_proposal_report"),
  adapterPackId: NonEmptyStringSchema,
  adapterPackVersion: NonEmptyStringSchema,
  installProposalId: NonEmptyStringSchema,
  status: z.enum(["valid_proposal_shape", "invalid_proposal_shape"]),
  issueCodes: z.array(AdapterSdkInstallProposalIssueCodeSchema),
  proposalStatus: InstallProposalSchema.shape.status,
  compiledRecordsIncluded: z.boolean(),
  refusalReasonCodes: z.array(NonEmptyStringSchema),
  authorityBoundary: AdapterSdkAuthorityBoundarySchema,
  nonClaims: z.array(NonEmptyStringSchema),
});
export type AdapterSdkInstallProposalReport = z.infer<typeof AdapterSdkInstallProposalReportSchema>;

export type AdapterInstallCompiler<Input = unknown> = {
  readonly installCompilerRef: string;
  readonly compileInstallProposal: (input: Input) => InstallProposal | Promise<InstallProposal>;
};

export function defineAdapterInstallCompiler<Input>(
  compiler: AdapterInstallCompiler<Input>,
): AdapterInstallCompiler<Input> {
  if (compiler.installCompilerRef.length === 0) {
    throw new Error("Adapter install compiler must declare installCompilerRef.");
  }
  return {
    installCompilerRef: compiler.installCompilerRef,
    async compileInstallProposal(input: Input) {
      return InstallProposalSchema.parse(await compiler.compileInstallProposal(input));
    },
  };
}

export function defineProtectedActionAdapterPack(input: AdapterSdkDefinitionInput): AdapterSdkDefinition {
  const definition = AdapterSdkDefinitionInputSchema.parse(input);
  const report = projectAdapterSdkDefinitionReport(definition);
  if (report.status !== "ready_for_source_review") {
    throw new Error(`Invalid adapter SDK definition: ${report.issueCodes.join(", ")}`);
  }
  return AdapterSdkDefinitionSchema.parse({
    ...definition,
    authorityBoundary: AdapterSdkAuthorityBoundarySchema.parse(definition.authorityBoundary),
    nonClaims: mergeRequiredNonClaims(definition.nonClaims),
  });
}

export function projectAdapterSdkDefinitionReport(input: AdapterSdkDefinitionInput): AdapterSdkDefinitionReport {
  const definition = AdapterSdkDefinitionInputSchema.parse(input);
  const adapterPack = definition.adapterPack;
  const issueCodes: AdapterSdkDefinitionIssueCode[] = [];

  if (definition.installCompilerContract.installCompilerRef !== adapterPack.installCompilerRef) {
    issueCodes.push("install_compiler_ref_mismatch");
  }
  if (
    definition.protectedPathContract.observedParameterValidatorRef !== adapterPack.gatewayObservedParameterValidatorRef
  ) {
    issueCodes.push("observed_parameter_validator_ref_mismatch");
  }
  if (definition.protectedPathContract.receiptEvidenceMapperRef !== adapterPack.receiptEvidenceMapperRef) {
    issueCodes.push("receipt_evidence_mapper_ref_mismatch");
  }
  if (!sameStringSet(definition.protectedPathContract.bypassProbeKinds, adapterPack.bypassProbeKinds)) {
    issueCodes.push("bypass_probe_kinds_mismatch");
  }

  return AdapterSdkDefinitionReportSchema.parse({
    reportKind: "adapter_sdk_definition_report",
    adapterPackId: adapterPack.adapterPackId,
    adapterPackVersion: adapterPack.adapterPackVersion,
    actionFamily: adapterPack.actionFamily,
    protectedSurfaceKind: adapterPack.protectedSurfaceKind,
    status: issueCodes.length === 0 ? "ready_for_source_review" : "invalid_definition",
    issueCodes,
    runtimeIngressBindingStatus: definition.runtimeIngressBindingStatus,
    protectedPathBindingStatus: definition.protectedPathBindingStatus,
    authorityBoundary: definition.authorityBoundary,
    nonClaims: mergeRequiredNonClaims(definition.nonClaims),
  });
}

export function projectAdapterSdkInstallProposalReport(
  definitionInput: AdapterSdkDefinitionInput,
  proposalInput: InstallProposal,
): AdapterSdkInstallProposalReport {
  const definition = defineProtectedActionAdapterPack(definitionInput);
  const proposal = InstallProposalSchema.parse(proposalInput);
  const issueCodes: AdapterSdkInstallProposalIssueCode[] = [];
  const adapterPack = definition.adapterPack;

  if (proposal.adapterPackId !== adapterPack.adapterPackId) issueCodes.push("adapter_pack_id_mismatch");
  if (proposal.adapterPackVersion !== adapterPack.adapterPackVersion) issueCodes.push("adapter_pack_version_mismatch");
  if (proposal.actionFamily !== adapterPack.actionFamily) issueCodes.push("action_family_mismatch");
  if (proposal.protectedSurfaceKind !== adapterPack.protectedSurfaceKind) {
    issueCodes.push("protected_surface_kind_mismatch");
  }
  if (proposal.status === "ready_to_install" && proposal.compiledRecords === null) {
    issueCodes.push("ready_install_requires_compiled_records");
  }
  if (proposal.status === "refused" && proposal.refusalReasonCodes.length === 0) {
    issueCodes.push("refusal_requires_reason_codes");
  }
  if (proposal.status === "refused" && proposal.compiledRecords !== null) {
    issueCodes.push("refusal_must_not_include_compiled_records");
  }

  return AdapterSdkInstallProposalReportSchema.parse({
    reportKind: "adapter_sdk_install_proposal_report",
    adapterPackId: adapterPack.adapterPackId,
    adapterPackVersion: adapterPack.adapterPackVersion,
    installProposalId: proposal.installProposalId,
    status: issueCodes.length === 0 ? "valid_proposal_shape" : "invalid_proposal_shape",
    issueCodes,
    proposalStatus: proposal.status,
    compiledRecordsIncluded: proposal.compiledRecords !== null,
    refusalReasonCodes: proposal.refusalReasonCodes,
    authorityBoundary: definition.authorityBoundary,
    nonClaims: definition.nonClaims,
  });
}

export function assertAdapterSdkInstallProposal(
  definitionInput: AdapterSdkDefinitionInput,
  proposalInput: InstallProposal,
): InstallProposal {
  const proposal = InstallProposalSchema.parse(proposalInput);
  const report = projectAdapterSdkInstallProposalReport(definitionInput, proposal);
  if (report.status !== "valid_proposal_shape") {
    throw new Error(`Invalid adapter SDK install proposal: ${report.issueCodes.join(", ")}`);
  }
  return proposal;
}

function mergeRequiredNonClaims(nonClaims: readonly string[]): string[] {
  return [...new Set([...adapterSdkRequiredNonClaims, ...nonClaims])];
}

function sameStringSet(left: readonly string[], right: readonly string[]): boolean {
  if (left.length !== right.length) return false;
  const leftSorted = [...left].sort();
  const rightSorted = [...right].sort();
  for (let index = 0; index < leftSorted.length; index += 1) {
    if (leftSorted[index] !== rightSorted[index]) return false;
  }
  return true;
}
