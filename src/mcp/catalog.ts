import { z } from "zod";
import { McpStructuredContentSchema, MCP_SCHEMA_VERSION } from "./output";
import { McpX402PaymentProposalInputSchema } from "./x402-proposal";

export const MCP_X402_PAYMENT_PROPOSE_TOOL = "handshake.actions.x402_payment.propose" as const;

export const mcpServiceWorkflowBoundary = {
  acceptsWorkflowHandleContext: true,
  workflowHandleCreatesAuthority: false,
  freshActionContractRequired: true,
  admissionCreatesPolicyDecision: false,
  admissionCreatesGreenlight: false,
  admissionPerformsGatewayCheck: false,
  handlePermitsMutation: false,
  handleExportsReceipt: false,
} as const;

export const mcpResourceTemplates = [
  {
    uriTemplate: "handshake://metadata/actions/{actionClass}",
    purpose: "discover_proposal_shape",
    readOnly: true,
    authorityCreated: false,
    projectionStatus: "source_catalog",
  },
  {
    uriTemplate: "handshake://challenges/{challengeId}",
    purpose: "explain_refusal_or_recraft_boundary",
    readOnly: true,
    authorityCreated: false,
    projectionStatus: "challenge_ref",
  },
  {
    uriTemplate: "handshake://evidence/contracts/{actionContractId}",
    purpose: "read_redacted_contract_evidence",
    readOnly: true,
    authorityCreated: false,
    projectionStatus: "evidence_client",
  },
  {
    uriTemplate: "handshake://evidence/envelopes/{actionContractId}",
    purpose: "read_redacted_agent_transaction_envelope",
    readOnly: true,
    authorityCreated: false,
    projectionStatus: "evidence_client",
  },
  {
    uriTemplate: "handshake://evidence/receipts/{receiptId}/timeline",
    purpose: "read_gateway_and_downstream_timeline",
    readOnly: true,
    authorityCreated: false,
    projectionStatus: "evidence_client",
  },
  {
    uriTemplate: "handshake://evidence/idempotency/{actionContractId}",
    purpose: "read_idempotency_and_replay_evidence",
    readOnly: true,
    authorityCreated: false,
    projectionStatus: "evidence_client",
  },
  {
    uriTemplate: "handshake://health/install/{actionContractId}",
    purpose: "read_protected_path_install_health",
    readOnly: true,
    authorityCreated: false,
    projectionStatus: "evidence_client",
  },
  {
    uriTemplate: "handshake://health/install/pre-contract/{requestId}",
    purpose: "read_pre_contract_install_health",
    readOnly: true,
    authorityCreated: false,
    projectionStatus: "source_catalog",
  },
  {
    uriTemplate: "handshake://certificates/{authorityCertificateId}",
    purpose: "read_terminal_certificate_reference",
    readOnly: true,
    authorityCreated: false,
    projectionStatus: "reference_only",
  },
] as const;

export const mcpProposalTools = [
  {
    name: MCP_X402_PAYMENT_PROPOSE_TOOL,
    description: "Propose one exact x402 protected action. This does not authorize or execute the action.",
    inputSchema: z.toJSONSchema(McpX402PaymentProposalInputSchema, {
      target: "draft-2020-12",
      unrepresentable: "any",
    }),
    outputSchema: z.toJSONSchema(McpStructuredContentSchema, {
      target: "draft-2020-12",
      unrepresentable: "any",
    }),
    annotations: {
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: false,
      readOnlyHint: false,
    },
  },
] as const;

export function mcpCatalogSnapshot() {
  return {
    schemaVersion: MCP_SCHEMA_VERSION,
    resources: mcpResourceTemplates,
    tools: mcpProposalTools,
    serviceWorkflowBoundary: mcpServiceWorkflowBoundary,
    supportsParallelToolCalls: false,
    authorityCreated: false,
    gatewayCheckPerformed: false,
    greenlightCreated: false,
    mutationAttempted: false,
    credentialMaterialIncluded: false,
    mutationCommandIncluded: false,
    rawInternalRecordIncluded: false,
    receiptExportCreated: false,
    authorityCertificateMinted: false,
  };
}
