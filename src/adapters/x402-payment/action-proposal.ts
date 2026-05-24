import { z } from "zod";
import type { ActionContract, ProposeActionContractInput } from "../../protocol/areas/action-contract";
import type { CompileIntentInput, IntentCompilationRecord } from "../../protocol/areas/intent-compilation";
import { digestCanonical } from "../../protocol/foundation/canonical";
import { DigestSchema } from "../../protocol/foundation/schema-core";
import { x402PaymentResourceRef } from "./install-proposal";
import type { X402PaymentRequiredEvidence } from "./upstream-evidence";

const AtomicAmountSchema = z.string().regex(/^(?:0|[1-9]\d*)$/);
const PaymentIdentifierSchema = z
  .string()
  .min(16)
  .max(128)
  .regex(/^[a-zA-Z0-9_-]+$/);
const X402EvidenceProfileSchema = z.enum(["official_payment_required", "local_digest_profile"]);
const PaymentIdentifierPostureSchema = z.enum(["not_advertised", "advertised_absent", "bound"]);
const X402RequestBodyPostureSchema = z.enum(["no_body", "digest_bound", "omitted", "unsupported"]);
const X402ProviderEnvironmentPostureSchema = z.enum(["local_reference_sandbox", "external_sandbox", "live", "unknown"]);

export const X402PaymentAttemptSchema = z.strictObject({
  principalIntentRef: z.string().min(1),
  generatedCodeOrSpecRef: z.string().min(1),
  runtimeExecutionId: z.string().min(1).nullable().default(null),
  generatedExecutionGraphId: z.string().min(1).nullable().default(null),
  generatedExecutionNodeId: z.string().min(1).nullable().default(null),
  toolCallDraftId: z.string().min(1).nullable().default(null),
  endpointUrl: z.string().url(),
  payee: z.string().min(1),
  network: z.string().min(1),
  token: z.string().min(1),
  atomicAmount: AtomicAmountSchema,
  x402EvidenceProfile: X402EvidenceProfileSchema.default("local_digest_profile"),
  paymentRequirementsDigest: DigestSchema,
  paymentRequiredEvidenceRef: z.string().min(1).optional(),
  facilitatorRef: z.string().min(1).nullable().default(null),
  intendedHttpMethod: z.string().min(1).nullable().default(null),
  intendedRequestUrl: z.string().url().nullable().default(null),
  intendedRequestBodyPosture: X402RequestBodyPostureSchema.default("no_body"),
  intendedRequestBodyDigest: DigestSchema.nullable().default(null),
  selectedHeadersDigest: DigestSchema.nullable().default(null),
  providerEnvironmentPosture: X402ProviderEnvironmentPostureSchema.default("local_reference_sandbox"),
  providerEnvironmentRef: z.string().min(1).nullable().default(null),
  x402Version: z.number().int().positive().nullable().default(null),
  x402Scheme: z.string().min(1).nullable().default(null),
  asset: z.string().min(1).nullable().default(null),
  payTo: z.string().min(1).nullable().default(null),
  maxTimeoutSeconds: z.number().positive().nullable().default(null),
  selectedPaymentRequirementIndex: z.number().int().nonnegative().nullable().default(null),
  selectedPaymentRequirementDigest: DigestSchema.nullable().default(null),
  paymentIdentifier: PaymentIdentifierSchema.nullable().default(null),
  paymentIdentifierRef: z.string().min(1).nullable().default(null),
  paymentIdentifierPosture: PaymentIdentifierPostureSchema.default("not_advertised"),
  sdkPackageVersions: z.record(z.string(), z.string().min(1)).default({}),
  extensionKeys: z.array(z.string().min(1)).default([]),
  sequenceNumber: z.number().int().nonnegative().default(1),
  requiredPriorActionContractIds: z.array(z.string().min(1)).default([]),
});
export type X402PaymentAttempt = z.input<typeof X402PaymentAttemptSchema>;

export type BuildX402PaymentAttemptFromRequiredEvidenceInput = {
  evidence: X402PaymentRequiredEvidence;
  principalIntentRef: string;
  generatedCodeOrSpecRef: string;
  runtimeExecutionId?: string | null;
  generatedExecutionGraphId?: string | null;
  generatedExecutionNodeId?: string | null;
  toolCallDraftId?: string | null;
  facilitatorRef?: string | null;
  paymentIdentifier?: string | null;
  paymentIdentifierRef?: string | null;
  sequenceNumber?: number;
  requiredPriorActionContractIds?: string[];
};

export const X402PaymentRuntimeConfigSchema = z.strictObject({
  tenantId: z.string().min(1),
  organizationId: z.string().min(1),
  principalId: z.string().min(1),
  agentId: z.string().min(1),
  runId: z.string().min(1),
  runtimeAdapterId: z.string().min(1),
  operatingEnvelopeId: z.string().min(1),
  toolCatalogRef: z.string().min(1),
  actionCatalogRef: z.string().min(1),
  gatewayRegistryRef: z.string().min(1),
  toolCapabilityId: z.string().min(1),
  actionTypeId: z.string().min(1),
  gatewayRegistryEntryId: z.string().min(1),
  gatewayId: z.string().min(1),
  maxAtomicAmountPerCall: AtomicAmountSchema,
  contractExpiresAt: z.string().datetime({ offset: true }),
  signingSecret: z.string().min(1).optional(),
});
export type X402PaymentRuntimeConfig = z.input<typeof X402PaymentRuntimeConfigSchema>;

export type X402PaymentRuntimeProtocol = {
  compileIntent(input: CompileIntentInput): Promise<IntentCompilationRecord>;
  proposeActionContract(input: ProposeActionContractInput): Promise<ActionContract>;
};

export type X402PaymentRuntimeResult =
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
      outcome: "payment_attempt_refused";
      intentCompilation: null;
      actionContract: null;
      refusalReasonCodes: string[];
    };

export async function proposeX402PaymentActionContract(
  protocol: X402PaymentRuntimeProtocol,
  config: X402PaymentRuntimeConfig,
  attemptValue: X402PaymentAttempt,
): Promise<X402PaymentRuntimeResult> {
  const runtimeConfig = X402PaymentRuntimeConfigSchema.parse(config);
  const attempt = X402PaymentAttemptSchema.parse(attemptValue);
  const paymentAttemptRefusalCodes = x402PaymentAttemptRefusalReasonCodes(runtimeConfig, attempt);
  if (paymentAttemptRefusalCodes.length > 0) {
    return {
      outcome: "payment_attempt_refused",
      intentCompilation: null,
      actionContract: null,
      refusalReasonCodes: paymentAttemptRefusalCodes,
    };
  }

  const intentCompilation = await compileX402PaymentIntent(protocol, runtimeConfig, attempt);
  const refusalReasonCodes = refusalReasonCodesForCompilation(intentCompilation);
  if (refusalReasonCodes.length > 0) {
    return { outcome: "intent_compilation_refused", intentCompilation, actionContract: null, refusalReasonCodes };
  }

  const actionContract = await protocol.proposeActionContract({
    intentCompilationId: intentCompilation.intentCompilationId,
    candidateActionId: intentCompilation.candidateAction.candidateActionId,
    candidateDigest: requireCandidateDigest(intentCompilation.candidateAction.candidateDigest),
    signingSecret: runtimeConfig.signingSecret,
  });
  return { outcome: "action_contract_proposed", intentCompilation, actionContract };
}

export async function buildX402PaymentAttemptFromRequiredEvidence(
  input: BuildX402PaymentAttemptFromRequiredEvidenceInput,
): Promise<X402PaymentAttempt> {
  const { evidence } = input;
  const selected = evidence.selectedPaymentRequirement;
  const paymentIdentifier = input.paymentIdentifier ?? null;
  const paymentRequiredDigest = await digestCanonical({
    paymentRequired: toJsonValue(evidence.paymentRequired),
    selectedPaymentRequirementIndex: evidence.selectedPaymentRequirementIndex,
    selectedPaymentRequirementDigest: evidence.selectedPaymentRequirementDigest,
  });

  return X402PaymentAttemptSchema.parse({
    principalIntentRef: input.principalIntentRef,
    generatedCodeOrSpecRef: input.generatedCodeOrSpecRef,
    runtimeExecutionId: input.runtimeExecutionId ?? null,
    generatedExecutionGraphId: input.generatedExecutionGraphId ?? null,
    generatedExecutionNodeId: input.generatedExecutionNodeId ?? null,
    toolCallDraftId: input.toolCallDraftId ?? null,
    endpointUrl: evidence.paymentRequired.resource.url,
    payee: selected.payTo,
    network: selected.network,
    token: selected.asset,
    atomicAmount: selected.amount,
    x402EvidenceProfile: "official_payment_required",
    paymentRequirementsDigest: paymentRequiredDigest,
    paymentRequiredEvidenceRef: `evidence:x402-payment-required:${evidence.selectedPaymentRequirementDigest.slice(
      "sha256:".length,
      "sha256:".length + 16,
    )}`,
    facilitatorRef: input.facilitatorRef ?? null,
    intendedHttpMethod: evidence.intendedRequest.method,
    intendedRequestUrl: evidence.intendedRequest.url,
    intendedRequestBodyPosture: requestBodyPostureFor(evidence.intendedRequest),
    intendedRequestBodyDigest: evidence.intendedRequest.bodyDigest,
    selectedHeadersDigest: evidence.intendedRequest.selectedHeadersDigest,
    providerEnvironmentPosture: evidence.intendedRequest.providerEnvironmentPosture ?? "local_reference_sandbox",
    providerEnvironmentRef: evidence.intendedRequest.providerEnvironmentRef ?? null,
    x402Version: evidence.paymentRequired.x402Version,
    x402Scheme: selected.scheme,
    asset: selected.asset,
    payTo: selected.payTo,
    maxTimeoutSeconds: selected.maxTimeoutSeconds,
    selectedPaymentRequirementIndex: evidence.selectedPaymentRequirementIndex,
    selectedPaymentRequirementDigest: evidence.selectedPaymentRequirementDigest,
    paymentIdentifier,
    paymentIdentifierRef: paymentIdentifier ? (input.paymentIdentifierRef ?? "payment-identifier:gateway-bound") : null,
    paymentIdentifierPosture: paymentIdentifier
      ? "bound"
      : paymentRequiredAdvertisesPaymentIdentifier(evidence.paymentRequired)
        ? "advertised_absent"
        : "not_advertised",
    sdkPackageVersions: evidence.source.packages,
    extensionKeys: Object.keys(evidence.paymentRequired.extensions ?? {}).sort(),
    sequenceNumber: input.sequenceNumber ?? 1,
    requiredPriorActionContractIds: input.requiredPriorActionContractIds ?? [],
  });
}

export async function compileX402PaymentIntent(
  protocol: Pick<X402PaymentRuntimeProtocol, "compileIntent">,
  config: X402PaymentRuntimeConfig,
  attemptValue: X402PaymentAttempt,
): Promise<IntentCompilationRecord> {
  return protocol.compileIntent(await buildX402PaymentCompileIntentInput(config, attemptValue));
}

export async function buildX402PaymentCompileIntentInput(
  config: X402PaymentRuntimeConfig,
  attemptValue: X402PaymentAttempt,
): Promise<CompileIntentInput> {
  const runtimeConfig = X402PaymentRuntimeConfigSchema.parse(config);
  const attempt = X402PaymentAttemptSchema.parse(attemptValue);
  assertX402PaymentAttemptWithinRuntimeBounds(runtimeConfig, attempt);
  return buildX402PaymentCompileIntentInputUnchecked(runtimeConfig, attempt);
}

export async function buildX402PaymentCompileIntentInputForRuntimeRefusal(
  config: X402PaymentRuntimeConfig,
  attemptValue: X402PaymentAttempt,
): Promise<CompileIntentInput> {
  const runtimeConfig = X402PaymentRuntimeConfigSchema.parse(config);
  const attempt = X402PaymentAttemptSchema.parse(attemptValue);
  return buildX402PaymentCompileIntentInputUnchecked(runtimeConfig, attempt);
}

async function buildX402PaymentCompileIntentInputUnchecked(
  runtimeConfig: z.infer<typeof X402PaymentRuntimeConfigSchema>,
  attempt: z.infer<typeof X402PaymentAttemptSchema>,
): Promise<CompileIntentInput> {
  const endpointDomain = new URL(attempt.endpointUrl).hostname;
  const paymentIdentifierDigest = await paymentIdentifierDigestFor(attempt.paymentIdentifier);
  const paymentIdentifierPosture = paymentIdentifierPostureForAttempt(attempt);
  const resourceRef = x402PaymentResourceRef({
    endpointUrl: attempt.endpointUrl,
    network: attempt.network,
    payee: attempt.payee,
  });
  const parameters = {
    endpointUrl: attempt.endpointUrl,
    endpointDomain,
    intendedHttpMethod: attempt.intendedHttpMethod,
    intendedRequestUrl: attempt.intendedRequestUrl,
    intendedRequestBodyPosture: attempt.intendedRequestBodyPosture,
    intendedRequestBodyDigest: attempt.intendedRequestBodyDigest,
    selectedHeadersDigest: attempt.selectedHeadersDigest,
    providerEnvironmentPosture: attempt.providerEnvironmentPosture,
    providerEnvironmentRef: attempt.providerEnvironmentRef,
    x402Version: attempt.x402Version,
    x402Scheme: attempt.x402Scheme,
    payee: attempt.payee,
    payTo: attempt.payTo,
    network: attempt.network,
    token: attempt.token,
    asset: attempt.asset,
    atomicAmount: attempt.atomicAmount,
    x402EvidenceProfile: attempt.x402EvidenceProfile,
    paymentRequirementsDigest: attempt.paymentRequirementsDigest,
    selectedPaymentRequirementIndex: attempt.selectedPaymentRequirementIndex,
    selectedPaymentRequirementDigest: attempt.selectedPaymentRequirementDigest,
    maxTimeoutSeconds: attempt.maxTimeoutSeconds,
    paymentIdentifierPosture,
    paymentIdentifierRef: attempt.paymentIdentifierRef,
    paymentIdentifierDigest,
    facilitatorRef: attempt.facilitatorRef,
    sdkPackageVersions: attempt.sdkPackageVersions,
    extensionKeys: attempt.extensionKeys,
  };
  const idempotencyDigest = paymentIdentifierDigest
    ? await digestCanonical({ paymentIdentifierDigest, idempotencyScope: "x402_payment_identifier" })
    : await digestCanonical({
        runId: runtimeConfig.runId,
        endpointUrl: attempt.endpointUrl,
        intendedHttpMethod: attempt.intendedHttpMethod,
        intendedRequestUrl: attempt.intendedRequestUrl,
        intendedRequestBodyPosture: attempt.intendedRequestBodyPosture,
        intendedRequestBodyDigest: attempt.intendedRequestBodyDigest,
        selectedHeadersDigest: attempt.selectedHeadersDigest,
        providerEnvironmentPosture: attempt.providerEnvironmentPosture,
        providerEnvironmentRef: attempt.providerEnvironmentRef,
        x402Version: attempt.x402Version,
        x402Scheme: attempt.x402Scheme,
        payee: attempt.payee,
        payTo: attempt.payTo,
        network: attempt.network,
        token: attempt.token,
        asset: attempt.asset,
        atomicAmount: attempt.atomicAmount,
        x402EvidenceProfile: attempt.x402EvidenceProfile,
        paymentRequirementsDigest: attempt.paymentRequirementsDigest,
        selectedPaymentRequirementIndex: attempt.selectedPaymentRequirementIndex,
        selectedPaymentRequirementDigest: attempt.selectedPaymentRequirementDigest,
        maxTimeoutSeconds: attempt.maxTimeoutSeconds,
        sdkPackageVersions: attempt.sdkPackageVersions,
        extensionKeys: attempt.extensionKeys,
        sequenceNumber: attempt.sequenceNumber,
      });
  const paymentRequiredEvidenceRef =
    attempt.paymentRequiredEvidenceRef ??
    `evidence:x402-payment-required:${attempt.paymentRequirementsDigest.slice("sha256:".length, "sha256:".length + 16)}`;

  return {
    tenantId: runtimeConfig.tenantId,
    organizationId: runtimeConfig.organizationId,
    principalIntentRef: attempt.principalIntentRef,
    principalId: runtimeConfig.principalId,
    agentId: runtimeConfig.agentId,
    runId: runtimeConfig.runId,
    runtimeAdapterId: runtimeConfig.runtimeAdapterId,
    operatingEnvelopeId: runtimeConfig.operatingEnvelopeId,
    toolCatalogRef: runtimeConfig.toolCatalogRef,
    actionCatalogRef: runtimeConfig.actionCatalogRef,
    gatewayRegistryRef: runtimeConfig.gatewayRegistryRef,
    runtimeExecutionId: attempt.runtimeExecutionId,
    generatedExecutionGraphId: attempt.generatedExecutionGraphId,
    generatedExecutionNodeId: attempt.generatedExecutionNodeId,
    toolCallDraftId: attempt.toolCallDraftId,
    generatedCodeOrSpecRefs: [attempt.generatedCodeOrSpecRef],
    declaredAssumptions: ["x402 payment attempt provided explicit endpoint, payee, network, token, and amount"],
    requiredEvidenceRefs: [paymentRequiredEvidenceRef],
    candidate: {
      toolCapabilityId: runtimeConfig.toolCapabilityId,
      actionTypeId: runtimeConfig.actionTypeId,
      gatewayRegistryEntryId: runtimeConfig.gatewayRegistryEntryId,
      actionClass: "x402_payment.exact",
      gatewayId: runtimeConfig.gatewayId,
      resourceRef,
      sequenceNumber: attempt.sequenceNumber,
      requiredPriorActionContractIds: attempt.requiredPriorActionContractIds,
      recoveryRecommendationId: null,
      parameters,
      nonSecretParamsSummary: parameters,
      secretRefs: {},
      purposeCode: "x402_paid_request",
      expectedSideEffectCodes: ["x402_payment_signature_created"],
      evidenceRefs: [paymentRequiredEvidenceRef],
      bounds: {
        endpointDomain,
        payee: attempt.payee,
        payTo: attempt.payTo,
        network: attempt.network,
        token: attempt.token,
        asset: attempt.asset,
        maxAtomicAmountPerCall: runtimeConfig.maxAtomicAmountPerCall,
      },
      idempotencyKey: paymentIdentifierDigest
        ? `x402-payment-id:${idempotencyDigest.slice("sha256:".length)}`
        : `x402-payment:${idempotencyDigest.slice("sha256:".length)}`,
      rollbackHint: "recover through payment response or facilitator receipt evidence; do not reuse the greenlight",
      expiresAt: runtimeConfig.contractExpiresAt,
    },
  };
}

export function refusalReasonCodesForCompilation(intentCompilation: IntentCompilationRecord): string[] {
  return [...intentCompilation.uncertaintyMarkers, ...intentCompilation.overreachReasonCodes];
}

export function x402PaymentAttemptRefusalReasonCodes(
  configValue: X402PaymentRuntimeConfig,
  attemptValue: X402PaymentAttempt,
): string[] {
  const config = X402PaymentRuntimeConfigSchema.parse(configValue);
  const attempt = X402PaymentAttemptSchema.parse(attemptValue);
  const reasonCodes: string[] = [];
  if (compareAtomic(attempt.atomicAmount, config.maxAtomicAmountPerCall) > 0) {
    reasonCodes.push("x402_amount_exceeds_call_bound");
  }
  if (attempt.x402EvidenceProfile === "official_payment_required" && officialEvidenceMissing(attempt)) {
    reasonCodes.push("x402_official_payment_required_evidence_incomplete");
  }
  if (attempt.intendedRequestBodyPosture === "digest_bound" && attempt.intendedRequestBodyDigest === null) {
    reasonCodes.push("x402_request_body_digest_missing");
  }
  if (["omitted", "unsupported"].includes(attempt.intendedRequestBodyPosture)) {
    reasonCodes.push("x402_request_body_posture_unsupported");
  }
  if (attempt.intendedRequestBodyPosture === "no_body" && attempt.intendedRequestBodyDigest !== null) {
    reasonCodes.push("x402_request_body_posture_mismatch");
  }
  if (attempt.providerEnvironmentPosture !== "local_reference_sandbox") {
    reasonCodes.push("x402_provider_environment_not_sandboxed");
  }
  return [...new Set(reasonCodes)].sort();
}

function officialEvidenceMissing(attempt: z.infer<typeof X402PaymentAttemptSchema>): boolean {
  return (
    attempt.paymentRequiredEvidenceRef === undefined ||
    attempt.intendedHttpMethod === null ||
    attempt.intendedRequestUrl === null ||
    attempt.selectedHeadersDigest === null ||
    attempt.x402Version === null ||
    attempt.x402Scheme !== "exact" ||
    attempt.asset === null ||
    attempt.payTo === null ||
    attempt.maxTimeoutSeconds === null ||
    attempt.selectedPaymentRequirementIndex === null ||
    attempt.selectedPaymentRequirementDigest === null ||
    Object.keys(attempt.sdkPackageVersions).length === 0
  );
}

function assertX402PaymentAttemptWithinRuntimeBounds(
  config: z.infer<typeof X402PaymentRuntimeConfigSchema>,
  attempt: z.infer<typeof X402PaymentAttemptSchema>,
): void {
  const refusalReasonCodes = x402PaymentAttemptRefusalReasonCodes(config, attempt);
  if (refusalReasonCodes.length > 0) {
    throw new Error(`X402 payment attempt refused before compilation: ${refusalReasonCodes.join(",")}`);
  }
}

function requireCandidateDigest(candidateDigest: string | null): string {
  if (!candidateDigest) throw new Error("Contractable candidate is missing candidateDigest.");
  return candidateDigest;
}

async function paymentIdentifierDigestFor(paymentIdentifier: string | null): Promise<`sha256:${string}` | null> {
  if (!paymentIdentifier) return null;
  return digestCanonical({ paymentIdentifier, paymentIdentifierExtension: "payment-identifier" });
}

function paymentIdentifierPostureForAttempt(attempt: z.infer<typeof X402PaymentAttemptSchema>) {
  if (attempt.paymentIdentifier) return "bound";
  if (attempt.paymentIdentifierPosture === "advertised_absent") return "advertised_absent";
  return attempt.extensionKeys.includes("payment-identifier") ? "advertised_absent" : "not_advertised";
}

function paymentRequiredAdvertisesPaymentIdentifier(paymentRequired: X402PaymentRequiredEvidence["paymentRequired"]) {
  return Object.hasOwn(paymentRequired.extensions ?? {}, "payment-identifier");
}

function requestBodyPostureFor(intendedRequest: X402PaymentRequiredEvidence["intendedRequest"]) {
  return intendedRequest.requestBodyPosture ?? (intendedRequest.bodyDigest ? "digest_bound" : "no_body");
}

function toJsonValue(value: unknown) {
  return JSON.parse(JSON.stringify(value));
}

function compareAtomic(left: string, right: string): number {
  const leftValue = BigInt(left);
  const rightValue = BigInt(right);
  return leftValue === rightValue ? 0 : leftValue > rightValue ? 1 : -1;
}
