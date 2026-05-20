import { describe, expect, it } from "bun:test";
import {
  actionAttemptHostileTraceEntries,
  actionAttemptHostileTraceEntry,
  actionAttemptHostileTraceMatrix,
  actionAttemptLifecycleEntries,
  actionAttemptLifecycleEntry,
  actionAttemptLifecycleMatrix,
  actionAttemptLifecycleStatesForTransition,
} from "../../src/protocol/areas/action-attempt-lifecycle";
import { protocolNavigation } from "../../src/protocol/navigation";

describe("ActionAttemptLifecycle derived matrix", () => {
  it("covers every protocol navigation outcome exactly once", () => {
    const expectedKeys = protocolNavigation.flatMap((entry) =>
      entry.outcomeClasses.map((outcomeClass) => `${entry.transitionId}:${outcomeClass}`),
    );
    const actualKeys = Object.keys(actionAttemptLifecycleMatrix).sort();

    expect(actualKeys).toEqual(expectedKeys.sort());
    expect(actionAttemptLifecycleEntries()).toHaveLength(expectedKeys.length);
  });

  it("keeps lifecycle states derived from evidence-chain transitions, not stored instances", () => {
    expect(actionAttemptLifecycleEntry("createRuntimeExecution", "recorded")).toMatchObject({
      phase: "observation",
      authorityEffect: "evidence_only",
      terminalOutcome: "evidence_only",
    });
    expect(actionAttemptLifecycleEntry("compileIntent", "recorded")).toMatchObject({
      phase: "compilation",
      authorityEffect: "evidence_only",
      terminalOutcome: "open",
    });
    expect(actionAttemptLifecycleEntry("proposeActionContract", "recorded")).toMatchObject({
      phase: "contract",
      authorityEffect: "proposed_commitment",
      terminalOutcome: "contract",
    });
    expect(actionAttemptLifecycleEntry("evaluatePolicy", "greenlight")).toMatchObject({
      phase: "policy",
      authorityEffect: "one_use_authority",
      terminalOutcome: "open",
    });
    expect(actionAttemptLifecycleEntry("gatewayCheck", "recorded")).toMatchObject({
      phase: "gateway",
      authorityEffect: "gateway_admission",
      terminalOutcome: "receipt",
    });
  });

  it("maps hostile runtime and gateway paths to refusal or proof-gap outcomes", () => {
    expect(actionAttemptLifecycleEntry("createGeneratedExecutionGraph", "refusal")).toMatchObject({
      state: "bypass_risk_recorded",
      terminalOutcome: "proof_gap",
    });
    expect(actionAttemptLifecycleEntry("transitionToolCallDraft", "refusal")).toMatchObject({
      state: "draft_refused",
      terminalOutcome: "refusal",
    });
    expect(actionAttemptLifecycleEntry("compileIntent", "refusal")).toMatchObject({
      state: "candidate_refused",
      terminalOutcome: "refusal",
    });
    expect(actionAttemptLifecycleEntry("gatewayCheck", "replay_refusal")).toMatchObject({
      state: "gateway_replayed",
      terminalOutcome: "refusal",
    });
    expect(actionAttemptLifecycleEntry("gatewayCheck", "proof_gap")).toMatchObject({
      state: "gateway_proof_gap",
      terminalOutcome: "proof_gap",
    });
  });

  it("maps every doc 08 hostile trace class to one non-authoritative terminal outcome", () => {
    expect(Object.keys(actionAttemptHostileTraceMatrix).sort()).toEqual([
      "changed_payment_requirements",
      "dynamic_tool_or_params",
      "hidden_lifecycle_side_effect",
      "missing_downstream_response",
      "params_mismatch",
      "raw_sibling_mutation_path",
      "stale_or_abandoned_draft",
      "unknown_consequential_tool",
    ]);

    const entries = actionAttemptHostileTraceEntries();
    expect(entries).toHaveLength(8);
    for (const entry of entries) {
      expect(entry.authorityEffect).not.toBe("one_use_authority");
      expect(entry.authorityEffect).not.toBe("gateway_admission");
      expect(entry.authorityEffect).not.toBe("proposed_commitment");
      expect(entry.terminalOutcome).not.toBe("contract");
      expect(entry.terminalOutcome).not.toBe("receipt");
    }

    expect(actionAttemptHostileTraceEntry("unknown_consequential_tool")).toMatchObject({
      state: "candidate_refused",
      terminalOutcome: "refusal",
    });
    expect(actionAttemptHostileTraceEntry("raw_sibling_mutation_path")).toMatchObject({
      state: "bypass_risk_recorded",
      terminalOutcome: "evidence_only",
    });
    expect(actionAttemptHostileTraceEntry("hidden_lifecycle_side_effect")).toMatchObject({
      state: "downstream_proof_gap",
      terminalOutcome: "terminal_unknown",
    });
    expect(actionAttemptHostileTraceEntry("missing_downstream_response")).toMatchObject({
      state: "downstream_proof_gap",
      terminalOutcome: "proof_gap",
    });
    expect(actionAttemptHostileTraceEntry("params_mismatch")).toMatchObject({
      state: "candidate_refused",
      terminalOutcome: "refusal",
    });
  });

  it("keeps evidence projections and recovery actions non-authoritative", () => {
    expect(actionAttemptLifecycleStatesForTransition("createReceiptExport")).toEqual([
      "receipt_exported",
      "receipt_export_refused",
    ]);
    expect(actionAttemptLifecycleEntry("createReceiptExport", "exported").authorityEffect).toBe("evidence_only");
    expect(actionAttemptLifecycleEntry("createRecoveryRecommendation", "recovery").authorityEffect).toBe(
      "evidence_only",
    );
    expect(actionAttemptLifecycleEntry("createIsolationState", "recorded").authorityEffect).toBe(
      "future_authority_reduction",
    );
  });
});
