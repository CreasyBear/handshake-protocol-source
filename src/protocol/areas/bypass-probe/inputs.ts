import { z } from "zod";
import { BypassProbeKindSchema, BypassProbeOutcomeSchema } from "./schemas";
import { PostureSourceAuthoritySchema } from "../protected-path-posture/schemas";

export const CreateBypassProbeInputSchema = z.strictObject({
  tenantId: z.string().min(1),
  organizationId: z.string().min(1),
  runtimeAdapterId: z.string().min(1),
  gatewayId: z.string().min(1),
  actionClass: z.string().min(1),
  resourceRef: z.string().min(1),
  protectedSurfaceKind: z.string().min(1),
  probeKind: BypassProbeKindSchema,
  probeOutcome: BypassProbeOutcomeSchema,
  sourceAuthority: PostureSourceAuthoritySchema,
  reasonCodes: z.array(z.string().min(2)).default([]),
  evidenceRefs: z.array(z.string().min(1)).default([]),
  observedAt: z.string().datetime({ offset: true }).optional(),
  expiresAt: z.string().datetime({ offset: true }),
});
export type CreateBypassProbeInput = z.input<typeof CreateBypassProbeInputSchema>;
