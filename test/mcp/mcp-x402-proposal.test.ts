import { describe, expect, it } from "bun:test";
import { proposeMcpX402Payment, type McpRuntimeProposalClient } from "../../src/mcp/x402-proposal";
import { digest, validProposalInput } from "./mcp-schema-contract.test";

describe("MCP x402 proposal bridge", () => {
  it("creates runtime evidence, draft, compilation, and action contract only", async () => {
    const calls: Array<{ name: string; input: unknown }> = [];
    const client = fakeRuntimeClient(calls);

    const result = await proposeMcpX402Payment(validProposalInput(), { runtimeClient: client });

    expect(calls.map((call) => call.name)).toEqual([
      "createRuntimeExecution",
      "createToolCallDraft",
      "transitionToolCallDraft",
      "compileIntent",
      "proposeActionContract",
    ]);
    expect(result.isError).toBe(false);
    expect(result.structuredContent).toMatchObject({
      outcome: "action_contract_proposed",
      actionContractId: "act_mcp_x402",
      runtimeExecutionId: "rex_mcp_x402",
      toolCallDraftId: "tcd_mcp_x402_final",
      intentCompilationId: "int_mcp_x402",
      generatedExecutionGraphId: null,
      generatedExecutionGraphPosture: "not_exposed_by_role_scoped_runtime_surface",
      authorityCreated: false,
      greenlightCreated: false,
      gatewayCheckPerformed: false,
      mutationAttempted: false,
      credentialMaterialIncluded: false,
      mutationCommandIncluded: false,
      rawInternalRecordIncluded: false,
      receiptExportCreated: false,
      authorityCertificateMinted: false,
      greenlightRef: null,
      gatewayCheckRef: null,
      mutationAttemptRef: null,
    });

    expect(JSON.stringify(calls)).not.toContain("policyDecision");
    expect(JSON.stringify(calls)).not.toContain("greenlight");
    expect(JSON.stringify(calls)).not.toContain("gatewayCheckInput");
    expect(JSON.stringify(calls)).not.toContain("mutationCommand");
    expect(JSON.stringify(calls)).not.toContain("receiptExport");
    expect(JSON.stringify(calls)).not.toContain("PaymentPayload");
    expect(JSON.stringify(calls)).not.toContain("PAYMENT-SIGNATURE");
  });

  it("refuses stale metadata, not-ready install, offline gateway, and amount overrun before runtime calls", async () => {
    for (const [input, options, outcome] of [
      [validProposalInput(), { currentMetadataDigest: digest(50) }, "metadata_stale"],
      [validProposalInput(), { installPosture: "missing" }, "install_not_ready"],
      [validProposalInput(), { gatewayPosture: "offline" }, "gateway_offline"],
      [{ ...validProposalInput(), atomicAmount: "3000" }, {}, "refused"],
    ] as const) {
      const calls: Array<{ name: string; input: unknown }> = [];
      const result = await proposeMcpX402Payment(input, {
        runtimeClient: fakeRuntimeClient(calls),
        ...options,
      });

      expect(result.isError).toBe(true);
      expect(result.structuredContent.outcome).toBe(outcome);
      expect(result.structuredContent.authorityCreated).toBe(false);
      expect(result.structuredContent.mutationAttempted).toBe(false);
      expect(calls).toEqual([]);
    }
  });

  it("returns protocol refusals as structured outcomes instead of generic tool failure", async () => {
    const calls: Array<{ name: string; input: unknown }> = [];
    const client = fakeRuntimeClient(calls, { refused: true });

    const result = await proposeMcpX402Payment(validProposalInput(), { runtimeClient: client });

    expect(result.isError).toBe(true);
    expect(result.structuredContent).toMatchObject({
      outcome: "refused",
      phase: "proposal",
      commitState: "protocol_recorded",
      reasonCodes: ["mcp_fixture_refusal"],
      authorityCreated: false,
      mutationAttempted: false,
    });
    expect(calls.map((call) => call.name)).toEqual([
      "createRuntimeExecution",
      "createToolCallDraft",
      "transitionToolCallDraft",
      "compileIntent",
    ]);
  });
});

function fakeRuntimeClient(
  calls: Array<{ name: string; input: unknown }>,
  options: { refused?: boolean } = {},
): McpRuntimeProposalClient {
  return {
    async createRuntimeExecution(input) {
      calls.push({ name: "createRuntimeExecution", input });
      return { runtimeExecutionId: "rex_mcp_x402", createdAt: "2026-05-22T12:00:00.000Z" } as never;
    },
    async createToolCallDraft(input) {
      calls.push({ name: "createToolCallDraft", input });
      return { toolCallDraftId: "tcd_mcp_x402_open" } as never;
    },
    async transitionToolCallDraft(input) {
      calls.push({ name: "transitionToolCallDraft", input });
      return { toolCallDraftId: "tcd_mcp_x402_final" } as never;
    },
    async compileIntent(input) {
      calls.push({ name: "compileIntent", input });
      return {
        intentCompilationId: "int_mcp_x402",
        uncertaintyMarkers: [],
        overreachReasonCodes: [],
        candidateAction: {
          candidateActionId: "can_mcp_x402",
          candidateStatus: options.refused ? "refused" : "contractable",
          candidateDigest: options.refused ? null : digest(7),
          refusalReasonCodes: options.refused ? ["mcp_fixture_refusal"] : [],
        },
      } as never;
    },
    async proposeActionContract(input) {
      calls.push({ name: "proposeActionContract", input });
      return {
        actionContractId: "act_mcp_x402",
        actionContractDigest: digest(8),
        paramsDigest: digest(9),
      } as never;
    },
  };
}
