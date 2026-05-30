import { describe, expect, it } from "bun:test";
import { digestCanonical } from "../../src/protocol/foundation/canonical";
import type { JsonValue } from "../../src/protocol/foundation/schema-core";
import { CandidateActionSchema, type CandidateAction } from "../../src/protocol/areas/intent-compilation/schemas";
import {
  DelegationEvidenceRefSchema,
  delegationEvidenceEvidenceRefUri,
} from "../../src/protocol/areas/intent-compilation/delegation-evidence-ref";
import { makeKernelFixture, makePackageInstallCandidate, registerFixtureObjects } from "../support/fixtures";

/** Mirrors `candidateDigestMaterial` in intent-compilation/transitions.ts (guardrail-2). */
function clearingEvidenceRefsJson(refs: {
  correlationRef?: string | undefined;
  obligationRef?: string | undefined;
  counterpartyRef?: string | undefined;
}): { [key: string]: JsonValue } {
  const json: { [key: string]: JsonValue } = {};
  if (refs.correlationRef !== undefined) json.correlationRef = refs.correlationRef;
  if (refs.obligationRef !== undefined) json.obligationRef = refs.obligationRef;
  if (refs.counterpartyRef !== undefined) json.counterpartyRef = refs.counterpartyRef;
  return json;
}

function candidateDigestMaterial(
  input: {
    tenantId: string;
    organizationId: string;
    principalIntentRef: string;
    principalId: string;
    agentId: string;
    runId: string;
    runtimeAdapterId: string;
    compilerVersion: string;
    runtimeExecutionId: string | null;
    toolCallDraftId: string | null;
  },
  candidate: CandidateAction,
): JsonValue {
  const { delegationEvidenceRef: _delegationEvidenceRef, ...candidateForDigest } = candidate;
  return {
    tenantId: input.tenantId,
    organizationId: input.organizationId,
    principalIntentRef: input.principalIntentRef,
    principalId: input.principalId,
    agentId: input.agentId,
    runId: input.runId,
    runtimeAdapterId: input.runtimeAdapterId,
    compilerVersion: input.compilerVersion,
    runtimeExecutionId: input.runtimeExecutionId,
    runtimeExecutionDigest: candidate.runtimeExecutionDigest,
    toolCallDraftId: input.toolCallDraftId,
    toolCallDraftDigest: candidate.toolCallDraftDigest,
    candidateAction: {
      ...candidateForDigest,
      clearingEvidenceRefs: clearingEvidenceRefsJson(candidate.clearingEvidenceRefs),
      candidateDigest: null,
    },
  };
}

const digest = (hex: string) => `sha256:${hex}` as const;

describe("DelegationEvidenceRef (A1-1)", () => {
  it("rejects storeRef embedding raw A1 wire payloads", () => {
    for (const storeRef of [
      "store:signedChain:abc",
      "blob:certs:0",
      "s3://evidence/signature/deadbeef",
      "delegator_pk=00",
    ]) {
      const parsed = DelegationEvidenceRefSchema.safeParse({
        delegationEvidenceRefId: "der_test",
        evidenceBindingDigest: digest("a".repeat(64)),
        a1ChainFingerprint: digest("b".repeat(64)),
        storeRef,
        verifyOutcome: "valid",
        a1VerifierVersion: "handshake-delegation-1.0.0-zip215",
      });
      expect(parsed.success).toBe(false);
    }
  });

  it("accepts opaque storeRef without wire field names", () => {
    const parsed = DelegationEvidenceRefSchema.safeParse({
      delegationEvidenceRefId: "der_test",
      evidenceBindingDigest: digest("a".repeat(64)),
      a1ChainFingerprint: digest("b".repeat(64)),
      storeRef: "evidence-store://tenant/org/record/abc123",
      verifyOutcome: "valid",
      a1VerifierVersion: "handshake-delegation-1.0.0-zip215",
    });
    expect(parsed.success).toBe(true);
  });

  it("delegationEvidenceRef does not change candidateDigest (guardrail-2)", async () => {
    const fixture = makeKernelFixture();
    await registerFixtureObjects(fixture);

    const compileInput = {
      tenantId: "tenant_demo",
      organizationId: "org_demo",
      principalIntentRef: "intent:install hono",
      principalId: "principal_demo",
      agentId: "agent_demo",
      runId: "run_demo",
      runtimeAdapterId: "runtime_codex",
      operatingEnvelopeId: "env_demo",
      toolCatalogRef: "tool_catalog_demo@v1",
      actionCatalogRef: "action_catalog_demo@v1",
      gatewayRegistryRef: "gateway_registry@v1",
      compilerVersion: "compiler_demo@v1",
      runtimeExecutionId: null,
      toolCallDraftId: null,
      candidate: makePackageInstallCandidate(fixture),
    };

    const compilation = await fixture.kernel.compileIntent(compileInput);
    const baseCandidate = compilation.candidateAction;
    expect(baseCandidate.candidateDigest).toMatch(/^sha256:/);

    const evidenceBindingDigest = digest("c".repeat(64));
    const withRef = CandidateActionSchema.parse({
      ...baseCandidate,
      delegationEvidenceRef: {
        delegationEvidenceRefId: "der_demo",
        evidenceBindingDigest,
        a1ChainFingerprint: digest("d".repeat(64)),
        storeRef: "evidence-store://tenant/org/delegation/der_demo",
        verifyOutcome: "valid",
        a1VerifierVersion: "handshake-delegation-1.0.0-zip215",
      },
    });

    const digestInput = {
      tenantId: compileInput.tenantId,
      organizationId: compileInput.organizationId,
      principalIntentRef: compileInput.principalIntentRef,
      principalId: compileInput.principalId,
      agentId: compileInput.agentId,
      runId: compileInput.runId,
      runtimeAdapterId: compileInput.runtimeAdapterId,
      compilerVersion: compileInput.compilerVersion,
      runtimeExecutionId: compileInput.runtimeExecutionId,
      toolCallDraftId: compileInput.toolCallDraftId,
    };

    const digestWithoutRef = await digestCanonical(candidateDigestMaterial(digestInput, baseCandidate));
    const digestWithRef = await digestCanonical(candidateDigestMaterial(digestInput, withRef));

    expect(digestWithRef).toBe(digestWithoutRef);
    expect(withRef.candidateDigest).toBe(baseCandidate.candidateDigest);
  });

  it("evidence URI helper is stable and lowercased", () => {
    expect(delegationEvidenceEvidenceRefUri("0xABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789")).toBe(
      "evidence:delegation-binding:abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789",
    );
    expect(delegationEvidenceEvidenceRefUri("ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789")).toBe(
      "evidence:delegation-binding:abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789",
    );
  });
});
