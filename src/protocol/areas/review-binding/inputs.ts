import { z } from "zod";
import { DigestSchema } from "../../foundation/schema-core";

export const CreateReviewArtifactInputSchema = z.strictObject({
  actionContractId: z.string().min(1),
  policyDecisionId: z.string().min(1),
  reviewArtifactRef: z.string().min(1),
  reviewRenderSchemaVersion: z.string().min(1),
  rendererRef: z.string().min(1),
  renderedContractDigest: DigestSchema,
  renderedPolicyInputDigest: DigestSchema,
  renderedUncertaintyDigest: DigestSchema,
  renderedArtifactDigest: DigestSchema,
  catalogDigest: DigestSchema.nullable().default(null),
  rendererDigest: DigestSchema.nullable().default(null),
  actionBindingDigest: DigestSchema.nullable().default(null),
  hiddenActionPosture: z.enum(["no_hidden_actions_detected", "hidden_action_risk", "unknown"]).default("unknown"),
  secondaryActionPosture: z
    .enum(["no_secondary_actions_detected", "secondary_action_risk", "unknown"])
    .default("unknown"),
  uncertaintyMarkers: z.array(z.string().min(1)).default([]),
  evidenceRefs: z.array(z.string().min(1)).default([]),
});
export type CreateReviewArtifactInput = z.input<typeof CreateReviewArtifactInputSchema>;

export const CreateReviewDecisionInputSchema = z.strictObject({
  actionContractId: z.string().min(1),
  policyDecisionId: z.string().min(1),
  reviewArtifactId: z.string().min(1),
  reviewArtifactDigest: DigestSchema,
  reviewerPrincipalId: z.string().min(1),
  decision: z.enum(["approve", "reject", "needs_changes"]),
  decisionReasonCode: z.string().min(2),
  decisionExpiresAt: z.string().datetime({ offset: true }),
  signatureOrAttestationRef: z.string().min(1),
});
export type CreateReviewDecisionInput = z.input<typeof CreateReviewDecisionInputSchema>;
