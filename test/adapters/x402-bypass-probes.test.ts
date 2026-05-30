import { describe, expect, it } from "bun:test";
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
import { proposeX402PaymentActionContract } from "../../src/adapters/x402-payment/action-proposal";
import {
  x402PaymentHostileBypassProbeExecutors,
  type X402PaymentHostileProbeSurface,
} from "../../src/adapters/x402-payment/bypass-probes";
import {
  fixtureGatewayCheckedBypassProbeExecutors,
  runBypassProbeExecutors,
  type BypassProbeExecutionScope,
} from "../../src/adapters/protected-path-probes";
import type { BypassProbe } from "../../src/protocol/areas/bypass-probe";
import type { GatewayCredentialRef } from "../../src/protocol/areas/credential-custody";
import type { DelegatedAuthorityRef } from "../../src/protocol/areas/delegated-authority";
import { gateRefusalReason } from "../../src/protocol/areas/gateway-gate/gateway-policy";
import { idempotencyLedgerKey, idempotencyLedgerKeyDigest } from "../../src/protocol/areas/idempotency-ledger";
import type { X402PaymentConformancePosture } from "../../src/adapters/x402-payment/conformance";
import { HandshakeKernel } from "../../src/protocol/kernel";
import { nowIso } from "../../src/protocol/foundation/ids";
import { InMemoryProtocolStore } from "../../src/storage/memory";
import { futureIso } from "../support/fixtures";
import { localX402PaymentAttemptBindings } from "../support/install-proposal-helpers";

const digest = `sha256:${"e".repeat(64)}` as const;
const x402CredentialRefs = new WeakMap<X402InstallProposal, GatewayCredentialRef>();
const x402AuthorityRefs = new WeakMap<X402InstallProposal, DelegatedAuthorityRef>();

describe("x402 hostile bypass probe executors", () => {
  it("lets x402 policy greenlight only after gateway-owned hostile probes pass", async () => {
    const fixture = await createX402PolicyFixture("gateway_held");
    const probes = await runX402HostileProbes(fixture, safePosture());
    await recordX402Posture(fixture, probes, "gateway_held", "gateway_probe");

    const policy = await fixture.kernel.evaluatePolicy({
      actionContractId: fixture.actionContract.actionContractId,
      envelopeId: fixture.records.operatingEnvelope.envelopeId,
      signingSecret: "test-secret",
    });

    expect(policy.decision.decision).toBe("greenlight");
    expect(policy.greenlight?.protectedPathPostureId).toBeDefined();
    expect(policy.greenlight).toMatchObject({
      gatewayRegistryDigest: fixture.actionContract.gatewayRegistryDigest,
      gatewayPolicyVersion: fixture.actionContract.gatewayPolicyVersion,
      policyVersionRef: fixture.actionContract.parameters.policyVersionRef,
      policyVersionDigest: fixture.actionContract.parameters.policyVersionDigest,
      gatewayReadinessRef: fixture.actionContract.parameters.gatewayReadinessRef,
      gatewayReadinessDigest: fixture.actionContract.parameters.gatewayReadinessDigest,
      gatewayCredentialRefIds: fixture.actionContract.gatewayCredentialRefs.map((ref) => ref.gatewayCredentialRefId),
      gatewayCredentialRefDigests: fixture.actionContract.gatewayCredentialRefs.map(
        (ref) => ref.gatewayCredentialRefDigest,
      ),
      delegatedAuthorityRefIds: fixture.actionContract.delegatedAuthorityRefs.map((ref) => ref.delegatedAuthorityRefId),
      delegatedAuthorityRefDigests: fixture.actionContract.delegatedAuthorityRefs.map(
        (ref) => ref.delegatedAuthorityRefDigest,
      ),
      idempotencyKey: fixture.actionContract.idempotencyKey,
      idempotencyLedgerKeyDigest: await idempotencyLedgerKeyDigest(idempotencyLedgerKey(fixture.actionContract)),
      maxUses: 1,
    });

    const driftedReadinessRefusal = gateRefusalReason(
      fixture.actionContract,
      { ...policy.greenlight!, gatewayReadinessDigest: `sha256:${"f".repeat(64)}` },
      fixture.actionContract.paramsDigest,
      await idempotencyLedgerKeyDigest(idempotencyLedgerKey(fixture.actionContract)),
      [],
      nowIso(),
      null,
      null,
      null,
      null,
      null,
    );
    expect(driftedReadinessRefusal).toBe("greenlight_readiness_digest_mismatch");
  });

  it("records policy proof gaps instead of greenlights when x402 exact bindings are missing", async () => {
    const fixture = await createX402PolicyFixture("gateway_held");
    const probes = await runX402HostileProbes(fixture, safePosture());
    await recordX402Posture(fixture, probes, "gateway_held", "gateway_probe");
    const malformed = await proposeMalformedX402Contract(fixture, ["gatewayReadinessRef", "gatewayReadinessDigest"]);

    const policy = await fixture.kernel.evaluatePolicy({
      actionContractId: malformed.actionContractId,
      envelopeId: fixture.records.operatingEnvelope.envelopeId,
      signingSecret: "test-secret",
    });

    expect(policy).toMatchObject({
      authorityCreated: false,
      greenlight: null,
      proofGapReasonCode: "protected_action_policy_readiness_binding_missing",
      refusalReasonCode: null,
      nextAction: "read_evidence",
    });
    expect(policy.decision).toMatchObject({
      decision: "proof_gap",
      decisionReasonCode: "protected_action_policy_readiness_binding_missing",
    });
    expect(policy.proofGapRef).toMatch(/^gap_/);
  });

  it("records failed hostile probes when raw x402 bypass paths remain reachable", async () => {
    const fixture = await createX402PolicyFixture("gateway_held");
    const probes = await runX402HostileProbes(fixture, {
      ...safePosture(),
      rawPrivateKeyEnvStatus: "present",
      mcpDirectPaymentStatus: "present",
    });
    await recordX402Posture(fixture, probes, "gateway_held", "gateway_probe");

    const failedProbeKinds = probes
      .filter((probe) => probe.probeOutcome === "failed")
      .map((probe) => probe.probeKind)
      .sort();
    expect(failedProbeKinds).toEqual(["mcp_direct_call_blocking", "raw_sibling_blocking"]);

    const policy = await fixture.kernel.evaluatePolicy({
      actionContractId: fixture.actionContract.actionContractId,
      envelopeId: fixture.records.operatingEnvelope.envelopeId,
      signingSecret: "test-secret",
    });

    expect(policy.decision.decision).toBe("refuse");
    expect(policy.decision.decisionReasonCode).toBe("protected_path_probe_failed");
    expect(policy.greenlight).toBeNull();
  });

  it("records official SDK signer side channels as raw sibling bypass evidence", async () => {
    const fixture = await createX402PolicyFixture("gateway_held");
    const probes = await runX402HostileProbes(fixture, {
      ...safePosture(),
      rawPrivateKeyEnvStatus: "present",
      directCoreClientSigningStatus: "present",
      directX402ClientStatus: "present",
      paidFetchClientStatus: "present",
      packageScriptPaymentStatus: "present",
      browserSidePaymentStatus: "present",
      rawNetworkPaymentStatus: "present",
      rawPaymentSignatureHeaderStatus: "present",
      rawPaymentSignatureInjectionStatus: "present",
      siblingX402WrapperStatus: "present",
    });
    await recordX402Posture(fixture, probes, "gateway_held", "gateway_probe");

    const rawSiblingProbe = probes.find((probe) => probe.probeKind === "raw_sibling_blocking");
    expect(rawSiblingProbe?.probeOutcome).toBe("failed");
    expect(rawSiblingProbe?.evidenceRefs.sort()).toEqual([
      "evidence:x402-hostile-probe:raw_sibling_blocking:browser_side_payment_present_reachable",
      "evidence:x402-hostile-probe:raw_sibling_blocking:direct_core_client_signing_present_reachable",
      "evidence:x402-hostile-probe:raw_sibling_blocking:direct_x402_client_present_reachable",
      "evidence:x402-hostile-probe:raw_sibling_blocking:package_script_payment_present_reachable",
      "evidence:x402-hostile-probe:raw_sibling_blocking:paid_fetch_client_present_reachable",
      "evidence:x402-hostile-probe:raw_sibling_blocking:raw_network_payment_present_reachable",
      "evidence:x402-hostile-probe:raw_sibling_blocking:raw_payment_signature_header_present_reachable",
      "evidence:x402-hostile-probe:raw_sibling_blocking:raw_payment_signature_injection_present_reachable",
      "evidence:x402-hostile-probe:raw_sibling_blocking:raw_private_key_env_present_reachable",
      "evidence:x402-hostile-probe:raw_sibling_blocking:sibling_x402_wrapper_present_reachable",
    ]);

    const policy = await fixture.kernel.evaluatePolicy({
      actionContractId: fixture.actionContract.actionContractId,
      envelopeId: fixture.records.operatingEnvelope.envelopeId,
      signingSecret: "test-secret",
    });

    expect(policy.decision.decision).toBe("refuse");
    expect(policy.decision.decisionReasonCode).toBe("protected_path_probe_failed");
    expect(policy.greenlight).toBeNull();
  });

  it("records direct payment, token passthrough, wrapper drift, and failure-open probes distinctly", async () => {
    const fixture = await createX402PolicyFixture("gateway_held");
    const probes = await runX402HostileProbes(fixture, {
      ...safePosture(),
      mcpDirectPaymentStatus: "present",
      unmanagedMcpServerStatus: "present",
      unmanagedToolPacketStatus: "present",
      tokenPassthroughStatus: "present",
      wrapperDriftStatus: "present",
      failureClosedStatus: "failed",
    });
    await recordX402Posture(fixture, probes, "gateway_held", "gateway_probe");

    const failedProbeKinds = probes
      .filter((probe) => probe.probeOutcome === "failed")
      .map((probe) => probe.probeKind)
      .sort();
    expect(failedProbeKinds).toEqual([
      "failure_closed",
      "mcp_direct_call_blocking",
      "token_passthrough_blocking",
      "wrapper_drift",
    ]);
    expect(probes.flatMap((probe) => probe.evidenceRefs).sort()).toContain(
      "evidence:x402-hostile-probe:failure_closed:failure_closed_failed",
    );
    expect(probes.flatMap((probe) => probe.evidenceRefs).sort()).toEqual(
      expect.arrayContaining([
        "evidence:x402-hostile-probe:mcp_direct_call_blocking:mcp_direct_payment_present_reachable",
        "evidence:x402-hostile-probe:mcp_direct_call_blocking:unmanaged_mcp_server_present_reachable",
        "evidence:x402-hostile-probe:mcp_direct_call_blocking:unmanaged_tool_packet_present_reachable",
      ]),
    );

    const policy = await fixture.kernel.evaluatePolicy({
      actionContractId: fixture.actionContract.actionContractId,
      envelopeId: fixture.records.operatingEnvelope.envelopeId,
      signingSecret: "test-secret",
    });

    expect(policy.decision.decision).toBe("refuse");
    expect(policy.decision.decisionReasonCode).toBe("protected_path_probe_failed");
    expect(policy.greenlight).toBeNull();
  });

  it("does not let conformance fixture probes manufacture x402 gateway-checked posture", async () => {
    const fixture = await createX402PolicyFixture("gateway_held");
    const probes = await runBypassProbeExecutors(
      fixture.kernel,
      probeScope(fixture),
      fixtureGatewayCheckedBypassProbeExecutors(),
    );
    await recordX402Posture(fixture, probes, "gateway_held", "conformance_fixture");

    expect(new Set(probes.map((probe) => probe.sourceAuthority))).toEqual(new Set(["conformance_fixture"]));

    const policy = await fixture.kernel.evaluatePolicy({
      actionContractId: fixture.actionContract.actionContractId,
      envelopeId: fixture.records.operatingEnvelope.envelopeId,
      signingSecret: "test-secret",
    });

    expect(policy.decision.decision).toBe("refuse");
    expect(policy.decision.decisionReasonCode).toBe("protected_path_source_authority_weak");
    expect(policy.greenlight).toBeNull();
  });

  it("treats fixture wallet custody as non-establishment x402 custody evidence", async () => {
    const fixture = await createX402PolicyFixture("fixture_gateway_held");
    const probes = await runX402HostileProbes(fixture, {
      ...safePosture(),
      signerCustodyStatus: "fixture_gateway_held",
    });

    const custodyProbe = probes.find((probe) => probe.probeKind === "credential_custody");
    expect(custodyProbe?.probeOutcome).toBe("failed");
    expect(custodyProbe?.sourceAuthority).toBe("gateway_probe");
  });
});

async function createX402PolicyFixture(signerCustodyStatus: "gateway_held" | "fixture_gateway_held") {
  const store = new InMemoryProtocolStore();
  const kernel = new HandshakeKernel(store);
  const proposal = await compileX402InstallProposal(validInstallInput(signerCustodyStatus));
  const records = requireCompiledRecords(proposal);
  await kernel.putCatalogObject({ objectType: "tool_capability", payload: records.toolCapability });
  await kernel.putCatalogObject({ objectType: "action_type", payload: records.actionType });
  await kernel.putCatalogObject({
    objectType: "gateway_registry_entry",
    payload: requireInstallProposalGatewayRegistryEntry(records.gatewayRegistryEntry),
  });
  await kernel.putCatalogObject({ objectType: "operating_envelope", payload: records.operatingEnvelope });
  await registerX402WalletCredentialRef(kernel, proposal, records);
  await registerX402DelegatedAuthorityRef(kernel, proposal, records);
  const runtimeResult = await proposeX402PaymentActionContract(kernel, runtimeConfig(proposal, records), {
    principalIntentRef: "intent:fetch paid context",
    generatedCodeOrSpecRef: "code:x402-fetch-wrapper",
    endpointUrl: proposal.endpointEvidence.endpointUrl,
    payee: proposal.endpointEvidence.payee,
    network: proposal.endpointEvidence.network,
    token: proposal.endpointEvidence.token,
    atomicAmount: "2500",
    paymentRequirementsDigest: proposal.endpointEvidence.paymentRequirementsDigest,
    paymentRequiredEvidenceRef: "evidence:x402-payment-required",
    ...localX402PaymentAttemptBindings(),
  });
  if (runtimeResult.outcome !== "action_contract_proposed") throw new Error("expected x402 action contract");
  return { actionContract: runtimeResult.actionContract, kernel, proposal, records, store };
}

async function runX402HostileProbes(
  fixture: Awaited<ReturnType<typeof createX402PolicyFixture>>,
  posture: X402PaymentConformancePosture,
): Promise<BypassProbe[]> {
  const surface: X402PaymentHostileProbeSurface = {
    async readConformancePosture() {
      return posture;
    },
  };
  return runBypassProbeExecutors(fixture.kernel, probeScope(fixture), x402PaymentHostileBypassProbeExecutors(surface));
}

async function recordX402Posture(
  fixture: Awaited<ReturnType<typeof createX402PolicyFixture>>,
  probes: BypassProbe[],
  credentialCustodyStatus: "gateway_held" | "fixture_gateway_held",
  sourceAuthority: "gateway_probe" | "conformance_fixture",
): Promise<void> {
  await fixture.kernel.createProtectedPathPosture({
    tenantId: fixture.proposal.tenantId,
    organizationId: fixture.proposal.organizationId,
    runtimeAdapterId: fixture.records.toolCapability.runtimeAdapterId,
    gatewayId: requireInstallProposalGatewayRegistryEntry(fixture.records.gatewayRegistryEntry).gatewayId,
    actionClass: "x402_payment.exact",
    resourceRef: fixture.proposal.resourceRef,
    protectedSurfaceKind: "x402_payment",
    postureState: "gateway_checked",
    credentialCustodyStatus,
    rawSiblingToolStatus: "blocked",
    sourceAuthority,
    reasonCodes: [sourceAuthority === "gateway_probe" ? "bypass_probe_passed" : "protected_path_source_authority_weak"],
    evidenceRefs: ["evidence:x402-hostile-probes"],
    bypassProbeIds: probes.map((probe) => probe.bypassProbeId),
    expiresAt: futureIso(),
  });
}

async function proposeMalformedX402Contract(
  fixture: Awaited<ReturnType<typeof createX402PolicyFixture>>,
  removedParameterKeys: string[],
) {
  const contract = fixture.actionContract;
  const parameters = { ...contract.parameters };
  for (const key of removedParameterKeys) {
    delete parameters[key];
  }
  const nonSecretParamsSummary = { ...contract.nonSecretParamsSummary };
  for (const key of removedParameterKeys) {
    delete nonSecretParamsSummary[key];
  }
  const compilation = await fixture.kernel.compileIntent({
    tenantId: contract.tenantId,
    organizationId: contract.organizationId,
    principalIntentRef: "intent:malformed x402 policy proof gap",
    principalId: contract.principalId,
    agentId: contract.agentId,
    runId: "run_x402_policy_proof_gap",
    runtimeAdapterId: contract.runtimeAdapterId,
    operatingEnvelopeId: contract.envelopeId,
    toolCatalogRef: `${fixture.records.toolCapability.toolCatalogId}@${fixture.records.toolCapability.toolCatalogVersion}`,
    actionCatalogRef: `${fixture.records.actionType.actionCatalogId}@${fixture.records.actionType.actionCatalogVersion}`,
    gatewayRegistryRef: `gateway_registry@${requireInstallProposalGatewayRegistryEntry(fixture.records.gatewayRegistryEntry).gatewayRegistryVersion}`,
    generatedCodeOrSpecRefs: ["code:x402-malformed-policy-proof-gap"],
    declaredAssumptions: ["test removes trusted readiness binding after generated proposal"],
    requiredEvidenceRefs: contract.evidenceRefs,
    candidate: {
      toolCapabilityId: contract.toolCapabilityId,
      actionTypeId: contract.actionTypeId,
      gatewayRegistryEntryId: contract.gatewayRegistryEntryId,
      actionClass: contract.actionClass,
      gatewayId: contract.gatewayId,
      resourceRef: contract.resourceRef,
      sequenceNumber: contract.sequenceNumber + 1,
      requiredPriorActionContractIds: [],
      recoveryRecommendationId: null,
      parameters,
      nonSecretParamsSummary,
      secretRefs: contract.secretRefs,
      gatewayCredentialRefs: contract.gatewayCredentialRefs,
      delegatedAuthorityRefs: contract.delegatedAuthorityRefs,
      purposeCode: contract.purposeCode,
      expectedSideEffectCodes: contract.expectedSideEffectCodes,
      evidenceRefs: contract.evidenceRefs,
      bounds: contract.bounds,
      idempotencyKey: `${contract.idempotencyKey}-policy-proof-gap`,
      rollbackHint: contract.rollbackHint,
      expiresAt: futureIso(),
    },
  });
  if (!compilation.candidateAction.candidateDigest) throw new Error("expected malformed candidate digest");
  return fixture.kernel.proposeActionContract({
    intentCompilationId: compilation.intentCompilationId,
    candidateActionId: compilation.candidateAction.candidateActionId,
    candidateDigest: compilation.candidateAction.candidateDigest,
    signingSecret: "test-secret",
  });
}

function probeScope(fixture: Awaited<ReturnType<typeof createX402PolicyFixture>>): BypassProbeExecutionScope {
  return {
    tenantId: fixture.proposal.tenantId,
    organizationId: fixture.proposal.organizationId,
    runtimeAdapterId: fixture.records.toolCapability.runtimeAdapterId,
    gatewayId: requireInstallProposalGatewayRegistryEntry(fixture.records.gatewayRegistryEntry).gatewayId,
    actionClass: "x402_payment.exact",
    resourceRef: fixture.proposal.resourceRef,
    protectedSurfaceKind: "x402_payment",
    expiresAt: futureIso(),
  };
}

function safePosture(): X402PaymentConformancePosture {
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
}

function requireCompiledRecords(proposal: X402InstallProposal): NonNullable<X402InstallProposal["compiledRecords"]> {
  if (!proposal.compiledRecords) throw new Error("expected installable x402 proposal");
  return proposal.compiledRecords;
}

function runtimeConfig(proposal: X402InstallProposal, records: NonNullable<X402InstallProposal["compiledRecords"]>) {
  const credentialRef = x402CredentialRefs.get(proposal);
  if (!credentialRef) throw new Error("expected registered x402 wallet credential ref");
  const authorityRef = x402AuthorityRefs.get(proposal);
  if (!authorityRef) throw new Error("expected registered x402 delegated authority ref");
  return {
    tenantId: proposal.tenantId,
    organizationId: proposal.organizationId,
    principalId: records.operatingEnvelope.principalId,
    agentId: records.operatingEnvelope.agentId,
    runId: "run_x402_hostile_probe",
    runtimeAdapterId: records.toolCapability.runtimeAdapterId,
    operatingEnvelopeId: records.operatingEnvelope.envelopeId,
    toolCatalogRef: `${records.toolCapability.toolCatalogId}@${records.toolCapability.toolCatalogVersion}`,
    actionCatalogRef: `${records.actionType.actionCatalogId}@${records.actionType.actionCatalogVersion}`,
    gatewayRegistryRef: `gateway_registry@${requireInstallProposalGatewayRegistryEntry(records.gatewayRegistryEntry).gatewayRegistryVersion}`,
    gatewayReadinessRef: "handshake://local/x402/gateway-readiness.json",
    gatewayReadinessDigest: digest,
    policyVersionRef: `${proposal.policyPackRef}@${proposal.policyPackVersion}`,
    policyVersionDigest: digest,
    toolCapabilityId: records.toolCapability.toolCapabilityId,
    actionTypeId: records.actionType.actionTypeId,
    gatewayRegistryEntryId: requireInstallProposalGatewayRegistryEntry(records.gatewayRegistryEntry)
      .gatewayRegistryEntryId,
    gatewayId: requireInstallProposalGatewayRegistryEntry(records.gatewayRegistryEntry).gatewayId,
    gatewayCredentialBinding: x402WalletGatewayCredentialBindingFor(credentialRef),
    delegatedAuthorityBinding: x402DelegatedSpendAuthorityBindingFor(authorityRef),
    maxAtomicAmountPerCall: proposal.spendBounds.maxAtomicAmountPerCall,
    contractExpiresAt: futureIso(),
    signingSecret: "test-secret",
  };
}

async function registerX402WalletCredentialRef(
  kernel: HandshakeKernel,
  proposal: X402InstallProposal,
  records: NonNullable<X402InstallProposal["compiledRecords"]>,
): Promise<GatewayCredentialRef> {
  const credentialRef = await kernel.registerGatewayCredentialRef(
    await buildX402WalletGatewayCredentialRefInput(proposal, records),
  );
  x402CredentialRefs.set(proposal, credentialRef);
  return credentialRef;
}

async function registerX402DelegatedAuthorityRef(
  kernel: HandshakeKernel,
  proposal: X402InstallProposal,
  records: NonNullable<X402InstallProposal["compiledRecords"]>,
): Promise<DelegatedAuthorityRef> {
  const authorityRef = await kernel.registerDelegatedAuthorityRef(
    await buildX402DelegatedSpendAuthorityRefInput(proposal, records),
  );
  x402AuthorityRefs.set(proposal, authorityRef);
  return authorityRef;
}

function validInstallInput(signerCustodyStatus: "gateway_held" | "fixture_gateway_held"): X402InstallProposalInput {
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
      paymentRequirementsDigest: digest,
      facilitatorRef: "facilitator:local",
      evidenceRefs: ["evidence:x402-payment-required"],
    },
    walletGatewayProfile: {
      walletGatewayId: "wallet_gateway_local",
      gatewayId: "gateway_x402_wallet",
      signerCustodyStatus,
      signerRef: signerCustodyStatus === "gateway_held" ? "secretref:x402-wallet-prod" : "secretref:local-fake-signer",
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
      issuedAt: createdAt,
      expiresAt: futureIso(),
    },
  };
}
