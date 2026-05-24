import { describe, expect, it } from "bun:test";
import { digestCanonical } from "../../src/protocol/foundation/canonical";
import { projectAgentTransactionEnvelope } from "../../src/protocol/evidence-projections";
import {
  GatewayCredentialRefSchema,
  GatewayCustodyProofPacketSchema,
  RecordGatewayCustodyProofPacketInputSchema,
  RegisterGatewayCredentialRefInputSchema,
  type CredentialResolutionEvidence,
  type GatewayCredentialRef,
  type GatewayCustodyProofPacket,
  type RecordGatewayCustodyProofPacketInput,
  type RegisterGatewayCredentialRefInput,
} from "../../src/protocol/areas/credential-custody";
import type { Refusal } from "../../src/protocol/areas/refusal";
import {
  futureIso,
  makeKernelFixture,
  makePackageInstallCandidate,
  proposalInputForCompilation,
  recordSafeBypassProbes,
  registerFixtureObjects,
} from "../support/fixtures";

describe("credential custody protocol records", () => {
  it("rejects raw credential material in gateway credential ref inputs and records", async () => {
    const input = credentialRefInput();
    const encodedPaymentSignature = "evidence:UEFZTUVOVC1TSUdOQVRVUkU6IGFiYw==";
    const encodedPrivateKey = "provider:%70%72%69%76%61%74%65%5F%6B%65%79%3Draw";

    expect(() =>
      RegisterGatewayCredentialRefInputSchema.parse({
        ...input,
        providerRegistryRef: "api_key=raw-provider-key",
      }),
    ).toThrow("credential custody records must not contain raw credential material");

    for (const providerRegistryRef of [encodedPaymentSignature, encodedPrivateKey]) {
      expect(() =>
        RegisterGatewayCredentialRefInputSchema.parse({
          ...input,
          providerRegistryRef,
        }),
      ).toThrow("credential custody records must not contain raw credential material");
    }

    expect(() =>
      RegisterGatewayCredentialRefInputSchema.parse({
        ...input,
        evidenceExpectationRefs: [encodedPaymentSignature],
      }),
    ).toThrow("credential custody records must not contain raw credential material");

    const digest = await digestCanonical({ credential: "redacted" });
    expect(() =>
      GatewayCredentialRefSchema.parse({
        schemaVersion: "0.2.4",
        tenantId: input.tenantId,
        organizationId: input.organizationId,
        createdAt: new Date().toISOString(),
        gatewayCredentialRefId: "gcr_raw_secret",
        gatewayCredentialRefDigest: digest,
        principalId: input.principalId,
        gatewayId: input.gatewayId,
        gatewayRegistryEntryId: input.gatewayRegistryEntryId,
        protectedSurfaceKind: input.protectedSurfaceKind,
        actionClasses: input.actionClasses,
        resourceRefs: input.resourceRefs,
        resourceNamespaceRef: input.resourceNamespaceRef,
        credentialKind: "package_manager_token",
        custodyStatus: "gateway_resolved_from_vault",
        providerClass: "vault_provider",
        providerRegistryRef: "vault://workspace/secret/package-token",
        providerRegistryDigest: null,
        resolverRef: "resolver:local-vault",
        resolverVersion: "v1",
        evidenceExpectationRefs: [],
        redactionProfileRef: "gateway-credential-ref:v0.2-redacted",
        secretMaterialIncluded: false,
        issuedAt: new Date().toISOString(),
        expiresAt: null,
      }),
    ).toThrow("credential custody records must not contain raw credential material");
  });

  it("binds gateway credential refs into candidate and contract digests", async () => {
    const fixture = makeKernelFixture();
    const credentialRef = await registerFixtureCredentialRef(fixture);
    const { compilation, contract } = await proposeCredentialBoundContract(fixture, credentialRef);

    expect(contract.gatewayCredentialRefs).toEqual([credentialBindingFor(credentialRef)]);
    expect(contract.paramsDigest).toBe(compilation.candidateAction.paramsDigest);
    expect(contract.actionContractDigest).toMatch(/^sha256:/);

    const driftedCompilation = await fixture.kernel.compileIntent({
      tenantId: "tenant_demo",
      organizationId: "org_demo",
      principalIntentRef: "intent:install hono with drifted credential ref",
      principalId: "principal_demo",
      agentId: "agent_demo",
      runId: "run_demo",
      runtimeAdapterId: "runtime_codex",
      operatingEnvelopeId: fixture.envelope.envelopeId,
      toolCatalogRef: "tool_catalog_demo@v1",
      actionCatalogRef: "action_catalog_demo@v1",
      gatewayRegistryRef: "gateway_registry@v1",
      candidate: makePackageInstallCandidate(fixture, {
        idempotencyKey: "idem_credential_digest_drift",
        gatewayCredentialRefs: [
          {
            ...credentialBindingFor(credentialRef),
            gatewayCredentialRefDigest: `sha256:${"1".repeat(64)}`,
          },
        ],
      }),
    });

    await expect(fixture.kernel.proposeActionContract(proposalInputForCompilation(driftedCompilation))).rejects.toThrow(
      "Stored gateway credential ref digest does not match",
    );
  });

  it("consults credential-ref isolation at the gateway boundary", async () => {
    const fixture = makeKernelFixture();
    const credentialRef = await registerFixtureCredentialRef(fixture);
    const { contract } = await proposeCredentialBoundContract(fixture, credentialRef);
    const policy = await fixture.kernel.evaluatePolicy({
      actionContractId: contract.actionContractId,
      envelopeId: fixture.envelope.envelopeId,
    });
    if (!policy.greenlight) throw new Error("expected policy greenlight before credential isolation test");

    await fixture.kernel.createIsolationState({
      tenantId: "tenant_demo",
      organizationId: "org_demo",
      scopeType: "credential_ref",
      scopeId: credentialRef.gatewayCredentialRefId,
      state: "quarantined",
      reasonCode: "credential_resolution_isolation_blocked",
      reasonSummary: "Credential ref is quarantined after custody drift evidence.",
      sourceDecisionRef: "test:credential-ref-quarantine",
    });

    const gate = await fixture.kernel.gatewayCheck({
      actionContractId: contract.actionContractId,
      greenlightId: policy.greenlight.greenlightId,
      observedParameters: contract.parameters,
      surfaceOperationRef: "surface-op:credential-isolation",
    });

    expect(gate.gateAttempt.gateDecision).toBe("refused");
    expect(gate.gateAttempt.gateDecisionReasonCode).toBe("current_isolation_quarantined");
    const refusals = (await fixture.store.listRecordsByType<Refusal>("refusal")).map((record) => record.payload);
    expect(refusals.map((refusal) => refusal.reasonCode)).toContain("current_isolation_quarantined");
  });

  it("records credential resolution evidence only after an exact passed gateway check", async () => {
    const fixture = makeKernelFixture();
    const credentialRef = await registerFixtureCredentialRef(fixture);
    const { contract } = await proposeCredentialBoundContract(fixture, credentialRef);
    const policy = await fixture.kernel.evaluatePolicy({
      actionContractId: contract.actionContractId,
      envelopeId: fixture.envelope.envelopeId,
    });
    if (!policy.greenlight) throw new Error("expected policy greenlight before credential evidence test");

    await expect(
      fixture.kernel.recordCredentialResolutionEvidence({
        actionContractId: contract.actionContractId,
        greenlightId: policy.greenlight.greenlightId,
        gateAttemptId: "gate_missing_resolution",
        gatewayCredentialRefId: credentialRef.gatewayCredentialRefId,
        gatewayCredentialRefDigest: credentialRef.gatewayCredentialRefDigest,
        requestDigest: `sha256:${"2".repeat(64)}`,
        resultClass: "used_by_gateway",
        resultReasonCode: "gate_passed",
        redactionStatus: "redacted",
        evidenceRefs: [],
      }),
    ).rejects.toThrow("gateway_check_attempt gate_missing_resolution was not found");

    const gate = await fixture.kernel.gatewayCheck({
      actionContractId: contract.actionContractId,
      greenlightId: policy.greenlight.greenlightId,
      observedParameters: contract.parameters,
      surfaceOperationRef: "surface-op:credential-resolution",
    });
    if (!gate.mutationAttempt) throw new Error("expected mutation attempt for credential resolution evidence");

    const evidence = await fixture.kernel.recordCredentialResolutionEvidence({
      actionContractId: contract.actionContractId,
      greenlightId: policy.greenlight.greenlightId,
      gateAttemptId: gate.gateAttempt.gateAttemptId,
      gatewayCredentialRefId: credentialRef.gatewayCredentialRefId,
      gatewayCredentialRefDigest: credentialRef.gatewayCredentialRefDigest,
      requestDigest: `sha256:${"3".repeat(64)}`,
      resultClass: "used_by_gateway",
      resultReasonCode: "gate_passed",
      redactionStatus: "redacted",
      providerRequestRef: "provider-request:redacted-credential-use",
      providerOperationRef: "provider-operation:redacted-credential-use",
      evidenceRefs: ["evidence:credential-resolution:redacted"],
    });

    expect(evidence).toMatchObject({
      gatewayCredentialRefId: credentialRef.gatewayCredentialRefId,
      actionContractId: contract.actionContractId,
      greenlightId: policy.greenlight.greenlightId,
      gateAttemptId: gate.gateAttempt.gateAttemptId,
      mutationAttemptId: gate.mutationAttempt.mutationAttemptId,
      credentialMaterialIncluded: false,
      redactionProfileRef: "credential-resolution-evidence:v0.2-redacted",
    } satisfies Partial<CredentialResolutionEvidence>);
    expect(JSON.stringify(evidence)).not.toMatch(/secret|private[_-]?key|PAYMENT-SIGNATURE/);
  });

  it("projects credential refs and resolution evidence without exposing raw provider material", async () => {
    const fixture = makeKernelFixture();
    const credentialRef = await registerFixtureCredentialRef(fixture);
    const { contract } = await proposeCredentialBoundContract(fixture, credentialRef);
    const policy = await fixture.kernel.evaluatePolicy({
      actionContractId: contract.actionContractId,
      envelopeId: fixture.envelope.envelopeId,
    });
    if (!policy.greenlight) throw new Error("expected policy greenlight before credential projection test");
    const gate = await fixture.kernel.gatewayCheck({
      actionContractId: contract.actionContractId,
      greenlightId: policy.greenlight.greenlightId,
      observedParameters: contract.parameters,
      surfaceOperationRef: "surface-op:credential-projection",
    });
    const evidence = await fixture.kernel.recordCredentialResolutionEvidence({
      actionContractId: contract.actionContractId,
      greenlightId: policy.greenlight.greenlightId,
      gateAttemptId: gate.gateAttempt.gateAttemptId,
      gatewayCredentialRefId: credentialRef.gatewayCredentialRefId,
      gatewayCredentialRefDigest: credentialRef.gatewayCredentialRefDigest,
      requestDigest: `sha256:${"4".repeat(64)}`,
      resultClass: "used_by_gateway",
      resultReasonCode: "gate_passed",
      redactionStatus: "redacted",
      providerRequestRef: "provider-request:redacted-projection",
      providerOperationRef: "provider-operation:redacted-projection",
      evidenceRefs: ["evidence:credential-resolution:redacted-projection"],
    });

    const projection = await projectAgentTransactionEnvelope({
      contract,
      policyDecision: policy.decision,
      greenlight: policy.greenlight,
      gateAttempt: gate.gateAttempt,
      mutationAttempt: gate.mutationAttempt,
      receipt: gate.receipt,
      credentialResolutionEvidence: [evidence],
    });

    expect(projection.gatewayCredentialEvidenceRefs).toContain(
      `gateway_credential_ref:${credentialRef.gatewayCredentialRefId}`,
    );
    expect(projection.gatewayCredentialEvidenceRefs).toContain(
      `credential_resolution_evidence:${evidence.credentialResolutionEvidenceId}`,
    );
    expect(projection.credentialResolutionEvidenceRefs).toEqual([
      `credential_resolution_evidence:${evidence.credentialResolutionEvidenceId}`,
    ]);
    expect(projection.evidenceRefs).toContain("evidence:credential-resolution:redacted-projection");
    expect(JSON.stringify(projection)).not.toMatch(/api[_-]?key|private[_-]?key|PAYMENT-SIGNATURE/);
    expect(JSON.stringify(projection)).not.toContain("package-token");
  });

  it("rejects raw credential material in gateway custody proof packet inputs and records", async () => {
    const input = custodyProofPacketInput({
      opaqueKeyHandleRef: "PAYMENT-SIGNATURE: raw",
    });

    expect(() => RecordGatewayCustodyProofPacketInputSchema.parse(input)).toThrow(
      "credential custody records must not contain raw credential material",
    );

    expect(() =>
      RecordGatewayCustodyProofPacketInputSchema.parse(
        custodyProofPacketInput({
          redactedAuditRefs: ["vault://workspace/secret/payment-signer"],
        }),
      ),
    ).toThrow("credential custody records must not contain raw credential material");

    expect(() =>
      GatewayCustodyProofPacketSchema.parse({
        ...validCustodyProofPacketRecord(),
        opaqueKeyHandleRef: "private_key=raw",
      }),
    ).toThrow("credential custody records must not contain raw credential material");
  });

  it("records a source-owned custody proof packet as redacted evidence, not authority", async () => {
    const fixture = makeKernelFixture();
    const credentialRef = await registerFixtureCredentialRef(fixture);
    const posture = await recordGatewayCheckedPosture(fixture);

    const packet = await fixture.kernel.recordGatewayCustodyProofPacket(
      custodyProofPacketInput({
        gatewayCredentialRefId: credentialRef.gatewayCredentialRefId,
        gatewayCredentialRefDigest: credentialRef.gatewayCredentialRefDigest,
        protectedPathPostureId: posture.protectedPathPostureId,
        protectedPathPostureDigest: posture.postureDigest,
        bypassProbeIds: posture.bypassProbeIds,
        bypassProbeDigests: posture.bypassProbeDigests,
      }),
    );

    expect(packet).toMatchObject({
      gatewayCredentialRefId: credentialRef.gatewayCredentialRefId,
      protectedPathPostureId: posture.protectedPathPostureId,
      gatewayId: credentialRef.gatewayId,
      credentialKind: credentialRef.credentialKind,
      credentialCustodyStatus: credentialRef.custodyStatus,
      custodyClaimLevel: "local_fixture",
      custodyDriftStatus: "current",
      redactionStatus: "redacted",
      externalVerificationStatus: "not_required",
      secretMaterialIncluded: false,
      authorityCreated: false,
      redactionProfileRef: "gateway-custody-proof-packet:v0.2-redacted",
    } satisfies Partial<GatewayCustodyProofPacket>);
    expect(packet.gatewayCustodyProofPacketDigest).toMatch(/^sha256:/);
    expect(packet.gatewayInstallEvidenceDigests).toContain(`sha256:${"b".repeat(64)}`);
    expect(JSON.stringify(packet)).not.toMatch(/private[_-]?key|PAYMENT-SIGNATURE|PaymentPayload|package-token/);
  });

  it("changes the custody proof digest when resolver, lease, or attestation material changes", async () => {
    const fixture = makeKernelFixture();
    const credentialRef = await registerFixtureCredentialRef(fixture);
    const posture = await recordGatewayCheckedPosture(fixture);
    const base = {
      gatewayCredentialRefId: credentialRef.gatewayCredentialRefId,
      gatewayCredentialRefDigest: credentialRef.gatewayCredentialRefDigest,
      protectedPathPostureId: posture.protectedPathPostureId,
      protectedPathPostureDigest: posture.postureDigest,
      bypassProbeIds: posture.bypassProbeIds,
      bypassProbeDigests: posture.bypassProbeDigests,
      recordedAt: "2026-05-24T00:00:00.000Z",
    } satisfies Partial<RecordGatewayCustodyProofPacketInput>;

    const first = await fixture.kernel.recordGatewayCustodyProofPacket(
      custodyProofPacketInput({
        ...base,
        gatewayCustodyProofPacketId: "gcpp_digest_first",
        leaseVersion: "lease-v1",
        attestationDigests: [`sha256:${"c".repeat(64)}`],
      }),
    );
    const second = await fixture.kernel.recordGatewayCustodyProofPacket(
      custodyProofPacketInput({
        ...base,
        gatewayCustodyProofPacketId: "gcpp_digest_second",
        leaseVersion: "lease-v2",
        attestationDigests: [`sha256:${"d".repeat(64)}`],
      }),
    );

    expect(first.gatewayCustodyProofPacketDigest).not.toBe(second.gatewayCustodyProofPacketDigest);
  });
});

async function registerFixtureCredentialRef(
  fixture: ReturnType<typeof makeKernelFixture>,
): Promise<GatewayCredentialRef> {
  await registerFixtureObjects(fixture);
  return fixture.kernel.registerGatewayCredentialRef(credentialRefInput());
}

async function proposeCredentialBoundContract(
  fixture: ReturnType<typeof makeKernelFixture>,
  credentialRef: GatewayCredentialRef,
) {
  const compilation = await fixture.kernel.compileIntent({
    tenantId: "tenant_demo",
    organizationId: "org_demo",
    principalIntentRef: "intent:install hono with vault-backed credential",
    principalId: "principal_demo",
    agentId: "agent_demo",
    runId: "run_demo",
    runtimeAdapterId: "runtime_codex",
    operatingEnvelopeId: fixture.envelope.envelopeId,
    toolCatalogRef: "tool_catalog_demo@v1",
    actionCatalogRef: "action_catalog_demo@v1",
    gatewayRegistryRef: "gateway_registry@v1",
    candidate: makePackageInstallCandidate(fixture, {
      idempotencyKey: "idem_credential_bound_package_hono",
      gatewayCredentialRefs: [credentialBindingFor(credentialRef)],
    }),
  });
  const contract = await fixture.kernel.proposeActionContract(proposalInputForCompilation(compilation));
  return { compilation, contract };
}

function credentialRefInput(): RegisterGatewayCredentialRefInput {
  return {
    tenantId: "tenant_demo",
    organizationId: "org_demo",
    gatewayCredentialRefId: "gcr_package_manager_token",
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

function credentialBindingFor(credentialRef: GatewayCredentialRef) {
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

async function recordGatewayCheckedPosture(fixture: ReturnType<typeof makeKernelFixture>) {
  const bypassProbeIds = await recordSafeBypassProbes(fixture);
  return fixture.kernel.createProtectedPathPosture({
    tenantId: "tenant_demo",
    organizationId: "org_demo",
    runtimeAdapterId: "runtime_codex",
    gatewayId: fixture.gateway.gatewayId,
    actionClass: "package.install",
    resourceRef: "npm:hono",
    protectedSurfaceKind: "package_manager",
    postureState: "gateway_checked",
    credentialCustodyStatus: "gateway_resolved_from_vault",
    rawSiblingToolStatus: "blocked",
    sourceAuthority: "gateway_probe",
    reasonCodes: ["test_gateway_probe_passed"],
    evidenceRefs: ["evidence:posture:gateway-probe"],
    bypassProbeIds,
    expiresAt: futureIso(),
  });
}

function custodyProofPacketInput(
  overrides: Partial<RecordGatewayCustodyProofPacketInput> = {},
): RecordGatewayCustodyProofPacketInput {
  return {
    tenantId: "tenant_demo",
    organizationId: "org_demo",
    gatewayCredentialRefId: "gcr_package_manager_token",
    gatewayCredentialRefDigest: `sha256:${"a".repeat(64)}`,
    protectedPathPostureId: "ppp_gateway_checked",
    protectedPathPostureDigest: `sha256:${"b".repeat(64)}`,
    gatewayInstallEvidenceRefs: ["evidence:install:package-manager"],
    gatewayInstallEvidenceDigests: [`sha256:${"b".repeat(64)}`],
    bypassProbeIds: ["bypass_probe_credential_custody"],
    bypassProbeDigests: [`sha256:${"c".repeat(64)}`],
    custodyClaimLevel: "local_fixture",
    custodyProviderClass: "local_fixture_gateway",
    custodyProviderRegistryRef: "provider-registry:local-fixture",
    custodyProviderRegistryDigest: `sha256:${"d".repeat(64)}`,
    opaqueKeyHandleRef: "opaque-key-handle:package-manager-token",
    opaqueKeyHandleDigest: `sha256:${"e".repeat(64)}`,
    leaseRef: "lease:package-manager-token",
    leaseVersion: "lease-v1",
    leaseIssuedAt: "2026-05-24T00:00:00.000Z",
    leaseExpiresAt: futureIso(),
    attestationRefs: ["attestation:local-fixture"],
    attestationDigests: [`sha256:${"f".repeat(64)}`],
    redactedAuditRefs: ["audit:redacted:local-fixture"],
    redactedAuditDigest: `sha256:${"1".repeat(64)}`,
    custodyDriftStatus: "current",
    resolverDriftStatus: "current",
    redactionStatus: "redacted",
    externalVerificationStatus: "not_required",
    recordedAt: "2026-05-24T00:00:00.000Z",
    expiresAt: futureIso(),
    ...overrides,
  };
}

function validCustodyProofPacketRecord(): GatewayCustodyProofPacket {
  return GatewayCustodyProofPacketSchema.parse({
    ...custodyProofPacketInput(),
    schemaVersion: "0.2.4",
    createdAt: "2026-05-24T00:00:00.000Z",
    gatewayCustodyProofPacketId: "gcpp_test",
    gatewayCustodyProofPacketDigest: `sha256:${"9".repeat(64)}`,
    gatewayId: "gateway_package_manager",
    gatewayRegistryEntryId: "gateway_registry_package",
    protectedSurfaceKind: "package_manager",
    actionClasses: ["package.install"],
    resourceRefs: ["npm:hono"],
    credentialKind: "package_manager_token",
    credentialCustodyStatus: "gateway_resolved_from_vault",
    resolverRef: "resolver:local-vault",
    resolverVersion: "v1",
    secretMaterialIncluded: false,
    authorityCreated: false,
    redactionProfileRef: "gateway-custody-proof-packet:v0.2-redacted",
  });
}
