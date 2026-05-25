import { describe, expect, it } from "bun:test";
import { proposeMcpX402Payment, type McpRuntimeProposalClient } from "../../src/mcp/x402-proposal";
import { digest, serviceWorkflowContextRefs, validProposalInput } from "./mcp-schema-contract.test";

describe("MCP x402 proposal bridge", () => {
  it("creates runtime evidence, draft, compilation, and action contract only", async () => {
    const calls: Array<{ name: string; input: unknown }> = [];
    const client = fakeRuntimeClient(calls);

    const input = validProposalInput();
    const result = await proposeMcpX402Payment(input, trustedOptions(client));

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

    const createDraftInput = callInput(calls, "createToolCallDraft") as {
      parameters: Record<string, unknown>;
      delegatedAuthorityRefs: unknown[];
      evidenceRefs: string[];
    };
    const transitionDraftInput = callInput(calls, "transitionToolCallDraft") as {
      parameters: Record<string, unknown>;
      nonSecretParamsSummary: Record<string, unknown>;
      delegatedAuthorityRefs: unknown[];
      evidenceRefs: string[];
    };
    const compileCandidate = compileIntentCandidate(calls);
    expect(createDraftInput.delegatedAuthorityRefs).toEqual([input.delegatedAuthorityBinding]);
    expect(transitionDraftInput.delegatedAuthorityRefs).toEqual([input.delegatedAuthorityBinding]);
    expect(compileCandidate.delegatedAuthorityRefs).toEqual([input.delegatedAuthorityBinding]);
    expect(createDraftInput.evidenceRefs).toContain("evidence:x402-delegated-spend:principal_demo:agent_demo");
    expect(transitionDraftInput.evidenceRefs).toContain("evidence:x402-delegated-spend:principal_demo:agent_demo");
    expect(compileCandidate.evidenceRefs).toContain("evidence:x402-delegated-spend:principal_demo:agent_demo");
    for (const parameters of [
      createDraftInput.parameters,
      transitionDraftInput.parameters,
      transitionDraftInput.nonSecretParamsSummary,
      compileCandidate.parameters,
      compileCandidate.nonSecretParamsSummary,
    ]) {
      expect(parameters).toMatchObject({
        intendedRequestBodyPosture: "no_body",
        intendedRequestBodyDigest: null,
        providerEnvironmentPosture: "local_reference_sandbox",
        providerEnvironmentRef: null,
        gatewayReadinessRef: "handshake://local/x402/gateway-readiness.json",
        gatewayReadinessDigest: digest(13),
        policyVersionRef: "policy:x402-payment-exact:mcp@v1",
        policyVersionDigest: digest(17),
      });
    }
    expect(compileCandidate.bounds).toMatchObject({
      gatewayReadinessDigest: digest(13),
      policyVersionDigest: digest(17),
    });
    expect(compileCandidate.evidenceRefs).toEqual(
      expect.arrayContaining(["handshake://local/x402/gateway-readiness.json", "policy:x402-payment-exact:mcp@v1"]),
    );
  });

  it("carries typed service workflow context as evidence metadata, not delegated authority", async () => {
    const calls: Array<{ name: string; input: unknown }> = [];
    const input = { ...validProposalInput(), serviceWorkflowContextRefs: serviceWorkflowContextRefs() };

    const result = await proposeMcpX402Payment(input, trustedOptions(fakeRuntimeClient(calls)));

    expect(result.isError).toBe(false);
    expect(result.structuredContent).toMatchObject({
      outcome: "action_contract_proposed",
      authorityCreated: false,
      greenlightCreated: false,
      gatewayCheckPerformed: false,
      mutationAttempted: false,
    });

    const compileCandidate = compileIntentCandidate(calls);
    expect(compileCandidate.evidenceRefs).toEqual(
      expect.arrayContaining([
        `service-workflow-context:passport-package:${input.serviceWorkflowContextRefs.passportPackageDigest}`,
        `service-workflow-context:presentation:${input.serviceWorkflowContextRefs.passportPresentationId}`,
        `service-workflow-context:admission:${input.serviceWorkflowContextRefs.admissionId}`,
        `service-workflow-context:handle:${input.serviceWorkflowContextRefs.serviceWorkflowHandleId}`,
        `service-workflow-context:handle-digest:${input.serviceWorkflowContextRefs.serviceWorkflowHandleDigest}`,
      ]),
    );
    expect(compileCandidate.clearingEvidenceRefs).toEqual({
      correlationRef: `service-workflow-context:${input.serviceWorkflowContextRefs.serviceWorkflowHandleId}`,
    });
    expect(JSON.stringify(compileCandidate.delegatedAuthorityRefs)).not.toContain("serviceWorkflowHandle");
    expect(JSON.stringify(compileCandidate)).not.toContain("greenlightRef");
    expect(JSON.stringify(compileCandidate)).not.toContain("gatewayCheckRef");
    expect(JSON.stringify(compileCandidate)).not.toContain("receiptRef");
  });

  it("refuses stale metadata, not-ready install, offline gateway, unknown gateway, and amount overrun before runtime calls", async () => {
    for (const [input, options, outcome] of [
      [validProposalInput(), { currentMetadataDigest: digest(50) }, "metadata_stale"],
      [validProposalInput(), { installPosture: "missing" }, "install_not_ready"],
      [validProposalInput(), { installPosture: "stale" }, "install_not_ready"],
      [validProposalInput(), { installPosture: "unsafe" }, "install_not_ready"],
      [validProposalInput(), { installPosture: "unknown" }, "install_not_ready"],
      [validProposalInput(), { gatewayPosture: "offline" }, "gateway_offline"],
      [validProposalInput(), { gatewayPosture: "unknown" }, "tool_execution_error"],
      [{ ...validProposalInput(), atomicAmount: "3000" }, {}, "refused"],
      [{ ...validProposalInput(), atomicAmount: "1000", maxAtomicAmountPerCall: "999999" }, {}, "tool_execution_error"],
    ] as const) {
      const calls: Array<{ name: string; input: unknown }> = [];
      const result = await proposeMcpX402Payment(input, {
        ...trustedOptions(fakeRuntimeClient(calls)),
        ...options,
      });

      expect(result.isError).toBe(true);
      expect(result.structuredContent.outcome).toBe(outcome);
      expect(result.structuredContent.authorityCreated).toBe(false);
      expect(result.structuredContent.mutationAttempted).toBe(false);
      if (outcome === "install_not_ready" || outcome === "gateway_offline") {
        expect(result.structuredContent.evidenceRefs).toContain(
          "handshake://health/install/pre-contract/req_mcp_x402_1",
        );
      }
      expect(calls).toEqual([]);
    }
  });

  it("refuses missing trusted readiness or policy binding before runtime calls", async () => {
    const calls: Array<{ name: string; input: unknown }> = [];
    const result = await proposeMcpX402Payment(validProposalInput(), {
      runtimeClient: fakeRuntimeClient(calls),
      trustedMaxAtomicAmountPerCall: "2000",
    });

    expect(result.isError).toBe(true);
    expect(result.structuredContent).toMatchObject({
      outcome: "install_not_ready",
      phase: "readiness",
      reasonCodes: ["mcp_trusted_readiness_binding_missing", "mcp_policy_version_binding_missing"],
      authorityCreated: false,
      greenlightCreated: false,
      gatewayCheckPerformed: false,
      mutationAttempted: false,
    });
    expect(calls).toEqual([]);
  });

  it("refuses oversized model proposal fields before runtime calls", async () => {
    for (const input of [
      { ...validProposalInput(), metadataRef: `metadata:${"x".repeat(2_000)}` },
      { ...validProposalInput(), extensionKeys: Array.from({ length: 65 }, (_, index) => `extension:${index}`) },
    ]) {
      const calls: Array<{ name: string; input: unknown }> = [];
      const result = await proposeMcpX402Payment(input, trustedOptions(fakeRuntimeClient(calls)));

      expect(result.isError).toBe(true);
      expect(result.structuredContent).toMatchObject({
        outcome: "tool_execution_error",
        phase: "tool_execution",
        authorityCreated: false,
        mutationAttempted: false,
      });
      expect(calls).toEqual([]);
    }
  });

  it("refuses unsafe x402 posture before runtime calls", async () => {
    for (const [input, reasonCodes] of [
      [
        { ...validProposalInput(), intendedRequestBodyPosture: "digest_bound", intendedRequestBodyDigest: null },
        ["x402_request_body_digest_missing"],
      ],
      [
        { ...validProposalInput(), intendedRequestBodyPosture: "unsupported" },
        ["x402_request_body_posture_unsupported"],
      ],
      [{ ...validProposalInput(), intendedRequestBodyPosture: "omitted" }, ["x402_request_body_posture_unsupported"]],
      [
        {
          ...validProposalInput(),
          providerEnvironmentPosture: "external_sandbox",
          providerEnvironmentRef: "provider-environment:x402-external-sandbox",
        },
        ["x402_provider_environment_not_sandboxed"],
      ],
      [
        {
          ...validProposalInput(),
          providerEnvironmentPosture: "live",
          providerEnvironmentRef: "provider-environment:x402-live",
        },
        ["x402_provider_environment_not_sandboxed"],
      ],
      [
        {
          ...validProposalInput(),
          providerEnvironmentPosture: "unknown",
          providerEnvironmentRef: "provider-environment:x402-unknown",
        },
        ["x402_provider_environment_not_sandboxed"],
      ],
    ] as const) {
      const calls: Array<{ name: string; input: unknown }> = [];
      const result = await proposeMcpX402Payment(input, trustedOptions(fakeRuntimeClient(calls)));

      expect(result.isError).toBe(true);
      expect(result.structuredContent).toMatchObject({
        outcome: "refused",
        phase: "proposal",
        reasonCodes,
        authorityCreated: false,
        greenlightCreated: false,
        gatewayCheckPerformed: false,
        mutationAttempted: false,
      });
      expect(calls).toEqual([]);
    }
  });

  it("surfaces tools/list changes as freshness outcomes before runtime calls", async () => {
    const calls: Array<{ name: string; input: unknown }> = [];
    const result = await proposeMcpX402Payment(validProposalInput(), {
      ...trustedOptions(fakeRuntimeClient(calls)),
      toolsListChanged: true,
    });

    expect(result.isError).toBe(false);
    expect(result.structuredContent).toMatchObject({
      outcome: "tools_list_changed",
      phase: "freshness",
      reasonCodes: ["mcp_tools_list_changed"],
      nextAction: "reload_metadata",
      authorityCreated: false,
      mutationAttempted: false,
    });
    expect(calls).toEqual([]);
  });

  it("refuses bypass-shaped MCP inputs before runtime calls", async () => {
    for (const input of [
      { ...validProposalInput(), dispatchKind: "raw_sibling_x402_payment", rawCommandRef: "shell:x402-fetch" },
      { ...validProposalInput(), signerRef: "wallet:agent-owned" },
      { ...validProposalInput(), mutationCommand: "pay" },
    ]) {
      const calls: Array<{ name: string; input: unknown }> = [];
      const result = await proposeMcpX402Payment(input, trustedOptions(fakeRuntimeClient(calls)));

      expect(result.isError).toBe(true);
      expect(result.structuredContent).toMatchObject({
        outcome: "tool_execution_error",
        phase: "tool_execution",
        reasonCodes: ["mcp_input_schema_invalid"],
        authorityCreated: false,
        mutationAttempted: false,
      });
      expect(calls).toEqual([]);
    }
  });

  it("returns protocol refusals as structured outcomes instead of generic tool failure", async () => {
    const calls: Array<{ name: string; input: unknown }> = [];
    const client = fakeRuntimeClient(calls, { refused: true });

    const result = await proposeMcpX402Payment(validProposalInput(), trustedOptions(client));

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

  it("derives a stable idempotency key from x402 request material instead of trusting caller keys", async () => {
    const firstCalls: Array<{ name: string; input: unknown }> = [];
    const secondCalls: Array<{ name: string; input: unknown }> = [];

    const first = await proposeMcpX402Payment(
      { ...validProposalInput(), idempotencyKey: "caller-key:first" },
      trustedOptions(fakeRuntimeClient(firstCalls)),
    );
    const second = await proposeMcpX402Payment(
      { ...validProposalInput(), idempotencyKey: "caller-key:second" },
      trustedOptions(fakeRuntimeClient(secondCalls)),
    );

    const firstCandidate = compileIntentCandidate(firstCalls);
    const secondCandidate = compileIntentCandidate(secondCalls);

    expect(first.structuredContent).toMatchObject({
      outcome: "action_contract_proposed",
      authorityCreated: false,
      mutationAttempted: false,
    });
    expect(second.structuredContent).toMatchObject({
      outcome: "action_contract_proposed",
      authorityCreated: false,
      mutationAttempted: false,
    });
    expect(firstCandidate.idempotencyKey).toBe(secondCandidate.idempotencyKey);
    expect(firstCandidate.idempotencyKey).not.toBe("caller-key:first");
    expect(firstCandidate.idempotencyKey).not.toBe("caller-key:second");
    expect(first.structuredContent.idempotencyKey).toBe(firstCandidate.idempotencyKey);
    expect(second.structuredContent.idempotencyKey).toBe(secondCandidate.idempotencyKey);
  });

  it("derives distinct idempotency keys when accepted x402 posture material changes", async () => {
    const firstCalls: Array<{ name: string; input: unknown }> = [];
    const changedCalls: Array<{ name: string; input: unknown }> = [];

    await proposeMcpX402Payment(validProposalInput(), trustedOptions(fakeRuntimeClient(firstCalls)));
    await proposeMcpX402Payment(
      {
        ...validProposalInput(),
        providerEnvironmentRef: "provider-environment:x402-local-reference-sandbox",
      },
      trustedOptions(fakeRuntimeClient(changedCalls)),
    );

    expect(compileIntentCandidate(changedCalls).idempotencyKey).not.toBe(
      compileIntentCandidate(firstCalls).idempotencyKey,
    );
  });

  it("maps protocol replay and idempotency failures to structured non-authority outcomes", async () => {
    for (const [code, outcome] of [
      ["already_consumed", "replay_refused"],
      ["idempotency_duplicate_authority", "replay_refused"],
      ["idempotency_key_params_mismatch", "refused"],
    ] as const) {
      const calls: Array<{ name: string; input: unknown }> = [];
      const result = await proposeMcpX402Payment(validProposalInput(), {
        ...trustedOptions(fakeRuntimeClient(calls, { throwOnContract: code })),
      });

      expect(result.isError).toBe(true);
      expect(result.structuredContent).toMatchObject({
        outcome,
        phase: outcome === "replay_refused" ? "replay" : "proposal",
        reasonCodes: [code],
        authorityCreated: false,
        greenlightCreated: false,
        gatewayCheckPerformed: false,
        mutationAttempted: false,
      });
      expect(calls.map((call) => call.name)).toEqual([
        "createRuntimeExecution",
        "createToolCallDraft",
        "transitionToolCallDraft",
        "compileIntent",
        "proposeActionContract",
      ]);
    }
  });

  it("preserves committed transition evidence in MCP non-authority outcomes", async () => {
    const committedRefusalCalls: Array<{ name: string; input: unknown }> = [];
    const committedRefusal = await proposeMcpX402Payment(validProposalInput(), {
      ...trustedOptions(
        fakeRuntimeClient(committedRefusalCalls, {
          throwOnContract: {
            code: "idempotency_duplicate_authority",
            commitState: "committed",
            refusalRef: "ref_committed_duplicate",
          },
        }),
      ),
    });

    expect(committedRefusal.isError).toBe(true);
    expect(committedRefusal.structuredContent).toMatchObject({
      outcome: "replay_refused",
      phase: "replay",
      reasonCodes: ["idempotency_duplicate_authority"],
      commitState: "protocol_recorded",
      nextAction: "read_evidence",
      retryability: "not_retryable",
      refusalRef: "ref_committed_duplicate",
      proofRef: null,
      authorityCreated: false,
      greenlightCreated: false,
      gatewayCheckPerformed: false,
      mutationAttempted: false,
    });
    expect(committedRefusal.structuredContent.evidenceRefs).toContain(
      "handshake://evidence/refusals/ref_committed_duplicate",
    );

    const committedProofGapCalls: Array<{ name: string; input: unknown }> = [];
    const committedProofGap = await proposeMcpX402Payment(validProposalInput(), {
      ...trustedOptions(
        fakeRuntimeClient(committedProofGapCalls, {
          throwOnContract: {
            code: "recovery_terminal_conflict",
            commitState: "committed",
            proofRef: "gap_committed_recovery",
          },
        }),
      ),
    });

    expect(committedProofGap.isError).toBe(true);
    expect(committedProofGap.structuredContent).toMatchObject({
      outcome: "proof_gap",
      phase: "evidence",
      reasonCodes: ["recovery_terminal_conflict"],
      commitState: "protocol_recorded",
      nextAction: "read_evidence",
      retryability: "not_retryable",
      proofRef: "gap_committed_recovery",
      refusalRef: null,
      authorityCreated: false,
      greenlightCreated: false,
      gatewayCheckPerformed: false,
      mutationAttempted: false,
    });
    expect(committedProofGap.structuredContent.evidenceRefs).toContain(
      "handshake://evidence/proof-gaps/gap_committed_recovery",
    );
  });

  it("maps unknown transition commit state to ambiguous instead of not started", async () => {
    const calls: Array<{ name: string; input: unknown }> = [];
    const result = await proposeMcpX402Payment(validProposalInput(), {
      ...trustedOptions(
        fakeRuntimeClient(calls, {
          throwOnContract: {
            code: "ambiguous_commit",
            commitState: "unknown",
          },
        }),
      ),
    });

    expect(result.isError).toBe(true);
    expect(result.structuredContent).toMatchObject({
      outcome: "tool_execution_error",
      phase: "tool_execution",
      reasonCodes: ["ambiguous_commit"],
      commitState: "ambiguous",
      nextAction: "stop",
      authorityCreated: false,
      greenlightCreated: false,
      gatewayCheckPerformed: false,
      mutationAttempted: false,
    });
  });

  it("derives distinct idempotency keys for sequenced retry attempts", async () => {
    const firstCalls: Array<{ name: string; input: unknown }> = [];
    const secondCalls: Array<{ name: string; input: unknown }> = [];

    await proposeMcpX402Payment(
      { ...validProposalInput(), sequenceNumber: 1 },
      trustedOptions(fakeRuntimeClient(firstCalls)),
    );
    await proposeMcpX402Payment(
      { ...validProposalInput(), sequenceNumber: 2, requiredPriorActionContractIds: ["act_previous"] },
      trustedOptions(fakeRuntimeClient(secondCalls)),
    );

    expect(compileIntentCandidate(firstCalls).idempotencyKey).not.toBe(
      compileIntentCandidate(secondCalls).idempotencyKey,
    );
  });
});

function trustedOptions(runtimeClient: McpRuntimeProposalClient) {
  return {
    runtimeClient,
    trustedMaxAtomicAmountPerCall: "2000",
    gatewayReadinessRef: "handshake://local/x402/gateway-readiness.json",
    gatewayReadinessDigest: digest(13),
    policyVersionRef: "policy:x402-payment-exact:mcp@v1",
    policyVersionDigest: digest(17),
  };
}

function compileIntentCandidate(calls: Array<{ name: string; input: unknown }>) {
  const call = calls.find((entry) => entry.name === "compileIntent");
  if (!call || typeof call.input !== "object" || call.input === null || !("candidate" in call.input)) {
    throw new Error("expected compileIntent candidate");
  }
  return call.input.candidate as {
    idempotencyKey: string;
    parameters: Record<string, unknown>;
    nonSecretParamsSummary: Record<string, unknown>;
    bounds: Record<string, unknown>;
    delegatedAuthorityRefs: unknown[];
    evidenceRefs: string[];
    clearingEvidenceRefs: Record<string, string>;
  };
}

function callInput(calls: Array<{ name: string; input: unknown }>, name: string): unknown {
  const call = calls.find((entry) => entry.name === name);
  if (!call) throw new Error(`expected ${name} call`);
  return call.input;
}

function fakeRuntimeClient(
  calls: Array<{ name: string; input: unknown }>,
  options: {
    refused?: boolean;
    throwOnContract?:
      | string
      | {
          code: string;
          commitState?: string;
          proofRef?: string | null;
          refusalRef?: string | null;
        };
  } = {},
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
      if (options.throwOnContract) {
        throw typeof options.throwOnContract === "string"
          ? { code: options.throwOnContract, commitState: "accepted" }
          : options.throwOnContract;
      }
      return {
        actionContractId: "act_mcp_x402",
        actionContractDigest: digest(8),
        paramsDigest: digest(9),
      } as never;
    },
  };
}
