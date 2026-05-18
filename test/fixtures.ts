import { HandshakeKernel } from "../src/protocol/kernel";
import { nowIso } from "../src/protocol/ids";
import type {
  ActionType,
  OperatingEnvelope,
  ReceiverRegistryEntry,
  ToolCapability,
} from "../src/protocol/schemas";
import { InMemoryProtocolStore } from "../src/storage/memory";

export function futureIso(minutes = 10): string {
  return new Date(Date.now() + minutes * 60_000).toISOString();
}

export function makeKernelFixture() {
  const store = new InMemoryProtocolStore();
  const kernel = new HandshakeKernel(store);
  const createdAt = nowIso();

  const tool: ToolCapability = {
    schemaVersion: "0.2.0",
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
    schemaVersion: "0.2.0",
    tenantId: "tenant_demo",
    organizationId: "org_demo",
    createdAt,
    actionTypeId: "atype_package_install",
    actionCatalogId: "action_catalog_demo",
    actionCatalogVersion: "v1",
    actionClass: "package.install",
    receiverKind: "package_manager",
    requiredContractFields: ["receiverId", "resourceRef", "paramsDigest", "idempotencyKey"],
    canonicalParameterSchemaRef: "schema:package-install-params",
    resourceRefSchemaRef: "schema:package-resource",
    requiredEvidenceTypes: ["package_lock_diff"],
    allowedBoundsSchemaRef: "schema:package-install-bounds",
    defaultReceiptRequirement: "mutation",
    defaultIdempotencyRequirement: "required",
    supersededAt: null,
  };

  const receiver: ReceiverRegistryEntry = {
    schemaVersion: "0.2.0",
    tenantId: "tenant_demo",
    organizationId: "org_demo",
    createdAt,
    receiverRegistryEntryId: "receiver_registry_package",
    receiverRegistryVersion: "v1",
    receiverId: "receiver_package_manager",
    receiverKind: "package_manager",
    receiverAdapterId: "adapter_reference_package",
    receiverAdapterVersion: "v1",
    gateEndpointRef: "internal:reference-package-gate",
    receiverPolicyContractId: "receiver_policy_package",
    receiverPolicyVersion: "v1",
    receiverPolicyDriftMode: "refuse_on_drift",
    compatiblePreviousReceiverPolicyVersions: [],
    acceptedActionCatalogVersions: ["v1"],
    resourceNamespaceRef: "npm:package",
    canonicalizerVersion: "handshake-jcs-lite-0.2",
    receiptCapabilityStatus: "available",
    isolationCheckCapabilityStatus: "available",
    supersededAt: null,
  };

  const envelope: OperatingEnvelope = {
    schemaVersion: "0.2.0",
    tenantId: "tenant_demo",
    organizationId: "org_demo",
    createdAt,
    envelopeId: "env_demo",
    principalId: "principal_demo",
    agentId: "agent_demo",
    objectiveRef: "intent:install-approved-package",
    allowedActionClasses: ["package.install"],
    allowedReceivers: ["receiver_package_manager"],
    allowedResources: ["npm:hono"],
    evidenceRequirements: ["package_lock_diff"],
    policyPackRef: "policy:demo",
    policyPackVersion: "v1",
    issuedAt: createdAt,
    expiresAt: futureIso(),
    revokedAt: null,
  };

  return { store, kernel, tool, actionType, receiver, envelope };
}

export async function registerFixtureObjects(fixture: ReturnType<typeof makeKernelFixture>) {
  await fixture.kernel.putCatalogObject({ objectType: "tool_capability", payload: fixture.tool });
  await fixture.kernel.putCatalogObject({ objectType: "action_type", payload: fixture.actionType });
  await fixture.kernel.putCatalogObject({ objectType: "receiver_registry_entry", payload: fixture.receiver });
  await fixture.kernel.putCatalogObject({ objectType: "operating_envelope", payload: fixture.envelope });
}

export async function createGreenlitContract(fixture = makeKernelFixture()) {
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
    receiverRegistryRef: "receiver_registry@v1",
    generatedCodeOrSpecRefs: ["code:generated-plan"],
    declaredAssumptions: ["package name is explicit"],
    requiredEvidenceRefs: ["evidence:package-lock-diff"],
    candidate: {
      toolCapabilityId: fixture.tool.toolCapabilityId,
      actionTypeId: fixture.actionType.actionTypeId,
      receiverRegistryEntryId: fixture.receiver.receiverRegistryEntryId,
      actionClass: "package.install",
      receiverId: fixture.receiver.receiverId,
      resourceRef: "npm:hono",
    },
  });

  const contract = await fixture.kernel.proposeActionContract({
    tenantId: "tenant_demo",
    organizationId: "org_demo",
    intentCompilationId: compilation.intentCompilationId,
    envelopeId: fixture.envelope.envelopeId,
    receiverRegistryEntryId: fixture.receiver.receiverRegistryEntryId,
    receiverId: fixture.receiver.receiverId,
    principalId: "principal_demo",
    agentId: "agent_demo",
    runId: "run_demo",
    sequenceNumber: 1,
    actionClass: "package.install",
    resourceRef: "npm:hono",
    parameters: { package: "hono", versionRange: "^4.12.19" },
    nonSecretParamsSummary: { package: "hono", versionRange: "^4.12.19" },
    purposeCode: "dependency_add",
    expectedSideEffectCodes: ["package_json_change", "lockfile_change"],
    evidenceRefs: ["evidence:package-lock-diff"],
    bounds: { maxPackages: 1 },
    idempotencyKey: "idem_package_hono",
    rollbackHint: "remove package and restore lockfile",
    expiresAt: futureIso(),
    signingSecret: "test-secret",
  });
  const policy = await fixture.kernel.evaluatePolicy({
    actionContractId: contract.actionContractId,
    envelopeId: fixture.envelope.envelopeId,
    signingSecret: "test-secret",
  });
  if (!policy.greenlight) throw new Error("fixture did not greenlight");
  return { ...fixture, compilation, contract, decision: policy.decision, greenlight: policy.greenlight };
}
