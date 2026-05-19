import type { HandshakeKernel } from "../../protocol/kernel";

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
  compileIntent: (kernel, body) => kernel.compileIntent(body as never),
  createRuntimeExecution: (kernel, body) => kernel.createRuntimeExecution(body as never),
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
