import { proposeActionContract as proposeActionContractTransition } from "./action-contracts";
import { createBreakerDecision as createBreakerDecisionTransition, type BreakerDecisionResult } from "./breaker-decisions";
import { HandshakeProtocolError } from "./errors";
import { compileIntent as compileIntentTransition } from "./intent-compilation";
import { createIsolationState as createIsolationStateTransition } from "./isolation-states";
import type {
  CompileIntentInput,
  CreateBreakerDecisionInput,
  CreateIsolationInput,
  CreateRecoveryRecommendationInput,
  CreateReceiptExportInput,
  CreateReviewDecisionInput,
  EvaluatePolicyInput,
  ProposeActionContractInput,
  ReconcileReceiverOperationInput,
  ResolveRecoveryTerminalConflictInput,
  ReceiverGateInput,
  TransitionRecoveryRecommendationStatusInput,
} from "./inputs";
import { evaluatePolicy as evaluatePolicyTransition } from "./policy-decisions";
import { createReceiptExport as createReceiptExportTransition } from "./receipt-exports";
import {
  transitionRecoveryRecommendationStatus as transitionRecoveryRecommendationStatusTransition,
  type RecoveryRecommendationStatusChange,
} from "./recovery-recommendation-status";
import { createRecoveryRecommendation as createRecoveryRecommendationTransition } from "./recovery-recommendations";
import {
  resolveRecoveryTerminalConflictProofGap as resolveRecoveryTerminalConflictProofGapTransition,
  type RecoveryTerminalConflictResolution,
} from "./recovery-terminal-conflict-resolutions";
import {
  reconcileReceiverOperation as reconcileReceiverOperationTransition,
  type ReceiverOperationReconciliationResult,
} from "./receiver-operation-reconciliations";
import { ProtocolRecorder } from "./records";
import { receiverGate as receiverGateTransition, type ReceiverGateResult } from "./receiver-gate-attempts";
import { createReviewDecision as createReviewDecisionTransition } from "./review-decisions";
import type {
  ActionContract,
  Greenlight,
  IntentCompilationRecord,
  IsolationState,
  PolicyDecision,
  ProtocolRecord,
  ReceiptExport,
  RecoveryRecommendation,
  ReviewDecision,
} from "./schemas";
import { guardCatalogRegistration, type TransitionGuardResult } from "./transitions";
import type { ProtocolStore } from "../storage/store";

export class HandshakeKernel {
  private readonly recorder: ProtocolRecorder;

  constructor(private readonly store: ProtocolStore) {
    this.recorder = new ProtocolRecorder(store);
  }

  async putCatalogObject(record: ProtocolRecord): Promise<void> {
    this.assertTransition(guardCatalogRegistration(record));
    await this.recorder.persistRecord(record);
  }

  compileIntent(input: CompileIntentInput): Promise<IntentCompilationRecord> {
    return compileIntentTransition(this.store, this.recorder, input);
  }

  proposeActionContract(input: ProposeActionContractInput): Promise<ActionContract> {
    return proposeActionContractTransition(this.recorder, input);
  }

  evaluatePolicy(input: EvaluatePolicyInput): Promise<{ decision: PolicyDecision; greenlight: Greenlight | null }> {
    return evaluatePolicyTransition(this.store, this.recorder, input);
  }

  receiverGate(input: ReceiverGateInput): Promise<ReceiverGateResult> {
    return receiverGateTransition(this.store, this.recorder, input);
  }

  createReviewDecision(input: CreateReviewDecisionInput): Promise<ReviewDecision> {
    return createReviewDecisionTransition(this.recorder, input);
  }

  reconcileReceiverOperation(input: ReconcileReceiverOperationInput): Promise<ReceiverOperationReconciliationResult> {
    return reconcileReceiverOperationTransition(this.store, this.recorder, input);
  }

  createIsolationState(input: CreateIsolationInput): Promise<IsolationState> {
    return createIsolationStateTransition(this.recorder, input);
  }

  createBreakerDecision(input: CreateBreakerDecisionInput): Promise<BreakerDecisionResult> {
    return createBreakerDecisionTransition(this.store, this.recorder, input);
  }

  createReceiptExport(input: CreateReceiptExportInput): Promise<ReceiptExport> {
    return createReceiptExportTransition(this.recorder, input);
  }

  createRecoveryRecommendation(input: CreateRecoveryRecommendationInput): Promise<RecoveryRecommendation> {
    return createRecoveryRecommendationTransition(this.recorder, input);
  }

  transitionRecoveryRecommendationStatus(
    input: TransitionRecoveryRecommendationStatusInput,
  ): Promise<RecoveryRecommendationStatusChange> {
    return transitionRecoveryRecommendationStatusTransition(this.recorder, input);
  }

  resolveRecoveryTerminalConflictProofGap(
    input: ResolveRecoveryTerminalConflictInput,
  ): Promise<RecoveryTerminalConflictResolution> {
    return resolveRecoveryTerminalConflictProofGapTransition(this.recorder, input);
  }

  private assertTransition(result: TransitionGuardResult): void {
    if (!result.ok) {
      throw new HandshakeProtocolError(result.code, result.message, result.status);
    }
  }
}
