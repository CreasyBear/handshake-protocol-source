import { describe, expect, it } from "bun:test";
import type { GeneratedExecutionGraph } from "../../src/protocol/areas/generated-execution-graph";
import { HandshakeKernel } from "../../src/protocol/kernel";
import type { ProtocolObjectType, ProtocolStore } from "../../src/protocol/store/port";
import { proposeCodemodeActionContracts } from "../../src/runtime/codemode-multi-action/generated-program-runner";
import { proposePackageInstallActionContract } from "../../src/runtime/package-install/action-proposal";
import { proposeRepoWriteActionContract } from "../../src/runtime/repo-write/action-proposal";
import { InMemoryProtocolStore } from "../../src/storage/memory";
import {
  codemodeMultiActionRuntimeConfig,
  makeCodemodeMultiActionFixtureObjects,
  registerCodemodeMultiActionFixtureObjectsWithKernel,
} from "../support/codemode-multi-action-flow";

type CodemodeKernelFixture = {
  store: ProtocolStore;
  kernel: HandshakeKernel;
  fixture: ReturnType<typeof makeCodemodeMultiActionFixtureObjects>;
};

describe("codemode multi-action runtime wrapper", () => {
  it("records graph evidence and emits ordered contracts without policy or gateway authority", async () => {
    const { store, kernel, fixture } = await makeCodemodeKernelFixture();

    const result = await proposeCodemodeActionContracts(kernel, codemodeMultiActionRuntimeConfig(fixture), {
      principalIntentRef: "intent:install package then write file",
      generatedCodeOrSpecRef: "code:codemode-multi-action",
      actions: [
        { actionClass: "package.install", package: "hono", versionRange: "^4.12.19" },
        {
          actionClass: "repo.write",
          repositoryRef: fixture.repoWrite.repositoryRef,
          filePath: fixture.repoWrite.filePath,
          content: "export const generatedValue = 42;\n",
        },
      ],
    });

    expect(result.outcome).toBe("action_contracts_proposed");
    expect(result.proposals.map((proposal) => proposal.outcome)).toEqual([
      "action_contract_proposed",
      "action_contract_proposed",
    ]);
    expect(result.proposals.map((proposal) => proposal.sequenceNumber)).toEqual([1, 2]);
    expect(result.proposals.map((proposal) => proposal.actionContract?.sequenceNumber)).toEqual([1, 2]);
    expect(result.proposals.map((proposal) => proposal.actionContract?.actionClass)).toEqual([
      "package.install",
      "repo.write",
    ]);
    const firstActionContractId = result.proposals[0]?.actionContract?.actionContractId;
    if (!firstActionContractId) throw new Error("expected first action contract id");
    expect(result.proposals[1]?.actionContract?.requiredPriorActionContractIds).toEqual([firstActionContractId]);
    expect(JSON.stringify(result.proposals[1]?.actionContract?.parameters)).not.toContain("generatedValue");
    expect(result.proposals.every((proposal) => proposal.intentCompilation.runtimeExecutionId)).toBe(true);
    expect(
      result.proposals.every((proposal) => proposal.intentCompilation.candidateAction.generatedExecutionGraphId),
    ).toBe(true);
    expect(result.proposals.every((proposal) => proposal.actionContract?.generatedExecutionGraphId)).toBe(true);

    const graphs = await store.listRecordsByType<GeneratedExecutionGraph>("generated_execution_graph");
    expect(graphs).toHaveLength(1);
    expect(graphs[0]?.payload.coverageStatus).toBe("fully_covered_no_unsupported_nodes");
    expect(graphs[0]?.payload.nodeCount).toBe(2);
    expect(JSON.stringify(graphs[0]?.payload)).not.toContain("generatedValue");
    expect(await recordCount(store, "runtime_execution")).toBe(1);
    expect(await recordCount(store, "generated_execution_graph")).toBe(1);
    expect(await recordCount(store, "intent_compilation")).toBe(3);
    expect(await recordCount(store, "action_contract")).toBe(2);
    expect(await recordCount(store, "policy_decision")).toBe(0);
    expect(await recordCount(store, "greenlight")).toBe(0);
    expect(await recordCount(store, "gateway_check_attempt")).toBe(0);
    expect(await recordCount(store, "mutation_attempt")).toBe(0);
  });

  it("refuses the whole generated program when one sibling candidate is refused", async () => {
    const { store, kernel, fixture } = await makeCodemodeKernelFixture({
      mutateFixture: (objects) => {
        objects.repoWrite.tool = { ...objects.repoWrite.tool, wrapperStatus: "unwrapped" };
      },
    });

    const result = await proposeCodemodeActionContracts(kernel, codemodeMultiActionRuntimeConfig(fixture), {
      principalIntentRef: "intent:install package then write file",
      generatedCodeOrSpecRef: "code:codemode-multi-action-unwrapped-repo",
      actions: [
        { actionClass: "package.install", package: "hono", versionRange: "^4.12.19" },
        {
          actionClass: "repo.write",
          repositoryRef: fixture.repoWrite.repositoryRef,
          filePath: fixture.repoWrite.filePath,
          content: "export const generatedValue = 42;\n",
        },
      ],
    });

    expect(result.outcome).toBe("generated_execution_block_refused");
    expect(result.proposals.map((proposal) => proposal.outcome)).toEqual([
      "generated_execution_block_refused",
      "intent_compilation_refused",
    ]);
    expect(result.proposals[0]?.refusalReasonCodes).toEqual(["generated_execution_block_sibling_refused"]);
    expect(result.proposals[1]?.refusalReasonCodes).toEqual(["unwrapped_consequential_tool"]);
    expect(await recordCount(store, "runtime_execution")).toBe(1);
    expect(await recordCount(store, "generated_execution_graph")).toBe(1);
    expect(await recordCount(store, "intent_compilation")).toBe(2);
    expect(await recordCount(store, "action_contract")).toBe(0);
    expect(await recordCount(store, "policy_decision")).toBe(0);
    expect(await recordCount(store, "greenlight")).toBe(0);
    expect(await recordCount(store, "gateway_check_attempt")).toBe(0);
    expect(await recordCount(store, "mutation_attempt")).toBe(0);
  });

  it("refuses later contract policy until its declared prior contract is greenlit", async () => {
    const { store, kernel, fixture } = await makeCodemodeKernelFixture();

    const result = await proposeCodemodeActionContracts(kernel, codemodeMultiActionRuntimeConfig(fixture), {
      principalIntentRef: "intent:install package then write file",
      generatedCodeOrSpecRef: "code:codemode-multi-action-sequence-policy",
      actions: [
        { actionClass: "package.install", package: "hono", versionRange: "^4.12.19" },
        {
          actionClass: "repo.write",
          repositoryRef: fixture.repoWrite.repositoryRef,
          filePath: fixture.repoWrite.filePath,
          content: "export const generatedValue = 42;\n",
        },
      ],
    });
    const first = result.proposals[0]?.actionContract;
    const second = result.proposals[1]?.actionContract;
    if (!first || !second) throw new Error("expected two action contracts");

    const earlySecondPolicy = await kernel.evaluatePolicy({
      actionContractId: second.actionContractId,
      envelopeId: fixture.packageInstall.envelope.envelopeId,
      signingSecret: "test-secret",
    });
    expect(earlySecondPolicy.decision.decision).toBe("refuse");
    expect(earlySecondPolicy.decision.decisionReasonCode).toBe("prior_action_not_greenlit");
    expect(earlySecondPolicy.greenlight).toBeNull();

    const firstPolicy = await kernel.evaluatePolicy({
      actionContractId: first.actionContractId,
      envelopeId: fixture.packageInstall.envelope.envelopeId,
      signingSecret: "test-secret",
    });
    expect(firstPolicy.decision.decision).toBe("greenlight");
    expect(firstPolicy.greenlight).not.toBeNull();

    const laterSecondPolicy = await kernel.evaluatePolicy({
      actionContractId: second.actionContractId,
      envelopeId: fixture.packageInstall.envelope.envelopeId,
      signingSecret: "test-secret",
    });
    expect(laterSecondPolicy.decision.decision).toBe("greenlight");
    expect(laterSecondPolicy.greenlight).not.toBeNull();
    expect(await recordCount(store, "greenlight")).toBe(2);
    expect(await recordCount(store, "gateway_check_attempt")).toBe(0);
    expect(await recordCount(store, "mutation_attempt")).toBe(0);
  });

  it("refuses later gateway check until its declared prior contract has a final receipt", async () => {
    const { store, kernel, fixture } = await makeCodemodeKernelFixture();

    const result = await proposeCodemodeActionContracts(kernel, codemodeMultiActionRuntimeConfig(fixture), {
      principalIntentRef: "intent:install package then write file",
      generatedCodeOrSpecRef: "code:codemode-multi-action-gate-sequence",
      actions: [
        { actionClass: "package.install", package: "hono", versionRange: "^4.12.19" },
        {
          actionClass: "repo.write",
          repositoryRef: fixture.repoWrite.repositoryRef,
          filePath: fixture.repoWrite.filePath,
          content: "export const generatedValue = 42;\n",
        },
      ],
    });
    const first = result.proposals[0]?.actionContract;
    const second = result.proposals[1]?.actionContract;
    if (!first || !second) throw new Error("expected two action contracts");

    const firstPolicy = await kernel.evaluatePolicy({
      actionContractId: first.actionContractId,
      envelopeId: fixture.packageInstall.envelope.envelopeId,
      signingSecret: "test-secret",
    });
    const secondPolicy = await kernel.evaluatePolicy({
      actionContractId: second.actionContractId,
      envelopeId: fixture.packageInstall.envelope.envelopeId,
      signingSecret: "test-secret",
    });
    if (!firstPolicy.greenlight || !secondPolicy.greenlight) throw new Error("expected greenlights");

    const earlySecondGate = await kernel.gatewayCheck({
      actionContractId: second.actionContractId,
      greenlightId: secondPolicy.greenlight.greenlightId,
      observedParameters: second.parameters,
    });
    expect(earlySecondGate.gateAttempt.gateDecision).toBe("refused");
    expect(earlySecondGate.gateAttempt.gateDecisionReasonCode).toBe("prior_action_not_receipted");
    expect(earlySecondGate.gateAttempt.consumedGreenlight).toBe(false);
    expect(earlySecondGate.mutationAttempt).toBeNull();

    const firstGate = await kernel.gatewayCheck({
      actionContractId: first.actionContractId,
      greenlightId: firstPolicy.greenlight.greenlightId,
      observedParameters: first.parameters,
    });
    expect(firstGate.gateAttempt.gateDecision).toBe("passed");
    if (!firstGate.mutationAttempt) throw new Error("expected first mutation attempt");
    await kernel.reconcileSurfaceOperation({
      mutationAttemptId: firstGate.mutationAttempt.mutationAttemptId,
      idempotencyKey: first.idempotencyKey,
      observedSurfaceOperationRef: firstGate.mutationAttempt.surfaceOperationRef,
      observedDownstreamStatus: "succeeded",
      evidenceRefs: ["evidence:first-action-complete"],
      resolvedProofGapIds: [],
    });

    const laterSecondGate = await kernel.gatewayCheck({
      actionContractId: second.actionContractId,
      greenlightId: secondPolicy.greenlight.greenlightId,
      observedParameters: second.parameters,
    });
    expect(laterSecondGate.gateAttempt.gateDecision).toBe("passed");
    expect(await recordCount(store, "gateway_check_attempt")).toBe(3);
    expect(await recordCount(store, "mutation_attempt")).toBe(2);
  });

  it("refuses policy when a declared prior contract is missing", async () => {
    const { store, kernel, fixture } = await makeCodemodeKernelFixture();
    const config = codemodeMultiActionRuntimeConfig(fixture);
    const proposed = await proposeRepoWriteActionContract(kernel, config.repoWrite, {
      principalIntentRef: "intent:write file after missing prior",
      generatedCodeOrSpecRef: "code:repo-write-missing-prior",
      repositoryRef: fixture.repoWrite.repositoryRef,
      filePath: fixture.repoWrite.filePath,
      content: "export const generatedValue = 42;\n",
      requiredPriorActionContractIds: ["act_missing_prior"],
    });
    if (proposed.outcome !== "action_contract_proposed") throw new Error("expected repo write contract");

    const policy = await kernel.evaluatePolicy({
      actionContractId: proposed.actionContract.actionContractId,
      envelopeId: fixture.packageInstall.envelope.envelopeId,
      signingSecret: "test-secret",
    });
    expect(policy.decision.decision).toBe("refuse");
    expect(policy.decision.decisionReasonCode).toBe("prior_action_missing");
    expect(policy.greenlight).toBeNull();
    expect(await recordCount(store, "greenlight")).toBe(0);
  });

  it("refuses policy when a declared prior contract was refused", async () => {
    const { store, kernel, fixture } = await makeCodemodeKernelFixture();
    const config = codemodeMultiActionRuntimeConfig(fixture);
    const refusedPrior = await proposePackageInstallActionContract(
      kernel,
      {
        ...config.packageInstall,
        contractExpiresAt: new Date(Date.now() - 60_000).toISOString(),
      },
      {
        principalIntentRef: "intent:install unapproved package then write file",
        generatedCodeOrSpecRef: "code:package-install-refused-prior",
        package: "hono",
        versionRange: "^4.12.19",
      },
    );
    if (refusedPrior.outcome !== "action_contract_proposed") throw new Error("expected prior action contract");
    const refusedPriorPolicy = await kernel.evaluatePolicy({
      actionContractId: refusedPrior.actionContract.actionContractId,
      envelopeId: fixture.packageInstall.envelope.envelopeId,
      signingSecret: "test-secret",
    });
    expect(refusedPriorPolicy.decision.decision).toBe("refuse");
    expect(refusedPriorPolicy.decision.decisionReasonCode).toBe("contract_expired");

    const proposed = await proposeRepoWriteActionContract(kernel, config.repoWrite, {
      principalIntentRef: "intent:write file after refused prior",
      generatedCodeOrSpecRef: "code:repo-write-refused-prior",
      repositoryRef: fixture.repoWrite.repositoryRef,
      filePath: fixture.repoWrite.filePath,
      content: "export const generatedValue = 42;\n",
      requiredPriorActionContractIds: [refusedPrior.actionContract.actionContractId],
    });
    if (proposed.outcome !== "action_contract_proposed") throw new Error("expected repo write contract");

    const policy = await kernel.evaluatePolicy({
      actionContractId: proposed.actionContract.actionContractId,
      envelopeId: fixture.packageInstall.envelope.envelopeId,
      signingSecret: "test-secret",
    });
    expect(policy.decision.decision).toBe("refuse");
    expect(policy.decision.decisionReasonCode).toBe("prior_action_refused");
    expect(policy.greenlight).toBeNull();
    expect(await recordCount(store, "greenlight")).toBe(0);
  });
});

async function makeCodemodeKernelFixture(
  options: {
    mutateFixture?: (fixture: ReturnType<typeof makeCodemodeMultiActionFixtureObjects>) => void;
  } = {},
): Promise<CodemodeKernelFixture> {
  const store = new InMemoryProtocolStore();
  const kernel = new HandshakeKernel(store);
  const fixture = makeCodemodeMultiActionFixtureObjects();
  options.mutateFixture?.(fixture);
  await registerCodemodeMultiActionFixtureObjectsWithKernel(kernel, fixture);
  return { store, kernel, fixture };
}

async function recordCount(store: ProtocolStore, objectType: ProtocolObjectType): Promise<number> {
  return (await store.listRecordsByType(objectType)).length;
}
