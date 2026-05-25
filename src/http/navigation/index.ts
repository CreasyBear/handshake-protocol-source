import {
  protocolNavigationByTransitionId,
  type ProtocolNavigationEntry,
  type ProtocolTransitionId,
} from "../../protocol/navigation";
import type { ProtocolObjectType } from "../../protocol/public/schemas";
import type { TransitionCallerRole } from "../admission/caller-auth";
import { evidenceReadRouteDefinitions, type EvidenceReadRouteId } from "../routes/evidence-read-route-registry";
import { transitionRouteDefinitions } from "../routes/transition-route-registry";
import type { TransitionRouteId } from "../routes/transition-invokers";

type CompositeTransitionRouteId = Extract<TransitionRouteId, "proposeRuntimeIngressActionContracts">;

export type HttpTransitionNavigationEntry = {
  routeId: TransitionRouteId;
  transitionId: ProtocolTransitionId | CompositeTransitionRouteId;
  method: "POST";
  path: `/v0.2/${string}`;
  role: TransitionCallerRole;
  kernelMethod: ProtocolNavigationEntry["kernelMethod"] | "composite_runtime_ingress_proposal";
  phase: ProtocolNavigationEntry["phase"];
  outcomeClasses: ProtocolNavigationEntry["outcomeClasses"];
  recordsWritten: ProtocolNavigationEntry["recordsWritten"];
  authorityBoundary: ProtocolNavigationEntry["authorityBoundary"];
};

export type EvidenceReadNavigationEntry = {
  routeId: EvidenceReadRouteId;
  method: "GET";
  honoPath: `/v0.2/${string}`;
  openApiPath: `/v0.2/${string}`;
  roles: readonly TransitionCallerRole[];
  readOnly: true;
  diagnosticOnly: true;
  recordsWritten: readonly ProtocolObjectType[];
};

export const httpTransitionNavigation = transitionRouteDefinitions.map((route) => {
  const transition = httpTransitionNavigationEntryFor(route.routeId);
  return {
    routeId: route.routeId,
    transitionId: transition.transitionId,
    method: "POST",
    path: route.path,
    role: route.role,
    kernelMethod: transition.kernelMethod,
    phase: transition.phase,
    outcomeClasses: transition.outcomeClasses,
    recordsWritten: transition.recordsWritten,
    authorityBoundary: transition.authorityBoundary,
  };
}) satisfies readonly HttpTransitionNavigationEntry[];

export const evidenceReadNavigation = evidenceReadRouteDefinitions.map((route) => ({
  routeId: route.routeId,
  method: "GET",
  honoPath: route.honoPath,
  openApiPath: route.openApiPath,
  roles: route.roles,
  readOnly: true,
  diagnosticOnly: true,
  recordsWritten: [],
})) satisfies readonly EvidenceReadNavigationEntry[];

function httpTransitionNavigationEntryFor(
  routeId: TransitionRouteId,
): Pick<
  HttpTransitionNavigationEntry,
  "transitionId" | "kernelMethod" | "phase" | "outcomeClasses" | "recordsWritten" | "authorityBoundary"
> {
  if (routeId === "proposeRuntimeIngressActionContracts") {
    return {
      transitionId: routeId,
      kernelMethod: "composite_runtime_ingress_proposal",
      phase: "runtime_evidence",
      outcomeClasses: ["recorded", "refusal"],
      recordsWritten: [
        "runtime_execution",
        "generated_execution_graph",
        "tool_call_draft",
        "intent_compilation",
        "action_contract",
        "contract_stream_event",
      ],
      authorityBoundary: "runtime ingress proposal evidence only",
    };
  }
  return protocolNavigationByTransitionId[routeId as ProtocolTransitionId];
}
