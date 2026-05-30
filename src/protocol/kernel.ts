import { proposeActionContract as proposeActionContractTransition } from "./areas/action-contract";
import type { ActionContract, ProposeActionContractInput } from "./areas/action-contract";
import { createAuthorityCertificate as createAuthorityCertificateTransition } from "./areas/authority-certificate";
import type { AuthorityCertificate, CreateAuthorityCertificateInput } from "./areas/authority-certificate";
import { guardCatalogRegistration } from "./areas/catalog-envelope";
import {
  recordCredentialResolutionEvidence as recordCredentialResolutionEvidenceTransition,
  recordGatewayCustodyProofPacket as recordGatewayCustodyProofPacketTransition,
  registerGatewayCredentialRef as registerGatewayCredentialRefTransition,
} from "./areas/credential-custody";
import type {
  CredentialResolutionEvidence,
  GatewayCredentialRef,
  GatewayCustodyProofPacket,
  RecordCredentialResolutionEvidenceInput,
  RecordGatewayCustodyProofPacketInput,
  RegisterGatewayCredentialRefInput,
} from "./areas/credential-custody";
import {
  registerDelegatedAuthorityRef as registerDelegatedAuthorityRefTransition,
  transitionDelegatedAuthorityStatus as transitionDelegatedAuthorityStatusTransition,
} from "./areas/delegated-authority";
import type {
  DelegatedAuthorityRef,
  DelegatedAuthorityStatusTransition,
  RegisterDelegatedAuthorityRefInput,
  TransitionDelegatedAuthorityStatusInput,
} from "./areas/delegated-authority";
import { HandshakeProtocolError } from "./foundation/errors";
import { gatewayCheck as gatewayCheckTransition, type GatewayCheckResult } from "./areas/gateway-gate";
import type { GatewayCheckInput } from "./areas/gateway-gate";
import { createGeneratedExecutionGraph as createGeneratedExecutionGraphTransition } from "./areas/generated-execution-graph";
import type {
  CreateGeneratedExecutionGraphInput,
  GeneratedExecutionGraph,
  GraphEvidenceIssuerContext,
} from "./areas/generated-execution-graph";
import {
  registerInstallProposalCompiledRecords as registerInstallProposalCompiledRecordsTransition,
  type InstallSetupResult,
  type RegisterInstallProposalCompiledRecordsInput,
} from "./areas/install-setup";
import { createBypassProbe as createBypassProbeTransition } from "./areas/bypass-probe";
import type { BypassProbe, CreateBypassProbeInput } from "./areas/bypass-probe";
import {
  createToolCallDraft as createToolCallDraftTransition,
  transitionToolCallDraft as transitionToolCallDraftTransition,
} from "./areas/tool-call-draft";
import type { CreateToolCallDraftInput, ToolCallDraft, TransitionToolCallDraftInput } from "./areas/tool-call-draft";
import { compileIntent as compileIntentTransition } from "./areas/intent-compilation";
import type { CompileIntentInput, IntentCompilationRecord } from "./areas/intent-compilation";
import { commitRefusal, type BuildRefusalInput } from "./areas/refusal";
import type { Refusal } from "./areas/refusal";
import {
  createBreakerDecision as createBreakerDecisionTransition,
  createIsolationState as createIsolationStateTransition,
  type BreakerDecisionResult,
} from "./areas/isolation-breaker";
import type { CreateBreakerDecisionInput, CreateIsolationInput, IsolationState } from "./areas/isolation-breaker";
import { ProtocolRecordSchema, type ProtocolRecord } from "./areas/object-registry";
import {
  recordAgreementObligationBinding as recordAgreementObligationBindingTransition,
  recordLinkedAgreement as recordLinkedAgreementTransition,
  recordNegotiationDecision as recordNegotiationDecisionTransition,
  recordNegotiationOffer as recordNegotiationOfferTransition,
  recordNegotiationSession as recordNegotiationSessionTransition,
  transitionAgreementStatus as transitionAgreementStatusTransition,
} from "./areas/negotiation";
import type {
  AgreementObligationBinding,
  AgreementStatusTransition,
  LinkedAgreement,
  NegotiationDecision,
  NegotiationOffer,
  NegotiationSession,
} from "./areas/negotiation";
import { evaluatePolicy as evaluatePolicyTransition } from "./areas/policy-greenlight";
import type { EvaluatePolicyInput, PolicyEvaluationResponse } from "./areas/policy-greenlight";
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
    const parsedRecord = ProtocolRecordSchema.parse(record);
    this.assertTransition(guardCatalogRegistration(parsedRecord));
    const result = await this.recorder.persistRecordIfAbsentOrSame(parsedRecord);
    if (result === "conflict") {
      throw new HandshakeProtocolError(
        "bootstrap_record_digest_conflict",
        "Bootstrap catalog and envelope records are immutable by object id; same-id replacement must have the same canonical digest.",
        409,
      );
    }
  }

  registerInstallProposalCompiledRecords(
    input: RegisterInstallProposalCompiledRecordsInput,
  ): Promise<InstallSetupResult> {
    return registerInstallProposalCompiledRecordsTransition(this.store, this.recorder, input);
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

  createBypassProbe(input: CreateBypassProbeInput): Promise<BypassProbe> {
    return createBypassProbeTransition(this.recorder, input);
  }

  createToolCallDraft(input: CreateToolCallDraftInput): Promise<ToolCallDraft> {
    return createToolCallDraftTransition(this.recorder, input);
  }

  transitionToolCallDraft(input: TransitionToolCallDraftInput): Promise<ToolCallDraft> {
    return transitionToolCallDraftTransition(this.store, this.recorder, input);
  }

  createProtectedPathPosture(input: CreateProtectedPathPostureInput): Promise<ProtectedPathPosture> {
    return createProtectedPathPostureTransition(this.recorder, input);
  }

  compileIntent(input: CompileIntentInput): Promise<IntentCompilationRecord> {
    return compileIntentTransition(this.store, this.recorder, input);
  }

  commitIngressRefusal(input: BuildRefusalInput): Promise<Refusal> {
    return commitRefusal(this.recorder, input);
  }

  proposeActionContract(input: ProposeActionContractInput): Promise<ActionContract> {
    return proposeActionContractTransition(this.store, this.recorder, input);
  }

  recordNegotiationSession(input: NegotiationSession): Promise<NegotiationSession> {
    return recordNegotiationSessionTransition(this.recorder, input);
  }

  recordNegotiationOffer(input: NegotiationOffer): Promise<NegotiationOffer> {
    return recordNegotiationOfferTransition(this.store, this.recorder, input);
  }

  recordNegotiationDecision(input: NegotiationDecision): Promise<NegotiationDecision> {
    return recordNegotiationDecisionTransition(this.store, this.recorder, input);
  }

  recordLinkedAgreement(input: LinkedAgreement): Promise<LinkedAgreement> {
    return recordLinkedAgreementTransition(this.store, this.recorder, input);
  }

  recordAgreementObligationBinding(input: AgreementObligationBinding): Promise<AgreementObligationBinding> {
    return recordAgreementObligationBindingTransition(this.store, this.recorder, input);
  }

  transitionAgreementStatus(input: AgreementStatusTransition): Promise<AgreementStatusTransition> {
    return transitionAgreementStatusTransition(this.store, this.recorder, input);
  }

  registerGatewayCredentialRef(input: RegisterGatewayCredentialRefInput): Promise<GatewayCredentialRef> {
    return registerGatewayCredentialRefTransition(this.recorder, input);
  }

  registerDelegatedAuthorityRef(input: RegisterDelegatedAuthorityRefInput): Promise<DelegatedAuthorityRef> {
    return registerDelegatedAuthorityRefTransition(this.recorder, input);
  }

  transitionDelegatedAuthorityStatus(
    input: TransitionDelegatedAuthorityStatusInput,
  ): Promise<DelegatedAuthorityStatusTransition> {
    return transitionDelegatedAuthorityStatusTransition(this.recorder, input);
  }

  recordCredentialResolutionEvidence(
    input: RecordCredentialResolutionEvidenceInput,
  ): Promise<CredentialResolutionEvidence> {
    return recordCredentialResolutionEvidenceTransition(this.recorder, input);
  }

  recordGatewayCustodyProofPacket(input: RecordGatewayCustodyProofPacketInput): Promise<GatewayCustodyProofPacket> {
    return recordGatewayCustodyProofPacketTransition(this.recorder, input);
  }

  createAuthorityCertificate(input: CreateAuthorityCertificateInput): Promise<AuthorityCertificate> {
    return createAuthorityCertificateTransition(this.store, this.recorder, input);
  }

  evaluatePolicy(input: EvaluatePolicyInput): Promise<PolicyEvaluationResponse> {
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
