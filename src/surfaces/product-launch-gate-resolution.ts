import { z } from "zod";

const NonEmptyStringSchema = z.string().min(1);

export const ProductLaunchGateResolutionStatusSchema = z.enum([
  "resolved_selected",
  "resolved_raised_bar",
  "resolved_blocked",
  "resolved_cut_line",
]);
export type ProductLaunchGateResolutionStatus = z.infer<typeof ProductLaunchGateResolutionStatusSchema>;

export const ProductLaunchGateIdSchema = z.enum([
  "first_external_runtime_transcript",
  "external_product_custody_threshold",
  "distribution_bar",
  "first_buyer_segment",
  "terminal_certificate_prominence",
  "auth_md_x402_expansion_trigger",
  "live_external_provider_x402_proof",
  "package_provenance_npm_attestation",
]);
export type ProductLaunchGateId = z.infer<typeof ProductLaunchGateIdSchema>;

export const ProductLaunchGateResolutionSchema = z.strictObject({
  gateId: ProductLaunchGateIdSchema,
  status: ProductLaunchGateResolutionStatusSchema,
  decision: NonEmptyStringSchema,
  launchLanguageBoundary: NonEmptyStringSchema,
  requiredEvidence: z.array(NonEmptyStringSchema).min(1),
  currentEvidence: z.array(NonEmptyStringSchema),
  blockerReasonCodes: z.array(NonEmptyStringSchema),
  nonClaims: z.array(NonEmptyStringSchema).min(1),
});
export type ProductLaunchGateResolution = z.infer<typeof ProductLaunchGateResolutionSchema>;

export const productLaunchGateResolutions = ProductLaunchGateResolutionSchema.array()
  .length(ProductLaunchGateIdSchema.options.length)
  .parse([
    {
      gateId: "first_external_runtime_transcript",
      status: "resolved_selected",
      decision:
        "Codex-local is the first live runtime target, and run-local evidence now shows a fresh Codex host attempted handshake.actions.x402_payment.propose through a handshake_x402 MCP server entry pinned to the current 0.2.8 local artifact.",
      launchLanguageBoundary:
        "Codex-local host-origin MCP tool invocation may be claimed for the pinned artifact. Do not claim native certification, host-wide containment, policy authority, gateway checks, signer use, payment material, customer gateway custody, live paid execution, or registry discovery.",
      requiredEvidence: [
        "read /Users/joelchan/.codex/config.toml",
        "observe mcp_servers.handshake_x402 in Codex config",
        "exercise handshake.actions.x402_payment.propose through the configured host",
        "record proposal/readback transcript and raw sibling posture",
      ],
      currentEvidence: [
        "live /Users/joelchan/.codex/config.toml readback found handshake_x402 pinned to handshake-protocol-kernel@0.2.8 artifact sha256 c80c3985a9c695c6008c9c9eb5323085e2dcfa262f9c090aab2a78056e6bcf42",
        "fresh Codex host observed and attempted handshake.actions.x402_payment.propose; empty-object input failed schema validation before authority or mutation",
      ],
      blockerReasonCodes: [],
      nonClaims: ["not_authority_by_host_invocation", "not_host_wide_containment", "not_native_codex_certification"],
    },
    {
      gateId: "external_product_custody_threshold",
      status: "resolved_raised_bar",
      decision:
        "External production wording requires customer-gateway custody evidence. Provider custody is a stronger later claim, not a prerequisite for the first customer-owned gateway product.",
      launchLanguageBoundary:
        "Local/reference signer custody can support local proof only. External product language must say customer-gateway custody until provider lease, rotation, revocation, and monitoring evidence exists.",
      requiredEvidence: [
        "customer gateway owns signer or mutation credential",
        "credential ref digest bound into action contract",
        "gateway custody proof packet is fresh and externally attributable to the customer gateway",
        "credential resolution happens only after VerifiedGatewayCheck",
      ],
      currentEvidence: [
        "local/reference gateway-held signer path is proven",
        "no provider/customer live custody packet has been verified in this checkout",
      ],
      blockerReasonCodes: ["customer_gateway_custody_packet_missing"],
      nonClaims: ["not_provider_custody", "not_hosted_custody", "not_wallet_provider_operation"],
    },
    {
      gateId: "distribution_bar",
      status: "resolved_blocked",
      decision:
        "Launch distribution requires npm publication plus official MCP Registry acceptance and lookup verification. npm alone is distribution evidence, not the full launch bar.",
      launchLanguageBoundary:
        "Public npm availability can be claimed for the exact published version. MCP Registry discoverability remains blocked until the official registry returns the server by name and version.",
      requiredEvidence: [
        "npm registry latest returns the intended version",
        "official MCP Registry accepts server.json metadata",
        "GET /v0.1/servers/{serverName}/versions/latest returns the server",
        "search endpoint returns the server by package or MCP name",
      ],
      currentEvidence: [
        "npm registry latest returned handshake-protocol-kernel@0.2.8 with registry signatures",
        "trusted-publish workflow completed successfully for expected_version=0.2.8 and published GitHub Actions provenance",
        "clean installed-artifact smoke passed for handshake-protocol-kernel@0.2.8",
        "official MCP Registry GET by io.github.CreasyBear/handshake-protocol-kernel returned 404 Server not found",
        "official MCP Registry search for handshake-protocol-kernel returned an empty server list",
      ],
      blockerReasonCodes: ["mcp_registry_submission_not_accepted", "mcp_registry_discoverability_not_verified"],
      nonClaims: ["not_registry_discoverable", "not_marketplace_certified", "not_authority_by_publication"],
    },
    {
      gateId: "first_buyer_segment",
      status: "resolved_selected",
      decision:
        "The first buyer segment is agent builders and engineering organizations delegating paid x402 resource calls to agents and needing bounded spend, signer custody, replay refusal, and reconstructable evidence.",
      launchLanguageBoundary:
        "Agentic.Market services are the first paid-resource corpus for validation. Services exposing paid APIs are not the first buyer unless Handshake ships a real x402-payable seller endpoint.",
      requiredEvidence: [
        "one paid-resource corpus with listed x402 endpoints",
        "one delegated buyer-side gateway policy",
        "one receipt/refusal/proof-gap readback that a buyer operator can inspect",
      ],
      currentEvidence: [
        "Agentic.Market service page and live regimeshift.xyz 402 challenge establish a paid-resource corpus",
      ],
      blockerReasonCodes: ["funded_buyer_gateway_signed_retry_missing"],
      nonClaims: ["not_seller_middleware", "not_facilitator_operation", "not_agentic_market_listing"],
    },
    {
      gateId: "terminal_certificate_prominence",
      status: "resolved_selected",
      decision:
        "Terminal certificates should be prominent after a terminal event in receipt/support/readback surfaces, but never be the hero primitive or any kind of permission artifact.",
      launchLanguageBoundary:
        "Use certificate UX as terminal evidence for receipts, durable refusals, proof gaps, and replay refusals. Do not use it to imply authorization, hosted trust, cross-org trust, or settlement.",
      requiredEvidence: [
        "certificate exists only after terminal event",
        "verification path is read-only",
        "UI/copy states certificate is terminal evidence, not permission",
      ],
      currentEvidence: ["local AuthorityCertificate primitive and verifier are landed as terminal evidence only"],
      blockerReasonCodes: ["portable_cross_org_trust_not_proven"],
      nonClaims: ["not_permission", "not_cross_org_trust", "not_settlement_finality"],
    },
    {
      gateId: "auth_md_x402_expansion_trigger",
      status: "resolved_raised_bar",
      decision:
        "auth.md + x402 is the first expansion candidate after buyer-side x402 protected spend, but it enters only through an admission packet that keeps auth.md credential issuance as provenance and routes each paid credentialed call through exact contract, policy, one-use greenlight, and gateway check.",
      launchLanguageBoundary:
        "auth.md may be called credential discovery, registration, provenance, and lifecycle evidence. It must not be called authority until a concrete auth.md protected API call clears the same Handshake gateway chain.",
      requiredEvidence: [
        "auth.md discovery and authorization-server metadata digests",
        "gateway credential ref digest for the issued credential",
        "revocation and lifecycle status checked before policy and gateway",
        "x402 policy decision, one-use greenlight, gateway check, and post-gate signer evidence",
        "interlock packet has post_gate_only ordering and no raw credential or payment material",
      ],
      currentEvidence: [
        "auth_md_x402_interlock_packet.v0 exists and remains non-authority",
        "runtime auth.md protected API call fixtures already refuse unsafe generated shapes and raw sibling calls",
      ],
      blockerReasonCodes: ["auth_md_composite_execution_not_admitted", "funded_x402_signed_retry_missing"],
      nonClaims: [
        "auth_md_is_not_authority",
        "not_credential_resolution_before_gateway",
        "not_composite_execution_ready",
      ],
    },
    {
      gateId: "live_external_provider_x402_proof",
      status: "resolved_blocked",
      decision:
        "A live external x402 provider proof is required before stronger launch language. The first live proof target is an Agentic.Market-listed endpoint, but paid retry remains blocked until a funded customer gateway signer is available.",
      launchLanguageBoundary:
        "Live 402 challenge evidence may be claimed. Do not claim live paid execution, downstream finality, settlement, provider custody, or buyer-side production readiness until signed retry and receipt/readback pass through Handshake.",
      requiredEvidence: [
        "live listed endpoint returns 402 Payment Required with payment-required header",
        "Handshake decodes the live payment requirement into proposal evidence",
        "funded customer gateway signer creates payment material only after VerifiedGatewayCheck",
        "signed retry result is recorded as receipt, refusal, or proof gap",
      ],
      currentEvidence: [
        "GET https://regimeshift.xyz/api/v1/asset/eth/vrp returned HTTP 402 with payment-required header on 2026-05-25",
        "Agentic.Market service page for regimeshift.xyz is reachable",
      ],
      blockerReasonCodes: ["funded_customer_gateway_signer_missing", "live_signed_retry_not_exercised"],
      nonClaims: ["not_live_paid_execution", "not_settlement_finality", "not_provider_custody"],
    },
    {
      gateId: "package_provenance_npm_attestation",
      status: "resolved_selected",
      decision:
        "Package provenance for 0.2.8 is satisfied by npm trusted publishing through the public artifact repository workflow.",
      launchLanguageBoundary:
        "Published 0.2.8 can be described as npm-available with registry signature metadata, GitHub Actions provenance, and clean installed-artifact smoke. Do not describe publication as authority, supply-chain safety, MCP Registry discoverability, or hosted operation.",
      requiredEvidence: [
        "npm latest returns the intended product version",
        "npm dist.integrity and dist.signatures are recorded",
        "provenance posture is trusted publishing configured or explicitly accepted with risk",
        "clean install smoke passes against the newly published artifact",
      ],
      currentEvidence: [
        "npm latest returned 0.2.8 with dist.integrity and dist.signatures",
        "trusted-publish workflow succeeded for expected_version=0.2.8",
        "npm publish logged GitHub Actions provenance and Sigstore transparency log index 1628227940",
        "clean installed-artifact smoke passed for handshake-protocol-kernel@0.2.8",
      ],
      blockerReasonCodes: [],
      nonClaims: ["not_authority_by_publication", "not_supply_chain_safety", "not_npm_audit_replacement"],
    },
  ]);

export function productLaunchGateResolutionFor(gateId: ProductLaunchGateId): ProductLaunchGateResolution {
  const resolution = productLaunchGateResolutions.find((candidate) => candidate.gateId === gateId);
  if (!resolution) throw new Error(`Unknown product launch gate: ${gateId}`);
  return resolution;
}
