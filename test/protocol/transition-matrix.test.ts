import { describe, expect, it } from "bun:test";
import { httpTransitionNavigation } from "../../src/http/navigation";
import { transitionInvokers } from "../../src/http/routes/transition-invokers";
import { transitionRouteDefinitions } from "../../src/http/routes/transition-route-registry";
import { ContractStreamEventSchema } from "../../src/protocol/events/schemas";
import { HandshakeKernel } from "../../src/protocol/kernel";
import {
  protocolKernelMethods,
  protocolNavigation,
  protocolNavigationByTransitionId,
} from "../../src/protocol/navigation";
import { protocolObjectTypes } from "../../src/protocol/areas/object-registry";

describe("foundation transition matrix", () => {
  it("covers every public transition route and invoker exactly once", () => {
    const navigationIds = protocolNavigation
      .filter((entry) => !kernelOnlyTransitionIds.has(entry.transitionId))
      .map((entry) => String(entry.transitionId))
      .sort();
    const routeIds = transitionRouteDefinitions.map((route) => String(route.routeId)).sort();
    const protocolBackedRouteIds = transitionRouteDefinitions
      .filter((route) => route.routeId !== "proposeRuntimeIngressActionContracts")
      .map((route) => String(route.routeId))
      .sort();
    const invokerIds = Object.keys(transitionInvokers).sort();

    expect(navigationIds).toEqual(protocolBackedRouteIds);
    expect(routeIds).toEqual(invokerIds);
    expect(new Set(navigationIds).size).toBe(navigationIds.length);
  });

  it("derives HTTP navigation path and caller custody from the HTTP route registry", () => {
    for (const route of transitionRouteDefinitions) {
      const entry = httpTransitionNavigation.find((candidate) => candidate.routeId === route.routeId);
      expect(entry?.path).toBe(route.path);
      expect(entry?.role).toBe(route.role);
      expect(entry?.transitionId).toBe(route.routeId);
    }
  });

  it("covers every public kernel transition method", () => {
    const publicKernelMethods = Object.getOwnPropertyNames(HandshakeKernel.prototype)
      .filter((method) => method !== "constructor" && method !== "assertTransition")
      .sort();

    expect(protocolKernelMethods().map(String)).toEqual(publicKernelMethods);
  });

  it("declares records, events, outcomes, authority boundaries, and evidence obligations", () => {
    const allowedEvents = new Set(ContractStreamEventSchema.shape.eventType.options);
    const allowedObjectTypes = new Set(protocolObjectTypes);

    for (const entry of protocolNavigation) {
      expect(entry.outcomeClasses.length).toBeGreaterThan(0);
      expect(entry.recordsWritten.length).toBeGreaterThan(0);
      expect(entry.authorityBoundary.length).toBeGreaterThan(0);
      expect(entry.evidenceObligation.length).toBeGreaterThan(0);

      for (const objectType of entry.recordsWritten) {
        expect(allowedObjectTypes.has(objectType)).toBe(true);
      }
      for (const eventType of entry.eventsEmitted) {
        expect(allowedEvents.has(eventType)).toBe(true);
      }
    }
  });

  it("keeps authority-bearing transitions explicit about non-authority evidence", () => {
    const nonAuthorityTransitions = [
      "compileIntent",
      "createRuntimeExecution",
      "createGeneratedExecutionGraph",
      "registerInstallProposalCompiledRecords",
      "registerDelegatedAuthorityRef",
      "createBypassProbe",
      "recordGatewayCustodyProofPacket",
      "createToolCallDraft",
      "transitionToolCallDraft",
      "createProtectedPathPosture",
      "recordNegotiationSession",
      "recordNegotiationOffer",
      "recordNegotiationDecision",
      "recordLinkedAgreement",
      "recordAgreementObligationBinding",
      "transitionAgreementStatus",
      "createReviewArtifact",
      "createReviewDecision",
      "reconcileSurfaceOperation",
      "createReceiptExport",
      "createAuthorityCertificate",
      "createRecoveryRecommendation",
      "resolveRecoveryTerminalConflictProofGap",
    ] as const;

    for (const transitionId of nonAuthorityTransitions) {
      const entry = protocolNavigationByTransitionId[transitionId];
      expect(`${entry.authorityBoundary} ${entry.evidenceObligation}`).toMatch(/only|without/);
    }
  });
});

const kernelOnlyTransitionIds = new Set([
  "createGeneratedExecutionGraph",
  "createAuthorityCertificate",
  "recordNegotiationSession",
  "recordNegotiationOffer",
  "recordNegotiationDecision",
  "recordLinkedAgreement",
  "recordAgreementObligationBinding",
  "transitionAgreementStatus",
]);
