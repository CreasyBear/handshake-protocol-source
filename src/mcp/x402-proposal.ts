import { z } from "zod";
import type { RuntimeClient } from "../sdk/surface-clients";
import {
  ServiceWorkflowContextRefsSchema,
  serviceWorkflowContextCorrelationRef,
  serviceWorkflowContextEvidenceRefs,
} from "../surfaces/service-workflow-admission";
import { mcpActionContractProposedOutcome, mcpNonContractOutcome, mcpToolResult, type McpToolResult } from "./output";
import { digestMcp, type McpJsonValue } from "./digest";

const DigestSchema = z.string().regex(/^sha256:[a-f0-9]{64}$/);
const AtomicAmountSchema = z
  .string()
  .max(78)
  .regex(/^(?:0|[1-9]\d*)$/);
const IsoDateSchema = z.string().datetime({ offset: true });
const McpIdSchema = z.string().min(1).max(160);
const McpRefSchema = z.string().min(1).max(500);
const McpUrlSchema = z.string().url().max(2_048);
const McpSmallListSchema = <T extends z.ZodTypeAny>(schema: T) => z.array(schema).max(32);
const McpX402RequestBodyPostureSchema = z.enum(["no_body", "digest_bound", "omitted", "unsupported"]);
const McpX402ProviderEnvironmentPostureSchema = z.enum([
  "local_reference_sandbox",
  "external_sandbox",
  "live",
  "unknown",
]);

export const McpInstallPostureSchema = z.enum(["ready", "missing", "stale", "unsafe", "unknown"]);
export const McpGatewayPostureSchema = z.enum(["online", "offline", "unknown"]);
export type McpInstallPosture = z.infer<typeof McpInstallPostureSchema>;
export type McpGatewayPosture = z.infer<typeof McpGatewayPostureSchema>;

const McpDelegatedAuthorityBindingSchema = z.strictObject({
  authorityUseName: McpRefSchema,
  delegatedAuthorityRefId: McpIdSchema,
  delegatedAuthorityRefDigest: DigestSchema,
  requiredGrantStatus: z.literal("active").default("active"),
  authorityKind: z.literal("spend"),
  policyPackRef: McpRefSchema,
  policyPackVersion: McpIdSchema,
  evidenceExpectationRefs: McpSmallListSchema(McpRefSchema).default([]),
});

export const McpX402PaymentProposalInputSchema = z.strictObject({
  requestId: McpIdSchema,
  tenantId: McpIdSchema,
  organizationId: McpIdSchema,
  principalId: McpIdSchema,
  agentId: McpIdSchema,
  principalIntentRef: McpRefSchema,
  generatedCodeOrSpecRef: McpRefSchema,
  runtimeAdapterRef: McpRefSchema,
  runId: McpIdSchema,
  dispatchBoundaryRef: McpRefSchema,
  dispatchRef: McpRefSchema,
  metadataRef: McpRefSchema,
  metadataDigest: DigestSchema,
  toolCatalogRef: McpRefSchema,
  toolCatalogDigest: DigestSchema,
  actionCatalogRef: McpRefSchema,
  gatewayRegistryRef: McpRefSchema,
  gatewayRegistryDigest: DigestSchema,
  operatingEnvelopeId: McpIdSchema,
  toolCapabilityId: McpIdSchema,
  actionTypeId: McpIdSchema,
  gatewayRegistryEntryId: McpIdSchema,
  gatewayId: McpIdSchema,
  delegatedAuthorityBinding: McpDelegatedAuthorityBindingSchema,
  contractExpiresAt: IsoDateSchema,
  idempotencyKey: McpIdSchema,
  endpointUrl: McpUrlSchema,
  intendedHttpMethod: McpIdSchema,
  intendedRequestUrl: McpUrlSchema,
  intendedRequestBodyPosture: McpX402RequestBodyPostureSchema,
  intendedRequestBodyDigest: DigestSchema.nullable(),
  selectedHeadersDigest: DigestSchema,
  providerEnvironmentPosture: McpX402ProviderEnvironmentPostureSchema,
  providerEnvironmentRef: McpRefSchema.nullable(),
  payee: McpRefSchema,
  payTo: McpRefSchema,
  network: McpIdSchema,
  token: McpIdSchema,
  asset: McpIdSchema,
  atomicAmount: AtomicAmountSchema,
  x402EvidenceProfile: z.literal("official_payment_required"),
  x402Version: z.number().int().positive(),
  x402Scheme: z.literal("exact"),
  maxTimeoutSeconds: z.number().positive(),
  paymentRequirementsDigest: DigestSchema,
  paymentRequiredEvidenceRef: McpRefSchema,
  selectedPaymentRequirementIndex: z.number().int().nonnegative(),
  selectedPaymentRequirementDigest: DigestSchema,
  sdkPackageVersions: z
    .record(McpIdSchema, McpIdSchema)
    .refine((value) => Object.keys(value).length > 0, {
      message: "official x402 evidence requires SDK package versions",
    })
    .refine((value) => Object.keys(value).length <= 16, {
      message: "official x402 evidence must keep SDK package version evidence bounded",
    }),
  extensionKeys: McpSmallListSchema(McpIdSchema).default([]),
  facilitatorRef: McpRefSchema.nullable().default(null),
  requiredPriorActionContractIds: McpSmallListSchema(McpIdSchema).default([]),
  sequenceNumber: z.number().int().positive().default(1),
  loopDetected: z.boolean().default(false),
  retryDetected: z.boolean().default(false),
  branchDetected: z.boolean().default(false),
  correlationRef: McpRefSchema.nullable().default(null),
  serviceWorkflowContextRefs: ServiceWorkflowContextRefsSchema.optional(),
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
  toolsListChanged?: boolean;
  installPosture?: McpInstallPosture;
  gatewayPosture?: McpGatewayPosture;
  trustedMaxAtomicAmountPerCall?: `${number}` | string;
  gatewayReadinessRef?: string;
  gatewayReadinessDigest?: `sha256:${string}` | string;
  policyVersionRef?: string;
  policyVersionDigest?: `sha256:${string}` | string;
};

type McpTrustedProposalBinding = {
  trustedMaxAtomicAmountPerCall: string;
  gatewayReadinessRef: string;
  gatewayReadinessDigest: `sha256:${string}`;
  policyVersionRef: string;
  policyVersionDigest: `sha256:${string}`;
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
  const trustedBinding = trustedProposalBinding(options);
  const idempotencyKey = await deriveMcpX402IdempotencyKey(input, trustedBinding.binding);

  if (options.toolsListChanged) {
    return mcpNonContractOutcome({
      outcome: "tools_list_changed",
      phase: "freshness",
      reasonCodes: ["mcp_tools_list_changed"],
      nextAction: "reload_metadata",
      retryability: "retryable_after_reload",
      metadataRef: input.metadataRef,
      challengeRef: `handshake://challenges/tools-list-changed/${encodeURIComponent(input.requestId)}`,
      correlationRef: input.correlationRef,
      idempotencyKey,
    });
  }

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
      idempotencyKey,
    });
  }

  if ((options.installPosture ?? "ready") !== "ready") {
    return mcpNonContractOutcome({
      outcome: "install_not_ready",
      phase: "readiness",
      reasonCodes: [`mcp_install_${options.installPosture ?? "unknown"}`],
      nextAction: "fix_install",
      metadataRef: input.metadataRef,
      evidenceRefs: [preContractInstallHealthRef(input.requestId)],
      challengeRef: `handshake://challenges/install-not-ready/${encodeURIComponent(input.requestId)}`,
      correlationRef: input.correlationRef,
      idempotencyKey,
    });
  }

  if (!trustedBinding.binding) {
    return mcpNonContractOutcome({
      outcome: "install_not_ready",
      phase: "readiness",
      reasonCodes: trustedBinding.reasonCodes,
      nextAction: "fix_install",
      metadataRef: input.metadataRef,
      evidenceRefs: [preContractInstallHealthRef(input.requestId)],
      challengeRef: `handshake://challenges/install-not-ready/${encodeURIComponent(input.requestId)}`,
      correlationRef: input.correlationRef,
      idempotencyKey,
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
      evidenceRefs: [preContractInstallHealthRef(input.requestId)],
      challengeRef: `handshake://challenges/gateway-offline/${encodeURIComponent(input.requestId)}`,
      correlationRef: input.correlationRef,
      idempotencyKey,
    });
  }

  if ((options.gatewayPosture ?? "online") === "unknown") {
    return mcpNonContractOutcome({
      outcome: "tool_execution_error",
      phase: "tool_execution",
      reasonCodes: ["mcp_gateway_posture_unknown"],
      nextAction: "stop",
      metadataRef: input.metadataRef,
      evidenceRefs: [preContractInstallHealthRef(input.requestId)],
      correlationRef: input.correlationRef,
      idempotencyKey,
    });
  }

  if (compareAtomic(input.atomicAmount, trustedBinding.binding.trustedMaxAtomicAmountPerCall) > 0) {
    return mcpNonContractOutcome({
      outcome: "refused",
      phase: "proposal",
      reasonCodes: ["x402_amount_exceeds_call_bound"],
      nextAction: "recraft_request",
      retryability: "retryable_after_recraft",
      metadataRef: input.metadataRef,
      challengeRef: `handshake://challenges/x402-amount/${encodeURIComponent(input.requestId)}`,
      correlationRef: input.correlationRef,
      idempotencyKey,
    });
  }

  const postureRefusalReasonCodes = mcpX402PostureRefusalReasonCodes(input);
  if (postureRefusalReasonCodes.length > 0) {
    return mcpNonContractOutcome({
      outcome: "refused",
      phase: "proposal",
      reasonCodes: postureRefusalReasonCodes,
      nextAction: "recraft_request",
      retryability: "retryable_after_recraft",
      metadataRef: input.metadataRef,
      evidenceRefs: [input.paymentRequiredEvidenceRef],
      challengeRef: `handshake://challenges/x402-posture/${encodeURIComponent(input.requestId)}`,
      correlationRef: input.correlationRef,
      idempotencyKey,
    });
  }

  try {
    return await proposeContract(input, idempotencyKey, options.runtimeClient, trustedBinding.binding);
  } catch (error) {
    const code = errorCode(error);
    const transitionEvidence = errorTransitionEvidence(error, input.paymentRequiredEvidenceRef);
    if (code === "already_consumed" || code === "idempotency_duplicate_authority") {
      return mcpNonContractOutcome({
        outcome: "replay_refused",
        phase: "replay",
        reasonCodes: [code],
        nextAction: "read_evidence",
        commitState: transitionEvidence.commitState,
        metadataRef: input.metadataRef,
        evidenceRefs: transitionEvidence.evidenceRefs,
        challengeRef: `handshake://challenges/replay-refused/${encodeURIComponent(input.requestId)}`,
        correlationRef: input.correlationRef,
        idempotencyKey,
        proofRef: transitionEvidence.proofRef,
        refusalRef: transitionEvidence.refusalRef,
      });
    }
    if (code === "idempotency_key_params_mismatch") {
      const committedEvidence = transitionEvidence.proofRef !== null || transitionEvidence.refusalRef !== null;
      return mcpNonContractOutcome({
        outcome: "refused",
        phase: "proposal",
        reasonCodes: [code],
        nextAction: committedEvidence ? "read_evidence" : "recraft_request",
        commitState: transitionEvidence.commitState,
        metadataRef: input.metadataRef,
        evidenceRefs: transitionEvidence.evidenceRefs,
        challengeRef: `handshake://challenges/idempotency-params-mismatch/${encodeURIComponent(input.requestId)}`,
        correlationRef: input.correlationRef,
        idempotencyKey,
        proofRef: transitionEvidence.proofRef,
        refusalRef: transitionEvidence.refusalRef,
      });
    }
    if (transitionEvidence.proofRef !== null) {
      return mcpNonContractOutcome({
        outcome: "proof_gap",
        phase: "evidence",
        reasonCodes: [code],
        nextAction: "read_evidence",
        commitState: transitionEvidence.commitState,
        metadataRef: input.metadataRef,
        evidenceRefs: transitionEvidence.evidenceRefs,
        correlationRef: input.correlationRef,
        idempotencyKey,
        proofRef: transitionEvidence.proofRef,
        refusalRef: transitionEvidence.refusalRef,
      });
    }
    if (transitionEvidence.refusalRef !== null) {
      return mcpNonContractOutcome({
        outcome: "refused",
        phase: "proposal",
        reasonCodes: [code],
        nextAction: "read_evidence",
        commitState: transitionEvidence.commitState,
        metadataRef: input.metadataRef,
        evidenceRefs: transitionEvidence.evidenceRefs,
        correlationRef: input.correlationRef,
        idempotencyKey,
        proofRef: transitionEvidence.proofRef,
        refusalRef: transitionEvidence.refusalRef,
      });
    }
    return mcpNonContractOutcome({
      outcome: "tool_execution_error",
      phase: "tool_execution",
      reasonCodes: [code],
      nextAction: "stop",
      commitState: transitionEvidence.commitState,
      metadataRef: input.metadataRef,
      evidenceRefs: transitionEvidence.evidenceRefs,
      correlationRef: input.correlationRef,
      idempotencyKey,
      proofRef: transitionEvidence.proofRef,
      refusalRef: transitionEvidence.refusalRef,
    });
  }
}

async function proposeContract(
  input: ParsedMcpX402PaymentProposalInput,
  idempotencyKey: string,
  runtimeClient: McpRuntimeProposalClient,
  trustedBinding: McpTrustedProposalBinding,
): Promise<McpToolResult> {
  const resourceRef = x402ResourceRef(input);
  const parameters = x402Parameters(input, trustedBinding);
  const delegatedAuthorityRefs = [input.delegatedAuthorityBinding];
  const evidenceRefs = unique([
    input.paymentRequiredEvidenceRef,
    trustedBinding.gatewayReadinessRef,
    trustedBinding.policyVersionRef,
    ...serviceWorkflowEvidenceRefs(input),
    ...delegatedAuthorityEvidenceRefs(input),
  ]);
  const executionBlockDigest = await digestMcp({
    requestId: input.requestId,
    metadataDigest: input.metadataDigest,
    dispatchBoundaryRef: input.dispatchBoundaryRef,
    dispatchRef: input.dispatchRef,
    paymentRequirementsDigest: input.paymentRequirementsDigest,
    intendedRequestBodyPosture: input.intendedRequestBodyPosture,
    intendedRequestBodyDigest: input.intendedRequestBodyDigest,
    providerEnvironmentPosture: input.providerEnvironmentPosture,
    providerEnvironmentRef: input.providerEnvironmentRef,
    selectedPaymentRequirementIndex: input.selectedPaymentRequirementIndex,
    selectedPaymentRequirementDigest: input.selectedPaymentRequirementDigest,
    serviceWorkflowContextRefs: input.serviceWorkflowContextRefs ?? null,
    gatewayReadinessDigest: trustedBinding.gatewayReadinessDigest,
    policyVersionDigest: trustedBinding.policyVersionDigest,
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
    evidenceRefs: unique([input.metadataRef, ...evidenceRefs]),
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
    delegatedAuthorityRefs,
    expiresAt: input.contractExpiresAt,
    evidenceRefs,
  });

  const toolCallDraft = await runtimeClient.transitionToolCallDraft({
    toolCallDraftId: openedDraft.toolCallDraftId,
    nextDraftState: "finalized",
    parameters,
    nonSecretParamsSummary: parameters,
    delegatedAuthorityRefs,
    evidenceRefs,
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
      "mcp proposal supplied one bound delegated spend authority ref",
      "mcp runtime supplied trusted readiness and policy-version digests outside model input",
      "generated execution graph creation is not exposed by the role-scoped runtime surface",
    ],
    requiredEvidenceRefs: evidenceRefs,
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
      delegatedAuthorityRefs,
      purposeCode: "x402_paid_request",
      expectedSideEffectCodes: ["x402_payment_signature_created"],
      evidenceRefs,
      clearingEvidenceRefs: clearingEvidenceRefs(input),
      bounds: {
        endpointDomain: new URL(input.endpointUrl).hostname,
        payee: input.payee,
        payTo: input.payTo,
        network: input.network,
        token: input.token,
        asset: input.asset,
        maxAtomicAmountPerCall: trustedBinding.trustedMaxAtomicAmountPerCall,
        gatewayReadinessDigest: trustedBinding.gatewayReadinessDigest,
        policyVersionDigest: trustedBinding.policyVersionDigest,
      },
      idempotencyKey,
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
      idempotencyKey,
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
      idempotencyKey,
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
      proofRef: null,
      refusalRef: null,
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
      idempotencyKey,
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

function serviceWorkflowEvidenceRefs(input: ParsedMcpX402PaymentProposalInput): string[] {
  return input.serviceWorkflowContextRefs ? serviceWorkflowContextEvidenceRefs(input.serviceWorkflowContextRefs) : [];
}

function clearingEvidenceRefs(input: ParsedMcpX402PaymentProposalInput): { correlationRef?: string } {
  if (input.correlationRef) return { correlationRef: input.correlationRef };
  if (input.serviceWorkflowContextRefs) {
    return { correlationRef: serviceWorkflowContextCorrelationRef(input.serviceWorkflowContextRefs) };
  }
  return {};
}

async function deriveMcpX402IdempotencyKey(
  input: ParsedMcpX402PaymentProposalInput,
  trustedBinding: McpTrustedProposalBinding | null,
): Promise<string> {
  const digest = await digestMcp({
    schemaVersion: "handshake.mcp.x402.idempotency.v1",
    tenantId: input.tenantId,
    organizationId: input.organizationId,
    principalId: input.principalId,
    agentId: input.agentId,
    operatingEnvelopeId: input.operatingEnvelopeId,
    gatewayId: input.gatewayId,
    actionClass: "x402_payment.exact",
    endpointUrl: input.endpointUrl,
    intendedHttpMethod: input.intendedHttpMethod,
    intendedRequestUrl: input.intendedRequestUrl,
    intendedRequestBodyPosture: input.intendedRequestBodyPosture,
    intendedRequestBodyDigest: input.intendedRequestBodyDigest,
    selectedHeadersDigest: input.selectedHeadersDigest,
    providerEnvironmentPosture: input.providerEnvironmentPosture,
    providerEnvironmentRef: input.providerEnvironmentRef,
    x402Version: input.x402Version,
    x402Scheme: input.x402Scheme,
    payee: input.payee,
    payTo: input.payTo,
    network: input.network,
    token: input.token,
    asset: input.asset,
    atomicAmount: input.atomicAmount,
    paymentRequirementsDigest: input.paymentRequirementsDigest,
    selectedPaymentRequirementIndex: input.selectedPaymentRequirementIndex,
    selectedPaymentRequirementDigest: input.selectedPaymentRequirementDigest,
    serviceWorkflowContextRefs: input.serviceWorkflowContextRefs ?? null,
    delegatedAuthorityRefId: input.delegatedAuthorityBinding.delegatedAuthorityRefId,
    delegatedAuthorityRefDigest: input.delegatedAuthorityBinding.delegatedAuthorityRefDigest,
    delegatedAuthorityPolicyPackRef: input.delegatedAuthorityBinding.policyPackRef,
    delegatedAuthorityPolicyPackVersion: input.delegatedAuthorityBinding.policyPackVersion,
    gatewayReadinessDigest: trustedBinding?.gatewayReadinessDigest ?? null,
    policyVersionDigest: trustedBinding?.policyVersionDigest ?? null,
    sequenceNumber: input.sequenceNumber,
    requiredPriorActionContractIds: input.requiredPriorActionContractIds,
  });
  return `mcp-x402:${digest.slice("sha256:".length)}`;
}

function x402Parameters(
  input: ParsedMcpX402PaymentProposalInput,
  trustedBinding: McpTrustedProposalBinding,
): Record<string, McpJsonValue> {
  return {
    endpointUrl: input.endpointUrl,
    endpointDomain: new URL(input.endpointUrl).hostname,
    intendedHttpMethod: input.intendedHttpMethod,
    intendedRequestUrl: input.intendedRequestUrl,
    intendedRequestBodyPosture: input.intendedRequestBodyPosture,
    intendedRequestBodyDigest: input.intendedRequestBodyDigest,
    selectedHeadersDigest: input.selectedHeadersDigest,
    providerEnvironmentPosture: input.providerEnvironmentPosture,
    providerEnvironmentRef: input.providerEnvironmentRef,
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
    gatewayReadinessRef: trustedBinding.gatewayReadinessRef,
    gatewayReadinessDigest: trustedBinding.gatewayReadinessDigest,
    policyVersionRef: trustedBinding.policyVersionRef,
    policyVersionDigest: trustedBinding.policyVersionDigest,
  };
}

function trustedProposalBinding(options: ProposeMcpX402PaymentOptions): {
  binding: McpTrustedProposalBinding | null;
  reasonCodes: string[];
} {
  const reasonCodes: string[] = [];
  if (!options.trustedMaxAtomicAmountPerCall) reasonCodes.push("mcp_trusted_spend_bound_missing");
  if (!options.gatewayReadinessRef || !options.gatewayReadinessDigest) {
    reasonCodes.push("mcp_trusted_readiness_binding_missing");
  }
  if (!options.policyVersionRef || !options.policyVersionDigest) {
    reasonCodes.push("mcp_policy_version_binding_missing");
  }
  if (reasonCodes.length > 0) return { binding: null, reasonCodes };

  const parsed = z
    .strictObject({
      trustedMaxAtomicAmountPerCall: AtomicAmountSchema,
      gatewayReadinessRef: McpRefSchema,
      gatewayReadinessDigest: DigestSchema,
      policyVersionRef: McpRefSchema,
      policyVersionDigest: DigestSchema,
    })
    .safeParse({
      trustedMaxAtomicAmountPerCall: options.trustedMaxAtomicAmountPerCall,
      gatewayReadinessRef: options.gatewayReadinessRef,
      gatewayReadinessDigest: options.gatewayReadinessDigest,
      policyVersionRef: options.policyVersionRef,
      policyVersionDigest: options.policyVersionDigest,
    });
  if (!parsed.success) return { binding: null, reasonCodes: ["mcp_trusted_proposal_binding_invalid"] };
  return {
    binding: {
      ...parsed.data,
      gatewayReadinessDigest: parsed.data.gatewayReadinessDigest as `sha256:${string}`,
      policyVersionDigest: parsed.data.policyVersionDigest as `sha256:${string}`,
    },
    reasonCodes: [],
  };
}

function delegatedAuthorityEvidenceRefs(input: ParsedMcpX402PaymentProposalInput): string[] {
  return input.delegatedAuthorityBinding.evidenceExpectationRefs;
}

function mcpX402PostureRefusalReasonCodes(input: ParsedMcpX402PaymentProposalInput): string[] {
  const reasonCodes: string[] = [];
  if (input.intendedRequestBodyPosture === "digest_bound" && input.intendedRequestBodyDigest === null) {
    reasonCodes.push("x402_request_body_digest_missing");
  }
  if (["omitted", "unsupported"].includes(input.intendedRequestBodyPosture)) {
    reasonCodes.push("x402_request_body_posture_unsupported");
  }
  if (input.intendedRequestBodyPosture === "no_body" && input.intendedRequestBodyDigest !== null) {
    reasonCodes.push("x402_request_body_posture_mismatch");
  }
  if (input.providerEnvironmentPosture !== "local_reference_sandbox") {
    reasonCodes.push("x402_provider_environment_not_sandboxed");
  }
  return [...new Set(reasonCodes)].sort();
}

function x402ResourceRef(input: ParsedMcpX402PaymentProposalInput): string {
  const endpointDomain = new URL(input.endpointUrl).hostname;
  return `x402://${encodeURIComponent(input.network)}/${encodeURIComponent(input.payee)}/${encodeURIComponent(
    endpointDomain,
  )}`;
}

function preContractInstallHealthRef(requestId: string): string {
  return `handshake://health/install/pre-contract/${encodeURIComponent(requestId)}`;
}

function compareAtomic(left: string, right: string): number {
  const normalizedLeft = left.replace(/^0+(?=\d)/, "");
  const normalizedRight = right.replace(/^0+(?=\d)/, "");
  if (normalizedLeft.length !== normalizedRight.length) return normalizedLeft.length > normalizedRight.length ? 1 : -1;
  return normalizedLeft.localeCompare(normalizedRight);
}

function unique<T>(values: readonly T[]): T[] {
  return [...new Set(values)];
}

function errorCode(error: unknown): string {
  if (typeof error === "object" && error !== null && "code" in error && typeof error.code === "string") {
    return error.code;
  }
  return "mcp_runtime_bridge_error";
}

function errorCommitState(error: unknown): "not_started" | "protocol_recorded" | "ambiguous" {
  if (typeof error === "object" && error !== null && "commitState" in error) {
    if (error.commitState === "committed" || error.commitState === "accepted") return "protocol_recorded";
    if (error.commitState === "unknown" || error.commitState === "ambiguous") return "ambiguous";
    if (
      error.commitState === "not_started" ||
      error.commitState === "not_committed" ||
      error.commitState === "not_applicable"
    ) {
      return "not_started";
    }
  }
  return "not_started";
}

function errorTransitionEvidence(
  error: unknown,
  paymentRequiredEvidenceRef: string,
): {
  commitState: "not_started" | "protocol_recorded" | "ambiguous";
  evidenceRefs: string[];
  proofRef: string | null;
  refusalRef: string | null;
} {
  const proofRef = errorStringField(error, "proofRef");
  const refusalRef = errorStringField(error, "refusalRef");
  return {
    commitState: errorCommitState(error),
    evidenceRefs: [
      paymentRequiredEvidenceRef,
      ...(proofRef ? [`handshake://evidence/proof-gaps/${encodeURIComponent(proofRef)}`] : []),
      ...(refusalRef ? [`handshake://evidence/refusals/${encodeURIComponent(refusalRef)}`] : []),
    ],
    proofRef,
    refusalRef,
  };
}

function errorStringField(error: unknown, field: string): string | null {
  if (typeof error !== "object" || error === null) return null;
  const value = (error as Record<string, unknown>)[field];
  return typeof value === "string" && value.length > 0 ? value : null;
}
