import { digestMcp } from "./digest";
import type { McpToolResult } from "./output";
import type { McpEvidenceResourceClient, McpResourceRead } from "./resources";
import type { McpRuntimeProposalClient, McpX402PaymentProposalInput } from "./x402-proposal";

export const MCP_REFERENCE_METADATA_URI = "handshake://metadata/actions/x402_payment.exact" as const;
export const MCP_REFERENCE_RECEIPT_TIMELINE_URI = "handshake://evidence/receipts/rcp_mcp_gap/timeline" as const;
export const MCP_REFERENCE_TRUSTED_MAX_ATOMIC_AMOUNT = "2000" as const;

export type McpReferenceRuntimeCall = { readonly name: string; readonly input: unknown };

export async function referenceProposalInput(
  metadataDigest: `sha256:${string}`,
  overrides: Partial<McpX402PaymentProposalInput> = {},
): Promise<McpX402PaymentProposalInput> {
  return {
    requestId: "req_mcp_x402_1",
    tenantId: "ten_demo",
    organizationId: "org_demo",
    principalId: "principal_demo",
    agentId: "agent_demo",
    principalIntentRef: "intent:demo",
    generatedCodeOrSpecRef: "code:demo",
    runtimeAdapterRef: "adapter:mcp",
    runId: "run_demo",
    dispatchBoundaryRef: "dispatch-boundary:demo",
    dispatchRef: "dispatch:mcp:1",
    metadataRef: MCP_REFERENCE_METADATA_URI,
    metadataDigest,
    toolCatalogRef: "catalog:tools:x402",
    toolCatalogDigest: await digestMcp({ catalog: "tools", actionClass: "x402_payment.exact" }),
    actionCatalogRef: "catalog:actions:x402",
    gatewayRegistryRef: "registry:x402",
    gatewayRegistryDigest: await digestMcp({ registry: "x402", entry: "reference" }),
    operatingEnvelopeId: "env_demo",
    toolCapabilityId: "tool_x402_payment",
    actionTypeId: "atype_x402_payment",
    gatewayRegistryEntryId: "gwy_entry_x402",
    gatewayId: "gateway_x402",
    contractExpiresAt: "2026-05-22T12:00:00.000Z",
    idempotencyKey: "idem:x402:demo",
    endpointUrl: "https://seller.example/protected",
    intendedHttpMethod: "GET",
    intendedRequestUrl: "https://seller.example/protected",
    intendedRequestBodyPosture: "no_body",
    intendedRequestBodyDigest: null,
    selectedHeadersDigest: await digestMcp({ headers: "selected" }),
    providerEnvironmentPosture: "local_reference_sandbox",
    providerEnvironmentRef: null,
    payee: "0x0000000000000000000000000000000000000001",
    payTo: "0x0000000000000000000000000000000000000001",
    network: "base-sepolia",
    token: "USDC",
    asset: "USDC",
    atomicAmount: "1000",
    x402EvidenceProfile: "official_payment_required",
    x402Version: 2,
    x402Scheme: "exact",
    maxTimeoutSeconds: 60,
    paymentRequirementsDigest: await digestMcp({ paymentRequirements: "reference" }),
    paymentRequiredEvidenceRef: "evidence:x402-payment-required:reference",
    selectedPaymentRequirementIndex: 1,
    selectedPaymentRequirementDigest: await digestMcp({ selectedPaymentRequirementIndex: 1 }),
    sdkPackageVersions: { "@x402/core": "2.12.0" },
    ...overrides,
  };
}

export function referenceRuntimeClient(options: { readonly contractFailureCode?: string } = {}): {
  readonly client: McpRuntimeProposalClient;
  readonly calls: McpReferenceRuntimeCall[];
} {
  const calls: McpReferenceRuntimeCall[] = [];
  return {
    calls,
    client: {
      async createRuntimeExecution(input) {
        calls.push({ name: "createRuntimeExecution", input });
        return { runtimeExecutionId: "rex_mcp_reference", createdAt: "2026-05-22T12:00:00.000Z" } as never;
      },
      async createToolCallDraft(input) {
        calls.push({ name: "createToolCallDraft", input });
        return { toolCallDraftId: "tcd_mcp_reference_open" } as never;
      },
      async transitionToolCallDraft(input) {
        calls.push({ name: "transitionToolCallDraft", input });
        return { toolCallDraftId: "tcd_mcp_reference_final" } as never;
      },
      async compileIntent(input) {
        calls.push({ name: "compileIntent", input });
        return {
          intentCompilationId: "int_mcp_reference",
          uncertaintyMarkers: [],
          overreachReasonCodes: [],
          candidateAction: {
            candidateActionId: "can_mcp_reference",
            candidateStatus: "contractable",
            candidateDigest: await digestMcp({ candidate: "mcp_reference" }),
            refusalReasonCodes: [],
          },
        } as never;
      },
      async proposeActionContract(input) {
        calls.push({ name: "proposeActionContract", input });
        if (options.contractFailureCode) {
          throw { code: options.contractFailureCode, commitState: "accepted" };
        }
        return {
          actionContractId: "act_mcp_reference_x402",
          actionContractDigest: await digestMcp({ actionContract: "mcp_reference_x402" }),
          paramsDigest: await digestMcp({ params: "mcp_reference_x402" }),
        } as never;
      },
    },
  };
}

export function referenceEvidenceClient(): McpEvidenceResourceClient {
  return {
    async getContractEvidenceProjection(actionContractId: string) {
      return {
        projection: "contract",
        actionContractId,
        actionClass: "x402_payment.exact",
        evidenceProfile: "official_payment_required",
        selectedPaymentRequirementIndex: 1,
        omittedFields: ["credential_fields", "internal_record"],
      };
    },
    async getAgentTransactionEnvelopeProjection(actionContractId: string) {
      return {
        projection: "agent_transaction_envelope",
        actionContractId,
        runtimeEvidenceStatus: "recorded",
        gatewayAdmissionStatus: "not_started",
        downstreamOutcomeStatus: "not_started",
        redactionProfileRef: "reference-transcript-redacted",
      };
    },
    async getReceiptTimelineProjection(receiptId: string) {
      return {
        projection: "receipt_timeline",
        receiptId,
        gatewayAdmissionStatus: "ambiguous",
        downstreamOutcomeStatus: "unknown",
        terminalPosture: "proof_gap",
        proofGapReasonCodes: ["downstream_evidence_missing"],
      };
    },
    async getIdempotencyRecoveryProjection(actionContractId: string) {
      return {
        projection: "idempotency",
        actionContractId,
        replayPosture: "read_only",
      };
    },
    async getProtectedPathInstallHealthProjection(actionContractId: string) {
      return {
        projection: "install_health",
        actionContractId,
        installPosture: "reference_only",
      };
    },
  };
}

export function metadataDigestFrom(read: McpResourceRead): `sha256:${string}` {
  const payload = read.payload;
  if (
    typeof payload === "object" &&
    payload !== null &&
    "metadataDigest" in payload &&
    typeof payload.metadataDigest === "string" &&
    /^sha256:[a-f0-9]{64}$/.test(payload.metadataDigest)
  ) {
    return payload.metadataDigest as `sha256:${string}`;
  }
  throw new Error("Reference metadata read did not include a valid digest.");
}

export function actionContractIdFrom(result: McpToolResult): string {
  if (result.structuredContent.outcome !== "action_contract_proposed") {
    throw new Error(
      `Reference proposal did not create an action contract candidate: ${result.structuredContent.outcome}`,
    );
  }
  return result.structuredContent.actionContractId;
}
