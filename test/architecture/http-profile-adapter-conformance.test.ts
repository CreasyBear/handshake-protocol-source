import { describe, expect, it } from "bun:test";
import { readFile } from "node:fs/promises";
import {
  AUTH_MD_PROTECTED_API_CALL_EXACT_PROFILE,
  AuthMdProtectedApiCallExactTransportSchema,
  canonicalizeAuthMdProtectedApiCallExactTransport,
} from "../../src/adapters/auth-md/profiles";
import {
  assertAuthMdProfileConformance,
  AuthMdProfileConformanceReason,
  runAuthMdProtectedApiCallGateway,
} from "../../src/adapters/auth-md/gateway";
import { HandshakeProtocolError } from "../../src/protocol/foundation/errors";

describe("http profile adapter conformance (Phase 04 plan 04-08)", () => {
  it("exports auth_md exact profile canonicalization helpers", () => {
    expect(AUTH_MD_PROTECTED_API_CALL_EXACT_PROFILE).toBe("auth_md_protected_api_call.exact");
    const canonical = canonicalizeAuthMdProtectedApiCallExactTransport({
      targetHttpMethod: "POST",
      endpointUrl: "https://api.example.com/v1/items",
      pathTemplate: "/v1/items",
      requestBodyDigest: null,
      selectedHeadersDigest: `sha256:${"a".repeat(64)}`,
    });
    expect(AuthMdProtectedApiCallExactTransportSchema.parse(canonical).targetHttpMethod).toBe("POST");
  });

  it("requires verifiedGate on auth-md gateway commands via assertAuthMdProfileConformance", () => {
    try {
      assertAuthMdProfileConformance({});
      throw new Error("expected assertAuthMdProfileConformance to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(HandshakeProtocolError);
      expect((error as HandshakeProtocolError).code).toBe(AuthMdProfileConformanceReason.missingVerifiedGate);
    }
  });

  it("pins runAuthMdProtectedApiCallGateway as the sole protected API call mutation path", async () => {
    const gatewaySource = await readFile(new URL("../../src/adapters/auth-md/gateway.ts", import.meta.url), "utf8");
    expect(gatewaySource.includes("export async function runAuthMdProtectedApiCallGateway")).toBe(true);
    expect(gatewaySource.includes("verifiedGatewayCheckFromResult")).toBe(true);
    expect(gatewaySource.includes("assertAuthMdProfileConformance")).toBe(true);
    expect(typeof runAuthMdProtectedApiCallGateway).toBe("function");
  });
});
