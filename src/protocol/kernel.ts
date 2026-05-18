import { proposeActionContract as proposeActionContractTransition } from "./action-contracts";
import { createBreakerDecision as createBreakerDecisionTransition, type BreakerDecisionResult } from "./breaker-decisions";
import { HandshakeProtocolError } from "./errors";
import { compileIntent as compileIntentTransition } from "./intent-compilation";
import { createIsolationState as createIsolationStateTransition } from "./isolation-states";
import type {
  CompileIntentInput,
  CreateBreakerDecisionInput,
  CreateIsolationInput,
  CreateProtectedPathPostureInput,
  CreateRecoveryRecommendationInput,
  CreateReceiptExportInput,
  CreateReviewArtifactInput,
  CreateReviewDecisionInput,
  CreateRuntimeExecutionInput,
  EvaluatePolicyInput,
  ProposeActionContractInput,
  ReconcileSurfaceOperationInput,
  ResolveRecoveryTerminalConflictInput,
  GatewayCheckInput,
  TransitionRecoveryRecommendationStatusInput,
} from "./inputs";
import { evaluatePolicy as evaluatePolicyTransition } from "./policy-decisions";
import { createProtectedPathPosture as createProtectedPathPostureTransition } from "./protected-path-postures";
import { createReceiptExport as createReceiptExportTransition } from "./receipt-exports";
import {
  transitionRecoveryRecommendationStatus as transitionRecoveryRecommendationStatusTransition,
  type RecoveryRecommendationStatusChange,
} from "./recovery-recommendation-status";
import { createRecoveryRecommendation as createRecoveryRecommendationTransition } from "./recovery-recommendations";
import { createReviewArtifact as createReviewArtifactTransition } from "./review-artifacts";
import { createRuntimeExecution as createRuntimeExecutionTransition } from "./runtime-executions";
import {
  resolveRecoveryTerminalConflictProofGap as resolveRecoveryTerminalConflictProofGapTransition,
  type RecoveryTerminalConflictResolution,
} from "./recovery-terminal-conflict-resolutions";
import {
  reconcileSurfaceOperation as reconcileSurfaceOperationTransition,
  type SurfaceOperationReconciliationResult,
} from "./surface-operation-reconciliations";
import { ProtocolRecorder } from "./records";
import { gatewayCheck as gatewayCheckTransition, type GatewayCheckResult } from "./gateway-check-attempts";
import { createReviewDecision as createReviewDecisionTransition } from "./review-decisions";
import type {
  ActionContract,
  Greenlight,
  IntentCompilationRecord,
  IsolationState,
  PolicyDecision,
  ProtocolRecord,
  ProtectedPathPosture,
  ReceiptExport,
  RecoveryRecommendation,
  ReviewArtifactRecord,
  ReviewDecision,
  RuntimeExecutionRecord,
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
    const result = await this.recorder.persistRecordIfAbsentOrSame(record);
    if (result === "conflict") {
      throw new HandshakeProtocolError(
        "bootstrap_record_digest_conflict",
        "Bootstrap catalog and envelope records are immutable by object id; same-id replacement must have the same canonical digest.",
        409,
      );
    }
  }

  createRuntimeExecution(input: CreateRuntimeExecutionInput): Promise<RuntimeExecutionRecord> {
    return createRuntimeExecutionTransition(this.recorder, input);
  }

  createProtectedPathPosture(input: CreateProtectedPathPostureInput): Promise<ProtectedPathPosture> {
    return createProtectedPathPostureTransition(this.recorder, input);
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

  gatewayCheck(input: GatewayCheckInput): Promise<GatewayCheckResult> {
    return gatewayCheckTransition(this.store, this.recorder, input);
  }

  createReviewDecision(input: CreateReviewDecisionInput): Promise<ReviewDecision> {
    return createReviewDecisionTransition(this.recorder, input);
  }

  createReviewArtifact(input: CreateReviewArtifactInput): Promise<ReviewArtifactRecord> {
    return createReviewArtifactTransition(this.recorder, input);
  }

  reconcileSurfaceOperation(input: ReconcileSurfaceOperationInput): Promise<SurfaceOperationReconciliationResult> {
    return reconcileSurfaceOperationTransition(this.store, this.recorder, input);
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
