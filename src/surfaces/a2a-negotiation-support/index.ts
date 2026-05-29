import type { ActionContract } from "../../protocol/areas/action-contract";
import type {
  AgreementObligationBinding,
  AgreementStatusTransition,
  LinkedAgreement,
  NegotiationDecision,
  NegotiationOffer,
  NegotiationSession,
} from "../../protocol/areas/negotiation";
import { currentAgreementStatus } from "../../protocol/areas/negotiation";
import { assembleAgentTransactionEnvelope } from "../../protocol/evidence-projections/assembly";
import { HandshakeProtocolError } from "../../protocol/foundation/errors";
import type { ProtocolStore } from "../../protocol/store/port";

type TransactionEnvelopeResult =
  | {
      status: "assembled";
      reasonCode: null;
      reason: null;
      transaction: Awaited<ReturnType<typeof assembleAgentTransactionEnvelope>>;
    }
  | {
      status: "failed";
      reasonCode: string;
      reason: string;
      transaction: null;
    };

export type A2ANegotiationSupportPacket = {
  packetKind: "a2a_negotiation_support_packet";
  actionContractId: string;
  actionContractDigest: string;
  paramsDigest: string;
  actionClass: string;
  resourceRef: string;
  agreement: {
    linkedAgreementId: string;
    agreementDigest: string;
    agreementStatus: AgreementStatusTransition["fromStatus"] | AgreementStatusTransition["toStatus"];
    obligationRef: string | null;
    counterpartyRef: string;
    evidencePosture: "local_evidence_only";
  } | null;
  obligationBinding: {
    agreementObligationBindingId: string;
    obligationRef: string;
    actionContractDigest: string;
    paramsDigest: string;
    counterpartyRef: string;
  } | null;
  negotiation: {
    negotiationSessionId: string;
    acceptedOfferVersionId: string;
    acceptedNegotiationDecisionId: string;
    acceptedOfferContentDigest: string;
    partyRefs: string[];
  } | null;
  lifecycle: {
    assemblyStatus: TransactionEnvelopeResult["status"];
    assemblyReasonCode: string | null;
    assemblyReason: string | null;
    policyDecisionId: string | null;
    policyDecision: string | null;
    greenlightId: string | null;
    gatewayCheckAttemptId: string | null;
    mutationAttemptId: string | null;
    receiptId: string | null;
    downstreamFinalityStatus: string | null;
    proofGapIds: string[];
    refusalIds: string[];
  };
  authorityBoundary: {
    agreementAcceptanceCreatedAuthority: false;
    obligationBindingCreatedAuthority: false;
    policyMayCreateOneUseGreenlight: boolean;
    gatewayCheckRemainsFinalEnforcementPoint: true;
    downstreamSuccessClaimedByAgreement: false;
  };
  redaction: {
    rawTranscriptIncluded: false;
    rawOfferTermsIncluded: false;
    paymentPayloadIncluded: false;
    paymentSignatureIncluded: false;
    credentialMaterialIncluded: false;
  };
};

export async function buildA2ANegotiationSupportPacket(
  store: ProtocolStore,
  actionContractId: string,
): Promise<A2ANegotiationSupportPacket> {
  const contractRecord = await store.getRecord<ActionContract>("action_contract", actionContractId);
  if (!contractRecord) {
    throw new HandshakeProtocolError(
      "contract_missing",
      "A2A negotiation support packet requires an action contract.",
      404,
    );
  }
  const contract = contractRecord.payload;
  const binding = await exactBindingForContract(store, contract);
  const agreement = binding
    ? ((await store.getRecord<LinkedAgreement>("linked_agreement", binding.linkedAgreementId))?.payload ?? null)
    : null;
  const session = agreement
    ? ((await store.getRecord<NegotiationSession>("negotiation_session", agreement.negotiationSessionId))?.payload ??
      null)
    : null;
  const decision = agreement
    ? ((await store.getRecord<NegotiationDecision>("negotiation_decision", agreement.acceptedNegotiationDecisionId))
        ?.payload ?? null)
    : null;
  const offer = agreement && session ? await offerForAgreement(store, agreement) : null;
  const agreementStatus = agreement ? await currentAgreementStatus(store, agreement) : null;
  const transactionResult = await transactionEnvelopeResult(store, contract);
  const transaction = transactionResult.transaction;

  return {
    packetKind: "a2a_negotiation_support_packet",
    actionContractId: contract.actionContractId,
    actionContractDigest: contract.actionContractDigest,
    paramsDigest: contract.paramsDigest,
    actionClass: contract.actionClass,
    resourceRef: contract.resourceRef,
    agreement:
      agreement && agreementStatus
        ? {
            linkedAgreementId: agreement.linkedAgreementId,
            agreementDigest: agreement.agreementDigest,
            agreementStatus,
            obligationRef: agreement.clearingEvidenceRefs.obligationRef ?? null,
            counterpartyRef: agreement.counterpartyRef,
            evidencePosture: agreement.agreementEvidencePosture,
          }
        : null,
    obligationBinding: binding
      ? {
          agreementObligationBindingId: binding.agreementObligationBindingId,
          obligationRef: binding.obligationRef,
          actionContractDigest: binding.actionContractDigest,
          paramsDigest: binding.paramsDigest,
          counterpartyRef: binding.counterpartyRef,
        }
      : null,
    negotiation:
      agreement && session && decision && offer
        ? {
            negotiationSessionId: agreement.negotiationSessionId,
            acceptedOfferVersionId: agreement.acceptedOfferVersionId,
            acceptedNegotiationDecisionId: agreement.acceptedNegotiationDecisionId,
            acceptedOfferContentDigest: offer.offerContentDigest,
            partyRefs: session.parties.map((party) => party.agentRef).sort(),
          }
        : null,
    lifecycle: {
      assemblyStatus: transactionResult.status,
      assemblyReasonCode: transactionResult.reasonCode,
      assemblyReason: transactionResult.reason,
      policyDecisionId: transaction?.input.policyDecision.policyDecisionId ?? null,
      policyDecision: transaction?.input.policyDecision.decision ?? null,
      greenlightId: transaction?.input.greenlight?.greenlightId ?? null,
      gatewayCheckAttemptId: transaction?.input.gateAttempt?.gateAttemptId ?? null,
      mutationAttemptId: transaction?.input.mutationAttempt?.mutationAttemptId ?? null,
      receiptId: transaction?.input.receipt?.receiptId ?? null,
      downstreamFinalityStatus: transaction?.input.reconciliations?.[0]?.finalityStatus ?? null,
      proofGapIds: transaction?.input.proofGaps?.map((proofGap) => proofGap.proofGapId).sort() ?? [],
      refusalIds: transaction?.input.refusals?.map((refusal) => refusal.refusalId).sort() ?? [],
    },
    authorityBoundary: {
      agreementAcceptanceCreatedAuthority: false,
      obligationBindingCreatedAuthority: false,
      policyMayCreateOneUseGreenlight: Boolean(transaction?.input.greenlight),
      gatewayCheckRemainsFinalEnforcementPoint: true,
      downstreamSuccessClaimedByAgreement: false,
    },
    redaction: {
      rawTranscriptIncluded: false,
      rawOfferTermsIncluded: false,
      paymentPayloadIncluded: false,
      paymentSignatureIncluded: false,
      credentialMaterialIncluded: false,
    },
  };
}

async function exactBindingForContract(
  store: ProtocolStore,
  contract: ActionContract,
): Promise<AgreementObligationBinding | null> {
  const obligationRef = contract.clearingEvidenceRefs.obligationRef ?? null;
  if (!obligationRef) return null;
  const records = await store.listRecordsByActionContract<AgreementObligationBinding>(
    "agreement_obligation_binding",
    contract.actionContractId,
    { tenantId: contract.tenantId, organizationId: contract.organizationId },
  );
  return (
    records
      .map((record) => record.payload)
      .find(
        (binding) =>
          binding.actionContractId === contract.actionContractId &&
          binding.obligationRef === obligationRef &&
          binding.actionContractDigest === contract.actionContractDigest,
      ) ?? null
  );
}

async function offerForAgreement(store: ProtocolStore, agreement: LinkedAgreement): Promise<NegotiationOffer | null> {
  const offers = await store.listRecordsByType<NegotiationOffer>("negotiation_offer", {
    tenantId: agreement.tenantId,
    organizationId: agreement.organizationId,
  });
  return (
    offers
      .map((record) => record.payload)
      .find(
        (offer) =>
          offer.negotiationSessionId === agreement.negotiationSessionId &&
          offer.offerVersionId === agreement.acceptedOfferVersionId &&
          offer.offerSequence === agreement.acceptedOfferSequence,
      ) ?? null
  );
}

async function transactionEnvelopeResult(
  store: ProtocolStore,
  contract: ActionContract,
): Promise<TransactionEnvelopeResult> {
  try {
    return {
      status: "assembled",
      reasonCode: null,
      reason: null,
      transaction: await assembleAgentTransactionEnvelope(store, contract),
    };
  } catch (error) {
    return {
      status: "failed",
      reasonCode: error instanceof HandshakeProtocolError ? error.code : "a2a_lifecycle_assembly_failed",
      reason: error instanceof Error ? error.message : "A2A support packet lifecycle assembly failed.",
      transaction: null,
    };
  }
}
