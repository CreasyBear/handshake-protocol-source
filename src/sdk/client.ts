import type {
  ActionContract,
  ActionType,
  BreakerDecision,
  Greenlight,
  IntentCompilationRecord,
  IsolationState,
  OperatingEnvelope,
  PolicyDecision,
  ProofGap,
  RecoveryRecommendation,
  ReceiptExport,
  ReceiverRegistryEntry,
  ReceiverOperationReconciliation,
  ReviewDecision,
  ToolCapability,
} from "../protocol/schemas";
import type { ReceiverGateResult } from "../protocol/receiver-gate-artifacts";
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
} from "../protocol/inputs";
import type { RecoveryRecommendationStatusChange } from "../protocol/recovery-recommendation-status";
import type { RecoveryTerminalConflictResolution } from "../protocol/recovery-terminal-conflict-resolutions";

export type HandshakeFetch = (
  input: Parameters<typeof fetch>[0],
  init?: Parameters<typeof fetch>[1],
) => Promise<Response>;

export class HandshakeClient {
  constructor(
    private readonly baseUrl: string,
    private readonly fetchImpl: HandshakeFetch = fetch,
  ) {}

  registerToolCapability(input: ToolCapability): Promise<ToolCapability> {
    return this.post("/v0.2/catalog/tool-capabilities", input);
  }

  registerActionType(input: ActionType): Promise<ActionType> {
    return this.post("/v0.2/catalog/action-types", input);
  }

  registerReceiverRegistryEntry(input: ReceiverRegistryEntry): Promise<ReceiverRegistryEntry> {
    return this.post("/v0.2/catalog/receivers", input);
  }

  registerOperatingEnvelope(input: OperatingEnvelope): Promise<OperatingEnvelope> {
    return this.post("/v0.2/envelopes", input);
  }

  compileIntent(input: CompileIntentInput): Promise<IntentCompilationRecord> {
    return this.post("/v0.2/intent-compilations", input);
  }

  proposeActionContract(input: ProposeActionContractInput): Promise<ActionContract> {
    return this.post("/v0.2/action-contracts", input);
  }

  evaluatePolicy(input: EvaluatePolicyInput): Promise<{ decision: PolicyDecision; greenlight: Greenlight | null }> {
    return this.post("/v0.2/policy-decisions", input);
  }

  createReviewDecision(input: CreateReviewDecisionInput): Promise<ReviewDecision> {
    return this.post("/v0.2/review-decisions", input);
  }

  createBreakerDecision(input: CreateBreakerDecisionInput): Promise<{
    breakerDecision: BreakerDecision;
    isolationState: IsolationState;
  }> {
    return this.post("/v0.2/breaker-decisions", input);
  }

  createIsolationState(input: CreateIsolationInput): Promise<IsolationState> {
    return this.post("/v0.2/isolation-states", input);
  }

  createReceiptExport(input: CreateReceiptExportInput): Promise<ReceiptExport> {
    return this.post("/v0.2/receipt-exports", input);
  }

  createRecoveryRecommendation(input: CreateRecoveryRecommendationInput): Promise<RecoveryRecommendation> {
    return this.post("/v0.2/recovery-recommendations", input);
  }

  transitionRecoveryRecommendationStatus(
    input: TransitionRecoveryRecommendationStatusInput,
  ): Promise<RecoveryRecommendationStatusChange> {
    return this.post("/v0.2/recovery-recommendation-status-transitions", input);
  }

  resolveRecoveryTerminalConflictProofGap(
    input: ResolveRecoveryTerminalConflictInput,
  ): Promise<RecoveryTerminalConflictResolution> {
    return this.post("/v0.2/recovery-terminal-conflict-resolutions", input);
  }

  receiverGate(input: ReceiverGateInput): Promise<ReceiverGateResult> {
    return this.post("/v0.2/receiver-gate-attempts", input);
  }

  reconcileReceiverOperation(input: ReconcileReceiverOperationInput): Promise<{
    reconciliation: ReceiverOperationReconciliation;
    resolvedProofGaps: ProofGap[];
  }> {
    return this.post("/v0.2/receiver-operation-reconciliations", input);
  }

  private async post<T>(path: string, body: unknown): Promise<T> {
    const response = await this.fetchImpl(new URL(path, this.baseUrl), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      throw new Error(`Handshake request failed: ${response.status} ${await response.text()}`);
    }
    return (await response.json()) as T;
  }
}
