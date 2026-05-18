import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { nowIso } from "../../src/protocol/ids";
import type {
  ActionType,
  OperatingEnvelope,
  ReceiverRegistryEntry,
  ToolCapability,
} from "../../src/protocol/schemas";
import type { HandshakeClient } from "../../src/sdk/client";
import {
  repoWriteResourceRef,
  type RepoWriteRuntimeConfig,
} from "../../src/runtime/repo-write/tool-wrapper";
import { futureIso } from "../fixtures";
import { FileRepoWriteSurface } from "./repo-write-surface";

export type RepoWriteFixtureObjects = {
  tool: ToolCapability;
  actionType: ActionType;
  receiver: ReceiverRegistryEntry;
  envelope: OperatingEnvelope;
  repositoryRef: string;
  filePath: string;
};

export function makeRepoWriteFixtureObjects(
  repositoryRef = "github:demo/repo",
  filePath = "src/generated.ts",
): RepoWriteFixtureObjects {
  const createdAt = nowIso();
  const resourceRef = repoWriteResourceRef(repositoryRef, filePath);
  const tool: ToolCapability = {
    schemaVersion: "0.2.0",
    tenantId: "tenant_demo",
    organizationId: "org_demo",
    createdAt,
    toolCapabilityId: "tool_repo_write",
    toolCatalogId: "tool_catalog_demo",
    toolCatalogVersion: "v1",
    runtimeAdapterId: "runtime_codex",
    toolName: "write file",
    toolNamespace: "filesystem",
    capabilityClass: "filesystem",
    readWriteClassification: "consequential",
    consequentialityDefault: "consequential",
    wrapperStatus: "wrapped",
    rawBypassPossible: true,
    inputSchemaRef: "schema:repo-write-input",
    outputSchemaRef: "schema:repo-write-output",
    secretBearingFields: [],
    supersededAt: null,
  };
  const actionType: ActionType = {
    schemaVersion: "0.2.0",
    tenantId: "tenant_demo",
    organizationId: "org_demo",
    createdAt,
    actionTypeId: "atype_repo_write",
    actionCatalogId: "action_catalog_demo",
    actionCatalogVersion: "v1",
    actionClass: "repo.write",
    receiverKind: "repository",
    requiredContractFields: ["receiverId", "resourceRef", "paramsDigest", "idempotencyKey"],
    canonicalParameterSchemaRef: "schema:repo-write-params",
    resourceRefSchemaRef: "schema:repo-resource",
    requiredEvidenceTypes: ["repo_file_diff"],
    allowedBoundsSchemaRef: "schema:repo-write-bounds",
    defaultReceiptRequirement: "mutation",
    defaultIdempotencyRequirement: "required",
    supersededAt: null,
  };
  const receiver: ReceiverRegistryEntry = {
    schemaVersion: "0.2.0",
    tenantId: "tenant_demo",
    organizationId: "org_demo",
    createdAt,
    receiverRegistryEntryId: "receiver_registry_repo_write",
    receiverRegistryVersion: "v1",
    receiverId: "receiver_repo_write",
    receiverKind: "repository",
    receiverAdapterId: "adapter_reference_repo_write",
    receiverAdapterVersion: "v1",
    gateEndpointRef: "internal:reference-repo-write-gate",
    receiverPolicyContractId: "receiver_policy_repo_write",
    receiverPolicyVersion: "v1",
    receiverPolicyDriftMode: "refuse_on_drift",
    compatiblePreviousReceiverPolicyVersions: [],
    acceptedActionCatalogVersions: ["v1"],
    resourceNamespaceRef: "repo:file",
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
    envelopeId: "env_repo_write_demo",
    principalId: "principal_demo",
    agentId: "agent_demo",
    objectiveRef: "intent:write-one-repo-file",
    allowedActionClasses: ["repo.write"],
    allowedReceivers: ["receiver_repo_write"],
    allowedResources: [resourceRef],
    evidenceRequirements: ["repo_file_diff"],
    policyPackRef: "policy:demo",
    policyPackVersion: "v1",
    issuedAt: createdAt,
    expiresAt: futureIso(),
    revokedAt: null,
  };
  return { tool, actionType, receiver, envelope, repositoryRef, filePath };
}

export async function registerRepoWriteFixtureObjectsWithClient(
  client: HandshakeClient,
  fixture: RepoWriteFixtureObjects,
): Promise<void> {
  await client.registerToolCapability(fixture.tool);
  await client.registerActionType(fixture.actionType);
  await client.registerReceiverRegistryEntry(fixture.receiver);
  await client.registerOperatingEnvelope(fixture.envelope);
}

export async function createRepoWriteSurface(prefix = "handshake-repo-write-"): Promise<FileRepoWriteSurface> {
  return new FileRepoWriteSurface(await mkdtemp(join(tmpdir(), prefix)));
}

export function repoWriteRuntimeConfig(fixture: RepoWriteFixtureObjects): RepoWriteRuntimeConfig {
  return {
    tenantId: "tenant_demo",
    organizationId: "org_demo",
    principalId: "principal_demo",
    agentId: "agent_demo",
    runId: "run_demo",
    runtimeAdapterId: "runtime_codex",
    operatingEnvelopeId: fixture.envelope.envelopeId,
    toolCatalogRef: "tool_catalog_demo@v1",
    actionCatalogRef: "action_catalog_demo@v1",
    receiverRegistryRef: "receiver_registry@v1",
    toolCapabilityId: fixture.tool.toolCapabilityId,
    actionTypeId: fixture.actionType.actionTypeId,
    receiverRegistryEntryId: fixture.receiver.receiverRegistryEntryId,
    receiverId: fixture.receiver.receiverId,
    contractExpiresAt: futureIso(),
    signingSecret: "test-secret",
  };
}
