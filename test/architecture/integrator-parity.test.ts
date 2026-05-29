import { describe, expect, it } from "bun:test";
import { httpTransitionNavigation } from "../../src/http/navigation";
import { transitionRouteDefinitions } from "../../src/http/routes/transition-route-registry";
import {
  integratorParityTransitionIds,
  protocolNavigationByTransitionId,
} from "../../src/protocol/navigation";

describe("integrator parity navigation", () => {
  it("tags every integrator parity transition in navigation metadata", () => {
    for (const transitionId of integratorParityTransitionIds) {
      const entry = protocolNavigationByTransitionId[transitionId];
      expect(entry.integratorParity).toBe(true);
    }
  });

  it("maps each integrator parity transition to an HTTP route with matching role", () => {
    const routesByTransition = new Map(
      httpTransitionNavigation.map((entry) => [entry.transitionId, entry]),
    );

    for (const transitionId of integratorParityTransitionIds) {
      const httpEntry = routesByTransition.get(transitionId);
      expect(httpEntry).toBeDefined();
      const registryRoute = transitionRouteDefinitions.find((route) => route.routeId === transitionId);
      expect(registryRoute).toBeDefined();
      expect(httpEntry?.method).toBe("POST");
      expect(httpEntry?.role).toBe(registryRoute?.role);
      expect(httpEntry?.path).toBe(registryRoute?.path);
    }
  });

  it("does not require extended transitions in the parity export", () => {
    expect(integratorParityTransitionIds).not.toContain("createBypassProbe");
    expect(integratorParityTransitionIds).not.toContain("createAuthorityCertificate");
  });
});
