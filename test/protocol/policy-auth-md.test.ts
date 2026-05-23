import { describe, expect, it } from "bun:test";
import {
  buildAuthMdClaimEvidence,
  buildAuthMdIdentityAssertionEvidence,
  buildAuthMdRevocationEvidence,
} from "../../src/adapters/auth-md";
import { digestCanonical } from "../../src/protocol/foundation/canonical";
import { nowIso } from "../../src/protocol/foundation/ids";
import {
  authMdProtectedResource,
  authMdRawCredential,
  expectNoRuntimeAuthorityRecords,
  installedAuthMdKernel,
  proposeAuthMdRuntimeContract,
  recordCount,
} from "../support/auth-md-flow";
import { futureIso } from "../support/fixtures";

describe("auth.md policy and greenlight binding", () => {
  it("greenlights only the exact auth.md action contract and binds one-use gateway authority fields", async () => {
    const fixture = await installedAuthMdKernel();
    const contract = await proposeAuthMdRuntimeContract(fixture, "dispatch:auth-md:policy-greenlight");

    const result = await fixture.kernel.evaluatePolicy({
      actionContractId: contract.actionContractId,
      envelopeId: fixture.envelope.envelopeId,
      signingSecret: "test-secret",
    });

    expect(result).toMatchObject({
      authorityCreated: true,
      gatewayCheckPerformed: false,
      mutationAttempted: false,
      nextAction: "use_greenlight_at_gateway",
    });
    expect(result.decision).toMatchObject({
      actionContractId: contract.actionContractId,
      envelopeId: fixture.envelope.envelopeId,
      policyPackVersion: fixture.envelope.policyPackVersion,
      decision: "greenlight",
      decisionReasonCode: "policy_passed",
      isolationSnapshotRef: "isolation:none",
    });
    expect(result.decision.policyInputDigest).toMatch(/^sha256:[a-f0-9]{64}$/);
    expect(result.greenlight).toMatchObject({
      actionContractId: contract.actionContractId,
      policyDecisionId: result.decision.policyDecisionId,
      gatewayRegistryEntryId: fixture.gateway.gatewayRegistryEntryId,
      gatewayRegistryVersion: fixture.gateway.gatewayRegistryVersion,
      gatewayId: fixture.gateway.gatewayId,
      gatewayPolicyVersion: fixture.gateway.gatewayPolicyVersion,
      actionClass: "auth_md_protected_api_call.exact",
      resourceRef: contract.resourceRef,
      paramsDigest: contract.paramsDigest,
      contractDigest: contract.actionContractDigest,
      maxUses: 1,
      isolationSnapshotRef: "isolation:none",
      requiredReceipt: "mutation",
      consumedAt: null,
      consumedByGateAttemptId: null,
    });
    expect(result.evidenceRefs).toContain(result.decision.policyInputDigest);
    expect(JSON.stringify(result)).not.toContain(authMdRawCredential);
    expect(await recordCount(fixture.store, "policy_decision")).toBe(1);
    expect(await recordCount(fixture.store, "greenlight")).toBe(1);
    expect(await recordCount(fixture.store, "gateway_check_attempt")).toBe(0);
    expect(await recordCount(fixture.store, "mutation_attempt")).toBe(0);

    const duplicateEvaluation = await fixture.kernel.evaluatePolicy({
      actionContractId: contract.actionContractId,
      envelopeId: fixture.envelope.envelopeId,
      signingSecret: "test-secret",
    });
    expect(duplicateEvaluation).toMatchObject({
      authorityCreated: false,
      greenlight: null,
      refusalReasonCode: "idempotency_duplicate_authority",
    });
    expect(await recordCount(fixture.store, "greenlight")).toBe(1);
  });

  it("refuses a second auth.md contract with the same exact idempotency authority", async () => {
    const fixture = await installedAuthMdKernel();
    const first = await proposeAuthMdRuntimeContract(fixture, "dispatch:auth-md:idempotency-1");
    const firstPolicy = await fixture.kernel.evaluatePolicy({
      actionContractId: first.actionContractId,
      envelopeId: fixture.envelope.envelopeId,
      signingSecret: "test-secret",
    });
    expect(firstPolicy.greenlight?.maxUses).toBe(1);

    const second = await proposeAuthMdRuntimeContract(fixture, "dispatch:auth-md:idempotency-2");
    expect(second.actionContractId).not.toBe(first.actionContractId);
    expect(second.idempotencyKey).toBe(first.idempotencyKey);

    const secondPolicy = await fixture.kernel.evaluatePolicy({
      actionContractId: second.actionContractId,
      envelopeId: fixture.envelope.envelopeId,
      signingSecret: "test-secret",
    });

    expect(secondPolicy).toMatchObject({
      authorityCreated: false,
      greenlight: null,
      refusalReasonCode: "idempotency_duplicate_authority",
      nextAction: "read_evidence",
    });
    expect(secondPolicy.decision).toMatchObject({
      actionContractId: second.actionContractId,
      decision: "refuse",
      decisionReasonCode: "idempotency_duplicate_authority",
    });
    expect(await recordCount(fixture.store, "greenlight")).toBe(1);
    expect(await recordCount(fixture.store, "refusal")).toBe(1);
    expect(await recordCount(fixture.store, "gateway_check_attempt")).toBe(0);
  });

  it("keeps registration, ID-JAG, claim, scopes, and revocation evidence non-authoritative", async () => {
    const fixture = await installedAuthMdKernel();
    const identityAssertion = await buildAuthMdIdentityAssertionEvidence({
      protectedResource: authMdProtectedResource,
      issuer: "https://provider.example.com",
      subject: "user:joel@example.com",
      audience: authMdProtectedResource,
      jti: "jti-authmd-policy-demo",
      verifiedEmail: "joel@example.com",
      jwksOrCimdRef: "jwks:https://provider.example.com/.well-known/jwks.json#kid-1",
      assurancePosture: "jwks_verified",
      identityAssertionJwt: "eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiJqb2VsQGV4YW1wbGUuY29tIn0.signature",
      issuedAt: nowIso(),
      expiresAt: futureIso(),
    });
    const claimToken = "claim_token=authmd-secret-claim-token";
    const claim = await buildAuthMdClaimEvidence({
      registrationId: "reg_authmd_demo",
      protectedResource: authMdProtectedResource,
      claimState: "claimed",
      scopeTransition: "rotated_credential_ref",
      preClaimCredentialRefId: fixture.credentialRef.gatewayCredentialRefId,
      preClaimCredentialRefDigest: fixture.credentialRef.gatewayCredentialRefDigest,
      postClaimCredentialRefId: "gcr_post_claim",
      postClaimCredentialRefDigest: await digestCanonical({ credentialRef: "post-claim" }),
      claimToken,
      claimedSubject: "user:joel@example.com",
      verifiedEmail: "joel@example.com",
      rotateOnClaimRequired: true,
      evidenceRefs: ["evidence:auth-md-claim-provider:redacted"],
      claimedAt: nowIso(),
    });
    const revocation = await buildAuthMdRevocationEvidence({
      registrationId: "reg_authmd_demo",
      protectedResource: authMdProtectedResource,
      gatewayCredentialRefId: fixture.credentialRef.gatewayCredentialRefId,
      gatewayCredentialRefDigest: fixture.credentialRef.gatewayCredentialRefDigest,
      revocationEventKind: "logout_jwt",
      revocationReasonCode: "auth_md_logout",
      providerEvent: { type: "logout", subject: "user:joel@example.com" },
      logoutJwt: "eyJhbGciOiJSUzI1NiJ9.eyJldmVudCI6ImxvZ291dCJ9.signature",
      evidenceRefs: ["evidence:auth-md-logout:redacted"],
      observedAt: nowIso(),
    });

    expect(fixture.credentialRef.secretMaterialIncluded).toBe(false);
    expect(fixture.credentialRef.actionClasses).toEqual(["auth_md_protected_api_call.exact"]);
    expect(identityAssertion.authorityCreated).toBe(false);
    expect(claim.authorityCreated).toBe(false);
    expect(revocation.authorityCreated).toBe(false);
    expect(revocation.futurePolicyAndGatewayUseAllowed).toBe(false);
    expect(JSON.stringify({ identityAssertion, claim, revocation })).not.toContain(authMdRawCredential);
    expect(JSON.stringify({ identityAssertion, claim, revocation })).not.toContain("joel@example.com");

    await expect(
      fixture.kernel.evaluatePolicy({
        actionContractId: "auth_md_registration_is_not_contract",
        envelopeId: fixture.envelope.envelopeId,
        signingSecret: "test-secret",
      }),
    ).rejects.toThrow("was not found");
    await expectNoRuntimeAuthorityRecords(fixture.store);
  });
});
