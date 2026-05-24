import { describe, expect, it } from "bun:test";
import { cliCommandManifest } from "../../src/cli/command-manifest";
import {
  buildMcpX402ReferenceTranscript,
  buildMcpX402ReferenceTranscriptMarkdown,
  mcpReferenceNonAuthorityPosture,
  mcpX402ReferenceTranscriptCaseIds,
  mcpX402ReferenceTranscriptContract,
  mcpX402ReferenceTranscriptTargetDecision,
} from "../../src/mcp/reference-transcript";

describe("MCP x402 reference transcript", () => {
  it("covers the required source-owned transcript cases", async () => {
    const pack = await buildMcpX402ReferenceTranscript();

    expect(pack.targetDecision).toEqual(mcpX402ReferenceTranscriptTargetDecision);
    expect(pack.transcriptContract).toEqual(mcpX402ReferenceTranscriptContract);
    expect(pack.rows.map((row) => row.id)).toEqual([...mcpX402ReferenceTranscriptCaseIds]);
    expect(pack.hostileMatrix.map((entry) => entry.caseId)).toEqual([
      "stale_metadata",
      "tools_list_changed",
      "install_not_ready",
      "gateway_offline",
      "amount_mismatch",
      "unsupported_body_posture",
      "live_provider_posture",
      "params_mismatch",
      "replay_refusal",
      "raw_sibling_bypass_shaped_input",
      "proof_gap_downstream_uncertainty",
    ]);
  });

  it("binds every row to source-owned MCP behavior and explicit non-authority posture", async () => {
    const pack = await buildMcpX402ReferenceTranscript();

    for (const row of pack.rows) {
      expect(row.sourceBindings.length).toBeGreaterThan(0);
      expect(row.nonAuthorityPosture).toEqual(mcpReferenceNonAuthorityPosture);
      expect(row.nonAuthorityPosture).toMatchObject({
        policyDecisionCreated: false,
        authorityCreated: false,
        greenlightCreated: false,
        gatewayCheckPerformed: false,
        mutationAttempted: false,
        receiptExportCreated: false,
        credentialMaterialIncluded: false,
        authorityCertificateMinted: false,
        hostedOperationClaimed: false,
        providerCustodyClaimed: false,
        crossOrgTrustClaimed: false,
        clearingHouseClaimed: false,
      });

      for (const read of row.resourceReads) {
        expect(read).toMatchObject({
          readOnly: true,
          authorityCreated: false,
          greenlightCreated: false,
          gatewayCheckPerformed: false,
          mutationAttempted: false,
          receiptExportCreated: false,
          credentialMaterialIncluded: false,
          authorityCertificateMinted: false,
        });
      }

      if (row.toolResult) {
        expect(row.toolResult.structuredContent).toMatchObject({
          authorityCreated: false,
          greenlightCreated: false,
          gatewayCheckPerformed: false,
          mutationAttempted: false,
          receiptExportCreated: false,
          credentialMaterialIncluded: false,
          authorityCertificateMinted: false,
        });
      }
    }
  });

  it("keeps hostile cases at the expected refusal, reload, stop, replay, or proof-gap boundary", async () => {
    const pack = await buildMcpX402ReferenceTranscript();
    const byId = Object.fromEntries(pack.rows.map((row) => [row.id, row]));

    expect(byId.metadata_read?.resourceReads[0]?.payload).toMatchObject({
      actionClass: "x402_payment.exact",
      proposalTool: "handshake.actions.x402_payment.propose",
    });
    expect(byId.valid_proposal?.toolResult?.structuredContent).toMatchObject({
      outcome: "action_contract_proposed",
      actionContractId: "act_mcp_reference_x402",
      greenlightRef: null,
      gatewayCheckRef: null,
      mutationAttemptRef: null,
    });
    expect(byId.digest_bound_proposal?.toolResult?.structuredContent).toMatchObject({
      outcome: "action_contract_proposed",
      greenlightRef: null,
      gatewayCheckRef: null,
      mutationAttemptRef: null,
    });
    expect(byId.evidence_readback?.resourceReads.map((read) => read.uri)).toEqual([
      "handshake://evidence/contracts/act_mcp_reference_x402",
      "handshake://evidence/envelopes/act_mcp_reference_x402",
    ]);
    expect(byId.stale_metadata?.toolResult?.structuredContent.outcome).toBe("metadata_stale");
    expect(byId.tools_list_changed?.toolResult?.structuredContent.outcome).toBe("tools_list_changed");
    expect(byId.install_not_ready?.toolResult?.structuredContent).toMatchObject({
      outcome: "install_not_ready",
      nextAction: "fix_install",
    });
    expect(byId.gateway_offline?.toolResult?.structuredContent).toMatchObject({
      outcome: "gateway_offline",
      nextAction: "wait_for_gateway",
    });
    expect(byId.amount_mismatch?.toolResult?.structuredContent).toMatchObject({
      outcome: "refused",
      reasonCodes: ["x402_amount_exceeds_call_bound"],
    });
    expect(byId.unsupported_body_posture?.toolResult?.structuredContent).toMatchObject({
      outcome: "refused",
      reasonCodes: ["x402_request_body_posture_unsupported"],
    });
    expect(byId.live_provider_posture?.toolResult?.structuredContent).toMatchObject({
      outcome: "refused",
      reasonCodes: ["x402_provider_environment_not_sandboxed"],
    });
    expect(byId.params_mismatch?.toolResult?.structuredContent).toMatchObject({
      outcome: "refused",
      reasonCodes: ["idempotency_key_params_mismatch"],
    });
    expect(byId.replay_refusal?.toolResult?.structuredContent).toMatchObject({
      outcome: "replay_refused",
      reasonCodes: ["already_consumed"],
    });
    expect(byId.raw_sibling_bypass_shaped_input?.toolResult?.structuredContent).toMatchObject({
      outcome: "tool_execution_error",
      reasonCodes: ["mcp_input_schema_invalid"],
    });
    expect(byId.proof_gap_downstream_uncertainty?.toolResult?.structuredContent).toMatchObject({
      outcome: "proof_gap",
      commitState: "ambiguous",
      evidenceRefs: ["handshake://evidence/receipts/rcp_mcp_gap/timeline"],
    });
  });

  it("pairs transcript rows only with existing CLI readback commands", async () => {
    const pack = await buildMcpX402ReferenceTranscript();
    const commandIds = new Set(cliCommandManifest.map((command) => command.id));

    for (const row of pack.rows) {
      for (const commandId of row.cliReadbacks) {
        expect(commandIds.has(commandId)).toBe(true);
      }
    }
  });

  it("renders a buyer-readable walkthrough without expanding MCP authority", async () => {
    const markdown = await buildMcpX402ReferenceTranscriptMarkdown();

    expect(markdown).toContain("MCP x402 Reference Transcript");
    expect(markdown).toContain("The model can propose exact work");
    expect(markdown).toContain("no_policy_decision");
    expect(markdown).toContain("no_gateway_check");
    expect(markdown).toContain("no_hosted_operation");
    expect(markdown).toContain("proof_gap_downstream_uncertainty");
  });
});
