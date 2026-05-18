import type { PolicyEvaluationResult } from "./policy";
import type {
  ActionContract,
  Greenlight,
  PolicyDecision,
  Receipt,
} from "./schemas";
import type { ProtocolStore } from "../storage/store";

export type SequenceDependencyStatus = "greenlit" | "missing" | "refused" | "not_greenlit";
export type ReceiverGateSequenceDependencyStatus =
  | "ready"
  | "missing"
  | "refused"
  | "not_greenlit"
  | "not_receipted"
  | "gate_refused"
  | "not_final";

export type SequenceDependencyState = {
  requiredPriorActionContractId: string;
  status: SequenceDependencyStatus;
  policyDecisionId: string | null;
  policyDecisionValue: PolicyDecision["decision"] | null;
  greenlightId: string | null;
};

export type ReceiverGateSequenceDependencyState = Omit<SequenceDependencyState, "status"> & {
  status: ReceiverGateSequenceDependencyStatus;
  receiptId: string | null;
  receiverGateStatus: Receipt["receiverGateStatus"] | null;
  finalityStatus: Receipt["finalityStatus"] | null;
};

export async function loadSequenceDependencyStates(
  store: ProtocolStore,
  contract: ActionContract,
): Promise<SequenceDependencyState[]> {
  if (contract.requiredPriorActionContractIds.length === 0) return [];
  const [policyDecisionRecords, greenlightRecords] = await Promise.all([
    store.listRecordsByType<PolicyDecision>("policy_decision", {
      tenantId: contract.tenantId,
      organizationId: contract.organizationId,
    }),
    store.listRecordsByType<Greenlight>("greenlight", {
      tenantId: contract.tenantId,
      organizationId: contract.organizationId,
    }),
  ]);

  const states: SequenceDependencyState[] = [];
  for (const requiredPriorActionContractId of contract.requiredPriorActionContractIds) {
    const requiredContract = await store.getRecord<ActionContract>("action_contract", requiredPriorActionContractId);
    if (!requiredContract || !sameProtocolScope(contract, requiredContract.payload)) {
      states.push({
        requiredPriorActionContractId,
        status: "missing",
        policyDecisionId: null,
        policyDecisionValue: null,
        greenlightId: null,
      });
      continue;
    }

    const greenlight = greenlightRecords
      .map((record) => record.payload)
      .find((candidate) => candidate.actionContractId === requiredPriorActionContractId);
    const policyDecision = policyDecisionRecords
      .map((record) => record.payload)
      .find((candidate) => candidate.actionContractId === requiredPriorActionContractId);

    states.push({
      requiredPriorActionContractId,
      status: greenlight ? "greenlit" : policyDecision?.decision === "refuse" ? "refused" : "not_greenlit",
      policyDecisionId: policyDecision?.policyDecisionId ?? null,
      policyDecisionValue: policyDecision?.decision ?? null,
      greenlightId: greenlight?.greenlightId ?? null,
    });
  }
  return states;
}

export function evaluateSequenceDependencies(
  states: SequenceDependencyState[],
): PolicyEvaluationResult | null {
  const failedState = states.find((state) => state.status !== "greenlit");
  if (!failedState) return null;
  return {
    decision: "refuse",
    reasonCode: `prior_action_${failedState.status}`,
    reason: `Required prior action contract ${failedState.requiredPriorActionContractId} is ${failedState.status}.`,
    matchedRuleIds: ["sequence_dependency_greenlit"],
  };
}

export async function loadReceiverGateSequenceDependencyStates(
  store: ProtocolStore,
  contract: ActionContract,
): Promise<ReceiverGateSequenceDependencyState[]> {
  if (contract.requiredPriorActionContractIds.length === 0) return [];
  const [policyDecisionRecords, greenlightRecords, receiptRecords] = await Promise.all([
    store.listRecordsByType<PolicyDecision>("policy_decision", {
      tenantId: contract.tenantId,
      organizationId: contract.organizationId,
    }),
    store.listRecordsByType<Greenlight>("greenlight", {
      tenantId: contract.tenantId,
      organizationId: contract.organizationId,
    }),
    store.listRecordsByType<Receipt>("receipt", {
      tenantId: contract.tenantId,
      organizationId: contract.organizationId,
    }),
  ]);

  const states: ReceiverGateSequenceDependencyState[] = [];
  for (const requiredPriorActionContractId of contract.requiredPriorActionContractIds) {
    const requiredContract = await store.getRecord<ActionContract>("action_contract", requiredPriorActionContractId);
    if (!requiredContract || !sameProtocolScope(contract, requiredContract.payload)) {
      states.push(receiverGateSequenceState(requiredPriorActionContractId, "missing"));
      continue;
    }

    const greenlight = greenlightRecords
      .map((record) => record.payload)
      .find((candidate) => candidate.actionContractId === requiredPriorActionContractId);
    const policyDecision = policyDecisionRecords
      .map((record) => record.payload)
      .find((candidate) => candidate.actionContractId === requiredPriorActionContractId);
    if (!greenlight) {
      states.push(
        receiverGateSequenceState(
          requiredPriorActionContractId,
          policyDecision?.decision === "refuse" ? "refused" : "not_greenlit",
          policyDecision ?? null,
          null,
          null,
        ),
      );
      continue;
    }

    const receipts = receiptRecords
      .map((record) => record.payload)
      .filter((receipt) => receipt.actionContractId === requiredPriorActionContractId);
    const finalPassedReceipt = receipts.find(
      (receipt) => receipt.receiverGateStatus === "passed" && receipt.finalityStatus === "final",
    );
    if (finalPassedReceipt) {
      states.push(
        receiverGateSequenceState(
          requiredPriorActionContractId,
          "ready",
          policyDecision ?? null,
          greenlight,
          finalPassedReceipt,
        ),
      );
      continue;
    }

    const latestReceipt = receipts.at(-1) ?? null;
    states.push(
      receiverGateSequenceState(
        requiredPriorActionContractId,
        latestReceipt
          ? latestReceipt.receiverGateStatus === "refused"
            ? "gate_refused"
            : "not_final"
          : "not_receipted",
        policyDecision ?? null,
        greenlight,
        latestReceipt,
      ),
    );
  }
  return states;
}

export function receiverGateSequenceDependencyRefusalReason(
  states: ReceiverGateSequenceDependencyState[],
): string | null {
  const failedState = states.find((state) => state.status !== "ready");
  if (!failedState) return null;
  return `prior_action_${failedState.status}`;
}

function receiverGateSequenceState(
  requiredPriorActionContractId: string,
  status: ReceiverGateSequenceDependencyStatus,
  policyDecision: PolicyDecision | null = null,
  greenlight: Greenlight | null = null,
  receipt: Receipt | null = null,
): ReceiverGateSequenceDependencyState {
  return {
    requiredPriorActionContractId,
    status,
    policyDecisionId: policyDecision?.policyDecisionId ?? null,
    policyDecisionValue: policyDecision?.decision ?? null,
    greenlightId: greenlight?.greenlightId ?? null,
    receiptId: receipt?.receiptId ?? null,
    receiverGateStatus: receipt?.receiverGateStatus ?? null,
    finalityStatus: receipt?.finalityStatus ?? null,
  };
}

function sameProtocolScope(contract: ActionContract, priorContract: ActionContract): boolean {
  return contract.tenantId === priorContract.tenantId && contract.organizationId === priorContract.organizationId;
}
