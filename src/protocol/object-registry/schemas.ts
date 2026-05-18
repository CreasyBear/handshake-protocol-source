import { z } from "zod";
import { ActionContractSchema } from "../action-contract/schemas";
import { ActionTypeSchema, GatewayRegistryEntrySchema, OperatingEnvelopeSchema, ToolCapabilitySchema } from "../catalog-envelope/schemas";
import { ContractStreamEventSchema } from "../event-schemas";
import { GatewayCheckAttemptSchema, MutationAttemptSchema } from "../gateway-gate/schemas";
import { IntentCompilationRecordSchema } from "../intent-compilation/schemas";
import { BreakerDecisionSchema, IsolationStateSchema } from "../isolation-breaker/schemas";
import { ProtectedSurfaceOperationClaimSchema, SurfaceOperationReconciliationSchema } from "../operation-lifecycle/schemas";
import { GreenlightSchema, PolicyDecisionSchema } from "../policy-greenlight/schemas";
import { ProofGapSchema } from "../proof-gap/schemas";
import { ProtectedPathPostureSchema } from "../protected-path-posture/schemas";
import { ReceiptExportSchema, ReceiptSchema } from "../receipt-export/schemas";
import { RecoveryRecommendationSchema, RecoveryRecommendationStatusTransitionSchema } from "../recovery/schemas";
import { ReviewArtifactRecordSchema, ReviewDecisionSchema } from "../review-binding/schemas";
import { RuntimeExecutionRecordSchema } from "../runtime-evidence/schemas";
import { TransitionRequestContextSchema } from "../transition-request-context-schemas";

export const ProtocolObjectTypeSchema = z.enum([
  "tool_capability",
  "action_type",
  "gateway_registry_entry",
  "operating_envelope",
  "transition_request_context",
  "runtime_execution",
  "protected_path_posture",
  "intent_compilation",
  "action_contract",
  "policy_decision",
  "greenlight",
  "review_artifact",
  "review_decision",
  "breaker_decision",
  "isolation_state",
  "gateway_check_attempt",
  "mutation_attempt",
  "protected_surface_operation_claim",
  "surface_operation_reconciliation",
  "proof_gap",
  "receipt",
  "receipt_export",
  "recovery_recommendation",
  "recovery_recommendation_status_transition",
  "contract_stream_event",
]);
export type ProtocolObjectType = z.infer<typeof ProtocolObjectTypeSchema>;

export const ProtocolRecordSchema = z.discriminatedUnion("objectType", [
  z.strictObject({ objectType: z.literal("tool_capability"), payload: ToolCapabilitySchema }),
  z.strictObject({ objectType: z.literal("action_type"), payload: ActionTypeSchema }),
  z.strictObject({ objectType: z.literal("gateway_registry_entry"), payload: GatewayRegistryEntrySchema }),
  z.strictObject({ objectType: z.literal("operating_envelope"), payload: OperatingEnvelopeSchema }),
  z.strictObject({ objectType: z.literal("transition_request_context"), payload: TransitionRequestContextSchema }),
  z.strictObject({ objectType: z.literal("runtime_execution"), payload: RuntimeExecutionRecordSchema }),
  z.strictObject({ objectType: z.literal("protected_path_posture"), payload: ProtectedPathPostureSchema }),
  z.strictObject({ objectType: z.literal("intent_compilation"), payload: IntentCompilationRecordSchema }),
  z.strictObject({ objectType: z.literal("action_contract"), payload: ActionContractSchema }),
  z.strictObject({ objectType: z.literal("policy_decision"), payload: PolicyDecisionSchema }),
  z.strictObject({ objectType: z.literal("greenlight"), payload: GreenlightSchema }),
  z.strictObject({ objectType: z.literal("review_artifact"), payload: ReviewArtifactRecordSchema }),
  z.strictObject({ objectType: z.literal("review_decision"), payload: ReviewDecisionSchema }),
  z.strictObject({ objectType: z.literal("breaker_decision"), payload: BreakerDecisionSchema }),
  z.strictObject({ objectType: z.literal("isolation_state"), payload: IsolationStateSchema }),
  z.strictObject({ objectType: z.literal("gateway_check_attempt"), payload: GatewayCheckAttemptSchema }),
  z.strictObject({ objectType: z.literal("mutation_attempt"), payload: MutationAttemptSchema }),
  z.strictObject({ objectType: z.literal("protected_surface_operation_claim"), payload: ProtectedSurfaceOperationClaimSchema }),
  z.strictObject({ objectType: z.literal("surface_operation_reconciliation"), payload: SurfaceOperationReconciliationSchema }),
  z.strictObject({ objectType: z.literal("proof_gap"), payload: ProofGapSchema }),
  z.strictObject({ objectType: z.literal("receipt"), payload: ReceiptSchema }),
  z.strictObject({ objectType: z.literal("receipt_export"), payload: ReceiptExportSchema }),
  z.strictObject({ objectType: z.literal("recovery_recommendation"), payload: RecoveryRecommendationSchema }),
  z.strictObject({
    objectType: z.literal("recovery_recommendation_status_transition"),
    payload: RecoveryRecommendationStatusTransitionSchema,
  }),
  z.strictObject({ objectType: z.literal("contract_stream_event"), payload: ContractStreamEventSchema }),
]);
export type ProtocolRecord = z.infer<typeof ProtocolRecordSchema>;
