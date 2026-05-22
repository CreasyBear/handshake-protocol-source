import { digestCanonical } from "../foundation/canonical";
import type { ActionContract } from "../areas/action-contract";
import type { GatewayRegistryEntry } from "../areas/catalog-envelope";
import type { CredentialResolutionEvidence } from "../areas/credential-custody";
import type { GatewayCheckAttempt, MutationAttempt } from "../areas/gateway-gate/schemas";
import {
  idempotencyLedgerKey,
  idempotencyLedgerKeyDigest,
  type IdempotencyLedgerEntry,
} from "../areas/idempotency-ledger";
import type { SurfaceOperationReconciliation } from "../areas/operation-lifecycle";
import {
  evaluateRequiredProtectedPathPosture,
  protectedPathPostureScopeKeyForContract,
} from "../areas/protected-path-posture";
import type { ProtectedPathPosture } from "../areas/protected-path-posture";
import type { Greenlight, PolicyDecision } from "../areas/policy-greenlight/schemas";
import type { ProofGap } from "../areas/proof-gap";
import { protocolObjectRef, type Refusal } from "../areas/refusal";
import type { Receipt } from "../areas/receipt-export/schemas";
import { deriveDownstreamOutcomeStatus, deriveGatewayAdmissionStatus } from "../areas/receipt-export/status";
import type { ContractStreamEvent } from "../events/schemas";
import type { StoredProtocolRecord } from "../store/port";
import {
  AgentTransactionEnvelopeProjectionSchema,
  ContractEvidenceProjectionSchema,
  IdempotencyRecoveryProjectionSchema,
  ProtectedPathInstallHealthProjectionSchema,
  ReceiptTimelineProjectionSchema,
  type AgentTransactionEnvelopeProjection,
  type ContractEvidenceProjection,
  type IdempotencyRecoveryDisposition,
  type IdempotencyRecoveryProjection,
  type ProtectedPathInstallHealthProjection,
  type ProtectedPathInstallHealthStatus,
  type ReceiptTimelineProjection,
} from "./schemas";

export function projectContractEvidence(contract: ActionContract): ContractEvidenceProjection {
  return ContractEvidenceProjectionSchema.parse({
    actionContractRef: contract.actionContractId,
    contractDigest: contract.actionContractDigest,
    intentCompilationRef: contract.intentCompilationId,
    candidateActionRef: contract.candidateActionId,
    candidateDigest: contract.candidateDigest,
    envelopeRef: contract.envelopeId,
    principalRef: contract.principalId,
    agentRef: contract.agentId,
    participantIdentityBindings: contract.participantIdentityBindings,
    runId: contract.runId,
    runtimeAdapterRef: contract.runtimeAdapterId,
    actionClass: contract.actionClass,
    protectedSurfaceKind: contract.protectedSurfaceKind,
    resourceRef: contract.resourceRef,
    gatewayId: contract.gatewayId,
    gatewayPolicyVersion: contract.gatewayPolicyVersion,
    requiredProtectedPathState: contract.requiredProtectedPathState,
    idempotencyKey: contract.idempotencyKey,
    paramsDigest: contract.paramsDigest,
    nonSecretParamsSummary: contract.nonSecretParamsSummary,
    gatewayCredentialRefs: contract.gatewayCredentialRefs,
    evidenceRefs: contract.evidenceRefs,
    clearingEvidenceRefs: contract.clearingEvidenceRefs,
    signaturePosture: contract.signaturePosture,
    keyIdentityRef: contract.keyIdentityRef,
    verificationPolicyRef: contract.verificationPolicyRef,
    generatedExecutionGraphRef: contract.generatedExecutionGraphId,
    generatedExecutionNodeRef: contract.generatedExecutionNodeId,
    redactionProfileRef: "contract-view:v0.2-redacted",
    omittedFields: ["parameters", "secretRefs", "contractSignature"],
  });
}

export async function projectAgentTransactionEnvelope(input: {
  contract: ActionContract;
  policyDecision: PolicyDecision;
  greenlight?: Greenlight | null;
  gateAttempt?: GatewayCheckAttempt | null;
  mutationAttempt?: MutationAttempt | null;
  receipt?: Receipt | null;
  proofGaps?: ProofGap[];
  refusals?: Refusal[];
  reconciliations?: SurfaceOperationReconciliation[];
  credentialResolutionEvidence?: CredentialResolutionEvidence[];
  ledger?: IdempotencyLedgerEntry | null;
  recoveryRefs?: string[];
  isolationRefs?: string[];
  authorityCertificates?: Array<{
    authorityCertificateId: string;
    terminal: { actionContractId: string };
  }>;
  receiptExportRef?: string | null;
}): Promise<AgentTransactionEnvelopeProjection> {
  const proofGaps = input.proofGaps ?? [];
  const refusals = scopedRefusals(input.refusals ?? [], input.contract);
  const idempotencyRecoveryDispositionValue = input.ledger
    ? idempotencyRecoveryDisposition(input.ledger, input.contract.paramsDigest)
    : null;
  const idempotencyReasonCodes = idempotencyRecoveryDispositionValue
    ? idempotencyRecoveryReasonCodes(idempotencyRecoveryDispositionValue)
    : [];
  const reconciliations = scopedReconciliations(input.reconciliations ?? [], input.contract);
  const latestReconciliation = latestReconciliationFor(reconciliations);
  const surfaceOperationEvidenceRefs = redactedProjectionRefs(
    reconciliations.flatMap((reconciliation) => reconciliation.evidenceRefs),
  );
  const credentialResolutionEvidence = scopedCredentialResolutionEvidence(
    input.credentialResolutionEvidence ?? [],
    input.contract,
  );
  const credentialResolutionEvidenceRefs = credentialResolutionEvidence
    .map((evidence) => protocolObjectRef("credential_resolution_evidence", evidence.credentialResolutionEvidenceId))
    .filter(unique);
  const gatewayCredentialRefs = gatewayCredentialEvidenceRefs([
    ...surfaceOperationEvidenceRefs,
    ...input.contract.gatewayCredentialRefs.map((ref) =>
      protocolObjectRef("gateway_credential_ref", ref.gatewayCredentialRefId),
    ),
    ...credentialResolutionEvidenceRefs,
  ]);
  const downstreamRefs = downstreamEvidenceRefs(surfaceOperationEvidenceRefs);
  const envelopeSeed = {
    actionContractRef: input.contract.actionContractId,
    contractDigest: input.contract.actionContractDigest,
    policyDecisionRef: input.policyDecision.policyDecisionId,
    policyDecisionStatus: input.policyDecision.decision,
    greenlightRef: input.greenlight?.greenlightId ?? input.receipt?.greenlightId ?? null,
    gateAttemptRef: input.gateAttempt?.gateAttemptId ?? input.receipt?.gateAttemptId ?? null,
    mutationAttemptRef: input.mutationAttempt?.mutationAttemptId ?? input.receipt?.mutationAttemptId ?? null,
    receiptRef: input.receipt?.receiptId ?? null,
    principalRef: input.contract.principalId,
    agentRef: input.contract.agentId,
    participantIdentityBindings: input.contract.participantIdentityBindings,
    runId: input.contract.runId,
    runtimeAdapterRef: input.contract.runtimeAdapterId,
    actionClass: input.contract.actionClass,
    protectedSurfaceKind: input.contract.protectedSurfaceKind,
    resourceRef: input.contract.resourceRef,
    gatewayId: input.contract.gatewayId,
    gatewayPolicyVersion: input.contract.gatewayPolicyVersion,
    idempotencyKey: input.contract.idempotencyKey,
    paramsDigest: input.contract.paramsDigest,
    nonSecretParamsSummary: input.contract.nonSecretParamsSummary,
    clearingEvidenceRefs: clearingEvidenceRefsJson(input.contract.clearingEvidenceRefs),
    surfaceOperationRef:
      latestReconciliation?.surfaceOperationRef ?? input.mutationAttempt?.surfaceOperationRef ?? null,
    surfaceOperationReconciliationRef: latestReconciliation?.reconciliationId ?? null,
    surfaceOperationEvidenceLabels: surfaceOperationEvidenceLabels({
      contract: input.contract,
      gateAttempt: input.gateAttempt ?? null,
      latestReconciliation,
      mutationAttempt: input.mutationAttempt ?? null,
      surfaceOperationEvidenceRefs,
      gatewayCredentialEvidenceRefs: gatewayCredentialRefs,
      downstreamEvidenceRefs: downstreamRefs,
    }),
    surfaceOperationEvidenceRefs,
    gatewayCredentialEvidenceRefs: gatewayCredentialRefs,
    credentialResolutionEvidenceRefs,
    downstreamEvidenceRefs: downstreamRefs,
    providerRequestRef: latestReconciliation?.providerRequestRef ?? null,
    providerOperationRef: latestReconciliation?.providerOperationRef ?? null,
    downstreamRetryability: latestReconciliation?.downstreamRetryability ?? null,
    reconciliationFinalityStatus: latestReconciliation?.finalityStatus ?? null,
    gatewayAdmissionStatus: agentTransactionGatewayAdmissionStatus(input),
    greenlightConsumptionStatus: input.receipt?.greenlightConsumptionStatus ?? null,
    downstreamOutcomeStatus: agentTransactionDownstreamOutcomeStatus(input),
    proofGapRefs: [...(input.receipt?.proofGapIds ?? []), ...proofGaps.map((proofGap) => proofGap.proofGapId)].filter(
      unique,
    ),
    proofGapReasonCodes: proofGaps.map((proofGap) => proofGap.reasonCode).filter(unique),
    refusalRefs: refusals.map((refusal) => refusal.refusalId).filter(unique),
    refusalReasonCodes: refusals.map((refusal) => refusal.reasonCode).filter(unique),
    idempotencyLedgerRef: input.ledger?.idempotencyLedgerEntryId ?? null,
    idempotencyLedgerState: input.ledger?.ledgerState ?? null,
    idempotencyRecoveryDisposition: idempotencyRecoveryDispositionValue,
    idempotencyReasonCodes,
    recoveryRefs: input.recoveryRefs ?? [],
    isolationRefs: input.isolationRefs ?? [],
    authorityCertificateRefs: (input.authorityCertificates ?? [])
      .filter((certificate) => certificate.terminal.actionContractId === input.contract.actionContractId)
      .map((certificate) => certificate.authorityCertificateId)
      .filter(unique),
    evidenceRefs: [
      ...redactedProjectionRefs(input.contract.evidenceRefs),
      ...redactedProjectionRefs(input.receipt?.evidenceRefs ?? []),
      ...redactedProjectionRefs(proofGaps.flatMap((proofGap) => proofGap.affectedObjectRefs)),
      ...redactedProjectionRefs(refusals.flatMap((refusal) => refusal.evidenceRefs)),
      ...redactedProjectionRefs(input.ledger?.evidenceRefs ?? []),
      ...surfaceOperationEvidenceRefs,
      ...credentialResolutionEvidenceRefs,
      ...redactedProjectionRefs(credentialResolutionEvidence.flatMap((evidence) => evidence.evidenceRefs)),
    ].filter(unique),
    streamOffsets: input.receipt?.streamOffsets ?? [],
    receiptDigest: input.receipt?.receiptDigest ?? null,
    auditChainDigest: input.receipt?.auditChainDigest ?? null,
    receiptExportRef: input.receiptExportRef ?? null,
    redactionProfileRef: "agent-transaction-envelope:v0.2-redacted" as const,
    omittedFields: ["actionContract.parameters", "actionContract.secretRefs", "receipt.evidenceRefs.raw"],
    envelopeDigest: null,
  };
  const envelopeDigest = await digestCanonical(envelopeSeed);
  return AgentTransactionEnvelopeProjectionSchema.parse({ ...envelopeSeed, envelopeDigest });
}

function scopedRefusals(refusals: Refusal[], contract: ActionContract): Refusal[] {
  return refusals.filter((refusal) => refusal.actionContractId === contract.actionContractId);
}

function scopedReconciliations(
  reconciliations: SurfaceOperationReconciliation[],
  contract: ActionContract,
): SurfaceOperationReconciliation[] {
  return reconciliations.filter((reconciliation) => reconciliation.actionContractId === contract.actionContractId);
}

function scopedCredentialResolutionEvidence(
  records: CredentialResolutionEvidence[],
  contract: ActionContract,
): CredentialResolutionEvidence[] {
  return records.filter((record) => record.actionContractId === contract.actionContractId);
}

function latestReconciliationFor(
  reconciliations: SurfaceOperationReconciliation[],
): SurfaceOperationReconciliation | null {
  return (
    [...reconciliations].sort((left, right) => Date.parse(right.observedAt) - Date.parse(left.observedAt))[0] ?? null
  );
}

export async function projectIdempotencyRecovery(input: {
  contract: ActionContract;
  ledger: IdempotencyLedgerEntry | null;
}): Promise<IdempotencyRecoveryProjection> {
  const ledgerKeyDigest = await idempotencyLedgerKeyDigest(idempotencyLedgerKey(input.contract));
  const paramsDigestMatch = input.ledger ? input.ledger.paramsDigest === input.contract.paramsDigest : null;
  const recoveryDisposition = idempotencyRecoveryDisposition(input.ledger, input.contract.paramsDigest);
  return IdempotencyRecoveryProjectionSchema.parse({
    actionContractRef: input.contract.actionContractId,
    ledgerKeyDigest,
    idempotencyKey: input.contract.idempotencyKey,
    paramsDigest: input.contract.paramsDigest,
    currentLedgerRef: input.ledger?.idempotencyLedgerEntryId ?? null,
    currentLedgerState: input.ledger?.ledgerState ?? null,
    paramsDigestMatch,
    priorActionContractRef: input.ledger?.actionContractId ?? null,
    policyDecisionRef: input.ledger?.policyDecisionId ?? null,
    greenlightRef: input.ledger?.greenlightId ?? null,
    gateAttemptRef: input.ledger?.gateAttemptId ?? null,
    mutationAttemptRef: input.ledger?.mutationAttemptId ?? null,
    receiptRef: input.ledger?.receiptId ?? null,
    priorResultRefs: idempotencyPriorResultRefs(input.ledger),
    recoveryDisposition,
    reasonCodes: idempotencyRecoveryReasonCodes(recoveryDisposition),
    evidenceRefs: input.ledger?.evidenceRefs ?? [],
    redactionProfileRef: "idempotency-recovery:v0.2-redacted",
    omittedFields: ["ledger.evidenceRefs.raw", "actionContract.parameters", "actionContract.secretRefs"],
  });
}

function idempotencyPriorResultRefs(ledger: IdempotencyLedgerEntry | null): string[] {
  if (!ledger) return [];
  return [
    protocolObjectRef("action_contract", ledger.actionContractId),
    protocolObjectRef("policy_decision", ledger.policyDecisionId),
    ledger.greenlightId ? protocolObjectRef("greenlight", ledger.greenlightId) : null,
    ledger.gateAttemptId ? protocolObjectRef("gateway_check_attempt", ledger.gateAttemptId) : null,
    ledger.mutationAttemptId ? protocolObjectRef("mutation_attempt", ledger.mutationAttemptId) : null,
    ledger.receiptId ? protocolObjectRef("receipt", ledger.receiptId) : null,
    ...ledger.evidenceRefs,
  ].filter((ref): ref is string => typeof ref === "string");
}

export function projectReceiptTimeline(input: {
  receipt: Receipt;
  events: ContractStreamEvent[];
  missingEventCount: number;
  reconciliations: SurfaceOperationReconciliation[];
}): ReceiptTimelineProjection {
  const latestReconciliation = input.reconciliations
    .filter((reconciliation) => reconciliation.mutationAttemptId === input.receipt.mutationAttemptId)
    .sort((left, right) => Date.parse(right.observedAt) - Date.parse(left.observedAt))[0];
  return ReceiptTimelineProjectionSchema.parse({
    receiptRef: input.receipt.receiptId,
    actionContractRef: input.receipt.actionContractId,
    policyDecisionRef: input.receipt.policyDecisionId,
    greenlightRef: input.receipt.greenlightId,
    gateAttemptRef: input.receipt.gateAttemptId,
    mutationAttemptRef: input.receipt.mutationAttemptId,
    gatewayId: input.receipt.gatewayId,
    policyDecisionStatus: input.receipt.policyDecisionStatus,
    gatewayCheckStatus: input.receipt.gatewayCheckStatus,
    gatewayAdmissionStatus: deriveGatewayAdmissionStatus(input.receipt),
    greenlightConsumptionStatus: input.receipt.greenlightConsumptionStatus,
    mutationAttemptStatus: input.receipt.mutationAttemptStatus,
    downstreamExecutionStatus: input.receipt.downstreamExecutionStatus,
    downstreamOutcomeStatus: deriveDownstreamOutcomeStatus(input.receipt),
    proofGapRefs: input.receipt.proofGapIds,
    finalityStatus: input.receipt.finalityStatus,
    receiptDigest: input.receipt.receiptDigest,
    auditChainDigest: input.receipt.auditChainDigest,
    streamOffsets: input.receipt.streamOffsets,
    events: input.events.map((event) => ({
      streamId: event.streamId,
      streamScope: event.streamScope,
      partitionKey: event.partitionKey,
      offset: event.offset,
      eventType: event.eventType,
      eventTime: event.eventTime,
      eventDigest: event.eventDigest,
      objectRefs: event.objectRefs,
    })),
    missingEventCount: input.missingEventCount,
    failureEvidence: latestReconciliation
      ? {
          downstreamRetryability: latestReconciliation.downstreamRetryability,
          providerRequestRef: latestReconciliation.providerRequestRef,
          providerOperationRef: latestReconciliation.providerOperationRef,
          redactedDiagnosticsDigest: latestReconciliation.redactedDiagnosticsDigest,
          traceRef: latestReconciliation.traceRef,
          spanRef: latestReconciliation.spanRef,
          diagnosticsRedactionPosture: latestReconciliation.diagnosticsRedactionPosture,
        }
      : null,
    redactionProfileRef: "receipt-timeline:v0.2-redacted",
    omittedFields: ["event.payload", "event.createdAt", "receipt.evidenceRefs"],
  });
}

function idempotencyRecoveryDisposition(
  ledger: IdempotencyLedgerEntry | null,
  paramsDigest: string,
): IdempotencyRecoveryDisposition {
  if (!ledger) return "missing";
  if (ledger.paramsDigest !== paramsDigest) return "different_params_refused";
  if (ledger.ledgerState === "terminal_unknown") return "terminal_unknown_requires_recovery";
  if (
    ledger.ledgerState === "terminal_succeeded" ||
    ledger.ledgerState === "terminal_failed" ||
    ledger.ledgerState === "terminal_refused"
  ) {
    return "same_params_result_available";
  }
  return "same_params_duplicate_refused";
}

function idempotencyRecoveryReasonCodes(disposition: IdempotencyRecoveryDisposition): string[] {
  if (disposition === "missing") return ["idempotency_recovery_missing"];
  if (disposition === "different_params_refused") return ["idempotency_key_params_mismatch"];
  if (disposition === "terminal_unknown_requires_recovery") return ["idempotency_terminal_unknown_recovery_required"];
  if (disposition === "same_params_result_available") return ["idempotency_result_reusable"];
  return ["idempotency_duplicate_authority"];
}

export function projectProtectedPathInstallHealth(input: {
  contract: ActionContract;
  gateway: GatewayRegistryEntry | null;
  posture: StoredProtocolRecord<ProtectedPathPosture> | null;
  now: string;
}): ProtectedPathInstallHealthProjection {
  const postureScopeKey = protectedPathPostureScopeKeyForContract(input.contract);
  const evaluation = input.gateway
    ? evaluateRequiredProtectedPathPosture({
        contract: input.contract,
        gateway: input.gateway,
        posture: input.posture,
        now: input.now,
      })
    : null;
  const reasonCodes =
    evaluation && !evaluation.ok ? [evaluation.reasonCode] : input.gateway ? [] : ["gateway_record_missing"];
  const current = input.posture?.payload ?? null;
  return ProtectedPathInstallHealthProjectionSchema.parse({
    actionContractRef: input.contract.actionContractId,
    postureScopeKey,
    runtimeAdapterRef: input.contract.runtimeAdapterId,
    gatewayId: input.contract.gatewayId,
    actionClass: input.contract.actionClass,
    protectedSurfaceKind: input.contract.protectedSurfaceKind,
    resourceRef: input.contract.resourceRef,
    requiredProtectedPathState: input.contract.requiredProtectedPathState,
    installHealthStatus: installHealthStatus(input.contract, evaluation, current, input.now),
    reasonCodes,
    currentPostureRef: current?.protectedPathPostureId ?? null,
    currentPostureDigest: current?.postureDigest ?? null,
    postureState: current?.postureState ?? null,
    credentialCustodyStatus: current?.credentialCustodyStatus ?? null,
    rawSiblingToolStatus: current?.rawSiblingToolStatus ?? null,
    sourceAuthority: current?.sourceAuthority ?? null,
    bypassProbeCoverage: current?.bypassProbeCoverage ?? [],
    observedAt: current?.observedAt ?? null,
    expiresAt: current?.expiresAt ?? null,
    redactionProfileRef: "protected-path-install-health:v0.2-redacted",
    omittedFields: ["bypassProbe.evidenceRefs", "bypassProbe.probeDiagnosticsDigest"],
  });
}

function installHealthStatus(
  contract: ActionContract,
  evaluation: ReturnType<typeof evaluateRequiredProtectedPathPosture> | null,
  posture: ProtectedPathPosture | null,
  now: string,
): ProtectedPathInstallHealthStatus {
  if (contract.requiredProtectedPathState === "not_required") return "not_required";
  if (!evaluation) return "unknown";
  if (evaluation.ok) return "satisfies_gateway_checked";
  if (!posture) return "missing";
  if (Date.parse(posture.expiresAt) <= Date.parse(now)) return "stale";
  return "unsafe";
}

function agentTransactionGatewayAdmissionStatus(input: {
  gateAttempt?: GatewayCheckAttempt | null;
  receipt?: Receipt | null;
}): AgentTransactionEnvelopeProjection["gatewayAdmissionStatus"] {
  if (input.receipt) return deriveGatewayAdmissionStatus(input.receipt);
  if (input.gateAttempt?.gateDecision === "passed") return "admitted";
  if (input.gateAttempt?.gateDecision === "refused") return "refused";
  if (input.gateAttempt?.gateDecision === "proof_gap") return "proof_gap";
  return "not_requested";
}

function agentTransactionDownstreamOutcomeStatus(input: {
  mutationAttempt?: MutationAttempt | null;
  receipt?: Receipt | null;
}): AgentTransactionEnvelopeProjection["downstreamOutcomeStatus"] {
  if (input.receipt) return deriveDownstreamOutcomeStatus(input.receipt);
  if (!input.mutationAttempt) return "not_started";
  if (input.mutationAttempt.outcome === "submitted") return "pending";
  if (input.mutationAttempt.outcome === "succeeded") return "succeeded";
  if (input.mutationAttempt.outcome === "downstream_refused") return "refused";
  if (input.mutationAttempt.outcome === "failed") return "failed";
  return "unknown";
}

function unique<T>(value: T, index: number, values: T[]): boolean {
  return values.indexOf(value) === index;
}

function clearingEvidenceRefsJson(refs: {
  correlationRef?: string | undefined;
  obligationRef?: string | undefined;
  counterpartyRef?: string | undefined;
}): Record<string, string> {
  const json: Record<string, string> = {};
  if (refs.correlationRef !== undefined) json.correlationRef = refs.correlationRef;
  if (refs.obligationRef !== undefined) json.obligationRef = refs.obligationRef;
  if (refs.counterpartyRef !== undefined) json.counterpartyRef = refs.counterpartyRef;
  return json;
}

function redactedProjectionRefs(refs: readonly string[]): string[] {
  return refs.filter((ref) => !looksLikeRawPaymentCredential(ref)).filter(unique);
}

function looksLikeRawPaymentCredential(value: string): boolean {
  return [
    /BEGIN\s+(?:RSA\s+|EC\s+|OPENSSH\s+)?PRIVATE KEY/i,
    /secretref:/i,
    /private[_-]?key/i,
    /api[_-]?key\s*=/i,
    /access[_-]?token\s*=/i,
    /secret\s*=/i,
    /password\s*=/i,
    /vault:\/\/.*\/secret/i,
    /infisical:\/\/.*\/secret/i,
    /PAYMENT-SIGNATURE\s*:/,
    /PaymentPayload/,
    /raw_payment_signature/i,
    /token[_-]?passthrough/i,
    /facilitator[_-]?secret/i,
  ].some((pattern) => pattern.test(value));
}

function gatewayCredentialEvidenceRefs(refs: readonly string[]): string[] {
  return refs
    .filter(
      (ref) =>
        (ref.startsWith("credential:") && ref.includes("payment")) ||
        (ref.startsWith("credential:") && ref.includes("signature")) ||
        ref.startsWith("gateway_credential_ref:") ||
        ref.startsWith("credential_resolution_evidence:") ||
        ref.startsWith("digest:sha256:"),
    )
    .filter(unique);
}

function downstreamEvidenceRefs(refs: readonly string[]): string[] {
  return refs.filter((ref) => ref.startsWith("evidence:") && ref.includes("payment-response")).filter(unique);
}

function surfaceOperationEvidenceLabels(input: {
  contract: ActionContract;
  gateAttempt: GatewayCheckAttempt | null;
  latestReconciliation: SurfaceOperationReconciliation | null;
  mutationAttempt: MutationAttempt | null;
  surfaceOperationEvidenceRefs: readonly string[];
  gatewayCredentialEvidenceRefs: readonly string[];
  downstreamEvidenceRefs: readonly string[];
}): string[] {
  const labels: string[] = [];
  if (input.gateAttempt) labels.push("local_gateway_check");
  if (input.gatewayCredentialEvidenceRefs.length > 0) {
    labels.push(
      hasPaymentCredentialEvidence(input.surfaceOperationEvidenceRefs)
        ? "payment_payload_created"
        : "gateway_credential_evidence",
    );
  }
  if (input.mutationAttempt && input.latestReconciliation) labels.push("paid_retry_attempted");
  if (input.downstreamEvidenceRefs.length > 0) {
    labels.push("payment_response_received");
  } else if (input.latestReconciliation?.observedDownstreamStatus === "unknown") {
    labels.push("payment_response_missing");
  }
  labels.push(...facilitatorEvidenceLabels(input.surfaceOperationEvidenceRefs));
  return labels.filter(unique);
}

function hasPaymentCredentialEvidence(refs: readonly string[]): boolean {
  return refs.some((ref) => /payment/i.test(ref));
}

function facilitatorEvidenceLabels(refs: readonly string[]): string[] {
  const labels: string[] = [];
  if (refs.some((ref) => ref.startsWith("evidence:") && ref.includes("facilitator-verify:attempt"))) {
    labels.push("facilitator_verify_attempted");
  }
  if (refs.some((ref) => ref.startsWith("evidence:") && ref.includes("facilitator-verify:succeeded"))) {
    labels.push("facilitator_verify_succeeded");
  }
  if (refs.some((ref) => ref.startsWith("evidence:") && ref.includes("facilitator-verify:failed"))) {
    labels.push("facilitator_verify_failed");
  }
  if (refs.some((ref) => ref.startsWith("evidence:") && ref.includes("facilitator-settle:attempt"))) {
    labels.push("facilitator_settle_attempted");
  }
  if (refs.some((ref) => ref.startsWith("evidence:") && ref.includes("settlement:succeeded"))) {
    labels.push("settlement_succeeded");
  }
  if (refs.some((ref) => ref.startsWith("evidence:") && ref.includes("settlement:failed"))) {
    labels.push("settlement_failed");
  }
  if (refs.some((ref) => ref.startsWith("evidence:") && ref.includes("settlement:unknown"))) {
    labels.push("settlement_unknown");
  }
  return labels;
}
