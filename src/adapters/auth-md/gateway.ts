import { z } from "zod";
import { downstreamFailureEvidence } from "../downstream-failure-evidence";
import {
  verifiedGatewayCheckFromResult,
  type GatewayCheckInput,
  type GatewayCheckResult,
  type VerifiedGatewayCheck,
} from "../../protocol/areas/gateway-gate";
import type {
  CredentialResolutionEvidence,
  RecordCredentialResolutionEvidenceInput,
} from "../../protocol/areas/credential-custody";
import type {
  ReconcileSurfaceOperationInput,
  SurfaceOperationReconciliation,
  SurfaceOperationReconciliationResult,
} from "../../protocol/areas/operation-lifecycle";
import { digestCanonical } from "../../protocol/foundation/canonical";
import { DigestSchema } from "../../protocol/foundation/schema-core";
import { HandshakeProtocolError } from "../../protocol/foundation/errors";
import {
  authMdProtectedApiCallRefusalReasonCodes,
  AuthMdProtectedApiCallParametersSchema,
  type AuthMdProtectedApiCallParameters,
} from "./action-proposal";
import {
  assertNoLeakedAuthMdCredentialMaterial,
  AuthMdProtectedApiCallAllowedHttpMethodSchema,
  canonicalizeAuthMdProtectedApiCallExactTransport,
} from "./profiles";

export const AuthMdProtectedApiCallDownstreamStatusSchema = z.enum(["succeeded", "refused", "unknown"]);
export type AuthMdProtectedApiCallDownstreamStatus = z.infer<typeof AuthMdProtectedApiCallDownstreamStatusSchema>;

export const AuthMdProtectedApiCallEvidenceSchema = z.strictObject({
  evidenceRef: z.string().min(1),
  surfaceOperationRef: z.string().min(1),
  targetHttpMethod: z.string().min(1),
  endpointUrl: z.string().url(),
  requestBodyDigest: DigestSchema.nullable().default(null),
  selectedHeadersDigest: DigestSchema,
  responseDigest: DigestSchema.nullable().default(null),
  downstreamStatus: AuthMdProtectedApiCallDownstreamStatusSchema,
  providerRequestRef: z.string().min(1).nullable().default(null),
  providerOperationRef: z.string().min(1).nullable().default(null),
  evidenceRefs: z.array(z.string().min(1)).default([]),
});
export type AuthMdProtectedApiCallEvidence = z.infer<typeof AuthMdProtectedApiCallEvidenceSchema>;

export const AuthMdProfileConformanceReason = {
  missingVerifiedGate: "auth_md_profile_missing_verified_gate",
  paramsDigestDrift: "auth_md_profile_params_digest_drift",
  leakedCredentialMaterial: "auth_md_profile_leaked_credential_material",
} as const;

export type AuthMdProfileConformanceInput = {
  verifiedGate?: VerifiedGatewayCheck;
  parameters?: AuthMdProtectedApiCallParameters;
  expectedActionContractId?: string;
};

export function assertAuthMdProfileConformance(input: AuthMdProfileConformanceInput): void {
  if (!input.verifiedGate) {
    throw new HandshakeProtocolError(
      AuthMdProfileConformanceReason.missingVerifiedGate,
      "auth.md profile conformance requires a verified gateway check before protected API call I/O",
      409,
    );
  }
  if (
    input.expectedActionContractId &&
    input.verifiedGate.actionContractId !== input.expectedActionContractId
  ) {
    throw new HandshakeProtocolError(
      AuthMdProfileConformanceReason.paramsDigestDrift,
      "auth.md observed parameters drift from verified greenlight action contract binding",
      409,
    );
  }
  if (input.parameters) {
    try {
      canonicalizeAuthMdProtectedApiCallExactTransport({
        targetHttpMethod: AuthMdProtectedApiCallAllowedHttpMethodSchema.parse(
          input.parameters.targetHttpMethod.trim().toUpperCase(),
        ),
        endpointUrl: input.parameters.endpointUrl,
        pathTemplate: input.parameters.pathTemplate,
        requestBodyDigest: input.parameters.requestBodyDigest,
        selectedHeadersDigest: input.parameters.selectedHeadersDigest,
        dynamicEndpointConstructionObserved: input.parameters.dynamicEndpointConstructionObserved,
        dynamicHostConstructionObserved: input.parameters.dynamicHostConstructionObserved,
        retryAuthorityReuseDetected: input.parameters.retryAuthorityReuseDetected,
      });
    } catch (error) {
      throw new HandshakeProtocolError(
        AuthMdProfileConformanceReason.paramsDigestDrift,
        error instanceof Error ? error.message : "auth.md profile transport canonicalization failed",
        409,
      );
    }
    assertNoLeakedAuthMdCredentialMaterial(input.parameters);
  }
}

export type AuthMdProtectedApiCallCommand = {
  verifiedGate: VerifiedGatewayCheck;
  parameters: AuthMdProtectedApiCallParameters;
  credentialResolutionEvidence: CredentialResolutionEvidence;
  credentialUseRef: string;
  providerRequestRef: string;
  providerOperationRef: string;
};

export interface AuthMdProtectedApiCallSurface {
  executeProtectedApiCall(command: AuthMdProtectedApiCallCommand): Promise<AuthMdProtectedApiCallEvidence>;
}

export type AuthMdProtectedApiCallGatewayProtocol = {
  gatewayCheck(input: GatewayCheckInput): Promise<GatewayCheckResult>;
  recordCredentialResolutionEvidence(
    input: RecordCredentialResolutionEvidenceInput,
  ): Promise<CredentialResolutionEvidence>;
  reconcileSurfaceOperation(input: ReconcileSurfaceOperationInput): Promise<SurfaceOperationReconciliationResult>;
};

export type AuthMdProtectedApiCallGatewayInput = {
  protocol: AuthMdProtectedApiCallGatewayProtocol;
  surface: AuthMdProtectedApiCallSurface;
  actionContractId: string;
  greenlightId: string;
  observedParameters: AuthMdProtectedApiCallParameters;
  surfaceOperationRef?: string;
};

export type AuthMdProtectedApiCallGatewayResult =
  | {
      outcome: "gateway_check_refused";
      gatewayCheck: GatewayCheckResult;
      credentialResolutionEvidence: null;
      reconciliation: null;
      apiCallEvidence: null;
    }
  | {
      outcome: "gateway_check_not_authoritative";
      gatewayCheck: GatewayCheckResult;
      credentialResolutionEvidence: null;
      reconciliation: null;
      apiCallEvidence: null;
    }
  | {
      outcome: "protected_api_call_reconciled";
      gatewayCheck: GatewayCheckResult;
      credentialResolutionEvidence: CredentialResolutionEvidence;
      reconciliation: SurfaceOperationReconciliation;
      apiCallEvidence: AuthMdProtectedApiCallEvidence;
    }
  | {
      outcome: "protected_api_call_refused";
      gatewayCheck: GatewayCheckResult;
      credentialResolutionEvidence: CredentialResolutionEvidence;
      reconciliation: SurfaceOperationReconciliation;
      apiCallEvidence: AuthMdProtectedApiCallEvidence;
    }
  | {
      outcome: "protected_api_call_proof_gap";
      gatewayCheck: GatewayCheckResult;
      credentialResolutionEvidence: CredentialResolutionEvidence;
      reconciliation: SurfaceOperationReconciliation;
      apiCallEvidence: AuthMdProtectedApiCallEvidence;
    }
  | {
      outcome: "protected_api_call_failed";
      gatewayCheck: GatewayCheckResult;
      credentialResolutionEvidence: CredentialResolutionEvidence | null;
      reconciliation: SurfaceOperationReconciliation;
      apiCallEvidence: null;
    };

export async function runAuthMdProtectedApiCallGateway(
  input: AuthMdProtectedApiCallGatewayInput,
): Promise<AuthMdProtectedApiCallGatewayResult> {
  const observedParameters = AuthMdProtectedApiCallParametersSchema.parse(input.observedParameters);
  const surfaceOperationRef = input.surfaceOperationRef ?? `surface-op:auth-md:${input.actionContractId}`;
  const gatewayCheck = await input.protocol.gatewayCheck({
    actionContractId: input.actionContractId,
    greenlightId: input.greenlightId,
    observedParameters,
    surfaceOperationRef,
  });

  const verifiedGate = verifiedGatewayCheckFromResult(gatewayCheck);
  if (!verifiedGate) {
    const outcome =
      gatewayCheck.gateAttempt.gateDecision === "refused" ? "gateway_check_refused" : "gateway_check_not_authoritative";
    return { outcome, gatewayCheck, credentialResolutionEvidence: null, reconciliation: null, apiCallEvidence: null };
  }

  const unsafeObservedReasons = authMdGatewayUnsafeObservedParameterReasons(observedParameters);
  if (unsafeObservedReasons.length > 0) {
    const failureEvidence = await redactedAuthMdFailureEvidence({
      surfaceOperationRef,
      error: new HandshakeProtocolError(
        unsafeObservedReasons[0] ?? "auth_md_gateway_observed_parameters_refused",
        `auth.md gateway refused unsafe observed parameters: ${unsafeObservedReasons.join(",")}`,
        409,
        { refusalRef: `refusal:auth-md-unsafe:${verifiedGate.gateAttemptId}` },
      ),
    });
    const { reconciliation } = await input.protocol.reconcileSurfaceOperation({
      mutationAttemptId: verifiedGate.mutationAttemptId,
      idempotencyKey: verifiedGate.idempotencyKey,
      observedSurfaceOperationRef: surfaceOperationRef,
      observedDownstreamStatus: "refused",
      ...failureEvidence,
      evidenceRefs: [
        ...(failureEvidence.evidenceRefs ?? []),
        ...unsafeObservedReasons.map((reasonCode) => `reason_code:${reasonCode}`),
      ],
      resolvedProofGapIds: [],
    });
    return {
      outcome: "protected_api_call_failed",
      gatewayCheck,
      credentialResolutionEvidence: null,
      reconciliation,
      apiCallEvidence: null,
    };
  }

  let credentialResolutionEvidence: CredentialResolutionEvidence | null = null;
  try {
    const providerRefs = providerRefsForGate(verifiedGate);
    credentialResolutionEvidence = await input.protocol.recordCredentialResolutionEvidence({
      actionContractId: input.actionContractId,
      greenlightId: input.greenlightId,
      gateAttemptId: verifiedGate.gateAttemptId,
      gatewayCredentialRefId: observedParameters.gatewayCredentialRefId,
      gatewayCredentialRefDigest: observedParameters.gatewayCredentialRefDigest,
      requestDigest: await credentialResolutionRequestDigest(verifiedGate, observedParameters),
      resultClass: "used_by_gateway",
      resultReasonCode: "gate_passed",
      redactionStatus: "redacted",
      providerRequestRef: providerRefs.providerRequestRef,
      providerOperationRef: providerRefs.providerOperationRef,
      evidenceRefs: [
        `gateway_credential_ref:${observedParameters.gatewayCredentialRefId}`,
        `digest:${observedParameters.gatewayCredentialRefDigest}`,
      ],
    });

    const command = {
      verifiedGate,
      parameters: observedParameters,
      credentialResolutionEvidence,
      credentialUseRef: `gateway-credential-use:auth-md:${verifiedGate.gateAttemptId}`,
      ...providerRefs,
    };
    assertAuthMdProfileConformance({
      verifiedGate,
      parameters: observedParameters,
      expectedActionContractId: input.actionContractId,
    });
    const apiCallEvidence = AuthMdProtectedApiCallEvidenceSchema.parse(
      await input.surface.executeProtectedApiCall(command),
    );
    assertNoLeakedAuthMdCredentialMaterial(apiCallEvidence);
    const { reconciliation } = await input.protocol.reconcileSurfaceOperation({
      mutationAttemptId: verifiedGate.mutationAttemptId,
      idempotencyKey: verifiedGate.idempotencyKey,
      observedSurfaceOperationRef: apiCallEvidence.surfaceOperationRef,
      observedDownstreamStatus: apiCallEvidence.downstreamStatus,
      downstreamRetryability: downstreamRetryabilityFor(apiCallEvidence.downstreamStatus),
      providerRequestRef: apiCallEvidence.providerRequestRef,
      providerOperationRef: apiCallEvidence.providerOperationRef,
      diagnosticsRedactionPosture: "redacted",
      evidenceRefs: [
        apiCallEvidence.evidenceRef,
        ...apiCallEvidence.evidenceRefs,
        `credential_resolution_evidence:${credentialResolutionEvidence.credentialResolutionEvidenceId}`,
        ...(apiCallEvidence.responseDigest ? [`digest:${apiCallEvidence.responseDigest}`] : []),
      ],
      resolvedProofGapIds: [],
    });
    return {
      outcome: outcomeFor(apiCallEvidence.downstreamStatus),
      gatewayCheck,
      credentialResolutionEvidence,
      reconciliation,
      apiCallEvidence,
    };
  } catch (error) {
    const failureEvidence = await redactedAuthMdFailureEvidence({
      surfaceOperationRef,
      error,
    });
    const { reconciliation } = await input.protocol.reconcileSurfaceOperation({
      mutationAttemptId: verifiedGate.mutationAttemptId,
      idempotencyKey: verifiedGate.idempotencyKey,
      observedSurfaceOperationRef: surfaceOperationRef,
      observedDownstreamStatus: "failed",
      ...failureEvidence,
      evidenceRefs: [
        ...(failureEvidence.evidenceRefs ?? []),
        ...(credentialResolutionEvidence
          ? [`credential_resolution_evidence:${credentialResolutionEvidence.credentialResolutionEvidenceId}`]
          : []),
      ],
      resolvedProofGapIds: [],
    });
    return {
      outcome: "protected_api_call_failed",
      gatewayCheck,
      credentialResolutionEvidence,
      reconciliation,
      apiCallEvidence: null,
    };
  }
}

function authMdGatewayUnsafeObservedParameterReasons(parameters: AuthMdProtectedApiCallParameters): string[] {
  const reasons = [...authMdProtectedApiCallRefusalReasonCodes({
    principalIntentRef: "gateway-observed:auth-md-protected-api-call",
    generatedCodeOrSpecRef: "gateway-observed:auth-md-protected-api-call",
    protectedResource: parameters.protectedResource,
    protectedResourceMetadataDigest: parameters.protectedResourceMetadataDigest,
    authorizationServerMetadataDigest: parameters.authorizationServerMetadataDigest,
    authorizationServer: parameters.authorizationServer,
    targetHttpMethod: parameters.targetHttpMethod,
    endpointUrl: parameters.endpointUrl,
    pathTemplate: parameters.pathTemplate,
    requestBodyDigest: parameters.requestBodyDigest,
    selectedHeadersDigest: parameters.selectedHeadersDigest,
    requiredScopes: parameters.requiredScopes,
    gatewayCredentialRefId: parameters.gatewayCredentialRefId,
    gatewayCredentialRefDigest: parameters.gatewayCredentialRefDigest,
    providerRegistryRef: parameters.providerRegistryRef,
    providerRegistryDigest: parameters.providerRegistryDigest,
    requiredCredentialCustodyStatus: parameters.requiredCredentialCustodyStatus,
    operationId: parameters.operationId,
    idempotencyMaterialRef: "gateway-observed",
    metadataCachePosture: parameters.metadataCachePosture,
    gatewayCredentialRefPosture: parameters.gatewayCredentialRefPosture,
    rawAuthorizationHeaderObserved: parameters.rawAuthorizationHeaderObserved,
    dynamicEndpointConstructionObserved: parameters.dynamicEndpointConstructionObserved,
    dynamicHostConstructionObserved: parameters.dynamicHostConstructionObserved,
    retryAuthorityReuseDetected: parameters.retryAuthorityReuseDetected,
  })];
  if (
    new URL(parameters.protectedResource).origin !== parameters.protectedResourceOrigin ||
    new URL(parameters.endpointUrl).origin !== parameters.endpointOrigin
  ) {
    reasons.push("auth_md_protected_resource_origin_mismatch");
  }
  return reasons;
}

async function credentialResolutionRequestDigest(
  verifiedGate: VerifiedGatewayCheck,
  parameters: AuthMdProtectedApiCallParameters,
): Promise<`sha256:${string}`> {
  return digestCanonical({
    profile: "auth_md_credential_resolution_request.v0",
    actionContractId: verifiedGate.actionContractId,
    gateAttemptId: verifiedGate.gateAttemptId,
    protectedResourceMetadataDigest: parameters.protectedResourceMetadataDigest,
    authorizationServerMetadataDigest: parameters.authorizationServerMetadataDigest,
    gatewayCredentialRefDigest: parameters.gatewayCredentialRefDigest,
    providerRegistryRef: parameters.providerRegistryRef,
    providerRegistryDigest: parameters.providerRegistryDigest,
    targetHttpMethod: parameters.targetHttpMethod,
    endpointUrl: parameters.endpointUrl,
    requestBodyDigest: parameters.requestBodyDigest,
    selectedHeadersDigest: parameters.selectedHeadersDigest,
    requiredScopes: parameters.requiredScopes,
  });
}

function providerRefsForGate(verifiedGate: VerifiedGatewayCheck): {
  providerRequestRef: string;
  providerOperationRef: string;
} {
  return {
    providerRequestRef: `provider-request:auth-md:${verifiedGate.gateAttemptId}`,
    providerOperationRef: `provider-operation:auth-md:${verifiedGate.gateAttemptId}`,
  };
}

function downstreamRetryabilityFor(
  status: AuthMdProtectedApiCallDownstreamStatus,
): ReconcileSurfaceOperationInput["downstreamRetryability"] {
  return status === "unknown" ? "unknown" : "non_retryable";
}

function outcomeFor(
  status: AuthMdProtectedApiCallDownstreamStatus,
): Extract<AuthMdProtectedApiCallGatewayResult, { apiCallEvidence: AuthMdProtectedApiCallEvidence }>["outcome"] {
  if (status === "succeeded") return "protected_api_call_reconciled";
  if (status === "refused") return "protected_api_call_refused";
  return "protected_api_call_proof_gap";
}

async function redactedAuthMdFailureEvidence(input: {
  surfaceOperationRef: string;
  error: unknown;
}): Promise<
  Pick<
    ReconcileSurfaceOperationInput,
    | "downstreamRetryability"
    | "providerRequestRef"
    | "providerOperationRef"
    | "redactedDiagnosticsDigest"
    | "traceRef"
    | "spanRef"
    | "diagnosticsRedactionPosture"
    | "evidenceRefs"
  >
> {
  const evidenceRef = `evidence:auth-md-protected-api-call-failed:${input.surfaceOperationRef}`;
  const failureEvidence = await downstreamFailureEvidence({
    adapterId: "auth-md-protected-api-call",
    surfaceOperationRef: input.surfaceOperationRef,
    error: input.error,
    evidenceRef,
  });
  try {
    assertNoLeakedAuthMdCredentialMaterial(failureEvidence);
    return failureEvidence;
  } catch {
    return {
      downstreamRetryability: "unknown",
      providerRequestRef: null,
      providerOperationRef: input.surfaceOperationRef,
      redactedDiagnosticsDigest: await digestCanonical({
        adapter: "auth-md-protected-api-call",
        surfaceOperationRef: input.surfaceOperationRef,
        redactionFailure: "downstream_failure_signal_contained_credential_material",
      }),
      traceRef: null,
      spanRef: null,
      diagnosticsRedactionPosture: "digest_only",
      evidenceRefs: [evidenceRef],
    };
  }
}
