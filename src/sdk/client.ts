import type {
  ActionContract,
  ActionType,
  BreakerDecision,
  Greenlight,
  IntentCompilationRecord,
  IsolationState,
  OperatingEnvelope,
  PolicyDecision,
  ProtectedPathPosture,
  RecoveryRecommendation,
  ReceiptExport,
  GatewayRegistryEntry,
  ReviewArtifactRecord,
  ReviewDecision,
  RuntimeExecutionRecord,
  ToolCapability,
} from "../protocol/schemas";
import type { GatewayCheckResult } from "../protocol/gateway-gate";
import type { SurfaceOperationReconciliationResult } from "../protocol/operation-lifecycle";
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
} from "../protocol/inputs";
import type { RecoveryRecommendationStatusChange, RecoveryTerminalConflictResolution } from "../protocol/recovery";
import { PROTOCOL_VERSION } from "../protocol/schemas";
import type { CallerAuthTokens, TransitionCallerRole } from "../http/caller-auth";
import {
  TransitionErrorResponseSchema,
  type TransitionErrorEnvelope,
} from "../http/transition-error-envelope";
import {
  HANDSHAKE_ORIGINATING_IDENTITY_HEADER,
  HANDSHAKE_PROTOCOL_VERSION_HEADER,
  HANDSHAKE_REQUEST_IDENTITY_HEADER,
} from "../http/transition-request-context";

export type HandshakeFetch = (
  input: Parameters<typeof fetch>[0],
  init?: Parameters<typeof fetch>[1],
) => Promise<Response>;

export type HandshakeClientOptions = {
  transitionToken?: string;
  transitionTokens?: CallerAuthTokens;
  protocolVersion?: string;
  requestIdentityFactory?: () => string;
  originatingIdentity?: string;
};

export class HandshakeClientError extends Error {
  public readonly code: string;
  public readonly transitionName: string | null;
  public readonly callerCustodyRole: TransitionCallerRole | null;
  public readonly retryability: TransitionErrorEnvelope["retryability"];
  public readonly commitState: TransitionErrorEnvelope["commitState"];
  public readonly requestIdentity: string | null;
  public readonly proofRef: string | null;
  public readonly refusalRef: string | null;

  constructor(
    public readonly status: number,
    public readonly envelope: TransitionErrorEnvelope,
  ) {
    super(`Handshake ${envelope.transitionName ?? "request"} failed: ${envelope.code}`);
    this.name = "HandshakeClientError";
    this.code = envelope.code;
    this.transitionName = envelope.transitionName;
    this.callerCustodyRole = envelope.callerCustodyRole;
    this.retryability = envelope.retryability;
    this.commitState = envelope.commitState;
    this.requestIdentity = envelope.requestIdentity;
    this.proofRef = envelope.proofRef;
    this.refusalRef = envelope.refusalRef;
  }
}

export class HandshakeClient {
  constructor(
    private readonly baseUrl: string,
    private readonly fetchImpl: HandshakeFetch = fetch,
    private readonly options: HandshakeClientOptions = {},
  ) {}

  registerToolCapability(input: ToolCapability): Promise<ToolCapability> {
    return this.post("/v0.2/catalog/tool-capabilities", input, "control_plane");
  }

  registerActionType(input: ActionType): Promise<ActionType> {
    return this.post("/v0.2/catalog/action-types", input, "control_plane");
  }

  registerGatewayRegistryEntry(input: GatewayRegistryEntry): Promise<GatewayRegistryEntry> {
    return this.post("/v0.2/catalog/gateways", input, "control_plane");
  }

  registerOperatingEnvelope(input: OperatingEnvelope): Promise<OperatingEnvelope> {
    return this.post("/v0.2/envelopes", input, "control_plane");
  }

  compileIntent(input: CompileIntentInput): Promise<IntentCompilationRecord> {
    return this.post("/v0.2/intent-compilations", input, "runtime_evidence");
  }

  createRuntimeExecution(input: CreateRuntimeExecutionInput): Promise<RuntimeExecutionRecord> {
    return this.post("/v0.2/runtime-executions", input, "runtime_evidence");
  }

  createProtectedPathPosture(input: CreateProtectedPathPostureInput): Promise<ProtectedPathPosture> {
    return this.post("/v0.2/protected-path-postures", input, "gateway_custody");
  }

  proposeActionContract(input: ProposeActionContractInput): Promise<ActionContract> {
    return this.post("/v0.2/action-contracts", input, "control_plane");
  }

  evaluatePolicy(input: EvaluatePolicyInput): Promise<{ decision: PolicyDecision; greenlight: Greenlight | null }> {
    return this.post("/v0.2/policy-decisions", input, "control_plane");
  }

  createReviewDecision(input: CreateReviewDecisionInput): Promise<ReviewDecision> {
    return this.post("/v0.2/review-decisions", input, "review_custody");
  }

  createReviewArtifact(input: CreateReviewArtifactInput): Promise<ReviewArtifactRecord> {
    return this.post("/v0.2/review-artifacts", input, "review_custody");
  }

  createBreakerDecision(input: CreateBreakerDecisionInput): Promise<{
    breakerDecision: BreakerDecision;
    isolationState: IsolationState;
  }> {
    return this.post("/v0.2/breaker-decisions", input, "control_plane");
  }

  createIsolationState(input: CreateIsolationInput): Promise<IsolationState> {
    return this.post("/v0.2/isolation-states", input, "control_plane");
  }

  createReceiptExport(input: CreateReceiptExportInput): Promise<ReceiptExport> {
    return this.post("/v0.2/receipt-exports", input, "control_plane");
  }

  createRecoveryRecommendation(input: CreateRecoveryRecommendationInput): Promise<RecoveryRecommendation> {
    return this.post("/v0.2/recovery-recommendations", input, "control_plane");
  }

  transitionRecoveryRecommendationStatus(
    input: TransitionRecoveryRecommendationStatusInput,
  ): Promise<RecoveryRecommendationStatusChange> {
    return this.post("/v0.2/recovery-recommendation-status-transitions", input, "control_plane");
  }

  resolveRecoveryTerminalConflictProofGap(
    input: ResolveRecoveryTerminalConflictInput,
  ): Promise<RecoveryTerminalConflictResolution> {
    return this.post("/v0.2/recovery-terminal-conflict-resolutions", input, "control_plane");
  }

  gatewayCheck(input: GatewayCheckInput): Promise<GatewayCheckResult> {
    return this.post("/v0.2/gateway-check-attempts", input, "gateway_custody");
  }

  reconcileSurfaceOperation(input: ReconcileSurfaceOperationInput): Promise<SurfaceOperationReconciliationResult> {
    return this.post("/v0.2/surface-operation-reconciliations", input, "gateway_custody");
  }

  private async post<T>(path: string, body: unknown, role: TransitionCallerRole): Promise<T> {
    const headers: Record<string, string> = {
      "content-type": "application/json",
      [HANDSHAKE_PROTOCOL_VERSION_HEADER]: this.options.protocolVersion ?? PROTOCOL_VERSION,
      [HANDSHAKE_REQUEST_IDENTITY_HEADER]: this.nextRequestIdentity(),
    };
    if (this.options.originatingIdentity) {
      headers[HANDSHAKE_ORIGINATING_IDENTITY_HEADER] = this.options.originatingIdentity;
    }
    const token = this.options.transitionTokens?.[role] ?? this.options.transitionToken;
    if (token) headers.authorization = `Bearer ${token}`;
    const response = await this.fetchImpl(new URL(path, this.baseUrl), {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      throw new HandshakeClientError(response.status, await this.errorEnvelopeForResponse(response));
    }
    return (await response.json()) as T;
  }

  private nextRequestIdentity(): string {
    return this.options.requestIdentityFactory?.() ?? crypto.randomUUID();
  }

  private async errorEnvelopeForResponse(response: Response): Promise<TransitionErrorEnvelope> {
    const parsedBody = await parseJsonBody(response);
    const parsedError = TransitionErrorResponseSchema.safeParse(parsedBody);
    if (parsedError.success) return parsedError.data.error;
    return {
      code: "http_error",
      message: `Handshake request failed with HTTP ${response.status}.`,
      transitionName: null,
      callerCustodyRole: null,
      retryability: response.status >= 500 ? "retryable" : "terminal",
      commitState: "unknown",
      requestIdentity: response.headers.get(HANDSHAKE_REQUEST_IDENTITY_HEADER),
      proofRef: null,
      refusalRef: null,
    };
  }
}

async function parseJsonBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text.trim()) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
