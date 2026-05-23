import { describe, expect, it } from "bun:test";
import {
  runAuthMdProtectedApiCallGateway,
  type AuthMdProtectedApiCallCommand,
  type AuthMdProtectedApiCallParameters,
  type AuthMdProtectedApiCallSurface,
} from "../../src/adapters/auth-md";
import { ProtocolRecorder } from "../../src/protocol/events/records";
import type { Greenlight } from "../../src/protocol/areas/policy-greenlight";
import type { GatewayRegistryEntry } from "../../src/protocol/public/schemas";
import { authMdSelectedHeadersDigest, greenlitAuthMdRuntimeContract, recordCount } from "../support/auth-md-flow";

describe("auth.md gateway pressure", () => {
  it("refuses scope, metadata, and credential-ref drift before credential resolution or service execution", async () => {
    for (const scenario of [
      {
        label: "scope drift",
        observedParameterOverrides: { requiredScopes: ["repo.write"] },
      },
      {
        label: "metadata drift",
        observedParameterOverrides: { protectedResourceMetadataDigest: `sha256:${"a".repeat(64)}` },
      },
      {
        label: "credential digest drift",
        observedParameterOverrides: { gatewayCredentialRefDigest: `sha256:${"b".repeat(64)}` },
      },
    ]) {
      const fixture = await greenlitAuthMdRuntimeContract(undefined, `dispatch:auth-md:${scenario.label}`);
      const surface = countingSurface();
      const result = await runAuthMdProtectedApiCallGateway({
        protocol: fixture.kernel,
        surface,
        actionContractId: fixture.contract.actionContractId,
        greenlightId: fixture.greenlight.greenlightId,
        observedParameters: {
          ...(fixture.contract.parameters as AuthMdProtectedApiCallParameters),
          ...scenario.observedParameterOverrides,
        },
        surfaceOperationRef: `surface-op:auth-md:${scenario.label}`,
      });

      expect(result.outcome).toBe("gateway_check_refused");
      expect(result.gatewayCheck.gateAttempt.gateDecisionReasonCode).toBe("params_mismatch");
      expect(result.gatewayCheck.mutationAttempt).toBeNull();
      expect(surface.callCount()).toBe(0);
      expect(await recordCount(fixture.store, "credential_resolution_evidence")).toBe(0);
      expect(await recordCount(fixture.store, "mutation_attempt")).toBe(0);
    }
  });

  it("refuses incompatible gateway policy drift before resolving auth.md credentials", async () => {
    const fixture = await greenlitAuthMdRuntimeContract(undefined, "dispatch:auth-md:gateway-policy-drift");
    await replaceGatewayRecordOutOfBand(fixture, {
      ...fixture.gateway,
      gatewayRegistryVersion: "v2",
      gatewayPolicyVersion: "v2",
    });
    const surface = countingSurface();

    const result = await runAuthMdProtectedApiCallGateway({
      protocol: fixture.kernel,
      surface,
      actionContractId: fixture.contract.actionContractId,
      greenlightId: fixture.greenlight.greenlightId,
      observedParameters: fixture.contract.parameters as AuthMdProtectedApiCallParameters,
      surfaceOperationRef: "surface-op:auth-md:gateway-policy-drift",
    });

    expect(result.outcome).toBe("gateway_check_refused");
    expect(result.gatewayCheck.gateAttempt.gateDecisionReasonCode).toBe("gateway_policy_drift");
    expect(result.gatewayCheck.gateAttempt.gatewayPolicyDriftStatus).toBe("incompatible");
    expect(result.gatewayCheck.gateAttempt.currentGatewayPolicyVersion).toBe("v2");
    expect(result.gatewayCheck.mutationAttempt).toBeNull();
    expect(surface.callCount()).toBe(0);
    expect(await recordCount(fixture.store, "credential_resolution_evidence")).toBe(0);
  });

  it("refuses stale greenlights when auth.md credential isolation lands before mutation", async () => {
    const fixture = await greenlitAuthMdRuntimeContract(undefined, "dispatch:auth-md:credential-revoked-before-gate");
    await fixture.kernel.createIsolationState({
      tenantId: fixture.contract.tenantId,
      organizationId: fixture.contract.organizationId,
      scopeType: "credential_ref",
      scopeId: fixture.credentialRef.gatewayCredentialRefId,
      state: "revoked",
      reasonCode: "auth_md_revocation",
      reasonSummary: "auth.md logout or revocation landed before the protected API call reached the gateway.",
      sourceDecisionRef: "evidence:auth-md-revocation:redacted",
    });
    const surface = countingSurface();

    const result = await runAuthMdProtectedApiCallGateway({
      protocol: fixture.kernel,
      surface,
      actionContractId: fixture.contract.actionContractId,
      greenlightId: fixture.greenlight.greenlightId,
      observedParameters: fixture.contract.parameters as AuthMdProtectedApiCallParameters,
      surfaceOperationRef: "surface-op:auth-md:credential-revoked-before-gate",
    });

    expect(result.outcome).toBe("gateway_check_refused");
    expect(result.gatewayCheck.gateAttempt.gateDecisionReasonCode).toBe("current_isolation_revoked");
    expect(result.gatewayCheck.gateAttempt.consumedGreenlight).toBe(false);
    expect(result.gatewayCheck.mutationAttempt).toBeNull();
    expect(surface.callCount()).toBe(0);
    expect(await recordCount(fixture.store, "credential_resolution_evidence")).toBe(0);
    expect(await recordCount(fixture.store, "mutation_attempt")).toBe(0);
    const greenlightRecord = await fixture.store.getRecord<Greenlight>("greenlight", fixture.greenlight.greenlightId);
    expect(greenlightRecord?.payload.consumedAt).toBeNull();
  });

  it("refuses gateway-observed unsafe auth.md parameters at exact-binding check", async () => {
    const fixture = await greenlitAuthMdRuntimeContract(undefined, "dispatch:auth-md:observed-unsafe");
    const surface = countingSurface();

    const result = await runAuthMdProtectedApiCallGateway({
      protocol: fixture.kernel,
      surface,
      actionContractId: fixture.contract.actionContractId,
      greenlightId: fixture.greenlight.greenlightId,
      observedParameters: {
        ...(fixture.contract.parameters as AuthMdProtectedApiCallParameters),
        selectedHeadersDigest: authMdSelectedHeadersDigest,
        rawAuthorizationHeaderObserved: true,
      },
      surfaceOperationRef: "surface-op:auth-md:observed-unsafe",
    });

    expect(result.outcome).toBe("gateway_check_refused");
    expect(result.gatewayCheck.gateAttempt.gateDecisionReasonCode).toBe("params_mismatch");
    expect(surface.callCount()).toBe(0);
    expect(await recordCount(fixture.store, "credential_resolution_evidence")).toBe(0);
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
        evidenceRef: `evidence:auth-md-pressure:${command.verifiedGate.gateAttemptId}`,
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

async function replaceGatewayRecordOutOfBand(
  fixture: Awaited<ReturnType<typeof greenlitAuthMdRuntimeContract>>,
  gateway: GatewayRegistryEntry,
): Promise<void> {
  const recorder = new ProtocolRecorder(fixture.store);
  await fixture.store.putRecord(await recorder.buildRecord({ objectType: "gateway_registry_entry", payload: gateway }));
}
