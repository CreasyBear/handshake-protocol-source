import type { HandshakeClient } from "../../src/sdk/client";
import type { HandshakeKernel } from "../../src/protocol/kernel";
import type { CodemodeMultiActionRuntimeConfig } from "../../src/runtime/codemode-multi-action/wrapper";
import { makeKernelFixture } from "../fixtures";
import {
  makeRepoWriteFixtureObjects,
  repoWriteRuntimeConfig,
  type RepoWriteFixtureObjects,
} from "./repo-write-flow";
import {
  packageInstallRuntimeConfig,
  type PackageInstallFixtureObjects,
} from "./package-install-flow";

export type CodemodeMultiActionFixtureObjects = {
  packageInstall: PackageInstallFixtureObjects;
  repoWrite: RepoWriteFixtureObjects;
};

export function makeCodemodeMultiActionFixtureObjects(): CodemodeMultiActionFixtureObjects {
  const packageBase = makeKernelFixture();
  const repoWrite = makeRepoWriteFixtureObjects();
  const envelope = {
    ...packageBase.envelope,
    envelopeId: "env_codemode_multi_action",
    objectiveRef: "intent:install-package-and-write-file",
    allowedActionClasses: ["package.install", "repo.write"],
    allowedGateways: [packageBase.gateway.gatewayId, repoWrite.gateway.gatewayId],
    allowedResources: [
      "npm:hono",
      repoWrite.envelope.allowedResources[0] ?? repoWrite.repositoryRef,
    ],
    evidenceRequirements: ["package_lock_diff", "repo_file_diff"],
  };
  return {
    packageInstall: {
      tool: packageBase.tool,
      actionType: packageBase.actionType,
      gateway: packageBase.gateway,
      envelope,
    },
    repoWrite: {
      ...repoWrite,
      envelope,
    },
  };
}

export async function registerCodemodeMultiActionFixtureObjectsWithClient(
  client: HandshakeClient,
  fixture: CodemodeMultiActionFixtureObjects,
): Promise<void> {
  await client.registerToolCapability(fixture.packageInstall.tool);
  await client.registerActionType(fixture.packageInstall.actionType);
  await client.registerGatewayRegistryEntry(fixture.packageInstall.gateway);
  await client.registerToolCapability(fixture.repoWrite.tool);
  await client.registerActionType(fixture.repoWrite.actionType);
  await client.registerGatewayRegistryEntry(fixture.repoWrite.gateway);
  await client.registerOperatingEnvelope(fixture.packageInstall.envelope);
}

export async function registerCodemodeMultiActionFixtureObjectsWithKernel(
  kernel: HandshakeKernel,
  fixture: CodemodeMultiActionFixtureObjects,
): Promise<void> {
  await kernel.putCatalogObject({ objectType: "tool_capability", payload: fixture.packageInstall.tool });
  await kernel.putCatalogObject({ objectType: "action_type", payload: fixture.packageInstall.actionType });
  await kernel.putCatalogObject({ objectType: "gateway_registry_entry", payload: fixture.packageInstall.gateway });
  await kernel.putCatalogObject({ objectType: "tool_capability", payload: fixture.repoWrite.tool });
  await kernel.putCatalogObject({ objectType: "action_type", payload: fixture.repoWrite.actionType });
  await kernel.putCatalogObject({ objectType: "gateway_registry_entry", payload: fixture.repoWrite.gateway });
  await kernel.putCatalogObject({ objectType: "operating_envelope", payload: fixture.packageInstall.envelope });
}

export function codemodeMultiActionRuntimeConfig(
  fixture: CodemodeMultiActionFixtureObjects,
): CodemodeMultiActionRuntimeConfig {
  return {
    packageInstall: packageInstallRuntimeConfig(fixture.packageInstall),
    repoWrite: repoWriteRuntimeConfig(fixture.repoWrite),
  };
}
