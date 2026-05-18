import { z } from "zod";
import { DigestSchema, IdSchema, IsoDateSchema, ProtocolBaseSchema } from "./schema-core";

export const TransitionRequestContextSchema = ProtocolBaseSchema.extend({
  transitionRequestContextId: IdSchema,
  protocolVersionSeen: z.string().min(1).max(40),
  requestIdentity: z.string().min(1).max(200),
  originatingIdentityDigest: DigestSchema.nullable(),
  originatingIdentityRef: z.string().min(1).max(500).nullable(),
  callerCustodyRole: z.enum(["control_plane", "runtime_evidence", "gateway_custody", "review_custody"]),
  transitionName: z.string().min(1).max(160),
  routePattern: z.string().min(1).max(200),
  requestDigest: DigestSchema,
  acceptedAt: IsoDateSchema,
  requestContextDigest: DigestSchema,
});
export type TransitionRequestContext = z.infer<typeof TransitionRequestContextSchema>;
