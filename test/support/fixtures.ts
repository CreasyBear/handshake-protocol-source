import { HandshakeKernel } from "../../src/protocol/kernel";
import { nowIso } from "../../src/protocol/foundation/ids";
import type {
  CompileIntentInput,
  CreateBypassProbeInput,
  ProposeActionContractInput,
} from "../../src/protocol/public/inputs";
import type { ProtocolStore } from "../../src/protocol/store/port";
import type {
  ActionType,
  OperatingEnvelope,
  GatewayRegistryEntry,
  ToolCapability,
} from "../../src/protocol/public/schemas";
import { PROTOCOL_VERSION, requiredGatewayCheckedBypassProbeKinds } from "../../src/protocol/public/schemas";
import { InMemoryProtocolStore } from "../../src/storage/memory";

export type KernelFixture = {
  store: ProtocolStore;
  kernel: HandshakeKernel;
  tool: ToolCapability;
  actionType: ActionType;
  gateway: GatewayRegistryEntry;
  envelope: OperatingEnvelope;
};

export function futureIso(minutes = 10): string {
  return new Date(Date.now() + minutes * 60_000).toISOString();
}

export function makeKernelFixture() {
  const store = new InMemoryProtocolStore();
  const kernel = new HandshakeKernel(store);
  const createdAt = nowIso();

  const tool: ToolCapability = {
    schemaVersion: PROTOCOL_VERSION,
    tenantId: "tenant_demo",
    organizationId: "org_demo",
    createdAt,
    toolCapabilityId: "tool_package_install",
    toolCatalogId: "tool_catalog_demo",
    toolCatalogVersion: "v1",
    runtimeAdapterId: "runtime_codex",
    toolName: "bun add",
    toolNamespace: "shell",
    capabilityClass: "package",
    readWriteClassification: "consequential",
    consequentialityDefault: "consequential",
    wrapperStatus: "wrapped",
    rawBypassPossible: true,
    inputSchemaRef: "schema:package-install-input",
    outputSchemaRef: "schema:package-install-output",
    secretBearingFields: [],
    supersededAt: null,
  };

  const actionType: ActionType = {
    schemaVersion: PROTOCOL_VERSION,
    tenantId: "tenant_demo",
    organizationId: "org_demo",
    createdAt,
    actionTypeId: "atype_package_install",
    actionCatalogId: "action_catalog_demo",
    actionCatalogVersion: "v1",
    actionClass: "package.install",
    protectedSurfaceKind: "package_manager",
    requiredContractFields: ["gatewayId", "resourceRef", "paramsDigest", "idempotencyKey"],
    canonicalParameterSchemaRef: "schema:package-install-params",
    resourceRefSchemaRef: "schema:package-resource",
    requiredEvidenceTypes: ["package_lock_diff"],
    allowedBoundsSchemaRef: "schema:package-install-bounds",
    defaultReceiptRequirement: "mutation",
    defaultIdempotencyRequirement: "required",
    supersededAt: null,
  };

  const gateway: GatewayRegistryEntry = {
    schemaVersion: PROTOCOL_VERSION,
    tenantId: "tenant_demo",
    organizationId: "org_demo",
    createdAt,
    gatewayRegistryEntryId: "gateway_registry_package",
    gatewayRegistryVersion: "v1",
    gatewayId: "gateway_package_manager",
    protectedSurfaceKind: "package_manager",
    gatewayAdapterId: "adapter_reference_package",
    gatewayAdapterVersion: "v1",
    gateEndpointRef: "internal:reference-package-gate",
    gatewayPolicyContractId: "gateway_policy_package",
    gatewayPolicyVersion: "v1",
    gatewayPolicyDriftMode: "refuse_on_drift",
    compatiblePreviousGatewayPolicyVersions: [],
    acceptedActionCatalogVersions: ["v1"],
    resourceNamespaceRef: "npm:package",
    canonicalizerVersion: "handshake-jcs-lite-0.2",
    receiptCapabilityStatus: "available",
    isolationCheckCapabilityStatus: "available",
    credentialCustodyStatus: "gateway_held",
    enforcementMode: "customer_gateway_adapter",
    mutationCredentialHolderRef: "secretref:package-manager-token",
    gatewayAuthorityHolderRef: "gateway-authority:package-manager",
    supersededAt: null,
  };

  const envelope: OperatingEnvelope = {
    schemaVersion: PROTOCOL_VERSION,
    tenantId: "tenant_demo",
    organizationId: "org_demo",
    createdAt,
    envelopeId: "env_demo",
    principalId: "principal_demo",
    agentId: "agent_demo",
    objectiveRef: "intent:install-approved-package",
    allowedActionClasses: ["package.install"],
    allowedGateways: ["gateway_package_manager"],
    allowedResources: ["npm:hono"],
    requiredProtectedPathState: "not_required",
    evidenceRequirements: ["package_lock_diff"],
    policyPackRef: "policy:demo",
    policyPackVersion: "v1",
    issuedAt: createdAt,
    expiresAt: futureIso(),
    revokedAt: null,
  };

  return { store, kernel, tool, actionType, gateway, envelope };
}

export async function registerFixtureObjects(
  fixture: Pick<KernelFixture, "kernel" | "tool" | "actionType" | "gateway" | "envelope">,
) {
  await fixture.kernel.putCatalogObject({ objectType: "tool_capability", payload: fixture.tool });
  await fixture.kernel.putCatalogObject({ objectType: "action_type", payload: fixture.actionType });
  await fixture.kernel.putCatalogObject({ objectType: "gateway_registry_entry", payload: fixture.gateway });
  await fixture.kernel.putCatalogObject({ objectType: "operating_envelope", payload: fixture.envelope });
}

export async function recordSafeBypassProbes(
  fixture: Pick<KernelFixture, "kernel" | "gateway">,
  overrides: Partial<CreateBypassProbeInput> = {},
): Promise<string[]> {
  const scope = {
    tenantId: overrides.tenantId ?? "tenant_demo",
    organizationId: overrides.organizationId ?? "org_demo",
    runtimeAdapterId: overrides.runtimeAdapterId ?? "runtime_codex",
    gatewayId: overrides.gatewayId ?? fixture.gateway.gatewayId,
    actionClass: overrides.actionClass ?? "package.install",
    resourceRef: overrides.resourceRef ?? "npm:hono",
    protectedSurfaceKind: overrides.protectedSurfaceKind ?? "package_manager",
    expiresAt: overrides.expiresAt ?? futureIso(),
  };
  const probes = [];
  for (const probeKind of requiredGatewayCheckedBypassProbeKinds) {
    probes.push(
      await fixture.kernel.createBypassProbe({
        ...scope,
        probeKind,
        probeOutcome: "passed",
        sourceAuthority: "gateway_probe",
        reasonCodes: ["test_gateway_probe_passed"],
        evidenceRefs: [`evidence:test-gateway-probe:${probeKind}`],
      }),
    );
  }
  return probes.map((probe) => probe.bypassProbeId);
}

export function makePackageInstallCandidate(
  fixture: Pick<ReturnType<typeof makeKernelFixture>, "tool" | "actionType" | "gateway">,
  overrides: Partial<CompileIntentInput["candidate"]> = {},
): CompileIntentInput["candidate"] {
  const parameters = { package: "hono", versionRange: "^4.12.19" };
  return {
    toolCapabilityId: fixture.tool.toolCapabilityId,
    actionTypeId: fixture.actionType.actionTypeId,
    gatewayRegistryEntryId: fixture.gateway.gatewayRegistryEntryId,
    actionClass: "package.install",
    gatewayId: fixture.gateway.gatewayId,
    resourceRef: "npm:hono",
    sequenceNumber: 1,
    requiredPriorActionContractIds: [],
    recoveryRecommendationId: null,
    parameters,
    nonSecretParamsSummary: parameters,
    secretRefs: {},
    purposeCode: "dependency_add",
    expectedSideEffectCodes: ["package_json_change", "lockfile_change"],
    evidenceRefs: ["evidence:package-lock-diff"],
    bounds: { maxPackages: 1 },
    idempotencyKey: "idem_package_hono",
    rollbackHint: "remove package and restore lockfile",
    expiresAt: futureIso(),
    ...overrides,
  };
}

export function proposalInputForCompilation(
  compilation: {
    intentCompilationId: string;
    candidateAction: { candidateActionId: string; candidateDigest: string | null };
  },
  signingSecret?: string,
): ProposeActionContractInput {
  return {
    intentCompilationId: compilation.intentCompilationId,
    candidateActionId: compilation.candidateAction.candidateActionId,
    candidateDigest: requireCandidateDigest(compilation.candidateAction.candidateDigest),
    ...(signingSecret ? { signingSecret } : {}),
  };
}

export async function recordUnknownDownstreamProofGap(
  fixture: Pick<Awaited<ReturnType<typeof createGreenlitContract>>, "kernel" | "contract">,
  gate: { mutationAttempt: { mutationAttemptId: string; surfaceOperationRef: string | null } | null },
) {
  if (!gate.mutationAttempt) throw new Error("expected mutation attempt before reconciliation proof gap");
  const result = await fixture.kernel.reconcileSurfaceOperation({
    mutationAttemptId: gate.mutationAttempt.mutationAttemptId,
    idempotencyKey: fixture.contract.idempotencyKey,
    observedSurfaceOperationRef: gate.mutationAttempt.surfaceOperationRef,
    observedDownstreamStatus: "unknown",
    evidenceRefs: [],
    resolvedProofGapIds: [],
  });
  if (!result.createdProofGap) throw new Error("expected downstream unknown proof gap");
  return result.createdProofGap;
}

export async function createGreenlitContract<T extends KernelFixture = ReturnType<typeof makeKernelFixture>>(
  fixture: T = makeKernelFixture() as unknown as T,
) {
  await registerFixtureObjects(fixture);
  const compilation = await fixture.kernel.compileIntent({
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
    generatedCodeOrSpecRefs: ["code:generated-plan"],
    declaredAssumptions: ["package name is explicit"],
    requiredEvidenceRefs: ["evidence:package-lock-diff"],
    candidate: makePackageInstallCandidate(fixture),
  });

  const contract = await fixture.kernel.proposeActionContract(proposalInputForCompilation(compilation, "test-secret"));
  const policy = await fixture.kernel.evaluatePolicy({
    actionContractId: contract.actionContractId,
    envelopeId: fixture.envelope.envelopeId,
    signingSecret: "test-secret",
  });
  if (!policy.greenlight) throw new Error("fixture did not greenlight");
  return { ...fixture, compilation, contract, decision: policy.decision, greenlight: policy.greenlight };
}

export function requireCandidateDigest(candidateDigest: string | null): string {
  if (!candidateDigest) throw new Error("Contractable candidate is missing candidateDigest.");
  return candidateDigest;
}
