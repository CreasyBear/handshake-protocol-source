import { describe, expect, it } from "bun:test";
import {
  assembleAgentTransactionEnvelope,
  projectAgentTransactionEnvelope,
  projectContractEvidence,
  projectProtectedPathInstallHealth,
  projectReceiptTimeline,
} from "../../src/protocol/evidence-projections";
import type {
  GatewayCredentialRef,
  RegisterGatewayCredentialRefInput,
} from "../../src/protocol/areas/credential-custody";
import {
  idempotencyLedgerKey,
  idempotencyLedgerKeyDigest,
  type IdempotencyLedgerEntry,
} from "../../src/protocol/areas/idempotency-ledger";
import type { ProofGap } from "../../src/protocol/areas/proof-gap";
import type { Refusal } from "../../src/protocol/areas/refusal";
import type {
  ProtocolObjectType,
  ProtocolRecordScope,
  ProtocolStore,
  StoredProtocolRecord,
} from "../../src/protocol/store/port";
import {
  createGreenlitContract,
  futureIso,
  makeKernelFixture,
  makePackageInstallCandidate,
  proposalInputForCompilation,
  registerFixtureObjects,
  recordUnknownDownstreamProofGap,
} from "../support/fixtures";

describe("protocol evidence projections", () => {
  it("carries clearing evidence refs without making them authority", async () => {
    const fixture = await createGreenlitContract();
    const compilation = await fixture.kernel.compileIntent({
      tenantId: "tenant_demo",
      organizationId: "org_demo",
      principalIntentRef: "intent:clearing refs should not widen scope",
      principalId: "principal_demo",
      agentId: "agent_demo",
      runId: "run_demo",
      runtimeAdapterId: "runtime_codex",
      operatingEnvelopeId: fixture.envelope.envelopeId,
      toolCatalogRef: "tool_catalog_demo@v1",
      actionCatalogRef: "action_catalog_demo@v1",
      gatewayRegistryRef: "gateway_registry@v1",
      candidate: makePackageInstallCandidate(fixture, {
        idempotencyKey: "idem_clearing_refs",
        sequenceNumber: 2,
        clearingEvidenceRefs: {
          correlationRef: "plan:upgrade-staging",
          obligationRef: "obligation:outside-envelope",
          counterpartyRef: "counterparty:payment-network",
        },
      }),
    });
    const contract = await fixture.kernel.proposeActionContract(proposalInputForCompilation(compilation));
    const projection = projectContractEvidence(contract);

    expect(contract.clearingEvidenceRefs).toEqual({
      correlationRef: "plan:upgrade-staging",
      obligationRef: "obligation:outside-envelope",
      counterpartyRef: "counterparty:payment-network",
    });
    expect(projection.clearingEvidenceRefs).toEqual(contract.clearingEvidenceRefs);

    const invalid = await fixture.kernel.compileIntent({
      tenantId: "tenant_demo",
      organizationId: "org_demo",
      principalIntentRef: "intent:clearing refs still cannot authorize package outside envelope",
      principalId: "principal_demo",
      agentId: "agent_demo",
      runId: "run_demo",
      runtimeAdapterId: "runtime_codex",
      operatingEnvelopeId: fixture.envelope.envelopeId,
      toolCatalogRef: "tool_catalog_demo@v1",
      actionCatalogRef: "action_catalog_demo@v1",
      gatewayRegistryRef: "gateway_registry@v1",
      candidate: makePackageInstallCandidate(fixture, {
        idempotencyKey: "idem_clearing_refs_invalid",
        sequenceNumber: 3,
        resourceRef: "npm:left-pad",
        clearingEvidenceRefs: { obligationRef: "obligation:install-left-pad" },
      }),
    });

    expect(invalid.candidateAction.candidateStatus).toBe("rejected");
    expect(invalid.overreachReasonCodes).toContain("envelope_resource_not_allowed");
    expect(invalid.candidateAction.clearingEvidenceRefs).toEqual({ obligationRef: "obligation:install-left-pad" });
  });

  it("derives receipt timeline admission and downstream status from receipt truth", async () => {
    const fixture = await createGreenlitContract();
    const gate = await fixture.kernel.gatewayCheck({
      actionContractId: fixture.contract.actionContractId,
      greenlightId: fixture.greenlight.greenlightId,
      observedParameters: fixture.contract.parameters,
      surfaceOperationRef: "surface-op:projection-status",
    });
    const timeline = projectReceiptTimeline({
      receipt: gate.receipt,
      events: [],
      missingEventCount: 0,
      reconciliations: [],
    });

    expect(gate.receipt.gatewayAdmissionStatus).toBe("admitted");
    expect(gate.receipt.downstreamOutcomeStatus).toBe("pending");
    expect(timeline.gatewayAdmissionStatus).toBe("admitted");
    expect(timeline.downstreamOutcomeStatus).toBe("pending");
  });

  it("projects refusal and admitted paths as read-only agent transaction envelopes", async () => {
    const fixture = await createGreenlitContract();
    const duplicateCompilation = await fixture.kernel.compileIntent({
      tenantId: "tenant_demo",
      organizationId: "org_demo",
      principalIntentRef: "intent:duplicate should be refused before gateway",
      principalId: "principal_demo",
      agentId: "agent_demo",
      runId: "run_demo",
      runtimeAdapterId: "runtime_codex",
      operatingEnvelopeId: fixture.envelope.envelopeId,
      toolCatalogRef: "tool_catalog_demo@v1",
      actionCatalogRef: "action_catalog_demo@v1",
      gatewayRegistryRef: "gateway_registry@v1",
      candidate: makePackageInstallCandidate(fixture, {
        idempotencyKey: fixture.contract.idempotencyKey,
        sequenceNumber: 2,
      }),
    });
    const duplicateContract = await fixture.kernel.proposeActionContract(
      proposalInputForCompilation(duplicateCompilation),
    );
    const refusedPolicy = await fixture.kernel.evaluatePolicy({
      actionContractId: duplicateContract.actionContractId,
      envelopeId: fixture.envelope.envelopeId,
    });
    const refusedEnvelope = await projectAgentTransactionEnvelope({
      contract: duplicateContract,
      policyDecision: refusedPolicy.decision,
      refusals: (await fixture.store.listRecordsByType<Refusal>("refusal")).map((record) => record.payload),
    });

    expect(refusedPolicy.decision.decision).toBe("refuse");
    expect(refusedEnvelope.gatewayAdmissionStatus).toBe("not_requested");
    expect(refusedEnvelope.downstreamOutcomeStatus).toBe("not_started");
    expect(refusedEnvelope.greenlightRef).toBeNull();
    expect(refusedEnvelope.receiptRef).toBeNull();
    expect(refusedEnvelope.refusalRefs).toHaveLength(1);
    expect(refusedEnvelope.refusalReasonCodes).toContain("idempotency_duplicate_authority");

    const gate = await fixture.kernel.gatewayCheck({
      actionContractId: fixture.contract.actionContractId,
      greenlightId: fixture.greenlight.greenlightId,
      observedParameters: fixture.contract.parameters,
      surfaceOperationRef: "surface-op:agent-envelope",
    });
    const ledger = await currentLedgerForContract(fixture);
    const admittedEnvelope = await projectAgentTransactionEnvelope({
      contract: fixture.contract,
      policyDecision: fixture.decision,
      greenlight: fixture.greenlight,
      gateAttempt: gate.gateAttempt,
      mutationAttempt: gate.mutationAttempt,
      receipt: gate.receipt,
      ledger,
    });

    expect(admittedEnvelope.gatewayAdmissionStatus).toBe("admitted");
    expect(admittedEnvelope.downstreamOutcomeStatus).toBe("pending");
    expect(admittedEnvelope.receiptRef).toBe(gate.receipt.receiptId);
    expect(admittedEnvelope.idempotencyLedgerRef).toBe(ledger.idempotencyLedgerEntryId);
    expect(admittedEnvelope.idempotencyLedgerState).toBe("mutation_started");
    expect(admittedEnvelope.idempotencyRecoveryDisposition).toBe("same_params_duplicate_refused");
    expect(admittedEnvelope.idempotencyReasonCodes).toEqual(["idempotency_duplicate_authority"]);
    expect(admittedEnvelope.envelopeDigest).toMatch(/^sha256:/);
  });

  it("projects gateway replay and downstream proof-gap evidence without treating either as admission", async () => {
    const fixture = await createGreenlitContract();
    const firstGate = await fixture.kernel.gatewayCheck({
      actionContractId: fixture.contract.actionContractId,
      greenlightId: fixture.greenlight.greenlightId,
      observedParameters: fixture.contract.parameters,
      surfaceOperationRef: "surface-op:agent-envelope-replay",
    });
    const replay = await fixture.kernel.gatewayCheck({
      actionContractId: fixture.contract.actionContractId,
      greenlightId: fixture.greenlight.greenlightId,
      observedParameters: fixture.contract.parameters,
      surfaceOperationRef: "surface-op:agent-envelope-replay",
    });
    const replayRefusals = (await fixture.store.listRecordsByType<Refusal>("refusal")).map((record) => record.payload);
    const replayEnvelope = await projectAgentTransactionEnvelope({
      contract: fixture.contract,
      policyDecision: fixture.decision,
      greenlight: fixture.greenlight,
      gateAttempt: replay.gateAttempt,
      receipt: replay.receipt,
      refusals: replayRefusals,
    });

    expect(firstGate.receipt.gatewayAdmissionStatus).toBe("admitted");
    expect(replayEnvelope.gatewayAdmissionStatus).toBe("replayed");
    expect(replayEnvelope.downstreamOutcomeStatus).toBe("not_started");
    expect(replayEnvelope.refusalReasonCodes).toContain("already_consumed");
    expect(replayEnvelope.mutationAttemptRef).toBeNull();

    const proofFixture = await createGreenlitContract();
    const proofGate = await proofFixture.kernel.gatewayCheck({
      actionContractId: proofFixture.contract.actionContractId,
      greenlightId: proofFixture.greenlight.greenlightId,
      observedParameters: proofFixture.contract.parameters,
      surfaceOperationRef: "surface-op:agent-envelope-proof-gap",
    });
    const proofGap = await recordUnknownDownstreamProofGap(proofFixture, proofGate);
    const proofGapEnvelope = await projectAgentTransactionEnvelope({
      contract: proofFixture.contract,
      policyDecision: proofFixture.decision,
      greenlight: proofFixture.greenlight,
      gateAttempt: proofGate.gateAttempt,
      mutationAttempt: proofGate.mutationAttempt,
      receipt: proofGate.receipt,
      proofGaps: (await proofFixture.store.listRecordsByType<ProofGap>("proof_gap")).map((record) => record.payload),
      ledger: await currentLedgerForContract(proofFixture),
    });

    expect(proofGapEnvelope.gatewayAdmissionStatus).toBe("admitted");
    expect(proofGapEnvelope.proofGapRefs).toContain(proofGap.proofGapId);
    expect(proofGapEnvelope.proofGapReasonCodes).toContain("orphan_mitigation_required");
    expect(proofGapEnvelope.idempotencyLedgerState).toBe("terminal_unknown");
    expect(proofGapEnvelope.idempotencyRecoveryDisposition).toBe("terminal_unknown_requires_recovery");
  });

  it("redacts raw x402 payment credential evidence while exposing digest and response refs", async () => {
    const fixture = await createGreenlitContract();
    const gate = await fixture.kernel.gatewayCheck({
      actionContractId: fixture.contract.actionContractId,
      greenlightId: fixture.greenlight.greenlightId,
      observedParameters: fixture.contract.parameters,
      surfaceOperationRef: "surface-op:x402-redaction",
    });
    if (!gate.mutationAttempt) throw new Error("expected mutation attempt before x402 redaction reconciliation");

    const safeRefs = [
      "evidence:x402-official-payment-signature:redaction",
      "credential:x402-payment-signature:redaction",
      `digest:sha256:${"a".repeat(64)}`,
      "credential:x402-payment-payload:redaction",
      `digest:sha256:${"b".repeat(64)}`,
      "evidence:x402-payment-response:redaction",
    ];
    const rawCredentialRefs = [
      "PAYMENT-SIGNATURE:raw-header-must-not-project",
      "PAYMENT-SIGNATURE raw-header-must-not-project",
      'PaymentPayload:{"payload":{"signature":"0xraw"}}',
      "secretref:x402-wallet-gateway",
      "secret-ref:x402-wallet-gateway",
      "signerRef:x402-wallet-gateway",
      "raw_signer:x402-wallet-gateway",
      "token_passthrough:raw-bearer",
      "Authorization: Bearer sk_live_x402_secret_must_not_project",
      "vault://team/prod/x402-wallet",
      "infisical://project/prod/X402_PAYMENT_SIGNATURE",
      "op://engineering/x402-wallet/password",
      "aws_secret_access_key=must-not-project",
      "facilitator_secret:raw",
      "auth-md-credential=Bearer authmd-secret-claim-token",
    ];

    const reconciliation = await fixture.kernel.reconcileSurfaceOperation({
      mutationAttemptId: gate.mutationAttempt.mutationAttemptId,
      idempotencyKey: fixture.contract.idempotencyKey,
      observedSurfaceOperationRef: "surface-op:x402-redaction",
      observedDownstreamStatus: "succeeded",
      downstreamRetryability: "non_retryable",
      providerRequestRef: "provider-request:x402:redaction",
      providerOperationRef: "provider-operation:x402:redaction",
      diagnosticsRedactionPosture: "redacted",
      evidenceRefs: [...safeRefs, ...rawCredentialRefs],
      resolvedProofGapIds: [],
    });

    const projection = await projectAgentTransactionEnvelope({
      contract: fixture.contract,
      policyDecision: fixture.decision,
      greenlight: fixture.greenlight,
      gateAttempt: gate.gateAttempt,
      mutationAttempt: gate.mutationAttempt,
      receipt: gate.receipt,
      proofGaps: (await fixture.store.listRecordsByType<ProofGap>("proof_gap")).map((record) => record.payload),
      ledger: await currentLedgerForContract(fixture),
      reconciliations: [reconciliation.reconciliation],
    });

    expect(projection.surfaceOperationRef).toBe("surface-op:x402-redaction");
    expect(projection.surfaceOperationReconciliationRef).toBe(reconciliation.reconciliation.reconciliationId);
    expect(projection.surfaceOperationEvidenceLabels).toEqual([
      "local_gateway_check",
      "payment_payload_created",
      "downstream_reconciliation_recorded",
      "payment_response_received",
    ]);
    for (const ref of safeRefs) expect(projection.surfaceOperationEvidenceRefs).toContain(ref);
    for (const ref of rawCredentialRefs) expect(JSON.stringify(projection)).not.toContain(ref);
    expect(projection.gatewayCredentialEvidenceRefs).toEqual([
      "credential:x402-payment-signature:redaction",
      `digest:sha256:${"a".repeat(64)}`,
      "credential:x402-payment-payload:redaction",
      `digest:sha256:${"b".repeat(64)}`,
    ]);
    expect(projection.downstreamEvidenceRefs).toEqual(["evidence:x402-payment-response:redaction"]);
    expect(projection.providerRequestRef).toBe("provider-request:x402:redaction");
    expect(projection.providerOperationRef).toBe("provider-operation:x402:redaction");
    expect(projection.downstreamRetryability).toBe("non_retryable");
    expect(projection.reconciliationFinalityStatus).toBe("final");
  });

  it("assembles scoped transaction envelope custody, recovery, isolation, and idempotency evidence", async () => {
    const fixture = makeKernelFixture();
    await registerFixtureObjects(fixture);
    const credentialRef = await fixture.kernel.registerGatewayCredentialRef(envelopeCredentialRefInput());
    const compilation = await fixture.kernel.compileIntent({
      tenantId: "tenant_demo",
      organizationId: "org_demo",
      principalIntentRef: "intent:install hono with assembled custody evidence",
      principalId: "principal_demo",
      agentId: "agent_demo",
      runId: "run_demo",
      runtimeAdapterId: "runtime_codex",
      operatingEnvelopeId: fixture.envelope.envelopeId,
      toolCatalogRef: "tool_catalog_demo@v1",
      actionCatalogRef: "action_catalog_demo@v1",
      gatewayRegistryRef: "gateway_registry@v1",
      candidate: makePackageInstallCandidate(fixture, {
        idempotencyKey: "idem_assembled_transaction_envelope",
        gatewayCredentialRefs: [envelopeCredentialBindingFor(credentialRef)],
      }),
    });
    const contract = await fixture.kernel.proposeActionContract(proposalInputForCompilation(compilation));
    const policy = await fixture.kernel.evaluatePolicy({
      actionContractId: contract.actionContractId,
      envelopeId: fixture.envelope.envelopeId,
    });
    if (!policy.greenlight) throw new Error("expected greenlight");
    const gate = await fixture.kernel.gatewayCheck({
      actionContractId: contract.actionContractId,
      greenlightId: policy.greenlight.greenlightId,
      observedParameters: contract.parameters,
      surfaceOperationRef: "surface-op:assembled-envelope",
    });
    if (!gate.mutationAttempt) throw new Error("expected mutation attempt");
    const credentialEvidence = await fixture.kernel.recordCredentialResolutionEvidence({
      actionContractId: contract.actionContractId,
      greenlightId: policy.greenlight.greenlightId,
      gateAttemptId: gate.gateAttempt.gateAttemptId,
      gatewayCredentialRefId: credentialRef.gatewayCredentialRefId,
      gatewayCredentialRefDigest: credentialRef.gatewayCredentialRefDigest,
      requestDigest: `sha256:${"4".repeat(64)}`,
      resultClass: "used_by_gateway",
      resultReasonCode: "gate_passed",
      redactionStatus: "redacted",
      providerRequestRef: "provider-request:assembled-envelope",
      providerOperationRef: "provider-operation:assembled-envelope",
      evidenceRefs: ["evidence:credential-resolution:assembled-envelope"],
    });
    const reconciliation = await fixture.kernel.reconcileSurfaceOperation({
      mutationAttemptId: gate.mutationAttempt.mutationAttemptId,
      idempotencyKey: contract.idempotencyKey,
      observedSurfaceOperationRef: "surface-op:assembled-envelope",
      observedDownstreamStatus: "unknown",
      evidenceRefs: [],
      resolvedProofGapIds: [],
      orphanIsolationRequested: true,
    });
    if (!reconciliation.createdProofGap) throw new Error("expected downstream proof gap");
    const recovery = await fixture.kernel.createRecoveryRecommendation({
      sourceReceiptId: gate.receipt.receiptId,
      sourceRefusalOrGapRef: reconciliation.createdProofGap.proofGapId,
      recommendedPath: "narrower_action_contract_required",
      allowedNextActionClasses: [contract.actionClass],
      requiredNewEvidence: ["gateway_finality_evidence"],
      requiresHumanReview: true,
      reasonCode: "downstream_status_unknown",
      reasonSummary: "Gateway did not produce downstream finality evidence.",
      retryNotBefore: futureIso(),
    });

    await insertUnrelatedProjectionClutter(fixture.store, 25);

    const assembly = await assembleAgentTransactionEnvelope(guardBroadProjectionReads(fixture.store), contract);
    const projection = await projectAgentTransactionEnvelope(assembly.input);

    expect(projection.credentialResolutionEvidenceRefs).toContain(
      `credential_resolution_evidence:${credentialEvidence.credentialResolutionEvidenceId}`,
    );
    expect(projection.gatewayCredentialEvidenceRefs).toContain(
      `gateway_credential_ref:${credentialRef.gatewayCredentialRefId}`,
    );
    expect(projection.idempotencyLedgerRef).not.toBeNull();
    expect(projection.recoveryRefs).toContain(`recovery_recommendation:${recovery.recoveryRecommendationId}`);
    expect(projection.isolationRefs.some((ref) => ref.startsWith("isolation_state:"))).toBe(true);
    expect(assembly.supplementalRecords.map((record) => record.objectType)).toEqual(
      expect.arrayContaining([
        "credential_resolution_evidence",
        "idempotency_ledger_entry",
        "recovery_recommendation",
        "isolation_state",
        "surface_operation_reconciliation",
      ]),
    );
    expect(JSON.stringify(assembly.supplementalRecords)).not.toContain("act_projection_clutter");
  });

  it("keeps facilitator verify evidence distinct from settlement finality", async () => {
    const fixture = await createGreenlitContract();
    const gate = await fixture.kernel.gatewayCheck({
      actionContractId: fixture.contract.actionContractId,
      greenlightId: fixture.greenlight.greenlightId,
      observedParameters: fixture.contract.parameters,
      surfaceOperationRef: "surface-op:x402-facilitator-verify",
    });
    if (!gate.mutationAttempt) throw new Error("expected mutation attempt before facilitator verify reconciliation");

    const reconciliation = await fixture.kernel.reconcileSurfaceOperation({
      mutationAttemptId: gate.mutationAttempt.mutationAttemptId,
      idempotencyKey: fixture.contract.idempotencyKey,
      observedSurfaceOperationRef: "surface-op:x402-facilitator-verify",
      observedDownstreamStatus: "unknown",
      downstreamRetryability: "unknown",
      providerRequestRef: "provider-request:x402:verify-only",
      providerOperationRef: "provider-operation:x402:verify-only",
      diagnosticsRedactionPosture: "redacted",
      evidenceRefs: ["evidence:x402-facilitator-verify:succeeded:verify-only"],
      resolvedProofGapIds: [],
    });

    const projection = await projectAgentTransactionEnvelope({
      contract: { ...fixture.contract, actionClass: "x402_payment.exact" },
      policyDecision: fixture.decision,
      greenlight: fixture.greenlight,
      gateAttempt: gate.gateAttempt,
      mutationAttempt: gate.mutationAttempt,
      receipt: gate.receipt,
      ledger: await currentLedgerForContract(fixture),
      reconciliations: [reconciliation.reconciliation],
    });

    expect(projection.surfaceOperationEvidenceLabels).toEqual([
      "local_gateway_check",
      "downstream_reconciliation_recorded",
      "payment_response_missing",
      "facilitator_verify_succeeded",
    ]);
    expect(projection.surfaceOperationEvidenceLabels).not.toContain("paid_retry_attempted");
    expect(projection.downstreamOutcomeStatus).toBe("pending");
    expect(projection.reconciliationFinalityStatus).toBe("unknown");
    expect(projection.downstreamEvidenceRefs).toEqual([]);
    expect(projection.surfaceOperationEvidenceLabels).not.toContain("settlement_succeeded");
  });

  it("classifies x402 local sandbox signed retry as reference downstream fixture evidence only", async () => {
    const fixture = await createGreenlitContract();
    const gate = await fixture.kernel.gatewayCheck({
      actionContractId: fixture.contract.actionContractId,
      greenlightId: fixture.greenlight.greenlightId,
      observedParameters: fixture.contract.parameters,
      surfaceOperationRef: "surface-op:x402-local-sandbox",
    });
    if (!gate.mutationAttempt) throw new Error("expected mutation attempt before local sandbox reconciliation");

    const reconciliation = await fixture.kernel.reconcileSurfaceOperation({
      mutationAttemptId: gate.mutationAttempt.mutationAttemptId,
      idempotencyKey: fixture.contract.idempotencyKey,
      observedSurfaceOperationRef: "surface-op:x402-local-sandbox",
      observedDownstreamStatus: "succeeded",
      downstreamRetryability: "non_retryable",
      providerRequestRef: "provider-request:x402-local-sandbox",
      providerOperationRef: "provider-operation:x402-local-sandbox",
      diagnosticsRedactionPosture: "redacted",
      evidenceRefs: ["evidence:x402-local-sandbox-signed-retry:1", "evidence:x402-local-sandbox-payment-response:1"],
      resolvedProofGapIds: [],
    });

    const projection = await projectAgentTransactionEnvelope({
      contract: { ...fixture.contract, actionClass: "x402_payment.exact" },
      policyDecision: fixture.decision,
      greenlight: fixture.greenlight,
      gateAttempt: gate.gateAttempt,
      mutationAttempt: gate.mutationAttempt,
      receipt: gate.receipt,
      ledger: await currentLedgerForContract(fixture),
      reconciliations: [reconciliation.reconciliation],
    });

    expect(projection.surfaceOperationEvidenceLabels).toEqual(
      expect.arrayContaining([
        "local_gateway_check",
        "downstream_reconciliation_recorded",
        "payment_response_received",
        "signed_retry_recorded",
        "local_reference_downstream_fixture",
      ]),
    );
    expect(projection.downstreamEvidenceRefs).toEqual(
      expect.arrayContaining([
        "evidence:x402-local-sandbox-signed-retry:1",
        "evidence:x402-local-sandbox-payment-response:1",
      ]),
    );
    expect(projection.surfaceOperationEvidenceLabels).not.toContain("settlement_succeeded");
    expect(projection.surfaceOperationEvidenceLabels).not.toContain("facilitator_settle_attempted");
  });

  it("generalizes protected-path health beyond package install action classes", async () => {
    const fixture = await createGreenlitContract();
    const x402LikeContract = {
      ...fixture.contract,
      actionClass: "x402_payment.exact",
      protectedSurfaceKind: "payment",
      requiredProtectedPathState: "gateway_checked" as const,
    };

    const health = projectProtectedPathInstallHealth({
      contract: x402LikeContract,
      gateway: null,
      posture: null,
      now: new Date().toISOString(),
    });

    expect(health.actionClass).toBe("x402_payment.exact");
    expect(health.installHealthStatus).toBe("unknown");
  });
});

async function currentLedgerForContract(
  fixture: Awaited<ReturnType<typeof createGreenlitContract>>,
): Promise<IdempotencyLedgerEntry> {
  const ledgerKeyDigest = await idempotencyLedgerKeyDigest(idempotencyLedgerKey(fixture.contract));
  const current = await fixture.store.getCurrentIdempotencyLedgerEntry(ledgerKeyDigest);
  if (!current) throw new Error("expected current ledger entry");
  return current.payload;
}

function envelopeCredentialRefInput(): RegisterGatewayCredentialRefInput {
  return {
    tenantId: "tenant_demo",
    organizationId: "org_demo",
    gatewayCredentialRefId: "gcr_envelope_package_manager_token",
    principalId: "principal_demo",
    gatewayId: "gateway_package_manager",
    gatewayRegistryEntryId: "gateway_registry_package",
    protectedSurfaceKind: "package_manager",
    actionClasses: ["package.install"],
    resourceRefs: ["npm:hono"],
    resourceNamespaceRef: "npm:package",
    credentialKind: "package_manager_token",
    custodyStatus: "gateway_resolved_from_vault",
    providerClass: "vault_provider",
    providerRegistryRef: "vault-provider:local-test",
    providerRegistryDigest: `sha256:${"a".repeat(64)}`,
    resolverRef: "resolver:local-vault",
    resolverVersion: "v1",
    evidenceExpectationRefs: ["evidence:credential-resolution"],
    expiresAt: futureIso(),
  };
}

function envelopeCredentialBindingFor(credentialRef: GatewayCredentialRef) {
  return {
    credentialUseName: "package_manager_token",
    gatewayCredentialRefId: credentialRef.gatewayCredentialRefId,
    gatewayCredentialRefDigest: credentialRef.gatewayCredentialRefDigest,
    providerRegistryRef: credentialRef.providerRegistryRef,
    providerRegistryDigest: credentialRef.providerRegistryDigest,
    requiredCredentialCustodyStatus: credentialRef.custodyStatus,
    evidenceExpectationRefs: credentialRef.evidenceExpectationRefs,
  };
}

const broadProjectionReadTypes = new Set<ProtocolObjectType>([
  "policy_decision",
  "greenlight",
  "gateway_check_attempt",
  "mutation_attempt",
  "receipt",
  "surface_operation_reconciliation",
  "authority_certificate",
  "credential_resolution_evidence",
  "recovery_recommendation",
  "recovery_recommendation_status_transition",
  "proof_gap",
  "refusal",
  "isolation_state",
]);

function guardBroadProjectionReads(store: ProtocolStore): ProtocolStore {
  return new Proxy(store, {
    get(target, prop) {
      if (prop === "listRecordsByType") {
        return async <T>(
          objectType: ProtocolObjectType,
          scope: ProtocolRecordScope = {},
        ): Promise<StoredProtocolRecord<T>[]> => {
          if (broadProjectionReadTypes.has(objectType)) {
            throw new Error(`Projection assembly used broad listRecordsByType for ${objectType}.`);
          }
          return target.listRecordsByType<T>(objectType, scope);
        };
      }
      const value = Reflect.get(target, prop, target);
      return typeof value === "function" ? value.bind(target) : value;
    },
  }) as ProtocolStore;
}

async function insertUnrelatedProjectionClutter(store: ProtocolStore, count: number): Promise<void> {
  for (let index = 0; index < count; index += 1) {
    const actionContractId = `act_projection_clutter_${index}`;
    await store.putRecord(
      projectionClutterRecord("credential_resolution_evidence", `cre_projection_clutter_${index}`, {
        credentialResolutionEvidenceId: `cre_projection_clutter_${index}`,
        actionContractId,
      }),
    );
    await store.putRecord(
      projectionClutterRecord("surface_operation_reconciliation", `sor_projection_clutter_${index}`, {
        reconciliationId: `sor_projection_clutter_${index}`,
        actionContractId,
      }),
    );
    await store.putRecord(
      projectionClutterRecord("proof_gap", `pg_projection_clutter_${index}`, {
        proofGapId: `pg_projection_clutter_${index}`,
        affectedObjectRefs: [actionContractId],
      }),
    );
  }
}

function projectionClutterRecord(
  objectType: ProtocolObjectType,
  objectId: string,
  payload: Record<string, unknown>,
): StoredProtocolRecord {
  const createdAt = new Date(0).toISOString();
  return {
    objectId,
    objectType,
    tenantId: "tenant_demo",
    organizationId: "org_demo",
    schemaVersion: "0.2.4",
    canonicalDigest: digestForProjectionClutter(objectId),
    payload: {
      schemaVersion: "0.2.4",
      tenantId: "tenant_demo",
      organizationId: "org_demo",
      createdAt,
      ...payload,
    },
    createdAt,
    sourceEventId: null,
  };
}

function digestForProjectionClutter(seed: string): `sha256:${string}` {
  return `sha256:${seed
    .replace(/[^a-z0-9]/gi, "0")
    .padEnd(64, "0")
    .slice(0, 64)}`;
}
