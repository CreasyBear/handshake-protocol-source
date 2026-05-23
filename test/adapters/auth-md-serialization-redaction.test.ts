import { describe, expect, it } from "bun:test";
import {
  authMdEvidenceRef,
  authMdProtectedApiCallBypassProbeExecutors,
  buildAuthMdClaimEvidence,
  buildAuthMdIdentityAssertionEvidence,
  buildAuthMdRevocationEvidence,
  runAuthMdProtectedApiCallGateway,
  type AuthMdProtectedApiCallCommand,
  type AuthMdProtectedApiCallParameters,
  type AuthMdProtectedApiCallSurface,
} from "../../src/adapters/auth-md";
import { runBypassProbeExecutors } from "../../src/adapters/protected-path-probes";
import {
  assembleAgentTransactionEnvelope,
  projectAgentTransactionEnvelope,
} from "../../src/protocol/evidence-projections";
import { digestCanonical } from "../../src/protocol/foundation/canonical";
import { nowIso } from "../../src/protocol/foundation/ids";
import {
  authMdAuthorizationServer,
  authMdProtectedResource,
  authMdRawCredential,
  installedAuthMdKernel,
  proposeAuthMdRuntimeContract,
} from "../support/auth-md-flow";
import { futureIso } from "../support/fixtures";

describe("auth.md serialized redaction", () => {
  it("keeps raw credentials, claim tokens, JWTs, and PII out of adapter, policy, gateway, probe, and projection output", async () => {
    const fixture = await installedAuthMdKernel();
    const identityAssertion = await buildAuthMdIdentityAssertionEvidence({
      protectedResource: authMdProtectedResource,
      authorizationServer: authMdAuthorizationServer,
      issuer: "https://provider.example.com",
      subject: "user:joel@example.com",
      audience: authMdProtectedResource,
      jti: "jti-authmd-serialization",
      verifiedEmail: "joel@example.com",
      jwksOrCimdRef: "jwks:https://provider.example.com/.well-known/jwks.json#kid-1",
      assurancePosture: "jwks_verified",
      identityAssertionJwt: "eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiJqb2VsQGV4YW1wbGUuY29tIn0.signature",
      issuedAt: nowIso(),
      expiresAt: futureIso(),
    });
    const claim = await buildAuthMdClaimEvidence({
      registrationId: "reg_authmd_demo",
      protectedResource: authMdProtectedResource,
      claimState: "claimed",
      scopeTransition: "rotated_credential_ref",
      preClaimCredentialRefId: fixture.credentialRef.gatewayCredentialRefId,
      preClaimCredentialRefDigest: fixture.credentialRef.gatewayCredentialRefDigest,
      postClaimCredentialRefId: "gcr_authmd_post_claim",
      postClaimCredentialRefDigest: await digestCanonical({ credentialRef: "post-claim" }),
      claimToken: "claim_token=authmd-secret-claim-token",
      claimedSubject: "user:joel@example.com",
      verifiedEmail: "joel@example.com",
      rotateOnClaimRequired: true,
      evidenceRefs: ["evidence:auth-md-claim:redacted"],
      claimedAt: nowIso(),
    });
    const revocation = await buildAuthMdRevocationEvidence({
      registrationId: "reg_authmd_demo",
      protectedResource: authMdProtectedResource,
      gatewayCredentialRefId: fixture.credentialRef.gatewayCredentialRefId,
      gatewayCredentialRefDigest: fixture.credentialRef.gatewayCredentialRefDigest,
      revocationEventKind: "logout_jwt",
      revocationReasonCode: "auth_md_logout",
      providerEvent: { subject: "user:joel@example.com", secret: "authmd-provider-secret" },
      logoutJwt: "eyJhbGciOiJSUzI1NiJ9.eyJldmVudCI6ImxvZ291dCJ9.signature",
      evidenceRefs: ["evidence:auth-md-revocation:redacted"],
      observedAt: nowIso(),
    });
    const contract = await proposeAuthMdRuntimeContract(fixture, "dispatch:auth-md:serialization", {
      evidenceRefs: [
        authMdEvidenceRef("registration", fixture.registrationEvidence.registrationEvidenceDigest),
        authMdEvidenceRef("identity-assertion", identityAssertion.identityAssertionEvidenceDigest),
        authMdEvidenceRef("claim", claim.claimEvidenceDigest),
      ],
    });
    const policy = await fixture.kernel.evaluatePolicy({
      actionContractId: contract.actionContractId,
      envelopeId: fixture.envelope.envelopeId,
      signingSecret: "test-secret",
    });
    if (!policy.greenlight) throw new Error("expected auth.md greenlight");
    const gateway = await runAuthMdProtectedApiCallGateway({
      protocol: fixture.kernel,
      surface: redactedSurface(),
      actionContractId: contract.actionContractId,
      greenlightId: policy.greenlight.greenlightId,
      observedParameters: contract.parameters as AuthMdProtectedApiCallParameters,
      surfaceOperationRef: "surface-op:auth-md:serialization",
    });
    const projection = await projectAgentTransactionEnvelope(
      (await assembleAgentTransactionEnvelope(fixture.store, contract)).input,
    );
    const probes = await runBypassProbeExecutors(
      fixture.kernel,
      {
        tenantId: contract.tenantId,
        organizationId: contract.organizationId,
        runtimeAdapterId: contract.runtimeAdapterId,
        gatewayId: contract.gatewayId,
        actionClass: contract.actionClass,
        resourceRef: contract.resourceRef,
        protectedSurfaceKind: contract.protectedSurfaceKind,
        expiresAt: futureIso(),
      },
      authMdProtectedApiCallBypassProbeExecutors({
        async readBypassPosture() {
          return {
            credentialCustodyStatus: "gateway_held",
            rawBearerPassthroughStatus: "blocked",
            directHttpCallStatus: "blocked",
            siblingMcpCallStatus: "blocked",
            browserToolCallStatus: "absent",
            rawNetworkCallStatus: "blocked",
            tokenReplayStatus: "blocked",
            metadataFreshnessStatus: "fresh",
            unsafeRetryLoopStatus: "blocked",
            gatewayWrapperDriftStatus: "absent",
            failureClosedStatus: "passed",
          };
        },
      }),
    );

    const serialized = JSON.stringify({
      discovery: fixture.discovery,
      registration: fixture.registrationEvidence,
      identityAssertion,
      claim,
      revocation,
      credentialRef: fixture.credentialRef,
      contract,
      policy,
      gateway,
      projection,
      probes,
    });
    expect(serialized).not.toContain(authMdRawCredential);
    expect(serialized).not.toContain("sk_live_authmd_secret");
    expect(serialized).not.toContain("authmd-secret-claim-token");
    expect(serialized).not.toContain("authmd-provider-secret");
    expect(serialized).not.toContain("joel@example.com");
    expect(serialized).not.toContain("eyJhbGci");
  });
});

function redactedSurface(): AuthMdProtectedApiCallSurface {
  return {
    async executeProtectedApiCall(command: AuthMdProtectedApiCallCommand) {
      return {
        evidenceRef: `evidence:auth-md-protected-api-call:${command.verifiedGate.gateAttemptId}`,
        surfaceOperationRef: command.verifiedGate.surfaceOperationRef,
        targetHttpMethod: command.parameters.targetHttpMethod,
        endpointUrl: command.parameters.endpointUrl,
        requestBodyDigest: command.parameters.requestBodyDigest,
        selectedHeadersDigest: command.parameters.selectedHeadersDigest,
        responseDigest: await digestCanonical({ ok: true, operationId: command.parameters.operationId }),
        downstreamStatus: "succeeded",
        providerRequestRef: command.providerRequestRef,
        providerOperationRef: command.providerOperationRef,
        evidenceRefs: [command.credentialUseRef],
      };
    },
  };
}
