import { describe, expect, it } from "bun:test";
import {
  AgreementObligationBindingSchema,
  AgreementStatusTransitionSchema,
  ExternalProtocolEvidenceRefSchema,
  LinkedAgreementSchema,
  NegotiationDecisionSchema,
  NegotiationOfferSchema,
  NegotiationSessionSchema,
  NegotiationPartyBindingSchema,
} from "../../src/protocol/areas/negotiation";

const digest = `sha256:${"a".repeat(64)}`;
const otherDigest = `sha256:${"b".repeat(64)}`;
const now = "2026-05-26T00:00:00.000Z";
const later = "2026-05-27T00:00:00.000Z";

const base = {
  schemaVersion: "0.2.4",
  tenantId: "tenant_demo",
  organizationId: "org_demo",
  createdAt: now,
} as const;

describe("negotiation evidence schemas", () => {
  it("parses a strict NegotiationSession with explicit party proof posture and imported external evidence", () => {
    expect(NegotiationSessionSchema.parse(validSession())).toMatchObject({
      negotiationSessionId: "negotiation_session_demo",
      parties: [
        { partyId: "party_initiator", identityProofPosture: "host_verified_ref" },
        { partyId: "party_counterparty", identityProofPosture: "proof_gap_recorded" },
      ],
      externalProtocolEvidenceRefs: [{ evidencePosture: "imported_evidence_only" }],
    });
  });

  it("requires verified party identity claims to carry evidence refs", () => {
    expect(
      NegotiationPartyBindingSchema.safeParse({
        partyId: "party_counterparty",
        partyRole: "counterparty",
        agentRef: "agent:remote",
        identityProofPosture: "host_verified_ref",
        identityEvidenceRefs: [],
        identityProofDigest: null,
        proofGapRefs: [],
      }).success,
    ).toBe(false);
  });

  it("requires proof-gap party posture to name proof gap refs", () => {
    const party = validSession().parties[1];
    expect(NegotiationPartyBindingSchema.safeParse({ ...party, proofGapRefs: [] }).success).toBe(false);
  });

  it("requires sessions to carry both initiator and counterparty evidence", () => {
    expect(
      NegotiationSessionSchema.safeParse({ ...validSession(), parties: [validSession().parties[0]] }).success,
    ).toBe(false);
    expect(
      NegotiationSessionSchema.safeParse({
        ...validSession(),
        parties: [validSession().parties[0], { ...validSession().parties[1], partyRole: "observer" }],
      }).success,
    ).toBe(false);
  });

  it("rejects raw transcript or raw-readable term fields on negotiation sessions", () => {
    expect(
      NegotiationSessionSchema.safeParse({
        ...validSession(),
        rawTranscript: "agent A accepted everything",
      }).success,
    ).toBe(false);
  });

  it.each(["greenlight:demo", "gate_attempt:demo", "gateway_check:demo", "receipt:demo", "policy_decision:demo"])(
    "rejects authority-shaped protected-action context refs: %s",
    (contextRef) => {
      expect(
        NegotiationSessionSchema.safeParse({
          ...validSession(),
          subjectProtectedActionContextRefs: [contextRef],
        }).success,
      ).toBe(false);
    },
  );

  it("parses offers only when content digests have refs or proof-gap refs", () => {
    expect(NegotiationOfferSchema.parse(validOffer())).toMatchObject({
      negotiationOfferId: "negotiation_offer_v1",
      offerSequence: 1,
      offerContentDigest: digest,
      offerObjectRefs: ["object:offer:v1"],
    });

    expect(
      NegotiationOfferSchema.safeParse({
        ...validOffer(),
        offerObjectRefs: [],
        offerContentRefs: [],
        proofGapRefs: [],
      }).success,
    ).toBe(false);
  });

  it("tracks offer sequence and supersession refs without treating raw terms as evidence", () => {
    const counterOffer = {
      ...validOffer(),
      negotiationOfferId: "negotiation_offer_v2",
      offerVersionId: "offer_version_2",
      offerSequence: 2,
      previousOfferVersionId: "offer_version_1",
      supersedesOfferVersionId: "offer_version_1",
    };

    expect(NegotiationOfferSchema.parse(counterOffer)).toMatchObject({
      offerSequence: 2,
      previousOfferVersionId: "offer_version_1",
      supersedesOfferVersionId: "offer_version_1",
    });
    expect(NegotiationOfferSchema.safeParse({ ...counterOffer, rawTerms: "pay me later" }).success).toBe(false);
  });

  it("requires decisions to point at one specific offer version", () => {
    expect(NegotiationDecisionSchema.parse(validDecision())).toMatchObject({
      decision: "accept",
      decidedOfferVersionId: "offer_version_1",
      decidedOfferSequence: 1,
    });

    expect(
      NegotiationDecisionSchema.safeParse({
        ...validDecision(),
        decidedOfferVersionId: "latest",
      }).success,
    ).toBe(false);
  });

  it.each(["latest", "Latest", "offer:latest", "offer_current", "offer-unspecified"])(
    "rejects non-specific offer version refs: %s",
    (offerVersionRef) => {
      expect(
        NegotiationDecisionSchema.safeParse({
          ...validDecision(),
          decidedOfferVersionId: offerVersionRef,
        }).success,
      ).toBe(false);
      expect(
        NegotiationOfferSchema.safeParse({
          ...validOffer(),
          offerVersionId: offerVersionRef,
        }).success,
      ).toBe(false);
      expect(
        LinkedAgreementSchema.safeParse({
          ...validAgreement(),
          acceptedOfferVersionId: offerVersionRef,
        }).success,
      ).toBe(false);
    },
  );

  it("requires counter decisions to bind a specific counter-offer version", () => {
    expect(NegotiationDecisionSchema.safeParse({ ...validDecision(), decision: "counter" }).success).toBe(false);
    expect(
      NegotiationDecisionSchema.parse({
        ...validDecision(),
        decision: "counter",
        counterOfferVersionId: "offer_version_2",
      }),
    ).toMatchObject({
      decision: "counter",
      counterOfferVersionId: "offer_version_2",
    });
    expect(
      NegotiationDecisionSchema.safeParse({
        ...validDecision(),
        decision: "accept",
        counterOfferVersionId: "offer_version_2",
      }).success,
    ).toBe(false);
  });

  it("parses linked agreement evidence without accepting receipt or certificate fields", () => {
    expect(LinkedAgreementSchema.parse(validAgreement())).toMatchObject({
      linkedAgreementId: "linked_agreement_demo",
      acceptedOfferVersionId: "offer_version_1",
      agreementEvidencePosture: "local_evidence_only",
    });

    expect(
      LinkedAgreementSchema.safeParse({
        ...validAgreement(),
        receiptId: "receipt_demo",
      }).success,
    ).toBe(false);
  });

  it("requires agreement content digests to have object/content refs or proof-gap refs", () => {
    expect(
      LinkedAgreementSchema.safeParse({
        ...validAgreement(),
        agreementObjectRefs: [],
        agreementContentRefs: [],
        proofGapRefs: [],
      }).success,
    ).toBe(false);
  });

  it("keeps obligation bindings local evidence only", () => {
    expect(AgreementObligationBindingSchema.parse(validObligationBinding())).toMatchObject({
      agreementObligationBindingId: "agreement_obligation_binding_demo",
      bindingPosture: "local_evidence_only",
      localProtectedActionEvidenceRefs: [{ refKind: "action_contract" }],
    });
  });

  it.each([
    "greenlight",
    "gateway_check",
    "gate_attempt",
    "mutation_attempt",
    "policy_decision",
    "receipt",
    "authority_certificate",
    "settlement",
    "payment",
    "signer",
    "reusable_authority",
  ])("rejects authority-shaped obligation refs: %s", (forbiddenKind) => {
    expect(
      AgreementObligationBindingSchema.safeParse({
        ...validObligationBinding(),
        obligationRef: `${forbiddenKind}:demo`,
      }).success,
    ).toBe(false);
    expect(
      AgreementObligationBindingSchema.safeParse({
        ...validObligationBinding(),
        localProtectedActionEvidenceRefs: [
          {
            refKind: "action_contract",
            ref: `${forbiddenKind}:demo`,
            digest,
          },
        ],
      }).success,
    ).toBe(false);
  });

  it("parses agreement status transitions as evidence-only lifecycle records", () => {
    expect(AgreementStatusTransitionSchema.parse(validStatusTransition())).toMatchObject({
      agreementStatusTransitionId: "agreement_status_transition_demo",
      fromStatus: "active",
      toStatus: "disputed",
    });
    expect(
      AgreementStatusTransitionSchema.safeParse({
        ...validStatusTransition(),
        toStatus: validStatusTransition().fromStatus,
      }).success,
    ).toBe(false);
  });

  it("keeps external protocol refs digest-bound and imported evidence only", () => {
    expect(ExternalProtocolEvidenceRefSchema.parse(validExternalRef())).toMatchObject({
      protocol: "a2a",
      objectKind: "Task",
      evidencePosture: "imported_evidence_only",
    });

    expect(
      ExternalProtocolEvidenceRefSchema.safeParse({
        ...validExternalRef(),
        evidencePosture: "authorization",
      }).success,
    ).toBe(false);
  });

  it.each(["authorization", "identity_proof", "execution_proof", "settlement", "payment", "receipt", "certificate"])(
    "rejects external refs represented as %s",
    (evidenceUse) => {
      expect(
        ExternalProtocolEvidenceRefSchema.safeParse({
          ...validExternalRef(),
          evidenceUse,
        }).success,
      ).toBe(false);
    },
  );

  it.each(["AgentCard", "Task", "Run", "Thread", "Mandate", "Receipt", "tool_call", "handoff"])(
    "accepts %s only as imported context evidence",
    (objectKind) => {
      expect(
        ExternalProtocolEvidenceRefSchema.parse({
          ...validExternalRef(),
          objectKind,
          evidenceUse: "conversation_context",
        }),
      ).toMatchObject({ objectKind, evidencePosture: "imported_evidence_only" });
    },
  );
});

function validSession() {
  return {
    ...base,
    negotiationSessionId: "negotiation_session_demo",
    negotiationSessionDigest: digest,
    subjectResourceRef: "resource:repo:demo",
    subjectProtectedActionContextRefs: ["candidate_action:candidate_demo"],
    runtimePosture: "declared_runtime_context",
    parties: [
      {
        partyId: "party_initiator",
        partyRole: "initiator",
        agentRef: "agent:local",
        organizationRef: "org:local",
        runtimeRef: "runtime:codex",
        endpointRef: null,
        identityProofPosture: "host_verified_ref",
        identityEvidenceRefs: ["identity-evidence:local"],
        identityProofDigest: digest,
        proofGapRefs: [],
      },
      {
        partyId: "party_counterparty",
        partyRole: "counterparty",
        agentRef: "agent:remote",
        organizationRef: null,
        runtimeRef: "runtime:a2a",
        endpointRef: "https://agent.example.test",
        identityProofPosture: "proof_gap_recorded",
        identityEvidenceRefs: [],
        identityProofDigest: null,
        proofGapRefs: ["proof_gap:counterparty_identity"],
      },
    ],
    generatedCodeOrSpecRefs: ["generated_graph:demo"],
    declaredAssumptions: ["counterparty endpoint was supplied by runtime evidence"],
    uncertaintyMarkers: ["counterparty identity is not locally verified"],
    externalProtocolEvidenceRefs: [validExternalRef()],
    clearingEvidenceRefs: { correlationRef: "a2a:task:demo" },
    expiresAt: later,
  };
}

function validExternalRef() {
  return {
    protocol: "a2a",
    protocolVersion: "0.3.0",
    objectKind: "Task",
    objectRef: "a2a:task:demo",
    objectDigest: digest,
    evidencePosture: "imported_evidence_only",
    evidenceUse: "conversation_context",
    proofGapRefs: [],
  };
}

function validOffer() {
  return {
    ...base,
    negotiationOfferId: "negotiation_offer_v1",
    negotiationSessionId: "negotiation_session_demo",
    offerVersionId: "offer_version_1",
    offerSequence: 1,
    offeredByPartyId: "party_initiator",
    previousOfferVersionId: null,
    supersedesOfferVersionId: null,
    offerContentDigest: digest,
    offerObjectRefs: ["object:offer:v1"],
    offerContentRefs: ["content:offer:v1"],
    proofGapRefs: [],
    externalProtocolEvidenceRefs: [validExternalRef()],
    generatedCodeOrSpecRefs: ["generated_graph:demo"],
    declaredAssumptions: ["offer was generated from local planning evidence"],
    uncertaintyMarkers: [],
    clearingEvidenceRefs: { obligationRef: "obligation:demo" },
    expiresAt: later,
  };
}

function validDecision() {
  return {
    ...base,
    negotiationDecisionId: "negotiation_decision_demo",
    negotiationSessionId: "negotiation_session_demo",
    decidedOfferVersionId: "offer_version_1",
    decidedOfferSequence: 1,
    decidedByPartyId: "party_counterparty",
    decision: "accept",
    reasonCodes: ["offer_terms_accepted"],
    evidenceRefs: ["evidence:decision"],
    proofGapRefs: [],
    counterOfferVersionId: null,
    decisionDigest: digest,
  };
}

function validAgreement() {
  return {
    ...base,
    linkedAgreementId: "linked_agreement_demo",
    negotiationSessionId: "negotiation_session_demo",
    acceptedOfferVersionId: "offer_version_1",
    acceptedOfferSequence: 1,
    agreementDigest: digest,
    agreementObjectRefs: ["object:agreement:v1"],
    agreementContentRefs: ["content:agreement:v1"],
    proofGapRefs: [],
    agreementEvidencePosture: "local_evidence_only",
    clearingEvidenceRefs: { correlationRef: "agreement:demo" },
    externalProtocolEvidenceRefs: [validExternalRef()],
  };
}

function validObligationBinding() {
  return {
    ...base,
    agreementObligationBindingId: "agreement_obligation_binding_demo",
    linkedAgreementId: "linked_agreement_demo",
    negotiationSessionId: "negotiation_session_demo",
    obligationRef: "obligation:local-protected-action",
    obligationDigest: otherDigest,
    bindingPosture: "local_evidence_only",
    localProtectedActionEvidenceRefs: [
      {
        refKind: "action_contract",
        ref: "action_contract:proposed_demo",
        digest,
      },
    ],
    evidenceRefs: ["evidence:obligation-binding"],
    proofGapRefs: [],
  };
}

function validStatusTransition() {
  return {
    ...base,
    agreementStatusTransitionId: "agreement_status_transition_demo",
    linkedAgreementId: "linked_agreement_demo",
    negotiationSessionId: "negotiation_session_demo",
    fromStatus: "active",
    toStatus: "disputed",
    reasonCodes: ["counterparty_disputed_terms"],
    evidenceRefs: ["evidence:status-transition"],
    proofGapRefs: [],
    transitionDigest: digest,
  };
}
