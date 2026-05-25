import { mkdir, writeFile } from "node:fs/promises";
import { PROTOCOL_VERSION } from "../../src";
import {
  adapterSdkRequiredNonClaims,
  assertAdapterSdkInstallProposal,
  defineAdapterInstallCompiler,
  defineProtectedActionAdapterPack,
  projectAdapterSdkDefinitionReport,
  projectAdapterSdkInstallProposalReport,
  type AdapterSdkDefinitionInput,
} from "../../src/adapter-sdk";

const outputDir = new URL("./output/", import.meta.url);
const outputJsonPath = new URL("./output/latest.json", import.meta.url);
const outputMarkdownPath = new URL("./output/latest.md", import.meta.url);
const createdAt = "2026-05-24T00:00:00.000Z";
const expiresAt = "2026-05-25T00:00:00.000Z";
const digest = `sha256:${"3".repeat(64)}` as const;

type ExternalInstallMode = "ready" | "refused";
type ExternalInstallInput = {
  readonly mode: ExternalInstallMode;
  readonly tenantId: string;
  readonly organizationId: string;
  readonly projectRef: string;
  readonly gatewayId: string;
};

const adapterDefinitionInput = {
  adapterPack: {
    adapterPackId: "adapter_pack_example_issue_tracker_ticket_create",
    adapterPackVersion: "v1",
    actionFamily: "issue_tracker.ticket_create",
    protectedSurfaceKind: "issue_tracker_api",
    parameterSchemaRef: "schema:example-issue-tracker-ticket-create-parameters:v1",
    endpointEvidenceSchemaRef: "schema:example-issue-tracker-project-endpoint:v1",
    installCompilerRef: "compiler:example-issue-tracker-install:v1",
    policyRulePackRef: "policy:example-issue-tracker-ticket-create:v1",
    gatewayObservedParameterValidatorRef: "validator:example-issue-tracker-observed-parameters:v1",
    receiptEvidenceMapperRef: "receipt-mapper:example-issue-tracker-ticket-create:v1",
    bypassProbeKinds: ["credential_custody", "raw_sibling_blocking", "wrapper_drift", "failure_closed"],
    hostileFixtureRefs: [
      "fixture:example-issue-tracker:raw-api-token-env",
      "fixture:example-issue-tracker:direct-rest-client",
      "fixture:example-issue-tracker:changed-project-ref",
    ],
  },
  installCompilerContract: {
    installCompilerRef: "compiler:example-issue-tracker-install:v1",
    inputSchemaRef: "schema:example-issue-tracker-install-input:v1",
    outputSchemaRef: "handshake.install_proposal",
    refusalBoundaryRef: "refusal:example-issue-tracker-install:v1",
    statusIntegrityRequired: true,
  },
  protectedPathContract: {
    protectedPathContractRef: "protected-path:example-issue-tracker-ticket-create:v1",
    observedParameterValidatorRef: "validator:example-issue-tracker-observed-parameters:v1",
    receiptEvidenceMapperRef: "receipt-mapper:example-issue-tracker-ticket-create:v1",
    bypassProbeKinds: ["failure_closed", "wrapper_drift", "raw_sibling_blocking", "credential_custody"],
  },
  conformanceExpectations: [
    {
      expectationId: "expectation:example:no-ungated-mutation",
      title: "No issue-tracker ticket creation without verified gateway evidence",
      evidenceRef: "conformance:example-issue-tracker:no-ungated-mutation",
      required: true,
    },
    {
      expectationId: "expectation:example:raw-sibling-blocked",
      title: "Raw issue-tracker REST client bypass is blocked or reported unsafe",
      evidenceRef: "conformance:example-issue-tracker:raw-sibling-blocked",
      required: true,
    },
  ],
} satisfies AdapterSdkDefinitionInput;

const adapterDefinition = defineProtectedActionAdapterPack(adapterDefinitionInput);
const installCompiler = defineAdapterInstallCompiler<ExternalInstallInput>({
  installCompilerRef: adapterDefinition.adapterPack.installCompilerRef,
  compileInstallProposal: compileExampleInstallProposal,
});

const refusedProposal = await installCompiler.compileInstallProposal({
  mode: "refused",
  tenantId: "ten_demo",
  organizationId: "org_demo",
  projectRef: "project:demo",
  gatewayId: "gateway_issue_tracker_customer_proxy",
});
const readyProposal = await installCompiler.compileInstallProposal({
  mode: "ready",
  tenantId: "ten_demo",
  organizationId: "org_demo",
  projectRef: "project:demo",
  gatewayId: "gateway_issue_tracker_customer_proxy",
});

const definitionReport = projectAdapterSdkDefinitionReport(adapterDefinitionInput);
const refusedProposalReport = projectAdapterSdkInstallProposalReport(adapterDefinitionInput, refusedProposal);
const readyProposalReport = projectAdapterSdkInstallProposalReport(adapterDefinitionInput, readyProposal);

assertAdapterSdkInstallProposal(adapterDefinitionInput, refusedProposal);
assertAdapterSdkInstallProposal(adapterDefinitionInput, readyProposal);

const report = {
  schemaVersion: "handshake.demo.external-adapter-sdk.v1",
  command: "npm run demo:adapter-sdk",
  installedPackageImport: "handshake-protocol-kernel/adapter-sdk",
  localSourceImportReason: "repo demo imports local source so tests do not depend on prebuilt dist",
  adapterPackId: adapterDefinition.adapterPack.adapterPackId,
  actionFamily: adapterDefinition.adapterPack.actionFamily,
  protectedSurfaceKind: adapterDefinition.adapterPack.protectedSurfaceKind,
  runtimeIngressBindingStatus: adapterDefinition.runtimeIngressBindingStatus,
  protectedPathBindingStatus: adapterDefinition.protectedPathBindingStatus,
  definitionReport,
  refusedProposalReport,
  readyProposalReport,
  authorityBoundary: adapterDefinition.authorityBoundary,
  nonClaims: adapterDefinition.nonClaims,
  proofGaps: [
    "runtime_ingress_not_registered_by_adapter_sdk",
    "gateway_binding_not_created_by_adapter_sdk",
    "conformance_fixture_execution_not_included_in_authoring_demo",
  ],
  exampleAudit: {
    policyDecisionCreated: false,
    greenlightCreated: false,
    gatewayCheckPerformed: false,
    mutationAttempted: false,
    receiptExportCreated: false,
    providerCustodyClaimed: false,
    marketplaceCertificationClaimed: false,
  },
} as const;
const markdown = renderMarkdown(report);

await mkdir(outputDir, { recursive: true });
await writeFile(outputJsonPath, `${JSON.stringify(report, null, 2)}\n`);
await writeFile(outputMarkdownPath, markdown);

console.log(markdown);
console.log("Wrote: examples/external-adapter-sdk/output/latest.md");
console.log("Wrote: examples/external-adapter-sdk/output/latest.json");

async function compileExampleInstallProposal(input: ExternalInstallInput) {
  const resourceRef = `issue-tracker:${input.projectRef}:ticket-create`;
  const common = {
    installProposalId: `install_example_issue_tracker_${input.mode}`,
    schemaVersion: PROTOCOL_VERSION,
    tenantId: input.tenantId,
    organizationId: input.organizationId,
    createdAt,
    adapterPackId: adapterDefinition.adapterPack.adapterPackId,
    adapterPackVersion: adapterDefinition.adapterPack.adapterPackVersion,
    actionFamily: adapterDefinition.adapterPack.actionFamily,
    protectedSurfaceKind: adapterDefinition.adapterPack.protectedSurfaceKind,
    resourceRef,
    humanSummary: "Example issue-tracker ticket creation adapter install proposal.",
    policyPackRef: adapterDefinition.adapterPack.policyRulePackRef,
    policyPackVersion: "v1",
    bypassProbePlan: adapterDefinition.adapterPack.bypassProbeKinds.map((probeKind) => ({
      probeKind,
      requiredSourceAuthority: probeKind === "credential_custody" ? "gateway_probe" : "conformance_fixture",
      mustPassBeforeGatewayCheckedPosture: true,
    })),
    receiptExpectationRefs: [
      "evidence:issue-tracker-gateway-admission",
      "evidence:issue-tracker-ticket-response-or-proof-gap",
    ],
    installDigest: digest,
  } as const;

  if (input.mode === "refused") {
    return {
      ...common,
      status: "refused" as const,
      humanSummary: "Example issue-tracker adapter refused because the project scope is not source-reviewed.",
      refusalReasonCodes: [
        "external_adapter_scope_not_source_reviewed",
        "external_adapter_gateway_binding_not_source_owned",
      ],
      compiledRecords: null,
    };
  }

  return {
    ...common,
    status: "ready_to_install" as const,
    refusalReasonCodes: [],
    compiledRecords: compiledRecords(input, resourceRef),
  };
}

function compiledRecords(input: ExternalInstallInput, resourceRef: string) {
  const base = {
    schemaVersion: PROTOCOL_VERSION,
    tenantId: input.tenantId,
    organizationId: input.organizationId,
    createdAt,
  } as const;

  return {
    toolCapability: {
      ...base,
      toolCapabilityId: "toolcap_issue_tracker_ticket_create",
      toolCatalogId: "tool_catalog_external_issue_tracker",
      toolCatalogVersion: "v1",
      runtimeAdapterId: "runtime_external_adapter_sdk_example",
      toolName: "issueTracker.createTicket",
      toolNamespace: "example.issue_tracker",
      capabilityClass: "network",
      readWriteClassification: "consequential",
      consequentialityDefault: "consequential",
      wrapperStatus: "wrapped",
      rawBypassPossible: true,
      inputSchemaRef: adapterDefinition.adapterPack.parameterSchemaRef,
      outputSchemaRef: "schema:example-issue-tracker-ticket-create-output:v1",
      secretBearingFields: ["apiToken"],
      supersededAt: null,
    },
    actionType: {
      ...base,
      actionTypeId: "atype_issue_tracker_ticket_create",
      actionCatalogId: "action_catalog_external_issue_tracker",
      actionCatalogVersion: "v1",
      actionClass: adapterDefinition.adapterPack.actionFamily,
      protectedSurfaceKind: adapterDefinition.adapterPack.protectedSurfaceKind,
      requiredContractFields: ["projectRef", "title", "body", "idempotencyKey"],
      canonicalParameterSchemaRef: adapterDefinition.adapterPack.parameterSchemaRef,
      resourceRefSchemaRef: "schema:example-issue-tracker-resource-ref:v1",
      requiredEvidenceTypes: ["gateway_check", "ticket_response_or_proof_gap"],
      allowedBoundsSchemaRef: "schema:example-issue-tracker-ticket-create-bounds:v1",
      defaultReceiptRequirement: "mutation",
      defaultIdempotencyRequirement: "required",
      supersededAt: null,
    },
    gatewayRegistryEntry: {
      ...base,
      gatewayRegistryEntryId: "gwreg_issue_tracker_ticket_create",
      gatewayRegistryVersion: "v1",
      gatewayId: input.gatewayId,
      protectedSurfaceKind: adapterDefinition.adapterPack.protectedSurfaceKind,
      gatewayAdapterId: "adapter_issue_tracker_customer_gateway",
      gatewayAdapterVersion: "v1",
      gateEndpointRef: "gateway://customer/issue-tracker/ticket-create",
      gatewayPolicyContractId: "gwpolicy_issue_tracker_ticket_create",
      gatewayPolicyVersion: "v1",
      gatewayPolicyDriftMode: "refuse_on_drift",
      compatiblePreviousGatewayPolicyVersions: [],
      acceptedActionCatalogVersions: ["v1"],
      resourceNamespaceRef: `issue-tracker:${input.projectRef}`,
      canonicalizerVersion: "v1",
      receiptCapabilityStatus: "available",
      isolationCheckCapabilityStatus: "available",
      credentialCustodyStatus: "gateway_held",
      enforcementMode: "customer_gateway_adapter",
      mutationCredentialHolderRef: "secretref:customer-issue-tracker-api-token",
      gatewayAuthorityHolderRef: "gateway-authority:customer-issue-tracker",
      supersededAt: null,
    },
    operatingEnvelope: {
      ...base,
      envelopeId: "env_issue_tracker_ticket_create",
      principalId: "principal_demo",
      agentId: "agent_demo",
      participantIdentityBindings: [],
      objectiveRef: "intent:demo-create-one-issue-tracker-ticket",
      allowedActionClasses: [adapterDefinition.adapterPack.actionFamily],
      allowedGateways: [input.gatewayId],
      allowedResources: [resourceRef],
      requiredProtectedPathState: "gateway_checked",
      evidenceRequirements: ["gateway_check", "ticket_response_or_proof_gap"],
      policyPackRef: adapterDefinition.adapterPack.policyRulePackRef,
      policyPackVersion: "v1",
      issuedAt: createdAt,
      expiresAt,
      revokedAt: null,
    },
  } as const;
}

function renderMarkdown(input: typeof report): string {
  return `# External Adapter SDK Example

This example defines one third-party adapter pack and compiles two install proposals.

## Import Boundary

- Installed package import: \`${input.installedPackageImport}\`
- Runtime ingress binding: \`${input.runtimeIngressBindingStatus}\`
- Protected-path binding: \`${input.protectedPathBindingStatus}\`

## Definition Report

- Status: \`${input.definitionReport.status}\`
- Adapter pack: \`${input.adapterPackId}\`
- Action family: \`${input.actionFamily}\`

## Install Proposal Reports

- Refused proposal: \`${input.refusedProposalReport.status}\`
- Ready proposal: \`${input.readyProposalReport.status}\`
- Ready proposal compiled records included: \`${String(input.readyProposalReport.compiledRecordsIncluded)}\`

## Authority Boundary

- Policy decision created: \`${String(input.exampleAudit.policyDecisionCreated)}\`
- Greenlight created: \`${String(input.exampleAudit.greenlightCreated)}\`
- Gateway check performed: \`${String(input.exampleAudit.gatewayCheckPerformed)}\`
- Mutation attempted: \`${String(input.exampleAudit.mutationAttempted)}\`
- Receipt export created: \`${String(input.exampleAudit.receiptExportCreated)}\`
- Provider custody claimed: \`${String(input.exampleAudit.providerCustodyClaimed)}\`
- Marketplace certification claimed: \`${String(input.exampleAudit.marketplaceCertificationClaimed)}\`

## Required Non-Claims

${adapterSdkRequiredNonClaims.map((claim) => `- \`${claim}\``).join("\n")}

## Proof Gaps

${input.proofGaps.map((gap) => `- \`${gap}\``).join("\n")}
`;
}
