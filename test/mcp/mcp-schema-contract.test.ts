import { describe, expect, it } from "bun:test";
import { mcpCatalogSnapshot, mcpProposalTools, mcpResourceTemplates } from "../../src/mcp/catalog";
import { McpStructuredContentSchema } from "../../src/mcp/output";
import { McpX402PaymentProposalInputSchema } from "../../src/mcp/x402-proposal";
import { surfaceOutcomeBase } from "../../src/surfaces/outcome";

describe("MCP schema contract", () => {
  it("exposes read resources plus exactly one x402 proposal tool", () => {
    const catalog = mcpCatalogSnapshot();

    expect(catalog.tools.map((tool) => tool.name)).toEqual(["handshake.actions.x402_payment.propose"]);
    expect(catalog.supportsParallelToolCalls).toBe(false);
    expect(mcpProposalTools).toHaveLength(1);
    expect(mcpResourceTemplates.map((resource) => resource.uriTemplate)).toEqual([
      "handshake://metadata/actions/{actionClass}",
      "handshake://challenges/{challengeId}",
      "handshake://evidence/contracts/{actionContractId}",
      "handshake://evidence/envelopes/{actionContractId}",
      "handshake://evidence/receipts/{receiptId}/timeline",
      "handshake://evidence/idempotency/{actionContractId}",
      "handshake://health/install/{actionContractId}",
      "handshake://health/install/pre-contract/{requestId}",
      "handshake://certificates/{authorityCertificateId}",
    ]);
    expect(catalog).toMatchObject({
      authorityCreated: false,
      greenlightCreated: false,
      gatewayCheckPerformed: false,
      mutationAttempted: false,
      credentialMaterialIncluded: false,
      mutationCommandIncluded: false,
      rawInternalRecordIncluded: false,
      receiptExportCreated: false,
      authorityCertificateMinted: false,
    });
  });

  it("rejects unknown and authority-shaped proposal input fields", () => {
    const base = validProposalInput();
    expect(McpX402PaymentProposalInputSchema.safeParse(base).success).toBe(true);

    for (const forbiddenField of [
      "PaymentPayload",
      "PAYMENT-SIGNATURE",
      "policyDecisionRef",
      "greenlightRef",
      "gatewayCheckRef",
      "mutationAttemptRef",
      "receiptExportRef",
      "rawInternalRecord",
      "privateKey",
      "signerRef",
      "walletRef",
      "certificateMintRequest",
    ]) {
      expect(McpX402PaymentProposalInputSchema.safeParse({ ...base, [forbiddenField]: "x" }).success).toBe(false);
    }
  });

  it("requires explicit x402 request-body and provider posture", () => {
    const valid = validProposalInput();
    expect(McpX402PaymentProposalInputSchema.safeParse(valid).success).toBe(true);
    expect(valid).toMatchObject({
      intendedRequestBodyPosture: "no_body",
      intendedRequestBodyDigest: null,
      providerEnvironmentPosture: "local_reference_sandbox",
      providerEnvironmentRef: null,
    });

    const missingBodyPosture: Partial<ReturnType<typeof validProposalInput>> = { ...valid };
    const missingProviderPosture: Partial<ReturnType<typeof validProposalInput>> = { ...valid };
    const missingProviderRef: Partial<ReturnType<typeof validProposalInput>> = { ...valid };
    delete missingBodyPosture.intendedRequestBodyPosture;
    delete missingProviderPosture.providerEnvironmentPosture;
    delete missingProviderRef.providerEnvironmentRef;

    expect(McpX402PaymentProposalInputSchema.safeParse(missingBodyPosture).success).toBe(false);
    expect(McpX402PaymentProposalInputSchema.safeParse(missingProviderPosture).success).toBe(false);
    expect(McpX402PaymentProposalInputSchema.safeParse(missingProviderRef).success).toBe(false);
  });

  it("keeps every structured outcome non-authority and model-parseable", () => {
    const outcomes = [
      "refused",
      "review_required",
      "proof_gap",
      "install_not_ready",
      "gateway_offline",
      "metadata_stale",
      "tools_list_changed",
      "replay_refused",
      "raw_sibling_bypass_detected",
      "tool_execution_error",
    ] as const;

    for (const outcome of outcomes) {
      const parsed = McpStructuredContentSchema.parse(
        surfaceOutcomeBase({
          outcome,
          phase: outcome === "tools_list_changed" || outcome === "metadata_stale" ? "freshness" : "proposal",
          reasonCodes: [`${outcome}_reason`],
          nextAction: outcome === "metadata_stale" ? "reload_metadata" : "recraft_request",
          metadataRef: "handshake://metadata/actions/x402_payment.exact",
          evidenceRefs: ["evidence:test"],
          challengeRef: `handshake://challenges/${outcome}`,
          idempotencyKey: "idem:test",
        }),
      );

      expect(parsed).toMatchObject({
        outcome,
        authorityCreated: false,
        greenlightCreated: false,
        gatewayCheckPerformed: false,
        mutationAttempted: false,
        credentialMaterialIncluded: false,
        mutationCommandIncluded: false,
        rawInternalRecordIncluded: false,
        receiptExportCreated: false,
        authorityCertificateMinted: false,
        greenlightRef: null,
        gatewayCheckRef: null,
        mutationAttemptRef: null,
      });
      expect(parsed.nextAction.length).toBeGreaterThan(0);
    }
  });
});

export function validProposalInput() {
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
    dispatchRef: "dispatch:demo:1",
    metadataRef: "handshake://metadata/actions/x402_payment.exact",
    metadataDigest: digest(1),
    toolCatalogRef: "catalog:tools:x402",
    toolCatalogDigest: digest(2),
    actionCatalogRef: "catalog:actions:x402",
    gatewayRegistryRef: "gateway-registry:x402",
    gatewayRegistryDigest: digest(3),
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
    selectedHeadersDigest: digest(4),
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
    paymentRequirementsDigest: digest(5),
    paymentRequiredEvidenceRef: "evidence:x402-payment-required:demo",
    selectedPaymentRequirementIndex: 1,
    selectedPaymentRequirementDigest: digest(6),
    sdkPackageVersions: { "@x402/core": "2.12.0" },
  };
}

export function digest(seed: number): `sha256:${string}` {
  return `sha256:${seed.toString(16).padStart(64, "0")}`;
}
