import { z } from "zod";
import type { ActionContract, ProposeActionContractInput } from "../../protocol/areas/action-contract";
import {
  credentialCustodyCanSatisfyGatewayChecked,
  type GatewayCredentialBinding,
} from "../../protocol/areas/credential-custody";
import { CredentialCustodyStatusSchema } from "../../protocol/areas/catalog-envelope";
import type { CompileIntentInput, IntentCompilationRecord } from "../../protocol/areas/intent-compilation";
import { digestCanonical } from "../../protocol/foundation/canonical";
import { DigestSchema, IdSchema, type JsonValue } from "../../protocol/foundation/schema-core";
import { authMdGatewayCredentialBindingFor, authMdProtectedResourceRef } from "./profiles";

export const AUTH_MD_PROTECTED_API_CALL_PROFILE = "auth_md_protected_api_call.exact.v0";

const ConsequentialHttpMethodSchema = z.enum(["POST", "PUT", "PATCH", "DELETE"]);
const AuthMdMetadataCachePostureSchema = z.enum(["fresh", "stale", "unknown"]);
const AuthMdGatewayCredentialRefPostureSchema = z.enum(["fresh", "stale", "revoked", "expired", "unknown"]);

export const AuthMdProtectedApiCallParametersSchema = z.strictObject({
  profile: z.literal(AUTH_MD_PROTECTED_API_CALL_PROFILE),
  protectedResource: z.string().url(),
  protectedResourceOrigin: z.string().url(),
  protectedResourceMetadataDigest: DigestSchema,
  authorizationServerMetadataDigest: DigestSchema,
  authorizationServer: z.string().url(),
  targetHttpMethod: z.string().min(1),
  endpointUrl: z.string().url(),
  endpointOrigin: z.string().url(),
  pathTemplate: z.string().min(1),
  requestBodyDigest: DigestSchema.nullable().default(null),
  selectedHeadersDigest: DigestSchema,
  requiredScopes: z.array(z.string().min(1)).min(1),
  gatewayCredentialRefId: IdSchema,
  gatewayCredentialRefDigest: DigestSchema,
  providerRegistryRef: z.string().min(1),
  providerRegistryDigest: DigestSchema.nullable().default(null),
  requiredCredentialCustodyStatus: CredentialCustodyStatusSchema,
  operationId: z.string().min(1),
  metadataCachePosture: AuthMdMetadataCachePostureSchema.default("fresh"),
  gatewayCredentialRefPosture: AuthMdGatewayCredentialRefPostureSchema.default("fresh"),
  idempotencyMaterialRefPresent: z.boolean(),
  rawAuthorizationHeaderObserved: z.boolean(),
  dynamicEndpointConstructionObserved: z.boolean(),
  dynamicHostConstructionObserved: z.boolean(),
  retryAuthorityReuseDetected: z.boolean(),
});
export type AuthMdProtectedApiCallParameters = z.infer<typeof AuthMdProtectedApiCallParametersSchema>;

export const AuthMdProtectedApiCallAttemptSchema = z.strictObject({
  principalIntentRef: z.string().min(1),
  generatedCodeOrSpecRef: z.string().min(1),
  runtimeExecutionId: IdSchema.nullable().default(null),
  generatedExecutionGraphId: IdSchema.nullable().default(null),
  generatedExecutionNodeId: IdSchema.nullable().default(null),
  toolCallDraftId: IdSchema.nullable().default(null),
  protectedResource: z.string().url(),
  protectedResourceMetadataDigest: DigestSchema,
  authorizationServerMetadataDigest: DigestSchema,
  authorizationServer: z.string().url(),
  targetHttpMethod: z.string().min(1),
  endpointUrl: z.string().url(),
  pathTemplate: z.string().min(1),
  requestBodyDigest: DigestSchema.nullable().default(null),
  selectedHeadersDigest: DigestSchema,
  requiredScopes: z.array(z.string().min(1)).min(1),
  gatewayCredentialRefId: IdSchema,
  gatewayCredentialRefDigest: DigestSchema,
  providerRegistryRef: z.string().min(1),
  providerRegistryDigest: DigestSchema.nullable().default(null),
  requiredCredentialCustodyStatus: CredentialCustodyStatusSchema.default("gateway_held"),
  operationId: z.string().min(1),
  idempotencyMaterialRef: z.string().min(1).nullable().default(null),
  metadataCachePosture: AuthMdMetadataCachePostureSchema.default("fresh"),
  gatewayCredentialRefPosture: AuthMdGatewayCredentialRefPostureSchema.default("fresh"),
  rawAuthorizationHeaderObserved: z.boolean().default(false),
  dynamicEndpointConstructionObserved: z.boolean().default(false),
  dynamicHostConstructionObserved: z.boolean().default(false),
  retryAuthorityReuseDetected: z.boolean().default(false),
  evidenceRefs: z.array(z.string().min(1)).default([]),
  sequenceNumber: z.number().int().nonnegative().default(1),
  requiredPriorActionContractIds: z.array(IdSchema).default([]),
});
export type AuthMdProtectedApiCallAttempt = z.input<typeof AuthMdProtectedApiCallAttemptSchema>;

export const AuthMdProtectedApiCallRuntimeConfigSchema = z.strictObject({
  tenantId: IdSchema,
  organizationId: IdSchema,
  principalId: IdSchema,
  agentId: IdSchema,
  runId: IdSchema,
  runtimeAdapterId: IdSchema,
  operatingEnvelopeId: IdSchema,
  toolCatalogRef: z.string().min(1),
  actionCatalogRef: z.string().min(1),
  gatewayRegistryRef: z.string().min(1),
  toolCapabilityId: IdSchema,
  actionTypeId: IdSchema,
  gatewayRegistryEntryId: IdSchema,
  gatewayId: IdSchema,
  contractExpiresAt: z.string().datetime({ offset: true }),
  signingSecret: z.string().min(1).optional(),
});
export type AuthMdProtectedApiCallRuntimeConfig = z.input<typeof AuthMdProtectedApiCallRuntimeConfigSchema>;

export type AuthMdProtectedApiCallRuntimeProtocol = {
  compileIntent(input: CompileIntentInput): Promise<IntentCompilationRecord>;
  proposeActionContract(input: ProposeActionContractInput): Promise<ActionContract>;
};

export type AuthMdProtectedApiCallRuntimeResult =
  | {
      outcome: "action_contract_proposed";
      intentCompilation: IntentCompilationRecord;
      actionContract: ActionContract;
    }
  | {
      outcome: "intent_compilation_refused";
      intentCompilation: IntentCompilationRecord;
      actionContract: null;
      refusalReasonCodes: string[];
    }
  | {
      outcome: "protected_api_call_refused";
      intentCompilation: null;
      actionContract: null;
      refusalReasonCodes: string[];
    };

export async function proposeAuthMdProtectedApiCallActionContract(
  protocol: AuthMdProtectedApiCallRuntimeProtocol,
  configValue: AuthMdProtectedApiCallRuntimeConfig,
  attemptValue: AuthMdProtectedApiCallAttempt,
): Promise<AuthMdProtectedApiCallRuntimeResult> {
  const config = AuthMdProtectedApiCallRuntimeConfigSchema.parse(configValue);
  const attempt = AuthMdProtectedApiCallAttemptSchema.parse(attemptValue);
  const preflightRefusalReasonCodes = authMdProtectedApiCallRefusalReasonCodes(attempt);
  if (preflightRefusalReasonCodes.length > 0) {
    return {
      outcome: "protected_api_call_refused",
      intentCompilation: null,
      actionContract: null,
      refusalReasonCodes: preflightRefusalReasonCodes,
    };
  }

  const intentCompilation = await protocol.compileIntent(
    await buildAuthMdProtectedApiCallCompileIntentInput(config, attempt),
  );
  const refusalReasonCodes = refusalReasonCodesForCompilation(intentCompilation);
  if (refusalReasonCodes.length > 0) {
    return { outcome: "intent_compilation_refused", intentCompilation, actionContract: null, refusalReasonCodes };
  }

  const actionContract = await protocol.proposeActionContract({
    intentCompilationId: intentCompilation.intentCompilationId,
    candidateActionId: intentCompilation.candidateAction.candidateActionId,
    candidateDigest: requireCandidateDigest(intentCompilation.candidateAction.candidateDigest),
    ...(config.signingSecret ? { signingSecret: config.signingSecret } : {}),
  });
  return { outcome: "action_contract_proposed", intentCompilation, actionContract };
}

export async function buildAuthMdProtectedApiCallCompileIntentInput(
  configValue: AuthMdProtectedApiCallRuntimeConfig,
  attemptValue: AuthMdProtectedApiCallAttempt,
): Promise<CompileIntentInput> {
  const config = AuthMdProtectedApiCallRuntimeConfigSchema.parse(configValue);
  const attempt = AuthMdProtectedApiCallAttemptSchema.parse(attemptValue);
  const refusalReasonCodes = authMdProtectedApiCallRefusalReasonCodes(attempt);
  if (refusalReasonCodes.length > 0) {
    throw new Error(`auth.md protected API call refused before compilation: ${refusalReasonCodes.join(",")}`);
  }
  return buildAuthMdProtectedApiCallCompileIntentInputUnchecked(config, attempt);
}

export async function buildAuthMdProtectedApiCallCompileIntentInputForRuntimeRefusal(
  configValue: AuthMdProtectedApiCallRuntimeConfig,
  attemptValue: AuthMdProtectedApiCallAttempt,
): Promise<CompileIntentInput> {
  const config = AuthMdProtectedApiCallRuntimeConfigSchema.parse(configValue);
  const attempt = AuthMdProtectedApiCallAttemptSchema.parse(attemptValue);
  return buildAuthMdProtectedApiCallCompileIntentInputUnchecked(config, attempt);
}

async function buildAuthMdProtectedApiCallCompileIntentInputUnchecked(
  config: z.infer<typeof AuthMdProtectedApiCallRuntimeConfigSchema>,
  attempt: z.infer<typeof AuthMdProtectedApiCallAttemptSchema>,
): Promise<CompileIntentInput> {
  const targetHttpMethod = attempt.targetHttpMethod.toUpperCase();
  const endpointOrigin = new URL(attempt.endpointUrl).origin;
  const protectedResourceOrigin = new URL(attempt.protectedResource).origin;
  const resourceRef = authMdProtectedResourceRef(attempt.protectedResource);
  const gatewayCredentialRefs = [authMdCredentialBindingForAttempt(attempt)];
  const parameters = AuthMdProtectedApiCallParametersSchema.parse({
    profile: AUTH_MD_PROTECTED_API_CALL_PROFILE,
    protectedResource: attempt.protectedResource,
    protectedResourceOrigin,
    protectedResourceMetadataDigest: attempt.protectedResourceMetadataDigest,
    authorizationServerMetadataDigest: attempt.authorizationServerMetadataDigest,
    authorizationServer: attempt.authorizationServer,
    targetHttpMethod,
    endpointUrl: attempt.endpointUrl,
    endpointOrigin,
    pathTemplate: attempt.pathTemplate,
    requestBodyDigest: attempt.requestBodyDigest,
    selectedHeadersDigest: attempt.selectedHeadersDigest,
    requiredScopes: sortedUnique(attempt.requiredScopes),
    gatewayCredentialRefId: attempt.gatewayCredentialRefId,
    gatewayCredentialRefDigest: attempt.gatewayCredentialRefDigest,
    providerRegistryRef: attempt.providerRegistryRef,
    providerRegistryDigest: attempt.providerRegistryDigest,
    requiredCredentialCustodyStatus: attempt.requiredCredentialCustodyStatus,
    operationId: attempt.operationId,
    metadataCachePosture: attempt.metadataCachePosture,
    gatewayCredentialRefPosture: attempt.gatewayCredentialRefPosture,
    idempotencyMaterialRefPresent: attempt.idempotencyMaterialRef !== null,
    rawAuthorizationHeaderObserved: attempt.rawAuthorizationHeaderObserved,
    dynamicEndpointConstructionObserved: attempt.dynamicEndpointConstructionObserved,
    dynamicHostConstructionObserved: attempt.dynamicHostConstructionObserved,
    retryAuthorityReuseDetected: attempt.retryAuthorityReuseDetected,
  }) satisfies Record<string, JsonValue>;
  const idempotencyDigest = await digestCanonical({
    profile: AUTH_MD_PROTECTED_API_CALL_PROFILE,
    protectedResource: attempt.protectedResource,
    protectedResourceMetadataDigest: attempt.protectedResourceMetadataDigest,
    authorizationServerMetadataDigest: attempt.authorizationServerMetadataDigest,
    operationId: attempt.operationId,
    idempotencyMaterialRef: attempt.idempotencyMaterialRef ?? "missing:idempotency-material-ref",
    targetHttpMethod,
    endpointUrl: attempt.endpointUrl,
    requestBodyDigest: attempt.requestBodyDigest,
    gatewayCredentialRefDigest: attempt.gatewayCredentialRefDigest,
  });
  const discoveryEvidenceRef = `evidence:auth-md-discovery:${attempt.protectedResourceMetadataDigest.slice(
    "sha256:".length,
    "sha256:".length + 16,
  )}`;
  const authorizationServerEvidenceRef = `evidence:auth-md-authorization-server:${attempt.authorizationServerMetadataDigest.slice(
    "sha256:".length,
    "sha256:".length + 16,
  )}`;

  return {
    tenantId: config.tenantId,
    organizationId: config.organizationId,
    principalIntentRef: attempt.principalIntentRef,
    principalId: config.principalId,
    agentId: config.agentId,
    runId: config.runId,
    runtimeAdapterId: config.runtimeAdapterId,
    operatingEnvelopeId: config.operatingEnvelopeId,
    toolCatalogRef: config.toolCatalogRef,
    actionCatalogRef: config.actionCatalogRef,
    gatewayRegistryRef: config.gatewayRegistryRef,
    runtimeExecutionId: attempt.runtimeExecutionId,
    generatedExecutionGraphId: attempt.generatedExecutionGraphId,
    generatedExecutionNodeId: attempt.generatedExecutionNodeId,
    toolCallDraftId: attempt.toolCallDraftId,
    generatedCodeOrSpecRefs: [attempt.generatedCodeOrSpecRef],
    declaredAssumptions: [
      "auth.md registration and OAuth scopes are provenance only; action authority requires Handshake policy and gateway check",
    ],
    requiredEvidenceRefs: [
      discoveryEvidenceRef,
      authorizationServerEvidenceRef,
      ...attempt.evidenceRefs,
      ...attempt.requiredScopes.map((scope) => `scope:auth-md:${scope}`),
    ].filter(unique),
    candidate: {
      toolCapabilityId: config.toolCapabilityId,
      actionTypeId: config.actionTypeId,
      gatewayRegistryEntryId: config.gatewayRegistryEntryId,
      actionClass: "auth_md_protected_api_call.exact",
      gatewayId: config.gatewayId,
      resourceRef,
      sequenceNumber: attempt.sequenceNumber,
      requiredPriorActionContractIds: attempt.requiredPriorActionContractIds,
      recoveryRecommendationId: null,
      parameters,
      nonSecretParamsSummary: parameters,
      secretRefs: {},
      gatewayCredentialRefs,
      purposeCode: "auth_md_service_mutation",
      expectedSideEffectCodes: ["auth_md_service_mutation_attempt"],
      evidenceRefs: [discoveryEvidenceRef, authorizationServerEvidenceRef, ...attempt.evidenceRefs].filter(unique),
      bounds: {
        protectedResourceOrigin,
        endpointOrigin,
        targetHttpMethod,
        requiredScopes: sortedUnique(attempt.requiredScopes),
        metadataCachePosture: attempt.metadataCachePosture,
        gatewayCredentialRefPosture: attempt.gatewayCredentialRefPosture,
      },
      idempotencyKey: `auth-md-call:${idempotencyDigest.slice("sha256:".length)}`,
      rollbackHint:
        "recover through downstream service evidence, refusal, revocation, or proof gap; do not reuse the greenlight",
      expiresAt: config.contractExpiresAt,
    },
  };
}

export function authMdProtectedApiCallRefusalReasonCodes(attemptValue: AuthMdProtectedApiCallAttempt): string[] {
  const attempt = AuthMdProtectedApiCallAttemptSchema.parse(attemptValue);
  const reasons: string[] = [];
  if (!isConsequentialMethod(attempt.targetHttpMethod)) reasons.push("auth_md_non_consequential_method_refused");
  if (new URL(attempt.endpointUrl).origin !== new URL(attempt.protectedResource).origin) {
    reasons.push("auth_md_protected_resource_origin_mismatch");
  }
  if (attempt.rawAuthorizationHeaderObserved) reasons.push("auth_md_raw_authorization_header_refused");
  if (attempt.dynamicEndpointConstructionObserved) reasons.push("auth_md_dynamic_endpoint_refused");
  if (attempt.dynamicHostConstructionObserved) reasons.push("auth_md_dynamic_host_refused");
  if (attempt.requiredScopes.some((scope) => scope.includes("*"))) {
    reasons.push("auth_md_wildcard_scope_refused");
  }
  if (attempt.metadataCachePosture !== "fresh") reasons.push("auth_md_stale_metadata_refused");
  if (attempt.gatewayCredentialRefPosture !== "fresh") reasons.push("auth_md_stale_credential_ref_refused");
  if (attempt.idempotencyMaterialRef === null) reasons.push("auth_md_idempotency_material_missing");
  if (attempt.retryAuthorityReuseDetected) reasons.push("auth_md_retry_authority_reuse_refused");
  if (!credentialCustodyCanSatisfyGatewayChecked(attempt.requiredCredentialCustodyStatus)) {
    reasons.push("auth_md_unsafe_credential_custody_refused");
  }
  return [...new Set(reasons)].sort();
}

export function authMdCredentialBindingForAttempt(
  attemptValue: AuthMdProtectedApiCallAttempt,
): GatewayCredentialBinding {
  const attempt = AuthMdProtectedApiCallAttemptSchema.parse(attemptValue);
  return {
    credentialUseName: "auth_md_service_credential",
    gatewayCredentialRefId: attempt.gatewayCredentialRefId,
    gatewayCredentialRefDigest: attempt.gatewayCredentialRefDigest,
    providerRegistryRef: attempt.providerRegistryRef,
    providerRegistryDigest: attempt.providerRegistryDigest,
    requiredCredentialCustodyStatus: attempt.requiredCredentialCustodyStatus,
    evidenceExpectationRefs: [
      `evidence:auth-md-discovery:${attempt.protectedResourceMetadataDigest.slice(
        "sha256:".length,
        "sha256:".length + 16,
      )}`,
      `evidence:auth-md-authorization-server:${attempt.authorizationServerMetadataDigest.slice(
        "sha256:".length,
        "sha256:".length + 16,
      )}`,
      ...attempt.evidenceRefs,
    ].filter(unique),
  };
}

export function authMdGatewayCredentialBindingForContract(
  credentialRef: Parameters<typeof authMdGatewayCredentialBindingFor>[0],
): GatewayCredentialBinding {
  return authMdGatewayCredentialBindingFor(credentialRef);
}

export function refusalReasonCodesForCompilation(intentCompilation: IntentCompilationRecord): string[] {
  return [...intentCompilation.uncertaintyMarkers, ...intentCompilation.overreachReasonCodes];
}

function isConsequentialMethod(method: string): boolean {
  return ConsequentialHttpMethodSchema.safeParse(method.toUpperCase()).success;
}

function requireCandidateDigest(candidateDigest: string | null): string {
  if (!candidateDigest) throw new Error("Contractable candidate is missing candidateDigest.");
  return candidateDigest;
}

function sortedUnique<T extends string>(values: readonly T[]): T[] {
  return [...new Set(values)].sort();
}

function unique<T>(value: T, index: number, values: T[]): boolean {
  return values.indexOf(value) === index;
}
