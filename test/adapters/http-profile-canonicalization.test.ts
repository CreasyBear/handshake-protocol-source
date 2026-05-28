import { describe, expect, it } from "bun:test";
import { canonicalizeHttpProfile, HttpProtectedMutationProfileSchema } from "../../src/adapters/http-profile";
import { runGenericHttpProfileGatewaySkeleton } from "../../src/adapters/http-profile/generic-gateway-skeleton";
import { AuthMdProtectedApiCallParametersSchema } from "../../src/adapters/auth-md/action-proposal";

const baseProfile = {
  targetHttpMethod: "post",
  endpointUrl: "https://api.example.com/v1/items",
  pathTemplate: "/v1/items",
  requestBodyDigest: null,
  selectedHeadersDigest: `sha256:${"a".repeat(64)}`,
  dynamicEndpointConstructionObserved: false,
  dynamicHostConstructionObserved: false,
  retryAuthorityReuseDetected: false,
};

describe("http-profile canonicalization", () => {
  it("canonicalizes method and path template deterministically", () => {
    const first = canonicalizeHttpProfile(baseProfile);
    const second = canonicalizeHttpProfile({ ...baseProfile, targetHttpMethod: " POST " });
    expect(first.targetHttpMethod).toBe("POST");
    expect(second).toEqual(first);
  });

  it("rejects dynamic endpoint construction flags", () => {
    expect(() =>
      canonicalizeHttpProfile({
        ...baseProfile,
        dynamicEndpointConstructionObserved: true,
      }),
    ).toThrow();
  });

  it("returns definition_only proof gap from skeleton gateway", () => {
    const result = runGenericHttpProfileGatewaySkeleton(baseProfile);
    expect(result.posture).toBe("definition_only");
    expect(result.proofGapCode).toBe("generic_http_profile_live_mutation_forbidden");
  });

  it("round-trips auth-md composed profiles through shared transport fields", () => {
    const authMd = AuthMdProtectedApiCallParametersSchema.parse({
      profile: "auth_md_protected_api_call.exact.v0",
      protectedResource: "https://resource.example/.well-known/oauth-protected-resource",
      protectedResourceOrigin: "https://resource.example",
      protectedResourceMetadataDigest: `sha256:${"b".repeat(64)}`,
      authorizationServerMetadataDigest: `sha256:${"c".repeat(64)}`,
      authorizationServer: "https://auth.example",
      endpointOrigin: "https://api.example.com",
      requiredScopes: ["read"],
      gatewayCredentialRefId: "cred_demo",
      gatewayCredentialRefDigest: `sha256:${"d".repeat(64)}`,
      providerRegistryRef: "registry:demo",
      operationId: "op_demo",
      requiredCredentialCustodyStatus: "gateway_held",
      idempotencyMaterialRefPresent: true,
      rawAuthorizationHeaderObserved: false,
      ...baseProfile,
    });
    const extracted = HttpProtectedMutationProfileSchema.parse({
      targetHttpMethod: authMd.targetHttpMethod,
      endpointUrl: authMd.endpointUrl,
      pathTemplate: authMd.pathTemplate,
      requestBodyDigest: authMd.requestBodyDigest,
      selectedHeadersDigest: authMd.selectedHeadersDigest,
      dynamicEndpointConstructionObserved: authMd.dynamicEndpointConstructionObserved,
      dynamicHostConstructionObserved: authMd.dynamicHostConstructionObserved,
      retryAuthorityReuseDetected: authMd.retryAuthorityReuseDetected,
    });
    expect(canonicalizeHttpProfile(extracted).targetHttpMethod).toBe("POST");
  });
});
