import { z } from "zod";
import type { ActionContract, ProposeActionContractInput } from "../../protocol/areas/action-contract";
import type { CompileIntentInput, IntentCompilationRecord } from "../../protocol/areas/intent-compilation";
import { digestCanonical } from "../../protocol/foundation/canonical";
import { DigestSchema } from "../../protocol/foundation/schema-core";
import { x402PaymentResourceRef } from "./install-proposal";

const AtomicAmountSchema = z.string().regex(/^(?:0|[1-9]\d*)$/);

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
  paymentRequirementsDigest: DigestSchema,
  paymentRequiredEvidenceRef: z.string().min(1).optional(),
  facilitatorRef: z.string().min(1).nullable().default(null),
  sequenceNumber: z.number().int().nonnegative().default(1),
  requiredPriorActionContractIds: z.array(z.string().min(1)).default([]),
});
export type X402PaymentAttempt = z.input<typeof X402PaymentAttemptSchema>;

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
  const endpointDomain = new URL(attempt.endpointUrl).hostname;
  const resourceRef = x402PaymentResourceRef({
    endpointUrl: attempt.endpointUrl,
    network: attempt.network,
    payee: attempt.payee,
  });
  const parameters = {
    endpointUrl: attempt.endpointUrl,
    endpointDomain,
    payee: attempt.payee,
    network: attempt.network,
    token: attempt.token,
    atomicAmount: attempt.atomicAmount,
    paymentRequirementsDigest: attempt.paymentRequirementsDigest,
    facilitatorRef: attempt.facilitatorRef,
  };
  const idempotencyDigest = await digestCanonical({
    runId: runtimeConfig.runId,
    endpointUrl: attempt.endpointUrl,
    payee: attempt.payee,
    network: attempt.network,
    token: attempt.token,
    atomicAmount: attempt.atomicAmount,
    paymentRequirementsDigest: attempt.paymentRequirementsDigest,
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
        network: attempt.network,
        token: attempt.token,
        maxAtomicAmountPerCall: runtimeConfig.maxAtomicAmountPerCall,
      },
      idempotencyKey: `x402-payment:${idempotencyDigest.slice("sha256:".length)}`,
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
  if (compareAtomic(attempt.atomicAmount, config.maxAtomicAmountPerCall) > 0) {
    return ["x402_amount_exceeds_call_bound"];
  }
  return [];
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

function compareAtomic(left: string, right: string): number {
  const leftValue = BigInt(left);
  const rightValue = BigInt(right);
  return leftValue === rightValue ? 0 : leftValue > rightValue ? 1 : -1;
}
