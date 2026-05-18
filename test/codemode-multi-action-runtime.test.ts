import { describe, expect, it } from "bun:test";
import { HandshakeClient } from "../src/sdk/client";
import { proposeCodemodeActionContracts } from "../src/runtime/codemode-multi-action/wrapper";
import { proposePackageInstallActionContract } from "../src/runtime/package-install/tool-wrapper";
import { proposeRepoWriteActionContract } from "../src/runtime/repo-write/tool-wrapper";
import { createD1HttpHarness } from "./support/d1-http-harness";
import {
  codemodeMultiActionRuntimeConfig,
  makeCodemodeMultiActionFixtureObjects,
  registerCodemodeMultiActionFixtureObjectsWithClient,
} from "./support/codemode-multi-action-flow";

type CountRow = {
  count: number;
};

describe("codemode multi-action runtime wrapper", () => {
  it("emits ordered package-install and repo-write action contracts without policy or gateway authority", async () => {
    const harness = await createD1HttpHarness();
    try {
      const client = new HandshakeClient("http://handshake.test", harness.fetch);
      const fixture = makeCodemodeMultiActionFixtureObjects();
      await registerCodemodeMultiActionFixtureObjectsWithClient(client, fixture);

      const result = await proposeCodemodeActionContracts(client, codemodeMultiActionRuntimeConfig(fixture), {
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
      expect(await recordCount(harness, "intent_compilation")).toBe(2);
      expect(await recordCount(harness, "action_contract")).toBe(2);
      expect(await recordCount(harness, "policy_decision")).toBe(0);
      expect(await recordCount(harness, "greenlight")).toBe(0);
      expect(await recordCount(harness, "gateway_check_attempt")).toBe(0);
      expect(await recordCount(harness, "mutation_attempt")).toBe(0);
    } finally {
      await harness.dispose();
    }
  });

  it("records candidate refusal without granting authority to the rest of the generated program", async () => {
    const harness = await createD1HttpHarness();
    try {
      const client = new HandshakeClient("http://handshake.test", harness.fetch);
      const fixture = makeCodemodeMultiActionFixtureObjects();
      fixture.repoWrite.tool = { ...fixture.repoWrite.tool, wrapperStatus: "unwrapped" };
      await registerCodemodeMultiActionFixtureObjectsWithClient(client, fixture);

      const result = await proposeCodemodeActionContracts(client, codemodeMultiActionRuntimeConfig(fixture), {
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

      expect(result.outcome).toBe("one_or_more_candidates_refused");
      expect(result.proposals.map((proposal) => proposal.outcome)).toEqual([
        "action_contract_proposed",
        "intent_compilation_refused",
      ]);
      expect(result.proposals[1]?.refusalReasonCodes).toEqual(["unwrapped_consequential_tool"]);
      expect(await recordCount(harness, "intent_compilation")).toBe(2);
      expect(await recordCount(harness, "action_contract")).toBe(1);
      expect(await recordCount(harness, "policy_decision")).toBe(0);
      expect(await recordCount(harness, "greenlight")).toBe(0);
      expect(await recordCount(harness, "gateway_check_attempt")).toBe(0);
      expect(await recordCount(harness, "mutation_attempt")).toBe(0);
    } finally {
      await harness.dispose();
    }
  });

  it("refuses later contract policy until its declared prior contract is greenlit", async () => {
    const harness = await createD1HttpHarness();
    try {
      const client = new HandshakeClient("http://handshake.test", harness.fetch);
      const fixture = makeCodemodeMultiActionFixtureObjects();
      await registerCodemodeMultiActionFixtureObjectsWithClient(client, fixture);

      const result = await proposeCodemodeActionContracts(client, codemodeMultiActionRuntimeConfig(fixture), {
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

      const earlySecondPolicy = await client.evaluatePolicy({
        actionContractId: second.actionContractId,
        envelopeId: fixture.packageInstall.envelope.envelopeId,
        signingSecret: "test-secret",
      });
      expect(earlySecondPolicy.decision.decision).toBe("refuse");
      expect(earlySecondPolicy.decision.decisionReasonCode).toBe("prior_action_not_greenlit");
      expect(earlySecondPolicy.greenlight).toBeNull();

      const firstPolicy = await client.evaluatePolicy({
        actionContractId: first.actionContractId,
        envelopeId: fixture.packageInstall.envelope.envelopeId,
        signingSecret: "test-secret",
      });
      expect(firstPolicy.decision.decision).toBe("greenlight");
      expect(firstPolicy.greenlight).not.toBeNull();

      const laterSecondPolicy = await client.evaluatePolicy({
        actionContractId: second.actionContractId,
        envelopeId: fixture.packageInstall.envelope.envelopeId,
        signingSecret: "test-secret",
      });
      expect(laterSecondPolicy.decision.decision).toBe("greenlight");
      expect(laterSecondPolicy.greenlight).not.toBeNull();
      expect(await recordCount(harness, "greenlight")).toBe(2);
      expect(await recordCount(harness, "gateway_check_attempt")).toBe(0);
      expect(await recordCount(harness, "mutation_attempt")).toBe(0);
    } finally {
      await harness.dispose();
    }
  });

  it("refuses later gateway check until its declared prior contract has a final receipt", async () => {
    const harness = await createD1HttpHarness();
    try {
      const client = new HandshakeClient("http://handshake.test", harness.fetch);
      const fixture = makeCodemodeMultiActionFixtureObjects();
      await registerCodemodeMultiActionFixtureObjectsWithClient(client, fixture);

      const result = await proposeCodemodeActionContracts(client, codemodeMultiActionRuntimeConfig(fixture), {
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

      const firstPolicy = await client.evaluatePolicy({
        actionContractId: first.actionContractId,
        envelopeId: fixture.packageInstall.envelope.envelopeId,
        signingSecret: "test-secret",
      });
      const secondPolicy = await client.evaluatePolicy({
        actionContractId: second.actionContractId,
        envelopeId: fixture.packageInstall.envelope.envelopeId,
        signingSecret: "test-secret",
      });
      if (!firstPolicy.greenlight || !secondPolicy.greenlight) throw new Error("expected greenlights");

      const earlySecondGate = await client.gatewayCheck({
        actionContractId: second.actionContractId,
        greenlightId: secondPolicy.greenlight.greenlightId,
        observedParameters: second.parameters,
        downstreamMode: "succeed",
      });
      expect(earlySecondGate.gateAttempt.gateDecision).toBe("refused");
      expect(earlySecondGate.gateAttempt.gateDecisionReasonCode).toBe("prior_action_not_receipted");
      expect(earlySecondGate.gateAttempt.consumedGreenlight).toBe(false);
      expect(earlySecondGate.mutationAttempt).toBeNull();

      const firstGate = await client.gatewayCheck({
        actionContractId: first.actionContractId,
        greenlightId: firstPolicy.greenlight.greenlightId,
        observedParameters: first.parameters,
        downstreamMode: "succeed",
      });
      expect(firstGate.gateAttempt.gateDecision).toBe("passed");

      const laterSecondGate = await client.gatewayCheck({
        actionContractId: second.actionContractId,
        greenlightId: secondPolicy.greenlight.greenlightId,
        observedParameters: second.parameters,
        downstreamMode: "succeed",
      });
      expect(laterSecondGate.gateAttempt.gateDecision).toBe("passed");
      expect(await recordCount(harness, "gateway_check_attempt")).toBe(3);
      expect(await recordCount(harness, "mutation_attempt")).toBe(2);
    } finally {
      await harness.dispose();
    }
  });

  it("refuses policy when a declared prior contract is missing", async () => {
    const harness = await createD1HttpHarness();
    try {
      const client = new HandshakeClient("http://handshake.test", harness.fetch);
      const fixture = makeCodemodeMultiActionFixtureObjects();
      await registerCodemodeMultiActionFixtureObjectsWithClient(client, fixture);
      const config = codemodeMultiActionRuntimeConfig(fixture);
      const proposed = await proposeRepoWriteActionContract(client, config.repoWrite, {
        principalIntentRef: "intent:write file after missing prior",
        generatedCodeOrSpecRef: "code:repo-write-missing-prior",
        repositoryRef: fixture.repoWrite.repositoryRef,
        filePath: fixture.repoWrite.filePath,
        content: "export const generatedValue = 42;\n",
        requiredPriorActionContractIds: ["act_missing_prior"],
      });
      if (proposed.outcome !== "action_contract_proposed") throw new Error("expected repo write contract");

      const policy = await client.evaluatePolicy({
        actionContractId: proposed.actionContract.actionContractId,
        envelopeId: fixture.packageInstall.envelope.envelopeId,
        signingSecret: "test-secret",
      });
      expect(policy.decision.decision).toBe("refuse");
      expect(policy.decision.decisionReasonCode).toBe("prior_action_missing");
      expect(policy.greenlight).toBeNull();
      expect(await recordCount(harness, "greenlight")).toBe(0);
    } finally {
      await harness.dispose();
    }
  });

  it("refuses policy when a declared prior contract was refused", async () => {
    const harness = await createD1HttpHarness();
    try {
      const client = new HandshakeClient("http://handshake.test", harness.fetch);
      const fixture = makeCodemodeMultiActionFixtureObjects();
      await registerCodemodeMultiActionFixtureObjectsWithClient(client, fixture);
      const config = codemodeMultiActionRuntimeConfig(fixture);
      const refusedPrior = await proposePackageInstallActionContract(client, config.packageInstall, {
        principalIntentRef: "intent:install unapproved package then write file",
        generatedCodeOrSpecRef: "code:package-install-refused-prior",
        package: "left-pad",
        versionRange: "^1.3.0",
      });
      if (refusedPrior.outcome !== "action_contract_proposed") throw new Error("expected prior action contract");
      const refusedPriorPolicy = await client.evaluatePolicy({
        actionContractId: refusedPrior.actionContract.actionContractId,
        envelopeId: fixture.packageInstall.envelope.envelopeId,
        signingSecret: "test-secret",
      });
      expect(refusedPriorPolicy.decision.decision).toBe("refuse");
      expect(refusedPriorPolicy.decision.decisionReasonCode).toBe("resource_outside_envelope");

      const proposed = await proposeRepoWriteActionContract(client, config.repoWrite, {
        principalIntentRef: "intent:write file after refused prior",
        generatedCodeOrSpecRef: "code:repo-write-refused-prior",
        repositoryRef: fixture.repoWrite.repositoryRef,
        filePath: fixture.repoWrite.filePath,
        content: "export const generatedValue = 42;\n",
        requiredPriorActionContractIds: [refusedPrior.actionContract.actionContractId],
      });
      if (proposed.outcome !== "action_contract_proposed") throw new Error("expected repo write contract");

      const policy = await client.evaluatePolicy({
        actionContractId: proposed.actionContract.actionContractId,
        envelopeId: fixture.packageInstall.envelope.envelopeId,
        signingSecret: "test-secret",
      });
      expect(policy.decision.decision).toBe("refuse");
      expect(policy.decision.decisionReasonCode).toBe("prior_action_refused");
      expect(policy.greenlight).toBeNull();
      expect(await recordCount(harness, "greenlight")).toBe(0);
    } finally {
      await harness.dispose();
    }
  });
});

async function recordCount(harness: Awaited<ReturnType<typeof createD1HttpHarness>>, objectType: string): Promise<number> {
  const rows = await harness.query<CountRow>(
    "SELECT COUNT(*) AS count FROM protocol_records WHERE object_type = ?",
    objectType,
  );
  return rows[0]?.count ?? 0;
}
