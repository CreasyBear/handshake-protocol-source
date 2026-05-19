import type { GatewayRegistryEntry } from "../../src/protocol/public/schemas";
import { ProtocolRecorder } from "../../src/protocol/events/records";
import {
  makeKernelFixture,
  makePackageInstallCandidate,
  proposalInputForCompilation,
  registerFixtureObjects,
} from "./fixtures";
import type { createGreenlitContract, KernelFixture } from "./fixtures";

export async function replaceGatewayRecordOutOfBand(
  fixture: Awaited<ReturnType<typeof createGreenlitContract>>,
  gateway: GatewayRegistryEntry,
): Promise<void> {
  const recorder = new ProtocolRecorder(fixture.store);
  await fixture.store.putRecord(await recorder.buildRecord({ objectType: "gateway_registry_entry", payload: gateway }));
}

export async function createContractRequiringGatewayCheckedPosture<
  T extends KernelFixture = ReturnType<typeof makeKernelFixture>,
>(idempotencyKey = "idem_posture_required", fixture: T = makeKernelFixture() as unknown as T) {
  fixture.envelope = {
    ...fixture.envelope,
    envelopeId: "env_posture_required",
    objectiveRef: "intent:install-with-enforcing-gateway",
    requiredProtectedPathState: "gateway_checked",
  };
  await registerFixtureObjects(fixture);
  const compilation = await fixture.kernel.compileIntent({
    tenantId: "tenant_demo",
    organizationId: "org_demo",
    principalIntentRef: "intent:install hono with gateway posture",
    principalId: "principal_demo",
    agentId: "agent_demo",
    runId: "run_demo",
    runtimeAdapterId: "runtime_codex",
    operatingEnvelopeId: fixture.envelope.envelopeId,
    toolCatalogRef: "tool_catalog_demo@v1",
    actionCatalogRef: "action_catalog_demo@v1",
    gatewayRegistryRef: "gateway_registry@v1",
    candidate: makePackageInstallCandidate(fixture, { idempotencyKey }),
  });
  const contract = await fixture.kernel.proposeActionContract(proposalInputForCompilation(compilation, "test-secret"));
  return { ...fixture, compilation, contract };
}

export async function createAdditionalGreenlitPackageContract(
  fixture: Awaited<ReturnType<typeof createGreenlitContract>>,
  candidateOverrides: Parameters<typeof makePackageInstallCandidate>[1] = {},
) {
  const compilation = await fixture.kernel.compileIntent({
    tenantId: "tenant_demo",
    organizationId: "org_demo",
    principalIntentRef: `intent:additional package ${candidateOverrides.idempotencyKey ?? "install"}`,
    principalId: "principal_demo",
    agentId: "agent_demo",
    runId: "run_demo",
    runtimeAdapterId: "runtime_codex",
    operatingEnvelopeId: fixture.envelope.envelopeId,
    toolCatalogRef: "tool_catalog_demo@v1",
    actionCatalogRef: "action_catalog_demo@v1",
    gatewayRegistryRef: "gateway_registry@v1",
    generatedCodeOrSpecRefs: ["code:generated-plan"],
    declaredAssumptions: ["package name is explicit"],
    requiredEvidenceRefs: ["evidence:package-lock-diff"],
    candidate: makePackageInstallCandidate(fixture, candidateOverrides),
  });
  const contract = await fixture.kernel.proposeActionContract(proposalInputForCompilation(compilation, "test-secret"));
  const policy = await fixture.kernel.evaluatePolicy({
    actionContractId: contract.actionContractId,
    envelopeId: fixture.envelope.envelopeId,
    signingSecret: "test-secret",
  });
  if (!policy.greenlight) throw new Error("additional fixture did not greenlight");
  return { compilation, contract, decision: policy.decision, greenlight: policy.greenlight };
}
