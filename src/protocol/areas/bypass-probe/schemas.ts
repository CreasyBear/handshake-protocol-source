import { z } from "zod";
import {
  DigestSchema,
  IdSchema,
  IsoDateSchema,
  ProtocolBaseSchema,
  ReasonCodeSchema,
  ResourceRefSchema,
} from "../../foundation/schema-core";
import { PostureSourceAuthoritySchema } from "../protected-path-posture/schemas";

export const BypassProbeKindSchema = z.enum([
  "credential_custody",
  "raw_sibling_blocking",
  "mcp_direct_call_blocking",
  "token_passthrough_blocking",
  "wrapper_drift",
  "failure_closed",
]);
export type BypassProbeKind = z.infer<typeof BypassProbeKindSchema>;

export const BypassProbeOutcomeSchema = z.enum(["passed", "failed", "inconclusive"]);
export type BypassProbeOutcome = z.infer<typeof BypassProbeOutcomeSchema>;

export const BypassProbeSchema = ProtocolBaseSchema.extend({
  bypassProbeId: IdSchema,
  postureScopeKey: z.string().min(1),
  runtimeAdapterId: IdSchema,
  gatewayId: IdSchema,
  actionClass: z.string().min(1),
  resourceRef: ResourceRefSchema,
  protectedSurfaceKind: z.string().min(1),
  probeKind: BypassProbeKindSchema,
  probeOutcome: BypassProbeOutcomeSchema,
  sourceAuthority: PostureSourceAuthoritySchema,
  reasonCodes: z.array(ReasonCodeSchema).default([]),
  evidenceRefs: z.array(z.string().min(1)).default([]),
  observedAt: IsoDateSchema,
  expiresAt: IsoDateSchema,
  probeDigest: DigestSchema,
});
export type BypassProbe = z.infer<typeof BypassProbeSchema>;

export const requiredGatewayCheckedBypassProbeKinds = BypassProbeKindSchema.options;
