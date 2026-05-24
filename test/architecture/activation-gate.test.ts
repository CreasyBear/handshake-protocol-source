import { describe, expect, it } from "bun:test";
import {
  activationGateAuthorityBoundary,
  ActivationGateAuthorityBoundarySchema,
  projectActivationGateReport,
  type ActivationGateReportInput,
} from "../../src/surfaces/activation-gate";

describe("activation gate verdict report", () => {
  it("passes only when required gates carry positive and forbidden-authority evidence", () => {
    const report = projectActivationGateReport(baseReportInput());

    expect(report.verdict).toBe("PASS");
    expect(report.nextStageUnblocked).toBe(true);
    expect(report.blockingGateIds).toEqual([]);
    expect(report.unsatisfiedCriterionIds).toEqual([]);
    expect(report.triggeredAntiPatternIds).toEqual([]);
    expect(report.authorityBoundary).toEqual(activationGateAuthorityBoundary);
  });

  it("blocks a nominally passed gate when forbidden-authority evidence is missing", () => {
    const report = projectActivationGateReport(
      baseReportInput({
        gates: [
          {
            ...baseGate("gate-protocol"),
            forbiddenAuthorityEvidenceRefs: [],
          },
        ],
      }),
    );

    expect(report.verdict).toBe("BLOCKED");
    expect(report.nextStageUnblocked).toBe(false);
    expect(report.blockingGateIds).toEqual(["gate-protocol"]);
  });

  it("blocks when a ten-star success criterion lacks proof or command evidence", () => {
    const report = projectActivationGateReport(
      baseReportInput({
        successCriteria: [
          {
            ...baseSuccessCriterion("criterion-verified-gate"),
            satisfied: true,
            evidenceRefs: [],
          },
        ],
      }),
    );

    expect(report.verdict).toBe("BLOCKED");
    expect(report.nextStageUnblocked).toBe(false);
    expect(report.unsatisfiedCriterionIds).toEqual(["criterion-verified-gate"]);
  });

  it("blocks when an anti-pattern is present", () => {
    const report = projectActivationGateReport(
      baseReportInput({
        antiPatterns: [
          {
            ...baseAntiPattern("anti-pattern-prose-only-success"),
            present: true,
            evidenceRefs: ["test:activation-gate:anti-pattern"],
          },
        ],
      }),
    );

    expect(report.verdict).toBe("BLOCKED");
    expect(report.nextStageUnblocked).toBe(false);
    expect(report.triggeredAntiPatternIds).toEqual(["anti-pattern-prose-only-success"]);
  });

  it("supports narrowed pass only when proof gaps are explicitly allowed and non-blocking", () => {
    const gap = {
      reasonCode: "mcp_registry_discoverability_not_verified",
      affectedRef: "package:handshake-protocol-kernel",
      owner: "release-owner",
      nonClaim: "MCP Registry discoverability is not claimed by the local activation gate.",
      nextStageImplication: "Operated surfaces may not claim registry discovery until owner-held evidence exists.",
      blocksNextStage: false,
      evidenceRefs: ["evidence:mcp-registry:not-submitted"],
    };
    const blocked = projectActivationGateReport(
      baseReportInput({
        proofGapPolicy: "block_until_resolved",
        gates: [{ ...baseGate("gate-release"), status: "proof_gap", proofGaps: [gap] }],
      }),
    );
    const narrowed = projectActivationGateReport(
      baseReportInput({
        proofGapPolicy: "allow_narrowed_pass",
        gates: [{ ...baseGate("gate-release"), status: "proof_gap", proofGaps: [gap] }],
      }),
    );

    expect(blocked.verdict).toBe("BLOCKED");
    expect(blocked.blockingGateIds).toEqual(["gate-release"]);
    expect(narrowed.verdict).toBe("PASS_WITH_PROOF_GAPS");
    expect(narrowed.carriedProofGaps.map((entry) => entry.reasonCode)).toEqual([
      "mcp_registry_discoverability_not_verified",
    ]);
  });

  it("treats all required gates cut as a cut verdict", () => {
    const report = projectActivationGateReport(
      baseReportInput({
        gates: [
          {
            ...baseGate("gate-settlement"),
            status: "cut",
            positiveProofEvidenceRefs: [],
            forbiddenAuthorityEvidenceRefs: [],
            commandRefs: [],
            verdictEffect: "cuts_scope",
            cutLines: ["Live settlement is outside the local activation gate."],
          },
        ],
      }),
    );

    expect(report.verdict).toBe("CUT");
    expect(report.nextStageUnblocked).toBe(false);
    expect(report.cutGateIds).toEqual(["gate-settlement"]);
  });

  it("makes activation-gate authority non-claims structural", () => {
    expect(Object.values(activationGateAuthorityBoundary).every((value) => value === false)).toBe(true);
    expect(() =>
      ActivationGateAuthorityBoundarySchema.parse({
        ...activationGateAuthorityBoundary,
        createsGreenlight: true,
      }),
    ).toThrow();
  });
});

function baseReportInput(overrides: Partial<ActivationGateReportInput> = {}): ActivationGateReportInput {
  return {
    reportId: "activation-gate:local-tier-2",
    generatedAt: "2026-05-24T00:00:00.000Z",
    scope: "Local self-hosted protected-action loop",
    proofGapPolicy: "allow_narrowed_pass",
    gates: [baseGate("gate-protocol")],
    externalChecks: [
      {
        checkId: "mcp-registry",
        status: "proof_gap",
        owner: "release-owner",
        evidenceRefs: ["evidence:mcp-registry:not-submitted"],
        nonClaim: "Registry discoverability is not established by local package checks.",
      },
    ],
    successCriteria: [baseSuccessCriterion("criterion-verified-gate")],
    antiPatterns: [baseAntiPattern("anti-pattern-prose-only-success")],
    allowedNextStageClaims: ["Operate local/reference protected-action evidence after gate pass."],
    forbiddenNextStageClaims: ["Hosted mutation authority is not established."],
    userOwnedDecisions: ["Whether narrowed proof-gap pass may unblock local/reference operated-surface design work."],
    ...overrides,
  };
}

function baseGate(gateId: string): ActivationGateReportInput["gates"][number] {
  return {
    gateId,
    title: "Protocol authority chain",
    priority: "P0",
    status: "passed",
    requiredForNextStage: true,
    positiveProofEvidenceRefs: ["evidence:contract-policy-gateway-receipt"],
    forbiddenAuthorityEvidenceRefs: ["evidence:no-runtime-authority-records"],
    commandRefs: ["npm run test -- test/protocol/kernel-policy-gateway.test.ts"],
    artifactRefs: ["artifact:activation-gate-report"],
    proofGaps: [],
    cutLines: [],
    verdictEffect: "unblocks",
  };
}

function baseSuccessCriterion(criterionId: string): ActivationGateReportInput["successCriteria"][number] {
  return {
    criterionId,
    title: "Verified local activation boundary",
    requirement: "The activation gate has positive proof, forbidden-authority evidence, and command evidence.",
    requiredForTenStar: true,
    satisfied: true,
    evidenceRefs: ["evidence:activation-gate:positive-and-forbidden-authority"],
    commandRefs: ["bun test test/architecture/activation-gate.test.ts"],
    antiPatternRefs: ["anti-pattern-prose-only-success"],
  };
}

function baseAntiPattern(antiPatternId: string): ActivationGateReportInput["antiPatterns"][number] {
  return {
    antiPatternId,
    pattern: "Treating a prose review summary as activation proof.",
    failureMode: "The implementation can look complete while no typed gate records the proof boundary.",
    present: false,
    blockedByRefs: ["criterion-verified-gate"],
    evidenceRefs: ["test:activation-gate:no-anti-pattern-triggered"],
  };
}
