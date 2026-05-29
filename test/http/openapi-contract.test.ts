import { describe, expect, it } from "bun:test";
import { createApp } from "../../src/http/app";
import { TransitionErrorEnvelopeSchema } from "../../src/http/errors/transition-error-envelope";

describe("OpenAPI failure taxonomy contract", () => {
  it("documents failureClass fields on transition error schema", async () => {
    const app = createApp();
    const response = await app.request("/openapi.json");
    expect(response.status).toBe(200);

    const document = (await response.json()) as {
      paths: Record<string, { post?: { responses: Record<string, { description?: string }> } }>;
    };

    const gatewayPath = document.paths["/v0.2/gateway-check-attempts"];
    expect(gatewayPath?.post?.responses["422"]?.description).toContain("failureClass");
    expect(gatewayPath?.post?.responses["409"]?.description).toContain("failureClass");

    const sample = TransitionErrorEnvelopeSchema.parse({
      code: "caller_auth_required",
      message: "Bearer required.",
      transitionName: "createRuntimeExecution",
      callerCustodyRole: "runtime_evidence",
      retryability: "terminal",
      commitState: "not_started",
      requestIdentity: null,
      proofRef: null,
      refusalRef: null,
      failureClass: "auth",
      failurePhase: "admission",
      problemType: "https://handshake.dev/docs/http/caller-auth#caller_auth_required",
    });
    expect(sample.failureClass).toBe("auth");
  });
});
