import type { ActionContract } from "../../src/protocol/areas/action-contract";
import type {
  AgreementObligationBinding,
  LinkedAgreement,
  NegotiationDecision,
  NegotiationOffer,
  NegotiationSession,
} from "../../src/protocol/areas/negotiation";
import { PROTOCOL_VERSION } from "../../src/protocol/public/schemas";

export const negotiationDigest = `sha256:${"a".repeat(64)}` as const;
const obligationDigest = `sha256:${"b".repeat(64)}` as const;
const createdAt = "2026-05-26T00:00:00.000Z";

export function futureIso(): string {
  return "2026-06-26T00:00:00.000Z";
}

export function negotiationSession(overrides: Partial<NegotiationSession> = {}): NegotiationSession {
  return {
    schemaVersion: PROTOCOL_VERSION,
    tenantId: "tenant_demo",
    organizationId: "org_demo",
    createdAt,
    negotiationSessionId: "negotiation_session_demo",
    negotiationSessionDigest: negotiationDigest,
    subjectResourceRef: "resource:x402:premium-context",
    subjectProtectedActionContextRefs: ["candidate_action:candidate_demo"],
    runtimePosture: "declared_runtime_context",
    parties: [
      {
        partyId: "party_buyer",
        partyRole: "initiator",
        agentRef: "agent:buyer",
        organizationRef: "org:buyer",
        runtimeRef: "runtime:codex",
        endpointRef: null,
        identityProofPosture: "host_verified_ref",
        identityEvidenceRefs: ["identity-evidence:buyer"],
        identityProofDigest: negotiationDigest,
        proofGapRefs: [],
      },
      {
        partyId: "party_seller",
        partyRole: "counterparty",
        agentRef: "agent:seller",
        organizationRef: "org:seller",
        runtimeRef: "runtime:a2a",
        endpointRef: "https://seller-agent.example.test",
        identityProofPosture: "proof_gap_recorded",
        identityEvidenceRefs: [],
        identityProofDigest: null,
        proofGapRefs: ["proof_gap:seller_identity"],
      },
    ],
    generatedCodeOrSpecRefs: ["generated_graph:x402-a2a-negotiation"],
    declaredAssumptions: ["seller endpoint was imported from runtime evidence"],
    uncertaintyMarkers: ["seller identity remains imported local evidence"],
    externalProtocolEvidenceRefs: [],
    clearingEvidenceRefs: { correlationRef: "a2a:task:x402-negotiation" },
    expiresAt: futureIso(),
    ...overrides,
  };
}

export function negotiationOffer(overrides: Partial<NegotiationOffer> = {}): NegotiationOffer {
  return {
    schemaVersion: PROTOCOL_VERSION,
    tenantId: "tenant_demo",
    organizationId: "org_demo",
    createdAt,
    negotiationOfferId: "negotiation_offer_v1",
    negotiationSessionId: "negotiation_session_demo",
    offerVersionId: "offer_version_1",
    offerSequence: 1,
    offeredByPartyId: "party_buyer",
    previousOfferVersionId: null,
    supersedesOfferVersionId: null,
    offerContentDigest: negotiationDigest,
    offerObjectRefs: ["object:x402-offer:v1"],
    offerContentRefs: ["content:x402-offer:v1"],
    proofGapRefs: [],
    externalProtocolEvidenceRefs: [],
    generatedCodeOrSpecRefs: ["generated_graph:x402-a2a-negotiation"],
    declaredAssumptions: [],
    uncertaintyMarkers: [],
    clearingEvidenceRefs: { obligationRef: "obligation:x402-exact-call" },
    expiresAt: futureIso(),
    ...overrides,
  };
}

export function negotiationDecision(overrides: Partial<NegotiationDecision> = {}): NegotiationDecision {
  return {
    schemaVersion: PROTOCOL_VERSION,
    tenantId: "tenant_demo",
    organizationId: "org_demo",
    createdAt,
    negotiationDecisionId: "negotiation_decision_accept_v1",
    negotiationSessionId: "negotiation_session_demo",
    decidedOfferVersionId: "offer_version_1",
    decidedOfferSequence: 1,
    decidedByPartyId: "party_seller",
    decision: "accept",
    reasonCodes: ["offer_terms_accepted"],
    evidenceRefs: ["evidence:decision:accept"],
    proofGapRefs: [],
    counterOfferVersionId: null,
    decisionDigest: negotiationDigest,
    ...overrides,
  };
}

export function linkedAgreement(overrides: Partial<LinkedAgreement> = {}): LinkedAgreement {
  return {
    schemaVersion: PROTOCOL_VERSION,
    tenantId: "tenant_demo",
    organizationId: "org_demo",
    createdAt,
    linkedAgreementId: "linked_agreement_demo",
    negotiationSessionId: "negotiation_session_demo",
    acceptedNegotiationDecisionId: "negotiation_decision_accept_v1",
    acceptedOfferVersionId: "offer_version_1",
    acceptedOfferSequence: 1,
    acceptedOfferContentDigest: negotiationDigest,
    acceptedByPartyId: "party_seller",
    counterpartyRef: "agent:seller",
    agreementDigest: negotiationDigest,
    agreementObjectRefs: ["object:x402-agreement:v1"],
    agreementContentRefs: ["content:x402-agreement:v1"],
    proofGapRefs: [],
    agreementEvidencePosture: "local_evidence_only",
    clearingEvidenceRefs: { obligationRef: "obligation:x402-exact-call", counterpartyRef: "agent:seller" },
    externalProtocolEvidenceRefs: [],
    expiresAt: futureIso(),
    ...overrides,
  };
}

export function agreementBindingForContract(
  contract: ActionContract,
  overrides: Partial<AgreementObligationBinding> = {},
): AgreementObligationBinding {
  return {
    schemaVersion: PROTOCOL_VERSION,
    tenantId: contract.tenantId,
    organizationId: contract.organizationId,
    createdAt,
    agreementObligationBindingId: "agreement_obligation_binding_demo",
    linkedAgreementId: "linked_agreement_demo",
    negotiationSessionId: "negotiation_session_demo",
    obligationRef: "obligation:x402-exact-call",
    obligationDigest,
    actionContractId: contract.actionContractId,
    actionContractDigest: contract.actionContractDigest,
    paramsDigest: contract.paramsDigest,
    actionTypeId: contract.actionTypeId,
    actionClass: contract.actionClass,
    resourceRef: contract.resourceRef,
    counterpartyRef: "agent:seller",
    maxUses: 1,
    bindingPosture: "local_evidence_only",
    localProtectedActionEvidenceRefs: [
      {
        refKind: "action_contract",
        ref: `action_contract:${contract.actionContractId}`,
        digest: contract.actionContractDigest,
      },
    ],
    evidenceRefs: ["evidence:agreement-obligation-binding"],
    proofGapRefs: [],
    ...overrides,
  };
}
