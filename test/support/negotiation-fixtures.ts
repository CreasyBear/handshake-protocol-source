import type { ActionContract } from "../../src/protocol/areas/action-contract";
import type {
  AgreementObligationBinding,
  AgreementStatusTransition,
  LinkedAgreement,
  NegotiationDecision,
  NegotiationOffer,
  NegotiationSession,
} from "../../src/protocol/areas/negotiation";
import type { HandshakeKernel } from "../../src/protocol/kernel";
import { PROTOCOL_VERSION } from "../../src/protocol/public/schemas";
import type { makeKernelFixture } from "./fixtures";
import { futureIso, makePackageInstallCandidate, proposalInputForCompilation } from "./fixtures";

export const negotiationDigest = `sha256:${"a".repeat(64)}` as const;
export const alternateNegotiationDigest = `sha256:${"b".repeat(64)}` as const;
const now = "2026-05-26T00:00:00.000Z";

export function negotiationSession(overrides: Partial<NegotiationSession> = {}): NegotiationSession {
  return {
    schemaVersion: PROTOCOL_VERSION,
    tenantId: "tenant_demo",
    organizationId: "org_demo",
    createdAt: now,
    negotiationSessionId: "negotiation_session_demo",
    negotiationSessionDigest: negotiationDigest,
    subjectResourceRef: "resource:repo:demo",
    subjectProtectedActionContextRefs: ["candidate_action:candidate_demo"],
    runtimePosture: "declared_runtime_context",
    parties: [
      {
        partyId: "party_initiator",
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
        partyId: "party_counterparty",
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
    generatedCodeOrSpecRefs: ["generated_graph:negotiation"],
    declaredAssumptions: ["seller agent endpoint was supplied by runtime evidence"],
    uncertaintyMarkers: ["seller identity is imported evidence only"],
    externalProtocolEvidenceRefs: [],
    clearingEvidenceRefs: { correlationRef: "a2a:task:negotiation-demo" },
    expiresAt: futureIso(),
    ...overrides,
  };
}

export function negotiationOffer(overrides: Partial<NegotiationOffer> = {}): NegotiationOffer {
  return {
    schemaVersion: PROTOCOL_VERSION,
    tenantId: "tenant_demo",
    organizationId: "org_demo",
    createdAt: now,
    negotiationOfferId: "negotiation_offer_v1",
    negotiationSessionId: "negotiation_session_demo",
    offerVersionId: "offer_version_1",
    offerSequence: 1,
    offeredByPartyId: "party_initiator",
    previousOfferVersionId: null,
    supersedesOfferVersionId: null,
    offerContentDigest: negotiationDigest,
    offerObjectRefs: ["object:offer:v1"],
    offerContentRefs: ["content:offer:v1"],
    proofGapRefs: [],
    externalProtocolEvidenceRefs: [],
    generatedCodeOrSpecRefs: ["generated_graph:negotiation"],
    declaredAssumptions: [],
    uncertaintyMarkers: [],
    clearingEvidenceRefs: { obligationRef: "obligation:a2a-demo" },
    expiresAt: futureIso(),
    ...overrides,
  };
}

export function negotiationDecision(overrides: Partial<NegotiationDecision> = {}): NegotiationDecision {
  return {
    schemaVersion: PROTOCOL_VERSION,
    tenantId: "tenant_demo",
    organizationId: "org_demo",
    createdAt: now,
    negotiationDecisionId: "negotiation_decision_accept_v1",
    negotiationSessionId: "negotiation_session_demo",
    decidedOfferVersionId: "offer_version_1",
    decidedOfferSequence: 1,
    decidedByPartyId: "party_counterparty",
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
    createdAt: now,
    linkedAgreementId: "linked_agreement_demo",
    negotiationSessionId: "negotiation_session_demo",
    acceptedNegotiationDecisionId: "negotiation_decision_accept_v1",
    acceptedOfferVersionId: "offer_version_1",
    acceptedOfferSequence: 1,
    acceptedOfferContentDigest: negotiationDigest,
    acceptedByPartyId: "party_counterparty",
    counterpartyRef: "agent:seller",
    agreementDigest: negotiationDigest,
    agreementObjectRefs: ["object:agreement:v1"],
    agreementContentRefs: ["content:agreement:v1"],
    proofGapRefs: [],
    agreementEvidencePosture: "local_evidence_only",
    clearingEvidenceRefs: { obligationRef: "obligation:a2a-demo", counterpartyRef: "agent:seller" },
    externalProtocolEvidenceRefs: [],
    expiresAt: futureIso(),
    ...overrides,
  };
}

export function agreementStatusTransition(
  overrides: Partial<AgreementStatusTransition> = {},
): AgreementStatusTransition {
  return {
    schemaVersion: PROTOCOL_VERSION,
    tenantId: "tenant_demo",
    organizationId: "org_demo",
    createdAt: now,
    agreementStatusTransitionId: "agreement_status_transition_demo",
    linkedAgreementId: "linked_agreement_demo",
    negotiationSessionId: "negotiation_session_demo",
    fromStatus: "active",
    toStatus: "disputed",
    reasonCodes: ["counterparty_disputed_terms"],
    evidenceRefs: ["evidence:agreement-status"],
    proofGapRefs: [],
    transitionDigest: negotiationDigest,
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
    createdAt: now,
    agreementObligationBindingId: "agreement_obligation_binding_demo",
    linkedAgreementId: "linked_agreement_demo",
    negotiationSessionId: "negotiation_session_demo",
    obligationRef: "obligation:a2a-demo",
    obligationDigest: alternateNegotiationDigest,
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

export async function recordAcceptedAgreement(kernel: HandshakeKernel) {
  const session = await kernel.recordNegotiationSession(negotiationSession());
  const offer = await kernel.recordNegotiationOffer(negotiationOffer());
  const decision = await kernel.recordNegotiationDecision(negotiationDecision());
  const agreement = await kernel.recordLinkedAgreement(linkedAgreement());
  return { session, offer, decision, agreement };
}

export async function createNegotiatedPackageContract(
  fixture: ReturnType<typeof makeKernelFixture>,
  overrides: Partial<ReturnType<typeof makePackageInstallCandidate>> = {},
): Promise<ActionContract> {
  const compilation = await fixture.kernel.compileIntent({
    tenantId: "tenant_demo",
    organizationId: "org_demo",
    principalIntentRef: "intent:negotiated package install",
    principalId: "principal_demo",
    agentId: "agent_demo",
    runId: "run_demo",
    runtimeAdapterId: "runtime_codex",
    operatingEnvelopeId: "env_demo",
    toolCatalogRef: "tool_catalog_demo@v1",
    actionCatalogRef: "action_catalog_demo@v1",
    gatewayRegistryRef: "gateway_registry@v1",
    generatedCodeOrSpecRefs: ["code:generated-plan"],
    declaredAssumptions: ["package name is explicit"],
    requiredEvidenceRefs: ["evidence:package-lock-diff"],
    candidate: makePackageInstallCandidate(fixture, {
      clearingEvidenceRefs: {
        obligationRef: "obligation:a2a-demo",
        counterpartyRef: "agent:seller",
      },
      idempotencyKey: "idem_negotiated_package_hono",
      ...overrides,
    }),
  });
  return fixture.kernel.proposeActionContract(proposalInputForCompilation(compilation, "test-secret"));
}
