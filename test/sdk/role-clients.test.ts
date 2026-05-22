import { describe, expect, it } from "bun:test";
import { PROTOCOL_VERSION } from "../../src/protocol/public/schemas";
import type {
  CompileIntentInput,
  CreateRuntimeExecutionInput,
  CreateToolCallDraftInput,
  ProposeActionContractInput,
  TransitionToolCallDraftInput,
} from "../../src/protocol/public/inputs";
import {
  EvidenceClient,
  type EvidenceClientOptions,
  RuntimeClient,
  type RuntimeClientOptions,
} from "../../src/sdk/surface-clients";
import type { HandshakeFetch } from "../../src/sdk/client";

describe("role-scoped SDK clients", () => {
  it("keeps runtime client construction to one runtime credential and no authority methods", async () => {
    // @ts-expect-error runtime client must not accept role maps.
    const invalidRuntimeRoleMap: RuntimeClientOptions = { roleCredential: "runtime-token", transitionTokens: {} };
    const invalidRuntimeFallback: RuntimeClientOptions = {
      roleCredential: "runtime-token",
      // @ts-expect-error runtime client must not accept fallback transport credentials.
      transitionToken: "fallback",
    };
    void invalidRuntimeRoleMap;
    void invalidRuntimeFallback;

    const calls: CapturedCall[] = [];
    const runtimeClient = new RuntimeClient(
      "http://handshake.test",
      {
        roleCredential: "runtime-token",
        requestIdentityFactory: () => "runtime-request-id",
        originatingIdentity: "ref:runtime-demo",
      },
      captureFetch(calls),
    );

    await runtimeClient.createRuntimeExecution({} as CreateRuntimeExecutionInput);
    await runtimeClient.createToolCallDraft({} as CreateToolCallDraftInput);
    await runtimeClient.transitionToolCallDraft({} as TransitionToolCallDraftInput);
    await runtimeClient.compileIntent({} as CompileIntentInput);
    await runtimeClient.proposeActionContract({} as ProposeActionContractInput);

    expect(calls.map((call) => call.path)).toEqual([
      "/v0.2/runtime-executions",
      "/v0.2/tool-call-drafts",
      "/v0.2/tool-call-draft-transitions",
      "/v0.2/intent-compilations",
      "/v0.2/action-contracts",
    ]);
    expect(calls.every((call) => call.method === "POST")).toBe(true);
    expect(calls.every((call) => call.headers.get("authorization") === "Bearer runtime-token")).toBe(true);
    expect(calls[0]?.headers.get("x-handshake-protocol-version")).toBe(PROTOCOL_VERSION);
    expect(calls[0]?.headers.get("x-handshake-request-identity")).toBe("runtime-request-id");
    expect(calls[0]?.headers.get("x-handshake-originating-identity")).toBe("ref:runtime-demo");

    expect("evaluatePolicy" in runtimeClient).toBe(false);
    expect("gatewayCheck" in runtimeClient).toBe(false);
    expect("createReceiptExport" in runtimeClient).toBe(false);
    expect("createAuthorityCertificate" in runtimeClient).toBe(false);
  });

  it("keeps evidence client read-only and verifies supplied certificates without minting", async () => {
    // @ts-expect-error evidence client must not accept role maps.
    const invalidEvidenceRoleMap: EvidenceClientOptions = { roleCredential: "review-token", transitionTokens: {} };
    const invalidEvidenceFallback: EvidenceClientOptions = {
      roleCredential: "review-token",
      // @ts-expect-error evidence client must not accept fallback transport credentials.
      transitionToken: "fallback",
    };
    void invalidEvidenceRoleMap;
    void invalidEvidenceFallback;

    const calls: CapturedCall[] = [];
    const evidenceClient = new EvidenceClient(
      "http://handshake.test",
      {
        roleCredential: "review-token",
        requestIdentityFactory: () => "evidence-request-id",
      },
      captureFetch(calls),
    );

    await evidenceClient.getGeneratedGraphEvidenceProjection("geg_demo");
    await evidenceClient.getContractEvidenceProjection("act_demo");
    await evidenceClient.getAgentTransactionEnvelopeProjection("act_demo");
    await evidenceClient.getIdempotencyRecoveryProjection("act_demo");
    await evidenceClient.getReceiptTimelineProjection("rcp_demo");
    await evidenceClient.getProtectedPathInstallHealthProjection("act_demo");

    expect(calls.map((call) => call.path)).toEqual([
      "/v0.2/evidence/generated-execution-graphs/geg_demo",
      "/v0.2/evidence/contracts/act_demo",
      "/v0.2/evidence/agent-transactions/act_demo",
      "/v0.2/evidence/idempotency-recovery/act_demo",
      "/v0.2/evidence/receipts/rcp_demo/timeline",
      "/v0.2/evidence/protected-path-install-health/act_demo",
    ]);
    expect(calls.every((call) => call.method === "GET")).toBe(true);
    expect(calls.every((call) => call.headers.get("authorization") === "Bearer review-token")).toBe(true);
    expect(calls.every((call) => call.headers.get("content-type") === null)).toBe(true);
    expect(calls.every((call) => call.body === undefined)).toBe(true);

    await expect(
      evidenceClient.verifyAuthorityCertificate({}, { keys: [], allowDevHmac: false }),
    ).resolves.toMatchObject({
      valid: false,
      envelope: null,
      signingInputDigest: null,
    });

    expect("createReceiptExport" in evidenceClient).toBe(false);
    expect("createAuthorityCertificate" in evidenceClient).toBe(false);
    expect("gatewayCheck" in evidenceClient).toBe(false);
    expect("evaluatePolicy" in evidenceClient).toBe(false);
  });

  it("can use runtime evidence custody for scoped evidence readback without changing methods", async () => {
    const calls: CapturedCall[] = [];
    const evidenceClient = new EvidenceClient(
      "http://handshake.test",
      {
        roleCredential: "runtime-token",
        readRole: "runtime_evidence",
        requestIdentityFactory: () => "runtime-read-id",
      },
      captureFetch(calls),
    );

    await evidenceClient.getAgentTransactionEnvelopeProjection("act_demo");

    expect(calls[0]?.path).toBe("/v0.2/evidence/agent-transactions/act_demo");
    expect(calls[0]?.headers.get("authorization")).toBe("Bearer runtime-token");
    expect(calls[0]?.headers.get("x-handshake-request-identity")).toBe("runtime-read-id");
  });
});

type CapturedCall = {
  path: string;
  method: string | undefined;
  headers: Headers;
  body: BodyInit | null | undefined;
};

function captureFetch(calls: CapturedCall[]): HandshakeFetch {
  return async (input, init) => {
    calls.push({
      path: new URL(String(input)).pathname,
      method: init?.method,
      headers: new Headers(init?.headers),
      body: init?.body,
    });
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  };
}
