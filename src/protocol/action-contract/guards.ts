import type { GatewayRegistryEntry, OperatingEnvelope } from "../catalog-envelope";
import type { IntentCompilationRecord } from "../intent-compilation";
import { fail, ok, type TransitionGuardResult } from "../transition-guards";

export function guardActionProposal(input: {
  tenantId: string;
  organizationId: string;
  principalId: string;
  agentId: string;
  runId: string;
  envelopeId: string;
  gatewayId: string;
  compilation: IntentCompilationRecord;
  envelope: OperatingEnvelope;
  gateway: GatewayRegistryEntry;
}): TransitionGuardResult {
  if (input.compilation.uncertaintyMarkers.length > 0 || input.compilation.overreachReasonCodes.length > 0) {
    return fail(
      "intent_compilation_not_contractable",
      "Intent compilation has uncertainty or overreach markers; no action contract may be emitted.",
    );
  }
  if (input.compilation.operatingEnvelopeId !== input.envelope.envelopeId || input.envelopeId !== input.envelope.envelopeId) {
    return fail("invalid_transition_envelope_mismatch", "Action contract must use the envelope pinned by the intent compilation.");
  }
  if (input.gateway.gatewayId !== input.gatewayId) {
    return fail("gateway_registry_mismatch", "Action contract gateway must match the durable gateway registry entry.");
  }
  if (input.gateway.receiptCapabilityStatus !== "available" || input.gateway.isolationCheckCapabilityStatus !== "available") {
    return fail("gateway_not_enforcing", "Gateway registry entry does not prove receipt and isolation check capability.");
  }
  if (
    input.tenantId !== input.compilation.tenantId ||
    input.tenantId !== input.envelope.tenantId ||
    input.tenantId !== input.gateway.tenantId ||
    input.organizationId !== input.compilation.organizationId ||
    input.organizationId !== input.envelope.organizationId ||
    input.organizationId !== input.gateway.organizationId
  ) {
    return fail("invalid_transition_scope_mismatch", "Action contract scope must match compilation, envelope, and gateway scope.");
  }
  if (
    input.principalId !== input.compilation.principalId ||
    input.principalId !== input.envelope.principalId ||
    input.agentId !== input.compilation.agentId ||
    input.agentId !== input.envelope.agentId ||
    input.runId !== input.compilation.runId
  ) {
    return fail("invalid_transition_actor_mismatch", "Action contract actor bindings must match compilation and envelope.");
  }
  return ok();
}
