import { describe, expect, it } from "bun:test";
import {
  classifyFailureClassFromProtocolError,
  classifyFailureClassFromReasonCodes,
} from "../../src/protocol/foundation/failure-class";
import { failureClassForProtocolError } from "../../src/http/errors/transition-error-envelope";
import { HandshakeProtocolError } from "../../src/protocol/foundation/errors";

const parityRows: Array<{
  label: string;
  reasonCodes: string[];
  protocolError?: HandshakeProtocolError;
  expected: ReturnType<typeof classifyFailureClassFromReasonCodes>;
  mustNotBeAuth?: boolean;
}> = [
  {
    label: "trusted binding missing",
    reasonCodes: ["mcp_trusted_readiness_binding_missing", "mcp_policy_version_binding_missing"],
    expected: "proof_gap",
    mustNotBeAuth: true,
  },
  {
    label: "gateway offline",
    reasonCodes: ["mcp_gateway_offline"],
    expected: "proof_gap",
    mustNotBeAuth: true,
  },
  {
    label: "x402 posture refusal",
    reasonCodes: ["x402_request_body_posture_unsupported"],
    expected: "protected_action_refusal",
    mustNotBeAuth: true,
  },
  {
    label: "caller auth required",
    reasonCodes: ["caller_auth_required"],
    protocolError: new HandshakeProtocolError("caller_auth_required", "Bearer required.", 401),
    expected: "auth",
  },
  {
    label: "hosted stale admission",
    reasonCodes: ["hosted_caller_identity_stale"],
    protocolError: new HandshakeProtocolError("hosted_caller_identity_stale", "Stale.", 403),
    expected: "stale_admission",
  },
  {
    label: "replay refusal",
    reasonCodes: ["credential_resolution_replay_refused"],
    protocolError: new HandshakeProtocolError("credential_resolution_replay_refused", "Replay.", 409),
    expected: "replay_refusal",
    mustNotBeAuth: true,
  },
  {
    label: "policy envelope refusal",
    reasonCodes: ["envelope_not_active"],
    protocolError: new HandshakeProtocolError("envelope_not_active", "Envelope inactive.", 409),
    expected: "protected_action_refusal",
    mustNotBeAuth: true,
  },
  {
    label: "gateway custody proof mismatch",
    reasonCodes: ["gateway_custody_proof_custody_mismatch"],
    expected: "internal",
    mustNotBeAuth: true,
  },
];

describe("MCP failureClass parity with HTTP classifier", () => {
  for (const row of parityRows) {
    it(`agrees on ${row.label}`, () => {
      const fromReasonCodes = classifyFailureClassFromReasonCodes(row.reasonCodes);
      expect(fromReasonCodes).toBe(row.expected);
      if (row.mustNotBeAuth) {
        expect(fromReasonCodes).not.toBe("auth");
      }

      if (row.protocolError) {
        const httpClass = failureClassForProtocolError(row.protocolError);
        const foundationClass = classifyFailureClassFromProtocolError(row.protocolError);
        expect(httpClass).toBe(row.expected);
        expect(foundationClass).toBe(row.expected);
        expect(httpClass).toBe(foundationClass);
      }
    });
  }
});
