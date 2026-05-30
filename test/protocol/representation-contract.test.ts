import { describe, expect, it } from "bun:test";
import {
  compileX402InstallProposal,
  type X402InstallProposal,
  type X402InstallProposalInput,
} from "../../src/adapters/x402-payment/install-proposal";
import { requireInstallProposalGatewayRegistryEntry } from "../../src/install/install-proposal";
import {
  projectProtectedActionChallengeFromRefusal,
  projectProtectedActionMetadata,
  ProtectedActionChallengeSchema,
  ProtectedActionEvidenceProjectionSchema,
  ProtectedActionMetadataSchema,
  ProtectedActionRequestSchema,
} from "../../src/protocol/areas/protected-action-representation";
import type { Refusal } from "../../src/protocol/areas/refusal";
import { PROTOCOL_VERSION } from "../../src/protocol/foundation/schema-core";
import { nowIso } from "../../src/protocol/foundation/ids";
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

const x402Digest = `sha256:${"c".repeat(64)}` as const;

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
      policyDecisionRef: null,
      approvalDecisionRef: null,
      greenlightRef: null,
      gatewayCheckRef: null,
      mutationAttemptRef: null,
      credentialMaterialIncluded: false,
      mutationCommandIncluded: false,
      receiptAssertionCreated: false,
      authorityCertificateMintRequested: false,
    });
    expect(authorityCounts(fixture)).toEqual(beforeCounts);
    expect(() => ProtectedActionMetadataSchema.parse({ ...metadata, greenlightRef: "gl_metadata_escape" })).toThrow();
  });

  it("represents x402 protected spend without signer, approval, or authority material", async () => {
    const proposal = await compileX402InstallProposal(validX402InstallInput());
    const records = requireCompiledX402Records(proposal);
    const gatewayRegistryEntry = requireInstallProposalGatewayRegistryEntry(records.gatewayRegistryEntry);

    const metadata = projectProtectedActionMetadata({
      tool: records.toolCapability,
      actionType: records.actionType,
      gateway: gatewayRegistryEntry,
      envelope: records.operatingEnvelope,
    });

    expect(metadata).toMatchObject({
      actionClass: "x402_payment.exact",
      protectedSurfaceKind: "x402_payment",
      gatewayId: "gateway_x402_wallet",
      operatingEnvelopeId: records.operatingEnvelope.envelopeId,
      resourceNamespaceRef: "x402:api.example.com",
      allowedResources: [proposal.resourceRef],
      authorityCreated: false,
      policyDecisionRef: null,
      approvalDecisionRef: null,
      greenlightRef: null,
      gatewayCheckRef: null,
      mutationAttemptRef: null,
      credentialMaterialIncluded: false,
      mutationCommandIncluded: false,
      receiptAssertionCreated: false,
      authorityCertificateMintRequested: false,
    });
    expect(JSON.stringify(metadata)).not.toContain(gatewayRegistryEntry.mutationCredentialHolderRef);

    const x402Parameters = {
      endpointUrl: proposal.endpointEvidence.endpointUrl,
      endpointDomain: proposal.endpointDomain,
      payee: proposal.endpointEvidence.payee,
      network: proposal.endpointEvidence.network,
      token: proposal.endpointEvidence.token,
      atomicAmount: "2500",
      paymentRequirementsDigest: proposal.endpointEvidence.paymentRequirementsDigest,
      facilitatorRef: proposal.endpointEvidence.facilitatorRef,
    };
    const request = ProtectedActionRequestSchema.parse({
      schemaVersion: PROTOCOL_VERSION,
      tenantId: proposal.tenantId,
      organizationId: proposal.organizationId,
      createdAt: proposal.createdAt,
      requestId: "request_x402_payment_exact",
      metadataRef: metadata.metadataId,
      principalIntentRef: "intent:fetch paid context",
      generatedCodeOrSpecRef: "code:x402-fetch-wrapper",
      runtimeExecutionId: "runtime_execution_x402",
      generatedExecutionGraphId: "graph_x402",
      generatedExecutionNodeId: "node_x402_payment",
      toolCallDraftId: "draft_x402_payment",
      actionClass: "x402_payment.exact",
      resourceRef: proposal.resourceRef,
      parameters: x402Parameters,
      nonSecretParamsSummary: x402Parameters,
      secretRefs: {},
      idempotencyKey: "x402-payment:request:1",
      evidenceRefs: ["evidence:x402-payment-required"],
      requestedAt: proposal.createdAt,
    });

    expect(request).toMatchObject({
      actionClass: "x402_payment.exact",
      secretRefs: {},
      authorityCreated: false,
      policyDecisionRef: null,
      approvalDecisionRef: null,
      greenlightRef: null,
      gatewayCheckRef: null,
      mutationAttemptRef: null,
      credentialMaterialIncluded: false,
      mutationCommandIncluded: false,
      receiptAssertionCreated: false,
      authorityCertificateMintRequested: false,
    });
    expect(JSON.stringify(request)).not.toContain(gatewayRegistryEntry.mutationCredentialHolderRef);
    expect(JSON.stringify(request)).not.toContain("paymentSignature");
    expect(() =>
      ProtectedActionRequestSchema.parse({
        ...request,
        secretRefs: { signer: gatewayRegistryEntry.mutationCredentialHolderRef },
      }),
    ).toThrow();
    expectNonAuthorityEscapesRejected(ProtectedActionRequestSchema, request);
    expect(() => ProtectedActionRequestSchema.parse({ ...request, receiptRef: "receipt_escape" })).toThrow();
    expect(() =>
      ProtectedActionRequestSchema.parse({ ...request, authorityCertificateRef: "certificate_escape" }),
    ).toThrow();
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
      policyDecisionRef: null,
      approvalDecisionRef: null,
      greenlightRef: null,
      gatewayCheckRef: null,
      mutationAttemptRef: null,
      credentialMaterialIncluded: false,
      mutationCommandIncluded: false,
      receiptAssertionCreated: false,
      authorityCertificateMintRequested: false,
    });
    expect(fixture.store.countRecordsOfType("mutation_attempt")).toBe(0);
  });

  it("defines canonical challenge fixtures for safe recovery without retry or bypass authority", () => {
    const fixtures = [
      challengeFixture({
        challengeId: "challenge_missing_required_field",
        phase: "compilation",
        refusedObjectRef: "protected_action_request:missing-required-field",
        reasonCode: "tool_call_draft_finalize_params_missing",
        retryability: "recoverable",
        commitState: "not_started",
        evidenceRefs: ["protected_action_request:missing-required-field"],
        nextStepKind: "recraft_request",
      }),
      challengeFixture({
        challengeId: "challenge_stale_metadata",
        phase: "compilation",
        refusedObjectRef: "tool_call_draft:draft_stale_x402",
        reasonCode: "tool_call_draft_stale",
        retryability: "retryable",
        commitState: "not_started",
        evidenceRefs: ["metadata:stale-x402", "tool_call_draft:draft_stale_x402"],
        nextStepKind: "recraft_request",
      }),
      challengeFixture({
        challengeId: "challenge_policy_refusal",
        phase: "policy",
        actionContractRef: "act_policy_refused_x402",
        refusedObjectRef: "policy_decision:pd_policy_refused_x402",
        reasonCode: "resource_outside_envelope",
        retryability: "terminal",
        commitState: "committed",
        evidenceRefs: ["action_contract:act_policy_refused_x402", "policy_decision:pd_policy_refused_x402"],
        nextStepKind: "stop",
      }),
      challengeFixture({
        challengeId: "challenge_gateway_refusal",
        phase: "gateway",
        actionContractRef: "act_gateway_refused_x402",
        refusedObjectRef: "gateway_check_attempt:gca_params_mismatch_x402",
        reasonCode: "params_mismatch",
        retryability: "terminal",
        commitState: "committed",
        evidenceRefs: ["action_contract:act_gateway_refused_x402", "gateway_check_attempt:gca_params_mismatch_x402"],
        nextStepKind: "read_evidence",
      }),
      challengeFixture({
        challengeId: "challenge_replay_refusal",
        phase: "gateway",
        actionContractRef: "act_replay_refused_x402",
        refusedObjectRef: "gateway_check_attempt:gca_replay_refused_x402",
        reasonCode: "already_consumed",
        retryability: "terminal",
        commitState: "committed",
        evidenceRefs: ["receipt:receipt_first_x402", "gateway_check_attempt:gca_replay_refused_x402"],
        nextStepKind: "read_evidence",
      }),
      challengeFixture({
        challengeId: "challenge_downstream_proof_gap",
        phase: "proof_gap",
        actionContractRef: "act_proof_gap_x402",
        refusedObjectRef: "proof_gap:pg_x402_downstream_unknown",
        proofGapRef: "pg_x402_downstream_unknown",
        reasonCode: "orphan_mitigation_required",
        retryability: "recoverable",
        commitState: "ambiguous",
        mutationAttempted: true,
        evidenceRefs: ["proof_gap:pg_x402_downstream_unknown", "action_contract:act_proof_gap_x402"],
        nextStepKind: "read_evidence",
      }),
    ];

    expect(fixtures.map((fixture) => fixture.reasonCode)).toEqual([
      "tool_call_draft_finalize_params_missing",
      "tool_call_draft_stale",
      "resource_outside_envelope",
      "params_mismatch",
      "already_consumed",
      "orphan_mitigation_required",
    ]);
    for (const fixture of fixtures) {
      expect(fixture).toMatchObject({
        authorityCreated: false,
        rawInternalRecordIncluded: false,
        policyDecisionRef: null,
        approvalDecisionRef: null,
        greenlightRef: null,
        gatewayCheckRef: null,
        mutationAttemptRef: null,
        credentialMaterialIncluded: false,
        mutationCommandIncluded: false,
        receiptAssertionCreated: false,
        authorityCertificateMintRequested: false,
      });
      expect(["read_evidence", "recraft_request", "stop"]).toContain(fixture.nextStepKind);
      expectNonAuthorityEscapesRejected(ProtectedActionChallengeSchema, fixture);
    }
    expect(fixtures.slice(0, 5).every((fixture) => fixture.mutationAttempted === false)).toBe(true);
    expect(fixtures[5]?.mutationAttempted).toBe(true);
    expect(() => ProtectedActionChallengeSchema.parse({ ...fixtures[0], nextStepKind: "bypass_gateway" })).toThrow();
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
      policyDecisionRef: null,
      approvalDecisionRef: null,
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
      policyDecisionRef: null,
      approvalDecisionRef: null,
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
    expectNonAuthorityEscapesRejected(ProtectedActionEvidenceProjectionSchema, projection);

    const proofGapProjection = ProtectedActionEvidenceProjectionSchema.parse({
      schemaVersion: PROTOCOL_VERSION,
      tenantId: "tenant_demo",
      organizationId: "org_demo",
      createdAt: new Date().toISOString(),
      projectionId: "projection_x402_proof_gap_demo",
      projectionKind: "proof_gap",
      sourceRef: "proof_gap:x402_downstream_unknown",
      redactionProfileRef: "x402-proof-gap:v0.2-redacted",
      rawInternalRecordIncluded: false,
      mutationCommandIncluded: false,
      omittedFields: ["proofGap.redactedDiagnosticsDigest"],
      evidenceRefs: ["proof_gap:x402_downstream_unknown", "action_contract:act_x402"],
    });
    expect(proofGapProjection).toMatchObject({
      projectionKind: "proof_gap",
      authorityCreated: false,
      policyDecisionRef: null,
      greenlightRef: null,
      gatewayCheckRef: null,
      mutationAttemptRef: null,
      credentialMaterialIncluded: false,
      receiptAssertionCreated: false,
      authorityCertificateMintRequested: false,
    });
  });
});

function expectNonAuthorityEscapesRejected(
  schema: { parse(value: unknown): unknown },
  validValue: Record<string, unknown>,
): void {
  for (const [field, value] of [
    ["authorityCreated", true],
    ["policyDecisionRef", "policy_decision_escape"],
    ["approvalDecisionRef", "approval_escape"],
    ["greenlightRef", "greenlight_escape"],
    ["gatewayCheckRef", "gateway_check_escape"],
    ["mutationAttemptRef", "mutation_escape"],
    ["credentialMaterialIncluded", true],
    ["mutationCommandIncluded", true],
    ["receiptAssertionCreated", true],
    ["authorityCertificateMintRequested", true],
  ] as const) {
    expect(() => schema.parse({ ...validValue, [field]: value })).toThrow();
  }
}

function challengeFixture(overrides: Record<string, unknown>) {
  return ProtectedActionChallengeSchema.parse({
    schemaVersion: PROTOCOL_VERSION,
    tenantId: "tenant_demo",
    organizationId: "org_demo",
    createdAt: nowIso(),
    actionContractRef: null,
    refusedObjectRef: null,
    proofGapRef: null,
    mutationAttempted: false,
    rawInternalRecordIncluded: false,
    authorityCreated: false,
    ...overrides,
  });
}

function authorityCounts(fixture: ReturnType<typeof makeKernelFixture>) {
  return {
    actionContracts: fixture.store.countRecordsOfType("action_contract"),
    greenlights: fixture.store.countRecordsOfType("greenlight"),
    gatewayChecks: fixture.store.countRecordsOfType("gateway_check_attempt"),
    mutationAttempts: fixture.store.countRecordsOfType("mutation_attempt"),
  };
}

function requireCompiledX402Records(
  proposal: X402InstallProposal,
): NonNullable<X402InstallProposal["compiledRecords"]> {
  if (!proposal.compiledRecords) throw new Error("expected x402 install proposal to compile kernel records");
  return proposal.compiledRecords;
}

function validX402InstallInput(): X402InstallProposalInput {
  const createdAt = nowIso();
  return {
    tenantId: "tenant_demo",
    organizationId: "org_demo",
    createdAt,
    endpointEvidence: {
      endpointUrl: "https://api.example.com/mcp/premium-context",
      payee: "0xpayee",
      network: "base-sepolia",
      token: "USDC",
      maxAtomicAmount: "2500",
      paymentRequirementsDigest: x402Digest,
      facilitatorRef: "facilitator:local",
      evidenceRefs: ["evidence:x402-payment-required"],
    },
    walletGatewayProfile: {
      walletGatewayId: "wallet_gateway_local",
      gatewayId: "gateway_x402_wallet",
      signerCustodyStatus: "fixture_gateway_held",
      signerRef: "secretref:local-fake-signer",
      authorityHolderRef: "gateway-authority:x402-wallet",
      supportedNetworks: ["base-sepolia"],
      supportedTokens: ["USDC"],
    },
    spendBounds: {
      principalId: "principal_demo",
      agentId: "agent_demo",
      runtimeAdapterId: "runtime_codex",
      objectiveRef: "intent:fetch paid context",
      allowedDomains: ["api.example.com"],
      allowedPayees: ["0xpayee"],
      allowedNetworks: ["base-sepolia"],
      allowedTokens: ["USDC"],
      maxAtomicAmountPerCall: "2500",
      maxAtomicAmountPerSession: "10000",
      maxAtomicAmountPerDay: "20000",
      reviewThresholdAtomicAmount: "5000",
      issuedAt: createdAt,
      expiresAt: futureIso(),
    },
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
