import type { HandshakeKernel } from "../../protocol/kernel";
import {
  RuntimeIngressProposalInputSchema,
  type RuntimeIngressConfig,
  proposeRuntimeIngressActionContracts as proposeRuntimeIngressActionContractsTransition,
} from "../../runtime/ingress";

export type TransitionInvoker = (kernel: HandshakeKernel, body: unknown) => Promise<unknown>;

export const transitionInvokers = {
  registerToolCapability: async (kernel, body) => {
    await kernel.putCatalogObject({ objectType: "tool_capability", payload: body as never });
    return body;
  },
  registerActionType: async (kernel, body) => {
    await kernel.putCatalogObject({ objectType: "action_type", payload: body as never });
    return body;
  },
  registerGatewayRegistryEntry: async (kernel, body) => {
    await kernel.putCatalogObject({ objectType: "gateway_registry_entry", payload: body as never });
    return body;
  },
  registerOperatingEnvelope: async (kernel, body) => {
    await kernel.putCatalogObject({ objectType: "operating_envelope", payload: body as never });
    return body;
  },
  registerInstallProposalCompiledRecords: (kernel, body) =>
    kernel.registerInstallProposalCompiledRecords(body as never),
  registerGatewayCredentialRef: (kernel, body) => kernel.registerGatewayCredentialRef(body as never),
  registerDelegatedAuthorityRef: (kernel, body) => kernel.registerDelegatedAuthorityRef(body as never),
  transitionDelegatedAuthorityStatus: (kernel, body) => kernel.transitionDelegatedAuthorityStatus(body as never),
  recordGatewayCustodyProofPacket: (kernel, body) => kernel.recordGatewayCustodyProofPacket(body as never),
  recordCredentialResolutionEvidence: (kernel, body) => kernel.recordCredentialResolutionEvidence(body as never),
  compileIntent: (kernel, body) => kernel.compileIntent(body as never),
  createRuntimeExecution: (kernel, body) => kernel.createRuntimeExecution(body as never),
  proposeRuntimeIngressActionContracts: (kernel, body) => {
    const input = RuntimeIngressProposalInputSchema.parse(body);
    const config: RuntimeIngressConfig = {
      ...(input.config.packageInstall ? { packageInstall: input.config.packageInstall } : {}),
      ...(input.config.x402Payment ? { x402Payment: input.config.x402Payment } : {}),
      ...(input.config.authMdProtectedApiCall ? { authMdProtectedApiCall: input.config.authMdProtectedApiCall } : {}),
    };
    return proposeRuntimeIngressActionContractsTransition(kernel, config, input.dispatchBlock);
  },
  createBypassProbe: (kernel, body) => kernel.createBypassProbe(body as never),
  createToolCallDraft: (kernel, body) => kernel.createToolCallDraft(body as never),
  transitionToolCallDraft: (kernel, body) => kernel.transitionToolCallDraft(body as never),
  createProtectedPathPosture: (kernel, body) => kernel.createProtectedPathPosture(body as never),
  proposeActionContract: (kernel, body) => kernel.proposeActionContract(body as never),
  evaluatePolicy: (kernel, body) => kernel.evaluatePolicy(body as never),
  createReviewArtifact: (kernel, body) => kernel.createReviewArtifact(body as never),
  createReviewDecision: (kernel, body) => kernel.createReviewDecision(body as never),
  gatewayCheck: (kernel, body) => kernel.gatewayCheck(body as never),
  reconcileSurfaceOperation: (kernel, body) => kernel.reconcileSurfaceOperation(body as never),
  createIsolationState: (kernel, body) => kernel.createIsolationState(body as never),
  createBreakerDecision: (kernel, body) => kernel.createBreakerDecision(body as never),
  createReceiptExport: (kernel, body) => kernel.createReceiptExport(body as never),
  createRecoveryRecommendation: (kernel, body) => kernel.createRecoveryRecommendation(body as never),
  transitionRecoveryRecommendationStatus: (kernel, body) =>
    kernel.transitionRecoveryRecommendationStatus(body as never),
  resolveRecoveryTerminalConflictProofGap: (kernel, body) =>
    kernel.resolveRecoveryTerminalConflictProofGap(body as never),
} satisfies Record<string, TransitionInvoker>;

export type TransitionRouteId = keyof typeof transitionInvokers;
