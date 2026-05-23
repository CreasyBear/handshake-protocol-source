import { describe, expect, it } from "bun:test";
import {
  authMdEvidenceRef,
  buildAuthMdClaimEvidence,
  buildAuthMdIdentityAssertionEvidence,
  buildAuthMdRevocationEvidence,
  runAuthMdProtectedApiCallGateway,
  type AuthMdProtectedApiCallCommand,
  type AuthMdProtectedApiCallDownstreamStatus,
  type AuthMdProtectedApiCallParameters,
  type AuthMdProtectedApiCallSurface,
} from "../../src/adapters/auth-md";
import {
  assembleAgentTransactionEnvelope,
  projectAgentTransactionEnvelope,
} from "../../src/protocol/evidence-projections";
import type { Refusal } from "../../src/protocol/areas/refusal";
import { digestCanonical } from "../../src/protocol/foundation/canonical";
import { nowIso } from "../../src/protocol/foundation/ids";
import {
  authMdAuthorizationServer,
  authMdProtectedResource,
  authMdRawCredential,
  greenlitAuthMdRuntimeContract,
  installedAuthMdKernel,
  proposeAuthMdRuntimeContract,
} from "../support/auth-md-flow";
import { futureIso } from "../support/fixtures";

describe("auth.md receipt reconstruction", () => {
  it("separates auth.md provenance from Handshake enforcement and downstream proof gaps", async () => {
    const fixture = await installedAuthMdKernel();
    const registrationRef = authMdEvidenceRef("registration", fixture.registrationEvidence.registrationEvidenceDigest);
    const identityAssertion = await buildAuthMdIdentityAssertionEvidence({
      protectedResource: authMdProtectedResource,
      authorizationServer: authMdAuthorizationServer,
      issuer: "https://provider.example.com",
      subject: "user:joel@example.com",
      audience: authMdProtectedResource,
      jti: "jti-authmd-reconstruction",
      verifiedEmail: "joel@example.com",
      jwksOrCimdRef: "jwks:https://provider.example.com/.well-known/jwks.json#kid-1",
      assurancePosture: "jwks_verified",
      identityAssertionJwt: "eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiJqb2VsQGV4YW1wbGUuY29tIn0.signature",
      issuedAt: nowIso(),
      expiresAt: futureIso(),
    });
    const identityAssertionRef = authMdEvidenceRef(
      "identity-assertion",
      identityAssertion.identityAssertionEvidenceDigest,
    );
    const claim = await buildAuthMdClaimEvidence({
      registrationId: "reg_authmd_demo",
      protectedResource: authMdProtectedResource,
      claimState: "pending_user_claim",
      scopeTransition: "scope_widened_requires_rotation",
      preClaimCredentialRefId: fixture.credentialRef.gatewayCredentialRefId,
      preClaimCredentialRefDigest: fixture.credentialRef.gatewayCredentialRefDigest,
      claimToken: "claim_token=authmd-secret-claim-token",
      claimedSubject: "user:joel@example.com",
      verifiedEmail: "joel@example.com",
      rotateOnClaimRequired: true,
      evidenceRefs: ["evidence:auth-md-claim-provider:redacted"],
      claimedAt: nowIso(),
    });
    const claimRef = authMdEvidenceRef("claim", claim.claimEvidenceDigest);
    const revocation = await buildAuthMdRevocationEvidence({
      registrationId: "reg_authmd_demo",
      protectedResource: authMdProtectedResource,
      gatewayCredentialRefId: fixture.credentialRef.gatewayCredentialRefId,
      gatewayCredentialRefDigest: fixture.credentialRef.gatewayCredentialRefDigest,
      revocationEventKind: "downstream_401",
      revocationReasonCode: "auth_md_downstream_401",
      downstreamStatus: { status: 401, providerRequestId: "request-redacted" },
      logoutJwt: "eyJhbGciOiJSUzI1NiJ9.eyJldmVudCI6ImxvZ291dCJ9.signature",
      evidenceRefs: ["evidence:auth-md-downstream-401:redacted"],
      observedAt: nowIso(),
    });
    const revocationRef = authMdEvidenceRef("revocation", revocation.revocationEvidenceDigest);
    const contract = await proposeAuthMdRuntimeContract(fixture, "dispatch:auth-md:receipt-reconstruction", {
      evidenceRefs: [registrationRef, identityAssertionRef, claimRef],
    });
    const policy = await fixture.kernel.evaluatePolicy({
      actionContractId: contract.actionContractId,
      envelopeId: fixture.envelope.envelopeId,
      signingSecret: "test-secret",
    });
    if (!policy.greenlight) throw new Error("expected auth.md greenlight");

    const gateway = await runAuthMdProtectedApiCallGateway({
      protocol: fixture.kernel,
      surface: authMdSurface("unknown", [revocationRef]),
      actionContractId: contract.actionContractId,
      greenlightId: policy.greenlight.greenlightId,
      observedParameters: contract.parameters as AuthMdProtectedApiCallParameters,
      surfaceOperationRef: "surface-op:auth-md:receipt-reconstruction",
    });

    expect(gateway.outcome).toBe("protected_api_call_proof_gap");
    if (!gateway.credentialResolutionEvidence) throw new Error("expected credential resolution evidence");
    if (!gateway.gatewayCheck.mutationAttempt) throw new Error("expected mutation attempt");

    const assembly = await assembleAgentTransactionEnvelope(fixture.store, contract);
    const projection = await projectAgentTransactionEnvelope(assembly.input);

    expect(projection.policyDecisionRef).toBe(policy.decision.policyDecisionId);
    expect(projection.greenlightRef).toBe(policy.greenlight.greenlightId);
    expect(projection.gateAttemptRef).toBe(gateway.gatewayCheck.gateAttempt.gateAttemptId);
    expect(projection.mutationAttemptRef).toBe(gateway.gatewayCheck.mutationAttempt.mutationAttemptId);
    expect(projection.gatewayAdmissionStatus).toBe("admitted");
    expect(projection.downstreamOutcomeStatus).toBe("pending");
    expect(projection.reconciliationFinalityStatus).toBe("unknown");
    expect(projection.proofGapReasonCodes).toContain("orphan_mitigation_required");
    expect(projection.authMdEvidenceRefs.discoveryRefs).toContain(
      authMdEvidenceRef("discovery", fixture.discovery.protectedResourceMetadataDigest),
    );
    expect(projection.authMdEvidenceRefs.authorizationServerRefs).toContain(
      authMdEvidenceRef("authorization-server", fixture.discovery.authorizationServerMetadataDigest),
    );
    expect(projection.authMdEvidenceRefs.registrationRefs).toContain(registrationRef);
    expect(projection.authMdEvidenceRefs.identityAssertionRefs).toContain(identityAssertionRef);
    expect(projection.authMdEvidenceRefs.claimRefs).toContain(claimRef);
    expect(projection.authMdEvidenceRefs.revocationRefs).toContain(revocationRef);
    expect(projection.authMdEvidenceRefs.credentialCustodyRefs).toContain(
      `gateway_credential_ref:${fixture.credentialRef.gatewayCredentialRefId}`,
    );
    expect(projection.authMdEvidenceRefs.credentialResolutionRefs).toContain(
      `credential_resolution_evidence:${gateway.credentialResolutionEvidence.credentialResolutionEvidenceId}`,
    );
    expect(projection.authMdEvidenceRefs.protectedApiCallRefs).toContain(
      `evidence:auth-md-protected-api-call:${gateway.gatewayCheck.gateAttempt.gateAttemptId}`,
    );
    expect(projection.authMdEvidenceLabels).toEqual(
      expect.arrayContaining([
        "auth_md_discovery",
        "auth_md_authorization_server_metadata",
        "auth_md_identity_assertion",
        "auth_md_registration",
        "auth_md_claim",
        "auth_md_revocation",
        "gateway_credential_custody",
        "handshake_policy_decision",
        "handshake_one_use_greenlight",
        "handshake_gateway_check",
        "gateway_credential_resolution",
        "handshake_mutation_attempt",
        "auth_md_protected_api_call_evidence",
        "handshake_proof_gap",
        "downstream_uncertainty",
      ]),
    );
    const serializedProjection = JSON.stringify(projection);
    expect(serializedProjection).not.toContain(authMdRawCredential);
    expect(serializedProjection).not.toContain("authmd-secret-claim-token");
    expect(serializedProjection).not.toContain("joel@example.com");
    expect(serializedProjection).not.toContain("eyJhbGci");
  });

  it("projects auth.md policy refusal without implying gateway admission or credential use", async () => {
    const fixture = await installedAuthMdKernel();
    const first = await greenlitAuthMdRuntimeContract(fixture, "dispatch:auth-md:receipt-refusal-1");
    const secondContract = await proposeAuthMdRuntimeContract(fixture, "dispatch:auth-md:receipt-refusal-2");
    const refusedPolicy = await fixture.kernel.evaluatePolicy({
      actionContractId: secondContract.actionContractId,
      envelopeId: fixture.envelope.envelopeId,
      signingSecret: "test-secret",
    });
    expect(first.greenlight.maxUses).toBe(1);
    expect(refusedPolicy.greenlight).toBeNull();
    expect(refusedPolicy.decision.decisionReasonCode).toBe("idempotency_duplicate_authority");

    const projection = await projectAgentTransactionEnvelope({
      contract: secondContract,
      policyDecision: refusedPolicy.decision,
      refusals: (await fixture.store.listRecordsByType<Refusal>("refusal")).map((record) => record.payload),
    });

    expect(projection.gatewayAdmissionStatus).toBe("not_requested");
    expect(projection.downstreamOutcomeStatus).toBe("not_started");
    expect(projection.greenlightRef).toBeNull();
    expect(projection.gateAttemptRef).toBeNull();
    expect(projection.mutationAttemptRef).toBeNull();
    expect(projection.credentialResolutionEvidenceRefs).toEqual([]);
    expect(projection.refusalReasonCodes).toContain("idempotency_duplicate_authority");
    expect(projection.authMdEvidenceRefs.registrationRefs).toContain(
      authMdEvidenceRef("registration", fixture.registrationEvidence.registrationEvidenceDigest),
    );
    expect(projection.authMdEvidenceLabels).toEqual(
      expect.arrayContaining(["auth_md_registration", "handshake_policy_decision", "handshake_refusal"]),
    );
    expect(projection.authMdEvidenceLabels).not.toContain("handshake_gateway_check");
    expect(JSON.stringify(projection)).not.toContain(authMdRawCredential);
  });
});

function authMdSurface(
  downstreamStatus: AuthMdProtectedApiCallDownstreamStatus,
  extraEvidenceRefs: string[] = [],
): AuthMdProtectedApiCallSurface {
  return {
    async executeProtectedApiCall(command: AuthMdProtectedApiCallCommand) {
      const responseDigest =
        downstreamStatus === "succeeded"
          ? await digestCanonical({
              ok: true,
              operationId: command.parameters.operationId,
              gateAttemptId: command.verifiedGate.gateAttemptId,
            })
          : null;
      return {
        evidenceRef: `evidence:auth-md-protected-api-call:${command.verifiedGate.gateAttemptId}`,
        surfaceOperationRef: command.verifiedGate.surfaceOperationRef,
        targetHttpMethod: command.parameters.targetHttpMethod,
        endpointUrl: command.parameters.endpointUrl,
        requestBodyDigest: command.parameters.requestBodyDigest,
        selectedHeadersDigest: command.parameters.selectedHeadersDigest,
        responseDigest,
        downstreamStatus,
        providerRequestRef: command.providerRequestRef,
        providerOperationRef: command.providerOperationRef,
        evidenceRefs: [command.credentialUseRef, ...extraEvidenceRefs],
      };
    },
  };
}
