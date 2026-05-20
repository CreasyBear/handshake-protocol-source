import { z } from "zod";
import {
  DigestSchema,
  IdSchema,
  IsoDateSchema,
  ProtocolBaseSchema,
  ReasonCodeSchema,
  ResourceRefSchema,
} from "../../foundation/schema-core";
import { CredentialCustodyStatusSchema } from "../catalog-envelope/schemas";

export const ProtectedPathStateSchema = z.enum(["gateway_checked", "advisory", "bypass_risk", "blind", "fixture_only"]);
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

export const ProtectedPathBypassProbeCoverageSchema = z.strictObject({
  bypassProbeId: IdSchema,
  probeKind: z.enum([
    "credential_custody",
    "raw_sibling_blocking",
    "mcp_direct_call_blocking",
    "token_passthrough_blocking",
    "wrapper_drift",
    "failure_closed",
  ]),
  probeOutcome: z.enum(["passed", "failed", "inconclusive"]),
  sourceAuthority: PostureSourceAuthoritySchema,
  probeDigest: DigestSchema,
});
export type ProtectedPathBypassProbeCoverage = z.infer<typeof ProtectedPathBypassProbeCoverageSchema>;

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
  bypassProbeIds: z.array(IdSchema).default([]),
  bypassProbeDigests: z.array(DigestSchema).default([]),
  bypassProbeCoverage: z.array(ProtectedPathBypassProbeCoverageSchema).default([]),
  observedAt: IsoDateSchema,
  expiresAt: IsoDateSchema,
  postureDigest: DigestSchema,
});
export type ProtectedPathPosture = z.infer<typeof ProtectedPathPostureSchema>;
