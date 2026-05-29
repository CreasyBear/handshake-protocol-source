import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import {
  actionAttemptLifecycleEntry,
  type ActionAttemptLifecycleKey,
} from "../../src/protocol/areas/action-attempt-lifecycle";
import type { ProtocolTransitionId, TransitionOutcomeClass } from "../../src/protocol/navigation";
import {
  forbiddenServiceWorkflowAuthorityNouns,
  serviceWorkflowCorrelationFieldBoundaries,
  serviceWorkflowCorrelationFieldNames,
  serviceWorkflowLifecycleEntriesFor,
  serviceWorkflowLifecycleProjections,
  serviceWorkflowProjectionKinds,
} from "../../src/surfaces/service-workflow-lifecycle-projections";

describe("service workflow lifecycle projections", () => {
  it("defines friendly product nouns as projections over the existing authority spine", () => {
    expect(serviceWorkflowLifecycleProjections.map((entry) => entry.projectionKind)).toEqual([
      ...serviceWorkflowProjectionKinds,
    ]);

    const violations: string[] = [];
    for (const projection of serviceWorkflowLifecycleProjections) {
      if (projection.createsAuthority !== false) {
        violations.push(`${projection.productNoun} creates authority`);
      }
      if (projection.allowedUse.length === 0) {
        violations.push(`${projection.productNoun} lacks allowed use`);
      }
      const forbiddenInterpretations: readonly string[] = projection.forbiddenInterpretations;
      if (forbiddenInterpretations.length === 0) {
        violations.push(`${projection.productNoun} lacks forbidden interpretations`);
      }
      for (const key of projection.lifecycleKeys) {
        expectLifecycleKeyExists(key);
      }
      expect(serviceWorkflowLifecycleEntriesFor(projection.projectionKind).length).toBe(
        projection.lifecycleKeys.length,
      );
    }

    expect(violations.sort()).toEqual([]);
  });

  it("keeps passport, admission, and handle identifiers as correlation only", () => {
    expect(serviceWorkflowCorrelationFieldBoundaries.map((entry) => entry.fieldName)).toEqual([
      ...serviceWorkflowCorrelationFieldNames,
    ]);

    for (const field of serviceWorkflowCorrelationFieldBoundaries) {
      expect(field.createsAuthority).toBe(false);
      expect(field.allowedUse).toMatch(/correlation|reconstruction|readback|intake/);
      expect(field.forbiddenInterpretation).toMatch(/authority|auth|permission|approval|gateway|identity|execution/);
    }
  });

  it("maps clearance, outcome, and certificate to lifecycle entries without creating a protocol primitive", () => {
    expect(serviceWorkflowLifecycleEntriesFor("clearance").map((entry) => entry.state)).toEqual(
      expect.arrayContaining(["contract_proposed", "policy_greenlit", "gateway_admitted", "gateway_replayed"]),
    );
    expect(serviceWorkflowLifecycleEntriesFor("outcome").map((entry) => entry.terminalOutcome)).toEqual(
      expect.arrayContaining(["receipt", "refusal", "proof_gap", "projection", "recovery"]),
    );
    expect(serviceWorkflowLifecycleEntriesFor("authority_certificate")).toEqual([
      expect.objectContaining({
        state: "authority_certificate_exported",
        authorityEffect: "evidence_only",
        terminalOutcome: "projection",
      }),
    ]);

    const protocolFiles = [
      "src/protocol/areas/index.ts",
      "src/protocol/public/index.ts",
      "src/index.ts",
      "package.json",
    ];
    for (const file of protocolFiles) {
      const text = readFileSync(file, "utf8");
      expect(text).not.toMatch(/ServiceWorkflowLifecycleProjection|serviceWorkflowLifecycleProjections/);
      expect(text).not.toMatch(/\bPassport\b|\bBadge\b/);
    }
  });

  it("keeps badge language out of service workflow authority nouns", () => {
    expect([...forbiddenServiceWorkflowAuthorityNouns]).toEqual(["Badge"]);
    const projectionText = JSON.stringify(serviceWorkflowLifecycleProjections);

    expect(projectionText).not.toMatch(/\bBadge\b/);
  });
});

function expectLifecycleKeyExists(key: ActionAttemptLifecycleKey): void {
  const [transitionId, outcomeClass] = key.split(":") as [ProtocolTransitionId, TransitionOutcomeClass];
  expect(actionAttemptLifecycleEntry(transitionId, outcomeClass)).toBeDefined();
}
