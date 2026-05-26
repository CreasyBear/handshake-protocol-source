import { z } from "zod";
import {
  ClearingEvidenceRefsSchema,
  DigestSchema,
  IdSchema,
  IsoDateSchema,
  ProtocolBaseSchema,
  ReasonCodeSchema,
  ResourceRefSchema,
} from "../../foundation/schema-core";

export const NegotiationPartyIdentityProofPostureSchema = z.enum([
  "self_attested",
  "host_verified_ref",
  "proof_gap_recorded",
]);
export type NegotiationPartyIdentityProofPosture = z.infer<typeof NegotiationPartyIdentityProofPostureSchema>;

export const NegotiationPartyBindingSchema = z
  .strictObject({
    partyId: IdSchema,
    partyRole: z.enum(["initiator", "counterparty", "observer"]),
    agentRef: ResourceRefSchema,
    organizationRef: ResourceRefSchema.nullable().default(null),
    runtimeRef: ResourceRefSchema.nullable().default(null),
    endpointRef: ResourceRefSchema.nullable().default(null),
    identityProofPosture: NegotiationPartyIdentityProofPostureSchema,
    identityEvidenceRefs: z.array(ResourceRefSchema).default([]),
    identityProofDigest: DigestSchema.nullable().default(null),
    proofGapRefs: z.array(ResourceRefSchema).default([]),
  })
  .superRefine((value, ctx) => {
    if (value.identityProofPosture === "host_verified_ref" && value.identityEvidenceRefs.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "host verified parties require local identity evidence refs",
        path: ["identityEvidenceRefs"],
      });
    }
    if (value.identityProofPosture === "proof_gap_recorded" && value.proofGapRefs.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "proof-gap parties require proof gap refs",
        path: ["proofGapRefs"],
      });
    }
  });
export type NegotiationPartyBinding = z.infer<typeof NegotiationPartyBindingSchema>;

export const ExternalProtocolEvidenceRefSchema = z.strictObject({
  protocol: z.enum(["a2a", "acp", "anp", "ap2", "mcp", "runtime_handoff", "other"]),
  protocolVersion: z.string().min(1).max(80),
  objectKind: z.string().min(1).max(120),
  objectRef: ResourceRefSchema,
  objectDigest: DigestSchema,
  evidencePosture: z.literal("imported_evidence_only"),
  evidenceUse: z.enum([
    "conversation_context",
    "descriptor_context",
    "runtime_context",
    "mandate_context_evidence",
    "tool_context",
    "handoff_context",
    "other_context",
  ]),
  proofGapRefs: z.array(ResourceRefSchema).default([]),
});
export type ExternalProtocolEvidenceRef = z.infer<typeof ExternalProtocolEvidenceRefSchema>;

const OfferVersionRefSchema = IdSchema.refine((value) => !["latest", "current", "unspecified"].includes(value), {
  message: "decisions must bind to a specific offer version",
});

const disallowedObligationRefPattern = new RegExp(
  [
    "greenlight",
    "gateway[_:-]?check",
    "mutation[_:-]?attempt",
    "receipt",
    "authority[_:-]?certificate",
    "settlement",
    "payment",
    "signer",
    "reusable[_:-]?authority",
  ].join("|"),
  "i",
);

const EvidenceRefSchema = z.strictObject({
  refKind: z.enum(["candidate_action", "action_contract", "intent_compilation", "generated_execution_graph"]),
  ref: ResourceRefSchema.refine((value) => !disallowedObligationRefPattern.test(value), {
    message: "obligation evidence ref cannot point at a control or terminal artifact",
  }),
  digest: DigestSchema.nullable().default(null),
});

export const NegotiationSessionSchema = ProtocolBaseSchema.extend({
  negotiationSessionId: IdSchema,
  negotiationSessionDigest: DigestSchema,
  subjectResourceRef: ResourceRefSchema,
  subjectProtectedActionContextRefs: z.array(ResourceRefSchema).default([]),
  runtimePosture: z.enum(["declared_runtime_context", "observed_runtime_evidence", "proof_gap_recorded"]),
  parties: z.array(NegotiationPartyBindingSchema).min(1),
  generatedCodeOrSpecRefs: z.array(ResourceRefSchema).default([]),
  declaredAssumptions: z.array(z.string().min(1).max(500)).default([]),
  uncertaintyMarkers: z.array(z.string().min(1).max(500)).default([]),
  externalProtocolEvidenceRefs: z.array(ExternalProtocolEvidenceRefSchema).default([]),
  clearingEvidenceRefs: ClearingEvidenceRefsSchema,
  expiresAt: IsoDateSchema.nullable().default(null),
});
export type NegotiationSession = z.infer<typeof NegotiationSessionSchema>;

export const NegotiationOfferSchema = ProtocolBaseSchema.extend({
  negotiationOfferId: IdSchema,
  negotiationSessionId: IdSchema,
  offerVersionId: OfferVersionRefSchema,
  offerSequence: z.number().int().positive(),
  offeredByPartyId: IdSchema,
  previousOfferVersionId: OfferVersionRefSchema.nullable().default(null),
  supersedesOfferVersionId: OfferVersionRefSchema.nullable().default(null),
  offerContentDigest: DigestSchema,
  offerObjectRefs: z.array(ResourceRefSchema).default([]),
  offerContentRefs: z.array(ResourceRefSchema).default([]),
  proofGapRefs: z.array(ResourceRefSchema).default([]),
  externalProtocolEvidenceRefs: z.array(ExternalProtocolEvidenceRefSchema).default([]),
  generatedCodeOrSpecRefs: z.array(ResourceRefSchema).default([]),
  declaredAssumptions: z.array(z.string().min(1).max(500)).default([]),
  uncertaintyMarkers: z.array(z.string().min(1).max(500)).default([]),
  clearingEvidenceRefs: ClearingEvidenceRefsSchema,
  expiresAt: IsoDateSchema.nullable().default(null),
}).superRefine(requireReconstructionRefs("offer"));
export type NegotiationOffer = z.infer<typeof NegotiationOfferSchema>;

export const NegotiationDecisionSchema = ProtocolBaseSchema.extend({
  negotiationDecisionId: IdSchema,
  negotiationSessionId: IdSchema,
  decidedOfferVersionId: OfferVersionRefSchema,
  decidedOfferSequence: z.number().int().positive(),
  decidedByPartyId: IdSchema,
  decision: z.enum(["accept", "reject", "counter", "withdraw", "expire"]),
  reasonCodes: z.array(ReasonCodeSchema).default([]),
  evidenceRefs: z.array(ResourceRefSchema).default([]),
  proofGapRefs: z.array(ResourceRefSchema).default([]),
  counterOfferVersionId: OfferVersionRefSchema.nullable().default(null),
  decisionDigest: DigestSchema,
});
export type NegotiationDecision = z.infer<typeof NegotiationDecisionSchema>;

export const LinkedAgreementSchema = ProtocolBaseSchema.extend({
  linkedAgreementId: IdSchema,
  negotiationSessionId: IdSchema,
  acceptedOfferVersionId: OfferVersionRefSchema,
  acceptedOfferSequence: z.number().int().positive(),
  agreementDigest: DigestSchema,
  agreementObjectRefs: z.array(ResourceRefSchema).default([]),
  agreementContentRefs: z.array(ResourceRefSchema).default([]),
  proofGapRefs: z.array(ResourceRefSchema).default([]),
  agreementEvidencePosture: z.literal("local_evidence_only"),
  clearingEvidenceRefs: ClearingEvidenceRefsSchema,
  externalProtocolEvidenceRefs: z.array(ExternalProtocolEvidenceRefSchema).default([]),
}).superRefine(requireReconstructionRefs("agreement"));
export type LinkedAgreement = z.infer<typeof LinkedAgreementSchema>;

export const AgreementObligationBindingSchema = ProtocolBaseSchema.extend({
  agreementObligationBindingId: IdSchema,
  linkedAgreementId: IdSchema,
  negotiationSessionId: IdSchema,
  obligationRef: ResourceRefSchema.refine((value) => !disallowedObligationRefPattern.test(value), {
    message: "obligation ref cannot point at a control or terminal artifact",
  }),
  obligationDigest: DigestSchema.nullable().default(null),
  bindingPosture: z.literal("local_evidence_only"),
  localProtectedActionEvidenceRefs: z.array(EvidenceRefSchema).min(1),
  evidenceRefs: z.array(ResourceRefSchema).default([]),
  proofGapRefs: z.array(ResourceRefSchema).default([]),
});
export type AgreementObligationBinding = z.infer<typeof AgreementObligationBindingSchema>;

export const AgreementStatusTransitionSchema = ProtocolBaseSchema.extend({
  agreementStatusTransitionId: IdSchema,
  linkedAgreementId: IdSchema,
  negotiationSessionId: IdSchema,
  fromStatus: z.enum(["proposed", "active", "superseded", "expired", "disputed", "resolved", "withdrawn"]),
  toStatus: z.enum(["active", "superseded", "expired", "disputed", "resolved", "withdrawn"]),
  reasonCodes: z.array(ReasonCodeSchema).default([]),
  evidenceRefs: z.array(ResourceRefSchema).default([]),
  proofGapRefs: z.array(ResourceRefSchema).default([]),
  transitionDigest: DigestSchema,
});
export type AgreementStatusTransition = z.infer<typeof AgreementStatusTransitionSchema>;

function requireReconstructionRefs(kind: "offer" | "agreement") {
  return (
    value:
      | Pick<NegotiationOffer, "offerObjectRefs" | "offerContentRefs" | "proofGapRefs">
      | Pick<LinkedAgreement, "agreementObjectRefs" | "agreementContentRefs" | "proofGapRefs">,
    ctx: z.RefinementCtx,
  ): void => {
    const objectRefs =
      kind === "offer"
        ? (value as Pick<NegotiationOffer, "offerObjectRefs">).offerObjectRefs
        : (value as Pick<LinkedAgreement, "agreementObjectRefs">).agreementObjectRefs;
    const contentRefs =
      kind === "offer"
        ? (value as Pick<NegotiationOffer, "offerContentRefs">).offerContentRefs
        : (value as Pick<LinkedAgreement, "agreementContentRefs">).agreementContentRefs;
    if (objectRefs.length > 0 || contentRefs.length > 0 || value.proofGapRefs.length > 0) return;
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `${kind} digest requires object refs, content refs, or proof gap refs`,
      path: kind === "offer" ? ["offerObjectRefs"] : ["agreementObjectRefs"],
    });
  };
}
