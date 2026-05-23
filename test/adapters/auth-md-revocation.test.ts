import { describe, expect, it } from "bun:test";
import {
  applyAuthMdCredentialLifecycleIsolation,
  runAuthMdProtectedApiCallGateway,
  type AuthMdProtectedApiCallCommand,
  type AuthMdProtectedApiCallParameters,
  type AuthMdProtectedApiCallSurface,
  type AuthMdRevocationEventKind,
} from "../../src/adapters/auth-md";
import type { Greenlight } from "../../src/protocol/areas/policy-greenlight";
import { nowIso } from "../../src/protocol/foundation/ids";
import {
  authMdRawCredential,
  greenlitAuthMdRuntimeContract,
  proposeAuthMdRuntimeContract,
  recordCount,
} from "../support/auth-md-flow";
import { futureIso } from "../support/fixtures";

const lifecycleScenarios: Array<{
  eventKind: AuthMdRevocationEventKind;
  isolationState: "revoked" | "quarantined" | "state_suspect";
  policyReasonCode: string;
  gatewayReasonCode: string;
}> = [
  {
    eventKind: "logout_jwt",
    isolationState: "revoked",
    policyReasonCode: "isolation_revoked",
    gatewayReasonCode: "current_isolation_revoked",
  },
  {
    eventKind: "explicit_revocation",
    isolationState: "revoked",
    policyReasonCode: "isolation_revoked",
    gatewayReasonCode: "current_isolation_revoked",
  },
  {
    eventKind: "credential_expired",
    isolationState: "revoked",
    policyReasonCode: "isolation_revoked",
    gatewayReasonCode: "current_isolation_revoked",
  },
  {
    eventKind: "downstream_401",
    isolationState: "quarantined",
    policyReasonCode: "isolation_quarantined",
    gatewayReasonCode: "current_isolation_quarantined",
  },
  {
    eventKind: "metadata_drift",
    isolationState: "quarantined",
    policyReasonCode: "isolation_quarantined",
    gatewayReasonCode: "current_isolation_quarantined",
  },
  {
    eventKind: "ambiguous",
    isolationState: "state_suspect",
    policyReasonCode: "isolation_state_suspect",
    gatewayReasonCode: "current_isolation_state_suspect",
  },
];

describe("auth.md revocation and credential-ref isolation", () => {
  it("maps lifecycle evidence to credential-ref isolation without raw auth.md material", async () => {
    for (const scenario of lifecycleScenarios) {
      const fixture = await greenlitAuthMdRuntimeContract(
        undefined,
        `dispatch:auth-md:lifecycle-map:${scenario.eventKind}`,
      );

      const result = await applyAuthMdCredentialLifecycleIsolation(fixture.kernel, {
        tenantId: fixture.contract.tenantId,
        organizationId: fixture.contract.organizationId,
        registrationId: "reg_authmd_demo",
        protectedResource: fixture.discovery.protectedResourceMetadata.resource,
        gatewayCredentialRefId: fixture.credentialRef.gatewayCredentialRefId,
        gatewayCredentialRefDigest: fixture.credentialRef.gatewayCredentialRefDigest,
        revocationEventKind: scenario.eventKind,
        revocationReasonCode: `auth_md_${scenario.eventKind}`,
        providerEvent: { type: scenario.eventKind, subject: "user:joel@example.com" },
        logoutJwt: "eyJhbGciOiJSUzI1NiJ9.eyJldmVudCI6ImxvZ291dCJ9.signature",
        downstreamStatus: { status: scenario.eventKind === "downstream_401" ? 401 : "unknown" },
        evidenceRefs: [`evidence:auth-md-lifecycle:${scenario.eventKind}`],
        observedAt: nowIso(),
      });

      expect(result.authorityCreated).toBe(false);
      expect(result.futurePolicyAndGatewayUseAllowed).toBe(false);
      expect(result.revocationEvidence.authorityCreated).toBe(false);
      expect(result.revocationEvidence.futurePolicyAndGatewayUseAllowed).toBe(false);
      expect(result.isolationState.scopeType).toBe("credential_ref");
      expect(result.isolationState.scopeId).toBe(fixture.credentialRef.gatewayCredentialRefId);
      expect(result.isolationState.state).toBe(scenario.isolationState);
      expect(result.isolationState.sourceDecisionRef).toBe(result.revocationEvidenceRef);
      expect(await recordCount(fixture.store, "isolation_state")).toBe(1);
      const serialized = JSON.stringify(result);
      expect(serialized).not.toContain(authMdRawCredential);
      expect(serialized).not.toContain("joel@example.com");
      expect(serialized).not.toContain("eyJhbGci");
    }
  });

  it("blocks future policy and stale unconsumed greenlights after auth.md lifecycle isolation", async () => {
    for (const scenario of lifecycleScenarios) {
      const fixture = await greenlitAuthMdRuntimeContract(
        undefined,
        `dispatch:auth-md:lifecycle-block:${scenario.eventKind}:first`,
      );
      const isolation = await applyAuthMdCredentialLifecycleIsolation(fixture.kernel, {
        tenantId: fixture.contract.tenantId,
        organizationId: fixture.contract.organizationId,
        registrationId: "reg_authmd_demo",
        protectedResource: fixture.discovery.protectedResourceMetadata.resource,
        gatewayCredentialRefId: fixture.credentialRef.gatewayCredentialRefId,
        gatewayCredentialRefDigest: fixture.credentialRef.gatewayCredentialRefDigest,
        revocationEventKind: scenario.eventKind,
        revocationReasonCode: `auth_md_${scenario.eventKind}`,
        providerEvent: { type: scenario.eventKind },
        logoutJwt: "eyJhbGciOiJSUzI1NiJ9.eyJldmVudCI6ImxvZ291dCJ9.signature",
        downstreamStatus: { status: scenario.eventKind === "downstream_401" ? 401 : "unknown" },
        evidenceRefs: [`evidence:auth-md-lifecycle:${scenario.eventKind}`],
        observedAt: nowIso(),
        isolationExpiresAt: futureIso(),
      });

      const nextContract = await proposeAuthMdRuntimeContract(
        fixture,
        `dispatch:auth-md:lifecycle-block:${scenario.eventKind}:next`,
        {
          idempotencyMaterialRef: `commit:lifecycle-${scenario.eventKind}`,
        },
      );
      const nextPolicy = await fixture.kernel.evaluatePolicy({
        actionContractId: nextContract.actionContractId,
        envelopeId: fixture.envelope.envelopeId,
        signingSecret: "test-secret",
      });
      expect(nextPolicy.greenlight).toBeNull();
      expect(nextPolicy.decision.decision).toBe("quarantine");
      expect(nextPolicy.decision.decisionReasonCode).toBe(scenario.policyReasonCode);
      expect(nextPolicy.decision.isolationSnapshotRef).toContain(isolation.isolationState.isolationStateId);

      const surface = countingSurface();
      const gatewayResult = await runAuthMdProtectedApiCallGateway({
        protocol: fixture.kernel,
        surface,
        actionContractId: fixture.contract.actionContractId,
        greenlightId: fixture.greenlight.greenlightId,
        observedParameters: fixture.contract.parameters as AuthMdProtectedApiCallParameters,
        surfaceOperationRef: `surface-op:auth-md:lifecycle-block:${scenario.eventKind}`,
      });

      expect(gatewayResult.outcome).toBe("gateway_check_refused");
      expect(gatewayResult.gatewayCheck.gateAttempt.gateDecisionReasonCode).toBe(scenario.gatewayReasonCode);
      expect(gatewayResult.gatewayCheck.gateAttempt.consumedGreenlight).toBe(false);
      expect(gatewayResult.gatewayCheck.mutationAttempt).toBeNull();
      expect(surface.callCount()).toBe(0);
      expect(await recordCount(fixture.store, "credential_resolution_evidence")).toBe(0);
      expect(await recordCount(fixture.store, "mutation_attempt")).toBe(0);
      const greenlightRecord = await fixture.store.getRecord<Greenlight>("greenlight", fixture.greenlight.greenlightId);
      expect(greenlightRecord?.payload.consumedAt).toBeNull();
    }
  });
});

function countingSurface() {
  let calls = 0;
  const commands: AuthMdProtectedApiCallCommand[] = [];
  const surface: AuthMdProtectedApiCallSurface = {
    async executeProtectedApiCall(command) {
      calls += 1;
      commands.push(command);
      return {
        evidenceRef: `evidence:auth-md-revocation:${command.verifiedGate.gateAttemptId}`,
        surfaceOperationRef: command.verifiedGate.surfaceOperationRef,
        targetHttpMethod: command.parameters.targetHttpMethod,
        endpointUrl: command.parameters.endpointUrl,
        requestBodyDigest: command.parameters.requestBodyDigest,
        selectedHeadersDigest: command.parameters.selectedHeadersDigest,
        responseDigest: null,
        downstreamStatus: "succeeded",
        providerRequestRef: command.providerRequestRef,
        providerOperationRef: command.providerOperationRef,
        evidenceRefs: [command.credentialUseRef],
      };
    },
  };
  return {
    ...surface,
    callCount: () => calls,
    commands: () => commands,
  };
}
