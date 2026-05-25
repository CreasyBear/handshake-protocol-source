import { describe, expect, it } from "bun:test";
import type {
  DelegatedAuthorityBinding,
  DelegatedAuthorityRef,
  RegisterDelegatedAuthorityRefInput,
} from "../../src/protocol/areas/delegated-authority";
import {
  futureIso,
  makeKernelFixture,
  makePackageInstallCandidate,
  proposalInputForCompilation,
  registerFixtureObjects,
} from "../support/fixtures";

const fakeDigest = `sha256:${"f".repeat(64)}` as const;

describe("delegated authority refs", () => {
  it("registers delegated authority as evidence without minting policy or mutation authority", async () => {
    const fixture = makeKernelFixture();
    await registerFixtureObjects(fixture);

    const authorityRef = await registerDelegatedAuthorityRef(fixture);

    expect(authorityRef).toMatchObject({
      principalId: fixture.envelope.principalId,
      agentId: fixture.envelope.agentId,
      runtimeAdapterId: fixture.tool.runtimeAdapterId,
      operatingEnvelopeId: fixture.envelope.envelopeId,
      authorityKind: "spend",
      grantStatus: "active",
      redactionProfileRef: "delegated-authority-ref:v0.2-redacted",
      secretMaterialIncluded: false,
      mutationAuthorityCreated: false,
      greenlightCreated: false,
    });
    expect(await fixture.store.listRecordsByType("delegated_authority_ref")).toHaveLength(1);
    expect(await fixture.store.listRecordsByType("policy_decision")).toHaveLength(0);
    expect(await fixture.store.listRecordsByType("greenlight")).toHaveLength(0);
    expect(await fixture.store.listRecordsByType("gateway_check_attempt")).toHaveLength(0);
  });

  it("binds delegated authority refs into the candidate and contract params digest", async () => {
    const fixture = makeKernelFixture();
    await registerFixtureObjects(fixture);

    const withoutAuthority = await compileAndPropose(fixture, makePackageInstallCandidate(fixture));
    const authorityRef = await registerDelegatedAuthorityRef(fixture);
    const parameters = { atomicAmount: "4", package: "hono", versionRange: "^4.12.19" };
    const withAuthority = await compileAndPropose(
      fixture,
      makePackageInstallCandidate(fixture, {
        parameters,
        nonSecretParamsSummary: parameters,
        delegatedAuthorityRefs: [delegatedAuthorityBindingFor(authorityRef)],
        idempotencyKey: "idem_package_hono_with_authority",
      }),
    );

    expect(withAuthority.delegatedAuthorityRefs).toEqual([delegatedAuthorityBindingFor(authorityRef)]);
    expect(withoutAuthority.paramsDigest).not.toBe(withAuthority.paramsDigest);
    expect(withoutAuthority.actionContractDigest).not.toBe(withAuthority.actionContractDigest);
  });

  it("refuses contract proposal when a bound delegated authority ref is missing", async () => {
    const fixture = makeKernelFixture();
    await registerFixtureObjects(fixture);
    const compilation = await fixture.kernel.compileIntent({
      ...compileInputBase(fixture),
      candidate: makePackageInstallCandidate(fixture, {
        delegatedAuthorityRefs: [
          {
            authorityUseName: "test_delegated_spend",
            delegatedAuthorityRefId: "dar_missing",
            delegatedAuthorityRefDigest: fakeDigest,
            requiredGrantStatus: "active",
            authorityKind: "spend",
            policyPackRef: fixture.envelope.policyPackRef,
            policyPackVersion: fixture.envelope.policyPackVersion,
            evidenceExpectationRefs: [],
          },
        ],
      }),
    });

    await expect(
      fixture.kernel.proposeActionContract(proposalInputForCompilation(compilation, "test-secret")),
    ).rejects.toThrow("Action contract references a delegated authority ref that is not stored.");
  });

  it("refuses contract proposal when spend exceeds the delegated per-action bound", async () => {
    const fixture = makeKernelFixture();
    await registerFixtureObjects(fixture);
    const authorityRef = await registerDelegatedAuthorityRef(fixture, { maxAtomicAmountPerAction: "5" });
    const parameters = { atomicAmount: "6", package: "hono", versionRange: "^4.12.19" };
    const compilation = await fixture.kernel.compileIntent({
      ...compileInputBase(fixture),
      candidate: makePackageInstallCandidate(fixture, {
        parameters,
        nonSecretParamsSummary: parameters,
        delegatedAuthorityRefs: [delegatedAuthorityBindingFor(authorityRef)],
      }),
    });

    await expect(
      fixture.kernel.proposeActionContract(proposalInputForCompilation(compilation, "test-secret")),
    ).rejects.toThrow("Action contract amount exceeds the delegated per-action authority bound.");
  });

  it("keeps delegated authority in the policy input before greenlight", async () => {
    const fixture = makeKernelFixture();
    await registerFixtureObjects(fixture);
    const authorityRef = await registerDelegatedAuthorityRef(fixture);
    const parameters = { atomicAmount: "4", package: "hono", versionRange: "^4.12.19" };
    const contract = await compileAndPropose(
      fixture,
      makePackageInstallCandidate(fixture, {
        parameters,
        nonSecretParamsSummary: parameters,
        delegatedAuthorityRefs: [delegatedAuthorityBindingFor(authorityRef)],
      }),
    );

    const policy = await fixture.kernel.evaluatePolicy({
      actionContractId: contract.actionContractId,
      envelopeId: fixture.envelope.envelopeId,
      signingSecret: "test-secret",
    });

    expect(policy.decision.decision).toBe("greenlight");
    expect(policy.greenlight).not.toBeNull();
    expect(policy.decision.policyInputDigest).toMatch(/^sha256:/);
  });

  it("records terminal delegated authority status as authority-ref isolation without mutating the ref", async () => {
    const fixture = makeKernelFixture();
    await registerFixtureObjects(fixture);
    const authorityRef = await registerDelegatedAuthorityRef(fixture);

    const transition = await fixture.kernel.transitionDelegatedAuthorityStatus({
      delegatedAuthorityRefId: authorityRef.delegatedAuthorityRefId,
      nextGrantStatus: "revoked",
      reasonCode: "delegated_spend_revoked_by_principal",
      reasonSummary: "Principal revoked delegated spend before future attempts.",
      changedByRef: "principal:demo",
    });

    const storedRef = await fixture.store.getRecord<DelegatedAuthorityRef>(
      "delegated_authority_ref",
      authorityRef.delegatedAuthorityRefId,
    );
    const isolationStates = await fixture.store.listRecordsByType("isolation_state");

    expect(storedRef?.payload.grantStatus).toBe("active");
    expect(storedRef?.payload.delegatedAuthorityRefDigest).toBe(authorityRef.delegatedAuthorityRefDigest);
    expect(transition).toMatchObject({
      delegatedAuthorityRefId: authorityRef.delegatedAuthorityRefId,
      delegatedAuthorityRefDigest: authorityRef.delegatedAuthorityRefDigest,
      previousGrantStatus: "active",
      nextGrantStatus: "revoked",
      reasonCode: "delegated_spend_revoked_by_principal",
    });
    expect(isolationStates).toHaveLength(1);
    expect(isolationStates[0]?.payload).toMatchObject({
      isolationStateId: transition.isolationStateId,
      scopeType: "authority_ref",
      scopeId: authorityRef.delegatedAuthorityRefId,
      state: "revoked",
      sourceDecisionRef: transition.delegatedAuthorityStatusTransitionId,
    });
    expect(await fixture.store.listRecordsByType("delegated_authority_status_transition")).toHaveLength(1);
  });

  it("blocks future policy decisions after delegated authority revocation", async () => {
    const fixture = makeKernelFixture();
    await registerFixtureObjects(fixture);
    const authorityRef = await registerDelegatedAuthorityRef(fixture);
    const parameters = { atomicAmount: "4", package: "hono", versionRange: "^4.12.19" };
    const contract = await compileAndPropose(
      fixture,
      makePackageInstallCandidate(fixture, {
        parameters,
        nonSecretParamsSummary: parameters,
        delegatedAuthorityRefs: [delegatedAuthorityBindingFor(authorityRef)],
      }),
    );

    await fixture.kernel.transitionDelegatedAuthorityStatus({
      delegatedAuthorityRefId: authorityRef.delegatedAuthorityRefId,
      nextGrantStatus: "revoked",
      reasonCode: "delegated_spend_revoked_by_principal",
      reasonSummary: "Principal revoked delegated spend before future policy.",
      changedByRef: "principal:demo",
    });
    const policy = await fixture.kernel.evaluatePolicy({
      actionContractId: contract.actionContractId,
      envelopeId: fixture.envelope.envelopeId,
      signingSecret: "test-secret",
    });

    expect(policy.decision.decision).toBe("quarantine");
    expect(policy.decision.decisionReasonCode).toBe("isolation_revoked");
    expect(policy.greenlight).toBeNull();
  });

  it("blocks stale unconsumed greenlights at the gateway after delegated authority revocation", async () => {
    const fixture = makeKernelFixture();
    await registerFixtureObjects(fixture);
    const authorityRef = await registerDelegatedAuthorityRef(fixture);
    const parameters = { atomicAmount: "4", package: "hono", versionRange: "^4.12.19" };
    const contract = await compileAndPropose(
      fixture,
      makePackageInstallCandidate(fixture, {
        parameters,
        nonSecretParamsSummary: parameters,
        delegatedAuthorityRefs: [delegatedAuthorityBindingFor(authorityRef)],
      }),
    );
    const policy = await fixture.kernel.evaluatePolicy({
      actionContractId: contract.actionContractId,
      envelopeId: fixture.envelope.envelopeId,
      signingSecret: "test-secret",
    });
    if (!policy.greenlight) throw new Error("expected greenlight before delegated authority revocation");

    await fixture.kernel.transitionDelegatedAuthorityStatus({
      delegatedAuthorityRefId: authorityRef.delegatedAuthorityRefId,
      nextGrantStatus: "revoked",
      reasonCode: "delegated_spend_revoked_by_principal",
      reasonSummary: "Principal revoked delegated spend before gateway use.",
      changedByRef: "principal:demo",
    });
    const gate = await fixture.kernel.gatewayCheck({
      actionContractId: contract.actionContractId,
      greenlightId: policy.greenlight.greenlightId,
      observedParameters: contract.parameters,
      surfaceOperationRef: "surface-op:delegated-authority-revoked",
    });

    expect(gate.gateAttempt.gateDecision).toBe("refused");
    expect(gate.gateAttempt.gateDecisionReasonCode).toBe("current_isolation_revoked");
    expect(gate.mutationAttempt).toBeNull();
  });

  it("records delegated authority expiry only after the authority ref has expired", async () => {
    const fixture = makeKernelFixture();
    await registerFixtureObjects(fixture);
    const futureAuthorityRef = await registerDelegatedAuthorityRef(fixture);
    const expiredAuthorityRef = await registerDelegatedAuthorityRef(fixture, {
      delegatedAuthorityRefId: "dar_expired",
      expiresAt: pastIso(),
    });

    await expect(
      fixture.kernel.transitionDelegatedAuthorityStatus({
        delegatedAuthorityRefId: futureAuthorityRef.delegatedAuthorityRefId,
        nextGrantStatus: "expired",
        reasonCode: "delegated_spend_expired",
        reasonSummary: "Future authority cannot be expired yet.",
        changedByRef: "control-plane:test",
      }),
    ).rejects.toThrow("Delegated authority cannot transition to expired before expiresAt.");

    const transition = await fixture.kernel.transitionDelegatedAuthorityStatus({
      delegatedAuthorityRefId: expiredAuthorityRef.delegatedAuthorityRefId,
      nextGrantStatus: "expired",
      reasonCode: "delegated_spend_expired",
      reasonSummary: "Delegated spend reached its expiry boundary.",
      changedByRef: "control-plane:test",
    });

    expect(transition.nextGrantStatus).toBe("expired");
    expect(transition.delegatedAuthorityRefId).toBe(expiredAuthorityRef.delegatedAuthorityRefId);
  });
});

async function compileAndPropose(
  fixture: ReturnType<typeof makeKernelFixture>,
  candidate: ReturnType<typeof makePackageInstallCandidate>,
) {
  const compilation = await fixture.kernel.compileIntent({
    ...compileInputBase(fixture),
    candidate,
  });
  return fixture.kernel.proposeActionContract(proposalInputForCompilation(compilation, "test-secret"));
}

function compileInputBase(fixture: ReturnType<typeof makeKernelFixture>) {
  return {
    tenantId: fixture.envelope.tenantId,
    organizationId: fixture.envelope.organizationId,
    principalIntentRef: "intent:install hono",
    principalId: fixture.envelope.principalId,
    agentId: fixture.envelope.agentId,
    runId: "run_demo",
    runtimeAdapterId: fixture.tool.runtimeAdapterId,
    operatingEnvelopeId: fixture.envelope.envelopeId,
    toolCatalogRef: `${fixture.tool.toolCatalogId}@${fixture.tool.toolCatalogVersion}`,
    actionCatalogRef: `${fixture.actionType.actionCatalogId}@${fixture.actionType.actionCatalogVersion}`,
    gatewayRegistryRef: `gateway_registry@${fixture.gateway.gatewayRegistryVersion}`,
    generatedCodeOrSpecRefs: ["code:generated-plan"],
    declaredAssumptions: ["package name is explicit"],
    requiredEvidenceRefs: ["evidence:package-lock-diff"],
  };
}

async function registerDelegatedAuthorityRef(
  fixture: ReturnType<typeof makeKernelFixture>,
  overrides: Partial<RegisterDelegatedAuthorityRefInput> = {},
): Promise<DelegatedAuthorityRef> {
  return fixture.kernel.registerDelegatedAuthorityRef({
    tenantId: fixture.envelope.tenantId,
    organizationId: fixture.envelope.organizationId,
    principalId: fixture.envelope.principalId,
    agentId: fixture.envelope.agentId,
    runtimeAdapterId: fixture.tool.runtimeAdapterId,
    operatingEnvelopeId: fixture.envelope.envelopeId,
    gatewayId: fixture.gateway.gatewayId,
    gatewayRegistryEntryId: fixture.gateway.gatewayRegistryEntryId,
    protectedSurfaceKind: fixture.actionType.protectedSurfaceKind,
    actionClasses: [fixture.actionType.actionClass],
    resourceRefs: [fixture.envelope.allowedResources[0] ?? "*"],
    authorityKind: "spend",
    grantStatus: "active",
    policyPackRef: fixture.envelope.policyPackRef,
    policyPackVersion: fixture.envelope.policyPackVersion,
    amountParameterName: "atomicAmount",
    maxAtomicAmountPerAction: "10",
    evidenceExpectationRefs: ["evidence:test-delegated-spend"],
    expiresAt: futureIso(),
    ...overrides,
  });
}

function pastIso(minutes = 10): string {
  return new Date(Date.now() - minutes * 60_000).toISOString();
}

function delegatedAuthorityBindingFor(authorityRef: DelegatedAuthorityRef): DelegatedAuthorityBinding {
  return {
    authorityUseName: "test_delegated_spend",
    delegatedAuthorityRefId: authorityRef.delegatedAuthorityRefId,
    delegatedAuthorityRefDigest: authorityRef.delegatedAuthorityRefDigest,
    requiredGrantStatus: "active",
    authorityKind: authorityRef.authorityKind,
    policyPackRef: authorityRef.policyPackRef,
    policyPackVersion: authorityRef.policyPackVersion,
    evidenceExpectationRefs: authorityRef.evidenceExpectationRefs,
  };
}
