import type { ActionContract } from "../areas/action-contract";
import { HandshakeProtocolError } from "../foundation/errors";
import type { ProtocolStore } from "../store/port";
import { assembleAgentTransactionEnvelopeInput } from "./assembly";
import {
  projectOperationCorrelationIndex,
  projectOperationReadback,
} from "./projections";
import type { OperationCorrelationIndex, OperationReadbackProjection } from "./schemas";

export type ProtocolStoreEvidenceProjectionReader = {
  getOperationReadbackProjection(actionContractId: string): Promise<OperationReadbackProjection>;
  getOperationCorrelationIndex(actionContractId: string): Promise<OperationCorrelationIndex>;
};

export function protocolStoreEvidenceProjectionReader(store: ProtocolStore): ProtocolStoreEvidenceProjectionReader {
  return {
    async getOperationReadbackProjection(actionContractId) {
      const input = await assembleAgentTransactionEnvelopeInput(store, await actionContractFor(store, actionContractId));
      return projectOperationReadback(input);
    },
    async getOperationCorrelationIndex(actionContractId) {
      const input = await assembleAgentTransactionEnvelopeInput(store, await actionContractFor(store, actionContractId));
      return projectOperationCorrelationIndex(input);
    },
  };
}

async function actionContractFor(store: ProtocolStore, actionContractId: string): Promise<ActionContract> {
  const record = await store.getRecord<ActionContract>("action_contract", actionContractId);
  if (!record) {
    throw new HandshakeProtocolError("action_contract_missing", "Action contract not found for evidence readback.", 404, {
      retryability: "terminal",
      commitState: "not_applicable",
    });
  }
  return record.payload;
}
