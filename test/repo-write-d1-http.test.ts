import { describe, expect, it } from "bun:test";
import { runRepoWriteGateway } from "../src/adapters/repo-write/gateway";
import { digestUtf8Content, utf8ByteLength } from "../src/protocol/content-digests";
import { HandshakeClient } from "../src/sdk/client";
import { proposeRepoWriteActionContract } from "../src/runtime/repo-write/tool-wrapper";
import { createD1HttpHarness, D1_HARNESS_TRANSITION_TOKEN, type D1HttpHarness } from "./support/d1-http-harness";
import {
  createRepoWriteSurface,
  makeRepoWriteFixtureObjects,
  registerRepoWriteFixtureObjectsWithClient,
  repoWriteRuntimeConfig,
} from "./support/repo-write-flow";

type StreamEventRow = {
  offset: number;
  event_type: string;
  previous_event_digest: string | null;
  event_digest: string;
};
type CountRow = {
  count: number;
};

describe("repo write Hono/D1 reference gateway", () => {
  it("mutates a repository file only after a content-digest-bound gateway check", async () => {
    const harness = await createD1HttpHarness();
    try {
      const content = "export const generatedValue = 42;\n";
      const { actionContract, client, fixture, greenlight, surface } = await createRepoWriteContract(harness, content);

      expect(actionContract.parameters).toEqual({
        repositoryRef: fixture.repositoryRef,
        filePath: fixture.filePath,
        contentDigest: await digestUtf8Content(content),
        contentByteLength: utf8ByteLength(content),
      });
      expect(JSON.stringify(actionContract.parameters)).not.toContain(content);
      expect(await surface.readFile(fixture.filePath)).toBeNull();

      const gatewayResult = await runRepoWriteGateway({
        protocol: client,
        surface,
        actionContractId: actionContract.actionContractId,
        greenlightId: greenlight.greenlightId,
        repositoryRef: fixture.repositoryRef,
        filePath: fixture.filePath,
        content,
        surfaceOperationRef: "surface-op:d1-http-repo-write",
      });

      expect(gatewayResult.outcome).toBe("mutation_reconciled");
      expect(gatewayResult.gatewayCheck.gateAttempt.gateDecision).toBe("passed");
      expect(gatewayResult.gatewayCheck.receipt.finalityStatus).toBe("pending");
      expect(gatewayResult.reconciliation?.finalityStatus).toBe("final");
      expect(await surface.readFile(fixture.filePath)).toBe(content);
      expect(surface.mutationCount).toBe(1);

      const events = await actionEvents(harness, actionContract.actionContractId);
      expect(events.map((event) => event.event_type)).toEqual([
        "action_proposed",
        "policy_decision_recorded",
        "action_greenlit",
        "gateway_checked",
        "mutation_attempted",
        "protected_surface_operation_claimed",
        "receipt_emitted",
        "surface_operation_reconciled",
        "protected_surface_operation_released",
      ]);
      expect(events.map((event) => event.offset)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
      for (let index = 1; index < events.length; index += 1) {
        expect(events[index]?.previous_event_digest).toBe(events[index - 1]?.event_digest);
      }

      expect(await recordCount(harness, "mutation_attempt")).toBe(1);
      expect(await recordCount(harness, "surface_operation_reconciliation")).toBe(1);
    } finally {
      await harness.dispose();
    }
  });

  it("refuses repo mutation when generated content differs from the proposed content digest", async () => {
    const harness = await createD1HttpHarness();
    try {
      const proposedContent = "export const generatedValue = 42;\n";
      const differentContent = "export const generatedValue = 43;\n";
      const { actionContract, client, fixture, greenlight, surface } = await createRepoWriteContract(
        harness,
        proposedContent,
      );

      const gatewayResult = await runRepoWriteGateway({
        protocol: client,
        surface,
        actionContractId: actionContract.actionContractId,
        greenlightId: greenlight.greenlightId,
        repositoryRef: fixture.repositoryRef,
        filePath: fixture.filePath,
        content: differentContent,
        surfaceOperationRef: "surface-op:d1-http-repo-write-mismatch",
      });

      expect(gatewayResult.outcome).toBe("gateway_check_refused");
      expect(gatewayResult.gatewayCheck.gateAttempt.gateDecision).toBe("refused");
      expect(gatewayResult.gatewayCheck.gateAttempt.gateDecisionReasonCode).toBe("params_mismatch");
      expect(gatewayResult.gatewayCheck.receipt.downstreamExecutionStatus).toBe("not_started");
      expect(await surface.readFile(fixture.filePath)).toBeNull();
      expect(surface.mutationCount).toBe(0);

      const events = await actionEvents(harness, actionContract.actionContractId);
      expect(events.map((event) => event.event_type)).toEqual([
        "action_proposed",
        "policy_decision_recorded",
        "action_greenlit",
        "gateway_checked",
        "receipt_emitted",
      ]);
      expect(await recordCount(harness, "mutation_attempt")).toBe(0);
      expect(await recordCount(harness, "gateway_check_attempt")).toBe(1);
      expect(await recordCount(harness, "receipt")).toBe(1);
    } finally {
      await harness.dispose();
    }
  });
});

async function createRepoWriteContract(harness: D1HttpHarness, content: string) {
  const client = new HandshakeClient("http://handshake.test", harness.fetch, {
    transitionToken: D1_HARNESS_TRANSITION_TOKEN,
  });
  const fixture = makeRepoWriteFixtureObjects();
  await registerRepoWriteFixtureObjectsWithClient(client, fixture);
  const surface = await createRepoWriteSurface("handshake-repo-write-d1-");
  const proposed = await proposeRepoWriteActionContract(client, repoWriteRuntimeConfig(fixture), {
    principalIntentRef: "intent:write generated file",
    generatedCodeOrSpecRef: "code:codemode-repo-write-wrapper",
    repositoryRef: fixture.repositoryRef,
    filePath: fixture.filePath,
    content,
  });
  if (proposed.outcome !== "action_contract_proposed") throw new Error("expected action contract proposal");
  const policy = await client.evaluatePolicy({
    actionContractId: proposed.actionContract.actionContractId,
    envelopeId: fixture.envelope.envelopeId,
    signingSecret: "test-secret",
  });
  if (!policy.greenlight) throw new Error("expected repo write greenlight");
  return {
    actionContract: proposed.actionContract,
    client,
    fixture,
    greenlight: policy.greenlight,
    surface,
  };
}

async function actionEvents(harness: D1HttpHarness, actionContractId: string): Promise<StreamEventRow[]> {
  return harness.query<StreamEventRow>(
    `SELECT "offset" AS offset, event_type, previous_event_digest, event_digest
     FROM stream_events
     WHERE partition_key = ?
     ORDER BY "offset"`,
    `action:${actionContractId}`,
  );
}

async function recordCount(harness: D1HttpHarness, objectType: string): Promise<number> {
  const rows = await harness.query<CountRow>(
    "SELECT COUNT(*) AS count FROM protocol_records WHERE object_type = ?",
    objectType,
  );
  return rows[0]?.count ?? 0;
}
