import { describe, expect, it } from "bun:test";
import {
  getObjectId,
  protocolObjectRegistry,
  protocolObjectTypes,
  protocolRecordSchemas,
} from "../../src/protocol/areas/object-registry";
import { ProtocolRecordSchema } from "../../src/protocol/areas/object-registry/schemas";

const digest = `sha256:${"a".repeat(64)}`;
const now = "2026-05-26T00:00:00.000Z";

const negotiationObjectTypes = [
  "negotiation_session",
  "negotiation_offer",
  "negotiation_decision",
  "linked_agreement",
  "agreement_obligation_binding",
  "agreement_status_transition",
] as const;

const expectedIdByType = {
  negotiation_session: "negotiation_session_demo",
  negotiation_offer: "negotiation_offer_demo",
  negotiation_decision: "negotiation_decision_demo",
  linked_agreement: "linked_agreement_demo",
  agreement_obligation_binding: "agreement_obligation_binding_demo",
  agreement_status_transition: "agreement_status_transition_demo",
} satisfies Record<(typeof negotiationObjectTypes)[number], string>;

describe("negotiation protocol object registry entries", () => {
  it("registers every negotiation object type", () => {
    for (const objectType of negotiationObjectTypes) {
      expect(protocolObjectTypes).toContain(objectType);
      expect(protocolObjectRegistry[objectType]).toBeDefined();
      expect(protocolRecordSchemas[objectType]).toBe(protocolObjectRegistry[objectType].schema);
    }
  });

  it("keeps negotiation records as transition evidence with audit read posture", () => {
    for (const objectType of negotiationObjectTypes) {
      const entry = protocolObjectRegistry[objectType];
      expect(entry.exportPosture).toBe("transition_evidence");
      expect(entry.rawReadPosture).toBe("audit_read");
    }
  });

  it("selects negotiation object ids from the negotiation payload itself", () => {
    for (const objectType of negotiationObjectTypes) {
      const record = ProtocolRecordSchema.parse({ objectType, payload: validPayloads[objectType] });

      expect(record.objectType).toBe(objectType);
      expect(JSON.stringify(record.payload)).toBe(JSON.stringify(validPayloads[objectType]));
      expect(getObjectId(record)).toBe(expectedIdByType[objectType]);
    }
  });

  it("does not classify negotiation objects as catalog, terminal, control-plane, or internal-only records", () => {
    for (const objectType of negotiationObjectTypes) {
      const entry = protocolObjectRegistry[objectType];

      expect(entry.exportPosture).not.toBe("catalog_public");
      expect(entry.exportPosture).not.toBe("receipt_evidence");
      expect(entry.rawReadPosture).not.toBe("control_plane_read");
      expect(entry.rawReadPosture).not.toBe("internal_only");
    }
  });
});

const base = {
  schemaVersion: "0.2.4",
  tenantId: "tenant_demo",
  organizationId: "org_demo",
  createdAt: now,
} as const;

const externalRef = {
  protocol: "a2a",
  protocolVersion: "0.3.0",
  objectKind: "Task",
  objectRef: "a2a:task:demo",
  objectDigest: digest,
  evidencePosture: "imported_evidence_only",
  evidenceUse: "conversation_context",
  proofGapRefs: [],
} as const;

const validPayloads = {
  negotiation_session: {
    ...base,
    negotiationSessionId: expectedIdByType.negotiation_session,
    negotiationSessionDigest: digest,
    subjectResourceRef: "resource:repo:demo",
    subjectProtectedActionContextRefs: ["candidate_action:candidate_demo"],
    runtimePosture: "declared_runtime_context",
    parties: [
      {
        partyId: "party_initiator",
        partyRole: "initiator",
        agentRef: "agent:local",
        organizationRef: null,
        runtimeRef: "runtime:codex",
        endpointRef: null,
        identityProofPosture: "self_attested",
        identityEvidenceRefs: [],
        identityProofDigest: null,
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
    generatedCodeOrSpecRefs: [],
    declaredAssumptions: [],
    uncertaintyMarkers: [],
    externalProtocolEvidenceRefs: [externalRef],
    clearingEvidenceRefs: {},
    expiresAt: null,
  },
  negotiation_offer: {
    ...base,
    negotiationOfferId: expectedIdByType.negotiation_offer,
    negotiationSessionId: expectedIdByType.negotiation_session,
    offerVersionId: "offer_version_1",
    offerSequence: 1,
    offeredByPartyId: "party_initiator",
    previousOfferVersionId: null,
    supersedesOfferVersionId: null,
    offerContentDigest: digest,
    offerObjectRefs: ["object:offer:v1"],
    offerContentRefs: [],
    proofGapRefs: [],
    externalProtocolEvidenceRefs: [],
    generatedCodeOrSpecRefs: [],
    declaredAssumptions: [],
    uncertaintyMarkers: [],
    clearingEvidenceRefs: {},
    expiresAt: null,
  },
  negotiation_decision: {
    ...base,
    negotiationDecisionId: expectedIdByType.negotiation_decision,
    negotiationSessionId: expectedIdByType.negotiation_session,
    decidedOfferVersionId: "offer_version_1",
    decidedOfferSequence: 1,
    decidedByPartyId: "party_initiator",
    decision: "accept",
    reasonCodes: [],
    evidenceRefs: ["evidence:decision"],
    proofGapRefs: [],
    counterOfferVersionId: null,
    decisionDigest: digest,
  },
  linked_agreement: {
    ...base,
    linkedAgreementId: expectedIdByType.linked_agreement,
    negotiationSessionId: expectedIdByType.negotiation_session,
    acceptedNegotiationDecisionId: expectedIdByType.negotiation_decision,
    acceptedOfferVersionId: "offer_version_1",
    acceptedOfferSequence: 1,
    acceptedOfferContentDigest: digest,
    acceptedByPartyId: "party_initiator",
    counterpartyRef: "agent:local",
    agreementDigest: digest,
    agreementObjectRefs: ["object:agreement:v1"],
    agreementContentRefs: [],
    proofGapRefs: [],
    agreementEvidencePosture: "local_evidence_only",
    clearingEvidenceRefs: {},
    externalProtocolEvidenceRefs: [],
    expiresAt: null,
  },
  agreement_obligation_binding: {
    ...base,
    agreementObligationBindingId: expectedIdByType.agreement_obligation_binding,
    linkedAgreementId: expectedIdByType.linked_agreement,
    negotiationSessionId: expectedIdByType.negotiation_session,
    obligationRef: "obligation:local-proposed-action",
    obligationDigest: digest,
    actionContractId: "act_demo",
    actionContractDigest: digest,
    paramsDigest: digest,
    actionTypeId: "atype_package_install",
    actionClass: "package.install",
    resourceRef: "npm:hono",
    counterpartyRef: "agent:local",
    maxUses: 1,
    bindingPosture: "local_evidence_only",
    localProtectedActionEvidenceRefs: [
      {
        refKind: "candidate_action",
        ref: "candidate_action:candidate_demo",
        digest,
      },
    ],
    evidenceRefs: [],
    proofGapRefs: [],
  },
  agreement_status_transition: {
    ...base,
    agreementStatusTransitionId: expectedIdByType.agreement_status_transition,
    linkedAgreementId: expectedIdByType.linked_agreement,
    negotiationSessionId: expectedIdByType.negotiation_session,
    fromStatus: "active",
    toStatus: "disputed",
    reasonCodes: ["counterparty_disputed_terms"],
    evidenceRefs: ["evidence:status"],
    proofGapRefs: [],
    transitionDigest: digest,
  },
} as const;
