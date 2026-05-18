import { describe, expect, it } from "bun:test";
import { transitionInvokers } from "../src/http/transition-invokers";
import { transitionRouteDefinitions } from "../src/http/transition-route-registry";
import { ContractStreamEventSchema } from "../src/protocol/event-schemas";
import { HandshakeKernel } from "../src/protocol/kernel";
import { protocolObjectTypes } from "../src/protocol/object-registry";
import {
  transitionKernelMethods,
  transitionMatrix,
  transitionMatrixByRouteId,
} from "./support/transition-matrix";

describe("foundation transition matrix", () => {
  it("covers every public transition route and invoker exactly once", () => {
    const matrixIds = transitionMatrix
      .filter((entry) => entry.routeId !== null)
      .map((entry) => String(entry.routeId))
      .sort();
    const routeIds = transitionRouteDefinitions
      .map((route) => String(route.routeId))
      .sort();
    const invokerIds = Object.keys(transitionInvokers).sort();

    expect(matrixIds).toEqual(routeIds);
    expect(matrixIds).toEqual(invokerIds);
    expect(new Set(matrixIds).size).toBe(matrixIds.length);
  });

  it("mirrors route path and caller custody role from the HTTP route registry", () => {
    for (const route of transitionRouteDefinitions) {
      const entry = transitionMatrixByRouteId[route.routeId];
      expect(entry.path).toBe(route.path);
      expect(entry.callerCustodyRole).toBe(route.role);
    }
  });

  it("covers every public kernel transition method", () => {
    const publicKernelMethods = Object.getOwnPropertyNames(HandshakeKernel.prototype)
      .filter((method) => method !== "constructor" && method !== "assertTransition")
      .sort();

    expect(transitionKernelMethods().map(String)).toEqual(publicKernelMethods);
  });

  it("declares records, events, indexes, outcomes, refusal/proof obligations, and illegal claims", () => {
    const allowedEvents = new Set(ContractStreamEventSchema.shape.eventType.options);
    const allowedObjectTypes = new Set(protocolObjectTypes);

    for (const entry of transitionMatrix) {
      expect(entry.inputSchema.length).toBeGreaterThan(0);
      expect(entry.outcomeClasses.length).toBeGreaterThan(0);
      expect(entry.recordsWritten.length).toBeGreaterThan(0);
      expect(entry.indexEffects.length).toBeGreaterThan(0);
      expect(entry.proofOrRefusalObligation.length).toBeGreaterThan(0);
      expect(entry.commitConflictBehavior.length).toBeGreaterThan(0);
      expect(entry.illegalAuthorityClaims.length).toBeGreaterThan(0);
      expect(entry.invariantTests.length).toBeGreaterThan(0);

      for (const objectType of entry.recordsWritten) {
        expect(allowedObjectTypes.has(objectType)).toBe(true);
      }
      for (const eventType of entry.eventsEmitted) {
        expect(allowedEvents.has(eventType)).toBe(true);
      }
    }
  });

  it("keeps authority-bearing transitions explicit about non-authority evidence", () => {
    const nonAuthorityRoutes = [
      "compileIntent",
      "createRuntimeExecution",
      null,
      "createProtectedPathPosture",
      "createReviewArtifact",
      "createReviewDecision",
      "reconcileSurfaceOperation",
      "createReceiptExport",
      "createRecoveryRecommendation",
      "resolveRecoveryTerminalConflictProofGap",
    ] as const;

    for (const routeId of nonAuthorityRoutes) {
      const entry = routeId === null ? transitionMatrix.find((candidate) => candidate.kernelMethod === "createGeneratedExecutionGraph") : transitionMatrixByRouteId[routeId];
      expect(entry?.illegalAuthorityClaims.join(" ")).toMatch(/not|cannot/);
    }
  });
});
