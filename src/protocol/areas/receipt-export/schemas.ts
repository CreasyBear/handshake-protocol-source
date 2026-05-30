import { z } from "zod";
import {
  DigestSchema,
  IdSchema,
  IsoDateSchema,
  ProtocolBaseSchema,
  ReasonCodeSchema,
  SignaturePostureSchema,
} from "../../foundation/schema-core";
import { ReceiptDelegationProvenanceSchema } from "./delegation-provenance";
import { GateDecisionSchema } from "../gateway-gate/schemas";
import { PolicyDecisionValueSchema } from "../policy-greenlight/schemas";

export const GatewayAdmissionStatusSchema = z.enum(["not_requested", "admitted", "refused", "proof_gap", "replayed"]);
export type GatewayAdmissionStatus = z.infer<typeof GatewayAdmissionStatusSchema>;

export const DownstreamOutcomeStatusSchema = z.enum([
  "not_started",
  "pending",
  "succeeded",
  "refused",
  "failed",
  "unknown",
]);
export type DownstreamOutcomeStatus = z.infer<typeof DownstreamOutcomeStatusSchema>;

export const ReceiptStreamReferenceSchema = z
  .strictObject({
    streamId: IdSchema,
    streamScope: z.enum(["tenant", "organization", "run", "protected_surface_resource"]),
    partitionKey: z.string().min(1),
    offsetStart: z.number().int().nonnegative(),
    offsetEnd: z.number().int().nonnegative(),
    terminalEventDigest: DigestSchema,
  })
  .refine((reference) => reference.offsetStart <= reference.offsetEnd, {
    message: "offsetEnd must be greater than or equal to offsetStart",
    path: ["offsetEnd"],
  });
export type ReceiptStreamReference = z.infer<typeof ReceiptStreamReferenceSchema>;

export const ReceiptSchema = ProtocolBaseSchema.extend({
  receiptId: IdSchema,
  actionContractId: IdSchema,
  policyDecisionId: IdSchema,
  greenlightId: IdSchema.nullable(),
  gateAttemptId: IdSchema.nullable(),
  mutationAttemptId: IdSchema.nullable(),
  gatewayId: IdSchema,
  policyDecisionStatus: PolicyDecisionValueSchema,
  gatewayCheckStatus: GateDecisionSchema.nullable(),
  gatewayAdmissionStatus: GatewayAdmissionStatusSchema,
  greenlightConsumptionStatus: z.enum(["not_applicable", "not_consumed", "consumed", "replayed"]),
  mutationAttemptStatus: z.enum(["not_attempted", "submitted", "succeeded", "downstream_refused", "failed", "unknown"]),
  downstreamExecutionStatus: z.enum(["not_started", "pending", "succeeded", "refused", "failed", "unknown"]),
  downstreamOutcomeStatus: DownstreamOutcomeStatusSchema,
  proofGapIds: z.array(IdSchema).default([]),
  evidenceRefs: z.array(z.string()).default([]),
  streamEventIds: z.array(IdSchema).default([]),
  streamOffsets: z.array(ReceiptStreamReferenceSchema).default([]),
  receiptDigest: DigestSchema.nullable(),
  auditChainDigest: DigestSchema.nullable(),
  finalityStatus: z.enum(["final", "pending", "suspect", "unknown"]),
  emittedAt: IsoDateSchema,
});
export type Receipt = z.infer<typeof ReceiptSchema>;

export const ReceiptExportSchema = ProtocolBaseSchema.extend({
  receiptExportId: IdSchema,
  receiptId: IdSchema,
  actionContractId: IdSchema,
  policyDecisionId: IdSchema,
  greenlightId: IdSchema.nullable(),
  gateAttemptId: IdSchema.nullable(),
  mutationAttemptId: IdSchema.nullable(),
  gatewayId: IdSchema,
  principalId: IdSchema,
  agentId: IdSchema,
  runId: IdSchema,
  gatewayPolicyVersion: z.string().min(1),
  policyDecisionStatus: PolicyDecisionValueSchema,
  gatewayCheckStatus: GateDecisionSchema.nullable(),
  gatewayAdmissionStatus: GatewayAdmissionStatusSchema,
  gatewayCheckedAt: IsoDateSchema.nullable(),
  greenlightConsumptionStatus: ReceiptSchema.shape.greenlightConsumptionStatus,
  mutationAttemptStatus: ReceiptSchema.shape.mutationAttemptStatus,
  downstreamExecutionStatus: ReceiptSchema.shape.downstreamExecutionStatus,
  downstreamOutcomeStatus: DownstreamOutcomeStatusSchema,
  proofGapStatus: z.enum(["none", "present"]),
  proofGapIds: z.array(IdSchema).default([]),
  proofGapReasonCodes: z.array(ReasonCodeSchema).default([]),
  finalityStatus: ReceiptSchema.shape.finalityStatus,
  evidenceRefs: z.array(z.string()).default([]),
  streamOffsets: z.array(ReceiptStreamReferenceSchema).default([]),
  receiptDigest: DigestSchema,
  auditChainDigest: DigestSchema,
  signaturePosture: SignaturePostureSchema,
  keyIdentityRef: z.string().min(1).nullable(),
  verificationPolicyRef: z.string().min(1).nullable(),
  exportFormat: z.enum(["json", "redacted_json"]),
  redactionProfileRef: z.string().min(1),
  exportPurposeCode: z.string().min(1),
  requestedByRef: z.string().min(1),
  evidenceRetentionUntil: IsoDateSchema.nullable(),
  exportedAt: IsoDateSchema,
  exportDigest: DigestSchema,
  delegationProvenance: ReceiptDelegationProvenanceSchema.optional(),
});
export type ReceiptExport = z.infer<typeof ReceiptExportSchema>;
