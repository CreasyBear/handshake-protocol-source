import { describe, expect, it } from "bun:test";
import { createApp, type WorkerBindings } from "../../src/http/app";
import type { CallerAuthTokens } from "../../src/http/admission/caller-auth";
import { HandshakeClient, type HandshakeFetch } from "../../src/sdk/client";
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
import { requireInstallProposalGatewayRegistryEntry } from "../../src/install/install-proposal";
import { runX402WalletGateway, type X402PaymentParameters } from "../../src/adapters/x402-payment/wallet-gateway";
import { runPackageInstallGateway } from "../../src/adapters/package-install/gateway";
import { digestCanonical } from "../../src/protocol/foundation/canonical";
import { nowIso } from "../../src/protocol/foundation/ids";
import { verifyAuthorityCertificate, type AuthorityCertificateSignerInput } from "../../src";
import { projectX402AuthorityCertificateEvidenceProfile } from "../../src/conformance";
import { proposeRuntimeIngressActionContracts } from "../../src/runtime";
import type { ProtocolStore } from "../../src/protocol/store/port";
import type { GatewayCredentialRef } from "../../src/protocol/areas/credential-custody";
import type { DelegatedAuthorityRef } from "../../src/protocol/areas/delegated-authority";
import {
  createPackageManifestSurface,
  packageInstallObservedParameters,
  packageInstallRuntimeConfig,
} from "../support/package-install-flow";
import { futureIso, makeKernelFixture, registerFixtureObjects } from "../support/fixtures";
import { localX402PaymentAttemptBindings } from "../support/install-proposal-helpers";

const ED25519_ALGORITHM = { name: "Ed25519" } as Algorithm;
const x402Digest = `sha256:${"a".repeat(64)}` as const;
const x402SelectedHeadersDigest = `sha256:${"8".repeat(64)}` as const;
const x402SelectedPaymentRequirementDigest = `sha256:${"7".repeat(64)}` as const;
const x402SdkPackageVersions = {
  "@x402/core": "2.12.0",
  "@x402/evm": "2.12.0",
  "@x402/fetch": "2.12.0",
} as const;
const tokens = {
  control_plane: "aps_control_plane_token",
  runtime_evidence: "aps_runtime_evidence_token",
  gateway_custody: "aps_gateway_custody_token",
  review_custody: "aps_review_custody_token",
} as const;
const x402CredentialRefs = new WeakMap<X402InstallProposal, GatewayCredentialRef>();
const x402AuthorityRefs = new WeakMap<X402InstallProposal, DelegatedAuthorityRef>();

describe("adapter-backed APS proof spine", () => {
  it("proves x402 runtime ingress composes through the adapter gateway into redacted transaction evidence", async () => {
    const fixture = makeKernelFixture();
    const x402 = await installX402ProofProfile(fixture);
    await recordGatewayCheckedX402Posture(fixture, x402.proposal, x402.records);
    const client = httpClientForStore(fixture.store);
    const runtimeClient = httpClientForStore(fixture.store, { runtime_evidence: tokens.runtime_evidence });

    const runtime = await proposeRuntimeIngressActionContracts(
      fixture.kernel,
      { x402Payment: x402.runtimeConfig },
      {
        principalIntentRef: "intent:fetch paid context as generated agent code",
        generatedCodeOrSpecRef: "runtime:aps-x402-dispatch-block",
        dispatchBoundaryRef: "runtime-adapter:aps-x402",
        dispatches: [
          {
            dispatchKind: "wrapped_x402_payment",
            dispatchRef: "dispatch:aps-x402-payment:1",
            endpointUrl: x402.proposal.endpointEvidence.endpointUrl,
            payee: x402.proposal.endpointEvidence.payee,
            network: x402.proposal.endpointEvidence.network,
            token: x402.proposal.endpointEvidence.token,
            atomicAmount: "2500",
            paymentRequirementsDigest: x402.proposal.endpointEvidence.paymentRequirementsDigest,
            paymentRequiredEvidenceRef: "evidence:x402-payment-required",
            intendedHttpMethod: "GET",
            intendedRequestUrl: x402.proposal.endpointEvidence.endpointUrl,
            intendedRequestBodyDigest: null,
            selectedHeadersDigest: x402SelectedHeadersDigest,
            x402Version: 2,
            x402Scheme: "exact",
            asset: x402.proposal.endpointEvidence.token,
            payTo: x402.proposal.endpointEvidence.payee,
            maxTimeoutSeconds: 60,
            selectedPaymentRequirementIndex: 0,
            selectedPaymentRequirementDigest: x402SelectedPaymentRequirementDigest,
            sdkPackageVersions: x402SdkPackageVersions,
            extensionKeys: ["payment-identifier"],
          },
        ],
      },
    );

    expect(runtime.outcome).toBe("action_contracts_proposed");
    const proposed = runtime.proposals[0];
    if (!proposed || proposed.outcome !== "action_contract_proposed") throw new Error("expected x402 contract");
    const contract = proposed.actionContract;
    expect(contract.actionClass).toBe("x402_payment.exact");
    expect(contract.runtimeExecutionId).toBe(runtime.runtimeExecution.runtimeExecutionId);
    expect(contract.generatedExecutionGraphId).toBe(runtime.generatedExecutionGraph.generatedExecutionGraphId);
    expect(contract.generatedExecutionNodeId).toBe("runtime_dispatch_1");
    expect(contract.parameters).toMatchObject({
      intendedHttpMethod: "GET",
      intendedRequestUrl: x402.proposal.endpointEvidence.endpointUrl,
      selectedHeadersDigest: x402SelectedHeadersDigest,
      x402Version: 2,
      x402Scheme: "exact",
      selectedPaymentRequirementDigest: x402SelectedPaymentRequirementDigest,
      sdkPackageVersions: x402SdkPackageVersions,
      extensionKeys: ["payment-identifier"],
    });
    expect(runtime.runtimeExecution.evidenceRefs).toContain("evidence:x402-payment-required");
    expect(JSON.stringify(runtime)).not.toContain("PAYMENT-SIGNATURE");
    expect(JSON.stringify(runtime)).not.toContain("PaymentPayload");
    expect(await recordCount(fixture.store, "policy_decision")).toBe(0);
    expect(await recordCount(fixture.store, "greenlight")).toBe(0);
    expect(await recordCount(fixture.store, "gateway_check_attempt")).toBe(0);
    expect(await recordCount(fixture.store, "mutation_attempt")).toBe(0);

    const contractEvidence = await runtimeClient.getContractEvidenceProjection(
      contract.actionContractId,
      "runtime_evidence",
    );
    expect(contractEvidence.actionClass).toBe("x402_payment.exact");
    expect(JSON.stringify(contractEvidence)).not.toContain("secretref:x402-wallet-gateway");
    await expectRuntimeCannotUseAuthority(runtimeClient, contract.actionContractId, x402.records.toolCapability);

    const policy = await fixture.kernel.evaluatePolicy({
      actionContractId: contract.actionContractId,
      envelopeId: x402.records.operatingEnvelope.envelopeId,
      signingSecret: "test-secret",
    });
    expect(policy.greenlight).not.toBeNull();
    if (!policy.greenlight) throw new Error("expected x402 greenlight");

    const surface = fakeSigningSurface("succeeded");
    const gatewayResult = await runX402WalletGateway({
      protocol: fixture.kernel,
      surface,
      actionContractId: contract.actionContractId,
      greenlightId: policy.greenlight.greenlightId,
      observedParameters: contract.parameters as X402PaymentParameters,
      surfaceOperationRef: "surface-op:aps-x402-payment",
    });

    expect(gatewayResult.outcome).toBe("payment_signature_reconciled");
    expect(surface.signatureCount()).toBe(1);
    expect(gatewayResult.gatewayCheck.gateAttempt.gateDecision).toBe("passed");
    expect(gatewayResult.signatureEvidence).toMatchObject({
      paymentSignatureHeaderName: "PAYMENT-SIGNATURE",
      paymentPayloadShape: "local_fixture_payment_signature",
      credentialMaterialPosture: "local_fixture",
    });
    expect(gatewayResult.signatureEvidence?.paymentSignatureHeaderRef).toStartWith(
      "credential:x402-local-fixture-signature:",
    );

    const envelope = await client.getAgentTransactionEnvelopeProjection(contract.actionContractId, "runtime_evidence");
    expect(envelope.actionClass).toBe("x402_payment.exact");
    expect(envelope.gatewayAdmissionStatus).toBe("admitted");
    expect(envelope.downstreamOutcomeStatus).toBe("pending");
    expect(envelope.redactionProfileRef).toBe("agent-transaction-envelope:v0.2-redacted");
    expect(envelope.omittedFields).toContain("actionContract.parameters");
    expect(envelope.policyDecisionRef).toBe(policy.decision.policyDecisionId);
    expect(envelope.greenlightRef).toBe(policy.greenlight.greenlightId);
    expect(envelope.gateAttemptRef).toBe(gatewayResult.gatewayCheck.gateAttempt.gateAttemptId);
    expect(gatewayResult.gatewayCheck.mutationAttempt).not.toBeNull();
    if (!gatewayResult.gatewayCheck.mutationAttempt) throw new Error("expected x402 mutation attempt");
    expect(envelope.mutationAttemptRef).toBe(gatewayResult.gatewayCheck.mutationAttempt.mutationAttemptId);
    expect(envelope.idempotencyLedgerState).toBe("terminal_succeeded");
    expect(envelope.receiptRef).toBe(gatewayResult.gatewayCheck.receipt.receiptId);
    expect(envelope.refusalRefs).toEqual([]);
    expect(envelope.proofGapRefs).toEqual([]);
    expect(envelope.recoveryRefs).toEqual([]);
    expect(envelope.isolationRefs).toEqual([]);
    expect(envelope.authorityCertificateRefs).toEqual([]);
    expect(JSON.stringify(envelope)).not.toContain("PAYMENT-SIGNATURE:fake:");
    expect(JSON.stringify(envelope)).not.toContain("secretref:x402-wallet-gateway");

    const signers = await fixtureEd25519Signers();
    const certificate = await fixture.kernel.createAuthorityCertificate({
      terminalObjectRef: `receipt:${gatewayResult.gatewayCheck.receipt.receiptId}`,
      signers: signerInputs(signers),
    });
    const verification = await verifyAuthorityCertificate(certificate, trustMaterial(signers));
    expect(certificate.terminal.terminalKind).toBe("receipt");
    expect(certificate.envelope.actionClass).toBe("x402_payment.exact");
    expect(verification.outcome).toBe("verified");
    expect(projectX402AuthorityCertificateEvidenceProfile(verification)).toMatchObject({
      evidenceProfile: "x402_exact_per_call",
      actionClass: "x402_payment.exact",
      actionContractRef: contract.actionContractId,
      gatewayAdmissionStatus: "admitted",
      downstreamOutcomeStatus: "pending",
      exactPerCallProtectedAction: true,
      gatewayCheckEvidenceRef: `gateway_check_attempt:${gatewayResult.gatewayCheck.gateAttempt.gateAttemptId}`,
      receiptRef: gatewayResult.gatewayCheck.receipt.receiptId,
      provesPaymentSuccess: false,
      provesSettlementFinality: false,
      provesFacilitatorOperation: false,
      provesProviderCustody: false,
      managesPayment: false,
    });
    const certifiedEnvelope = await client.getAgentTransactionEnvelopeProjection(
      contract.actionContractId,
      "runtime_evidence",
    );
    expect(certifiedEnvelope.authorityCertificateRefs).toContain(certificate.authorityCertificateId);
    expect(certifiedEnvelope.gatewayAdmissionStatus).toBe("admitted");
    expect(certifiedEnvelope.downstreamOutcomeStatus).toBe("pending");
    expect(JSON.stringify(certifiedEnvelope)).not.toContain("PAYMENT-SIGNATURE:fake:");
    expect(JSON.stringify(certifiedEnvelope)).not.toContain("secretref:x402-wallet-gateway");
  });

  it("keeps x402 hostile branches as refusal or proof-gap evidence instead of authority", async () => {
    const rawBypassFixture = makeKernelFixture();
    const rawBypassX402 = await installX402ProofProfile(rawBypassFixture);
    const rawBypass = await proposeRuntimeIngressActionContracts(
      rawBypassFixture.kernel,
      { x402Payment: rawBypassX402.runtimeConfig },
      {
        principalIntentRef: "intent:pay with raw x402 wrapper",
        generatedCodeOrSpecRef: "runtime:aps-x402-raw-bypass",
        dispatchBoundaryRef: "runtime-adapter:aps-x402-raw",
        dispatches: [
          {
            dispatchKind: "raw_sibling_x402_payment",
            dispatchRef: "dispatch:aps-x402-raw",
            rawCommandRef: "shell:x402-fetch",
            rawCommandSummary: ["x402-fetch", rawBypassX402.proposal.endpointEvidence.endpointUrl],
            endpointUrl: rawBypassX402.proposal.endpointEvidence.endpointUrl,
            payee: rawBypassX402.proposal.endpointEvidence.payee,
            network: rawBypassX402.proposal.endpointEvidence.network,
            token: rawBypassX402.proposal.endpointEvidence.token,
            atomicAmount: "2500",
            paymentRequirementsDigest: rawBypassX402.proposal.endpointEvidence.paymentRequirementsDigest,
          },
        ],
      },
    );
    expect(rawBypass.outcome).toBe("one_or_more_dispatches_refused");
    expect(rawBypass.generatedExecutionGraph.coverageStatus).toBe("contains_bypass_risk");
    expect(await recordCount(rawBypassFixture.store, "action_contract")).toBe(0);
    expect(await recordCount(rawBypassFixture.store, "greenlight")).toBe(0);
    expect(await recordCount(rawBypassFixture.store, "gateway_check_attempt")).toBe(0);
    expect(await recordCount(rawBypassFixture.store, "mutation_attempt")).toBe(0);

    const mismatch = await greenlitX402Contract();
    const mismatchSurface = fakeSigningSurface("succeeded");
    const mismatchResult = await runX402WalletGateway({
      protocol: mismatch.fixture.kernel,
      surface: mismatchSurface,
      actionContractId: mismatch.contract.actionContractId,
      greenlightId: mismatch.greenlight.greenlightId,
      observedParameters: {
        ...(mismatch.contract.parameters as X402PaymentParameters),
        atomicAmount: "2501",
      },
      surfaceOperationRef: "surface-op:aps-x402-mismatch",
    });
    expect(mismatchResult.outcome).toBe("gateway_check_refused");
    expect(mismatchSurface.signatureCount()).toBe(0);
    const mismatchEnvelope = await httpClientForStore(mismatch.fixture.store).getAgentTransactionEnvelopeProjection(
      mismatch.contract.actionContractId,
      "runtime_evidence",
    );
    expect(mismatchEnvelope.gatewayAdmissionStatus).toBe("refused");
    expect(mismatchEnvelope.downstreamOutcomeStatus).toBe("not_started");
    expect(mismatchEnvelope.refusalReasonCodes).toContain("params_mismatch");
    expect(mismatchEnvelope.mutationAttemptRef).toBeNull();

    const replay = await greenlitX402Contract();
    const replaySurface = fakeSigningSurface("succeeded");
    const first = await runX402WalletGateway({
      protocol: replay.fixture.kernel,
      surface: replaySurface,
      actionContractId: replay.contract.actionContractId,
      greenlightId: replay.greenlight.greenlightId,
      observedParameters: replay.contract.parameters as X402PaymentParameters,
      surfaceOperationRef: "surface-op:aps-x402-replay-first",
    });
    const second = await runX402WalletGateway({
      protocol: replay.fixture.kernel,
      surface: replaySurface,
      actionContractId: replay.contract.actionContractId,
      greenlightId: replay.greenlight.greenlightId,
      observedParameters: replay.contract.parameters as X402PaymentParameters,
      surfaceOperationRef: "surface-op:aps-x402-replay-second",
    });
    expect(first.outcome).toBe("payment_signature_reconciled");
    expect(second.outcome).toBe("gateway_check_refused");
    expect(replaySurface.signatureCount()).toBe(1);
    const replayEnvelope = await httpClientForStore(replay.fixture.store).getAgentTransactionEnvelopeProjection(
      replay.contract.actionContractId,
      "runtime_evidence",
    );
    expect(replayEnvelope.gatewayAdmissionStatus).toBe("replayed");
    expect(replayEnvelope.greenlightConsumptionStatus).toBe("replayed");
    expect(replayEnvelope.refusalReasonCodes).toContain("already_consumed");

    const proofGap = await greenlitX402Contract();
    const proofGapResult = await runX402WalletGateway({
      protocol: proofGap.fixture.kernel,
      surface: fakeSigningSurface("unknown"),
      actionContractId: proofGap.contract.actionContractId,
      greenlightId: proofGap.greenlight.greenlightId,
      observedParameters: proofGap.contract.parameters as X402PaymentParameters,
      surfaceOperationRef: "surface-op:aps-x402-proof-gap",
    });
    expect(proofGapResult.outcome).toBe("payment_signature_proof_gap");
    const proofGapEnvelope = await httpClientForStore(proofGap.fixture.store).getAgentTransactionEnvelopeProjection(
      proofGap.contract.actionContractId,
      "runtime_evidence",
    );
    expect(proofGapEnvelope.gatewayAdmissionStatus).toBe("admitted");
    expect(proofGapEnvelope.proofGapRefs).toHaveLength(1);
    expect(proofGapEnvelope.proofGapReasonCodes).toContain("orphan_mitigation_required");
    expect(proofGapEnvelope.idempotencyLedgerState).toBe("terminal_unknown");
  });

  it("keeps the envelope projection adapter-shaped by passing package install through the same spine", async () => {
    const fixture = makeKernelFixture();
    await registerFixtureObjects(fixture);
    const surface = await createPackageManifestSurface("handshake-aps-package-");

    const runtime = await proposeRuntimeIngressActionContracts(
      fixture.kernel,
      { packageInstall: packageInstallRuntimeConfig(fixture) },
      {
        principalIntentRef: "intent:install hono as generated agent code",
        generatedCodeOrSpecRef: "runtime:aps-package-dispatch-block",
        dispatchBoundaryRef: "runtime-adapter:aps-package",
        dispatches: [
          {
            dispatchKind: "wrapped_package_install",
            dispatchRef: "dispatch:aps-package-install:1",
            package: "hono",
            versionRange: "^4.12.19",
          },
        ],
      },
    );
    expect(runtime.outcome).toBe("action_contracts_proposed");
    const proposed = runtime.proposals[0];
    if (!proposed || proposed.outcome !== "action_contract_proposed") throw new Error("expected package contract");
    expect(proposed.actionContract.actionClass).toBe("package.install");
    expect(proposed.actionContract.parameters).toMatchObject({
      package: "hono",
      versionRange: "^4.12.19",
      resolvedMaterialDigest: null,
      resolvedMaterialEvidenceRefs: [],
    });

    const policy = await fixture.kernel.evaluatePolicy({
      actionContractId: proposed.actionContract.actionContractId,
      envelopeId: fixture.envelope.envelopeId,
      signingSecret: "test-secret",
    });
    if (!policy.greenlight) throw new Error("expected package greenlight");
    const gatewayResult = await runPackageInstallGateway({
      protocol: fixture.kernel,
      surface,
      actionContractId: proposed.actionContract.actionContractId,
      greenlightId: policy.greenlight.greenlightId,
      observedParameters: packageInstallObservedParameters(),
      surfaceOperationRef: "surface-op:aps-package-install",
    });
    expect(gatewayResult.outcome).toBe("mutation_reconciled");
    expect(gatewayResult.gatewayCheck.gateAttempt.gateDecision).toBe("passed");
    expect(gatewayResult.gatewayCheck.mutationAttempt).not.toBeNull();
    if (!gatewayResult.gatewayCheck.mutationAttempt) throw new Error("expected package mutation attempt");

    const envelope = await httpClientForStore(fixture.store).getAgentTransactionEnvelopeProjection(
      proposed.actionContract.actionContractId,
      "runtime_evidence",
    );
    expect(envelope.actionClass).toBe("package.install");
    expect(envelope.protectedSurfaceKind).toBe("package_manager");
    expect(envelope.policyDecisionRef).toBe(policy.decision.policyDecisionId);
    expect(envelope.greenlightRef).toBe(policy.greenlight.greenlightId);
    expect(envelope.gateAttemptRef).toBe(gatewayResult.gatewayCheck.gateAttempt.gateAttemptId);
    expect(envelope.mutationAttemptRef).toBe(gatewayResult.gatewayCheck.mutationAttempt.mutationAttemptId);
    expect(envelope.receiptRef).toBe(gatewayResult.gatewayCheck.receipt.receiptId);
    expect(envelope.gatewayAdmissionStatus).toBe("admitted");
    expect(envelope.idempotencyLedgerState).toBe("terminal_succeeded");
    expect(envelope.redactionProfileRef).toBe("agent-transaction-envelope:v0.2-redacted");
    expect(envelope.omittedFields).toContain("actionContract.parameters");
    expect(envelope.nonSecretParamsSummary).toMatchObject({
      package: "hono",
      resolvedMaterialDigest: null,
      resolvedMaterialEvidenceRefs: [],
    });
    expect(envelope.refusalRefs).toEqual([]);
    expect(envelope.proofGapRefs).toEqual([]);
    expect(envelope.authorityCertificateRefs).toEqual([]);
    expect(envelope.envelopeDigest).toMatch(/^sha256:/);
  });
});

async function greenlitX402Contract() {
  const fixture = makeKernelFixture();
  const x402 = await installX402ProofProfile(fixture);
  await recordGatewayCheckedX402Posture(fixture, x402.proposal, x402.records);
  const runtime = await proposeRuntimeIngressActionContracts(
    fixture.kernel,
    { x402Payment: x402.runtimeConfig },
    {
      principalIntentRef: "intent:fetch paid context as generated agent code",
      generatedCodeOrSpecRef: "runtime:aps-x402-greenlit",
      dispatchBoundaryRef: "runtime-adapter:aps-x402-greenlit",
      dispatches: [
        {
          dispatchKind: "wrapped_x402_payment",
          dispatchRef: "dispatch:aps-x402-greenlit:1",
          endpointUrl: x402.proposal.endpointEvidence.endpointUrl,
          payee: x402.proposal.endpointEvidence.payee,
          network: x402.proposal.endpointEvidence.network,
          token: x402.proposal.endpointEvidence.token,
          atomicAmount: "2500",
          paymentRequirementsDigest: x402.proposal.endpointEvidence.paymentRequirementsDigest,
          paymentRequiredEvidenceRef: "evidence:x402-payment-required",
          ...localX402PaymentAttemptBindings(),
        },
      ],
    },
  );
  const proposed = runtime.proposals[0];
  if (!proposed || proposed.outcome !== "action_contract_proposed") throw new Error("expected x402 contract");
  const policy = await fixture.kernel.evaluatePolicy({
    actionContractId: proposed.actionContract.actionContractId,
    envelopeId: x402.records.operatingEnvelope.envelopeId,
    signingSecret: "test-secret",
  });
  if (!policy.greenlight) throw new Error("expected x402 greenlight");
  return { fixture, contract: proposed.actionContract, greenlight: policy.greenlight };
}

async function installX402ProofProfile(fixture: ReturnType<typeof makeKernelFixture>) {
  const proposal = await compileX402InstallProposal(validX402InstallInput());
  const records = requireX402Records(proposal);
  await fixture.kernel.putCatalogObject({ objectType: "tool_capability", payload: records.toolCapability });
  await fixture.kernel.putCatalogObject({ objectType: "action_type", payload: records.actionType });
  await fixture.kernel.putCatalogObject({
    objectType: "gateway_registry_entry",
    payload: requireInstallProposalGatewayRegistryEntry(records.gatewayRegistryEntry),
  });
  await fixture.kernel.putCatalogObject({ objectType: "operating_envelope", payload: records.operatingEnvelope });
  const credentialRef = await registerX402WalletCredentialRef(fixture, proposal, records);
  const authorityRef = await registerX402DelegatedAuthorityRef(fixture, proposal, records);
  return {
    proposal,
    records,
    runtimeConfig: {
      tenantId: proposal.tenantId,
      organizationId: proposal.organizationId,
      principalId: records.operatingEnvelope.principalId,
      agentId: records.operatingEnvelope.agentId,
      runId: "run_aps_x402",
      runtimeAdapterId: records.toolCapability.runtimeAdapterId,
      operatingEnvelopeId: records.operatingEnvelope.envelopeId,
      toolCatalogRef: `${records.toolCapability.toolCatalogId}@${records.toolCapability.toolCatalogVersion}`,
      actionCatalogRef: `${records.actionType.actionCatalogId}@${records.actionType.actionCatalogVersion}`,
      gatewayRegistryRef: `gateway_registry@${(requireInstallProposalGatewayRegistryEntry(records.gatewayRegistryEntry)).gatewayRegistryVersion}`,
      gatewayReadinessRef: "handshake://local/x402/gateway-readiness.json",
      gatewayReadinessDigest: x402Digest,
      policyVersionRef: `${proposal.policyPackRef}@${proposal.policyPackVersion}`,
      policyVersionDigest: x402Digest,
      toolCapabilityId: records.toolCapability.toolCapabilityId,
      actionTypeId: records.actionType.actionTypeId,
      gatewayRegistryEntryId: (requireInstallProposalGatewayRegistryEntry(records.gatewayRegistryEntry)).gatewayRegistryEntryId,
      gatewayId: (requireInstallProposalGatewayRegistryEntry(records.gatewayRegistryEntry)).gatewayId,
      gatewayCredentialBinding: x402WalletGatewayCredentialBindingFor(credentialRef),
      delegatedAuthorityBinding: x402DelegatedSpendAuthorityBindingFor(authorityRef),
      maxAtomicAmountPerCall: proposal.spendBounds.maxAtomicAmountPerCall,
      contractExpiresAt: futureIso(),
      signingSecret: "test-secret",
    },
  };
}

async function recordGatewayCheckedX402Posture(
  fixture: ReturnType<typeof makeKernelFixture>,
  proposal: X402InstallProposal,
  records: NonNullable<X402InstallProposal["compiledRecords"]>,
): Promise<void> {
  const probes = await runBypassProbeExecutors(
    fixture.kernel,
    {
      tenantId: proposal.tenantId,
      organizationId: proposal.organizationId,
      runtimeAdapterId: records.toolCapability.runtimeAdapterId,
      gatewayId: (requireInstallProposalGatewayRegistryEntry(records.gatewayRegistryEntry)).gatewayId,
      actionClass: "x402_payment.exact",
      resourceRef: proposal.resourceRef,
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
  await fixture.kernel.createProtectedPathPosture({
    tenantId: proposal.tenantId,
    organizationId: proposal.organizationId,
    runtimeAdapterId: records.toolCapability.runtimeAdapterId,
    gatewayId: (requireInstallProposalGatewayRegistryEntry(records.gatewayRegistryEntry)).gatewayId,
    actionClass: "x402_payment.exact",
    resourceRef: proposal.resourceRef,
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

async function registerX402WalletCredentialRef(
  fixture: ReturnType<typeof makeKernelFixture>,
  proposal: X402InstallProposal,
  records: NonNullable<X402InstallProposal["compiledRecords"]>,
): Promise<GatewayCredentialRef> {
  const credentialRef = await fixture.kernel.registerGatewayCredentialRef(
    await buildX402WalletGatewayCredentialRefInput(proposal, records),
  );
  x402CredentialRefs.set(proposal, credentialRef);
  return credentialRef;
}

async function registerX402DelegatedAuthorityRef(
  fixture: ReturnType<typeof makeKernelFixture>,
  proposal: X402InstallProposal,
  records: NonNullable<X402InstallProposal["compiledRecords"]>,
): Promise<DelegatedAuthorityRef> {
  const authorityRef = await fixture.kernel.registerDelegatedAuthorityRef(
    await buildX402DelegatedSpendAuthorityRefInput(proposal, records),
  );
  x402AuthorityRefs.set(proposal, authorityRef);
  return authorityRef;
}

async function expectRuntimeCannotUseAuthority(
  runtimeClient: HandshakeClient,
  actionContractId: string,
  toolCapability: Awaited<ReturnType<typeof installX402ProofProfile>>["records"]["toolCapability"],
): Promise<void> {
  await expect(runtimeClient.registerToolCapability(toolCapability)).rejects.toMatchObject({
    status: 401,
    code: "caller_auth_required",
  });
  await expect(
    runtimeClient.evaluatePolicy({ actionContractId, envelopeId: "env_x402_payment" }),
  ).rejects.toMatchObject({
    status: 401,
    code: "caller_auth_required",
  });
  await expect(
    runtimeClient.gatewayCheck({ actionContractId, greenlightId: "grn_runtime_escape", observedParameters: {} }),
  ).rejects.toMatchObject({
    status: 401,
    code: "caller_auth_required",
  });
  await expect(
    runtimeClient.createReceiptExport({ receiptId: "rcp_runtime_escape", requestedByRef: "runtime:agent" }),
  ).rejects.toMatchObject({
    status: 401,
    code: "caller_auth_required",
  });
}

function fakeSigningSurface(downstreamPaymentStatus: "succeeded" | "unknown") {
  let signatures = 0;
  return {
    signatureCount: () => signatures,
    async signPayment(command: {
      verifiedGate: { gateAttemptId: string; surfaceOperationRef: string };
      parameters: X402PaymentParameters;
    }) {
      signatures += 1;
      const paymentSignature = `PAYMENT-SIGNATURE:fake:${command.verifiedGate.gateAttemptId}:${command.parameters.paymentRequirementsDigest.slice(
        "sha256:".length,
        "sha256:".length + 16,
      )}`;
      const paymentSignatureDigest = await digestCanonical({ paymentSignature });
      return {
        evidenceRef: `evidence:x402-payment-signature:${command.verifiedGate.gateAttemptId}`,
        surfaceOperationRef: command.verifiedGate.surfaceOperationRef,
        paymentSignatureHeaderName: "PAYMENT-SIGNATURE" as const,
        paymentSignatureHeaderRef: `credential:x402-local-fixture-signature:${command.verifiedGate.gateAttemptId}`,
        paymentSignatureDigest,
        paymentPayloadShape: "local_fixture_payment_signature" as const,
        credentialMaterialPosture: "local_fixture" as const,
        downstreamPaymentStatus,
        paymentResponseEvidenceRef:
          downstreamPaymentStatus === "succeeded"
            ? `evidence:x402-payment-response:${command.verifiedGate.gateAttemptId}`
            : null,
        providerRequestRef: `provider-request:x402:${command.verifiedGate.gateAttemptId}`,
        providerOperationRef: `provider-operation:x402:${command.verifiedGate.gateAttemptId}`,
      };
    },
  };
}

function httpClientForStore(store: ProtocolStore, transitionTokens: CallerAuthTokens = tokens): HandshakeClient {
  const app = createApp({ store });
  const env = {
    HANDSHAKE_CONTROL_PLANE_TOKEN: tokens.control_plane,
    HANDSHAKE_RUNTIME_EVIDENCE_TOKEN: tokens.runtime_evidence,
    HANDSHAKE_GATEWAY_CUSTODY_TOKEN: tokens.gateway_custody,
    HANDSHAKE_REVIEW_CUSTODY_TOKEN: tokens.review_custody,
  } satisfies WorkerBindings;
  const fetchImpl: HandshakeFetch = async (input, init) => app.request(requestPath(input), init, env);
  return new HandshakeClient("http://handshake.test", fetchImpl, {
    transitionTokens,
    requestIdentityFactory: () => "aps-product-proof-request",
  });
}

function requestPath(input: Parameters<typeof fetch>[0]): string {
  const rawUrl = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
  const url = new URL(rawUrl, "http://handshake.test");
  return `${url.pathname}${url.search}`;
}

async function recordCount(store: ProtocolStore, objectType: Parameters<ProtocolStore["listRecordsByType"]>[0]) {
  return (await store.listRecordsByType(objectType)).length;
}

function requireX402Records(proposal: X402InstallProposal): NonNullable<X402InstallProposal["compiledRecords"]> {
  if (!proposal.compiledRecords) throw new Error("expected installable x402 proposal");
  return proposal.compiledRecords;
}

function validX402InstallInput(): X402InstallProposalInput {
  const createdAt = nowIso();
  return {
    tenantId: "tenant_demo",
    organizationId: "org_demo",
    createdAt,
    endpointEvidence: {
      endpointUrl: "https://api.example.com/mcp/premium-context",
      payee: "0xpayee",
      network: "base-sepolia",
      token: "USDC",
      maxAtomicAmount: "2500",
      paymentRequirementsDigest: x402Digest,
      facilitatorRef: "facilitator:local",
      evidenceRefs: ["evidence:x402-payment-required"],
    },
    walletGatewayProfile: {
      walletGatewayId: "wallet_gateway_local",
      gatewayId: "gateway_x402_wallet",
      signerCustodyStatus: "gateway_held",
      signerRef: "secretref:x402-wallet-gateway",
      authorityHolderRef: "gateway-authority:x402-wallet",
      supportedNetworks: ["base-sepolia"],
      supportedTokens: ["USDC"],
    },
    spendBounds: {
      principalId: "principal_demo",
      agentId: "agent_demo",
      runtimeAdapterId: "runtime_codex",
      objectiveRef: "intent:fetch paid context",
      allowedDomains: ["api.example.com"],
      allowedPayees: ["0xpayee"],
      allowedNetworks: ["base-sepolia"],
      allowedTokens: ["USDC"],
      maxAtomicAmountPerCall: "2500",
      maxAtomicAmountPerSession: "10000",
      maxAtomicAmountPerDay: "20000",
      reviewThresholdAtomicAmount: "5000",
      spendWindowEnforcementStatus: "not_enforced_local_metadata",
      issuedAt: createdAt,
      expiresAt: futureIso(),
    },
  };
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
