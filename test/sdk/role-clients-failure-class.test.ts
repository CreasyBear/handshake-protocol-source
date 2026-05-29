import { describe, expect, it } from "bun:test";
import {
  EvidenceClient,
  GatewayClient,
  HandshakeClientError,
  PolicyClient,
  type HandshakeFetch,
} from "../../src/sdk/surface-clients";

describe("role-scoped SDK failureClass", () => {
  it("surfaces protected_action_refusal on policy refusal with HTTP 409", async () => {
    const policyClient = new PolicyClient("http://handshake.test", { roleCredential: "policy-token" }, errorFetch(409, policyRefusalEnvelope()));

    await expect(policyClient.evaluatePolicy(minimalEvaluatePolicyInput())).rejects.toMatchObject({
      status: 409,
      failureClass: "protected_action_refusal",
      code: "policy_refused",
    });
  });

  it("surfaces auth failureClass on missing bearer with HTTP 401", async () => {
    const gatewayClient = new GatewayClient("http://handshake.test", { roleCredential: "gateway-token" }, errorFetch(401, authEnvelope()));

    await expect(gatewayClient.gatewayCheck(minimalGatewayCheckInput())).rejects.toMatchObject({
      status: 401,
      failureClass: "auth",
      code: "caller_auth_required",
    });
  });

  it("preserves failureClass from HTTP status when error body is empty or malformed", async () => {
    for (const scenario of [
      { status: 401, failureClass: "auth" as const },
      { status: 409, failureClass: "protected_action_refusal" as const },
      { status: 422, failureClass: "proof_gap" as const },
    ]) {
      const emptyBodyClient = new GatewayClient(
        "http://handshake.test",
        { roleCredential: "gateway-token" },
        async () => new Response("", { status: scenario.status }),
      );
      await expect(emptyBodyClient.gatewayCheck(minimalGatewayCheckInput())).rejects.toMatchObject({
        status: scenario.status,
        failureClass: scenario.failureClass,
        code: "http_error",
      });

      const malformedBodyClient = new GatewayClient(
        "http://handshake.test",
        { roleCredential: "gateway-token" },
        async () =>
          new Response("<html>upstream</html>", {
            status: scenario.status,
            headers: { "content-type": "text/html" },
          }),
      );
      await expect(malformedBodyClient.gatewayCheck(minimalGatewayCheckInput())).rejects.toMatchObject({
        status: scenario.status,
        failureClass: scenario.failureClass,
        code: "http_error",
      });
    }
  });

  it("returns evidence readback without HandshakeClientError on HTTP 200", async () => {
    const actionContractId = "contract_evidence_demo";
    const evidenceClient = new EvidenceClient(
      "http://handshake.test",
      { roleCredential: "review-token", readRole: "review_custody" },
      successFetch({ actionContractId, claim: "redacted" }),
    );

    const projection = await evidenceClient.getContractEvidenceProjection(actionContractId);
    expect(projection).toMatchObject({ actionContractId });
  });
});

function errorFetch(status: number, envelope: Record<string, unknown>): HandshakeFetch {
  return async () =>
    new Response(JSON.stringify({ error: envelope }), {
      status,
      headers: { "content-type": "application/json" },
    });
}

function successFetch(body: unknown): HandshakeFetch {
  return async () =>
    new Response(JSON.stringify(body), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
}

function policyRefusalEnvelope() {
  return {
    code: "policy_refused",
    message: "Policy refused the exact contract.",
    transitionName: "evaluatePolicy",
    callerCustodyRole: "runtime_evidence",
    retryability: "terminal",
    commitState: "committed",
    requestIdentity: "req-policy-1",
    proofRef: null,
    refusalRef: "ref_policy_refusal",
    failureClass: "protected_action_refusal",
    failurePhase: "transition",
    problemType: "https://handshake.dev/problems/policy_refused",
  };
}

function authEnvelope() {
  return {
    code: "caller_auth_required",
    message: "Bearer token required.",
    transitionName: "gatewayCheck",
    callerCustodyRole: "gateway_custody",
    retryability: "terminal",
    commitState: "not_started",
    requestIdentity: null,
    proofRef: null,
    refusalRef: null,
    failureClass: "auth",
    failurePhase: "admission",
    problemType: "https://handshake.dev/docs/http/caller-auth#caller_auth_required",
  };
}

function minimalEvaluatePolicyInput() {
  return {
    actionContractId: "contract_demo",
    envelopeId: "env_demo",
    signingSecret: "test-secret",
  };
}

function minimalGatewayCheckInput() {
  return {
    actionContractId: "contract_demo",
    greenlightId: "greenlight_demo",
    observedParameters: { atomicAmount: "1000" },
  };
}
