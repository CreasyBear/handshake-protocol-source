import { proposeActionContract as proposeActionContractTransition } from "./action-contract";
import type { ActionContract, ProposeActionContractInput } from "./action-contract";
import { guardCatalogRegistration } from "./catalog-envelope";
import { HandshakeProtocolError } from "./errors";
import { gatewayCheck as gatewayCheckTransition, type GatewayCheckResult } from "./gateway-gate";
import type { GatewayCheckInput } from "./gateway-gate";
import { compileIntent as compileIntentTransition } from "./intent-compilation";
import type { CompileIntentInput, IntentCompilationRecord } from "./intent-compilation";
import {
  createBreakerDecision as createBreakerDecisionTransition,
  createIsolationState as createIsolationStateTransition,
  type BreakerDecisionResult,
} from "./isolation-breaker";
import type { CreateBreakerDecisionInput, CreateIsolationInput, IsolationState } from "./isolation-breaker";
import type { ProtocolRecord } from "./object-registry/schemas";
import { evaluatePolicy as evaluatePolicyTransition } from "./policy-greenlight";
import type { EvaluatePolicyInput, Greenlight, PolicyDecision } from "./policy-greenlight";
import { createProtectedPathPosture as createProtectedPathPostureTransition } from "./protected-path-posture";
import type { CreateProtectedPathPostureInput, ProtectedPathPosture } from "./protected-path-posture";
import { createReceiptExport as createReceiptExportTransition } from "./receipt-export";
import type { CreateReceiptExportInput, ReceiptExport } from "./receipt-export";
import {
  createRecoveryRecommendation as createRecoveryRecommendationTransition,
  resolveRecoveryTerminalConflictProofGap as resolveRecoveryTerminalConflictProofGapTransition,
  type RecoveryTerminalConflictResolution,
  transitionRecoveryRecommendationStatus as transitionRecoveryRecommendationStatusTransition,
  type RecoveryRecommendationStatusChange,
} from "./recovery";
import type {
  CreateRecoveryRecommendationInput,
  RecoveryRecommendation,
  ResolveRecoveryTerminalConflictInput,
  TransitionRecoveryRecommendationStatusInput,
} from "./recovery";
import {
  createReviewArtifact as createReviewArtifactTransition,
  createReviewDecision as createReviewDecisionTransition,
} from "./review-binding";
import type { CreateReviewArtifactInput, CreateReviewDecisionInput, ReviewArtifactRecord, ReviewDecision } from "./review-binding";
import { createRuntimeExecution as createRuntimeExecutionTransition } from "./runtime-evidence";
import type { CreateRuntimeExecutionInput, RuntimeExecutionRecord } from "./runtime-evidence";
import {
  reconcileSurfaceOperation as reconcileSurfaceOperationTransition,
  type SurfaceOperationReconciliationResult,
} from "./operation-lifecycle/index";
import type { ReconcileSurfaceOperationInput } from "./operation-lifecycle";
import { ProtocolRecorder } from "./records";
import type { TransitionGuardResult } from "./transition-guards";
import type { TransitionRequestContextDraft } from "./transition-request-contexts";
import type { ProtocolStore } from "./store-port";

export class HandshakeKernel {
  private readonly recorder: ProtocolRecorder;

  constructor(
    private readonly store: ProtocolStore,
    transitionRequestContext?: TransitionRequestContextDraft,
  ) {
    this.recorder = new ProtocolRecorder(store, transitionRequestContext);
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
