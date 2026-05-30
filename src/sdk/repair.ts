import type { FailureClass } from "../protocol/foundation/failure-class";
import { reasonCodeRemediationForCode } from "../protocol/foundation/reason-code-remediation/index";
import { HandshakeClientError } from "./client";

export type HandshakeErrorExplanation = {
  code: string;
  failureClass: FailureClass;
  failurePhase: string | null;
  status: number;
  requiresNewContract: boolean;
  nextAction: "refresh_credentials" | "recraft_contract" | "read_evidence" | "stop";
  summary: string;
};

export function explainHandshakeError(error: unknown): HandshakeErrorExplanation | null {
  if (!(error instanceof HandshakeClientError)) return null;

  const remediation = reasonCodeRemediationForCode(error.code);
  const requiresNewContract = remediation?.requiresNewContract ?? failureClassRequiresNewContract(error.failureClass);

  return {
    code: error.code,
    failureClass: error.failureClass,
    failurePhase: error.failurePhase,
    status: error.status,
    requiresNewContract,
    nextAction: nextActionForFailureClass(error.failureClass, requiresNewContract),
    summary: error.message,
  };
}

export function nextHandshakeCommand(error: unknown): string | null {
  const explanation = explainHandshakeError(error);
  if (!explanation) return null;

  switch (explanation.nextAction) {
    case "refresh_credentials":
      return "handshake host doctor --json";
    case "recraft_contract":
      return "handshake quickstart agent-spine --json";
    case "read_evidence":
      return "handshake evidence readback --json";
    case "stop":
      return null;
  }
}

function failureClassRequiresNewContract(failureClass: FailureClass): boolean {
  return failureClass === "stale_admission" || failureClass === "replay_refusal" || failureClass === "proof_gap";
}

function nextActionForFailureClass(
  failureClass: FailureClass,
  requiresNewContract: boolean,
): HandshakeErrorExplanation["nextAction"] {
  if (failureClass === "auth" || failureClass === "hosted_admission") return "refresh_credentials";
  if (requiresNewContract) return "recraft_contract";
  if (failureClass === "proof_gap") return "read_evidence";
  if (failureClass === "protected_action_refusal" || failureClass === "replay_refusal") return "stop";
  return "stop";
}
