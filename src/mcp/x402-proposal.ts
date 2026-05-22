import { z } from "zod";
import type { RuntimeClient } from "../sdk/surface-clients";
import { mcpActionContractProposedOutcome, mcpNonContractOutcome, mcpToolResult, type McpToolResult } from "./output";
import { digestMcp, type McpJsonValue } from "./digest";

const DigestSchema = z.string().regex(/^sha256:[a-f0-9]{64}$/);
const AtomicAmountSchema = z.string().regex(/^(?:0|[1-9]\d*)$/);
const IsoDateSchema = z.string().datetime({ offset: true });

export const McpInstallPostureSchema = z.enum(["ready", "missing", "stale", "unsafe", "unknown"]);
export const McpGatewayPostureSchema = z.enum(["online", "offline", "unknown"]);

export const McpX402PaymentProposalInputSchema = z.strictObject({
  requestId: z.string().min(1),
  tenantId: z.string().min(1),
  organizationId: z.string().min(1),
  principalId: z.string().min(1),
  agentId: z.string().min(1),
  principalIntentRef: z.string().min(1),
  generatedCodeOrSpecRef: z.string().min(1),
  runtimeAdapterRef: z.string().min(1),
  runId: z.string().min(1),
  dispatchBoundaryRef: z.string().min(1),
  dispatchRef: z.string().min(1),
  metadataRef: z.string().min(1),
  metadataDigest: DigestSchema,
  toolCatalogRef: z.string().min(1),
  toolCatalogDigest: DigestSchema,
  actionCatalogRef: z.string().min(1),
  gatewayRegistryRef: z.string().min(1),
  gatewayRegistryDigest: DigestSchema,
  operatingEnvelopeId: z.string().min(1),
  toolCapabilityId: z.string().min(1),
  actionTypeId: z.string().min(1),
  gatewayRegistryEntryId: z.string().min(1),
  gatewayId: z.string().min(1),
  contractExpiresAt: IsoDateSchema,
  idempotencyKey: z.string().min(1),
  endpointUrl: z.string().url(),
  intendedHttpMethod: z.string().min(1),
  intendedRequestUrl: z.string().url(),
  intendedRequestBodyDigest: DigestSchema.nullable(),
  selectedHeadersDigest: DigestSchema,
  payee: z.string().min(1),
  payTo: z.string().min(1),
  network: z.string().min(1),
  token: z.string().min(1),
  asset: z.string().min(1),
  atomicAmount: AtomicAmountSchema,
  maxAtomicAmountPerCall: AtomicAmountSchema,
  x402EvidenceProfile: z.literal("official_payment_required"),
  x402Version: z.number().int().positive(),
  x402Scheme: z.literal("exact"),
  maxTimeoutSeconds: z.number().positive(),
  paymentRequirementsDigest: DigestSchema,
  paymentRequiredEvidenceRef: z.string().min(1),
  selectedPaymentRequirementIndex: z.number().int().nonnegative(),
  selectedPaymentRequirementDigest: DigestSchema,
  sdkPackageVersions: z.record(z.string(), z.string().min(1)).refine((value) => Object.keys(value).length > 0, {
    message: "official x402 evidence requires SDK package versions",
  }),
  extensionKeys: z.array(z.string().min(1)).default([]),
  facilitatorRef: z.string().min(1).nullable().default(null),
  requiredPriorActionContractIds: z.array(z.string().min(1)).default([]),
  sequenceNumber: z.number().int().positive().default(1),
  loopDetected: z.boolean().default(false),
  retryDetected: z.boolean().default(false),
  branchDetected: z.boolean().default(false),
  correlationRef: z.string().min(1).nullable().default(null),
});

export type McpX402PaymentProposalInput = z.input<typeof McpX402PaymentProposalInputSchema>;
type ParsedMcpX402PaymentProposalInput = z.infer<typeof McpX402PaymentProposalInputSchema>;

export type McpRuntimeProposalClient = Pick<
  RuntimeClient,
  | "createRuntimeExecution"
  | "createToolCallDraft"
  | "transitionToolCallDraft"
  | "compileIntent"
  | "proposeActionContract"
>;

export type ProposeMcpX402PaymentOptions = {
  runtimeClient: McpRuntimeProposalClient;
  currentMetadataDigest?: `sha256:${string}`;
  installPosture?: z.infer<typeof McpInstallPostureSchema>;
  gatewayPosture?: z.infer<typeof McpGatewayPostureSchema>;
};

export async function proposeMcpX402Payment(
  inputValue: unknown,
  options: ProposeMcpX402PaymentOptions,
): Promise<McpToolResult> {
  const parsed = McpX402PaymentProposalInputSchema.safeParse(inputValue);
  if (!parsed.success) {
    return mcpNonContractOutcome({
      outcome: "tool_execution_error",
      phase: "tool_execution",
      reasonCodes: ["mcp_input_schema_invalid"],
      nextAction: "recraft_request",
      retryability: "retryable_after_recraft",
    });
  }
  const input = parsed.data;

  if (options.currentMetadataDigest && options.currentMetadataDigest !== input.metadataDigest) {
    return mcpNonContractOutcome({
      outcome: "metadata_stale",
      phase: "freshness",
      reasonCodes: ["mcp_metadata_digest_stale"],
      nextAction: "reload_metadata",
      retryability: "retryable_after_reload",
      metadataRef: input.metadataRef,
      challengeRef: `handshake://challenges/metadata-stale/${encodeURIComponent(input.requestId)}`,
      correlationRef: input.correlationRef,
      idempotencyKey: input.idempotencyKey,
    });
  }

  if ((options.installPosture ?? "ready") !== "ready") {
    return mcpNonContractOutcome({
      outcome: "install_not_ready",
      phase: "readiness",
      reasonCodes: [`mcp_install_${options.installPosture ?? "unknown"}`],
      nextAction: "fix_install",
      metadataRef: input.metadataRef,
      challengeRef: `handshake://challenges/install-not-ready/${encodeURIComponent(input.requestId)}`,
      correlationRef: input.correlationRef,
      idempotencyKey: input.idempotencyKey,
    });
  }

  if ((options.gatewayPosture ?? "online") === "offline") {
    return mcpNonContractOutcome({
      outcome: "gateway_offline",
      phase: "readiness",
      reasonCodes: ["mcp_gateway_offline"],
      nextAction: "wait_for_gateway",
      retryability: "retryable_after_reload",
      metadataRef: input.metadataRef,
      challengeRef: `handshake://challenges/gateway-offline/${encodeURIComponent(input.requestId)}`,
      correlationRef: input.correlationRef,
      idempotencyKey: input.idempotencyKey,
    });
  }

  if (compareAtomic(input.atomicAmount, input.maxAtomicAmountPerCall) > 0) {
    return mcpNonContractOutcome({
      outcome: "refused",
      phase: "proposal",
      reasonCodes: ["x402_amount_exceeds_call_bound"],
      nextAction: "recraft_request",
      retryability: "retryable_after_recraft",
      metadataRef: input.metadataRef,
      challengeRef: `handshake://challenges/x402-amount/${encodeURIComponent(input.requestId)}`,
      correlationRef: input.correlationRef,
      idempotencyKey: input.idempotencyKey,
    });
  }

  try {
    return await proposeContract(input, options.runtimeClient);
  } catch (error) {
    return mcpNonContractOutcome({
      outcome: "tool_execution_error",
      phase: "tool_execution",
      reasonCodes: [errorCode(error)],
      nextAction: "stop",
      commitState: errorCommitState(error),
      metadataRef: input.metadataRef,
      evidenceRefs: [input.paymentRequiredEvidenceRef],
      correlationRef: input.correlationRef,
      idempotencyKey: input.idempotencyKey,
    });
  }
}

async function proposeContract(
  input: ParsedMcpX402PaymentProposalInput,
  runtimeClient: McpRuntimeProposalClient,
): Promise<McpToolResult> {
  const resourceRef = x402ResourceRef(input);
  const parameters = x402Parameters(input);
  const executionBlockDigest = await digestMcp({
    requestId: input.requestId,
    metadataDigest: input.metadataDigest,
    dispatchBoundaryRef: input.dispatchBoundaryRef,
    dispatchRef: input.dispatchRef,
    paymentRequirementsDigest: input.paymentRequirementsDigest,
    selectedPaymentRequirementIndex: input.selectedPaymentRequirementIndex,
    selectedPaymentRequirementDigest: input.selectedPaymentRequirementDigest,
  });

  const runtimeExecution = await runtimeClient.createRuntimeExecution({
    tenantId: input.tenantId,
    organizationId: input.organizationId,
    principalIntentRef: input.principalIntentRef,
    principalId: input.principalId,
    agentId: input.agentId,
    runId: input.runId,
    runtimeAdapterId: input.runtimeAdapterRef,
    executionShape: "single_tool_call",
    runtimePosture: "protected_capability",
    executionBlockRef: input.dispatchBoundaryRef,
    executionBlockDigest,
    generatedCodeOrSpecRefs: [input.generatedCodeOrSpecRef],
    allowedToolCapabilityIds: [input.toolCapabilityId],
    observedToolCallRefs: [input.dispatchRef],
    observedConsequentialCallCount: 1,
    loopDetected: input.loopDetected,
    retryDetected: input.retryDetected,
    branchDetected: input.branchDetected,
    dynamicToolConstructionDetected: false,
    accessPosture: "controlled_outbound",
    evidenceRefs: [input.metadataRef, input.paymentRequiredEvidenceRef],
  });

  const openedDraft = await runtimeClient.createToolCallDraft({
    tenantId: input.tenantId,
    organizationId: input.organizationId,
    runtimeExecutionId: runtimeExecution.runtimeExecutionId,
    generatedExecutionGraphId: null,
    generatedExecutionNodeId: null,
    toolCapabilityId: input.toolCapabilityId,
    actionTypeId: input.actionTypeId,
    gatewayRegistryEntryId: input.gatewayRegistryEntryId,
    actionClass: "x402_payment.exact",
    gatewayId: input.gatewayId,
    resourceRef,
    parameters,
    nonSecretParamsSummary: parameters,
    expiresAt: input.contractExpiresAt,
    evidenceRefs: [input.paymentRequiredEvidenceRef],
  });

  const toolCallDraft = await runtimeClient.transitionToolCallDraft({
    toolCallDraftId: openedDraft.toolCallDraftId,
    nextDraftState: "finalized",
    parameters,
    nonSecretParamsSummary: parameters,
    evidenceRefs: [input.paymentRequiredEvidenceRef],
  });

  const intentCompilation = await runtimeClient.compileIntent({
    tenantId: input.tenantId,
    organizationId: input.organizationId,
    principalIntentRef: input.principalIntentRef,
    principalId: input.principalId,
    agentId: input.agentId,
    runId: input.runId,
    runtimeAdapterId: input.runtimeAdapterRef,
    operatingEnvelopeId: input.operatingEnvelopeId,
    toolCatalogRef: input.toolCatalogRef,
    actionCatalogRef: input.actionCatalogRef,
    gatewayRegistryRef: input.gatewayRegistryRef,
    runtimeExecutionId: runtimeExecution.runtimeExecutionId,
    generatedExecutionGraphId: null,
    generatedExecutionNodeId: null,
    toolCallDraftId: toolCallDraft.toolCallDraftId,
    generatedCodeOrSpecRefs: [input.generatedCodeOrSpecRef],
    declaredAssumptions: [
      "mcp proposal supplied one official exact x402 payment requirement selection",
      "generated execution graph creation is not exposed by the role-scoped runtime surface",
    ],
    requiredEvidenceRefs: [input.paymentRequiredEvidenceRef],
    candidate: {
      toolCapabilityId: input.toolCapabilityId,
      actionTypeId: input.actionTypeId,
      gatewayRegistryEntryId: input.gatewayRegistryEntryId,
      actionClass: "x402_payment.exact",
      gatewayId: input.gatewayId,
      resourceRef,
      sequenceNumber: input.sequenceNumber,
      requiredPriorActionContractIds: input.requiredPriorActionContractIds,
      recoveryRecommendationId: null,
      parameters,
      nonSecretParamsSummary: parameters,
      purposeCode: "x402_paid_request",
      expectedSideEffectCodes: ["x402_payment_signature_created"],
      evidenceRefs: [input.paymentRequiredEvidenceRef],
      clearingEvidenceRefs: input.correlationRef ? { correlationRef: input.correlationRef } : {},
      bounds: {
        endpointDomain: new URL(input.endpointUrl).hostname,
        payee: input.payee,
        payTo: input.payTo,
        network: input.network,
        token: input.token,
        asset: input.asset,
        maxAtomicAmountPerCall: input.maxAtomicAmountPerCall,
      },
      idempotencyKey: input.idempotencyKey,
      rollbackHint: "recover through payment response or facilitator evidence; do not reuse prior authority",
      expiresAt: input.contractExpiresAt,
    },
  });

  const refusalReasonCodes = [
    ...intentCompilation.uncertaintyMarkers,
    ...intentCompilation.overreachReasonCodes,
    ...intentCompilation.candidateAction.refusalReasonCodes,
  ];
  if (intentCompilation.candidateAction.candidateStatus !== "contractable" || refusalReasonCodes.length > 0) {
    return mcpNonContractOutcome({
      outcome: "refused",
      phase: "proposal",
      reasonCodes: refusalReasonCodes.length > 0 ? refusalReasonCodes : ["mcp_candidate_not_contractable"],
      nextAction: "recraft_request",
      retryability: "retryable_after_recraft",
      commitState: "protocol_recorded",
      metadataRef: input.metadataRef,
      evidenceRefs: [input.paymentRequiredEvidenceRef],
      challengeRef: `handshake://challenges/proposal-refused/${encodeURIComponent(input.requestId)}`,
      correlationRef: input.correlationRef,
      idempotencyKey: input.idempotencyKey,
    });
  }

  const candidateDigest = intentCompilation.candidateAction.candidateDigest;
  if (!candidateDigest) {
    return mcpNonContractOutcome({
      outcome: "refused",
      phase: "proposal",
      reasonCodes: ["mcp_candidate_digest_missing"],
      nextAction: "recraft_request",
      commitState: "protocol_recorded",
      metadataRef: input.metadataRef,
      evidenceRefs: [input.paymentRequiredEvidenceRef],
      challengeRef: `handshake://challenges/proposal-digest-missing/${encodeURIComponent(input.requestId)}`,
      correlationRef: input.correlationRef,
      idempotencyKey: input.idempotencyKey,
    });
  }

  const actionContract = await runtimeClient.proposeActionContract({
    intentCompilationId: intentCompilation.intentCompilationId,
    candidateActionId: intentCompilation.candidateAction.candidateActionId,
    candidateDigest,
  });

  return mcpToolResult(
    mcpActionContractProposedOutcome({
      outcome: "action_contract_proposed",
      phase: "proposal",
      authorityCreated: false,
      authorityCertificateMinted: false,
      credentialMaterialIncluded: false,
      gatewayCheckPerformed: false,
      greenlightCreated: false,
      mutationAttempted: false,
      mutationCommandIncluded: false,
      rawInternalRecordIncluded: false,
      receiptExportCreated: false,
      greenlightRef: null,
      gatewayCheckRef: null,
      mutationAttemptRef: null,
      reasonCodes: [],
      nextAction: "read_evidence",
      retryability: "not_retryable",
      commitState: "protocol_recorded",
      metadataRef: input.metadataRef,
      evidenceRefs: [
        input.paymentRequiredEvidenceRef,
        `handshake://evidence/contracts/${actionContract.actionContractId}`,
        `handshake://evidence/envelopes/${actionContract.actionContractId}`,
      ],
      challengeRef: null,
      correlationRef: input.correlationRef,
      idempotencyKey: input.idempotencyKey,
      actionContractId: actionContract.actionContractId,
      contractDigest: actionContract.actionContractDigest,
      paramsDigest: actionContract.paramsDigest,
      runtimeExecutionId: runtimeExecution.runtimeExecutionId,
      toolCallDraftId: toolCallDraft.toolCallDraftId,
      intentCompilationId: intentCompilation.intentCompilationId,
      generatedExecutionGraphId: null,
      generatedExecutionGraphPosture: "not_exposed_by_role_scoped_runtime_surface",
    }),
  );
}

function x402Parameters(input: ParsedMcpX402PaymentProposalInput): Record<string, McpJsonValue> {
  return {
    endpointUrl: input.endpointUrl,
    endpointDomain: new URL(input.endpointUrl).hostname,
    intendedHttpMethod: input.intendedHttpMethod,
    intendedRequestUrl: input.intendedRequestUrl,
    intendedRequestBodyDigest: input.intendedRequestBodyDigest,
    selectedHeadersDigest: input.selectedHeadersDigest,
    x402Version: input.x402Version,
    x402Scheme: input.x402Scheme,
    payee: input.payee,
    payTo: input.payTo,
    network: input.network,
    token: input.token,
    asset: input.asset,
    atomicAmount: input.atomicAmount,
    x402EvidenceProfile: input.x402EvidenceProfile,
    paymentRequirementsDigest: input.paymentRequirementsDigest,
    selectedPaymentRequirementIndex: input.selectedPaymentRequirementIndex,
    selectedPaymentRequirementDigest: input.selectedPaymentRequirementDigest,
    maxTimeoutSeconds: input.maxTimeoutSeconds,
    facilitatorRef: input.facilitatorRef,
    sdkPackageVersions: input.sdkPackageVersions,
    extensionKeys: input.extensionKeys,
    metadataRef: input.metadataRef,
    metadataDigest: input.metadataDigest,
    toolCatalogDigest: input.toolCatalogDigest,
    gatewayRegistryDigest: input.gatewayRegistryDigest,
  };
}

function x402ResourceRef(input: ParsedMcpX402PaymentProposalInput): string {
  const endpointDomain = new URL(input.endpointUrl).hostname;
  return `x402://${encodeURIComponent(input.network)}/${encodeURIComponent(input.payee)}/${encodeURIComponent(
    endpointDomain,
  )}`;
}

function compareAtomic(left: string, right: string): number {
  const normalizedLeft = left.replace(/^0+(?=\d)/, "");
  const normalizedRight = right.replace(/^0+(?=\d)/, "");
  if (normalizedLeft.length !== normalizedRight.length) return normalizedLeft.length > normalizedRight.length ? 1 : -1;
  return normalizedLeft.localeCompare(normalizedRight);
}

function errorCode(error: unknown): string {
  if (typeof error === "object" && error !== null && "code" in error && typeof error.code === "string") {
    return error.code;
  }
  return "mcp_runtime_bridge_error";
}

function errorCommitState(error: unknown): "not_started" | "protocol_recorded" | "ambiguous" {
  if (typeof error === "object" && error !== null && "commitState" in error) {
    if (error.commitState === "not_started") return "not_started";
    if (error.commitState === "accepted") return "protocol_recorded";
    if (error.commitState === "ambiguous") return "ambiguous";
  }
  return "not_started";
}
