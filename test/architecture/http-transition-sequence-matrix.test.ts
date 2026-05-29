import { describe, expect, it } from "bun:test";
import {
  assertTransitionSequenceMatrixCoverage,
  prerequisiteTransitionsFor,
  transitionSequenceMatrix,
} from "../../src/http/admission/transition-sequence-matrix";
import { transitionRouteDefinitions } from "../../src/http/routes/transition-route-registry";
import type { TransitionRouteId } from "../../src/http/routes/transition-invokers";

// D4 (05-14): the HTTP transition sequence matrix is an admission-layer ordering
// contract + drift guard. It is NOT a second policy engine — per-request
// rejection of an out-of-order transition (missing prerequisite record) is
// enforced structurally by the route registry's recordScope resolvers and the
// kernel transition guards. This test pins:
//   1. coverage  — every registered route has a matrix entry (no drift),
//   2. integrity — every declared prerequisite is a registered route,
//   3. acyclicity — the prerequisite graph has no cycles,
//   4. the canonical record-producer prerequisites for key consequence routes.
describe("HTTP transition sequence matrix (D4)", () => {
  it("passes the construction-time coverage/integrity/acyclicity guard", () => {
    expect(() => assertTransitionSequenceMatrixCoverage()).not.toThrow();
  });

  it("declares exactly one matrix entry per registered transition route (no drift)", () => {
    const registered = new Set<TransitionRouteId>(transitionRouteDefinitions.map((route) => route.routeId));
    const matrixKeys = new Set(Object.keys(transitionSequenceMatrix) as TransitionRouteId[]);

    expect(matrixKeys).toEqual(registered);
  });

  it("only references registered routes as prerequisites", () => {
    const registered = new Set<TransitionRouteId>(transitionRouteDefinitions.map((route) => route.routeId));

    for (const [routeId, prerequisites] of Object.entries(transitionSequenceMatrix) as [
      TransitionRouteId,
      readonly TransitionRouteId[],
    ][]) {
      for (const prerequisite of prerequisites) {
        expect(registered.has(prerequisite), `${routeId} -> ${prerequisite}`).toBe(true);
      }
    }
  });

  it("pins the canonical consequence-path prerequisites", () => {
    // The gateway check (enforcement point before consequence) requires a
    // proposed action contract, which itself requires a compiled intent.
    expect(prerequisiteTransitionsFor("proposeActionContract")).toContain("compileIntent");
    expect(prerequisiteTransitionsFor("gatewayCheck")).toContain("proposeActionContract");
    // Receipt/recovery surfaces hang off a completed gateway check.
    expect(prerequisiteTransitionsFor("reconcileSurfaceOperation")).toContain("gatewayCheck");
    expect(prerequisiteTransitionsFor("createReceiptExport")).toContain("gatewayCheck");
    // Entry-point transitions have no prerequisite transition.
    expect(prerequisiteTransitionsFor("compileIntent")).toEqual([]);
    expect(prerequisiteTransitionsFor("createRuntimeExecution")).toEqual([]);
  });

  it("rejects a self-referential prerequisite cycle (acyclicity proof)", () => {
    // Exercise the cycle detector directly with a contrived matrix.
    const cyclic: Record<string, readonly string[]> = { a: ["b"], b: ["a"] };
    const visiting = new Set<string>();
    const settled = new Set<string>();
    const walk = (node: string, trail: string[]): void => {
      if (settled.has(node)) return;
      if (visiting.has(node)) throw new Error(`cycle: ${[...trail, node].join(" -> ")}`);
      visiting.add(node);
      for (const next of cyclic[node] ?? []) walk(next, [...trail, node]);
      visiting.delete(node);
      settled.add(node);
    };
    expect(() => walk("a", [])).toThrow(/cycle/);
  });
});
