import { describe, expect, it } from "bun:test";
import {
  projectProtectedActionChallengeFromRefusal,
  projectProtectedActionMetadata,
  ProtectedActionEvidenceProjectionSchema,
  ProtectedActionMetadataSchema,
  ProtectedActionRequestSchema,
} from "../../src/protocol/areas/protected-action-representation";
import type { Refusal } from "../../src/protocol/areas/refusal";
import { PROTOCOL_VERSION } from "../../src/protocol/foundation/schema-core";
import { proposePackageInstallActionContract } from "../../src/runtime/package-install/action-proposal";
import {
  createGreenlitContract,
  futureIso,
  makeKernelFixture,
  makePackageInstallCandidate,
  proposalInputForCompilation,
  registerFixtureObjects,
} from "../support/fixtures";
import { packageInstallRuntimeConfig } from "../support/package-install-flow";

describe("protected action representation contract", () => {
  it("projects metadata from catalog, envelope, and gateway records without creating authority", () => {
    const fixture = makeKernelFixture();
    const beforeCounts = authorityCounts(fixture);

    const metadata = projectProtectedActionMetadata({
      tool: fixture.tool,
      actionType: fixture.actionType,
      gateway: fixture.gateway,
      envelope: fixture.envelope,
    });

    expect(metadata).toMatchObject({
      actionClass: "package.install",
      gatewayId: fixture.gateway.gatewayId,
      operatingEnvelopeId: fixture.envelope.envelopeId,
      authorityCreated: false,
      greenlightRef: null,
      gatewayCheckRef: null,
      mutationAttemptRef: null,
    });
    expect(authorityCounts(fixture)).toEqual(beforeCounts);
    expect(() => ProtectedActionMetadataSchema.parse({ ...metadata, greenlightRef: "gl_metadata_escape" })).toThrow();
  });

  it("keeps challenge projections as refusal guidance, not hidden authority", async () => {
    const fixture = await createGreenlitContract();
    const duplicate = await proposeDuplicatePackageContract(fixture);
    await fixture.kernel.evaluatePolicy({
      actionContractId: duplicate.actionContractId,
      envelopeId: fixture.envelope.envelopeId,
      signingSecret: "test-secret",
    });
    const refusal = await latestRefusal(fixture);

    const challenge = projectProtectedActionChallengeFromRefusal({ refusal });

    expect(challenge).toMatchObject({
      phase: "policy",
      reasonCode: "idempotency_duplicate_authority",
      mutationAttempted: false,
      authorityCreated: false,
      rawInternalRecordIncluded: false,
      greenlightRef: null,
      gatewayCheckRef: null,
      mutationAttemptRef: null,
    });
    expect(fixture.store.countRecordsOfType("mutation_attempt")).toBe(0);
  });

  it("keeps protected action requests as proposal inputs until policy and gateway run", async () => {
    const fixture = makeKernelFixture();
    await registerFixtureObjects(fixture);
    const request = ProtectedActionRequestSchema.parse({
      schemaVersion: PROTOCOL_VERSION,
      tenantId: "tenant_demo",
      organizationId: "org_demo",
      createdAt: fixture.envelope.createdAt,
      requestId: "request_package_install",
      metadataRef: "metadata_package_install",
      principalIntentRef: "intent:install hono",
      generatedCodeOrSpecRef: "code:protected-action-request",
      actionClass: "package.install",
      resourceRef: "npm:hono",
      parameters: { package: "hono", versionRange: "^4.12.19" },
      nonSecretParamsSummary: { package: "hono", versionRange: "^4.12.19" },
      secretRefs: {},
      idempotencyKey: "package-install:request:1:hono",
      evidenceRefs: ["evidence:request-package-install"],
      requestedAt: fixture.envelope.createdAt,
      authorityCreated: false,
      greenlightRef: null,
      gatewayCheckRef: null,
      mutationAttemptRef: null,
    });
    expect(() => ProtectedActionRequestSchema.parse({ ...request, greenlightRef: "gl_request_escape" })).toThrow();

    const proposed = await proposePackageInstallActionContract(fixture.kernel, packageInstallRuntimeConfig(fixture), {
      principalIntentRef: request.principalIntentRef,
      generatedCodeOrSpecRef: request.generatedCodeOrSpecRef,
      package: String(request.parameters.package),
      versionRange: String(request.parameters.versionRange),
    });

    expect(proposed.outcome).toBe("action_contract_proposed");
    expect(fixture.store.countRecordsOfType("intent_compilation")).toBe(1);
    expect(fixture.store.countRecordsOfType("action_contract")).toBe(1);
    expect(fixture.store.countRecordsOfType("greenlight")).toBe(0);
    expect(fixture.store.countRecordsOfType("mutation_attempt")).toBe(0);
  });

  it("requires runtime ingress drafts to finalize before candidate compilation can become a contract", async () => {
    const fixture = makeKernelFixture();
    await registerFixtureObjects(fixture);
    const candidate = makePackageInstallCandidate(fixture);
    const openedDraft = await fixture.kernel.createToolCallDraft({
      tenantId: "tenant_demo",
      organizationId: "org_demo",
      toolCapabilityId: fixture.tool.toolCapabilityId,
      actionTypeId: fixture.actionType.actionTypeId,
      gatewayRegistryEntryId: fixture.gateway.gatewayRegistryEntryId,
      actionClass: "package.install",
      gatewayId: fixture.gateway.gatewayId,
      resourceRef: "npm:hono",
      parameters: candidate.parameters,
      nonSecretParamsSummary: candidate.nonSecretParamsSummary,
      secretRefs: {},
      expiresAt: futureIso(),
      evidenceRefs: ["evidence:runtime-ingress-draft"],
    });

    const refusedCompilation = await fixture.kernel.compileIntent(
      compileInputForDraft(fixture, openedDraft.toolCallDraftId, candidate),
    );
    expect(refusedCompilation.candidateAction.refusalReasonCodes).toContain("tool_call_draft_not_finalized");
    expect(fixture.store.countRecordsOfType("action_contract")).toBe(0);

    await fixture.kernel.transitionToolCallDraft({
      toolCallDraftId: openedDraft.toolCallDraftId,
      nextDraftState: "finalized",
      parameters: candidate.parameters,
      nonSecretParamsSummary: candidate.nonSecretParamsSummary,
      finalizedAt: new Date().toISOString(),
      evidenceRefs: ["evidence:runtime-ingress-draft-finalized"],
    });
    const compilation = await fixture.kernel.compileIntent(
      compileInputForDraft(fixture, openedDraft.toolCallDraftId, candidate),
    );
    const contract = await fixture.kernel.proposeActionContract(
      proposalInputForCompilation(compilation, "test-secret"),
    );

    expect(compilation.candidateAction.toolCallDraftId).toBe(openedDraft.toolCallDraftId);
    expect(compilation.candidateAction.toolCallDraftState).toBe("finalized");
    expect(contract.actionContractId).toMatch(/^act_/);
    expect(fixture.store.countRecordsOfType("action_contract")).toBe(1);
    expect(fixture.store.countRecordsOfType("greenlight")).toBe(0);
    expect(fixture.store.countRecordsOfType("mutation_attempt")).toBe(0);
  });

  it("keeps evidence projections redacted and non-executable", () => {
    const projection = ProtectedActionEvidenceProjectionSchema.parse({
      schemaVersion: PROTOCOL_VERSION,
      tenantId: "tenant_demo",
      organizationId: "org_demo",
      createdAt: new Date().toISOString(),
      projectionId: "projection_contract_demo",
      projectionKind: "contract",
      sourceRef: "action_contract:act_demo",
      redactionProfileRef: "contract-view:v0.2-redacted",
      rawInternalRecordIncluded: false,
      mutationCommandIncluded: false,
      omittedFields: ["actionContract.parameters", "actionContract.secretRefs"],
      evidenceRefs: ["action_contract:act_demo"],
      authorityCreated: false,
      greenlightRef: null,
      gatewayCheckRef: null,
      mutationAttemptRef: null,
    });

    expect(projection.authorityCreated).toBe(false);
    expect(() =>
      ProtectedActionEvidenceProjectionSchema.parse({ ...projection, rawInternalRecordIncluded: true }),
    ).toThrow();
    expect(() =>
      ProtectedActionEvidenceProjectionSchema.parse({ ...projection, mutationCommandIncluded: true }),
    ).toThrow();
  });
});

function authorityCounts(fixture: ReturnType<typeof makeKernelFixture>) {
  return {
    actionContracts: fixture.store.countRecordsOfType("action_contract"),
    greenlights: fixture.store.countRecordsOfType("greenlight"),
    gatewayChecks: fixture.store.countRecordsOfType("gateway_check_attempt"),
    mutationAttempts: fixture.store.countRecordsOfType("mutation_attempt"),
  };
}

async function proposeDuplicatePackageContract(fixture: Awaited<ReturnType<typeof createGreenlitContract>>) {
  const compilation = await fixture.kernel.compileIntent({
    tenantId: "tenant_demo",
    organizationId: "org_demo",
    principalIntentRef: "intent:duplicate package request",
    principalId: "principal_demo",
    agentId: "agent_demo",
    runId: "run_demo",
    runtimeAdapterId: "runtime_codex",
    operatingEnvelopeId: fixture.envelope.envelopeId,
    toolCatalogRef: "tool_catalog_demo@v1",
    actionCatalogRef: "action_catalog_demo@v1",
    gatewayRegistryRef: "gateway_registry@v1",
    generatedCodeOrSpecRefs: ["code:duplicate-package-request"],
    declaredAssumptions: ["duplicate request is explicit"],
    requiredEvidenceRefs: ["evidence:package-lock-diff"],
    candidate: makePackageInstallCandidate(fixture, {
      sequenceNumber: 2,
      idempotencyKey: fixture.contract.idempotencyKey,
    }),
  });
  return fixture.kernel.proposeActionContract(proposalInputForCompilation(compilation, "test-secret"));
}

async function latestRefusal(fixture: Awaited<ReturnType<typeof createGreenlitContract>>): Promise<Refusal> {
  const refusals = await fixture.store.listRecordsByType<Refusal>("refusal");
  const refusal = refusals.at(-1)?.payload;
  if (!refusal) throw new Error("expected refusal");
  return refusal;
}

function compileInputForDraft(
  fixture: ReturnType<typeof makeKernelFixture>,
  toolCallDraftId: string,
  candidate: ReturnType<typeof makePackageInstallCandidate>,
) {
  return {
    tenantId: "tenant_demo",
    organizationId: "org_demo",
    principalIntentRef: "intent:runtime ingress draft",
    principalId: "principal_demo",
    agentId: "agent_demo",
    runId: "run_demo",
    runtimeAdapterId: "runtime_codex",
    operatingEnvelopeId: fixture.envelope.envelopeId,
    toolCatalogRef: "tool_catalog_demo@v1",
    actionCatalogRef: "action_catalog_demo@v1",
    gatewayRegistryRef: "gateway_registry@v1",
    toolCallDraftId,
    generatedCodeOrSpecRefs: ["code:runtime-ingress-draft"],
    declaredAssumptions: ["runtime ingress draft must be finalized before contract proposal"],
    requiredEvidenceRefs: ["evidence:runtime-ingress-draft"],
    candidate,
  };
}
