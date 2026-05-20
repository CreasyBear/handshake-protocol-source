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

export type HttpTransitionNavigationEntry = {
  routeId: TransitionRouteId;
  transitionId: ProtocolTransitionId;
  method: "POST";
  path: `/v0.2/${string}`;
  role: TransitionCallerRole;
  kernelMethod: ProtocolNavigationEntry["kernelMethod"];
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
  const transition = protocolNavigationByTransitionId[route.routeId as ProtocolTransitionId];
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
