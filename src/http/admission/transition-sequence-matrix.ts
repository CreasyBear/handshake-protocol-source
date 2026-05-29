import { HandshakeProtocolError } from "../../protocol/foundation/errors";
import { transitionRouteDefinitions } from "../routes/transition-route-registry";
import type { TransitionRouteId } from "../routes/transition-invokers";

// D4 (05-14): declared transition-sequence prerequisite matrix.
//
// This is an admission-layer ordering contract and drift guard, NOT a second
// policy engine. Per-request rejection of a transition whose prerequisite
// record is missing is already enforced structurally by the route registry's
// `recordScope` resolvers plus the kernel transition guards (e.g.
// `proposeActionContract` requires an `intent_compilation`, `gatewayCheck`
// requires an `action_contract`). This matrix documents the canonical
// prerequisite route(s) — the transition(s) that produce the record each route
// consumes — and `assertTransitionSequenceMatrixCoverage` fails app
// construction if the matrix drifts from the registered route set, mirroring
// `assertMutationRouteManifestParity`.
//
// Each value lists the route(s) whose output record a route's scope resolver
// directly references. Entry-point transitions (direct-body scope: catalog and
// envelope registrations, compilation, runtime-execution evidence, drafts,
// postures, isolation, breaker) have no prerequisite transition.
export const transitionSequenceMatrix: Record<TransitionRouteId, readonly TransitionRouteId[]> = {
  // Entry points — direct-body scope, no prerequisite transition.
  registerToolCapability: [],
  registerActionType: [],
  registerGatewayRegistryEntry: [],
  registerOperatingEnvelope: [],
  registerInstallProposalCompiledRecords: [],
  registerGatewayCredentialRef: [],
  registerDelegatedAuthorityRef: [],
  compileIntent: [],
  createRuntimeExecution: [],
  proposeRuntimeIngressActionContracts: [],
  createBypassProbe: [],
  createToolCallDraft: [],
  createProtectedPathPosture: [],
  createIsolationState: [],
  createBreakerDecision: [],

  // Record-scoped transitions — prerequisite = producer of the consumed record.
  transitionDelegatedAuthorityStatus: ["registerDelegatedAuthorityRef"],
  recordGatewayCustodyProofPacket: ["registerGatewayCredentialRef"],
  transitionToolCallDraft: ["createToolCallDraft"],
  proposeActionContract: ["compileIntent"],
  recordCredentialResolutionEvidence: ["proposeActionContract"],
  evaluatePolicy: ["proposeActionContract"],
  createReviewArtifact: ["proposeActionContract"],
  createReviewDecision: ["proposeActionContract"],
  gatewayCheck: ["proposeActionContract"],
  reconcileSurfaceOperation: ["gatewayCheck"],
  createReceiptExport: ["gatewayCheck"],
  createRecoveryRecommendation: ["gatewayCheck"],
  transitionRecoveryRecommendationStatus: ["createRecoveryRecommendation"],
  resolveRecoveryTerminalConflictProofGap: ["gatewayCheck"],
};

/**
 * Returns the declared prerequisite transition routes for a route id.
 */
export function prerequisiteTransitionsFor(routeId: TransitionRouteId): readonly TransitionRouteId[] {
  return transitionSequenceMatrix[routeId] ?? [];
}

/**
 * Construction-time structural guard (D4). Verifies the sequence matrix stays
 * consistent with the registered transition route set:
 * - every registered route has exactly one matrix entry (coverage),
 * - every prerequisite references a registered route (referential integrity),
 * - the prerequisite graph is acyclic (no transition depends on itself).
 *
 * This catches matrix/registry drift the moment a new transition route is added
 * without a declared prerequisite, exactly like the mutation-route manifest
 * parity check. It does not authorize or re-evaluate any request.
 */
export function assertTransitionSequenceMatrixCoverage(): void {
  const registeredRouteIds = new Set<TransitionRouteId>(transitionRouteDefinitions.map((route) => route.routeId));
  const matrixRouteIds = new Set(Object.keys(transitionSequenceMatrix) as TransitionRouteId[]);

  for (const routeId of registeredRouteIds) {
    if (!matrixRouteIds.has(routeId)) {
      throw new HandshakeProtocolError(
        "transition_sequence_matrix_incomplete",
        `Transition route ${routeId} has no declared sequence-matrix entry.`,
        500,
        { retryability: "terminal", commitState: "not_started" },
      );
    }
  }
  for (const routeId of matrixRouteIds) {
    if (!registeredRouteIds.has(routeId)) {
      throw new HandshakeProtocolError(
        "transition_sequence_matrix_orphan",
        `Sequence-matrix entry ${routeId} does not map to a registered transition route.`,
        500,
        { retryability: "terminal", commitState: "not_started" },
      );
    }
    for (const prerequisite of transitionSequenceMatrix[routeId]) {
      if (!registeredRouteIds.has(prerequisite)) {
        throw new HandshakeProtocolError(
          "transition_sequence_matrix_unknown_prerequisite",
          `Sequence-matrix entry ${routeId} references unknown prerequisite ${prerequisite}.`,
          500,
          { retryability: "terminal", commitState: "not_started" },
        );
      }
    }
  }
  assertAcyclicSequenceMatrix();
}

function assertAcyclicSequenceMatrix(): void {
  const visiting = new Set<TransitionRouteId>();
  const settled = new Set<TransitionRouteId>();

  const walk = (routeId: TransitionRouteId, trail: readonly TransitionRouteId[]): void => {
    if (settled.has(routeId)) return;
    if (visiting.has(routeId)) {
      throw new HandshakeProtocolError(
        "transition_sequence_matrix_cycle",
        `Transition sequence matrix has a prerequisite cycle: ${[...trail, routeId].join(" -> ")}.`,
        500,
        { retryability: "terminal", commitState: "not_started" },
      );
    }
    visiting.add(routeId);
    for (const prerequisite of transitionSequenceMatrix[routeId] ?? []) {
      walk(prerequisite, [...trail, routeId]);
    }
    visiting.delete(routeId);
    settled.add(routeId);
  };

  for (const routeId of Object.keys(transitionSequenceMatrix) as TransitionRouteId[]) {
    walk(routeId, []);
  }
}
