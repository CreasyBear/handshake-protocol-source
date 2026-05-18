import { z } from "zod";
import { DigestSchema } from "../schema-core";

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
