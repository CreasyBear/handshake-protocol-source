import { describe, expect, it } from "bun:test";
import { httpTransitionNavigation } from "../../src/http/navigation";
import { transitionRouteDefinitions } from "../../src/http/routes/transition-route-registry";
import {
  integratorTier1TransitionIds,
  protocolNavigationByTransitionId,
} from "../../src/protocol/navigation";

describe("integrator tier-1 navigation parity", () => {
  it("tags every Tier-1 transition in navigation metadata", () => {
    for (const transitionId of integratorTier1TransitionIds) {
      const entry = protocolNavigationByTransitionId[transitionId];
      expect(entry.integratorTier1).toBe(true);
    }
  });

  it("maps each Tier-1 transition to an HTTP route with matching role", () => {
    const routesByTransition = new Map(
      httpTransitionNavigation.map((entry) => [entry.transitionId, entry]),
    );

    for (const transitionId of integratorTier1TransitionIds) {
      const httpEntry = routesByTransition.get(transitionId);
      expect(httpEntry).toBeDefined();
      const registryRoute = transitionRouteDefinitions.find((route) => route.routeId === transitionId);
      expect(registryRoute).toBeDefined();
      expect(httpEntry?.method).toBe("POST");
      expect(httpEntry?.role).toBe(registryRoute?.role);
      expect(httpEntry?.path).toBe(registryRoute?.path);
    }
  });

  it("does not require Tier-2 transitions in the Tier-1 export", () => {
    expect(integratorTier1TransitionIds).not.toContain("createBypassProbe");
    expect(integratorTier1TransitionIds).not.toContain("createAuthorityCertificate");
  });
});
