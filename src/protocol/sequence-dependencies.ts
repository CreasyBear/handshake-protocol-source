import type { PolicyEvaluationResult } from "./policy";
import type {
  ActionContract,
  Greenlight,
  PolicyDecision,
  Receipt,
  SurfaceOperationReconciliation,
} from "./schemas";
import type { ProtocolStore } from "../storage/store";

export type SequenceDependencyStatus = "greenlit" | "missing" | "refused" | "not_greenlit";
export type GatewayCheckSequenceDependencyStatus =
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

export type GatewayCheckSequenceDependencyState = Omit<SequenceDependencyState, "status"> & {
  status: GatewayCheckSequenceDependencyStatus;
  receiptId: string | null;
  gatewayCheckStatus: Receipt["gatewayCheckStatus"] | null;
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

export async function loadGatewayCheckSequenceDependencyStates(
  store: ProtocolStore,
  contract: ActionContract,
): Promise<GatewayCheckSequenceDependencyState[]> {
  if (contract.requiredPriorActionContractIds.length === 0) return [];
  const [policyDecisionRecords, greenlightRecords, receiptRecords, reconciliationRecords] = await Promise.all([
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
    store.listRecordsByType<SurfaceOperationReconciliation>("surface_operation_reconciliation", {
      tenantId: contract.tenantId,
      organizationId: contract.organizationId,
    }),
  ]);

  const states: GatewayCheckSequenceDependencyState[] = [];
  for (const requiredPriorActionContractId of contract.requiredPriorActionContractIds) {
    const requiredContract = await store.getRecord<ActionContract>("action_contract", requiredPriorActionContractId);
    if (!requiredContract || !sameProtocolScope(contract, requiredContract.payload)) {
      states.push(gatewayCheckSequenceState(requiredPriorActionContractId, "missing"));
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
        gatewayCheckSequenceState(
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
      (receipt) =>
        receipt.gatewayCheckStatus === "passed" &&
        (receipt.finalityStatus === "final" ||
          reconciliationRecords
            .map((record) => record.payload)
            .some(
              (reconciliation) =>
                reconciliation.mutationAttemptId === receipt.mutationAttemptId &&
                reconciliation.finalityStatus === "final",
            )),
    );
    if (finalPassedReceipt) {
      states.push(
        gatewayCheckSequenceState(
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
    const latestReconciliation = latestReceipt?.mutationAttemptId
      ? reconciliationRecords
          .map((record) => record.payload)
          .filter((reconciliation) => reconciliation.mutationAttemptId === latestReceipt.mutationAttemptId)
          .at(-1) ?? null
      : null;
    states.push(
      gatewayCheckSequenceState(
        requiredPriorActionContractId,
        latestReceipt
          ? latestReceipt.gatewayCheckStatus === "refused"
            ? "gate_refused"
            : "not_final"
          : "not_receipted",
        policyDecision ?? null,
        greenlight,
        latestReceipt,
        latestReconciliation,
      ),
    );
  }
  return states;
}

export function gatewayCheckSequenceDependencyRefusalReason(
  states: GatewayCheckSequenceDependencyState[],
): string | null {
  const failedState = states.find((state) => state.status !== "ready");
  if (!failedState) return null;
  return `prior_action_${failedState.status}`;
}

function gatewayCheckSequenceState(
  requiredPriorActionContractId: string,
  status: GatewayCheckSequenceDependencyStatus,
  policyDecision: PolicyDecision | null = null,
  greenlight: Greenlight | null = null,
  receipt: Receipt | null = null,
  reconciliation: SurfaceOperationReconciliation | null = null,
): GatewayCheckSequenceDependencyState {
  return {
    requiredPriorActionContractId,
    status,
    policyDecisionId: policyDecision?.policyDecisionId ?? null,
    policyDecisionValue: policyDecision?.decision ?? null,
    greenlightId: greenlight?.greenlightId ?? null,
    receiptId: receipt?.receiptId ?? null,
    gatewayCheckStatus: receipt?.gatewayCheckStatus ?? null,
    finalityStatus: reconciliation?.finalityStatus ?? receipt?.finalityStatus ?? null,
  };
}

function sameProtocolScope(contract: ActionContract, priorContract: ActionContract): boolean {
  return contract.tenantId === priorContract.tenantId && contract.organizationId === priorContract.organizationId;
}
