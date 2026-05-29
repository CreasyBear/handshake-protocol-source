import type { ActionContract } from "../action-contract";
import type { ProtocolStore } from "../../store/port";
import { currentAgreementStatus } from "./transitions";
import type {
  AgreementObligationBinding,
  AgreementStatusTransition,
  LinkedAgreement,
  NegotiationOffer,
  NegotiationSession,
} from "./types";

export type AgreementObligationPolicyInput = {
  posture: "not_applicable" | "bound" | "proof_gap" | "refused";
  obligationRef: string | null;
  counterpartyRef: string | null;
  agreementObligationBindingId: string | null;
  linkedAgreementId: string | null;
  agreementStatus: AgreementStatusTransition["fromStatus"] | AgreementStatusTransition["toStatus"] | null;
  agreementExpiresAt: string | null;
  sessionExpiresAt: string | null;
  offerExpiresAt: string | null;
  actionContractDigest: string | null;
  paramsDigest: string | null;
};

export type AgreementObligationPolicyEvaluation = {
  ok: boolean;
  decision: "greenlight" | "refuse" | "proof_gap";
  reasonCode: string | null;
  reason: string | null;
  policyInput: AgreementObligationPolicyInput;
};

export async function evaluateAgreementObligationPolicy(
  store: ProtocolStore,
  contract: ActionContract,
  now: string,
): Promise<AgreementObligationPolicyEvaluation> {
  const obligationRef = contract.clearingEvidenceRefs.obligationRef ?? null;
  const counterpartyRef = contract.clearingEvidenceRefs.counterpartyRef ?? null;
  if (!obligationRef && !counterpartyRef) return ok(notApplicableInput());
  if (!obligationRef || !counterpartyRef) {
    return proofGap(baseInput({ obligationRef, counterpartyRef }), "agreement_obligation_binding_missing");
  }

  const bindings = (
    await store.listRecordsByActionContract<AgreementObligationBinding>(
      "agreement_obligation_binding",
      contract.actionContractId,
      {
        tenantId: contract.tenantId,
        organizationId: contract.organizationId,
      },
    )
  )
    .map((record) => record.payload)
    .filter(
      (binding) => binding.actionContractId === contract.actionContractId && binding.obligationRef === obligationRef,
    );

  if (bindings.length === 0) {
    return proofGap(baseInput({ obligationRef, counterpartyRef }), "agreement_obligation_binding_missing");
  }
  if (bindings.length > 1) {
    return proofGap(baseInput({ obligationRef, counterpartyRef }), "agreement_obligation_binding_ambiguous");
  }

  const binding = bindings[0];
  if (!binding) return proofGap(baseInput({ obligationRef, counterpartyRef }), "agreement_obligation_binding_missing");

  if (!sameScope(binding, contract)) {
    return refusal(
      baseInput({
        obligationRef,
        counterpartyRef,
        agreementObligationBindingId: binding.agreementObligationBindingId,
        linkedAgreementId: binding.linkedAgreementId,
        actionContractDigest: binding.actionContractDigest,
        paramsDigest: binding.paramsDigest,
      }),
      {
        reasonCode: "agreement_obligation_scope_mismatch",
        reason: "Agreement obligation binding scope does not match the action contract scope.",
      },
    );
  }

  const agreementRecord = await store.getRecord<LinkedAgreement>("linked_agreement", binding.linkedAgreementId);
  const agreement = agreementRecord?.payload ?? null;
  const agreementStatus =
    agreement && sameScope(agreement, contract) ? await currentAgreementStatus(store, agreement) : null;
  const session = agreement && sameScope(agreement, contract) ? await loadAgreementSession(store, agreement) : null;
  const offer = agreement && sameScope(agreement, contract) ? await loadAgreementOffer(store, agreement) : null;
  const policyInput = baseInput({
    obligationRef,
    counterpartyRef,
    agreementObligationBindingId: binding.agreementObligationBindingId,
    linkedAgreementId: binding.linkedAgreementId,
    agreementStatus,
    agreementExpiresAt: agreement?.expiresAt ?? null,
    sessionExpiresAt: session?.expiresAt ?? null,
    offerExpiresAt: offer?.expiresAt ?? null,
    actionContractDigest: binding.actionContractDigest,
    paramsDigest: binding.paramsDigest,
  });

  if (!agreement) return proofGap(policyInput, "agreement_missing");
  if (!sameScope(agreement, contract)) {
    return refusal(policyInput, {
      reasonCode: "agreement_obligation_scope_mismatch",
      reason: "Linked agreement scope does not match the action contract scope.",
    });
  }
  if (!session) return proofGap(policyInput, "negotiation_session_missing");
  if (!offer) return proofGap(policyInput, "negotiation_offer_missing");
  const bindingFailure = bindingFailureForContract(binding, agreement, contract);
  if (bindingFailure) return refusal(policyInput, bindingFailure);
  const evidenceFreshnessFailure = evidenceFreshnessFailureForAgreement(agreement, session, offer, now);
  if (evidenceFreshnessFailure) return refusal(policyInput, evidenceFreshnessFailure);
  const lifecycleFailure = lifecycleFailureForAgreement(agreement, agreementStatus, now);
  if (lifecycleFailure) return refusal(policyInput, lifecycleFailure);
  return ok({ ...policyInput, posture: "bound" });
}

function bindingFailureForContract(
  binding: AgreementObligationBinding,
  agreement: LinkedAgreement,
  contract: ActionContract,
): { reasonCode: string; reason: string } | null {
  if (binding.counterpartyRef !== agreement.counterpartyRef) {
    return {
      reasonCode: "agreement_obligation_counterparty_mismatch",
      reason: "Agreement obligation binding counterparty does not match the linked agreement.",
    };
  }
  if (binding.obligationRef !== agreement.clearingEvidenceRefs.obligationRef) {
    return {
      reasonCode: "agreement_obligation_binding_mismatch",
      reason: "Agreement obligation binding does not match the linked agreement obligation ref.",
    };
  }
  if (binding.obligationRef !== contract.clearingEvidenceRefs.obligationRef) {
    return {
      reasonCode: "agreement_obligation_binding_mismatch",
      reason: "Agreement obligation binding does not match ActionContract clearingEvidenceRefs.obligationRef.",
    };
  }
  if (binding.counterpartyRef !== contract.clearingEvidenceRefs.counterpartyRef) {
    return {
      reasonCode: "agreement_obligation_counterparty_mismatch",
      reason: "Agreement obligation binding does not match ActionContract clearingEvidenceRefs.counterpartyRef.",
    };
  }
  if (binding.actionContractDigest !== contract.actionContractDigest) {
    return {
      reasonCode: "agreement_obligation_binding_mismatch",
      reason: "Agreement obligation binding action contract digest drifted.",
    };
  }
  if (binding.paramsDigest !== contract.paramsDigest) {
    return {
      reasonCode: "agreement_obligation_params_mismatch",
      reason: "Agreement obligation binding params digest drifted.",
    };
  }
  if (
    binding.actionTypeId !== contract.actionTypeId ||
    binding.actionClass !== contract.actionClass ||
    binding.resourceRef !== contract.resourceRef
  ) {
    return {
      reasonCode: "agreement_obligation_binding_mismatch",
      reason: "Agreement obligation binding action fields drifted from the action contract.",
    };
  }
  return null;
}

function lifecycleFailureForAgreement(
  agreement: LinkedAgreement,
  agreementStatus: AgreementObligationPolicyInput["agreementStatus"],
  now: string,
): { reasonCode: string; reason: string } | null {
  if (agreement.expiresAt && Date.parse(agreement.expiresAt) <= Date.parse(now)) {
    return { reasonCode: "agreement_expired", reason: "Linked agreement expired before policy evaluation." };
  }
  if (agreementStatus === "withdrawn") {
    return { reasonCode: "agreement_withdrawn", reason: "Linked agreement was withdrawn before policy evaluation." };
  }
  if (agreementStatus === "disputed") {
    return { reasonCode: "agreement_disputed", reason: "Linked agreement was disputed before policy evaluation." };
  }
  if (agreementStatus === "superseded") {
    return { reasonCode: "agreement_superseded", reason: "Linked agreement was superseded before policy evaluation." };
  }
  if (agreementStatus === "expired") {
    return { reasonCode: "agreement_expired", reason: "Linked agreement status is expired." };
  }
  if (agreementStatus !== "active") {
    return { reasonCode: "agreement_not_active", reason: "Linked agreement is not active." };
  }
  return null;
}

function evidenceFreshnessFailureForAgreement(
  agreement: LinkedAgreement,
  session: NegotiationSession,
  offer: NegotiationOffer,
  now: string,
): { reasonCode: string; reason: string } | null {
  if (session.expiresAt && Date.parse(session.expiresAt) <= Date.parse(now)) {
    return {
      reasonCode: "negotiation_session_expired",
      reason: "Negotiation session expired before policy evaluation.",
    };
  }
  if (offer.expiresAt && Date.parse(offer.expiresAt) <= Date.parse(now)) {
    return {
      reasonCode: "negotiation_offer_expired",
      reason: "Negotiation offer expired before policy evaluation.",
    };
  }
  if (offer.offerContentDigest !== agreement.acceptedOfferContentDigest) {
    return {
      reasonCode: "linked_agreement_digest_mismatch",
      reason: "Accepted offer digest drifted before policy evaluation.",
    };
  }
  return null;
}

async function loadAgreementSession(
  store: ProtocolStore,
  agreement: LinkedAgreement,
): Promise<NegotiationSession | null> {
  const record = await store.getRecord<NegotiationSession>("negotiation_session", agreement.negotiationSessionId);
  return record && sameScope(record.payload, agreement) ? record.payload : null;
}

async function loadAgreementOffer(store: ProtocolStore, agreement: LinkedAgreement): Promise<NegotiationOffer | null> {
  const records = await store.listRecordsByType<NegotiationOffer>("negotiation_offer", {
    tenantId: agreement.tenantId,
    organizationId: agreement.organizationId,
  });
  return (
    records
      .map((record) => record.payload)
      .find(
        (offer) =>
          offer.negotiationSessionId === agreement.negotiationSessionId &&
          offer.offerVersionId === agreement.acceptedOfferVersionId &&
          offer.offerSequence === agreement.acceptedOfferSequence,
      ) ?? null
  );
}

function sameScope(
  left: { tenantId: string; organizationId: string },
  right: { tenantId: string; organizationId: string },
): boolean {
  return left.tenantId === right.tenantId && left.organizationId === right.organizationId;
}

function ok(policyInput: AgreementObligationPolicyInput): AgreementObligationPolicyEvaluation {
  return { ok: true, decision: "greenlight", reasonCode: null, reason: null, policyInput };
}

function refusal(
  policyInput: AgreementObligationPolicyInput,
  failure: { reasonCode: string; reason: string },
): AgreementObligationPolicyEvaluation {
  return {
    ok: false,
    decision: "refuse",
    reasonCode: failure.reasonCode,
    reason: failure.reason,
    policyInput: { ...policyInput, posture: "refused" },
  };
}

function proofGap(
  policyInput: AgreementObligationPolicyInput,
  reasonCode: string,
): AgreementObligationPolicyEvaluation {
  return {
    ok: false,
    decision: "proof_gap",
    reasonCode,
    reason:
      "ActionContract declares agreement-backed clearing evidence, but exact local obligation binding evidence is missing or incomplete.",
    policyInput: { ...policyInput, posture: "proof_gap" },
  };
}

function notApplicableInput(): AgreementObligationPolicyInput {
  return baseInput({ obligationRef: null, counterpartyRef: null, posture: "not_applicable" });
}

function baseInput(
  input: Partial<AgreementObligationPolicyInput> & {
    obligationRef: string | null;
    counterpartyRef: string | null;
  },
): AgreementObligationPolicyInput {
  return {
    posture: input.posture ?? "proof_gap",
    obligationRef: input.obligationRef,
    counterpartyRef: input.counterpartyRef,
    agreementObligationBindingId: input.agreementObligationBindingId ?? null,
    linkedAgreementId: input.linkedAgreementId ?? null,
    agreementStatus: input.agreementStatus ?? null,
    agreementExpiresAt: input.agreementExpiresAt ?? null,
    sessionExpiresAt: input.sessionExpiresAt ?? null,
    offerExpiresAt: input.offerExpiresAt ?? null,
    actionContractDigest: input.actionContractDigest ?? null,
    paramsDigest: input.paramsDigest ?? null,
  };
}
