import { z } from "zod";
import { DigestSchema, IdSchema, IsoDateSchema, ProtocolBaseSchema, ReasonCodeSchema, ResourceRefSchema } from "../schema-core";
import { CredentialCustodyStatusSchema } from "../catalog-envelope/schemas";

export const ProtectedPathStateSchema = z.enum([
  "gateway_checked",
  "advisory",
  "bypass_risk",
  "blind",
  "fixture_only",
]);
export type ProtectedPathState = z.infer<typeof ProtectedPathStateSchema>;

export const RawSiblingToolStatusSchema = z.enum(["absent", "blocked", "present", "unknown"]);
export type RawSiblingToolStatus = z.infer<typeof RawSiblingToolStatusSchema>;

export const PostureSourceAuthoritySchema = z.enum([
  "runtime_probe",
  "gateway_probe",
  "operator_attestation",
  "conformance_fixture",
  "hosted_monitor",
  "unknown",
]);
export type PostureSourceAuthority = z.infer<typeof PostureSourceAuthoritySchema>;

export const ProtectedPathPostureSchema = ProtocolBaseSchema.extend({
  protectedPathPostureId: IdSchema,
  postureScopeKey: z.string().min(1),
  runtimeAdapterId: IdSchema,
  gatewayId: IdSchema,
  actionClass: z.string().min(1),
  resourceRef: ResourceRefSchema,
  protectedSurfaceKind: z.string().min(1),
  postureState: ProtectedPathStateSchema,
  credentialCustodyStatus: CredentialCustodyStatusSchema,
  rawSiblingToolStatus: RawSiblingToolStatusSchema,
  sourceAuthority: PostureSourceAuthoritySchema,
  reasonCodes: z.array(ReasonCodeSchema).default([]),
  evidenceRefs: z.array(z.string().min(1)).default([]),
  observedAt: IsoDateSchema,
  expiresAt: IsoDateSchema,
  postureDigest: DigestSchema,
});
export type ProtectedPathPosture = z.infer<typeof ProtectedPathPostureSchema>;
