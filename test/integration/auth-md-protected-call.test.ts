import { describe, expect, it } from "bun:test";
import {
  applyAuthMdCredentialLifecycleIsolation,
  authMdEvidenceRef,
  authMdProtectedApiCallBypassProbeExecutors,
  buildAuthMdClaimEvidence,
  buildAuthMdIdentityAssertionEvidence,
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
import type { Greenlight } from "../../src/protocol/areas/policy-greenlight";
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

type WorkflowTranscriptRow = {
  id: number;
  workflow: string;
  outcome: string;
  authorityCreated: boolean;
  evidenceRefs: string[];
};

describe("auth.md protected-call workflow matrix", () => {
  it("covers the twelve required workflows as a local demo transcript", async () => {
    const transcript: WorkflowTranscriptRow[] = [];
    const fixture = await installedAuthMdKernel();
    const discoveryRef = authMdEvidenceRef("discovery", fixture.discovery.protectedResourceMetadataDigest);
    const authorizationServerRef = authMdEvidenceRef(
      "authorization-server",
      fixture.discovery.authorizationServerMetadataDigest,
    );
    transcript.push({
      id: 1,
      workflow: "agent discovers service auth metadata from auth.md / PRM",
      outcome: "PRM plus authorization-server agent_auth evidence recorded as provenance only",
      authorityCreated: false,
      evidenceRefs: [discoveryRef, authorizationServerRef],
    });

    const identityAssertion = await buildAuthMdIdentityAssertionEvidence({
      protectedResource: authMdProtectedResource,
      authorizationServer: authMdAuthorizationServer,
      issuer: "https://provider.example.com",
      subject: "user:joel@example.com",
      audience: authMdProtectedResource,
      jti: "jti-authmd-workflow",
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
    transcript.push({
      id: 2,
      workflow: "agent obtains a credential through agent-verified ID-JAG flow",
      outcome: "ID-JAG assertion evidence is redacted and non-authoritative",
      authorityCreated: identityAssertion.authorityCreated,
      evidenceRefs: [identityAssertionRef],
    });

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
    transcript.push({
      id: 3,
      workflow: "agent obtains or upgrades a credential through user-claimed flow",
      outcome: "pending claim records rotate/quarantine requirement; wider write is not greenlit by claim evidence",
      authorityCreated: claim.authorityCreated,
      evidenceRefs: [claimRef],
    });

    const registrationRef = authMdEvidenceRef("registration", fixture.registrationEvidence.registrationEvidenceDigest);
    transcript.push({
      id: 4,
      workflow: "credential is placed into Handshake gateway custody as GatewayCredentialRef",
      outcome: "raw credential converted to opaque gateway credential ref",
      authorityCreated: false,
      evidenceRefs: [registrationRef, `gateway_credential_ref:${fixture.credentialRef.gatewayCredentialRefId}`],
    });

    const contract = await proposeAuthMdRuntimeContract(fixture, "dispatch:auth-md:workflow-demo", {
      evidenceRefs: [registrationRef, identityAssertionRef, claimRef],
    });
    transcript.push({
      id: 5,
      workflow: "generated code proposes a consequential API call after registration",
      outcome: "runtime proposal produced a candidate/action contract without policy or gateway authority",
      authorityCreated: false,
      evidenceRefs: contract.evidenceRefs,
    });
    transcript.push({
      id: 6,
      workflow: "Handshake compiles and canonicalizes that call into an exact ActionContract",
      outcome: `${contract.actionClass} binds params, credential ref, idempotency, resource, and metadata digests`,
      authorityCreated: false,
      evidenceRefs: [`action_contract:${contract.actionContractId}`],
    });

    const policy = await fixture.kernel.evaluatePolicy({
      actionContractId: contract.actionContractId,
      envelopeId: fixture.envelope.envelopeId,
      signingSecret: "test-secret",
    });
    if (!policy.greenlight) throw new Error("expected auth.md workflow greenlight");
    const duplicateContract = await proposeAuthMdRuntimeContract(fixture, "dispatch:auth-md:workflow-duplicate");
    const duplicatePolicy = await fixture.kernel.evaluatePolicy({
      actionContractId: duplicateContract.actionContractId,
      envelopeId: fixture.envelope.envelopeId,
      signingSecret: "test-secret",
    });
    const reviewPolicy = await policyDecisionForCredentialIsolation("review_only", "workflow-review");
    const haltPolicy = await policyDecisionForCredentialIsolation("halted", "workflow-halt");
    const quarantinePolicy = await policyDecisionForCredentialIsolation("quarantined", "workflow-quarantine");
    transcript.push({
      id: 7,
      workflow: "policy returns greenlight/refusal/review/halt/quarantine",
      outcome: [
        policy.decision.decision,
        duplicatePolicy.decision.decision,
        reviewPolicy.decision.decision,
        haltPolicy.decision.decision,
        quarantinePolicy.decision.decision,
      ].join(","),
      authorityCreated: Boolean(policy.greenlight),
      evidenceRefs: [
        `policy_decision:${policy.decision.policyDecisionId}`,
        `policy_decision:${duplicatePolicy.decision.policyDecisionId}`,
        `policy_decision:${reviewPolicy.decision.policyDecisionId}`,
        `policy_decision:${haltPolicy.decision.policyDecisionId}`,
        `policy_decision:${quarantinePolicy.decision.policyDecisionId}`,
      ],
    });

    const gateway = await runAuthMdProtectedApiCallGateway({
      protocol: fixture.kernel,
      surface: redactedSurface(),
      actionContractId: contract.actionContractId,
      greenlightId: policy.greenlight.greenlightId,
      observedParameters: contract.parameters as AuthMdProtectedApiCallParameters,
      surfaceOperationRef: "surface-op:auth-md:workflow-demo",
    });
    if (!gateway.credentialResolutionEvidence) throw new Error("expected credential resolution evidence");
    transcript.push({
      id: 8,
      workflow: "gateway injects or uses the credential only after exact one-use greenlight verification",
      outcome: `${gateway.outcome}; credential resolution is post-gateway-check evidence`,
      authorityCreated: false,
      evidenceRefs: [
        `greenlight:${policy.greenlight.greenlightId}`,
        `gateway_check_attempt:${gateway.gatewayCheck.gateAttempt.gateAttemptId}`,
        `credential_resolution_evidence:${gateway.credentialResolutionEvidence.credentialResolutionEvidenceId}`,
      ],
    });

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
            rawBearerPassthroughStatus: "present",
            directHttpCallStatus: "present",
            siblingMcpCallStatus: "present",
            browserToolCallStatus: "present",
            rawNetworkCallStatus: "present",
            tokenReplayStatus: "present",
            metadataFreshnessStatus: "stale",
            unsafeRetryLoopStatus: "present",
            gatewayWrapperDriftStatus: "present",
            failureClosedStatus: "failed",
          };
        },
      }),
    );
    transcript.push({
      id: 9,
      workflow: "raw credential bypass is prevented, detected, or recorded as bypass/proof gap",
      outcome: "hostile raw bearer, HTTP, MCP, browser, network, replay, stale metadata, and retry paths detected",
      authorityCreated: false,
      evidenceRefs: probes.flatMap((probe) => probe.evidenceRefs),
    });

    const revocationFixture = await installedAuthMdKernel();
    const revocationContract = await proposeAuthMdRuntimeContract(
      revocationFixture,
      "dispatch:auth-md:workflow-revoked",
    );
    const revocationPolicy = await revocationFixture.kernel.evaluatePolicy({
      actionContractId: revocationContract.actionContractId,
      envelopeId: revocationFixture.envelope.envelopeId,
      signingSecret: "test-secret",
    });
    if (!revocationPolicy.greenlight) throw new Error("expected greenlight before revocation isolation");
    const lifecycle = await applyAuthMdCredentialLifecycleIsolation(revocationFixture.kernel, {
      tenantId: revocationContract.tenantId,
      organizationId: revocationContract.organizationId,
      registrationId: "reg_authmd_demo",
      protectedResource: authMdProtectedResource,
      gatewayCredentialRefId: revocationFixture.credentialRef.gatewayCredentialRefId,
      gatewayCredentialRefDigest: revocationFixture.credentialRef.gatewayCredentialRefDigest,
      revocationEventKind: "logout_jwt",
      revocationReasonCode: "auth_md_logout",
      logoutJwt: "eyJhbGciOiJSUzI1NiJ9.eyJldmVudCI6ImxvZ291dCJ9.signature",
      evidenceRefs: ["evidence:auth-md-logout:redacted"],
      observedAt: nowIso(),
    });
    const blockedGate = await runAuthMdProtectedApiCallGateway({
      protocol: revocationFixture.kernel,
      surface: redactedSurface(),
      actionContractId: revocationContract.actionContractId,
      greenlightId: revocationPolicy.greenlight.greenlightId,
      observedParameters: revocationContract.parameters as AuthMdProtectedApiCallParameters,
      surfaceOperationRef: "surface-op:auth-md:workflow-revoked",
    });
    const greenlightRecord = await revocationFixture.store.getRecord<Greenlight>(
      "greenlight",
      revocationPolicy.greenlight.greenlightId,
    );
    transcript.push({
      id: 10,
      workflow: "revocation/logout/session event invalidates or quarantines future greenlights and gateway checks",
      outcome: `${lifecycle.isolationState.state}; ${blockedGate.gatewayCheck.gateAttempt.gateDecisionReasonCode}; unconsumed=${greenlightRecord?.payload.consumedAt === null}`,
      authorityCreated: false,
      evidenceRefs: [lifecycle.revocationEvidenceRef, `isolation_state:${lifecycle.isolationState.isolationStateId}`],
    });

    const projection = await projectAgentTransactionEnvelope(
      (await assembleAgentTransactionEnvelope(fixture.store, contract)).input,
    );
    transcript.push({
      id: 11,
      workflow:
        "receipt distinguishes registration, custody, gateway check, mutation, refusal, and downstream uncertainty",
      outcome: projection.authMdEvidenceLabels.join(","),
      authorityCreated: false,
      evidenceRefs: projection.evidenceRefs,
    });

    transcript.push({
      id: 12,
      workflow: "WorkOS/auth.md outreach asks for feedback/attestation only after a concrete profile and demo exist",
      outcome:
        "feedback-ready after this local profile/demo evidence; attestation remains blocked until external review",
      authorityCreated: false,
      evidenceRefs: [
        "profile:auth_md_registered_credential.v0",
        "profile:auth_md_protected_api_call.exact.v0",
        "demo:auth-md-protected-call-workflow",
      ],
    });

    expect(transcript.map((row) => row.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    expect(transcript.every((row) => row.evidenceRefs.length > 0)).toBe(true);
    expect(
      transcript
        .find((row) => row.id === 7)
        ?.outcome.split(",")
        .sort(),
    ).toEqual(["greenlight", "halt", "quarantine", "refuse", "review_required"]);
    expect(transcript.find((row) => row.id === 8)?.outcome).toContain("protected_api_call_reconciled");
    expect(transcript.find((row) => row.id === 10)?.outcome).toContain("current_isolation_revoked");
    expect(transcript.find((row) => row.id === 11)?.outcome).toContain("handshake_gateway_check");
    const serializedTranscript = JSON.stringify(transcript);
    expect(serializedTranscript).not.toContain(authMdRawCredential);
    expect(serializedTranscript).not.toContain("authmd-secret-claim-token");
    expect(serializedTranscript).not.toContain("joel@example.com");
    expect(serializedTranscript).not.toContain("eyJhbGci");
  });
});

async function policyDecisionForCredentialIsolation(state: "review_only" | "quarantined" | "halted", suffix: string) {
  const fixture = await installedAuthMdKernel();
  const contract = await proposeAuthMdRuntimeContract(fixture, `dispatch:auth-md:${suffix}`);
  await fixture.kernel.createIsolationState({
    tenantId: contract.tenantId,
    organizationId: contract.organizationId,
    scopeType: "credential_ref",
    scopeId: fixture.credentialRef.gatewayCredentialRefId,
    state,
    reasonCode: `auth_md_${state}`,
    reasonSummary: `auth.md workflow demo installed ${state} isolation.`,
    sourceDecisionRef: `evidence:auth-md-workflow:${state}`,
  });
  return fixture.kernel.evaluatePolicy({
    actionContractId: contract.actionContractId,
    envelopeId: fixture.envelope.envelopeId,
    signingSecret: "test-secret",
  });
}

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
