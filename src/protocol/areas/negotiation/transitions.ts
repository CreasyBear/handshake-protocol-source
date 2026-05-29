import type { ActionContract } from "../action-contract";
import { HandshakeProtocolError } from "../../foundation/errors";
import type { EventDescriptor } from "../../events/chains";
import type { ProtocolRecorder } from "../../events/records";
import type { ProtocolRecord } from "../object-registry";
import type { ProtocolStore, StoredProtocolRecord } from "../../store/port";
import {
  AgreementObligationBindingSchema,
  AgreementStatusTransitionSchema,
  LinkedAgreementSchema,
  NegotiationDecisionSchema,
  NegotiationOfferSchema,
  NegotiationSessionSchema,
  type AgreementObligationBinding,
  type AgreementStatusTransition,
  type LinkedAgreement,
  type NegotiationDecision,
  type NegotiationOffer,
  type NegotiationPartyBinding,
  type NegotiationSession,
} from "./types";

type AgreementStatus = AgreementStatusTransition["fromStatus"] | AgreementStatusTransition["toStatus"];
type ProtocolScope = { tenantId: string; organizationId: string };

export async function recordNegotiationSession(
  recorder: ProtocolRecorder,
  inputValue: NegotiationSession,
): Promise<NegotiationSession> {
  const session = NegotiationSessionSchema.parse(inputValue);
  await commitNegotiationRecord(
    recorder,
    { objectType: "negotiation_session", payload: session },
    {
      eventType: "negotiation_session_recorded",
      objectRefs: [session.negotiationSessionId],
      payload: {
        negotiationSessionId: session.negotiationSessionId,
        subjectResourceRef: session.subjectResourceRef,
        authorityCreated: false,
        gatewayCheckPerformed: false,
        mutationAttempted: false,
        evidencePosture: "recorded_only",
      },
    },
  );
  return session;
}

export async function recordNegotiationOffer(
  store: ProtocolStore,
  recorder: ProtocolRecorder,
  inputValue: NegotiationOffer,
): Promise<NegotiationOffer> {
  const offer = NegotiationOfferSchema.parse(inputValue);
  const session = await requiredSession(store, offer.negotiationSessionId, offer);
  assertFresh(
    session.payload.expiresAt,
    offer.createdAt,
    "negotiation_session_expired",
    "Negotiation session expired before offer recording.",
  );
  assertPartyInSession(session.payload, offer.offeredByPartyId);
  await assertOfferVersionUnique(store, offer);
  await assertReferencedOfferVersion(store, offer, offer.previousOfferVersionId, "negotiation_offer_missing");
  await assertReferencedOfferVersion(store, offer, offer.supersedesOfferVersionId, "negotiation_offer_missing");

  await commitNegotiationRecord(
    recorder,
    { objectType: "negotiation_offer", payload: offer },
    {
      eventType: "negotiation_offer_recorded",
      objectRefs: [offer.negotiationOfferId, offer.negotiationSessionId],
      payload: {
        negotiationSessionId: offer.negotiationSessionId,
        negotiationOfferId: offer.negotiationOfferId,
        offerVersionId: offer.offerVersionId,
        offerSequence: offer.offerSequence,
        authorityCreated: false,
        gatewayCheckPerformed: false,
        mutationAttempted: false,
        evidencePosture: "recorded_only",
      },
    },
  );
  return offer;
}

export async function recordNegotiationDecision(
  store: ProtocolStore,
  recorder: ProtocolRecorder,
  inputValue: NegotiationDecision,
): Promise<NegotiationDecision> {
  const decision = NegotiationDecisionSchema.parse(inputValue);
  const session = await requiredSession(store, decision.negotiationSessionId, decision);
  assertFresh(
    session.payload.expiresAt,
    decision.createdAt,
    "negotiation_session_expired",
    "Negotiation session expired before decision recording.",
  );
  assertPartyInSession(session.payload, decision.decidedByPartyId);
  const offer = await requiredOfferByVersion(
    store,
    decision.negotiationSessionId,
    decision.decidedOfferVersionId,
    decision,
  );
  assertFresh(
    offer.payload.expiresAt,
    decision.createdAt,
    "negotiation_offer_expired",
    "Negotiation offer expired before decision recording.",
  );
  if (offer.payload.offerSequence !== decision.decidedOfferSequence) {
    throw protocolError(
      "negotiation_offer_sequence_mismatch",
      "Negotiation decision must bind to the exact offer sequence it decided.",
    );
  }
  if (decision.decision === "accept") await assertOfferIsCurrent(store, offer.payload);
  if (decision.decision === "counter") {
    const counter = await requiredOfferByVersion(
      store,
      decision.negotiationSessionId,
      decision.counterOfferVersionId ?? "",
      decision,
    );
    assertFresh(
      counter.payload.expiresAt,
      decision.createdAt,
      "negotiation_offer_expired",
      "Counter offer expired before decision recording.",
    );
    if (counter.payload.offerSequence <= offer.payload.offerSequence) {
      throw protocolError("negotiation_counter_offer_stale", "Counter decisions must bind a later offer version.");
    }
  }

  await commitNegotiationRecord(
    recorder,
    { objectType: "negotiation_decision", payload: decision },
    {
      eventType: "negotiation_decision_recorded",
      objectRefs: [decision.negotiationDecisionId, decision.negotiationSessionId, offer.payload.negotiationOfferId],
      payload: {
        negotiationSessionId: decision.negotiationSessionId,
        negotiationDecisionId: decision.negotiationDecisionId,
        decidedOfferVersionId: decision.decidedOfferVersionId,
        decision: decision.decision,
        authorityCreated: false,
        gatewayCheckPerformed: false,
        mutationAttempted: false,
        evidencePosture: "recorded_only",
      },
    },
  );
  return decision;
}

export async function recordLinkedAgreement(
  store: ProtocolStore,
  recorder: ProtocolRecorder,
  inputValue: LinkedAgreement,
): Promise<LinkedAgreement> {
  const agreement = LinkedAgreementSchema.parse(inputValue);
  const session = await requiredSession(store, agreement.negotiationSessionId, agreement);
  assertFresh(
    session.payload.expiresAt,
    agreement.createdAt,
    "negotiation_session_expired",
    "Negotiation session expired before linked agreement recording.",
  );
  const decision = await requiredDecision(store, agreement.acceptedNegotiationDecisionId, agreement);
  if (decision.payload.negotiationSessionId !== agreement.negotiationSessionId) {
    throw protocolError(
      "negotiation_decision_session_mismatch",
      "Linked agreement decision must belong to its session.",
    );
  }
  if (decision.payload.decision !== "accept") {
    throw protocolError("negotiation_decision_not_accept", "Linked agreements can only derive from accept decisions.");
  }
  const offer = await requiredOfferByVersion(
    store,
    agreement.negotiationSessionId,
    agreement.acceptedOfferVersionId,
    agreement,
  );
  assertFresh(
    offer.payload.expiresAt,
    agreement.createdAt,
    "negotiation_offer_expired",
    "Negotiation offer expired before linked agreement recording.",
  );
  if (decision.payload.decidedOfferVersionId !== agreement.acceptedOfferVersionId) {
    throw protocolError("linked_agreement_offer_mismatch", "Linked agreement must bind the accepted decision offer.");
  }
  if (
    offer.payload.offerSequence !== agreement.acceptedOfferSequence ||
    decision.payload.decidedOfferSequence !== agreement.acceptedOfferSequence
  ) {
    throw protocolError(
      "linked_agreement_offer_mismatch",
      "Linked agreement must bind the exact accepted offer sequence.",
    );
  }
  if (offer.payload.offerContentDigest !== agreement.acceptedOfferContentDigest) {
    throw protocolError(
      "linked_agreement_digest_mismatch",
      "Linked agreement must pin the accepted offer content digest.",
    );
  }
  if (decision.payload.decidedByPartyId !== agreement.acceptedByPartyId) {
    throw protocolError("linked_agreement_party_mismatch", "Linked agreement must name the accepting party.");
  }
  const acceptedParty = partyById(session.payload, agreement.acceptedByPartyId);
  if (acceptedParty.agentRef !== agreement.counterpartyRef) {
    throw protocolError(
      "linked_agreement_counterparty_mismatch",
      "Linked agreement counterparty ref must bind to the accepting party agent ref.",
    );
  }
  await assertLinkedAgreementUnique(store, agreement);

  await commitNegotiationRecord(
    recorder,
    { objectType: "linked_agreement", payload: agreement },
    {
      eventType: "linked_agreement_recorded",
      objectRefs: [
        agreement.linkedAgreementId,
        agreement.negotiationSessionId,
        agreement.acceptedNegotiationDecisionId,
        offer.payload.negotiationOfferId,
      ],
      payload: {
        linkedAgreementId: agreement.linkedAgreementId,
        negotiationSessionId: agreement.negotiationSessionId,
        acceptedOfferVersionId: agreement.acceptedOfferVersionId,
        authorityCreated: false,
        gatewayCheckPerformed: false,
        mutationAttempted: false,
        evidencePosture: "local_evidence_only",
      },
    },
  );
  return agreement;
}

export async function recordAgreementObligationBinding(
  store: ProtocolStore,
  recorder: ProtocolRecorder,
  inputValue: AgreementObligationBinding,
): Promise<AgreementObligationBinding> {
  const binding = AgreementObligationBindingSchema.parse(inputValue);
  const agreement = await requiredLinkedAgreement(store, binding.linkedAgreementId, binding);
  if (agreement.payload.negotiationSessionId !== binding.negotiationSessionId) {
    throw protocolError(
      "linked_agreement_session_mismatch",
      "Obligation binding must belong to its agreement session.",
    );
  }
  const status = await currentAgreementStatus(store, agreement.payload);
  if (status !== "active") {
    throw protocolError("agreement_not_active", "Only active linked agreements may be bound to an action contract.");
  }
  const contract = await store.getRecord<ActionContract>("action_contract", binding.actionContractId);
  if (!contract) {
    throw protocolError(
      "agreement_obligation_contract_missing",
      "Agreement obligation binding requires an action contract.",
    );
  }
  assertSameScope(contract.payload, binding, "agreement_obligation_contract_scope_mismatch");
  assertBindingMatchesContract(binding, contract.payload);
  assertBindingMatchesAgreement(binding, agreement.payload);
  await assertAgreementBindingUnique(store, binding);

  await commitNegotiationRecord(
    recorder,
    { objectType: "agreement_obligation_binding", payload: binding },
    {
      eventType: "agreement_obligation_binding_recorded",
      objectRefs: [binding.agreementObligationBindingId, binding.linkedAgreementId, binding.actionContractId],
      payload: {
        agreementObligationBindingId: binding.agreementObligationBindingId,
        linkedAgreementId: binding.linkedAgreementId,
        actionContractId: binding.actionContractId,
        authorityCreated: false,
        gatewayCheckPerformed: false,
        mutationAttempted: false,
        evidencePosture: "local_evidence_only",
      },
    },
  );
  return binding;
}

export async function transitionAgreementStatus(
  store: ProtocolStore,
  recorder: ProtocolRecorder,
  inputValue: AgreementStatusTransition,
): Promise<AgreementStatusTransition> {
  const transition = AgreementStatusTransitionSchema.parse(inputValue);
  const agreement = await requiredLinkedAgreement(store, transition.linkedAgreementId, transition);
  if (agreement.payload.negotiationSessionId !== transition.negotiationSessionId) {
    throw protocolError("linked_agreement_session_mismatch", "Agreement status transition must belong to its session.");
  }
  const current = await currentAgreementStatus(store, agreement.payload);
  if (current !== transition.fromStatus) {
    throw protocolError("agreement_status_stale", "Agreement status transition must start from the current status.");
  }
  if (!isAllowedStatusTransition(transition.fromStatus, transition.toStatus)) {
    throw protocolError("agreement_status_transition_invalid", "Agreement status transition is not allowed.");
  }

  await commitNegotiationRecord(
    recorder,
    { objectType: "agreement_status_transition", payload: transition },
    {
      eventType: "agreement_status_transition_recorded",
      objectRefs: [transition.agreementStatusTransitionId, transition.linkedAgreementId],
      payload: {
        agreementStatusTransitionId: transition.agreementStatusTransitionId,
        linkedAgreementId: transition.linkedAgreementId,
        fromStatus: transition.fromStatus,
        toStatus: transition.toStatus,
        authorityCreated: false,
        gatewayCheckPerformed: false,
        mutationAttempted: false,
        evidencePosture: "recorded_only",
      },
    },
  );
  return transition;
}

export async function currentAgreementStatus(
  store: ProtocolStore,
  agreement: LinkedAgreement,
): Promise<AgreementStatus> {
  const transitions = await store.listRecordsByType<AgreementStatusTransition>("agreement_status_transition", {
    tenantId: agreement.tenantId,
    organizationId: agreement.organizationId,
  });
  const ordered = transitions
    .map((record, index) => ({ transition: record.payload, index }))
    .filter((entry) => entry.transition.linkedAgreementId === agreement.linkedAgreementId)
    .sort(
      (left, right) =>
        Date.parse(left.transition.createdAt) - Date.parse(right.transition.createdAt) || left.index - right.index,
    );
  return ordered.at(-1)?.transition.toStatus ?? "active";
}

async function commitNegotiationRecord(
  recorder: ProtocolRecorder,
  record: ProtocolRecord,
  descriptor: Omit<EventDescriptor, "source">,
): Promise<void> {
  await recorder.commitRecordsWithEvents(
    [record],
    [
      {
        ...descriptor,
        source: record.payload,
      },
    ],
    { recordConflictMode: "absent_or_same" },
  );
}

async function requiredSession(
  store: ProtocolStore,
  negotiationSessionId: string,
  expectedScope: ProtocolScope,
): Promise<StoredProtocolRecord<NegotiationSession>> {
  const session = await store.getRecord<NegotiationSession>("negotiation_session", negotiationSessionId);
  if (!session) throw protocolError("negotiation_session_missing", "Negotiation session was not found.", 404);
  assertSameScope(session.payload, expectedScope, "negotiation_scope_mismatch");
  return session;
}

async function requiredDecision(
  store: ProtocolStore,
  negotiationDecisionId: string,
  expectedScope: ProtocolScope,
): Promise<StoredProtocolRecord<NegotiationDecision>> {
  const decision = await store.getRecord<NegotiationDecision>("negotiation_decision", negotiationDecisionId);
  if (!decision) throw protocolError("negotiation_decision_missing", "Negotiation decision was not found.", 404);
  assertSameScope(decision.payload, expectedScope, "negotiation_scope_mismatch");
  return decision;
}

async function requiredLinkedAgreement(
  store: ProtocolStore,
  linkedAgreementId: string,
  expectedScope: ProtocolScope,
): Promise<StoredProtocolRecord<LinkedAgreement>> {
  const agreement = await store.getRecord<LinkedAgreement>("linked_agreement", linkedAgreementId);
  if (!agreement) throw protocolError("linked_agreement_missing", "Linked agreement was not found.", 404);
  assertSameScope(agreement.payload, expectedScope, "negotiation_scope_mismatch");
  return agreement;
}

async function requiredOfferByVersion(
  store: ProtocolStore,
  negotiationSessionId: string,
  offerVersionId: string,
  expectedScope: ProtocolScope,
): Promise<StoredProtocolRecord<NegotiationOffer>> {
  const offers = await store.listRecordsByType<NegotiationOffer>("negotiation_offer", expectedScope);
  const offer = offers.find(
    (candidate) =>
      candidate.payload.negotiationSessionId === negotiationSessionId &&
      candidate.payload.offerVersionId === offerVersionId,
  );
  if (!offer) throw protocolError("negotiation_offer_missing", "Negotiation offer version was not found.", 404);
  return offer;
}

async function assertReferencedOfferVersion(
  store: ProtocolStore,
  offer: NegotiationOffer,
  referencedOfferVersionId: string | null,
  code: string,
): Promise<void> {
  if (referencedOfferVersionId === null) return;
  const referenced = await requiredOfferByVersion(store, offer.negotiationSessionId, referencedOfferVersionId, offer);
  if (referenced.payload.offerSequence >= offer.offerSequence) {
    throw protocolError(code, "Referenced offer version must precede the new offer.");
  }
}

async function assertOfferVersionUnique(store: ProtocolStore, offer: NegotiationOffer): Promise<void> {
  const offers = await store.listRecordsByType<NegotiationOffer>("negotiation_offer", {
    tenantId: offer.tenantId,
    organizationId: offer.organizationId,
  });
  const duplicate = offers.find(
    (candidate) =>
      candidate.payload.negotiationSessionId === offer.negotiationSessionId &&
      candidate.payload.offerVersionId === offer.offerVersionId &&
      candidate.payload.negotiationOfferId !== offer.negotiationOfferId,
  );
  if (duplicate) {
    throw protocolError("negotiation_offer_version_conflict", "Offer version ids are unique within a session.");
  }
}

async function assertOfferIsCurrent(store: ProtocolStore, offer: NegotiationOffer): Promise<void> {
  const offers = await store.listRecordsByType<NegotiationOffer>("negotiation_offer", {
    tenantId: offer.tenantId,
    organizationId: offer.organizationId,
  });
  const laterOffer = offers.find(
    (candidate) =>
      candidate.payload.negotiationSessionId === offer.negotiationSessionId &&
      candidate.payload.offerSequence > offer.offerSequence,
  );
  if (laterOffer) throw protocolError("negotiation_offer_stale", "Accept decisions must bind the current offer.");
}

async function assertLinkedAgreementUnique(store: ProtocolStore, agreement: LinkedAgreement): Promise<void> {
  const agreements = await store.listRecordsByType<LinkedAgreement>("linked_agreement", {
    tenantId: agreement.tenantId,
    organizationId: agreement.organizationId,
  });
  const duplicate = agreements.find(
    (candidate) =>
      candidate.payload.acceptedNegotiationDecisionId === agreement.acceptedNegotiationDecisionId &&
      candidate.payload.linkedAgreementId !== agreement.linkedAgreementId,
  );
  if (duplicate) {
    throw protocolError("linked_agreement_duplicate", "Each accepted decision may produce only one linked agreement.");
  }
}

async function assertAgreementBindingUnique(store: ProtocolStore, binding: AgreementObligationBinding): Promise<void> {
  const bindings = await store.listRecordsByType<AgreementObligationBinding>("agreement_obligation_binding", {
    tenantId: binding.tenantId,
    organizationId: binding.organizationId,
  });
  const duplicate = bindings.find(
    (candidate) =>
      ((candidate.payload.actionContractId === binding.actionContractId &&
        candidate.payload.obligationRef === binding.obligationRef) ||
        (candidate.payload.linkedAgreementId === binding.linkedAgreementId &&
          candidate.payload.obligationRef === binding.obligationRef &&
          candidate.payload.counterpartyRef === binding.counterpartyRef)) &&
      candidate.payload.obligationRef === binding.obligationRef &&
      candidate.payload.agreementObligationBindingId !== binding.agreementObligationBindingId,
  );
  if (duplicate) {
    throw protocolError(
      "agreement_obligation_reused",
      "Each linked agreement obligation may bind only one action contract.",
    );
  }
}

function assertPartyInSession(session: NegotiationSession, partyId: string): void {
  partyById(session, partyId);
}

function partyById(session: NegotiationSession, partyId: string): NegotiationPartyBinding {
  const party = session.parties.find((candidate) => candidate.partyId === partyId);
  if (!party) throw protocolError("negotiation_party_missing", "Negotiation party was not found in the session.", 404);
  return party;
}

function assertBindingMatchesAgreement(binding: AgreementObligationBinding, agreement: LinkedAgreement): void {
  if (binding.counterpartyRef !== agreement.counterpartyRef) {
    throw protocolError(
      "agreement_obligation_counterparty_mismatch",
      "Agreement obligation binding counterparty does not match the linked agreement.",
    );
  }
  if (binding.obligationRef !== agreement.clearingEvidenceRefs.obligationRef) {
    throw protocolError(
      "agreement_obligation_binding_mismatch",
      "Agreement obligation binding does not match the agreement obligation ref.",
    );
  }
}

function assertBindingMatchesContract(binding: AgreementObligationBinding, contract: ActionContract): void {
  const obligationRef = contract.clearingEvidenceRefs.obligationRef ?? null;
  const counterpartyRef = contract.clearingEvidenceRefs.counterpartyRef ?? null;
  if (binding.obligationRef !== obligationRef) {
    throw protocolError(
      "agreement_obligation_binding_mismatch",
      "Agreement obligation binding must match ActionContract clearingEvidenceRefs.obligationRef.",
    );
  }
  if (binding.counterpartyRef !== counterpartyRef) {
    throw protocolError(
      "agreement_obligation_counterparty_mismatch",
      "Agreement obligation binding must match ActionContract clearingEvidenceRefs.counterpartyRef.",
    );
  }
  if (binding.actionContractDigest !== contract.actionContractDigest) {
    throw protocolError(
      "agreement_obligation_contract_mismatch",
      "Agreement obligation binding must pin the exact action contract digest.",
    );
  }
  if (binding.paramsDigest !== contract.paramsDigest) {
    throw protocolError(
      "agreement_obligation_params_mismatch",
      "Agreement obligation binding must pin the exact action contract params digest.",
    );
  }
  if (
    binding.actionTypeId !== contract.actionTypeId ||
    binding.actionClass !== contract.actionClass ||
    binding.resourceRef !== contract.resourceRef
  ) {
    throw protocolError(
      "agreement_obligation_contract_mismatch",
      "Agreement obligation binding action fields must match the action contract.",
    );
  }
  const hasActionContractEvidence = binding.localProtectedActionEvidenceRefs.some(
    (ref) =>
      ref.refKind === "action_contract" &&
      refMatchesObjectId(ref.ref, "action_contract", contract.actionContractId) &&
      (ref.digest === null || ref.digest === contract.actionContractDigest),
  );
  if (!hasActionContractEvidence) {
    throw protocolError(
      "agreement_obligation_contract_mismatch",
      "Agreement obligation binding must include local action-contract evidence.",
    );
  }
}

function refMatchesObjectId(ref: string, objectType: string, objectId: string): boolean {
  return ref === objectId || ref === `${objectType}:${objectId}`;
}

function assertSameScope(actual: ProtocolScope, expected: ProtocolScope, code: string): void {
  if (actual.tenantId !== expected.tenantId || actual.organizationId !== expected.organizationId) {
    throw protocolError(code, "Negotiation evidence cannot cross tenant or organization scope.");
  }
}

function assertFresh(expiresAt: string | null, now: string, code: string, message: string): void {
  if (expiresAt && Date.parse(expiresAt) <= Date.parse(now)) {
    throw protocolError(code, message);
  }
}

function isAllowedStatusTransition(from: AgreementStatus, to: AgreementStatus): boolean {
  if (from === "proposed") return ["active", "expired", "superseded", "withdrawn"].includes(to);
  if (from === "active") return ["disputed", "expired", "resolved", "superseded", "withdrawn"].includes(to);
  if (from === "disputed") return ["resolved", "withdrawn"].includes(to);
  return false;
}

function protocolError(code: string, message: string, status = 409): HandshakeProtocolError {
  return new HandshakeProtocolError(code, message, status);
}
