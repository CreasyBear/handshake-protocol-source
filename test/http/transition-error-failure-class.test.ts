import { describe, expect, it } from "bun:test";
import { createApp } from "../../src/http/app";
import type { CallerAuthTokens } from "../../src/http/admission/caller-auth";
import {
  failureClassForProtocolError,
  httpStatusForFailureClass,
  transitionErrorResult,
} from "../../src/http/errors/transition-error-envelope";
import { HandshakeProtocolError } from "../../src/protocol/foundation/errors";
import { hostedAdmissionConfig, headerHostedVerifier } from "../support/http-protocol-fixtures";
import { makeKernelFixture } from "../support/fixtures";

const TEST_CALLER_AUTH_TOKENS = {
  control_plane: "test_control_plane_token",
  runtime_evidence: "test_runtime_evidence_token",
  gateway_custody: "test_gateway_custody_token",
  review_custody: "test_review_custody_token",
} as const satisfies CallerAuthTokens;

describe("transition error failureClass taxonomy", () => {
  it("maps auth and hosted admission codes to distinct failure classes and statuses", () => {
    const authRequired = new HandshakeProtocolError("caller_auth_required", "Bearer required.", 401);
    expect(failureClassForProtocolError(authRequired)).toBe("auth");
    expect(httpStatusForFailureClass("auth", 401)).toBe(401);

    const hostedStale = new HandshakeProtocolError(
      "hosted_caller_identity_stale",
      "Hosted identity stale.",
      403,
    );
    expect(failureClassForProtocolError(hostedStale)).toBe("stale_admission");
    expect(httpStatusForFailureClass("stale_admission")).toBe(409);
  });

  it("maps clearance refusals and proof gaps to non-auth HTTP statuses", () => {
    const refusal = new HandshakeProtocolError(
      "unwrapped_consequential_tool",
      "Tool bypass refused.",
      403,
      { refusalRef: "ref_demo" },
    );
    const classified = transitionErrorResult(refusal, {
      transitionName: "compileIntent",
      callerCustodyRole: "runtime_evidence",
    });
    expect(classified.status).toBe(409);
    expect(classified.body.error).toMatchObject({
      failureClass: "protected_action_refusal",
      failurePhase: "transition",
      refusalRef: "ref_demo",
    });

    const proofGap = new HandshakeProtocolError(
      "agreement_missing",
      "Agreement missing.",
      409,
      { proofRef: "gap_demo" },
    );
    const gapClassified = transitionErrorResult(proofGap);
    expect(gapClassified.status).toBe(422);
    expect(gapClassified.body.error.failureClass).toBe("proof_gap");
  });

  it("preserves explicit HTTP status for ingress-shaping transition error codes", () => {
    for (const scenario of [
      { code: "invalid_request" as const, status: 400 },
      { code: "record_not_found" as const, status: 404 },
      { code: "transition_request_body_too_large" as const, status: 413 },
    ]) {
      const error = new HandshakeProtocolError(scenario.code, "Ingress shaping.", scenario.status);
      expect(failureClassForProtocolError(error)).toBe("internal");
      expect(transitionErrorResult(error).status).toBe(scenario.status);
    }
  });

  it("maps replay refusals to 409 replay_refusal", () => {
    const replay = new HandshakeProtocolError(
      "credential_resolution_replay_refused",
      "Replay refused.",
      409,
    );
    expect(failureClassForProtocolError(replay)).toBe("replay_refusal");
    expect(transitionErrorResult(replay).status).toBe(409);
    expect(transitionErrorResult(replay).body.error.failureClass).toBe("replay_refusal");
  });

  it("maps recovery terminal conflict proof gaps to 422 proof_gap", () => {
    const conflict = new HandshakeProtocolError(
      "recovery_terminal_conflict",
      "Recovery terminal conflict.",
      409,
      { proofRef: "gap_demo" },
    );
    const classified = transitionErrorResult(conflict);
    expect(classified.status).toBe(422);
    expect(classified.body.error.failureClass).toBe("proof_gap");
  });

  it("requires bearer auth before transition body parsing", async () => {
    const app = createApp({
      store: (await makeKernelFixture()).store,
      callerAuthTokens: TEST_CALLER_AUTH_TOKENS,
    });
    const response = await app.request("/v0.2/runtime-executions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ invalid: true }),
    });
    expect(response.status).toBe(401);
    expect(await response.json()).toMatchObject({
      error: {
        code: "caller_auth_required",
        failureClass: "auth",
        failurePhase: "admission",
      },
    });
  });

  it("returns 200 readback claim status on hosted readiness without clearance masquerade", async () => {
    const fixture = await makeKernelFixture();
    const app = createApp({
      store: fixture.store,
      callerAuthTokens: TEST_CALLER_AUTH_TOKENS,
      hostedAdmissionConfig: hostedAdmissionConfig(),
      hostedCallerVerifier: headerHostedVerifier(),
    });

    const response = await app.request("/v0.2/hosted/readiness", {
      headers: {
        authorization: "Bearer test_control_plane_token",
        "x-handshake-protocol-version": "0.2.0",
        "x-handshake-request-identity": "readback-claim-1",
      },
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      authorityClass: "hosted_admission_and_redacted_evidence_read_only",
      hostedMutationAuthorityCreated: false,
      readinessState: expect.stringMatching(/configured|missing|read_only/),
    });
  });
});
