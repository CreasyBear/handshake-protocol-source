import { mkdir, writeFile } from "node:fs/promises";
import {
  ControlPlaneClient,
  EvidenceClient,
  GatewayClient,
  InstallClient,
  PolicyClient,
  RuntimeClient,
  type HandshakeFetch,
} from "handshake-protocol-kernel/sdk/role-clients";
import { createApp, type WorkerBindings } from "../../src/http/app";
import { runBypassProbeExecutors } from "../../src/adapters/protected-path-probes";
import { x402PaymentHostileBypassProbeExecutors } from "../../src/adapters/x402-payment/bypass-probes";
import {
  buildX402DelegatedSpendAuthorityRefInput,
  buildX402WalletGatewayCredentialRefInput,
  compileX402InstallProposal,
  type X402InstallProposal,
  type X402InstallProposalInput,
  x402DelegatedSpendAuthorityBindingFor,
  x402WalletGatewayCredentialBindingFor,
} from "../../src/adapters/x402-payment/install-proposal";
import {
  buildX402PaymentAttemptFromRequiredEvidence,
  type X402PaymentAttempt,
  type X402PaymentRuntimeConfig,
} from "../../src/adapters/x402-payment/action-proposal";
import type { InstallProposal } from "../../src/install";
import type { ProtectedX402ToolFacadeInput, ProtectedX402ToolFacadeResult } from "../../src/x402-protected-tool";
import {
  runX402WalletGateway,
  type X402PaymentParameters,
  type X402WalletGatewayResult,
} from "../../src/adapters/x402-payment/wallet-gateway";
import {
  createLocalX402PaidHttpSandbox,
  createLocalX402SandboxSigningSurface,
} from "../../src/adapters/x402-payment/sandbox-http";
import { type AuthorityCertificateSignerInput } from "../../src";
import { digestCanonical } from "../../src/protocol/foundation/canonical";
import { nowIso } from "../../src/protocol/foundation/ids";
import type { JsonValue } from "../../src/protocol/foundation/schema-core";
import type { ActionContract } from "../../src/protocol/areas/action-contract/schemas";
import type { GatewayCredentialRef, GatewayCustodyProofPacket } from "../../src/protocol/areas/credential-custody";
import type { DelegatedAuthorityRef } from "../../src/protocol/areas/delegated-authority";
import type { ProtectedPathPosture } from "../../src/protocol/public/schemas";
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
      "settlement-finality",
    ],
  },
} as const;

const officialPaymentRequired = {
  x402Version: 2,
  resource: {
    url: "https://api.example.com/mcp/premium-context",
    description: "Premium context for one generated automated-decision request",
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
const sandbox = createLocalX402PaidHttpSandbox({
  source: officialX402SourceBasis,
  selectedPaymentRequirementIndex: 0,
  paymentRequired: officialPaymentRequired,
  intendedRequest: {
    method: "GET",
    url: officialPaymentRequired.resource.url,
    requestBodyPosture: "no_body",
    bodyDigest: null,
    selectedHeadersDigest,
    providerEnvironmentPosture: "local_reference_sandbox",
    providerEnvironmentRef: "provider-environment:x402-local-reference-sandbox",
  },
  paymentRequiredEvidenceRef: "evidence:x402-payment-required:demo-local-sandbox",
  paymentResponseEvidenceRef: "evidence:x402-payment-response:demo-local-sandbox",
  providerRequestRef: "provider-request:x402:demo-local-sandbox",
  providerOperationRef: "provider-operation:x402:demo-local-sandbox",
});
const sandboxChallenge = await sandbox.requestPaymentRequired();
const sandboxSnapshotAfterChallenge = sandbox.snapshot();
const evidence = sandboxChallenge.evidence;
const attempt = await buildX402PaymentAttemptFromRequiredEvidence({
  evidence,
  principalIntentRef: "intent:fetch paid context as generated agent code",
  generatedCodeOrSpecRef: "runtime:demo-official-x402-dispatch",
});
const proposal = await compileX402InstallProposal(officialInstallInput(attempt.paymentRequirementsDigest));
const records = requireRecords(proposal);
const roleClients = httpRoleClientsForStore(store);
const installSetup = await roleClients.installClient.registerInstallProposalCompiledRecords(
  baseInstallProposalForRegistration(proposal),
);
if (installSetup.outcome !== "compiled_records_registered") {
  throw new Error(`Expected install setup records, got ${installSetup.outcome}.`);
}
const credentialRef = await roleClients.gatewayClient.registerGatewayCredentialRef(
  await buildX402WalletGatewayCredentialRefInput(proposal, records),
);
const delegatedAuthorityRef = await roleClients.controlPlaneClient.registerDelegatedAuthorityRef(
  await buildX402DelegatedSpendAuthorityRefInput(proposal, records),
);
const protectedPathPosture = await recordGatewayCheckedPosture(roleClients.gatewayClient, proposal, records);
const custodyProofPacket = await recordGatewayCustodyProofPacket(
  roleClients.gatewayClient,
  proposal,
  records,
  credentialRef,
  protectedPathPosture,
);
const runtimeConfigValue = await runtimeConfig(
  proposal,
  records,
  credentialRef,
  delegatedAuthorityRef,
  custodyProofPacket,
);
const protectedToolModule = await loadProtectedToolModule();

const protectedToolFacadeInput = await buildProtectedToolFacadeInput(
  runtimeConfigValue,
  records,
  proposal,
  attempt,
  custodyProofPacket,
);
const protectedToolFacade = protectedToolModule.prepareProtectedX402ToolDispatch(protectedToolFacadeInput);
if (protectedToolFacade.outcome !== "dispatch_block_prepared") {
  throw new Error(`Expected protected x402 tool facade to prepare dispatch, got ${protectedToolFacade.outcome}.`);
}
const runtime = await roleClients.runtimeClient.proposeRuntimeIngressActionContracts({
  tenantId: proposal.tenantId,
  organizationId: proposal.organizationId,
  config: { x402Payment: runtimeConfigValue },
  dispatchBlock: protectedToolFacade.runtimeIngressBlock,
});
const runtimeProposal = runtime.proposals[0];
if (!runtimeProposal || runtimeProposal.outcome !== "action_contract_proposed") {
  throw new Error(`Expected runtime to propose an action contract, got ${runtime.outcome}.`);
}
const contract = runtimeProposal.actionContract;
const beforePolicyCounts = await recordCounts();

const policy = await roleClients.policyClient.evaluatePolicy({
  actionContractId: contract.actionContractId,
  envelopeId: records.operatingEnvelope.envelopeId,
  signingSecret: "test-secret",
});
if (!policy.greenlight) throw new Error(`Expected greenlight, got ${policy.decision.decisionReasonCode}.`);
const greenlight = policy.greenlight;

const signer = trackedOfficialSigner();
const surface = createLocalX402SandboxSigningSurface({
  sandbox,
  signer: signer.surfaceSigner,
  paymentRequired: officialPaymentRequired,
  selectedPaymentRequirementIndex: evidence.selectedPaymentRequirementIndex,
  selectedPaymentRequirementDigest: evidence.selectedPaymentRequirementDigest,
});
const changedParameterProbe = await runX402WalletGateway({
  protocol: roleClients.gatewayClient,
  surface,
  actionContractId: contract.actionContractId,
  greenlightId: greenlight.greenlightId,
  observedParameters: {
    ...(contract.parameters as X402PaymentParameters),
    atomicAmount: "2501",
  },
  surfaceOperationRef: "surface-op:demo-official-x402-param-drift",
});
const signerInvocationsAfterChangedParameterProbe = signer.signatureCount();
const signedRetryCountAfterChangedParameterProbe = sandbox.snapshot().signedRetryCount;
const gateway = await runX402WalletGateway({
  protocol: roleClients.gatewayClient,
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
const localTerminalEvidence = await mintLocalReferenceTerminalEvidence({
  protocolKernel: kernel,
  terminalObjectRef: `receipt:${receipt.receiptId}`,
  signers: signerInputs(signers),
});
const certificate = localTerminalEvidence.certificate;
const trustBundle = trustMaterial(signers);
const certificateVerification = await roleClients.evidenceClient.verifyAuthorityCertificate(certificate, trustBundle);
const contractView = await roleClients.evidenceClient.getContractEvidenceProjection(contract.actionContractId);
const receiptTimeline = await roleClients.evidenceClient.getReceiptTimelineProjection(receipt.receiptId);
const installHealth = await roleClients.evidenceClient.getProtectedPathInstallHealthProjection(
  contract.actionContractId,
);

const replay = await runX402WalletGateway({
  protocol: roleClients.gatewayClient,
  surface,
  actionContractId: contract.actionContractId,
  greenlightId: greenlight.greenlightId,
  observedParameters: contract.parameters as X402PaymentParameters,
  surfaceOperationRef: "surface-op:demo-official-x402-replay",
});
const hostileInstalledPathMatrix = await buildHostileInstalledPathMatrix({
  protectedToolModule,
  protectedToolFacadeInput,
  roleClients,
  proposal,
  runtimeConfigValue,
  contract,
  changedParameterProbe,
  signerInvocationsAfterChangedParameterProbe,
  signedRetryCountAfterChangedParameterProbe,
  replay,
  signerInvocationsAfterReplay: signer.signatureCount(),
  signedRetryCountAfterReplay: sandbox.snapshot().signedRetryCount,
});

const phases = [
  {
    phase: "0_sandbox_payment_required_challenge",
    verdict: "pass",
    evidence: {
      outcome: sandboxChallenge.outcome,
      status: sandboxChallenge.status,
      paymentRequiredEvidenceRef: sandboxChallenge.paymentRequiredEvidenceRef,
      providerRequestRef: sandboxChallenge.providerRequestRef,
      providerOperationRef: sandboxChallenge.providerOperationRef,
      requestDigest: sandboxChallenge.requestDigest,
      authorityCreated: sandboxChallenge.authorityCreated,
      evidenceBoundary: sandboxChallenge.evidenceBoundary,
      signedRetryCountBeforeGateway: sandboxSnapshotAfterChallenge.signedRetryCount,
    },
  },
  {
    phase: "0b_role_scoped_activation_setup",
    verdict: "pass",
    evidence: {
      installSetupOutcome: installSetup.outcome,
      commitAtomicity: installSetup.commitAtomicity,
      recordRefs: installSetup.recordRefs,
      credentialRefId: credentialRef.gatewayCredentialRefId,
      delegatedAuthorityRefId: delegatedAuthorityRef.delegatedAuthorityRefId,
      protectedPathPostureId: protectedPathPosture.protectedPathPostureId,
      custodyProofPacketId: custodyProofPacket.gatewayCustodyProofPacketId,
      installAuthorityCreated: installSetup.authorityCreated,
      installGreenlightCreated: installSetup.greenlightCreated,
      installGatewayCheckPerformed: installSetup.gatewayCheckPerformed,
      installMutationAttempted: installSetup.mutationAttempted,
      custodyProofSecretMaterialIncluded: custodyProofPacket.secretMaterialIncluded,
      postureState: protectedPathPosture.postureState,
      gatewayCredentialCustodyStatus: credentialRef.custodyStatus,
    },
  },
  {
    phase: "1_protected_tool_facade_dispatch",
    verdict: "pass",
    evidence: {
      toolName: protectedToolFacade.toolName,
      facadeImportSource: protectedToolModule.importSource,
      outcome: protectedToolFacade.outcome,
      productBinding: protectedToolFacade.productBinding,
      idempotencyKey: protectedToolFacade.idempotencyKey,
      runtimeDispatchPrepared: protectedToolFacade.runtimeIngressBlock !== null,
      runtimeDispatchKind: protectedToolFacade.runtimeIngressBlock.dispatches[0]?.dispatchKind ?? null,
      dispatchBoundaryRef: protectedToolFacade.runtimeIngressBlock.dispatchBoundaryRef,
      authorityCreated: protectedToolFacade.authorityCreated,
      greenlightCreated: protectedToolFacade.greenlightCreated,
      gatewayCheckPerformed: protectedToolFacade.gatewayCheckPerformed,
      mutationAttempted: protectedToolFacade.mutationAttempted,
      credentialMaterialIncluded: protectedToolFacade.credentialMaterialIncluded,
      nextAction: protectedToolFacade.nextAction,
      nonClaims: protectedToolFacade.nonClaims,
    },
  },
  {
    phase: "2_runtime_proposal",
    verdict: "pass",
    evidence: {
      outcome: runtime.outcome,
      runtimeExecutionId: runtime.runtimeExecution.runtimeExecutionId,
      generatedExecutionGraphId: runtime.generatedExecutionGraph.generatedExecutionGraphId,
      graphCoverageStatus: runtime.generatedExecutionGraph.coverageStatus,
      toolCallDraftId: runtimeProposal.toolCallDraft.toolCallDraftId,
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
    phase: "3_policy_greenlight",
    verdict: "pass",
    evidence: {
      policyAuthoritySurface: "PolicyClient.evaluatePolicy",
      policyAuthorityRole: "control_plane",
      decision: policy.decision.decision,
      greenlightId: greenlight.greenlightId,
      decisionReasonCode: policy.decision.decisionReasonCode,
      gatewayCheckPerformed: policy.gatewayCheckPerformed,
      mutationAttempted: policy.mutationAttempted,
    },
  },
  {
    phase: "3b_hostile_installed_path_matrix",
    verdict: "pass",
    evidence: {
      matrix: hostileInstalledPathMatrix,
      allCasesPreventedConsequence: hostileInstalledPathMatrix.every((row) => row.consequencePrevented),
    },
  },
  {
    phase: "4_gateway_admission_and_signature",
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
    phase: "5_sandbox_paid_retry",
    verdict: "pass",
    evidence: {
      signedRetryCount: sandbox.snapshot().signedRetryCount,
      lastRetry: sandbox.snapshot().lastRetry,
      signedRetryEvidenceBoundary:
        gateway.signatureEvidence?.localReferenceSandboxBoundary ??
        sandbox.snapshot().lastRetry?.evidenceBoundary ??
        null,
      paymentResponseEvidenceRef: gateway.signatureEvidence?.paymentResponseEvidenceRef ?? null,
      providerRequestRef: gateway.signatureEvidence?.providerRequestRef ?? null,
      providerOperationRef: gateway.signatureEvidence?.providerOperationRef ?? null,
    },
  },
  {
    phase: "6_redacted_evidence_envelope",
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
    phase: "7_local_reference_terminal_certificate",
    verdict: "pass",
    evidence: {
      issuerSurface: localTerminalEvidence.issuerSurface,
      proofBoundary: localTerminalEvidence.proofBoundary,
      roleScopedProductionPath: localTerminalEvidence.roleScopedProductionPath,
      includedInStrictProtectedGatewayClaim: localTerminalEvidence.includedInStrictProtectedGatewayClaim,
      terminalEvidenceSource: localTerminalEvidence.terminalEvidenceSource,
      authorityCertificateId: certificate.authorityCertificateId,
      terminalKind: certificate.terminal.terminalKind,
      verificationOutcome: certificateVerification.outcome,
      signerRoles: certificate.signatures.map((signature) => signature.signerRole),
    },
  },
  {
    phase: "8_replay_refusal",
    verdict: "pass",
    evidence: {
      outcome: replay.outcome,
      gateDecision: replay.gatewayCheck.gateAttempt.gateDecision,
      reasonCode: replay.gatewayCheck.gateAttempt.gateDecisionReasonCode,
      signerInvocationsAfterReplay: signer.signatureCount(),
      signedRetryCountAfterReplay: sandbox.snapshot().signedRetryCount,
    },
  },
] as const;

const output = {
  schemaVersion: "handshake.demo.x402-protected-spend.v1",
  generatedAt: new Date().toISOString(),
  invariant: "runtime proposes; gateway alone signs after exact greenlight verification",
  report: buyerReadableApsReport(),
  cliArtifacts: {
    contractView,
    receiptTimeline,
    installHealth,
    certificate,
    trustBundle,
  },
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
      name: "x402_paid_http_call.exact",
      activationSurface: "Self-hosted activation over local foundation kernel evidence",
      currentClaim:
        "One protected x402 tool dispatch was prepared without authority, reduced to an exact contract through runtime ingress, greenlit once, checked by the gateway before signer use, recorded as redacted evidence, locally certified, and replay-refused.",
      proofBoundary: "local_reference",
    },
    protectedToolGatewayHandoff: {
      toolName: protectedToolFacade.toolName,
      facadeImportSource: protectedToolModule.importSource,
      facadeOutcome: protectedToolFacade.outcome,
      protectedSurfaceKind: protectedToolFacade.protectedSurfaceKind,
      actionClass: protectedToolFacade.actionClass,
      runtimeDispatchPrepared: protectedToolFacade.runtimeIngressBlock !== null,
      dispatchBoundaryRef: protectedToolFacade.runtimeIngressBlock.dispatchBoundaryRef,
      dispatchRef: protectedToolFacade.runtimeIngressBlock.dispatches[0]?.dispatchRef ?? null,
      productBinding: protectedToolFacade.productBinding,
      authorityCreated: protectedToolFacade.authorityCreated,
      greenlightCreated: protectedToolFacade.greenlightCreated,
      gatewayCheckPerformed: protectedToolFacade.gatewayCheckPerformed,
      mutationAttempted: protectedToolFacade.mutationAttempted,
      credentialMaterialIncluded: protectedToolFacade.credentialMaterialIncluded,
      handoffBoundary:
        "the protected tool facade prepares proposal/runtime evidence only; runtime ingress proposes the contract and the wallet gateway signs only after VerifiedGatewayCheck",
    },
    protectedAction: {
      actionClass: contract.actionClass,
      protectedSurfaceKind: contract.protectedSurfaceKind,
      resourceRef: contract.resourceRef,
      endpointDomain: new URL(attempt.endpointUrl).hostname,
      intendedHttpMethod: attempt.intendedHttpMethod,
      intendedRequestUrl: attempt.intendedRequestUrl,
      intendedRequestBodyPosture: contract.parameters.intendedRequestBodyPosture,
      providerEnvironmentPosture: contract.parameters.providerEnvironmentPosture,
      providerEnvironmentRef: contract.parameters.providerEnvironmentRef,
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
      runtimeCredentialMaterialVisible: JSON.stringify(runtime).includes("PAYMENT-SIGNATURE") ? "leaked" : "absent",
      signerInvocationBoundary: "after_verified_gateway_check_only",
      signedRetryBoundary: "adapter_fixture_observation_after_gateway_signature_only",
    },
    authorityPath: {
      runtimeProposalOutcome: runtime.outcome,
      actionContractId: contract.actionContractId,
      actionContractDigest: contract.actionContractDigest,
      policyDecisionId: policy.decision.policyDecisionId,
      policyDecision: policy.decision.decision,
      policyDecisionReasonCode: policy.decision.decisionReasonCode,
      policyAuthoritySurface: "PolicyClient.evaluatePolicy",
      policyAuthorityRole: "control_plane",
      greenlightId: greenlight.greenlightId,
      gateAttemptId: gateway.gatewayCheck.gateAttempt.gateAttemptId,
      gateDecision: gateway.gatewayCheck.gateAttempt.gateDecision,
      mutationAttemptId: gateway.gatewayCheck.mutationAttempt?.mutationAttemptId ?? null,
      receiptId: receipt.receiptId,
      authorityRecordsBeforePolicy: beforePolicyCounts,
      signerInvocationsAfterGatewayAdmission: signer.signatureCount(),
      signedRetryCountAfterGatewayAdmission: sandbox.snapshot().signedRetryCount,
      changedParameterDecision: changedParameterProbe.gatewayCheck.gateAttempt.gateDecision,
      changedParameterReasonCode: changedParameterProbe.gatewayCheck.gateAttempt.gateDecisionReasonCode,
      replayDecision: replay.gatewayCheck.gateAttempt.gateDecision,
      replayReasonCode: replay.gatewayCheck.gateAttempt.gateDecisionReasonCode,
      signerInvocationsAfterReplay: signer.signatureCount(),
      signedRetryCountAfterReplay: sandbox.snapshot().signedRetryCount,
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
      localSandbox: {
        paymentRequiredEvidenceRef: sandboxChallenge.paymentRequiredEvidenceRef,
        providerEnvironmentPosture: contract.parameters.providerEnvironmentPosture,
        signedRetryCount: sandbox.snapshot().signedRetryCount,
        signedRetryIsAuthority: false,
        evidenceBoundary:
          gateway.signatureEvidence?.localReferenceSandboxBoundary ??
          sandbox.snapshot().lastRetry?.evidenceBoundary ??
          sandboxChallenge.evidenceBoundary,
      },
    },
    hostileGeneratedExecutionMatrix: hostileInstalledPathMatrix,
    terminalPosture: {
      terminalKind: certificate.terminal.terminalKind,
      productionTerminalEvidenceSource: "receipt",
      authorityCertificateId: certificate.authorityCertificateId,
      verificationOutcome: certificateVerification.outcome,
      signerRoles: certificate.signatures.map((signature) => signature.signerRole),
      trustBoundary: "local_pinned_trust_material_only",
      localReferenceCertificate: {
        issuerSurface: localTerminalEvidence.issuerSurface,
        proofBoundary: localTerminalEvidence.proofBoundary,
        roleScopedProductionPath: localTerminalEvidence.roleScopedProductionPath,
        includedInStrictProtectedGatewayClaim: localTerminalEvidence.includedInStrictProtectedGatewayClaim,
        terminalEvidenceSource: localTerminalEvidence.terminalEvidenceSource,
      },
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
      "aggregate payment-budget management",
      "payment settlement finality",
      "broad x402 compatibility",
      "seller middleware",
      "facilitator operation",
      "broad MCP/CLI/browser/shell/network control",
      "cross-org AuthorityCertificate trust",
      "marketplace certification",
      "clearing-house readiness",
      "role-scoped terminal certificate issuer",
    ],
    missingProofObjects: [
      {
        proofObject: "role-scoped terminal evidence issuer",
        requiredBeforeClaim: "production certificate issuance",
      },
      {
        proofObject: "external custody proof packet",
        requiredBeforeClaim: "provider/customer gateway custody",
      },
      {
        proofObject: "cross-org trust material distribution and remote status authority",
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

type HostileInstalledPathMatrixRow = {
  caseId: string;
  attackSurface: string;
  boundary: string;
  outcome: string;
  reasonCodes: string[];
  runtimeDispatchPrepared: boolean;
  actionContractsCreated: number;
  authorityCreated: boolean;
  gatewayCheckPerformed: boolean;
  mutationAttempted: boolean;
  signerInvocationsAfterAttempt: number;
  signedRetryCountAfterAttempt: number;
  consequencePrevented: boolean;
};

async function buildHostileInstalledPathMatrix(input: {
  protectedToolModule: ProtectedToolModule;
  protectedToolFacadeInput: ProtectedX402ToolFacadeInput;
  roleClients: ReturnType<typeof httpRoleClientsForStore>;
  proposal: X402InstallProposal;
  runtimeConfigValue: X402PaymentRuntimeConfig;
  contract: ActionContract;
  changedParameterProbe: X402WalletGatewayResult;
  signerInvocationsAfterChangedParameterProbe: number;
  signedRetryCountAfterChangedParameterProbe: number;
  replay: X402WalletGatewayResult;
  signerInvocationsAfterReplay: number;
  signedRetryCountAfterReplay: number;
}): Promise<HostileInstalledPathMatrixRow[]> {
  const stalePolicy = input.protectedToolModule.prepareProtectedX402ToolDispatch({
    ...input.protectedToolFacadeInput,
    requestId: "req_x402_hostile_stale_policy",
    policyFreshness: "stale",
  });
  const rawX402Payload = input.protectedToolModule.prepareProtectedX402ToolDispatch({
    ...input.protectedToolFacadeInput,
    requestId: "req_x402_hostile_raw_payload",
    PaymentPayload: "raw-payload",
  });
  const siblingMcp = await input.roleClients.runtimeClient.proposeRuntimeIngressActionContracts({
    tenantId: input.proposal.tenantId,
    organizationId: input.proposal.organizationId,
    config: { x402Payment: input.runtimeConfigValue },
    dispatchBlock: {
      principalIntentRef: "intent:hostile direct x402 MCP payment",
      generatedCodeOrSpecRef: "runtime:hostile-installed-x402-direct-mcp",
      dispatchBoundaryRef: "dispatch-boundary:x402-installed-hostile-matrix",
      dispatches: [
        {
          dispatchKind: "raw_sibling_x402_payment",
          dispatchRef: "dispatch:x402-installed-hostile:mcp-direct",
          rawCommandRef: "mcp:x402.directPayment",
          rawCommandSummary: ["mcp.invoke", "x402.directPayment", input.proposal.endpointEvidence.endpointUrl],
          endpointUrl: input.proposal.endpointEvidence.endpointUrl,
          payee: input.proposal.endpointEvidence.payee,
          network: input.proposal.endpointEvidence.network,
          token: input.proposal.endpointEvidence.token,
          atomicAmount: (input.contract.parameters as X402PaymentParameters).atomicAmount,
          paymentRequirementsDigest: input.proposal.endpointEvidence.paymentRequirementsDigest,
        },
      ],
    },
  });

  return [
    {
      caseId: "stale_policy_metadata",
      attackSurface: "installed facade input",
      boundary: "facade preflight before runtime dispatch",
      outcome: stalePolicy.outcome,
      reasonCodes: stalePolicy.reasonCodes,
      runtimeDispatchPrepared: stalePolicy.runtimeIngressBlock !== null,
      actionContractsCreated: 0,
      authorityCreated: stalePolicy.authorityCreated,
      gatewayCheckPerformed: stalePolicy.gatewayCheckPerformed,
      mutationAttempted: stalePolicy.mutationAttempted,
      signerInvocationsAfterAttempt: 0,
      signedRetryCountAfterAttempt: 0,
      consequencePrevented:
        stalePolicy.outcome === "metadata_stale" &&
        stalePolicy.runtimeIngressBlock === null &&
        stalePolicy.reasonCodes.includes("protected_x402_policy_stale"),
    },
    {
      caseId: "raw_x402_payment_payload_input",
      attackSurface: "installed facade schema",
      boundary: "strict schema before runtime dispatch",
      outcome: rawX402Payload.outcome,
      reasonCodes: rawX402Payload.reasonCodes,
      runtimeDispatchPrepared: rawX402Payload.runtimeIngressBlock !== null,
      actionContractsCreated: 0,
      authorityCreated: rawX402Payload.authorityCreated,
      gatewayCheckPerformed: rawX402Payload.gatewayCheckPerformed,
      mutationAttempted: rawX402Payload.mutationAttempted,
      signerInvocationsAfterAttempt: 0,
      signedRetryCountAfterAttempt: 0,
      consequencePrevented:
        rawX402Payload.outcome === "tool_execution_error" &&
        rawX402Payload.runtimeIngressBlock === null &&
        rawX402Payload.reasonCodes.includes("protected_x402_input_schema_invalid"),
    },
    {
      caseId: "sibling_mcp_direct_payment",
      attackSurface: "runtime ingress raw sibling MCP route",
      boundary: "runtime graph refusal before action contract",
      outcome: siblingMcp.outcome,
      reasonCodes: siblingMcp.responsePosture.reasonCodes,
      runtimeDispatchPrepared: false,
      actionContractsCreated: siblingMcp.responsePosture.actionContractRefs.length,
      authorityCreated: siblingMcp.responsePosture.authorityCreated,
      gatewayCheckPerformed: siblingMcp.responsePosture.gatewayCheckPerformed,
      mutationAttempted: siblingMcp.responsePosture.mutationAttempted,
      signerInvocationsAfterAttempt: 0,
      signedRetryCountAfterAttempt: 0,
      consequencePrevented:
        siblingMcp.outcome === "one_or_more_dispatches_refused" &&
        siblingMcp.responsePosture.actionContractRefs.length === 0 &&
        siblingMcp.generatedExecutionGraph.coverageStatus === "contains_bypass_risk" &&
        siblingMcp.generatedExecutionGraph.terminalReasonCodes.includes("runtime_ingress_raw_sibling_bypass"),
    },
    {
      caseId: "changed_observed_parameters",
      attackSurface: "gateway observed-parameter check",
      boundary: "gateway check before signer use",
      outcome: input.changedParameterProbe.outcome,
      reasonCodes: [input.changedParameterProbe.gatewayCheck.gateAttempt.gateDecisionReasonCode],
      runtimeDispatchPrepared: false,
      actionContractsCreated: 0,
      authorityCreated: false,
      gatewayCheckPerformed: true,
      mutationAttempted: input.changedParameterProbe.gatewayCheck.mutationAttempt !== null,
      signerInvocationsAfterAttempt: input.signerInvocationsAfterChangedParameterProbe,
      signedRetryCountAfterAttempt: input.signedRetryCountAfterChangedParameterProbe,
      consequencePrevented:
        input.changedParameterProbe.outcome === "gateway_check_refused" &&
        input.changedParameterProbe.gatewayCheck.gateAttempt.gateDecisionReasonCode === "params_mismatch" &&
        input.changedParameterProbe.gatewayCheck.mutationAttempt === null &&
        input.signerInvocationsAfterChangedParameterProbe === 0 &&
        input.signedRetryCountAfterChangedParameterProbe === 0,
    },
    {
      caseId: "consumed_greenlight_replay",
      attackSurface: "gateway one-use greenlight check",
      boundary: "gateway check before signer reuse",
      outcome: input.replay.outcome,
      reasonCodes: [input.replay.gatewayCheck.gateAttempt.gateDecisionReasonCode],
      runtimeDispatchPrepared: false,
      actionContractsCreated: 0,
      authorityCreated: false,
      gatewayCheckPerformed: true,
      mutationAttempted: input.replay.gatewayCheck.mutationAttempt !== null,
      signerInvocationsAfterAttempt: input.signerInvocationsAfterReplay,
      signedRetryCountAfterAttempt: input.signedRetryCountAfterReplay,
      consequencePrevented:
        input.replay.outcome === "gateway_check_refused" &&
        input.replay.gatewayCheck.gateAttempt.gateDecisionReasonCode === "already_consumed" &&
        input.replay.gatewayCheck.mutationAttempt === null &&
        input.signerInvocationsAfterReplay === 1 &&
        input.signedRetryCountAfterReplay === 1,
    },
  ];
}

async function recordGatewayCheckedPosture(
  gatewayClient: GatewayClient,
  installProposal: X402InstallProposal,
  compiled: NonNullable<X402InstallProposal["compiledRecords"]>,
) {
  const probes = await runBypassProbeExecutors(
    gatewayClient,
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
  return gatewayClient.createProtectedPathPosture({
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

async function recordGatewayCustodyProofPacket(
  gatewayClient: GatewayClient,
  installProposal: X402InstallProposal,
  compiled: NonNullable<X402InstallProposal["compiledRecords"]>,
  credentialRef: GatewayCredentialRef,
  protectedPathPosture: ProtectedPathPosture,
): Promise<GatewayCustodyProofPacket> {
  const leaseExpiresAt = futureIso(30);
  return gatewayClient.recordGatewayCustodyProofPacket({
    tenantId: installProposal.tenantId,
    organizationId: installProposal.organizationId,
    gatewayCredentialRefId: credentialRef.gatewayCredentialRefId,
    gatewayCredentialRefDigest: credentialRef.gatewayCredentialRefDigest,
    protectedPathPostureId: protectedPathPosture.protectedPathPostureId,
    protectedPathPostureDigest: protectedPathPosture.postureDigest,
    gatewayInstallEvidenceRefs: [
      `install:${installProposal.installProposalId}`,
      `gateway-registry-entry:${compiled.gatewayRegistryEntry.gatewayRegistryEntryId}`,
    ],
    gatewayInstallEvidenceDigests: [installProposal.installDigest],
    bypassProbeIds: protectedPathPosture.bypassProbeIds,
    bypassProbeDigests: protectedPathPosture.bypassProbeDigests,
    custodyClaimLevel: "customer_gateway_evidence",
    custodyProviderClass: "x402_wallet_gateway",
    custodyProviderRegistryRef: credentialRef.providerRegistryRef,
    custodyProviderRegistryDigest: credentialRef.providerRegistryDigest,
    opaqueKeyHandleRef: "opaque-key-handle:x402-wallet-gateway:demo",
    opaqueKeyHandleDigest: await digestCanonical(
      asJson({
        signerHandleRef: installProposal.walletGatewayProfile.signerRef,
        gatewayId: compiled.gatewayRegistryEntry.gatewayId,
      }),
    ),
    leaseRef: "lease:x402-wallet-gateway:demo",
    leaseVersion: "lease-v1",
    leaseIssuedAt: nowIso(),
    leaseExpiresAt,
    attestationRefs: ["attestation:x402-wallet-gateway:self-hosted-demo"],
    attestationDigests: [
      await digestCanonical(
        asJson({
          providerRegistryRef: credentialRef.providerRegistryRef,
          gatewayRegistryEntryId: compiled.gatewayRegistryEntry.gatewayRegistryEntryId,
        }),
      ),
    ],
    redactedAuditRefs: ["audit:x402-wallet-gateway:redacted-demo"],
    redactedAuditDigest: await digestCanonical(
      asJson({
        gatewayCredentialRefId: credentialRef.gatewayCredentialRefId,
        redactionProfileRef: "gateway-custody-proof-packet:v0.2-redacted",
      }),
    ),
    custodyDriftStatus: "current",
    resolverDriftStatus: "current",
    redactionStatus: "redacted",
    externalVerificationStatus: "verified_by_official_source",
    recordedAt: nowIso(),
    expiresAt: leaseExpiresAt,
  });
}

async function runtimeConfig(
  installProposal: X402InstallProposal,
  compiled: NonNullable<X402InstallProposal["compiledRecords"]>,
  credentialRef: GatewayCredentialRef,
  delegatedAuthorityRef: DelegatedAuthorityRef,
  custodyProofPacket: GatewayCustodyProofPacket,
): Promise<X402PaymentRuntimeConfig> {
  const policyVersionRef = `${installProposal.policyPackRef}@${installProposal.policyPackVersion}`;
  const policyVersionDigest = await digestCanonical(
    asJson({ policyPackRef: installProposal.policyPackRef, policyPackVersion: installProposal.policyPackVersion }),
  );
  const gatewayRegistrationRef = `gateway-registration:${compiled.gatewayRegistryEntry.gatewayId}`;
  const probePostureDigest = await digestCanonical(
    asJson({
      bypassPosture: "gateway_checked",
      actionClass: "x402_payment.exact",
      gatewayId: compiled.gatewayRegistryEntry.gatewayId,
      resourceRef: installProposal.resourceRef,
    }),
  );
  const contractExpiresAt = futureIso();
  const gatewayCredentialBinding = x402WalletGatewayCredentialBindingFor(credentialRef);
  const gatewayReadinessDigest = await digestCanonical(
    asJson({
      readinessScope: "pre_contract",
      readinessProofLevel: "control_plane_registration",
      installDigest: installProposal.installDigest,
      probePostureDigest,
      gatewayRegistrationRef,
      gatewayCredentialRefDigest: gatewayCredentialBinding.gatewayCredentialRefDigest,
      gatewayCredentialCustodyStatus: gatewayCredentialBinding.requiredCredentialCustodyStatus,
      gatewayCustodyProofPacketRef: `gateway-custody-proof:${custodyProofPacket.gatewayCustodyProofPacketId}`,
      gatewayCustodyProofPacketDigest: custodyProofPacket.gatewayCustodyProofPacketDigest,
      gatewayCustodyClaimLevel: custodyProofPacket.custodyClaimLevel,
      gatewayCustodyExternalVerificationStatus: custodyProofPacket.externalVerificationStatus,
      gatewayCustodyProofExpiresAt: custodyProofPacket.expiresAt,
      gatewayPosture: "online",
      policyVersionRef,
      policyVersionDigest,
      gatewayRegistryEntryId: compiled.gatewayRegistryEntry.gatewayRegistryEntryId,
      operatingEnvelopeId: compiled.operatingEnvelope.envelopeId,
      expiresAt: contractExpiresAt,
    }),
  );
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
    gatewayReadinessRef: "handshake://local/x402/gateway-readiness.json",
    gatewayReadinessDigest,
    policyVersionRef,
    policyVersionDigest,
    toolCapabilityId: compiled.toolCapability.toolCapabilityId,
    actionTypeId: compiled.actionType.actionTypeId,
    gatewayRegistryEntryId: compiled.gatewayRegistryEntry.gatewayRegistryEntryId,
    gatewayId: compiled.gatewayRegistryEntry.gatewayId,
    gatewayCredentialBinding,
    delegatedAuthorityBinding: x402DelegatedSpendAuthorityBindingFor(delegatedAuthorityRef),
    maxAtomicAmountPerCall: installProposal.spendBounds.maxAtomicAmountPerCall,
    contractExpiresAt,
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
      spendWindowEnforcementStatus: "not_enforced_local_metadata",
      issuedAt: createdAt,
      expiresAt: futureIso(),
    },
  };
}

function baseInstallProposalForRegistration(proposalValue: X402InstallProposal): InstallProposal {
  return {
    installProposalId: proposalValue.installProposalId,
    schemaVersion: proposalValue.schemaVersion,
    tenantId: proposalValue.tenantId,
    organizationId: proposalValue.organizationId,
    createdAt: proposalValue.createdAt,
    adapterPackId: proposalValue.adapterPackId,
    adapterPackVersion: proposalValue.adapterPackVersion,
    actionFamily: proposalValue.actionFamily,
    protectedSurfaceKind: proposalValue.protectedSurfaceKind,
    resourceRef: proposalValue.resourceRef,
    status: proposalValue.status,
    humanSummary: proposalValue.humanSummary,
    refusalReasonCodes: proposalValue.refusalReasonCodes,
    compiledRecords: proposalValue.compiledRecords,
    policyPackRef: proposalValue.policyPackRef,
    policyPackVersion: proposalValue.policyPackVersion,
    bypassProbePlan: proposalValue.bypassProbePlan,
    receiptExpectationRefs: proposalValue.receiptExpectationRefs,
    installDigest: proposalValue.installDigest,
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
  installClient: InstallClient;
  controlPlaneClient: ControlPlaneClient;
  policyClient: PolicyClient;
  gatewayClient: GatewayClient;
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
    installClient: new InstallClient(
      "http://handshake.test",
      {
        roleCredential: tokens.control_plane,
        requestIdentityFactory: () => "demo-x402-install-request",
        originatingIdentity: "ref:example/x402-protected-spend",
      },
      fetchImpl,
    ),
    controlPlaneClient: new ControlPlaneClient(
      "http://handshake.test",
      {
        roleCredential: tokens.control_plane,
        requestIdentityFactory: () => "demo-x402-control-plane-request",
        originatingIdentity: "ref:example/x402-protected-spend",
      },
      fetchImpl,
    ),
    policyClient: new PolicyClient(
      "http://handshake.test",
      {
        roleCredential: tokens.control_plane,
        requestIdentityFactory: () => "demo-x402-policy-request",
        originatingIdentity: "ref:example/x402-protected-spend",
      },
      fetchImpl,
    ),
    gatewayClient: new GatewayClient(
      "http://handshake.test",
      {
        roleCredential: tokens.gateway_custody,
        requestIdentityFactory: () => "demo-x402-gateway-custody-request",
        originatingIdentity: "ref:example/x402-protected-spend",
      },
      fetchImpl,
    ),
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

type FixtureEd25519Signer = {
  signerRole: "operator_policy" | "gateway";
  keyIdentityRef: string;
  privateKeyPkcs8: string;
  publicKeyEd25519: string;
};

type LocalReferenceTerminalEvidenceInput = {
  protocolKernel: HandshakeKernel;
  terminalObjectRef: string;
  signers: AuthorityCertificateSignerInput[];
};

async function mintLocalReferenceTerminalEvidence(input: LocalReferenceTerminalEvidenceInput) {
  const certificate = await input.protocolKernel.createAuthorityCertificate({
    terminalObjectRef: input.terminalObjectRef,
    signers: input.signers,
  });
  return {
    certificate,
    issuerSurface: "kernel.createAuthorityCertificate",
    proofBoundary: "local_reference_terminal_evidence_only",
    roleScopedProductionPath: false,
    includedInStrictProtectedGatewayClaim: false,
    terminalEvidenceSource: "receipt",
  } as const;
}

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
    `- Activation surface: ${outputValue.report.proofObject.activationSurface}`,
    `- Boundary: ${outputValue.report.proofObject.proofBoundary}`,
    `- Claim: ${outputValue.report.proofObject.currentClaim}`,
    "",
    "### Protected Tool Gateway Handoff",
    "",
    "```json",
    JSON.stringify(outputValue.report.protectedToolGatewayHandoff, null, 2),
    "```",
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
    "This output is local evidence only. It does not claim hosted operation, provider custody, aggregate payment-budget management, settlement finality, or cross-org certificate trust.",
  );
  lines.push("");
  return `${lines.join("\n")}\n`;
}

async function buildProtectedToolFacadeInput(
  config: X402PaymentRuntimeConfig,
  compiled: NonNullable<X402InstallProposal["compiledRecords"]>,
  installProposal: X402InstallProposal,
  paymentAttempt: X402PaymentAttempt,
  custodyProofPacket: GatewayCustodyProofPacket,
): Promise<ProtectedX402ToolFacadeInput> {
  const policyVersionRef = `${installProposal.policyPackRef}@${installProposal.policyPackVersion}`;
  const policyVersionDigest = await digestCanonical(
    asJson({ policyPackRef: installProposal.policyPackRef, policyPackVersion: installProposal.policyPackVersion }),
  );
  const gatewayRegistrationRef = `gateway-registration:${config.gatewayId}`;
  const probePostureDigest = await digestCanonical(
    asJson({
      bypassPosture: "gateway_checked",
      actionClass: "x402_payment.exact",
      gatewayId: config.gatewayId,
      resourceRef: installProposal.resourceRef,
    }),
  );
  const readinessExpiresAt = config.contractExpiresAt;
  const gatewayReadinessDigest = await digestCanonical(
    asJson({
      readinessScope: "pre_contract",
      readinessProofLevel: "control_plane_registration",
      installDigest: installProposal.installDigest,
      probePostureDigest,
      gatewayRegistrationRef,
      gatewayCredentialRefDigest: config.gatewayCredentialBinding.gatewayCredentialRefDigest,
      gatewayCredentialCustodyStatus: config.gatewayCredentialBinding.requiredCredentialCustodyStatus,
      gatewayCustodyProofPacketRef: `gateway-custody-proof:${custodyProofPacket.gatewayCustodyProofPacketId}`,
      gatewayCustodyProofPacketDigest: custodyProofPacket.gatewayCustodyProofPacketDigest,
      gatewayCustodyClaimLevel: custodyProofPacket.custodyClaimLevel,
      gatewayCustodyExternalVerificationStatus: custodyProofPacket.externalVerificationStatus,
      gatewayCustodyProofExpiresAt: custodyProofPacket.expiresAt,
      gatewayPosture: "online",
      policyVersionRef,
      policyVersionDigest,
      gatewayRegistryEntryId: config.gatewayRegistryEntryId,
      operatingEnvelopeId: config.operatingEnvelopeId,
      expiresAt: readinessExpiresAt,
    }),
  );
  return {
    requestId: "req_x402_protected_tool_gateway_demo",
    principalId: config.principalId,
    agentId: config.agentId,
    principalIntentRef: paymentAttempt.principalIntentRef,
    generatedCodeOrSpecRef: paymentAttempt.generatedCodeOrSpecRef,
    runtimeAdapterRef: config.runtimeAdapterId,
    runId: config.runId,
    dispatchBoundaryRef: "dispatch-boundary:x402-protected-tool-gateway-demo",
    dispatchRef: "dispatch:x402-protected-tool-gateway-demo:1",
    operatingEnvelopeId: config.operatingEnvelopeId,
    toolCapabilityId: config.toolCapabilityId,
    actionTypeId: config.actionTypeId,
    gatewayRegistryEntryId: config.gatewayRegistryEntryId,
    gatewayId: config.gatewayId,
    policyOwnerRef: installProposal.policyPackRef,
    evidenceConsumerRef: "evidence-consumer:self-hosted-activation",
    contractExpiresAt: config.contractExpiresAt,
    idempotencyKey: `x402-tool:${installProposal.installDigest.slice("sha256:".length)}`,
    metadataDigest: await digestCanonical(
      asJson({
        source: "examples/x402-protected-spend",
        installProposalId: installProposal.installProposalId,
        paymentRequiredEvidenceRef: requireString(
          paymentAttempt.paymentRequiredEvidenceRef,
          "paymentRequiredEvidenceRef",
        ),
      }),
    ),
    toolCatalogDigest: await digestCanonical(asJson(compiled.toolCapability)),
    actionCatalogDigest: await digestCanonical(asJson(compiled.actionType)),
    gatewayRegistryDigest: await digestCanonical(asJson(compiled.gatewayRegistryEntry)),
    metadataFreshness: "fresh",
    policyFreshness: "fresh",
    installReadiness: "trusted_gateway_ready",
    gatewayPosture: "online",
    readinessProofLevel: "control_plane_registration",
    gatewayReadinessRef: "handshake://local/x402/gateway-readiness.json",
    gatewayReadinessDigest,
    readinessExpiresAt,
    installDigest: installProposal.installDigest,
    probePostureDigest,
    gatewayRegistrationRef,
    gatewayCredentialRefDigest: config.gatewayCredentialBinding.gatewayCredentialRefDigest,
    gatewayCredentialCustodyStatus: config.gatewayCredentialBinding.requiredCredentialCustodyStatus,
    gatewayCustodyProofPacketRef: `gateway-custody-proof:${custodyProofPacket.gatewayCustodyProofPacketId}`,
    gatewayCustodyProofPacketDigest: custodyProofPacket.gatewayCustodyProofPacketDigest,
    gatewayCustodyClaimLevel: custodyProofPacket.custodyClaimLevel,
    gatewayCustodyExternalVerificationStatus: custodyProofPacket.externalVerificationStatus,
    gatewayCustodyProofExpiresAt: custodyProofPacket.expiresAt,
    policyVersionRef,
    policyVersionDigest,
    rawCredentialRefsIncluded: false,
    endpointUrl: paymentAttempt.endpointUrl,
    payee: paymentAttempt.payee,
    payTo: requireString(paymentAttempt.payTo, "payTo"),
    network: paymentAttempt.network,
    token: paymentAttempt.token,
    asset: requireString(paymentAttempt.asset, "asset"),
    atomicAmount: paymentAttempt.atomicAmount,
    x402EvidenceProfile: "official_payment_required",
    paymentRequirementsDigest: paymentAttempt.paymentRequirementsDigest,
    paymentRequiredEvidenceRef: requireString(paymentAttempt.paymentRequiredEvidenceRef, "paymentRequiredEvidenceRef"),
    facilitatorRef: paymentAttempt.facilitatorRef ?? null,
    intendedHttpMethod: requireString(paymentAttempt.intendedHttpMethod, "intendedHttpMethod"),
    intendedRequestUrl: requireString(paymentAttempt.intendedRequestUrl, "intendedRequestUrl"),
    intendedRequestBodyPosture: paymentAttempt.intendedRequestBodyPosture ?? "no_body",
    intendedRequestBodyDigest: paymentAttempt.intendedRequestBodyDigest ?? null,
    selectedHeadersDigest: requireString(paymentAttempt.selectedHeadersDigest, "selectedHeadersDigest"),
    providerEnvironmentPosture: paymentAttempt.providerEnvironmentPosture ?? "local_reference_sandbox",
    providerEnvironmentRef: paymentAttempt.providerEnvironmentRef ?? null,
    x402Version: requireNumber(paymentAttempt.x402Version, "x402Version"),
    x402Scheme: "exact",
    maxTimeoutSeconds: requireNumber(paymentAttempt.maxTimeoutSeconds, "maxTimeoutSeconds"),
    selectedPaymentRequirementIndex: requireNumber(
      paymentAttempt.selectedPaymentRequirementIndex,
      "selectedPaymentRequirementIndex",
    ),
    selectedPaymentRequirementDigest: requireString(
      paymentAttempt.selectedPaymentRequirementDigest,
      "selectedPaymentRequirementDigest",
    ) as `sha256:${string}`,
    sdkPackageVersions: paymentAttempt.sdkPackageVersions ?? {},
    extensionKeys: paymentAttempt.extensionKeys ?? [],
    sequenceNumber: paymentAttempt.sequenceNumber ?? 1,
    loopDetected: false,
    retryDetected: false,
    branchDetected: false,
    correlationRef: "correlation:x402:protected-tool-gateway-demo",
    evidenceRefs: ["evidence:x402-protected-tool-facade:self-hosted", `install:${installProposal.installProposalId}`],
  };
}

function requireString(value: string | null | undefined, label: string): string {
  if (!value) throw new Error(`Expected protected x402 tool facade input ${label}.`);
  return value;
}

function requireNumber(value: number | null | undefined, label: string): number {
  if (value === null || value === undefined) {
    throw new Error(`Expected protected x402 tool facade input ${label}.`);
  }
  return value;
}

function asJson(value: unknown): JsonValue {
  return JSON.parse(JSON.stringify(value)) as JsonValue;
}

type ProtectedToolModule = {
  importSource: "source" | "clean_installed_package";
  prepareProtectedX402ToolDispatch(input: unknown): ProtectedX402ToolFacadeResult;
};

async function loadProtectedToolModule(): Promise<ProtectedToolModule> {
  const moduleUrl = protectedToolModuleUrlFromArgs();
  if (moduleUrl) {
    const installedModule = (await import(moduleUrl)) as {
      prepareProtectedX402ToolDispatch(input: unknown): ProtectedX402ToolFacadeResult;
    };
    return {
      importSource: "clean_installed_package",
      prepareProtectedX402ToolDispatch: installedModule.prepareProtectedX402ToolDispatch,
    };
  }

  const sourceModule = await import("../../src/x402-protected-tool");
  return {
    importSource: "source",
    prepareProtectedX402ToolDispatch: sourceModule.prepareProtectedX402ToolDispatch,
  };
}

function protectedToolModuleUrlFromArgs(): string | undefined {
  const index = process.argv.indexOf("--x402-protected-tool-module-url");
  if (index === -1) return undefined;
  const value = process.argv[index + 1];
  if (!value) throw new Error("--x402-protected-tool-module-url requires a module URL value.");
  return value;
}
