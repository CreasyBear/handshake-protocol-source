import { z } from "zod";
import { DigestSchema, IdSchema, IsoDateSchema, ProtocolBaseSchema, ReasonCodeSchema } from "../schema-core";

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
