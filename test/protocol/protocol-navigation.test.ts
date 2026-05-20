import { describe, expect, it } from "bun:test";
import { evidenceReadNavigation, httpTransitionNavigation } from "../../src/http/navigation";
import { evidenceReadRouteDefinitions } from "../../src/http/routes/evidence-read-route-registry";
import { transitionRouteDefinitions } from "../../src/http/routes/transition-route-registry";
import { ContractStreamEventSchema } from "../../src/protocol/events/schemas";
import { protocolNavigation, protocolNavigationByTransitionId } from "../../src/protocol/navigation";
import { protocolObjectRegistry, protocolObjectTypes } from "../../src/protocol/areas/object-registry";

describe("protocol navigation", () => {
  it("keeps HTTP transition navigation derived from protocol transitions and route metadata", () => {
    const routeIds = transitionRouteDefinitions.map((route) => String(route.routeId)).sort();
    const httpIds = httpTransitionNavigation.map((entry) => String(entry.routeId)).sort();
    const protocolHttpIds = protocolNavigation
      .filter(
        (entry) =>
          entry.transitionId !== "createGeneratedExecutionGraph" && entry.transitionId !== "createAuthorityCertificate",
      )
      .map((entry) => String(entry.transitionId))
      .sort();

    expect(httpIds).toEqual(routeIds);
    expect(httpIds).toEqual(protocolHttpIds);

    for (const route of transitionRouteDefinitions) {
      const entry = httpTransitionNavigation.find((candidate) => candidate.routeId === route.routeId);
      const protocol = protocolNavigationByTransitionId[route.routeId];
      expect(entry).toMatchObject({
        routeId: route.routeId,
        transitionId: protocol.transitionId,
        method: "POST",
        path: route.path,
        role: route.role,
        kernelMethod: protocol.kernelMethod,
        phase: protocol.phase,
      });
      expect(entry?.recordsWritten).toEqual(protocol.recordsWritten);
    }
  });

  it("represents generated graph coverage and certificate minting as kernel-only evidence", () => {
    const graphEntry = protocolNavigationByTransitionId.createGeneratedExecutionGraph;
    const certificateEntry = protocolNavigationByTransitionId.createAuthorityCertificate;

    expect(graphEntry.kernelMethod).toBe("createGeneratedExecutionGraph");
    expect(graphEntry.phase).toBe("generated_execution_graph");
    expect(httpTransitionNavigation.some((entry) => entry.transitionId === "createGeneratedExecutionGraph")).toBe(
      false,
    );
    expect(certificateEntry.kernelMethod).toBe("createAuthorityCertificate");
    expect(certificateEntry.phase).toBe("authority_certificate");
    expect(httpTransitionNavigation.some((entry) => entry.transitionId === "createAuthorityCertificate")).toBe(false);
  });

  it("declares valid protocol object and stream event effects", () => {
    const allowedObjectTypes = new Set(protocolObjectTypes);
    const allowedEvents = new Set(ContractStreamEventSchema.shape.eventType.options);

    for (const entry of protocolNavigation) {
      for (const objectType of entry.recordsWritten) {
        expect(allowedObjectTypes.has(objectType)).toBe(true);
        expect(protocolObjectRegistry[objectType]).toBeDefined();
      }
      for (const eventType of entry.eventsEmitted) {
        expect(allowedEvents.has(eventType)).toBe(true);
      }
    }
  });

  it("keeps evidence reads diagnostic and read-only", () => {
    expect(evidenceReadNavigation).toHaveLength(evidenceReadRouteDefinitions.length);
    for (const route of evidenceReadRouteDefinitions) {
      const entry = evidenceReadNavigation.find((candidate) => candidate.routeId === route.routeId);
      expect(entry).toMatchObject({
        routeId: route.routeId,
        method: "GET",
        honoPath: route.honoPath,
        openApiPath: route.openApiPath,
        roles: route.roles,
        readOnly: true,
        diagnosticOnly: true,
        recordsWritten: [],
      });
    }
  });
});
