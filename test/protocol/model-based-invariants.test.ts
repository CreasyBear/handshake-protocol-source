import { describe, expect, it } from "bun:test";
import type {
  ActionContract,
  GatewayCheckAttempt,
  Greenlight,
  IntentCompilationRecord,
  IsolationState,
  MutationAttempt,
  PolicyDecision,
  ProofGap,
  Receipt,
  ReceiptExport,
  RecoveryRecommendation,
  RuntimeExecutionRecord,
} from "../../src/protocol/public/schemas";
import type { ProtocolObjectType } from "../../src/protocol/store/port";
import type { GatewayCheckResult } from "../../src/protocol/areas/gateway-gate";
import { InMemoryProtocolStore } from "../../src/storage/memory";
import {
  makeKernelFixture,
  makePackageInstallCandidate,
  proposalInputForCompilation,
  registerFixtureObjects,
} from "../support/fixtures";
import { protocolNavigationByTransitionId } from "../../src/protocol/navigation";
import type { TransitionRouteId } from "../../src/http/routes/transition-invokers";

type ModelContext = {
  fixture: ReturnType<typeof makeKernelFixture>;
  store: InMemoryProtocolStore;
  runtimeExecution: RuntimeExecutionRecord | null;
  rejectedCompilation: IntentCompilationRecord | null;
  compilation: IntentCompilationRecord | null;
  contract: ActionContract | null;
  policy: { decision: PolicyDecision; greenlight: Greenlight | null } | null;
  gate: GatewayCheckResult | null;
  proofGap: ProofGap | null;
  recovery: RecoveryRecommendation | null;
  receiptExport: ReceiptExport | null;
  isolation: IsolationState | null;
  expectedMutationAttempts: number;
};

type ModelCommand = {
  routeIds: TransitionRouteId[];
  run: (context: ModelContext) => Promise<void>;
};

const modelCommands = {
  registerCatalog: {
    routeIds: [
      "registerToolCapability",
      "registerActionType",
      "registerGatewayRegistryEntry",
      "registerOperatingEnvelope",
    ],
    run: async (context) => {
      await registerFixtureObjects(context.fixture);
    },
  },
  createRuntimeEvidence: {
    routeIds: ["createRuntimeExecution"],
    run: async (context) => {
      context.runtimeExecution = await context.fixture.kernel.createRuntimeExecution(runtimeExecutionInput(context));
    },
  },
  compileRejectedWithoutCatalog: {
    routeIds: ["compileIntent"],
    run: async (context) => {
      context.rejectedCompilation = await context.fixture.kernel.compileIntent(compileIntentInput(context));
      expect(context.rejectedCompilation.candidateAction.candidateStatus).toBe("rejected");
    },
  },
  proposeRejectedCandidate: {
    routeIds: ["proposeActionContract"],
    run: async (context) => {
      if (!context.rejectedCompilation) throw new Error("compileRejectedWithoutCatalog must run first");
      await expect(
        context.fixture.kernel.proposeActionContract({
          intentCompilationId: context.rejectedCompilation.intentCompilationId,
          candidateActionId: context.rejectedCompilation.candidateAction.candidateActionId,
          candidateDigest: "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        }),
      ).rejects.toThrow("Candidate is rejected");
    },
  },
  compileIntent: {
    routeIds: ["compileIntent"],
    run: async (context) => {
      context.compilation = await context.fixture.kernel.compileIntent(compileIntentInput(context));
      expect(context.compilation.candidateAction.candidateStatus).toBe("contractable");
    },
  },
  proposeContract: {
    routeIds: ["proposeActionContract"],
    run: async (context) => {
      if (!context.compilation) throw new Error("compileIntent must run first");
      context.contract = await context.fixture.kernel.proposeActionContract(
        proposalInputForCompilation(context.compilation, "model-secret"),
      );
    },
  },
  policyMissingContract: {
    routeIds: ["evaluatePolicy"],
    run: async (context) => {
      await expect(
        context.fixture.kernel.evaluatePolicy({
          actionContractId: "act_missing_model",
          envelopeId: context.fixture.envelope.envelopeId,
        }),
      ).rejects.toThrow("action_contract act_missing_model was not found");
    },
  },
  evaluatePolicy: {
    routeIds: ["evaluatePolicy"],
    run: async (context) => {
      if (!context.contract) throw new Error("proposeContract must run first");
      context.policy = await context.fixture.kernel.evaluatePolicy({
        actionContractId: context.contract.actionContractId,
        envelopeId: context.fixture.envelope.envelopeId,
        signingSecret: "model-secret",
      });
      expect(context.policy.decision.decision).toBe("greenlight");
      expect(context.policy.greenlight).not.toBeNull();
    },
  },
  evaluatePolicyBlockedByIsolation: {
    routeIds: ["evaluatePolicy"],
    run: async (context) => {
      if (!context.contract) throw new Error("proposeContract must run first");
      context.policy = await context.fixture.kernel.evaluatePolicy({
        actionContractId: context.contract.actionContractId,
        envelopeId: context.fixture.envelope.envelopeId,
      });
      expect(context.policy.decision.decision).toBe("quarantine");
      expect(context.policy.greenlight).toBeNull();
    },
  },
  gatewayMissingGreenlight: {
    routeIds: ["gatewayCheck"],
    run: async (context) => {
      await expect(
        context.fixture.kernel.gatewayCheck({
          actionContractId: "act_missing_model",
          greenlightId: "grn_missing_model",
          observedParameters: { package: "hono", versionRange: "^4.12.19" },
        }),
      ).rejects.toThrow("action_contract act_missing_model was not found");
    },
  },
  gatewayCheck: {
    routeIds: ["gatewayCheck"],
    run: async (context) => {
      const contract = requireContract(context);
      const greenlight = requireGreenlight(context);
      context.gate = await context.fixture.kernel.gatewayCheck({
        actionContractId: contract.actionContractId,
        greenlightId: greenlight.greenlightId,
        observedParameters: { package: "hono", versionRange: "^4.12.19" },
      });
      expect(context.gate.gateAttempt.gateDecision).toBe("passed");
      expect(context.gate.mutationAttempt).not.toBeNull();
      context.expectedMutationAttempts += 1;
    },
  },
  gatewayCheckAfterIsolation: {
    routeIds: ["gatewayCheck"],
    run: async (context) => {
      const contract = requireContract(context);
      const greenlight = requireGreenlight(context);
      context.gate = await context.fixture.kernel.gatewayCheck({
        actionContractId: contract.actionContractId,
        greenlightId: greenlight.greenlightId,
        observedParameters: { package: "hono", versionRange: "^4.12.19" },
      });
      expect(context.gate.gateAttempt.gateDecision).toBe("refused");
      expect(context.gate.gateAttempt.gateDecisionReasonCode).toBe("current_isolation_quarantined");
      expect(context.gate.mutationAttempt).toBeNull();
    },
  },
  replayGateway: {
    routeIds: ["gatewayCheck"],
    run: async (context) => {
      const contract = requireContract(context);
      const greenlight = requireGreenlight(context);
      const replay = await context.fixture.kernel.gatewayCheck({
        actionContractId: contract.actionContractId,
        greenlightId: greenlight.greenlightId,
        observedParameters: { package: "hono", versionRange: "^4.12.19" },
      });
      expect(replay.gateAttempt.gateDecision).toBe("refused");
      expect(replay.receipt.greenlightConsumptionStatus).toBe("replayed");
      expect(replay.mutationAttempt).toBeNull();
    },
  },
  reconcileUnknownFinality: {
    routeIds: ["reconcileSurfaceOperation"],
    run: async (context) => {
      const gate = requireGateWithMutation(context);
      const contract = requireContract(context);
      const reconciliation = await context.fixture.kernel.reconcileSurfaceOperation({
        mutationAttemptId: gate.mutationAttempt.mutationAttemptId,
        idempotencyKey: contract.idempotencyKey,
        observedSurfaceOperationRef: gate.mutationAttempt.surfaceOperationRef,
        observedDownstreamStatus: "unknown",
        evidenceRefs: [],
        resolvedProofGapIds: [],
      });
      expect(reconciliation.createdProofGap?.reasonCode).toBe("orphan_mitigation_required");
      context.proofGap = reconciliation.createdProofGap;
    },
  },
  createRecoveryRecommendation: {
    routeIds: ["createRecoveryRecommendation"],
    run: async (context) => {
      const gate = requireGateWithMutation(context);
      if (!context.proofGap) throw new Error("reconcileUnknownFinality must create a proof gap first");
      context.recovery = await context.fixture.kernel.createRecoveryRecommendation({
        sourceReceiptId: gate.receipt.receiptId,
        sourceRefusalOrGapRef: context.proofGap.proofGapId,
        recommendedPath: "narrower_action_contract_required",
        allowedNextActionClasses: [requireContract(context).actionClass],
        requiredNewEvidence: ["gateway_finality_evidence"],
        requiresHumanReview: false,
        reasonCode: "downstream_status_unknown",
        reasonSummary: "Model observed unknown downstream finality.",
      });
      expect(context.recovery.recommendationStatus).toBe("open");
    },
  },
  createIsolationState: {
    routeIds: ["createIsolationState"],
    run: async (context) => {
      context.isolation = await context.fixture.kernel.createIsolationState({
        tenantId: "tenant_demo",
        organizationId: "org_demo",
        scopeType: "agent",
        scopeId: "agent_demo",
        state: "quarantined",
        reasonCode: "model_quarantine",
        reasonSummary: "Model sequence installed isolation before future authority.",
        sourceDecisionRef: "model:breaker",
        observedStreamOffsets: context.contract ? actionStreamWatermark(context) : [],
      });
      expect(context.isolation.state).toBe("quarantined");
    },
  },
  createReceiptExport: {
    routeIds: ["createReceiptExport"],
    run: async (context) => {
      const gate = requireGateWithMutation(context);
      context.receiptExport = await context.fixture.kernel.createReceiptExport({
        receiptId: gate.receipt.receiptId,
        requestedByRef: "auditor:model",
      });
      expect(context.receiptExport.receiptId).toBe(gate.receipt.receiptId);
    },
  },
} satisfies Record<string, ModelCommand>;

type ModelCommandName = keyof typeof modelCommands;

const scenarios = [
  {
    name: "invalid ordering and runtime evidence never mint authority",
    steps: [
      "createRuntimeEvidence",
      "compileRejectedWithoutCatalog",
      "proposeRejectedCandidate",
      "policyMissingContract",
      "gatewayMissingGreenlight",
    ],
  },
  {
    name: "canonical chain creates one mutation only after gate",
    steps: [
      "registerCatalog",
      "compileIntent",
      "proposeContract",
      "evaluatePolicy",
      "gatewayCheck",
      "createReceiptExport",
    ],
  },
  {
    name: "replay and proof-gap recovery evidence do not create retry authority",
    steps: [
      "registerCatalog",
      "compileIntent",
      "proposeContract",
      "evaluatePolicy",
      "gatewayCheck",
      "replayGateway",
      "reconcileUnknownFinality",
      "createRecoveryRecommendation",
    ],
  },
  {
    name: "isolation blocks policy before greenlight",
    steps: [
      "registerCatalog",
      "compileIntent",
      "proposeContract",
      "createIsolationState",
      "evaluatePolicyBlockedByIsolation",
    ],
  },
  {
    name: "isolation after greenlight blocks gateway before mutation",
    steps: [
      "registerCatalog",
      "compileIntent",
      "proposeContract",
      "evaluatePolicy",
      "createIsolationState",
      "gatewayCheckAfterIsolation",
    ],
  },
] satisfies Array<{ name: string; steps: ModelCommandName[] }>;

describe("model-based foundation invariants", () => {
  it("ties model commands to transition-matrix invariant rows", () => {
    const modeledRoutes = new Set(Object.values(modelCommands).flatMap((command) => command.routeIds));

    for (const routeId of modeledRoutes) {
      const entry = protocolNavigationByTransitionId[routeId];
      expect(entry.authorityBoundary.length).toBeGreaterThan(0);
      expect(entry.evidenceObligation.length).toBeGreaterThan(0);
    }

    expect(modeledRoutes).toEqual(
      new Set([
        "registerToolCapability",
        "registerActionType",
        "registerGatewayRegistryEntry",
        "registerOperatingEnvelope",
        "createRuntimeExecution",
        "compileIntent",
        "proposeActionContract",
        "evaluatePolicy",
        "gatewayCheck",
        "reconcileSurfaceOperation",
        "createRecoveryRecommendation",
        "createIsolationState",
        "createReceiptExport",
      ]),
    );
  });

  for (const scenario of scenarios) {
    it(`preserves invariants after each command: ${scenario.name}`, async () => {
      const context = makeModelContext();

      for (const step of scenario.steps) {
        await modelCommands[step].run(context);
        await assertStoreInvariants(context, `${scenario.name}:${step}`);
      }
    });
  }
});

function makeModelContext(): ModelContext {
  const fixture = makeKernelFixture();
  if (!(fixture.store instanceof InMemoryProtocolStore)) {
    throw new Error("model tests require inspectable in-memory store");
  }
  return {
    fixture,
    store: fixture.store,
    runtimeExecution: null,
    rejectedCompilation: null,
    compilation: null,
    contract: null,
    policy: null,
    gate: null,
    proofGap: null,
    recovery: null,
    receiptExport: null,
    isolation: null,
    expectedMutationAttempts: 0,
  };
}

async function assertStoreInvariants(context: ModelContext, label: string): Promise<void> {
  const [contracts, policies, greenlights, gates, mutations, receipts, proofGaps, recoveries, receiptExports] =
    await Promise.all([
      records<ActionContract>(context, "action_contract"),
      records<PolicyDecision>(context, "policy_decision"),
      records<Greenlight>(context, "greenlight"),
      records<GatewayCheckAttempt>(context, "gateway_check_attempt"),
      records<MutationAttempt>(context, "mutation_attempt"),
      records<Receipt>(context, "receipt"),
      records<ProofGap>(context, "proof_gap"),
      records<RecoveryRecommendation>(context, "recovery_recommendation"),
      records<ReceiptExport>(context, "receipt_export"),
    ]);

  if (mutations.length !== context.expectedMutationAttempts) {
    throw new Error(
      `${label}: expected ${context.expectedMutationAttempts} mutation attempts, saw ${mutations.length}`,
    );
  }

  for (const mutation of mutations) {
    const gate = gates.find((candidate) => candidate.gateAttemptId === mutation.gateAttemptId);
    const greenlight = greenlights.find((candidate) => candidate.greenlightId === mutation.greenlightId);
    const contract = contracts.find((candidate) => candidate.actionContractId === mutation.actionContractId);
    const policy = policies.find((candidate) => candidate.actionContractId === mutation.actionContractId);
    if (!contract) throw new Error(`${label}: mutation ${mutation.mutationAttemptId} lacks an ActionContract`);
    if (!policy) throw new Error(`${label}: mutation ${mutation.mutationAttemptId} lacks a PolicyDecision`);
    if (!greenlight) throw new Error(`${label}: mutation ${mutation.mutationAttemptId} lacks a Greenlight`);
    if (!gate) throw new Error(`${label}: mutation ${mutation.mutationAttemptId} lacks a GatewayCheckAttempt`);
    expect(gate.gateDecision).toBe("passed");
    expect(gate.mutationAttemptId).toBe(mutation.mutationAttemptId);
    expect(greenlight.consumedByGateAttemptId).toBe(gate.gateAttemptId);
  }

  const mutationsByGreenlight = groupBy(mutations, (mutation) => mutation.greenlightId);
  for (const [greenlightId, greenlightMutations] of mutationsByGreenlight) {
    if (greenlightMutations.length > 1) {
      throw new Error(`${label}: greenlight ${greenlightId} authorized multiple mutation attempts`);
    }
  }

  for (const receipt of receipts) {
    if (receipt.finalityStatus !== "final") {
      expect(receipt.downstreamExecutionStatus).not.toBe("succeeded");
    }
    if (receipt.gatewayCheckStatus === "refused") {
      expect(receipt.mutationAttemptId).toBeNull();
      expect(receipt.greenlightConsumptionStatus).not.toBe("consumed");
    }
  }

  for (const proofGap of proofGaps) {
    const greenlightsAfterGap = greenlights.filter((greenlight) => greenlight.createdAt >= proofGap.createdAt);
    const followUpContractsAfterGap = contracts.filter((contract) => contract.createdAt >= proofGap.createdAt);
    if (greenlightsAfterGap.length > followUpContractsAfterGap.length) {
      throw new Error(`${label}: proof gap ${proofGap.proofGapId} appears to mint greenlight authority`);
    }
  }

  if (recoveries.length > 0) {
    expect(context.expectedMutationAttempts).toBe(1);
    expect(greenlights.length).toBe(1);
  }

  for (const receiptExport of receiptExports) {
    expect(receipts.some((receipt) => receipt.receiptId === receiptExport.receiptId)).toBe(true);
    expect(mutations.length).toBe(context.expectedMutationAttempts);
  }
}

async function records<T>(context: ModelContext, objectType: ProtocolObjectType): Promise<T[]> {
  return (await context.store.listRecordsByType<T>(objectType)).map((record) => record.payload);
}

function runtimeExecutionInput(context: ModelContext) {
  return {
    tenantId: "tenant_demo",
    organizationId: "org_demo",
    principalIntentRef: "intent:model runtime evidence",
    principalId: "principal_demo",
    agentId: "agent_demo",
    runId: "run_demo",
    runtimeAdapterId: "runtime_codex",
    executionShape: "codemode_block" as const,
    runtimePosture: "protected_capability" as const,
    executionBlockRef: "code:model-block",
    executionBlockDigest: "sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
    generatedCodeOrSpecRefs: ["code:model-generated"],
    allowedToolCapabilityIds: [context.fixture.tool.toolCapabilityId],
    observedToolCallRefs: ["toolcall:model-package-install"],
    observedConsequentialCallCount: 1,
    loopDetected: false,
    retryDetected: false,
    branchDetected: true,
    dynamicToolConstructionDetected: false,
    unobservedRegionRefs: [],
    accessPosture: "isolated" as const,
    uncertaintyMarkers: [],
    refusalReasonCodes: [],
    evidenceRefs: ["evidence:model-runtime"],
  };
}

function compileIntentInput(context: ModelContext) {
  return {
    tenantId: "tenant_demo",
    organizationId: "org_demo",
    principalIntentRef: "intent:model install hono",
    principalId: "principal_demo",
    agentId: "agent_demo",
    runId: "run_demo",
    runtimeAdapterId: "runtime_codex",
    operatingEnvelopeId: context.fixture.envelope.envelopeId,
    toolCatalogRef: "tool_catalog_demo@v1",
    actionCatalogRef: "action_catalog_demo@v1",
    gatewayRegistryRef: "gateway_registry@v1",
    generatedCodeOrSpecRefs: ["code:model-generated"],
    declaredAssumptions: ["package name is explicit"],
    requiredEvidenceRefs: ["evidence:package-lock-diff"],
    runtimeExecutionId: context.runtimeExecution?.runtimeExecutionId ?? null,
    candidate: makePackageInstallCandidate(context.fixture),
  };
}

function actionStreamWatermark(context: ModelContext) {
  const contract = requireContract(context);
  const streamId = `stream_${contract.tenantId}_${contract.organizationId}`;
  const partitionKey = `action:${contract.actionContractId}`;
  const actionTail = context.store.listEventsForPartition(streamId, partitionKey).at(-1);
  if (!actionTail) return [];
  return [
    {
      streamId,
      partitionKey,
      observedOffsetStart: 0,
      observedOffsetEnd: actionTail.offset,
      observedEventDigest: actionTail.eventDigest,
    },
  ];
}

function requireContract(context: ModelContext): ActionContract {
  if (!context.contract) throw new Error("model context has no ActionContract");
  return context.contract;
}

function requireGreenlight(context: ModelContext): Greenlight {
  if (!context.policy?.greenlight) throw new Error("model context has no Greenlight");
  return context.policy.greenlight;
}

function requireGateWithMutation(context: ModelContext): GatewayCheckResult & {
  mutationAttempt: MutationAttempt;
} {
  if (!context.gate?.mutationAttempt) throw new Error("model context has no gateway mutation attempt");
  return context.gate as GatewayCheckResult & { mutationAttempt: MutationAttempt };
}

function groupBy<T>(items: T[], selector: (item: T) => string): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const key = selector(item);
    groups.set(key, [...(groups.get(key) ?? []), item]);
  }
  return groups;
}
