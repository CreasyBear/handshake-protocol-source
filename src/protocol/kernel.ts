import { proposeActionContract as proposeActionContractTransition } from "./areas/action-contract";
import type { ActionContract, ProposeActionContractInput } from "./areas/action-contract";
import { guardCatalogRegistration } from "./areas/catalog-envelope";
import { HandshakeProtocolError } from "./foundation/errors";
import { gatewayCheck as gatewayCheckTransition, type GatewayCheckResult } from "./areas/gateway-gate";
import type { GatewayCheckInput } from "./areas/gateway-gate";
import { createGeneratedExecutionGraph as createGeneratedExecutionGraphTransition } from "./areas/generated-execution-graph";
import type {
  CreateGeneratedExecutionGraphInput,
  GeneratedExecutionGraph,
  GraphEvidenceIssuerContext,
} from "./areas/generated-execution-graph";
import { compileIntent as compileIntentTransition } from "./areas/intent-compilation";
import type { CompileIntentInput, IntentCompilationRecord } from "./areas/intent-compilation";
import {
  createBreakerDecision as createBreakerDecisionTransition,
  createIsolationState as createIsolationStateTransition,
  type BreakerDecisionResult,
} from "./areas/isolation-breaker";
import type { CreateBreakerDecisionInput, CreateIsolationInput, IsolationState } from "./areas/isolation-breaker";
import type { ProtocolRecord } from "./areas/object-registry";
import { evaluatePolicy as evaluatePolicyTransition } from "./areas/policy-greenlight";
import type { EvaluatePolicyInput, Greenlight, PolicyDecision } from "./areas/policy-greenlight";
import { createProtectedPathPosture as createProtectedPathPostureTransition } from "./areas/protected-path-posture";
import type { CreateProtectedPathPostureInput, ProtectedPathPosture } from "./areas/protected-path-posture";
import { createReceiptExport as createReceiptExportTransition } from "./areas/receipt-export";
import type { CreateReceiptExportInput, ReceiptExport } from "./areas/receipt-export";
import {
  createRecoveryRecommendation as createRecoveryRecommendationTransition,
  resolveRecoveryTerminalConflictProofGap as resolveRecoveryTerminalConflictProofGapTransition,
  type RecoveryTerminalConflictResolution,
  transitionRecoveryRecommendationStatus as transitionRecoveryRecommendationStatusTransition,
  type RecoveryRecommendationStatusChange,
} from "./areas/recovery";
import type {
  CreateRecoveryRecommendationInput,
  RecoveryRecommendation,
  ResolveRecoveryTerminalConflictInput,
  TransitionRecoveryRecommendationStatusInput,
} from "./areas/recovery";
import {
  createReviewArtifact as createReviewArtifactTransition,
  createReviewDecision as createReviewDecisionTransition,
} from "./areas/review-binding";
import type {
  CreateReviewArtifactInput,
  CreateReviewDecisionInput,
  ReviewArtifactRecord,
  ReviewDecision,
} from "./areas/review-binding";
import { createRuntimeExecution as createRuntimeExecutionTransition } from "./areas/runtime-evidence";
import type { CreateRuntimeExecutionInput, RuntimeExecutionRecord } from "./areas/runtime-evidence";
import {
  reconcileSurfaceOperation as reconcileSurfaceOperationTransition,
  type SurfaceOperationReconciliationResult,
} from "./areas/operation-lifecycle";
import type { ReconcileSurfaceOperationInput } from "./areas/operation-lifecycle";
import { ProtocolRecorder } from "./events/records";
import type { TransitionGuardResult } from "./foundation/transition-guards";
import type { TransitionRequestContextDraft } from "./context/request-contexts";
import type { ProtocolStore } from "./store/port";

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

  createGeneratedExecutionGraph(
    input: CreateGeneratedExecutionGraphInput,
    issuerContext: GraphEvidenceIssuerContext,
  ): Promise<GeneratedExecutionGraph> {
    return createGeneratedExecutionGraphTransition(this.store, this.recorder, input, issuerContext);
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
