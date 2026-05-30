import { describe, expect, it } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const repoRoot = process.cwd();
const integrationRoot = join(repoRoot, "src/integrations/a1-evidence");

describe("A1 evidence invariants (A1-1)", () => {
  it("DelegationEvidenceRecord schema rejects authority-carrying keys", async () => {
    let DelegationEvidenceRecordSchema: {
      safeParse: (value: unknown) => { success: boolean };
    };
    try {
      ({ DelegationEvidenceRecordSchema } =
        await import("../../src/integrations/a1-evidence/delegation-evidence-record.js"));
    } catch {
      throw new Error("A1-1-RED: DelegationEvidenceRecord not implemented");
    }

    const base = {
      schemaId: "delegation-evidence-record",
      schemaVersion: 1,
      a1ChainFingerprint: "a".repeat(64),
      certFingerprints: ["b".repeat(64)],
      chainDepth: 1,
      principalPkFingerprint: "c".repeat(64),
      terminalDelegatePkFingerprint: "d".repeat(64),
      a1VerifierVersion: "handshake-delegation-1.0.0-zip215",
      verifyPath: "ts",
      verifyOutcome: "valid",
      reasonCodes: [],
      evidenceBindingDigest: "e".repeat(64),
      presentedAtUnix: 1_700_000_000,
      mutationAuthorityCreated: false,
      greenlightCreated: false,
    };

    for (const forbiddenKey of [
      "mutationAuthorityCreated",
      "greenlightCreated",
      "gatewayCheckPassed",
      "greenlightId",
      "verifiedToken",
    ] as const) {
      if (forbiddenKey === "mutationAuthorityCreated" || forbiddenKey === "greenlightCreated") {
        const bad = { ...base, [forbiddenKey]: true };
        expect(DelegationEvidenceRecordSchema.safeParse(bad).success).toBe(false);
        continue;
      }
      const bad = { ...base, [forbiddenKey]: "forbidden" };
      expect(DelegationEvidenceRecordSchema.safeParse(bad).success).toBe(false);
    }
  });

  it("verifySignedChain is side-effect free (no kernel transitions)", async () => {
    const verifyPath = join(integrationRoot, "verify-chain.ts");
    if (!existsSync(verifyPath)) {
      throw new Error("A1-1-RED: verifySignedChain not implemented");
    }

    const verifySource = readFileSync(verifyPath, "utf8");
    expect(verifySource).not.toMatch(/protocol\/kernel/);
    expect(verifySource).not.toMatch(/issueGreenlight/);
    expect(verifySource).not.toMatch(/gatewayCheck/);
    expect(verifySource).not.toMatch(/proposeActionContract/);

    const { verifySignedChain } = await import("../../src/integrations/a1-evidence/verify-chain.js");
    const outcome = verifySignedChain({
      signedChain: { version: 1, principal_pk: "0".repeat(64), principal_scope: "1".repeat(64), certs: [] },
      executorPk: "2".repeat(64),
      intentHash: "3".repeat(64),
      merkleProof: { siblings: [] },
    });

    expect(outcome.valid).toBe(false);
    if (outcome.valid) return;
    expect(outcome.reasonCode).toMatch(/^delegation_evidence_invalid:/);
    const outcomeRecord = outcome as Record<string, unknown>;
    expect(outcomeRecord.mutationAuthorityCreated).toBeUndefined();
    expect(outcomeRecord.greenlightCreated).toBeUndefined();
  });

  it("candidate with delegationEvidenceRef has no authority flags on CandidateAction", async () => {
    let CandidateActionSchema: { safeParse: (value: unknown) => { success: boolean; data?: unknown } };
    try {
      ({ CandidateActionSchema } = await import("../../src/protocol/areas/intent-compilation/schemas.js"));
    } catch {
      throw new Error("A1-1-RED: CandidateActionSchema unavailable");
    }

    const fixturePath = join(repoRoot, "test/support/a1-evidence-candidate-fixture.json");
    if (!existsSync(fixturePath)) {
      throw new Error("A1-1-RED: delegationEvidenceRef candidate fixture not implemented");
    }
    const candidate = JSON.parse(readFileSync(fixturePath, "utf8")) as Record<string, unknown>;
    const parsed = CandidateActionSchema.safeParse(candidate);
    expect(parsed.success).toBe(true);
    if (!parsed.success || !parsed.data) return;
    const data = parsed.data as Record<string, unknown>;
    for (const forbiddenKey of [
      "mutationAuthorityCreated",
      "greenlightCreated",
      "greenlightId",
      "gatewayCheckPassed",
      "gatewayCheckAttemptId",
    ]) {
      expect(data[forbiddenKey]).toBeUndefined();
    }
    expect(data.delegationEvidenceRef).toBeDefined();
  });
});
