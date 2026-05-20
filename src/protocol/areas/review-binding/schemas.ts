import { z } from "zod";
import {
  DigestSchema,
  IdSchema,
  IsoDateSchema,
  ProtocolBaseSchema,
  ReasonCodeSchema,
} from "../../foundation/schema-core";

export const ReviewHiddenActionPostureSchema = z.enum(["no_hidden_actions_detected", "hidden_action_risk", "unknown"]);
export const ReviewSecondaryActionPostureSchema = z.enum([
  "no_secondary_actions_detected",
  "secondary_action_risk",
  "unknown",
]);

export const ReviewArtifactRecordSchema = ProtocolBaseSchema.extend({
  reviewArtifactId: IdSchema,
  reviewArtifactRef: z.string().min(1),
  reviewRenderSchemaVersion: z.string().min(1),
  rendererRef: z.string().min(1),
  actionContractId: IdSchema,
  actionContractDigest: DigestSchema,
  policyDecisionId: IdSchema,
  policyInputDigest: DigestSchema,
  gatewayPolicyVersion: z.string().min(1),
  renderedContractDigest: DigestSchema,
  renderedPolicyInputDigest: DigestSchema,
  renderedUncertaintyDigest: DigestSchema,
  renderedArtifactDigest: DigestSchema,
  catalogDigest: DigestSchema.nullable().default(null),
  rendererDigest: DigestSchema.nullable().default(null),
  actionBindingDigest: DigestSchema.nullable().default(null),
  hiddenActionPosture: ReviewHiddenActionPostureSchema.default("unknown"),
  secondaryActionPosture: ReviewSecondaryActionPostureSchema.default("unknown"),
  uncertaintyMarkers: z.array(z.string().min(1)).default([]),
  evidenceRefs: z.array(z.string().min(1)).default([]),
  reviewArtifactDigest: DigestSchema,
});
export type ReviewArtifactRecord = z.infer<typeof ReviewArtifactRecordSchema>;

export const ReviewDecisionSchema = ProtocolBaseSchema.extend({
  reviewDecisionId: IdSchema,
  reviewArtifactId: IdSchema,
  reviewArtifactRef: z.string().min(1),
  reviewArtifactDigest: DigestSchema,
  reviewRenderSchemaVersion: z.string().min(1),
  reviewerPrincipalId: IdSchema,
  actionContractId: IdSchema,
  actionContractDigest: DigestSchema,
  policyInputDigest: DigestSchema,
  gatewayPolicyVersion: z.string().min(1),
  decision: z.enum(["approve", "reject", "needs_changes"]),
  decisionReasonCode: ReasonCodeSchema,
  decisionExpiresAt: IsoDateSchema,
  signatureOrAttestationRef: z.string().min(1),
});
export type ReviewDecision = z.infer<typeof ReviewDecisionSchema>;
