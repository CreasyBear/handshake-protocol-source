import { mcpCatalogSnapshot, MCP_X402_PAYMENT_PROPOSE_TOOL } from "./catalog";
import { digestMcp } from "./digest";
import { mcpNonContractOutcome, type McpToolResult } from "./output";
import {
  actionContractIdFrom,
  MCP_REFERENCE_GATEWAY_READINESS_DIGEST,
  MCP_REFERENCE_GATEWAY_READINESS_REF,
  MCP_REFERENCE_METADATA_URI,
  MCP_REFERENCE_POLICY_VERSION_DIGEST,
  MCP_REFERENCE_POLICY_VERSION_REF,
  MCP_REFERENCE_RECEIPT_TIMELINE_URI,
  MCP_REFERENCE_TRUSTED_MAX_ATOMIC_AMOUNT,
  metadataDigestFrom,
  referenceEvidenceClient,
  referenceProposalInput,
  referenceRuntimeClient,
} from "./reference-transcript-fixtures";
import { readMcpResource, type McpResourceRead } from "./resources";
import { proposeMcpX402Payment } from "./x402-proposal";

export const MCP_X402_REFERENCE_TRANSCRIPT_VERSION = "handshake.mcp.x402.reference-transcript.v0.1" as const;

export const mcpX402ReferenceTranscriptCaseIds = [
  "metadata_read",
  "valid_proposal",
  "digest_bound_proposal",
  "evidence_readback",
  "stale_metadata",
  "tools_list_changed",
  "install_not_ready",
  "gateway_offline",
  "amount_mismatch",
  "unsupported_body_posture",
  "live_provider_posture",
  "params_mismatch",
  "replay_refusal",
  "raw_sibling_bypass_shaped_input",
  "proof_gap_downstream_uncertainty",
] as const;

export type McpX402ReferenceTranscriptCaseId = (typeof mcpX402ReferenceTranscriptCaseIds)[number];

export type McpReferenceCliReadbackId =
  | "schema"
  | "evidence.aps-report"
  | "evidence.contract-view"
  | "evidence.receipt-timeline"
  | "install.health";

export type McpReferenceSourceBinding =
  | {
      readonly kind: "mcp_catalog";
      readonly source: "mcpCatalogSnapshot";
    }
  | {
      readonly kind: "mcp_resource";
      readonly source: "readMcpResource";
      readonly uri: string;
    }
  | {
      readonly kind: "mcp_tool";
      readonly source: "proposeMcpX402Payment";
      readonly toolName: typeof MCP_X402_PAYMENT_PROPOSE_TOOL;
    }
  | {
      readonly kind: "shared_outcome";
      readonly source: "mcpNonContractOutcome";
    }
  | {
      readonly kind: "cli_readback";
      readonly source: "cliCommandManifest";
      readonly commandId: McpReferenceCliReadbackId;
    };

export type McpReferenceTranscriptRow = {
  readonly id: McpX402ReferenceTranscriptCaseId;
  readonly title: string;
  readonly generatedExecutionShape: "model_facing_mcp_resource_read" | "model_facing_mcp_tool_call";
  readonly protectedActionPath: "x402_payment.exact" | "none";
  readonly expectedOutcome: string;
  readonly expectedNextAction: string;
  readonly sourceBindings: readonly McpReferenceSourceBinding[];
  readonly cliReadbacks: readonly McpReferenceCliReadbackId[];
  readonly resourceReads: readonly McpResourceRead[];
  readonly toolResult: McpToolResult | null;
  readonly runtimeCallNames: readonly string[];
  readonly nonAuthorityPosture: typeof mcpReferenceNonAuthorityPosture;
};

export type McpReferenceTranscriptPack = {
  readonly schemaVersion: typeof MCP_X402_REFERENCE_TRANSCRIPT_VERSION;
  readonly targetDecision: typeof mcpX402ReferenceTranscriptTargetDecision;
  readonly transcriptContract: typeof mcpX402ReferenceTranscriptContract;
  readonly hostileMatrix: readonly {
    readonly caseId: McpX402ReferenceTranscriptCaseId;
    readonly hostileCondition: string;
    readonly requiredPosture: string;
  }[];
  readonly catalogSnapshot: ReturnType<typeof mcpCatalogSnapshot>;
  readonly rows: readonly McpReferenceTranscriptRow[];
};

export const mcpReferenceNonAuthorityPosture = {
  policyDecisionCreated: false,
  authorityCreated: false,
  authorityCertificateMinted: false,
  credentialMaterialIncluded: false,
  gatewayCheckPerformed: false,
  greenlightCreated: false,
  mutationAttempted: false,
  mutationCommandIncluded: false,
  rawInternalRecordIncluded: false,
  receiptExportCreated: false,
  hostedOperationClaimed: false,
  providerCustodyClaimed: false,
  crossOrgTrustClaimed: false,
  clearingHouseClaimed: false,
} as const;

export const mcpX402ReferenceTranscriptTargetDecision = {
  id: "mcp-x402-reference-transcript-target",
  selectedTarget: "source_owned_typescript_reference_harness",
  custodyRole: "runtime_evidence",
  authorityPosture: "proposal_only",
  externalHostClaimed: false,
  controlPlaneCustody: false,
  gatewayCustody: false,
  rawStoreCustody: false,
  evidenceExportCustody: false,
  certificateMintCustody: false,
  processLaunchCustody: false,
  packageManagerCustody: false,
  repoCustody: false,
  cloudCustody: false,
  browserCustody: false,
  networkCustody: false,
  fallbackIfExternalHostChosen:
    "keep this pack as source-owned reference evidence and add host-specific bypass proof before public quickstart claims",
} as const;

export const mcpX402ReferenceTranscriptContract = {
  actionClass: "x402_payment.exact",
  requiredCaseIds: mcpX402ReferenceTranscriptCaseIds,
  requiredSourceBindings: ["mcpCatalogSnapshot", "readMcpResource", "proposeMcpX402Payment", "mcpNonContractOutcome"],
  requiredCliReadbacks: [
    "schema",
    "evidence.aps-report",
    "evidence.contract-view",
    "evidence.receipt-timeline",
    "install.health",
  ],
  nonClaims: [
    "no_policy_decision",
    "no_greenlight",
    "no_gateway_check",
    "no_mutation",
    "no_receipt_export",
    "no_credential_material",
    "no_certificate_mint",
    "no_hosted_operation",
    "no_provider_custody",
    "no_cross_org_trust",
    "no_clearing_house",
  ],
  validationGates: [
    "every case binds to source-owned MCP catalog, resource, tool, or shared outcome behavior",
    "every case carries explicit non-authority posture",
    "CLI pairings reference existing evidence or local readiness commands only",
    "hostile cases refuse, reload, stop, or read evidence without authority escalation",
  ],
} as const;

function referenceTrustedProposalOptions() {
  return {
    trustedMaxAtomicAmountPerCall: MCP_REFERENCE_TRUSTED_MAX_ATOMIC_AMOUNT,
    gatewayReadinessRef: MCP_REFERENCE_GATEWAY_READINESS_REF,
    gatewayReadinessDigest: MCP_REFERENCE_GATEWAY_READINESS_DIGEST,
    policyVersionRef: MCP_REFERENCE_POLICY_VERSION_REF,
    policyVersionDigest: MCP_REFERENCE_POLICY_VERSION_DIGEST,
  };
}

export async function buildMcpX402ReferenceTranscript(): Promise<McpReferenceTranscriptPack> {
  const catalogSnapshot = mcpCatalogSnapshot();
  const evidenceClient = referenceEvidenceClient();
  const metadataRead = await readMcpResource(MCP_REFERENCE_METADATA_URI, evidenceClient);
  const metadataDigest = metadataDigestFrom(metadataRead);
  const validInput = await referenceProposalInput(metadataDigest);

  const validRuntime = referenceRuntimeClient();
  const validProposal = await proposeMcpX402Payment(validInput, {
    runtimeClient: validRuntime.client,
    ...referenceTrustedProposalOptions(),
  });
  const digestBoundRuntime = referenceRuntimeClient();
  const digestBoundProposal = await proposeMcpX402Payment(
    {
      ...validInput,
      requestId: "req_mcp_x402_digest_bound",
      dispatchRef: "dispatch:mcp:digest-bound",
      intendedHttpMethod: "POST",
      intendedRequestBodyPosture: "digest_bound",
      intendedRequestBodyDigest: await digestMcp({ body: "digest-bound-reference" }),
      providerEnvironmentRef: "provider-environment:x402-local-reference-sandbox",
    },
    {
      runtimeClient: digestBoundRuntime.client,
      ...referenceTrustedProposalOptions(),
    },
  );
  const actionContractId = actionContractIdFrom(validProposal);
  const contractUri = `handshake://evidence/contracts/${encodeURIComponent(actionContractId)}`;
  const envelopeUri = `handshake://evidence/envelopes/${encodeURIComponent(actionContractId)}`;
  const contractRead = await readMcpResource(contractUri, evidenceClient);
  const envelopeRead = await readMcpResource(envelopeUri, evidenceClient);

  const staleRuntime = referenceRuntimeClient();
  const staleProposal = await proposeMcpX402Payment(validInput, {
    runtimeClient: staleRuntime.client,
    currentMetadataDigest: await digestMcp({ caseId: "new_metadata_digest" }),
    ...referenceTrustedProposalOptions(),
  });

  const changedToolsRuntime = referenceRuntimeClient();
  const changedToolsProposal = await proposeMcpX402Payment(validInput, {
    runtimeClient: changedToolsRuntime.client,
    toolsListChanged: true,
    ...referenceTrustedProposalOptions(),
  });

  const installRuntime = referenceRuntimeClient();
  const installProposal = await proposeMcpX402Payment(validInput, {
    runtimeClient: installRuntime.client,
    installPosture: "missing",
    ...referenceTrustedProposalOptions(),
  });
  const installHealthUri = installProposal.structuredContent.evidenceRefs[0] ?? "";
  const installHealthRead = installHealthUri ? await readMcpResource(installHealthUri, evidenceClient) : null;

  const offlineRuntime = referenceRuntimeClient();
  const offlineProposal = await proposeMcpX402Payment(validInput, {
    runtimeClient: offlineRuntime.client,
    gatewayPosture: "offline",
    ...referenceTrustedProposalOptions(),
  });

  const amountRuntime = referenceRuntimeClient();
  const amountProposal = await proposeMcpX402Payment(
    { ...validInput, requestId: "req_mcp_x402_amount", atomicAmount: "3000" },
    {
      runtimeClient: amountRuntime.client,
      ...referenceTrustedProposalOptions(),
    },
  );

  const unsupportedBodyRuntime = referenceRuntimeClient();
  const unsupportedBodyProposal = await proposeMcpX402Payment(
    {
      ...validInput,
      requestId: "req_mcp_x402_unsupported_body",
      dispatchRef: "dispatch:mcp:unsupported-body",
      intendedRequestBodyPosture: "unsupported",
    },
    {
      runtimeClient: unsupportedBodyRuntime.client,
      ...referenceTrustedProposalOptions(),
    },
  );

  const liveProviderRuntime = referenceRuntimeClient();
  const liveProviderProposal = await proposeMcpX402Payment(
    {
      ...validInput,
      requestId: "req_mcp_x402_live_provider",
      dispatchRef: "dispatch:mcp:live-provider",
      providerEnvironmentPosture: "live",
      providerEnvironmentRef: "provider-environment:x402-live",
    },
    {
      runtimeClient: liveProviderRuntime.client,
      ...referenceTrustedProposalOptions(),
    },
  );

  const paramsRuntime = referenceRuntimeClient({ contractFailureCode: "idempotency_key_params_mismatch" });
  const paramsProposal = await proposeMcpX402Payment(
    { ...validInput, requestId: "req_mcp_x402_params", dispatchRef: "dispatch:mcp:params" },
    {
      runtimeClient: paramsRuntime.client,
      ...referenceTrustedProposalOptions(),
    },
  );

  const replayRuntime = referenceRuntimeClient({ contractFailureCode: "already_consumed" });
  const replayProposal = await proposeMcpX402Payment(
    { ...validInput, requestId: "req_mcp_x402_replay", dispatchRef: "dispatch:mcp:replay" },
    {
      runtimeClient: replayRuntime.client,
      ...referenceTrustedProposalOptions(),
    },
  );

  const bypassRuntime = referenceRuntimeClient();
  const bypassProposal = await proposeMcpX402Payment(
    { ...validInput, requestId: "req_mcp_x402_bypass", rawSiblingDispatchRef: "sibling:mcp:x402" },
    {
      runtimeClient: bypassRuntime.client,
      ...referenceTrustedProposalOptions(),
    },
  );

  const proofGapTimeline = await readMcpResource(MCP_REFERENCE_RECEIPT_TIMELINE_URI, evidenceClient);
  const proofGapOutcome = mcpNonContractOutcome({
    outcome: "proof_gap",
    phase: "evidence",
    reasonCodes: ["downstream_evidence_missing"],
    nextAction: "read_evidence",
    commitState: "ambiguous",
    metadataRef: MCP_REFERENCE_METADATA_URI,
    evidenceRefs: [MCP_REFERENCE_RECEIPT_TIMELINE_URI],
  });

  const rows: readonly McpReferenceTranscriptRow[] = [
    row({
      id: "metadata_read",
      title: "Metadata read for the exact x402 action",
      generatedExecutionShape: "model_facing_mcp_resource_read",
      protectedActionPath: "none",
      expectedOutcome: "read_only_metadata",
      expectedNextAction: "propose_or_recraft",
      sourceBindings: [
        { kind: "mcp_catalog", source: "mcpCatalogSnapshot" },
        { kind: "mcp_resource", source: "readMcpResource", uri: MCP_REFERENCE_METADATA_URI },
        { kind: "cli_readback", source: "cliCommandManifest", commandId: "schema" },
      ],
      cliReadbacks: ["schema"],
      resourceReads: [metadataRead],
      toolResult: null,
      runtimeCallNames: [],
    }),
    row({
      id: "valid_proposal",
      title: "Valid exact proposal records a contract candidate only",
      generatedExecutionShape: "model_facing_mcp_tool_call",
      protectedActionPath: "x402_payment.exact",
      expectedOutcome: validProposal.structuredContent.outcome,
      expectedNextAction: validProposal.structuredContent.nextAction,
      sourceBindings: [
        { kind: "mcp_tool", source: "proposeMcpX402Payment", toolName: MCP_X402_PAYMENT_PROPOSE_TOOL },
        { kind: "cli_readback", source: "cliCommandManifest", commandId: "evidence.contract-view" },
      ],
      cliReadbacks: ["evidence.contract-view"],
      resourceReads: [],
      toolResult: validProposal,
      runtimeCallNames: validRuntime.calls.map((call) => call.name),
    }),
    row({
      id: "digest_bound_proposal",
      title: "Digest-bound exact proposal records a contract candidate only",
      generatedExecutionShape: "model_facing_mcp_tool_call",
      protectedActionPath: "x402_payment.exact",
      expectedOutcome: digestBoundProposal.structuredContent.outcome,
      expectedNextAction: digestBoundProposal.structuredContent.nextAction,
      sourceBindings: [
        { kind: "mcp_tool", source: "proposeMcpX402Payment", toolName: MCP_X402_PAYMENT_PROPOSE_TOOL },
        { kind: "cli_readback", source: "cliCommandManifest", commandId: "evidence.contract-view" },
      ],
      cliReadbacks: ["evidence.contract-view"],
      resourceReads: [],
      toolResult: digestBoundProposal,
      runtimeCallNames: digestBoundRuntime.calls.map((call) => call.name),
    }),
    row({
      id: "evidence_readback",
      title: "Evidence readback exposes redacted projections",
      generatedExecutionShape: "model_facing_mcp_resource_read",
      protectedActionPath: "x402_payment.exact",
      expectedOutcome: "redacted_evidence_read",
      expectedNextAction: "read_evidence",
      sourceBindings: [
        { kind: "mcp_resource", source: "readMcpResource", uri: contractUri },
        { kind: "mcp_resource", source: "readMcpResource", uri: envelopeUri },
        { kind: "cli_readback", source: "cliCommandManifest", commandId: "evidence.contract-view" },
      ],
      cliReadbacks: ["evidence.contract-view"],
      resourceReads: [contractRead, envelopeRead],
      toolResult: null,
      runtimeCallNames: [],
    }),
    row({
      id: "stale_metadata",
      title: "Stale metadata refuses before runtime recording",
      generatedExecutionShape: "model_facing_mcp_tool_call",
      protectedActionPath: "x402_payment.exact",
      expectedOutcome: staleProposal.structuredContent.outcome,
      expectedNextAction: staleProposal.structuredContent.nextAction,
      sourceBindings: [
        { kind: "mcp_tool", source: "proposeMcpX402Payment", toolName: MCP_X402_PAYMENT_PROPOSE_TOOL },
        { kind: "cli_readback", source: "cliCommandManifest", commandId: "schema" },
      ],
      cliReadbacks: ["schema"],
      resourceReads: [],
      toolResult: staleProposal,
      runtimeCallNames: staleRuntime.calls.map((call) => call.name),
    }),
    row({
      id: "tools_list_changed",
      title: "Changed tools list asks the model to reload",
      generatedExecutionShape: "model_facing_mcp_tool_call",
      protectedActionPath: "x402_payment.exact",
      expectedOutcome: changedToolsProposal.structuredContent.outcome,
      expectedNextAction: changedToolsProposal.structuredContent.nextAction,
      sourceBindings: [
        { kind: "mcp_catalog", source: "mcpCatalogSnapshot" },
        { kind: "mcp_tool", source: "proposeMcpX402Payment", toolName: MCP_X402_PAYMENT_PROPOSE_TOOL },
        { kind: "cli_readback", source: "cliCommandManifest", commandId: "schema" },
      ],
      cliReadbacks: ["schema"],
      resourceReads: [],
      toolResult: changedToolsProposal,
      runtimeCallNames: changedToolsRuntime.calls.map((call) => call.name),
    }),
    row({
      id: "install_not_ready",
      title: "Missing local install posture returns readiness evidence",
      generatedExecutionShape: "model_facing_mcp_tool_call",
      protectedActionPath: "x402_payment.exact",
      expectedOutcome: installProposal.structuredContent.outcome,
      expectedNextAction: installProposal.structuredContent.nextAction,
      sourceBindings: [
        { kind: "mcp_tool", source: "proposeMcpX402Payment", toolName: MCP_X402_PAYMENT_PROPOSE_TOOL },
        ...(installHealthUri
          ? [{ kind: "mcp_resource", source: "readMcpResource", uri: installHealthUri } as const]
          : []),
        { kind: "cli_readback", source: "cliCommandManifest", commandId: "install.health" },
      ],
      cliReadbacks: ["install.health"],
      resourceReads: installHealthRead ? [installHealthRead] : [],
      toolResult: installProposal,
      runtimeCallNames: installRuntime.calls.map((call) => call.name),
    }),
    row({
      id: "gateway_offline",
      title: "Offline gateway posture stops before runtime recording",
      generatedExecutionShape: "model_facing_mcp_tool_call",
      protectedActionPath: "x402_payment.exact",
      expectedOutcome: offlineProposal.structuredContent.outcome,
      expectedNextAction: offlineProposal.structuredContent.nextAction,
      sourceBindings: [
        { kind: "mcp_tool", source: "proposeMcpX402Payment", toolName: MCP_X402_PAYMENT_PROPOSE_TOOL },
        { kind: "cli_readback", source: "cliCommandManifest", commandId: "install.health" },
      ],
      cliReadbacks: ["install.health"],
      resourceReads: [],
      toolResult: offlineProposal,
      runtimeCallNames: offlineRuntime.calls.map((call) => call.name),
    }),
    row({
      id: "amount_mismatch",
      title: "Amount beyond local bound refuses before runtime recording",
      generatedExecutionShape: "model_facing_mcp_tool_call",
      protectedActionPath: "x402_payment.exact",
      expectedOutcome: amountProposal.structuredContent.outcome,
      expectedNextAction: amountProposal.structuredContent.nextAction,
      sourceBindings: [
        { kind: "mcp_tool", source: "proposeMcpX402Payment", toolName: MCP_X402_PAYMENT_PROPOSE_TOOL },
        { kind: "cli_readback", source: "cliCommandManifest", commandId: "evidence.contract-view" },
      ],
      cliReadbacks: ["evidence.contract-view"],
      resourceReads: [],
      toolResult: amountProposal,
      runtimeCallNames: amountRuntime.calls.map((call) => call.name),
    }),
    row({
      id: "unsupported_body_posture",
      title: "Unsupported body posture refuses before runtime recording",
      generatedExecutionShape: "model_facing_mcp_tool_call",
      protectedActionPath: "x402_payment.exact",
      expectedOutcome: unsupportedBodyProposal.structuredContent.outcome,
      expectedNextAction: unsupportedBodyProposal.structuredContent.nextAction,
      sourceBindings: [
        { kind: "mcp_tool", source: "proposeMcpX402Payment", toolName: MCP_X402_PAYMENT_PROPOSE_TOOL },
        { kind: "cli_readback", source: "cliCommandManifest", commandId: "schema" },
      ],
      cliReadbacks: ["schema"],
      resourceReads: [],
      toolResult: unsupportedBodyProposal,
      runtimeCallNames: unsupportedBodyRuntime.calls.map((call) => call.name),
    }),
    row({
      id: "live_provider_posture",
      title: "Live provider posture refuses before runtime recording",
      generatedExecutionShape: "model_facing_mcp_tool_call",
      protectedActionPath: "x402_payment.exact",
      expectedOutcome: liveProviderProposal.structuredContent.outcome,
      expectedNextAction: liveProviderProposal.structuredContent.nextAction,
      sourceBindings: [
        { kind: "mcp_tool", source: "proposeMcpX402Payment", toolName: MCP_X402_PAYMENT_PROPOSE_TOOL },
        { kind: "cli_readback", source: "cliCommandManifest", commandId: "schema" },
      ],
      cliReadbacks: ["schema"],
      resourceReads: [],
      toolResult: liveProviderProposal,
      runtimeCallNames: liveProviderRuntime.calls.map((call) => call.name),
    }),
    row({
      id: "params_mismatch",
      title: "Idempotency parameter drift maps to protocol refusal",
      generatedExecutionShape: "model_facing_mcp_tool_call",
      protectedActionPath: "x402_payment.exact",
      expectedOutcome: paramsProposal.structuredContent.outcome,
      expectedNextAction: paramsProposal.structuredContent.nextAction,
      sourceBindings: [
        { kind: "mcp_tool", source: "proposeMcpX402Payment", toolName: MCP_X402_PAYMENT_PROPOSE_TOOL },
        { kind: "cli_readback", source: "cliCommandManifest", commandId: "evidence.contract-view" },
      ],
      cliReadbacks: ["evidence.contract-view"],
      resourceReads: [],
      toolResult: paramsProposal,
      runtimeCallNames: paramsRuntime.calls.map((call) => call.name),
    }),
    row({
      id: "replay_refusal",
      title: "Consumed authority attempt maps to replay refusal",
      generatedExecutionShape: "model_facing_mcp_tool_call",
      protectedActionPath: "x402_payment.exact",
      expectedOutcome: replayProposal.structuredContent.outcome,
      expectedNextAction: replayProposal.structuredContent.nextAction,
      sourceBindings: [
        { kind: "mcp_tool", source: "proposeMcpX402Payment", toolName: MCP_X402_PAYMENT_PROPOSE_TOOL },
        { kind: "cli_readback", source: "cliCommandManifest", commandId: "evidence.receipt-timeline" },
      ],
      cliReadbacks: ["evidence.receipt-timeline"],
      resourceReads: [],
      toolResult: replayProposal,
      runtimeCallNames: replayRuntime.calls.map((call) => call.name),
    }),
    row({
      id: "raw_sibling_bypass_shaped_input",
      title: "Raw sibling-shaped input is rejected by the strict tool schema",
      generatedExecutionShape: "model_facing_mcp_tool_call",
      protectedActionPath: "x402_payment.exact",
      expectedOutcome: bypassProposal.structuredContent.outcome,
      expectedNextAction: bypassProposal.structuredContent.nextAction,
      sourceBindings: [
        { kind: "mcp_tool", source: "proposeMcpX402Payment", toolName: MCP_X402_PAYMENT_PROPOSE_TOOL },
        { kind: "cli_readback", source: "cliCommandManifest", commandId: "evidence.aps-report" },
      ],
      cliReadbacks: ["evidence.aps-report"],
      resourceReads: [],
      toolResult: bypassProposal,
      runtimeCallNames: bypassRuntime.calls.map((call) => call.name),
    }),
    row({
      id: "proof_gap_downstream_uncertainty",
      title: "Downstream uncertainty is read back as a proof gap",
      generatedExecutionShape: "model_facing_mcp_resource_read",
      protectedActionPath: "x402_payment.exact",
      expectedOutcome: proofGapOutcome.structuredContent.outcome,
      expectedNextAction: proofGapOutcome.structuredContent.nextAction,
      sourceBindings: [
        { kind: "shared_outcome", source: "mcpNonContractOutcome" },
        { kind: "mcp_resource", source: "readMcpResource", uri: MCP_REFERENCE_RECEIPT_TIMELINE_URI },
        { kind: "cli_readback", source: "cliCommandManifest", commandId: "evidence.receipt-timeline" },
      ],
      cliReadbacks: ["evidence.receipt-timeline"],
      resourceReads: [proofGapTimeline],
      toolResult: proofGapOutcome,
      runtimeCallNames: [],
    }),
  ];

  return {
    schemaVersion: MCP_X402_REFERENCE_TRANSCRIPT_VERSION,
    targetDecision: mcpX402ReferenceTranscriptTargetDecision,
    transcriptContract: mcpX402ReferenceTranscriptContract,
    hostileMatrix: rows
      .filter(
        (entry) =>
          entry.id !== "metadata_read" &&
          entry.id !== "valid_proposal" &&
          entry.id !== "digest_bound_proposal" &&
          entry.id !== "evidence_readback",
      )
      .map((entry) => ({
        caseId: entry.id,
        hostileCondition: entry.title,
        requiredPosture: `${entry.expectedOutcome}:${entry.expectedNextAction}`,
      })),
    catalogSnapshot,
    rows,
  };
}

export async function buildMcpX402ReferenceTranscriptMarkdown(): Promise<string> {
  const pack = await buildMcpX402ReferenceTranscript();
  const lines = [
    "# MCP x402 Reference Transcript",
    "",
    "Status: source-owned reference transcript",
    "Scope: MCP proposal and evidence transport for one buyer-side x402_payment.exact path",
    "",
    "## Invariant At Stake",
    "",
    "MCP can help a model propose exact work and read evidence. It cannot authorize, admit, execute, export, certify, host, or provide custody.",
    "",
    "## Target Decision",
    "",
    `- Target: ${pack.targetDecision.selectedTarget}`,
    `- Custody role: ${pack.targetDecision.custodyRole}`,
    `- Authority posture: ${pack.targetDecision.authorityPosture}`,
    `- External host claimed: ${String(pack.targetDecision.externalHostClaimed)}`,
    "",
    "## Transcript Rows",
    "",
    "| Case | Expected outcome | Next action | Source bindings | CLI readbacks |",
    "| --- | --- | --- | --- | --- |",
    ...pack.rows.map(
      (entry) =>
        `| ${entry.id} | ${entry.expectedOutcome} | ${entry.expectedNextAction} | ${entry.sourceBindings
          .map(bindingLabel)
          .join(", ")} | ${entry.cliReadbacks.join(", ") || "none"} |`,
    ),
    "",
    "## Non-Claims",
    "",
    ...pack.transcriptContract.nonClaims.map((claim) => `- ${claim}`),
    "",
    "## Buyer-Readable Result",
    "",
    "The model can propose exact work, Handshake records or refuses it, evidence can be read back, and authority still begins only at policy plus a one-use gateway-checked mutation path.",
  ];
  return `${lines.join("\n")}\n`;
}

function row(input: Omit<McpReferenceTranscriptRow, "nonAuthorityPosture">): McpReferenceTranscriptRow {
  return {
    ...input,
    nonAuthorityPosture: mcpReferenceNonAuthorityPosture,
  };
}

function bindingLabel(binding: McpReferenceSourceBinding): string {
  if (binding.kind === "mcp_resource") return `${binding.source}:${binding.uri}`;
  if (binding.kind === "mcp_tool") return `${binding.source}:${binding.toolName}`;
  if (binding.kind === "cli_readback") return `${binding.source}:${binding.commandId}`;
  return binding.source;
}
