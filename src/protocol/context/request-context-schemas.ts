import { z } from "zod";
import { DigestSchema, IdSchema, IsoDateSchema, ProtocolBaseSchema } from "../foundation/schema-core";

export const TransitionRequestContextSchema = ProtocolBaseSchema.extend({
  transitionRequestContextId: IdSchema,
  protocolVersionSeen: z.string().min(1).max(40),
  requestIdentity: z.string().min(1).max(200),
  originatingIdentityDigest: DigestSchema.nullable(),
  originatingIdentityRef: z.string().min(1).max(500).nullable(),
  callerCustodyRole: z.enum(["control_plane", "runtime_evidence", "gateway_custody", "review_custody"]),
  callerIdentityRef: z.string().min(1).max(500).nullable().default(null),
  callerSubjectDigest: DigestSchema.nullable().default(null),
  callerTenantId: IdSchema.nullable().default(null),
  callerOrganizationId: IdSchema.nullable().default(null),
  callerIdentityClaimsDigest: DigestSchema.nullable().default(null),
  authProviderRef: z.string().min(1).max(500).nullable().default(null),
  authSessionDigest: DigestSchema.nullable().default(null),
  serviceCredentialDigest: DigestSchema.nullable().default(null),
  revocationEpochRef: z.string().min(1).max(500).nullable().default(null),
  callerIdentityIssuedAt: IsoDateSchema.nullable().default(null),
  callerIdentityExpiresAt: IsoDateSchema.nullable().default(null),
  transitionName: z.string().min(1).max(160),
  routePattern: z.string().min(1).max(200),
  requestDigest: DigestSchema,
  acceptedAt: IsoDateSchema,
  requestContextDigest: DigestSchema,
});
export type TransitionRequestContext = z.infer<typeof TransitionRequestContextSchema>;
