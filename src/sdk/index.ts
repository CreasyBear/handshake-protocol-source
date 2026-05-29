export {
  ControlPlaneClient,
  EvidenceClient,
  GatewayClient,
  PolicyClient,
  HandshakeClientError,
  type ControlPlaneClientOptions,
  type EvidenceClientOptions,
  type EvidenceClientRole,
  type GatewayClientCheckResult,
  type GatewayClientOptions,
  type GatewayClientReconciliationResult,
  type HandshakeFetch,
  type PolicyClientEvaluationResult,
  type PolicyClientOptions,
} from "./surface-clients/index";
export { explainHandshakeError, type HandshakeErrorExplanation } from "./repair";
