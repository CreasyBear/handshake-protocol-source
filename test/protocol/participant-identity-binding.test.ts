import { describe, expect, it } from "bun:test";
import { authorityCertificateSigningInputDigest, verifyAuthorityCertificate } from "../../src";
import { projectAgentTransactionEnvelope, projectContractEvidence } from "../../src/protocol/evidence-projections";
import { digestCanonical } from "../../src/protocol/foundation/canonical";
import {
  makeKernelFixture,
  makePackageInstallCandidate,
  proposalInputForCompilation,
  registerFixtureObjects,
} from "../support/fixtures";

describe("participant identity bindings", () => {
  it("binds Clerk principal and ERC-8004 agent refs as evidence-only contract/cert material", async () => {
    const fixture = makeKernelFixture();
    fixture.envelope = {
      ...fixture.envelope,
      participantIdentityBindings: await participantIdentityBindings(),
    };
    await registerFixtureObjects(fixture);

    const rejected = await fixture.kernel.compileIntent({
      tenantId: "tenant_demo",
      organizationId: "org_demo",
      principalIntentRef: "intent:identity refs cannot widen envelope scope",
      principalId: "principal_demo",
      agentId: "agent_demo",
      runId: "run_demo",
      runtimeAdapterId: "runtime_codex",
      operatingEnvelopeId: fixture.envelope.envelopeId,
      toolCatalogRef: "tool_catalog_demo@v1",
      actionCatalogRef: "action_catalog_demo@v1",
      gatewayRegistryRef: "gateway_registry@v1",
      candidate: makePackageInstallCandidate(fixture, {
        idempotencyKey: "idem_identity_not_authority",
        resourceRef: "npm:left-pad",
      }),
    });
    expect(rejected.candidateAction.candidateStatus).toBe("rejected");
    expect(rejected.overreachReasonCodes).toContain("envelope_resource_not_allowed");

    const compilation = await fixture.kernel.compileIntent({
      tenantId: "tenant_demo",
      organizationId: "org_demo",
      principalIntentRef: "intent:install hono with external identity evidence",
      principalId: "principal_demo",
      agentId: "agent_demo",
      runId: "run_demo",
      runtimeAdapterId: "runtime_codex",
      operatingEnvelopeId: fixture.envelope.envelopeId,
      toolCatalogRef: "tool_catalog_demo@v1",
      actionCatalogRef: "action_catalog_demo@v1",
      gatewayRegistryRef: "gateway_registry@v1",
      candidate: makePackageInstallCandidate(fixture, {
        idempotencyKey: "idem_identity_evidence",
        sequenceNumber: 2,
      }),
    });
    const contract = await fixture.kernel.proposeActionContract(
      proposalInputForCompilation(compilation, "test-secret"),
    );
    const contractProjection = projectContractEvidence(contract);

    expect(contract.participantIdentityBindings.map((binding) => binding.participantRole)).toEqual([
      "principal",
      "agent",
    ]);
    expect(contractProjection.participantIdentityBindings).toEqual(contract.participantIdentityBindings);
    expect(
      contractProjection.participantIdentityBindings.every((binding) => binding.authorityPosture === "evidence_only"),
    ).toBe(true);

    const policy = await fixture.kernel.evaluatePolicy({
      actionContractId: contract.actionContractId,
      envelopeId: fixture.envelope.envelopeId,
      signingSecret: "test-secret",
    });
    expect(policy.decision.decision).toBe("greenlight");
    expect(policy.greenlight).not.toBeNull();

    const gate = await fixture.kernel.gatewayCheck({
      actionContractId: contract.actionContractId,
      greenlightId: policy.greenlight!.greenlightId,
      observedParameters: contract.parameters,
      surfaceOperationRef: "surface-op:identity-binding",
    });
    const transactionEnvelope = await projectAgentTransactionEnvelope({
      contract,
      policyDecision: policy.decision,
      greenlight: policy.greenlight,
      gateAttempt: gate.gateAttempt,
      mutationAttempt: gate.mutationAttempt,
      receipt: gate.receipt,
    });
    expect(transactionEnvelope.participantIdentityBindings).toEqual(contract.participantIdentityBindings);
    expect(JSON.stringify(transactionEnvelope)).not.toContain("sess_");
    expect(JSON.stringify(transactionEnvelope)).not.toContain("__session");

    const signers = hmacCertificateSigners();
    const certificate = await fixture.kernel.createAuthorityCertificate({
      terminalObjectRef: `receipt:${gate.receipt.receiptId}`,
      signers,
    });
    const verification = await verifyAuthorityCertificate(certificate, {
      keys: signers.map((signer) => ({
        keyIdentityRef: signer.keyIdentityRef,
        signerRole: signer.signerRole,
        algorithm: signer.algorithm,
        publicKeyEd25519: null,
        hmacSecret: signer.hmacSecret,
        status: "active" as const,
      })),
      allowDevHmac: true,
    });

    expect(certificate.envelope.participantIdentityBindings).toEqual(contract.participantIdentityBindings);
    expect(certificate.signingInputDigest).toBe(await authorityCertificateSigningInputDigest(certificate));
    expect(verification.outcome).toBe("verified");
  });

  it("rejects participant identity bindings that do not match envelope actors", async () => {
    const fixture = makeKernelFixture();
    fixture.envelope = {
      ...fixture.envelope,
      participantIdentityBindings: [
        {
          participantRole: "principal",
          participantRef: "agent_demo",
          identityProviderRef: "clerk:instance:demo",
          subjectRef: "clerk:user:user_123",
          subjectDigest: null,
          claimsDigest: null,
          verificationEvidenceRef: "evidence:clerk-auth-object:demo",
          bindingEvidenceRef: null,
          issuedAt: null,
          expiresAt: null,
          authorityPosture: "evidence_only",
        },
      ],
    };

    await expect(registerFixtureObjects(fixture)).rejects.toThrow();
  });

  it("includes participant identity bindings in the operating-envelope canonical digest", async () => {
    const base = makeKernelFixture();
    const withClerk = makeKernelFixture();
    withClerk.envelope = {
      ...withClerk.envelope,
      participantIdentityBindings: [
        {
          participantRole: "principal",
          participantRef: "principal_demo",
          identityProviderRef: "clerk:instance:demo",
          subjectRef: "clerk:user:user_123",
          subjectDigest: null,
          claimsDigest: null,
          verificationEvidenceRef: "evidence:clerk-auth-object:demo",
          bindingEvidenceRef: null,
          issuedAt: null,
          expiresAt: null,
          authorityPosture: "evidence_only",
        },
      ],
    };

    await base.kernel.putCatalogObject({ objectType: "operating_envelope", payload: base.envelope });
    await withClerk.kernel.putCatalogObject({ objectType: "operating_envelope", payload: withClerk.envelope });
    const baseEnvelope = await base.store.getRecord("operating_envelope", base.envelope.envelopeId);
    const clerkEnvelope = await withClerk.store.getRecord("operating_envelope", withClerk.envelope.envelopeId);

    expect(baseEnvelope?.canonicalDigest).toMatch(/^sha256:/);
    expect(clerkEnvelope?.canonicalDigest).toMatch(/^sha256:/);
    expect(clerkEnvelope?.canonicalDigest).not.toBe(baseEnvelope?.canonicalDigest);
  });
});

async function participantIdentityBindings() {
  const clerkClaimsDigest = await digestCanonical({
    iss: "https://demo.clerk.accounts.dev",
    sub: "user_123",
    orgId: "org_123",
    claimsProfile: "clerk-auth-object-redacted",
  });
  const erc8004RegistrationDigest = await digestCanonical({
    agentRegistry: "eip155:1:0x7420000000000000000000000000000000000000",
    agentId: "22",
    agentURI: "ipfs://agent-registration-file",
    supportedTrust: ["reputation", "validation"],
  });
  return [
    {
      participantRole: "principal" as const,
      participantRef: "principal_demo",
      identityProviderRef: "clerk:instance:demo",
      subjectRef: "clerk:user:user_123",
      subjectDigest: null,
      claimsDigest: clerkClaimsDigest,
      verificationEvidenceRef: "evidence:clerk-auth-object:demo",
      bindingEvidenceRef: "clerk:org:org_123",
      issuedAt: null,
      expiresAt: null,
      authorityPosture: "evidence_only" as const,
    },
    {
      participantRole: "agent" as const,
      participantRef: "agent_demo",
      identityProviderRef: "erc8004:eip155:1:0x7420000000000000000000000000000000000000",
      subjectRef: "erc8004:eip155:1:0x7420000000000000000000000000000000000000:agent:22",
      subjectDigest: null,
      claimsDigest: erc8004RegistrationDigest,
      verificationEvidenceRef: "evidence:erc8004-registration-file:agent-22",
      bindingEvidenceRef: "erc8004:validation-registry:optional",
      issuedAt: null,
      expiresAt: null,
      authorityPosture: "evidence_only" as const,
    },
  ];
}

function hmacCertificateSigners() {
  return [
    {
      signerRole: "operator_policy" as const,
      keyIdentityRef: "fixture:hmac:operator-policy",
      algorithm: "hmac-sha256" as const,
      hmacSecret: "operator-policy-secret",
    },
    {
      signerRole: "gateway" as const,
      keyIdentityRef: "fixture:hmac:gateway",
      algorithm: "hmac-sha256" as const,
      hmacSecret: "gateway-secret",
    },
  ];
}
