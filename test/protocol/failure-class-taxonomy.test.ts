import { describe, expect, it } from "bun:test";
import {
  classifyFailureClassFromProtocolError,
  classifyFailureClassFromReasonCodes,
  failureClassFromHttpStatus,
} from "../../src/protocol/foundation/failure-class";
import {
  failureClassForProtocolError,
  httpStatusForFailureClass,
  transitionErrorResult,
} from "../../src/http/errors/transition-error-envelope";
import { HandshakeProtocolError } from "../../src/protocol/foundation/errors";
import { protocolReasonCodes } from "../../src/protocol/foundation/reason-codes";

describe("failureClass taxonomy registry parity", () => {
  const policyRefusalCodes = [
    "envelope_not_active",
    "action_class_outside_envelope",
    "prior_action_not_greenlit",
    "contract_expired",
  ] as const;

  for (const code of policyRefusalCodes) {
    it(`classifies ${code} as protected_action_refusal (not proof_gap)`, () => {
      expect(classifyFailureClassFromReasonCodes([code])).toBe("protected_action_refusal");
      const protocolError = new HandshakeProtocolError(code, "Policy refused.", 409);
      expect(classifyFailureClassFromProtocolError(protocolError)).toBe("protected_action_refusal");
      expect(failureClassForProtocolError(protocolError)).toBe("protected_action_refusal");
      expect(transitionErrorResult(protocolError).status).toBe(409);
      expect(transitionErrorResult(protocolError).body.error.failureClass).toBe("protected_action_refusal");
    });
  }

  const custodyProofCodes = [
    "gateway_custody_proof_custody_mismatch",
    "gateway_custody_proof_scope_mismatch",
    "gateway_custody_proof_binding_mismatch",
  ] as const;

  for (const code of custodyProofCodes) {
    it(`does not classify ${code} as proof_gap`, () => {
      expect(classifyFailureClassFromReasonCodes([code])).not.toBe("proof_gap");
      expect(classifyFailureClassFromReasonCodes([code])).toBe("internal");
    });
  }

  it("aligns recovery reason codes without proofRef to protected_action_refusal", () => {
    expect(classifyFailureClassFromReasonCodes(["idempotency_recovery_missing"])).toBe("protected_action_refusal");
  });

  it("keeps recovery terminal conflict with proofRef as proof_gap on protocol errors", () => {
    const conflict = new HandshakeProtocolError("recovery_terminal_conflict", "Conflict.", 409, {
      proofRef: "gap_demo",
    });
    expect(classifyFailureClassFromProtocolError(conflict)).toBe("proof_gap");
    expect(httpStatusForFailureClass("proof_gap")).toBe(422);
  });

  it("defaults unknown 4xx protocol errors to protected_action_refusal", () => {
    const unknownRefusal = new HandshakeProtocolError("future_policy_refusal_code", "Refused.", 409);
    expect(classifyFailureClassFromProtocolError(unknownRefusal)).toBe("protected_action_refusal");
  });

  it("defaults unknown 4xx with proofRef to proof_gap", () => {
    const unknownGap = new HandshakeProtocolError("future_proof_gap_code", "Gap.", 422, {
      proofRef: "gap_future",
    });
    expect(classifyFailureClassFromProtocolError(unknownGap)).toBe("proof_gap");
  });

  it("maps HTTP status bands when envelope metadata is unavailable", () => {
    expect(failureClassFromHttpStatus(401)).toBe("auth");
    expect(failureClassFromHttpStatus(403)).toBe("protected_action_refusal");
    expect(failureClassFromHttpStatus(409)).toBe("protected_action_refusal");
    expect(failureClassFromHttpStatus(422)).toBe("proof_gap");
    expect(failureClassFromHttpStatus(418)).toBe("proof_gap");
    expect(failureClassFromHttpStatus(500)).toBe("internal");
  });

  it("maps every registry refusal kind to protected_action_refusal (never proof_gap)", () => {
    const refusalCodes = protocolReasonCodes.filter((entry) => entry.kind === "refusal");
    expect(refusalCodes.length).toBeGreaterThan(0);

    for (const entry of refusalCodes) {
      const failureClass = classifyFailureClassFromReasonCodes([entry.code]);
      expect(failureClass).toBe("protected_action_refusal");
      expect(failureClass).not.toBe("proof_gap");
    }
  });

  it("classifies MCP intent-compilation refusals as protected_action_refusal", () => {
    expect(classifyFailureClassFromReasonCodes(["mcp_candidate_not_contractable"])).toBe("protected_action_refusal");
    expect(classifyFailureClassFromReasonCodes(["mcp_input_schema_invalid"])).toBe("protected_action_refusal");
  });

  it("classifies MCP candidate digest integrity errors as internal", () => {
    expect(classifyFailureClassFromReasonCodes(["mcp_candidate_digest_missing"])).toBe("internal");
    expect(classifyFailureClassFromReasonCodes(["mcp_candidate_digest_missing"])).not.toBe("proof_gap");
  });
});
