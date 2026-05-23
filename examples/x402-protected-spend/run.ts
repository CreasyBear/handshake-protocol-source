import { mkdir, writeFile } from "node:fs/promises";
import { EvidenceClient, RuntimeClient, type HandshakeFetch } from "handshake-protocol-kernel/sdk/role-clients";
import { createApp, type WorkerBindings } from "../../src/http/app";
import { runBypassProbeExecutors } from "../../src/adapters/protected-path-probes";
import { x402PaymentHostileBypassProbeExecutors } from "../../src/adapters/x402-payment/bypass-probes";
import {
  compileX402InstallProposal,
  type X402InstallProposal,
  type X402InstallProposalInput,
} from "../../src/adapters/x402-payment/install-proposal";
import {
  buildX402PaymentCompileIntentInput,
  buildX402PaymentAttemptFromRequiredEvidence,
  type X402PaymentAttempt,
  type X402PaymentRuntimeConfig,
} from "../../src/adapters/x402-payment/action-proposal";
import { decodeX402PaymentRequiredEvidence } from "../../src/adapters/x402-payment/upstream-evidence";
import {
  createOfficialExactX402SigningSurface,
  runX402WalletGateway,
  type X402PaymentParameters,
} from "../../src/adapters/x402-payment/wallet-gateway";
import { type AuthorityCertificateSignerInput } from "../../src";
import type { ActionContract, IntentCompilationRecord, RuntimeExecutionRecord, ToolCallDraft } from "../../src";
import { digestCanonical } from "../../src/protocol/foundation/canonical";
import { nowIso } from "../../src/protocol/foundation/ids";
import { InMemoryProtocolStore } from "../../src/storage/memory";
import { HandshakeKernel } from "../../src/protocol/kernel";
import type { ProtocolStore } from "../../src/protocol/store/port";

const ED25519_ALGORITHM = { name: "Ed25519" } as Algorithm;
const outputDir = new URL("./output/", import.meta.url);
const outputJsonPath = new URL("./output/latest.json", import.meta.url);
const outputMarkdownPath = new URL("./output/latest.md", import.meta.url);
const selectedHeadersDigest = `sha256:${"8".repeat(64)}` as const;
const officialSignerAddress = "0x1111111111111111111111111111111111111111" as const;
const tokens = {
  control_plane: "demo_control_plane_token",
  runtime_evidence: "demo_runtime_evidence_token",
  gateway_custody: "demo_gateway_custody_token",
  review_custody: "demo_review_custody_token",
} as const;

const officialX402SourceBasis = {
  repository: "https://github.com/x402-foundation/x402",
  docs: {
    http402: "https://docs.x402.org/core-concepts/http-402",
    exact: "https://docs.x402.org/schemes/exact",
    clientServer: "https://docs.x402.org/core-concepts/client-server",
    facilitator: "https://docs.x402.org/core-concepts/facilitator",
  },
  packages: {
    "@x402/core": "2.12.0",
    "@x402/evm": "2.12.0",
    "@x402/fetch": "2.12.0",
  },
  firstSlice: {
    role: "buyer",
    scheme: "exact",
    network: "eip155:84532",
    sdkSurface: ["@x402/core/types", "@x402/core/schemas", "@x402/evm/exact/client", "@x402/fetch"],
    unsupportedFirstSliceSurfaces: [
      "upto",
      "batch-settlement",
      "lifecycle-hooks",
      "mcp-auto-pay",
      "signed-offers",
      "signed-receipts",
      "seller-middleware",
      "facilitator-operation",
    ],
  },
} as const;

const officialPaymentRequired = {
  x402Version: 2,
  resource: {
    url: "https://api.example.com/mcp/premium-context",
    description: "Premium context for one generated engineering-agent request",
    mimeType: "application/json",
  },
  accepts: [
    {
      scheme: "exact",
      network: "eip155:84532",
      asset: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
      amount: "2500",
      payTo: "0x209693Bc6afc0C5328bA36FaF03C514EF312287C",
      maxTimeoutSeconds: 60,
      extra: {
        assetTransferMethod: "eip3009",
        name: "USDC",
        version: "2",
      },
    },
  ],
  extensions: {
    "payment-identifier": {
      required: false,
    },
  },
} as const;

const store = new InMemoryProtocolStore();
const kernel = new HandshakeKernel(store);
const evidence = await decodeX402PaymentRequiredEvidence({
  source: officialX402SourceBasis,
  paymentRequiredHeader: base64Json(officialPaymentRequired),
  selectedPaymentRequirementIndex: 0,
  intendedRequest: {
    method: "GET",
    url: officialPaymentRequired.resource.url,
    bodyDigest: null,
    selectedHeadersDigest,
  },
});
const attempt = await buildX402PaymentAttemptFromRequiredEvidence({
  evidence,
  principalIntentRef: "intent:fetch paid context as generated agent code",
  generatedCodeOrSpecRef: "runtime:demo-official-x402-dispatch",
});
const proposal = await compileX402InstallProposal(officialInstallInput(attempt.paymentRequirementsDigest));
const records = requireRecords(proposal);
await kernel.putCatalogObject({ objectType: "tool_capability", payload: records.toolCapability });
await kernel.putCatalogObject({ objectType: "action_type", payload: records.actionType });
await kernel.putCatalogObject({ objectType: "gateway_registry_entry", payload: records.gatewayRegistryEntry });
await kernel.putCatalogObject({ objectType: "operating_envelope", payload: records.operatingEnvelope });
await recordGatewayCheckedPosture(proposal, records);
const roleClients = httpRoleClientsForStore(store);

const runtime = await proposeOfficialX402ThroughRuntimeClient(
  roleClients.runtimeClient,
  runtimeConfig(proposal, records),
  attempt,
);
const runtimeProposal = runtime.proposals[0];
if (!runtimeProposal || runtimeProposal.outcome !== "action_contract_proposed") {
  throw new Error(`Expected runtime to propose an action contract, got ${runtime.outcome}.`);
}
const contract = runtimeProposal.actionContract;
const beforePolicyCounts = await recordCounts();

const policy = await kernel.evaluatePolicy({
  actionContractId: contract.actionContractId,
  envelopeId: records.operatingEnvelope.envelopeId,
  signingSecret: "test-secret",
});
if (!policy.greenlight) throw new Error(`Expected greenlight, got ${policy.decision.decisionReasonCode}.`);
const greenlight = policy.greenlight;

const signer = trackedOfficialSigner();
const surface = createOfficialExactX402SigningSurface({
  signer: signer.surfaceSigner,
  paymentRequired: officialPaymentRequired,
  selectedPaymentRequirementIndex: evidence.selectedPaymentRequirementIndex,
  selectedPaymentRequirementDigest: evidence.selectedPaymentRequirementDigest,
  downstreamPaymentStatus: "succeeded",
  paymentResponseEvidenceRef: "evidence:x402-payment-response:demo-official",
  providerRequestRef: "provider-request:x402:demo-official",
  providerOperationRef: "provider-operation:x402:demo-official",
});
const gateway = await runX402WalletGateway({
  protocol: kernel,
  surface,
  actionContractId: contract.actionContractId,
  greenlightId: greenlight.greenlightId,
  observedParameters: contract.parameters as X402PaymentParameters,
  surfaceOperationRef: "surface-op:demo-official-x402",
});
const envelope = await roleClients.evidenceClient.getAgentTransactionEnvelopeProjection(contract.actionContractId);

const signers = await fixtureEd25519Signers();
if (!gateway.gatewayCheck.receipt) throw new Error("Expected gateway receipt.");
const receipt = gateway.gatewayCheck.receipt;
const certificate = await kernel.createAuthorityCertificate({
  terminalObjectRef: `receipt:${receipt.receiptId}`,
  signers: signerInputs(signers),
});
const certificateVerification = await roleClients.evidenceClient.verifyAuthorityCertificate(
  certificate,
  trustMaterial(signers),
);

const replay = await runX402WalletGateway({
  protocol: kernel,
  surface,
  actionContractId: contract.actionContractId,
  greenlightId: greenlight.greenlightId,
  observedParameters: contract.parameters as X402PaymentParameters,
  surfaceOperationRef: "surface-op:demo-official-x402-replay",
});

const phases = [
  {
    phase: "1_runtime_proposal",
    verdict: "pass",
    evidence: {
      outcome: runtime.outcome,
      runtimeExecutionId: runtime.runtimeExecution.runtimeExecutionId,
      toolCallDraftId: runtime.toolCallDraft.toolCallDraftId,
      intentCompilationId: runtimeProposal.intentCompilation.intentCompilationId,
      actionContractId: contract.actionContractId,
      actionClass: contract.actionClass,
      x402EvidenceProfile: contract.parameters.x402EvidenceProfile,
      selectedPaymentRequirementIndex: contract.parameters.selectedPaymentRequirementIndex,
      selectedPaymentRequirementDigest: contract.parameters.selectedPaymentRequirementDigest,
      authorityRecordsBeforePolicy: beforePolicyCounts,
      credentialMaterialVisibleToRuntime: JSON.stringify(runtime).includes("PAYMENT-SIGNATURE") ? "leaked" : "absent",
    },
  },
  {
    phase: "2_policy_greenlight",
    verdict: "pass",
    evidence: {
      decision: policy.decision.decision,
      greenlightId: greenlight.greenlightId,
      decisionReasonCode: policy.decision.decisionReasonCode,
    },
  },
  {
    phase: "3_gateway_admission_and_signature",
    verdict: "pass",
    evidence: {
      outcome: gateway.outcome,
      gateDecision: gateway.gatewayCheck.gateAttempt.gateDecision,
      signerInvocations: signer.signatureCount(),
      paymentSignatureHeaderRef: gateway.signatureEvidence?.paymentSignatureHeaderRef ?? null,
      paymentPayloadRef: gateway.signatureEvidence?.paymentPayloadRef ?? null,
      paymentPayloadDigest: gateway.signatureEvidence?.paymentPayloadDigest ?? null,
      rawSignatureVisible: JSON.stringify(gateway).includes(`0x${"a".repeat(130)}`),
    },
  },
  {
    phase: "4_redacted_evidence_envelope",
    verdict: "pass",
    evidence: {
      gatewayAdmissionStatus: envelope.gatewayAdmissionStatus,
      downstreamOutcomeStatus: envelope.downstreamOutcomeStatus,
      idempotencyLedgerState: envelope.idempotencyLedgerState,
      receiptRef: envelope.receiptRef,
      surfaceOperationEvidenceRefs: envelope.surfaceOperationEvidenceRefs,
      gatewayCredentialEvidenceRefs: envelope.gatewayCredentialEvidenceRefs,
      omittedFields: envelope.omittedFields,
    },
  },
  {
    phase: "5_terminal_certificate",
    verdict: "pass",
    evidence: {
      authorityCertificateId: certificate.authorityCertificateId,
      terminalKind: certificate.terminal.terminalKind,
      verificationValid: certificateVerification.valid,
      signerRoles: certificate.signatures.map((signature) => signature.signerRole),
    },
  },
  {
    phase: "6_replay_refusal",
    verdict: "pass",
    evidence: {
      outcome: replay.outcome,
      gateDecision: replay.gatewayCheck.gateAttempt.gateDecision,
      reasonCode: replay.gatewayCheck.gateAttempt.gateDecisionReasonCode,
      signerInvocationsAfterReplay: signer.signatureCount(),
    },
  },
] as const;

const output = {
  schemaVersion: "handshake.demo.x402-protected-spend.v1",
  generatedAt: new Date().toISOString(),
  invariant: "runtime proposes; gateway alone signs after exact greenlight verification",
  report: buyerReadableApsReport(),
  outputFiles: {
    markdown: "examples/x402-protected-spend/output/latest.md",
    json: "examples/x402-protected-spend/output/latest.json",
  },
  phases,
};

await writeDemoArtifacts(output);
printDemoSummary(output);

function buyerReadableApsReport() {
  return {
    schemaVersion: "handshake.demo.aps-report.v1",
    proofObject: {
      name: "local x402 protected-spend authority envelope",
      tier: "Tier 2 activation over local Tier 1 kernel evidence",
      currentClaim:
        "One generated x402 exact spend attempt was reduced to an exact contract, greenlit once, checked by the gateway before signer use, recorded as redacted evidence, locally certified, and replay-refused.",
      proofBoundary: "local_reference",
    },
    protectedAction: {
      actionClass: contract.actionClass,
      protectedSurfaceKind: contract.protectedSurfaceKind,
      resourceRef: contract.resourceRef,
      endpointDomain: new URL(attempt.endpointUrl).hostname,
      intendedHttpMethod: attempt.intendedHttpMethod,
      intendedRequestUrl: attempt.intendedRequestUrl,
      x402EvidenceProfile: contract.parameters.x402EvidenceProfile,
      x402Version: contract.parameters.x402Version,
      x402Scheme: contract.parameters.x402Scheme,
      network: contract.parameters.network,
      token: contract.parameters.token,
      asset: contract.parameters.asset,
      atomicAmount: contract.parameters.atomicAmount,
      payee: contract.parameters.payee,
      payTo: contract.parameters.payTo,
      selectedPaymentRequirementIndex: contract.parameters.selectedPaymentRequirementIndex,
      selectedPaymentRequirementDigest: contract.parameters.selectedPaymentRequirementDigest,
      paymentRequirementsDigest: contract.parameters.paymentRequirementsDigest,
      idempotencyKey: contract.idempotencyKey,
      paramsDigest: contract.paramsDigest,
    },
    actorsAndCustody: {
      principalRef: contract.principalId,
      agentRef: contract.agentId,
      runId: contract.runId,
      runtimeAdapterRef: contract.runtimeAdapterId,
      gatewayId: contract.gatewayId,
      gatewayRegistryEntryId: contract.gatewayRegistryEntryId,
      gatewayAuthorityHolderRef: contract.gatewayAuthorityHolderRef,
      mutationCredentialHolderRef: contract.mutationCredentialHolderRef,
      credentialCustodyStatus: contract.credentialCustodyStatus,
      enforcementMode: contract.enforcementMode,
      counterpartyRef: contract.parameters.payee,
      facilitatorRef: contract.parameters.facilitatorRef,
      runtimeCredentialMaterialVisible: phases[0].evidence.credentialMaterialVisibleToRuntime,
      signerInvocationBoundary: "after_verified_gateway_check_only",
    },
    authorityPath: {
      runtimeProposalOutcome: runtime.outcome,
      actionContractId: contract.actionContractId,
      actionContractDigest: contract.actionContractDigest,
      policyDecisionId: policy.decision.policyDecisionId,
      policyDecision: policy.decision.decision,
      policyDecisionReasonCode: policy.decision.decisionReasonCode,
      greenlightId: greenlight.greenlightId,
      gateAttemptId: gateway.gatewayCheck.gateAttempt.gateAttemptId,
      gateDecision: gateway.gatewayCheck.gateAttempt.gateDecision,
      mutationAttemptId: gateway.gatewayCheck.mutationAttempt?.mutationAttemptId ?? null,
      receiptId: receipt.receiptId,
      authorityRecordsBeforePolicy: beforePolicyCounts,
      signerInvocationsAfterGatewayAdmission: phases[2].evidence.signerInvocations,
      replayDecision: replay.gatewayCheck.gateAttempt.gateDecision,
      replayReasonCode: replay.gatewayCheck.gateAttempt.gateDecisionReasonCode,
      signerInvocationsAfterReplay: signer.signatureCount(),
    },
    evidencePosture: {
      envelopeDigest: envelope.envelopeDigest,
      redactionProfileRef: envelope.redactionProfileRef,
      gatewayAdmissionStatus: envelope.gatewayAdmissionStatus,
      downstreamOutcomeStatus: envelope.downstreamOutcomeStatus,
      idempotencyLedgerState: envelope.idempotencyLedgerState,
      idempotencyDispositionMeaning: "authority_idempotency_only_not_payment_settlement",
      greenlightConsumptionStatus: envelope.greenlightConsumptionStatus,
      surfaceOperationEvidenceLabels: envelope.surfaceOperationEvidenceLabels,
      surfaceOperationEvidenceRefs: envelope.surfaceOperationEvidenceRefs,
      gatewayCredentialEvidenceRefs: envelope.gatewayCredentialEvidenceRefs,
      downstreamEvidenceRefs: envelope.downstreamEvidenceRefs,
      proofGapRefs: envelope.proofGapRefs,
      proofGapReasonCodes: envelope.proofGapReasonCodes,
      refusalRefs: envelope.refusalRefs,
      refusalReasonCodes: envelope.refusalReasonCodes,
      omittedFields: envelope.omittedFields,
      rawCredentialMaterialVisible: false,
    },
    terminalPosture: {
      terminalKind: certificate.terminal.terminalKind,
      authorityCertificateId: certificate.authorityCertificateId,
      verificationValid: certificateVerification.valid,
      signerRoles: certificate.signatures.map((signature) => signature.signerRole),
      trustBoundary: "local_pinned_trust_material_only",
      replayRefusal: {
        gateDecision: replay.gatewayCheck.gateAttempt.gateDecision,
        reasonCode: replay.gatewayCheck.gateAttempt.gateDecisionReasonCode,
        signerReused: signer.signatureCount() > 1,
      },
      certificateCanProve: [
        "terminal evidence was signed by local pinned signer roles",
        "the terminal evidence binds to this local action contract",
      ],
      certificateCannotProve: [
        "provider custody",
        "payment settlement",
        "cross-org trust",
        "marketplace certification",
      ],
    },
    nonClaims: [
      "hosted operation",
      "provider custody",
      "customer custody",
      "aggregate spend-window enforcement",
      "payment settlement finality",
      "broad x402 compatibility",
      "seller middleware",
      "facilitator operation",
      "broad MCP/CLI/browser/shell/network control",
      "cross-org AuthorityCertificate trust",
      "marketplace certification",
      "clearing-house readiness",
    ],
    missingProofObjects: [
      {
        proofObject: "external custody proof packet",
        requiredBeforeClaim: "provider/customer gateway custody",
      },
      {
        proofObject: "spend reservation ledger",
        requiredBeforeClaim: "session/day/review aggregate spend enforcement",
      },
      {
        proofObject: "hosted verifier and trust material distribution",
        requiredBeforeClaim: "cross-org certificate trust",
      },
      {
        proofObject: "downstream finality evidence adapter",
        requiredBeforeClaim: "payment settlement or business success",
      },
      {
        proofObject: "host-specific runtime bypass proof",
        requiredBeforeClaim: "broad runtime/tool containment",
      },
    ],
  };
}

async function proposeOfficialX402ThroughRuntimeClient(
  client: RuntimeClient,
  config: X402PaymentRuntimeConfig,
  initialAttempt: X402PaymentAttempt,
): Promise<{
  outcome: "action_contracts_proposed";
  runtimeExecution: RuntimeExecutionRecord;
  toolCallDraft: ToolCallDraft;
  proposals: readonly [
    {
      outcome: "action_contract_proposed";
      intentCompilation: IntentCompilationRecord;
      actionContract: ActionContract;
    },
  ];
}> {
  const paymentRequiredEvidenceRef = initialAttempt.paymentRequiredEvidenceRef ?? "evidence:x402-payment-required";
  const runtimeExecution = await client.createRuntimeExecution({
    tenantId: config.tenantId,
    organizationId: config.organizationId,
    principalIntentRef: initialAttempt.principalIntentRef,
    principalId: config.principalId,
    agentId: config.agentId,
    runId: config.runId,
    runtimeAdapterId: config.runtimeAdapterId,
    executionShape: "single_tool_call",
    runtimePosture: "protected_capability",
    executionBlockRef: "runtime:demo-official-x402-dispatch-block",
    executionBlockDigest: await digestCanonical({
      executionBlockRef: "runtime:demo-official-x402-dispatch-block",
      dispatchRef: "dispatch:demo-official-x402:1",
      paymentRequiredEvidenceRef,
    }),
    generatedCodeOrSpecRefs: [initialAttempt.generatedCodeOrSpecRef],
    allowedToolCapabilityIds: [config.toolCapabilityId],
    observedToolCallRefs: ["dispatch:demo-official-x402:1"],
    observedConsequentialCallCount: 1,
    accessPosture: "controlled_outbound",
    evidenceRefs: [paymentRequiredEvidenceRef],
  });
  const attemptWithRuntime = { ...initialAttempt, runtimeExecutionId: runtimeExecution.runtimeExecutionId };
  const draftInput = await buildX402PaymentCompileIntentInput(config, attemptWithRuntime);
  const openedDraft = await client.createToolCallDraft({
    tenantId: config.tenantId,
    organizationId: config.organizationId,
    runtimeExecutionId: runtimeExecution.runtimeExecutionId,
    generatedExecutionGraphId: null,
    generatedExecutionNodeId: null,
    toolCapabilityId: config.toolCapabilityId,
    actionTypeId: config.actionTypeId,
    gatewayRegistryEntryId: config.gatewayRegistryEntryId,
    actionClass: "x402_payment.exact",
    gatewayId: config.gatewayId,
    resourceRef: draftInput.candidate.resourceRef,
    parameters: draftInput.candidate.parameters,
    nonSecretParamsSummary: draftInput.candidate.nonSecretParamsSummary,
    expiresAt: config.contractExpiresAt,
    evidenceRefs: draftInput.candidate.evidenceRefs,
  });
  const toolCallDraft = await client.transitionToolCallDraft({
    toolCallDraftId: openedDraft.toolCallDraftId,
    nextDraftState: "finalized",
    parameters: draftInput.candidate.parameters,
    nonSecretParamsSummary: draftInput.candidate.nonSecretParamsSummary,
    secretRefs: {},
    gatewayCredentialRefs: [],
    evidenceRefs: draftInput.candidate.evidenceRefs,
  });
  const attemptWithDraft = { ...attemptWithRuntime, toolCallDraftId: toolCallDraft.toolCallDraftId };
  const compilation = await client.compileIntent(await buildX402PaymentCompileIntentInput(config, attemptWithDraft));
  if (compilation.candidateAction.candidateStatus !== "contractable") {
    throw new Error(
      `Expected contractable x402 candidate, got ${compilation.candidateAction.refusalReasonCodes.join(",")}`,
    );
  }
  const candidateDigest = compilation.candidateAction.candidateDigest;
  if (!candidateDigest) throw new Error("Contractable x402 candidate is missing its digest.");
  const actionContract = await client.proposeActionContract({
    intentCompilationId: compilation.intentCompilationId,
    candidateActionId: compilation.candidateAction.candidateActionId,
    candidateDigest,
    ...(config.signingSecret ? { signingSecret: config.signingSecret } : {}),
  });
  return {
    outcome: "action_contracts_proposed",
    runtimeExecution,
    toolCallDraft,
    proposals: [{ outcome: "action_contract_proposed", intentCompilation: compilation, actionContract }],
  };
}

async function recordGatewayCheckedPosture(
  installProposal: X402InstallProposal,
  compiled: NonNullable<X402InstallProposal["compiledRecords"]>,
) {
  const probes = await runBypassProbeExecutors(
    kernel,
    {
      tenantId: installProposal.tenantId,
      organizationId: installProposal.organizationId,
      runtimeAdapterId: compiled.toolCapability.runtimeAdapterId,
      gatewayId: compiled.gatewayRegistryEntry.gatewayId,
      actionClass: "x402_payment.exact",
      resourceRef: installProposal.resourceRef,
      protectedSurfaceKind: "x402_payment",
      expiresAt: futureIso(),
    },
    x402PaymentHostileBypassProbeExecutors({
      async readConformancePosture() {
        return {
          signerCustodyStatus: "gateway_held",
          rawPrivateKeyEnvStatus: "absent",
          directCoreClientSigningStatus: "blocked",
          paidFetchClientStatus: "blocked",
          paidAxiosClientStatus: "absent",
          rawPaymentSignatureHeaderStatus: "blocked",
          siblingX402WrapperStatus: "blocked",
          mcpDirectPaymentStatus: "blocked",
          tokenPassthroughStatus: "blocked",
          wrapperDriftStatus: "absent",
          failureClosedStatus: "passed",
        };
      },
    }),
  );
  await kernel.createProtectedPathPosture({
    tenantId: installProposal.tenantId,
    organizationId: installProposal.organizationId,
    runtimeAdapterId: compiled.toolCapability.runtimeAdapterId,
    gatewayId: compiled.gatewayRegistryEntry.gatewayId,
    actionClass: "x402_payment.exact",
    resourceRef: installProposal.resourceRef,
    protectedSurfaceKind: "x402_payment",
    postureState: "gateway_checked",
    credentialCustodyStatus: "gateway_held",
    rawSiblingToolStatus: "blocked",
    sourceAuthority: "gateway_probe",
    reasonCodes: ["bypass_probe_passed"],
    evidenceRefs: ["evidence:x402-hostile-probes"],
    bypassProbeIds: probes.map((probe) => probe.bypassProbeId),
    expiresAt: futureIso(),
  });
}

function runtimeConfig(
  installProposal: X402InstallProposal,
  compiled: NonNullable<X402InstallProposal["compiledRecords"]>,
): X402PaymentRuntimeConfig {
  return {
    tenantId: installProposal.tenantId,
    organizationId: installProposal.organizationId,
    principalId: compiled.operatingEnvelope.principalId,
    agentId: compiled.operatingEnvelope.agentId,
    runId: "run_demo_official_x402",
    runtimeAdapterId: compiled.toolCapability.runtimeAdapterId,
    operatingEnvelopeId: compiled.operatingEnvelope.envelopeId,
    toolCatalogRef: `${compiled.toolCapability.toolCatalogId}@${compiled.toolCapability.toolCatalogVersion}`,
    actionCatalogRef: `${compiled.actionType.actionCatalogId}@${compiled.actionType.actionCatalogVersion}`,
    gatewayRegistryRef: `gateway_registry@${compiled.gatewayRegistryEntry.gatewayRegistryVersion}`,
    toolCapabilityId: compiled.toolCapability.toolCapabilityId,
    actionTypeId: compiled.actionType.actionTypeId,
    gatewayRegistryEntryId: compiled.gatewayRegistryEntry.gatewayRegistryEntryId,
    gatewayId: compiled.gatewayRegistryEntry.gatewayId,
    maxAtomicAmountPerCall: installProposal.spendBounds.maxAtomicAmountPerCall,
    contractExpiresAt: futureIso(),
    signingSecret: "test-secret",
  };
}

function officialInstallInput(paymentRequirementsDigest: `sha256:${string}`): X402InstallProposalInput {
  const createdAt = nowIso();
  const selected = officialPaymentRequired.accepts[0];
  if (!selected) throw new Error("Expected official payment requirement.");
  return {
    tenantId: "tenant_demo",
    organizationId: "org_demo",
    createdAt,
    endpointEvidence: {
      endpointUrl: officialPaymentRequired.resource.url,
      payee: selected.payTo,
      network: selected.network,
      token: selected.asset,
      maxAtomicAmount: selected.amount,
      paymentRequirementsDigest,
      facilitatorRef: "facilitator:local",
      evidenceRefs: ["evidence:x402-payment-required"],
    },
    walletGatewayProfile: {
      walletGatewayId: "wallet_gateway_local",
      gatewayId: "gateway_x402_wallet",
      signerCustodyStatus: "gateway_held",
      signerRef: "secretref:x402-wallet-gateway",
      authorityHolderRef: "gateway-authority:x402-wallet",
      supportedNetworks: [selected.network],
      supportedTokens: [selected.asset],
    },
    spendBounds: {
      principalId: "principal_demo",
      agentId: "agent_demo",
      runtimeAdapterId: "runtime_codex",
      objectiveRef: "intent:fetch paid context",
      allowedDomains: ["api.example.com"],
      allowedPayees: [selected.payTo],
      allowedNetworks: [selected.network],
      allowedTokens: [selected.asset],
      maxAtomicAmountPerCall: selected.amount,
      maxAtomicAmountPerSession: "10000",
      maxAtomicAmountPerDay: "20000",
      reviewThresholdAtomicAmount: selected.amount,
      spendWindowEnforcementStatus: "not_enforced_tier1_metadata",
      issuedAt: createdAt,
      expiresAt: futureIso(),
    },
  };
}

function trackedOfficialSigner() {
  let signatures = 0;
  return {
    signatureCount: () => signatures,
    surfaceSigner: {
      address: officialSignerAddress,
      async signTypedData() {
        signatures += 1;
        return `0x${"a".repeat(130)}` as const;
      },
    },
  };
}

function httpRoleClientsForStore(protocolStore: ProtocolStore): {
  runtimeClient: RuntimeClient;
  evidenceClient: EvidenceClient;
} {
  const app = createApp({ store: protocolStore });
  const env = {
    HANDSHAKE_CONTROL_PLANE_TOKEN: tokens.control_plane,
    HANDSHAKE_RUNTIME_EVIDENCE_TOKEN: tokens.runtime_evidence,
    HANDSHAKE_GATEWAY_CUSTODY_TOKEN: tokens.gateway_custody,
    HANDSHAKE_REVIEW_CUSTODY_TOKEN: tokens.review_custody,
  } satisfies WorkerBindings;
  const fetchImpl: HandshakeFetch = async (input, init) => app.request(requestPath(input), init, env);
  return {
    runtimeClient: new RuntimeClient(
      "http://handshake.test",
      {
        roleCredential: tokens.runtime_evidence,
        requestIdentityFactory: () => "demo-x402-runtime-request",
        originatingIdentity: "ref:example/x402-protected-spend",
      },
      fetchImpl,
    ),
    evidenceClient: new EvidenceClient(
      "http://handshake.test",
      {
        roleCredential: tokens.review_custody,
        requestIdentityFactory: () => "demo-x402-evidence-request",
        originatingIdentity: "ref:example/x402-protected-spend",
      },
      fetchImpl,
    ),
  };
}

function requestPath(input: Parameters<typeof fetch>[0]): string {
  const rawUrl = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
  const url = new URL(rawUrl, "http://handshake.test");
  return `${url.pathname}${url.search}`;
}

async function recordCounts() {
  return {
    policyDecision: await recordCount("policy_decision"),
    greenlight: await recordCount("greenlight"),
    gatewayCheckAttempt: await recordCount("gateway_check_attempt"),
    mutationAttempt: await recordCount("mutation_attempt"),
    receipt: await recordCount("receipt"),
    authorityCertificate: await recordCount("authority_certificate"),
  };
}

async function recordCount(objectType: Parameters<ProtocolStore["listRecordsByType"]>[0]) {
  return (await store.listRecordsByType(objectType)).length;
}

function requireRecords(installProposal: X402InstallProposal): NonNullable<X402InstallProposal["compiledRecords"]> {
  if (!installProposal.compiledRecords) throw new Error("Expected installable x402 proposal.");
  return installProposal.compiledRecords;
}

function futureIso(minutes = 10): string {
  return new Date(Date.now() + minutes * 60_000).toISOString();
}

function base64Json(value: unknown): string {
  return btoa(JSON.stringify(value));
}

type FixtureEd25519Signer = {
  signerRole: "operator_policy" | "gateway";
  keyIdentityRef: string;
  privateKeyPkcs8: string;
  publicKeyEd25519: string;
};

async function fixtureEd25519Signers(): Promise<FixtureEd25519Signer[]> {
  return Promise.all([
    fixtureEd25519Signer("operator_policy", "fixture:ed25519:operator-policy"),
    fixtureEd25519Signer("gateway", "fixture:ed25519:gateway"),
  ]);
}

async function fixtureEd25519Signer(
  signerRole: FixtureEd25519Signer["signerRole"],
  keyIdentityRef: string,
): Promise<FixtureEd25519Signer> {
  const keyPair = (await crypto.subtle.generateKey(ED25519_ALGORITHM, true, ["sign", "verify"])) as CryptoKeyPair;
  const privateKeyPkcs8 = bytesToBase64Url(new Uint8Array(await crypto.subtle.exportKey("pkcs8", keyPair.privateKey)));
  const publicKeyEd25519 = bytesToBase64Url(new Uint8Array(await crypto.subtle.exportKey("raw", keyPair.publicKey)));
  return { signerRole, keyIdentityRef, privateKeyPkcs8, publicKeyEd25519 };
}

function signerInputs(signers: FixtureEd25519Signer[]): AuthorityCertificateSignerInput[] {
  return signers.map((signer) => ({
    signerRole: signer.signerRole,
    keyIdentityRef: signer.keyIdentityRef,
    algorithm: "ed25519",
    privateKeyPkcs8: signer.privateKeyPkcs8,
  }));
}

function trustMaterial(signers: FixtureEd25519Signer[]) {
  return {
    keys: signers.map((signer) => ({
      keyIdentityRef: signer.keyIdentityRef,
      signerRole: signer.signerRole,
      algorithm: "ed25519" as const,
      publicKeyEd25519: signer.publicKeyEd25519,
      hmacSecret: null,
      status: "active" as const,
    })),
    allowDevHmac: false,
  };
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/u, "");
}

async function writeDemoArtifacts(outputValue: typeof output): Promise<void> {
  await mkdir(outputDir, { recursive: true });
  await writeFile(outputJsonPath, `${JSON.stringify(outputValue, null, 2)}\n`);
  await writeFile(outputMarkdownPath, demoMarkdown(outputValue));
}

function printDemoSummary(outputValue: typeof output): void {
  console.log("Handshake x402 protected spend demo");
  console.log(`Invariant: ${outputValue.invariant}`);
  console.log(`Wrote: ${outputValue.outputFiles.markdown}`);
  console.log(`Wrote: ${outputValue.outputFiles.json}`);
  for (const phase of outputValue.phases) {
    console.log(`${phase.verdict.toUpperCase()} ${phase.phase}`);
  }
}

function demoMarkdown(outputValue: typeof output): string {
  const lines = [
    "# Handshake x402 Protected Spend Demo Output",
    "",
    `Generated: ${outputValue.generatedAt}`,
    "",
    "## Invariant",
    "",
    outputValue.invariant,
    "",
    "## Buyer-Readable APS Report",
    "",
    "This report is a local evidence view. It explains what the demo proves without creating authority.",
    "",
    "### Proof Object",
    "",
    `- Name: ${outputValue.report.proofObject.name}`,
    `- Tier: ${outputValue.report.proofObject.tier}`,
    `- Boundary: ${outputValue.report.proofObject.proofBoundary}`,
    `- Claim: ${outputValue.report.proofObject.currentClaim}`,
    "",
    "### Protected Action",
    "",
    "```json",
    JSON.stringify(outputValue.report.protectedAction, null, 2),
    "```",
    "",
    "### Actors And Custody",
    "",
    "```json",
    JSON.stringify(outputValue.report.actorsAndCustody, null, 2),
    "```",
    "",
    "### Authority Path",
    "",
    "```json",
    JSON.stringify(outputValue.report.authorityPath, null, 2),
    "```",
    "",
    "### Evidence Posture",
    "",
    "```json",
    JSON.stringify(outputValue.report.evidencePosture, null, 2),
    "```",
    "",
    "### Terminal Posture",
    "",
    "```json",
    JSON.stringify(outputValue.report.terminalPosture, null, 2),
    "```",
    "",
    "### Non-Claims",
    "",
    ...outputValue.report.nonClaims.map((claim) => `- ${claim}`),
    "",
    "### Missing Proof Objects",
    "",
    "```json",
    JSON.stringify(outputValue.report.missingProofObjects, null, 2),
    "```",
    "",
    "## Phases",
    "",
  ];
  for (const phase of outputValue.phases) {
    lines.push(`### ${phase.phase}`);
    lines.push("");
    lines.push(`Verdict: ${phase.verdict}`);
    lines.push("");
    lines.push("```json");
    lines.push(JSON.stringify(phase.evidence, null, 2));
    lines.push("```");
    lines.push("");
  }
  lines.push("## Cut Line");
  lines.push("");
  lines.push(
    "This output is local evidence only. It does not claim hosted operation, provider custody, aggregate spend-window enforcement, settlement finality, or cross-org certificate trust.",
  );
  lines.push("");
  return `${lines.join("\n")}\n`;
}
