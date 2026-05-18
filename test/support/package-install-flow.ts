import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { HandshakeClient } from "../../src/sdk/client";
import type { PackageInstallRuntimeConfig } from "../../src/runtime/package-install/tool-wrapper";
import type {
  ActionType,
  OperatingEnvelope,
  GatewayRegistryEntry,
  ToolCapability,
} from "../../src/protocol/schemas";
import { futureIso } from "../fixtures";
import { FilePackageManifestSurface } from "./package-manifest-surface";

export type PackageInstallFixtureObjects = {
  tool: ToolCapability;
  actionType: ActionType;
  gateway: GatewayRegistryEntry;
  envelope: OperatingEnvelope;
};

export async function createPackageManifestSurface(
  prefix = "handshake-package-flow-",
): Promise<FilePackageManifestSurface> {
  const directory = await mkdtemp(join(tmpdir(), prefix));
  const surface = new FilePackageManifestSurface(join(directory, "package.json"));
  await surface.writeManifest({ dependencies: {} });
  return surface;
}

export async function registerFixtureObjectsWithClient(
  client: HandshakeClient,
  fixture: PackageInstallFixtureObjects,
): Promise<void> {
  await client.registerToolCapability(fixture.tool);
  await client.registerActionType(fixture.actionType);
  await client.registerGatewayRegistryEntry(fixture.gateway);
  await client.registerOperatingEnvelope(fixture.envelope);
}

export function packageInstallRuntimeConfig(fixture: PackageInstallFixtureObjects): PackageInstallRuntimeConfig {
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
    gatewayRegistryRef: "gateway_registry@v1",
    toolCapabilityId: fixture.tool.toolCapabilityId,
    actionTypeId: fixture.actionType.actionTypeId,
    gatewayRegistryEntryId: fixture.gateway.gatewayRegistryEntryId,
    gatewayId: fixture.gateway.gatewayId,
    contractExpiresAt: futureIso(),
    signingSecret: "test-secret",
  };
}
