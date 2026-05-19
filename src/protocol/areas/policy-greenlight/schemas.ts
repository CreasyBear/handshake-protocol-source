import { z } from "zod";
import {
  DigestSchema,
  IdSchema,
  IsoDateSchema,
  ProtocolBaseSchema,
  ReasonCodeSchema,
  ResourceRefSchema,
  SignatureSchema,
} from "../../foundation/schema-core";
import { RequiredProtectedPathStateSchema } from "../catalog-envelope/schemas";

export const PolicyDecisionValueSchema = z.enum(["greenlight", "refuse", "review_required", "halt", "quarantine"]);
export type PolicyDecisionValue = z.infer<typeof PolicyDecisionValueSchema>;

export const PolicyDecisionSchema = ProtocolBaseSchema.extend({
  policyDecisionId: IdSchema,
  actionContractId: IdSchema,
  envelopeId: IdSchema,
  policyPackRef: z.string().min(1),
  policyPackVersion: z.string().min(1),
  policyEvaluatorVersion: z.string().min(1),
  policyInputDigest: DigestSchema,
  decision: PolicyDecisionValueSchema,
  decisionReasonCode: ReasonCodeSchema,
  decisionReason: z.string().min(1).max(1000),
  matchedRuleIds: z.array(z.string()).default([]),
  requiredReceipt: z.enum(["none", "gate", "mutation", "downstream_finality"]),
  isolationSnapshotRef: z.string().min(1),
  expiresAt: IsoDateSchema,
  decisionSignature: SignatureSchema.nullable(),
});
export type PolicyDecision = z.infer<typeof PolicyDecisionSchema>;

export const GreenlightSchema = ProtocolBaseSchema.extend({
  greenlightId: IdSchema,
  actionContractId: IdSchema,
  policyDecisionId: IdSchema,
  gatewayRegistryEntryId: IdSchema,
  gatewayRegistryVersion: z.string().min(1),
  gatewayId: IdSchema,
  gatewayPolicyVersion: z.string().min(1),
  actionClass: z.string().min(1),
  resourceRef: ResourceRefSchema,
  requiredProtectedPathState: RequiredProtectedPathStateSchema,
  protectedPathPostureId: IdSchema.nullable(),
  protectedPathPostureDigest: DigestSchema.nullable(),
  paramsDigest: DigestSchema,
  contractDigest: DigestSchema,
  maxUses: z.literal(1),
  issuedAt: IsoDateSchema,
  notBefore: IsoDateSchema,
  expiresAt: IsoDateSchema,
  isolationSnapshotRef: z.string().min(1),
  requiredReceipt: z.enum(["none", "gate", "mutation", "downstream_finality"]),
  decisionSignature: SignatureSchema.nullable(),
  consumedAt: IsoDateSchema.nullable(),
  consumedByGateAttemptId: IdSchema.nullable(),
});
export type Greenlight = z.infer<typeof GreenlightSchema>;
