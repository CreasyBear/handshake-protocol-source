/**
 * Phase-04 plan 04-11 / D-24 deferred maintainer lane (Phase 05 plan 05-01).
 * Frozen HTTP mutation inventory — separate from `boundary-manifest.ts` surface ownership (adjudication #7).
 * Inventories existing POST transition routes only; does not add new paths (D-50).
 */

import type { SurfaceRouteFamily } from "../surfaces/boundary-manifest";
import { transitionRouteDefinitions, type TransitionRouteDefinition } from "./routes/transition-route-registry";

export type MutationRouteDefinition = {
  readonly routeId: TransitionRouteDefinition["routeId"];
  readonly path: TransitionRouteDefinition["path"];
  readonly role: TransitionRouteDefinition["role"];
  readonly summary: TransitionRouteDefinition["summary"];
  readonly surfaceRouteFamily: SurfaceRouteFamily;
  readonly requiresAdapterGatewayCheck: true;
};

const routeFamilyById: Record<TransitionRouteDefinition["routeId"], SurfaceRouteFamily> = {
  registerToolCapability: "catalog_install_write",
  registerActionType: "catalog_install_write",
  registerGatewayRegistryEntry: "gateway_credential_write",
  registerOperatingEnvelope: "catalog_install_write",
  registerInstallProposalCompiledRecords: "catalog_install_write",
  registerGatewayCredentialRef: "gateway_credential_write",
  registerDelegatedAuthorityRef: "delegated_authority_write",
  transitionDelegatedAuthorityStatus: "delegated_authority_write",
  recordGatewayCustodyProofPacket: "gateway_credential_write",
  recordCredentialResolutionEvidence: "gateway_credential_write",
  compileIntent: "runtime_evidence_write",
  createRuntimeExecution: "runtime_evidence_write",
  proposeRuntimeIngressActionContracts: "runtime_ingress_proposal_write",
  createBypassProbe: "bypass_probe_write",
  createToolCallDraft: "tool_call_draft_write",
  transitionToolCallDraft: "tool_call_draft_write",
  createProtectedPathPosture: "protected_path_posture_write",
  proposeActionContract: "action_contract_proposal_write",
  evaluatePolicy: "policy_decision_write",
  createReviewArtifact: "runtime_evidence_write",
  createReviewDecision: "runtime_evidence_write",
  gatewayCheck: "gateway_check_write",
  reconcileSurfaceOperation: "surface_reconciliation_write",
  createIsolationState: "isolation_write",
  createBreakerDecision: "isolation_write",
  createReceiptExport: "receipt_export_write",
  createRecoveryRecommendation: "recovery_write",
  transitionRecoveryRecommendationStatus: "recovery_write",
  resolveRecoveryTerminalConflictProofGap: "recovery_write",
};

export const mutationRouteDefinitions = transitionRouteDefinitions.map((route) => ({
  routeId: route.routeId,
  path: route.path,
  role: route.role,
  summary: route.summary,
  surfaceRouteFamily: routeFamilyById[route.routeId],
  requiresAdapterGatewayCheck: true as const,
})) satisfies readonly MutationRouteDefinition[];

export function assertMutationRouteManifestParity(
  routes: readonly TransitionRouteDefinition[] = transitionRouteDefinitions,
): void {
  const manifestPaths = new Set(mutationRouteDefinitions.map((row) => row.path));
  const transitionPaths = new Set(routes.map((row) => row.path));
  const missing = [...transitionPaths].filter((path) => !manifestPaths.has(path)).sort();
  const extra = [...manifestPaths].filter((path) => !transitionPaths.has(path)).sort();
  if (missing.length > 0 || extra.length > 0) {
    throw new Error(
      `mutation-route-manifest drift: missing=${missing.join(", ") || "none"} extra=${extra.join(", ") || "none"}`,
    );
  }
  if (mutationRouteDefinitions.length !== routes.length) {
    throw new Error(
      `mutation-route-manifest count drift: manifest=${mutationRouteDefinitions.length} transitions=${routes.length}`,
    );
  }
}

assertMutationRouteManifestParity();
