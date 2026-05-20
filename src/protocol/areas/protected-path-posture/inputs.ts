import { z } from "zod";
import { CredentialCustodyStatusSchema } from "../catalog-envelope/schemas";
import { PostureSourceAuthoritySchema, ProtectedPathStateSchema, RawSiblingToolStatusSchema } from "./schemas";

export const CreateProtectedPathPostureInputSchema = z.strictObject({
  tenantId: z.string().min(1),
  organizationId: z.string().min(1),
  runtimeAdapterId: z.string().min(1),
  gatewayId: z.string().min(1),
  actionClass: z.string().min(1),
  resourceRef: z.string().min(1),
  protectedSurfaceKind: z.string().min(1),
  postureState: ProtectedPathStateSchema,
  credentialCustodyStatus: CredentialCustodyStatusSchema,
  rawSiblingToolStatus: RawSiblingToolStatusSchema,
  sourceAuthority: PostureSourceAuthoritySchema,
  reasonCodes: z.array(z.string().min(2)).default([]),
  evidenceRefs: z.array(z.string().min(1)).default([]),
  bypassProbeIds: z.array(z.string().min(1)).default([]),
  observedAt: z.string().datetime({ offset: true }).optional(),
  expiresAt: z.string().datetime({ offset: true }),
});
export type CreateProtectedPathPostureInput = z.input<typeof CreateProtectedPathPostureInputSchema>;
