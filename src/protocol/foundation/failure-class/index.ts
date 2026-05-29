import { z } from "zod";
import { HandshakeProtocolError } from "../errors";
import { resolveProtocolReasonCodeMetadata } from "../reason-codes";

export const FailureClassSchema = z.enum([
  "auth",
  "hosted_admission",
  "protected_action_refusal",
  "proof_gap",
  "replay_refusal",
  "stale_admission",
  "internal",
]);

export type FailureClass = z.infer<typeof FailureClassSchema>;

const internalMisconfigurationCodes = new Set([
  "caller_auth_not_configured",
  "hosted_admission_config_not_configured",
  "hosted_admission_config_invalid",
  "hosted_caller_verifier_not_configured",
  "durable_store_unavailable",
]);

const mcpBindingReasonCodes = new Set([
  "mcp_trusted_spend_bound_missing",
  "mcp_trusted_readiness_binding_missing",
  "mcp_policy_version_binding_missing",
  "mcp_trusted_proposal_binding_invalid",
]);

const mcpInstallReasonPrefix = "mcp_install_";

function isStaleHostedAdmissionCode(code: string): boolean {
  return code === "hosted_caller_identity_stale";
}

function isAuthReasonCode(code: string): boolean {
  return (
    code.startsWith("caller_auth_") ||
    code.startsWith("hosted_caller_auth_") ||
    code === "caller_auth_required" ||
    code === "caller_auth_forbidden"
  );
}

function isHostedAdmissionReasonCode(code: string): boolean {
  return code.startsWith("hosted_") && !isStaleHostedAdmissionCode(code);
}

export function classifyFailureClassFromProtocolError(error: HandshakeProtocolError): FailureClass {
  const code = error.code;
  if (code === "recovery_terminal_conflict") {
    return error.metadata.proofRef ? "proof_gap" : "protected_action_refusal";
  }
  if (internalMisconfigurationCodes.has(code)) return "internal";

  if (code.startsWith("caller_auth_")) return "auth";
  if (code.startsWith("hosted_")) {
    return isStaleHostedAdmissionCode(code) ? "stale_admission" : "hosted_admission";
  }
  if (code.includes("replay") || code === "idempotency_duplicate_authority" || code === "generated_execution_graph_nonce_replay") {
    return "replay_refusal";
  }

  const metadata = resolveProtocolReasonCodeMetadata(code);
  if (metadata) {
    switch (metadata.kind) {
      case "refusal":
        return "protected_action_refusal";
      case "proof_gap":
        return "proof_gap";
      case "gateway_decision":
        return code.includes("replay") ? "replay_refusal" : "protected_action_refusal";
      case "policy_decision":
        return code.includes("refusal") || code.includes("refused") ? "protected_action_refusal" : "proof_gap";
      case "isolation":
        return "protected_action_refusal";
      case "recovery":
        return error.metadata.proofRef ? "proof_gap" : "protected_action_refusal";
      case "protected_path_posture":
        return code.includes("stale") ? "stale_admission" : "proof_gap";
      default:
        break;
    }
  }

  if (error.metadata.refusalRef) return "protected_action_refusal";
  if (error.metadata.proofRef) return "proof_gap";
  if (error.status >= 500) return "internal";
  return "internal";
}

export function classifyFailureClassFromReasonCodes(reasonCodes: readonly string[]): FailureClass {
  if (reasonCodes.length === 0) return "internal";

  const classes = reasonCodes.map((code) => classifyFailureClassFromReasonCode(code));
  if (classes.includes("auth")) return "auth";
  if (classes.includes("hosted_admission")) return "hosted_admission";
  if (classes.includes("stale_admission")) return "stale_admission";
  if (classes.includes("replay_refusal")) return "replay_refusal";
  if (classes.includes("protected_action_refusal")) return "protected_action_refusal";
  if (classes.includes("proof_gap")) return "proof_gap";
  return classes[0] ?? "internal";
}

function classifyFailureClassFromReasonCode(code: string): FailureClass {
  if (code === "mcp_input_schema_invalid") return "internal";
  if (code === "mcp_tools_list_changed" || code === "mcp_metadata_digest_stale") return "proof_gap";
  if (code.startsWith(mcpInstallReasonPrefix)) return "proof_gap";
  if (mcpBindingReasonCodes.has(code)) return "proof_gap";
  if (code === "mcp_gateway_offline" || code === "mcp_gateway_posture_unknown") return "proof_gap";
  if (code === "mcp_candidate_not_contractable" || code === "mcp_candidate_digest_missing") return "proof_gap";

  if (isAuthReasonCode(code)) return "auth";
  if (isStaleHostedAdmissionCode(code)) return "stale_admission";
  if (isHostedAdmissionReasonCode(code)) return "hosted_admission";
  if (code.includes("replay") || code === "idempotency_duplicate_authority" || code === "already_consumed") {
    return "replay_refusal";
  }

  const metadata = resolveProtocolReasonCodeMetadata(code);
  if (metadata) {
    switch (metadata.kind) {
      case "refusal":
      case "isolation":
        return "protected_action_refusal";
      case "proof_gap":
        return "proof_gap";
      case "gateway_decision":
        return code.includes("replay") ? "replay_refusal" : "protected_action_refusal";
      case "policy_decision":
        return code.includes("refusal") || code.includes("refused") ? "protected_action_refusal" : "proof_gap";
      case "recovery":
        return "proof_gap";
      case "protected_path_posture":
        return code.includes("stale") ? "stale_admission" : "proof_gap";
      default:
        break;
    }
  }

  if (code.includes("refusal") || code.includes("refused") || code.startsWith("protected_action_")) {
    return "protected_action_refusal";
  }
  if (code.includes("proof_gap") || code.includes("proof")) return "proof_gap";
  if (code.includes("auth")) return "auth";

  return classifyFailureClassFromProtocolError(
    new HandshakeProtocolError(code, "Synthetic reason code classification.", 409),
  );
}

export const MCP_FAILURE_CLASS_EVIDENCE_PREFIX = "taxonomy:failureClass/" as const;

export function mcpFailureClassEvidenceRef(failureClass: FailureClass): string {
  return `${MCP_FAILURE_CLASS_EVIDENCE_PREFIX}${failureClass}`;
}

export function parseMcpFailureClassEvidenceRef(ref: string): FailureClass | null {
  if (!ref.startsWith(MCP_FAILURE_CLASS_EVIDENCE_PREFIX)) return null;
  const parsed = FailureClassSchema.safeParse(ref.slice(MCP_FAILURE_CLASS_EVIDENCE_PREFIX.length));
  return parsed.success ? parsed.data : null;
}
