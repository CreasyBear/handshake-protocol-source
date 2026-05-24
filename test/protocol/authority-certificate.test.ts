import { describe, expect, it } from "bun:test";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import {
  authorityCertificateSigningInputDigest,
  buildAuthorityCertificateSigningInput,
  projectAuthorityCertificateJwks,
  projectAuthorityCertificateVerifierKeySet,
  verifyAuthorityCertificate,
  type AuthorityCertificate,
} from "../../src";
import { projectX402AuthorityCertificateEvidenceProfile } from "../../src/conformance";
import type { AuthorityCertificateSignerInput } from "../../src/protocol/areas/authority-certificate";
import { recordUnknownDownstreamProofGap } from "../support/fixtures";
import {
  makeKernelFixture,
  makePackageInstallCandidate,
  futureIso,
  proposalInputForCompilation,
  registerFixtureObjects,
} from "../support/fixtures";
import { createContractRequiringGatewayCheckedPosture } from "../support/kernel-invariant-helpers";
import type {
  GatewayCredentialRef,
  RegisterGatewayCredentialRefInput,
} from "../../src/protocol/areas/credential-custody";
import type { Refusal } from "../../src/protocol/public/schemas";

const ED25519_ALGORITHM = { name: "Ed25519" } as Algorithm;

describe("AuthorityCertificate foundation", () => {
  it("mints a terminal receipt certificate and verifies offline with pinned Ed25519 trust material", async () => {
    const fixture = await createGreenlitContractWithObligation();
    const gate = await fixture.kernel.gatewayCheck({
      actionContractId: fixture.contract.actionContractId,
      greenlightId: fixture.greenlight.greenlightId,
      observedParameters: { package: "hono", versionRange: "^4.12.19" },
    });
    const signers = await fixtureEd25519Signers();

    const certificate = await fixture.kernel.createAuthorityCertificate({
      terminalObjectRef: `receipt:${gate.receipt.receiptId}`,
      signers: signerInputs(signers),
    });
    const record = await fixture.store.getRecord("authority_certificate", certificate.authorityCertificateId);
    const result = await verifyAuthorityCertificate(certificate, trustMaterial(signers));

    expect(record?.payload).toEqual(certificate);
    expect(certificate.terminal.terminalKind).toBe("receipt");
    expect(certificate.envelope.gatewayAdmissionStatus).toBe("admitted");
    expect(certificate.signatures.map((signature) => signature.signerRole).sort()).toEqual([
      "gateway",
      "operator_policy",
    ]);
    expect(certificate.signingInputDigest).toBe(await authorityCertificateSigningInputDigest(certificate));
    expect(buildAuthorityCertificateSigningInput(certificate)).not.toHaveProperty("signatures");
    expect(buildAuthorityCertificateSigningInput(certificate)).not.toHaveProperty("signingInputDigest");
    expect(result.outcome).toBe("verified");
    expect(result.authorityCreated).toBe(false);
    expect(result.checks.trustMaterial).toBe("passed");
    expect(result.checks.status).toBe("passed");
    expect(result.failures).toEqual([]);
    expect(result.envelope?.clearingEvidenceRefs.obligationRef).toBe("obligation:test-hono-install");

    const x402Profile = projectX402AuthorityCertificateEvidenceProfile(result);
    expect(x402Profile).toMatchObject({
      evidenceProfile: "unsupported_action_class",
      actionClass: "package.install",
      exactPerCallProtectedAction: false,
      provesPaymentSuccess: false,
      provesSettlementFinality: false,
      provesFacilitatorOperation: false,
      provesProviderCustody: false,
      managesPayment: false,
    });
  });

  it("exports certificate JSON that verifies in a subprocess without protocol store access", async () => {
    const { certificate, signers } = await receiptCertificateFixture();
    const directory = await mkdtemp(join(tmpdir(), "handshake-authority-cert-"));
    const certificatePath = join(directory, "cert.json");
    const trustPath = join(directory, "trust.json");
    await writeFile(certificatePath, JSON.stringify(certificate));
    await writeFile(trustPath, JSON.stringify(trustMaterial(signers)));

    const sourceIndexUrl = pathToFileURL(join(process.cwd(), "src/index.ts")).href;
    const script = `
      const { verifyAuthorityCertificate } = await import(${JSON.stringify(sourceIndexUrl)});
      const cert = JSON.parse(await Bun.file(${JSON.stringify(certificatePath)}).text());
      const trust = JSON.parse(await Bun.file(${JSON.stringify(trustPath)}).text());
      const result = await verifyAuthorityCertificate(cert, trust);
      console.log(JSON.stringify({ outcome: result.outcome, failures: result.failures }));
      process.exit(result.outcome === "verified" ? 0 : 1);
    `;
    const subprocess = Bun.spawnSync({
      cmd: [process.execPath, "-e", script],
      stdout: "pipe",
      stderr: "pipe",
    });
    const stdout = new TextDecoder().decode(subprocess.stdout).trim();

    expect(subprocess.exitCode).toBe(0);
    expect(JSON.parse(stdout)).toEqual({ outcome: "verified", failures: [] });
  });

  it("fails verification when the signed envelope is tampered without a digest update", async () => {
    const { certificate, signers } = await receiptCertificateFixture();
    const tampered = structuredClone(certificate);
    tampered.envelope.resourceRef = "npm:left-pad";

    const result = await verifyAuthorityCertificate(tampered, trustMaterial(signers));

    expect(result.outcome).toBe("refused");
    expect(result.failures.map((failure) => failure.code)).toContain("envelope_digest_mismatch");
  });

  it("fails verification when visible certificate annotations are tampered", async () => {
    const fixture = await createGreenlitContractWithObligation();
    const gate = await fixture.kernel.gatewayCheck({
      actionContractId: fixture.contract.actionContractId,
      greenlightId: fixture.greenlight.greenlightId,
      observedParameters: { package: "hono", versionRange: "^4.12.19" },
    });
    const signers = await fixtureEd25519Signers();
    const certificate = await fixture.kernel.createAuthorityCertificate({
      terminalObjectRef: `receipt:${gate.receipt.receiptId}`,
      signers: signerInputs(signers),
      consumerBindings: [
        {
          bindingKind: "counterparty_receipt",
          bindingRef: "counterparty:npm-registry",
          digest: null,
        },
      ],
      extensions: { verifierNote: "signed annotation" },
    });
    const tampered = structuredClone(certificate);
    tampered.consumerBindings[0] = {
      bindingKind: "counterparty_receipt",
      bindingRef: "counterparty:attacker",
      digest: null,
    };
    tampered.extensions = { verifierNote: "tampered annotation" };

    const result = await verifyAuthorityCertificate(tampered, trustMaterial(signers));

    expect(buildAuthorityCertificateSigningInput(certificate)).toHaveProperty("consumerBindings");
    expect(buildAuthorityCertificateSigningInput(certificate)).toHaveProperty("extensions");
    expect(result.outcome).toBe("refused");
    expect(result.failures.map((failure) => failure.code)).toContain("signing_input_digest_mismatch");
    expect(result.failures.map((failure) => failure.code)).toContain("signature_signed_over_mismatch");
  });

  it("fails verification when admitted gateway evidence is missing the gateway signer", async () => {
    const { certificate, signers } = await receiptCertificateFixture();
    const stripped = {
      ...certificate,
      signatures: certificate.signatures.filter((signature) => signature.signerRole !== "gateway"),
    };

    const result = await verifyAuthorityCertificate(stripped, trustMaterial(signers));

    expect(result.outcome).toBe("refused");
    expect(result.failures.map((failure) => failure.code)).toContain("required_signer_missing");
  });

  it("fails verification against the wrong pinned Ed25519 key material", async () => {
    const { certificate } = await receiptCertificateFixture();
    const wrongSigners = await fixtureEd25519Signers();

    const result = await verifyAuthorityCertificate(certificate, trustMaterial(wrongSigners));

    expect(result.outcome).toBe("refused");
    expect(result.failures.map((failure) => failure.code)).toContain("signature_invalid");
  });

  it("verifies a policy-only refusal with the operator policy signer only", async () => {
    const fixture = await createContractRequiringGatewayCheckedPosture("idem_cert_policy_refusal");
    const signers = await fixtureEd25519Signers();
    const policy = await fixture.kernel.evaluatePolicy({
      actionContractId: fixture.contract.actionContractId,
      envelopeId: fixture.envelope.envelopeId,
    });
    const refusals = await fixture.store.listRecordsByType<Refusal>("refusal");
    const refusal = refusals.at(-1)?.payload;
    if (!refusal) throw new Error("expected policy refusal");

    expect(policy.greenlight).toBeNull();
    const certificate = await fixture.kernel.createAuthorityCertificate({
      terminalObjectRef: `refusal:${refusal.refusalId}`,
      signers: signerInputs(signers).filter((signer) => signer.signerRole === "operator_policy"),
    });
    const result = await verifyAuthorityCertificate(certificate, trustMaterial(signers));

    expect(certificate.terminal.terminalKind).toBe("durable_refusal");
    expect(certificate.verificationPolicy.requiredSignerRoles).toEqual(["operator_policy"]);
    expect(certificate.envelope.gatewayAdmissionStatus).toBe("not_requested");
    expect(result.outcome).toBe("verified");
  });

  it("mints and verifies a proof-gap certificate after downstream finality remains unknown", async () => {
    const fixture = await createGreenlitContractWithObligation();
    const gate = await fixture.kernel.gatewayCheck({
      actionContractId: fixture.contract.actionContractId,
      greenlightId: fixture.greenlight.greenlightId,
      observedParameters: { package: "hono", versionRange: "^4.12.19" },
    });
    const proofGap = await recordUnknownDownstreamProofGap(fixture, gate);
    const signers = await fixtureEd25519Signers();

    const certificate = await fixture.kernel.createAuthorityCertificate({
      terminalObjectRef: `proof_gap:${proofGap.proofGapId}`,
      signers: signerInputs(signers),
    });
    const result = await verifyAuthorityCertificate(certificate, trustMaterial(signers));

    expect(certificate.terminal.terminalKind).toBe("proof_gap");
    expect(certificate.envelope.proofGapRefs).toContain(proofGap.proofGapId);
    expect(result.outcome).toBe("verified");
  });

  it("embeds assembled custody, recovery, isolation, and idempotency evidence in terminal certificates", async () => {
    const fixture = makeKernelFixture();
    await registerFixtureObjects(fixture);
    const credentialRef = await fixture.kernel.registerGatewayCredentialRef(certificateCredentialRefInput());
    const compilation = await fixture.kernel.compileIntent({
      tenantId: "tenant_demo",
      organizationId: "org_demo",
      principalIntentRef: "intent:install hono with certificate evidence",
      principalId: "principal_demo",
      agentId: "agent_demo",
      runId: "run_demo",
      runtimeAdapterId: "runtime_codex",
      operatingEnvelopeId: fixture.envelope.envelopeId,
      toolCatalogRef: "tool_catalog_demo@v1",
      actionCatalogRef: "action_catalog_demo@v1",
      gatewayRegistryRef: "gateway_registry@v1",
      candidate: makePackageInstallCandidate(fixture, {
        idempotencyKey: "idem_authority_certificate_evidence",
        gatewayCredentialRefs: [certificateCredentialBindingFor(credentialRef)],
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
      surfaceOperationRef: "surface-op:authority-certificate-evidence",
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
      providerRequestRef: "provider-request:authority-certificate",
      providerOperationRef: "provider-operation:authority-certificate",
      evidenceRefs: ["evidence:credential-resolution:authority-certificate"],
    });
    const reconciliation = await fixture.kernel.reconcileSurfaceOperation({
      mutationAttemptId: gate.mutationAttempt.mutationAttemptId,
      idempotencyKey: contract.idempotencyKey,
      observedSurfaceOperationRef: "surface-op:authority-certificate-evidence",
      observedDownstreamStatus: "unknown",
      evidenceRefs: [],
      resolvedProofGapIds: [],
      orphanIsolationRequested: true,
    });
    if (!reconciliation.createdProofGap) throw new Error("expected proof gap");
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
    const signers = await fixtureEd25519Signers();

    const certificate = await fixture.kernel.createAuthorityCertificate({
      terminalObjectRef: `proof_gap:${reconciliation.createdProofGap.proofGapId}`,
      signers: signerInputs(signers),
    });
    const result = await verifyAuthorityCertificate(certificate, trustMaterial(signers));

    expect(certificate.envelope.credentialResolutionEvidenceRefs).toContain(
      `credential_resolution_evidence:${credentialEvidence.credentialResolutionEvidenceId}`,
    );
    expect(certificate.envelope.idempotencyLedgerRef).not.toBeNull();
    expect(certificate.envelope.recoveryRefs).toContain(`recovery_recommendation:${recovery.recoveryRecommendationId}`);
    expect(certificate.envelope.isolationRefs.some((ref) => ref.startsWith("isolation_state:"))).toBe(true);
    expect(certificate.artifacts.map((artifact) => artifact.kind)).toEqual(
      expect.arrayContaining([
        "credential_resolution_evidence",
        "idempotency_ledger_entry",
        "recovery_recommendation",
        "isolation_state",
        "surface_operation_reconciliation",
      ]),
    );
    expect(result.outcome).toBe("verified");
  });

  it("mints and verifies a replay-refusal certificate without mutation authority", async () => {
    const fixture = await createGreenlitContractWithObligation();
    await fixture.kernel.gatewayCheck({
      actionContractId: fixture.contract.actionContractId,
      greenlightId: fixture.greenlight.greenlightId,
      observedParameters: { package: "hono", versionRange: "^4.12.19" },
    });
    const replay = await fixture.kernel.gatewayCheck({
      actionContractId: fixture.contract.actionContractId,
      greenlightId: fixture.greenlight.greenlightId,
      observedParameters: { package: "hono", versionRange: "^4.12.19" },
    });
    const signers = await fixtureEd25519Signers();

    const certificate = await fixture.kernel.createAuthorityCertificate({
      terminalObjectRef: `receipt:${replay.receipt.receiptId}`,
      signers: signerInputs(signers),
    });
    const result = await verifyAuthorityCertificate(certificate, trustMaterial(signers));

    expect(certificate.terminal.terminalKind).toBe("replay_refusal");
    expect(certificate.envelope.greenlightConsumptionStatus).toBe("replayed");
    expect(certificate.envelope.gatewayAdmissionStatus).toBe("replayed");
    expect(result.outcome).toBe("verified");
  });

  it("rejects non-terminal certificate minting", async () => {
    const fixture = await createGreenlitContractWithObligation();
    const signers = await fixtureEd25519Signers();

    await expect(
      fixture.kernel.createAuthorityCertificate({
        terminalObjectRef: `action_contract:${fixture.contract.actionContractId}`,
        signers: signerInputs(signers),
      }),
    ).rejects.toThrow("AuthorityCertificate may be minted only");
  });

  it("does not accept propose-time HMAC contract signatures as portable certificate authority", async () => {
    const { certificate, signers, contractSignature } = await receiptCertificateFixture();
    const forged = structuredClone(certificate);
    forged.signatures = [
      {
        signerRole: "operator_policy",
        keyIdentityRef: "local:hmac",
        algorithm: "hmac-sha256",
        signedOver: certificate.signingInputDigest,
        signature: contractSignature,
      },
      {
        signerRole: "gateway",
        keyIdentityRef: "local:hmac",
        algorithm: "hmac-sha256",
        signedOver: certificate.signingInputDigest,
        signature: contractSignature,
      },
    ];

    const result = await verifyAuthorityCertificate(forged, {
      keys: [
        {
          keyIdentityRef: "local:hmac",
          signerRole: null,
          algorithm: "hmac-sha256",
          publicKeyEd25519: null,
          hmacSecret: "test-secret",
          status: "active",
        },
      ],
      allowDevHmac: true,
    });
    const productionResult = await verifyAuthorityCertificate(forged, trustMaterial(signers));

    expect(result.outcome).toBe("refused");
    expect(result.failures.map((failure) => failure.code)).toContain("signature_invalid");
    expect(productionResult.failures.map((failure) => failure.code)).toContain("hmac_not_allowed");
  });

  it("separates issuer, role, retired, revoked, stale, and status-unavailable trust failures", async () => {
    const { certificate, signers } = await receiptCertificateFixture();
    const baseTrust = trustMaterial(signers);

    const cases: {
      name: string;
      trust: Parameters<typeof verifyAuthorityCertificate>[1];
      expectedOutcome: "refused" | "proof_gap";
      expectedCode: Awaited<ReturnType<typeof verifyAuthorityCertificate>>["failures"][number]["code"];
    }[] = [
      {
        name: "unknown issuer",
        trust: {
          ...baseTrust,
          keys: baseTrust.keys.map((key) => ({ ...key, issuerRef: "issuer:missing" })),
          issuers: [],
        },
        expectedOutcome: "refused",
        expectedCode: "trust_issuer_unknown",
      },
      {
        name: "role mismatch",
        trust: {
          ...baseTrust,
          keys: baseTrust.keys.map((key) => ({
            ...key,
            signerRole: key.signerRole === "gateway" ? "operator_policy" : "gateway",
          })),
        },
        expectedOutcome: "refused",
        expectedCode: "trust_key_role_mismatch",
      },
      {
        name: "retired key",
        trust: { ...baseTrust, keys: baseTrust.keys.map((key) => ({ ...key, status: "retired" as const })) },
        expectedOutcome: "refused",
        expectedCode: "trust_key_retired",
      },
      {
        name: "revoked key",
        trust: { ...baseTrust, keys: baseTrust.keys.map((key) => ({ ...key, status: "revoked" as const })) },
        expectedOutcome: "refused",
        expectedCode: "trust_key_revoked",
      },
      {
        name: "stale key",
        trust: { ...baseTrust, keys: baseTrust.keys.map((key) => ({ ...key, status: "stale" as const })) },
        expectedOutcome: "refused",
        expectedCode: "trust_key_stale",
      },
      {
        name: "status unavailable",
        trust: {
          ...baseTrust,
          keys: baseTrust.keys.map((key) => ({ ...key, status: "status_unavailable" as const })),
        },
        expectedOutcome: "proof_gap",
        expectedCode: "trust_status_unavailable",
      },
    ];

    for (const testCase of cases) {
      const result = await verifyAuthorityCertificate(certificate, testCase.trust);
      expect(result.outcome, testCase.name).toBe(testCase.expectedOutcome);
      expect(
        result.failures.map((failure) => failure.code),
        testCase.name,
      ).toContain(testCase.expectedCode);
      if (testCase.expectedCode === "trust_status_unavailable") {
        expect(result.checks.status, testCase.name).toBe("proof_gap");
      } else {
        expect(result.checks.trustMaterial, testCase.name).not.toBe("passed");
      }
    }
  });

  it("projects verifier key sets and JWKS as public material only, not trust or authority", async () => {
    const signers = await fixtureEd25519Signers();
    const trust = {
      ...trustMaterial(signers),
      keys: [
        ...trustMaterial(signers).keys,
        {
          keyIdentityRef: "fixture:hmac:dev",
          signerRole: null,
          algorithm: "hmac-sha256" as const,
          publicKeyEd25519: null,
          hmacSecret: "dev-secret-must-not-project",
          status: "active" as const,
        },
      ],
      issuers: [
        {
          issuerRef: "issuer:fixture",
          issuerDigest: `sha256:${"7".repeat(64)}`,
          status: "active" as const,
          validFrom: null,
          validUntil: null,
          metadataRefs: ["evidence:issuer-fixture"],
        },
      ],
    };

    const keySet = projectAuthorityCertificateVerifierKeySet(trust);
    const jwks = projectAuthorityCertificateJwks(trust);
    const rendered = JSON.stringify({ keySet, jwks });

    expect(keySet.authorityCreated).toBe(false);
    expect(keySet.trustDecision).toBe("caller_pinned_trust_material_only");
    expect(keySet.keys).toHaveLength(2);
    expect(keySet.omittedPrivateKeyCount).toBe(1);
    expect(jwks.authorityCreated).toBe(false);
    expect(jwks.trustDecision).toBe("jwks_projection_only");
    expect(jwks.jwks.keys).toHaveLength(2);
    expect(jwks.jwks.keys[0]).toMatchObject({ kty: "OKP", crv: "Ed25519", alg: "EdDSA", use: "sig" });
    expect(rendered).not.toContain("dev-secret-must-not-project");
    expect(rendered).not.toContain("privateKey");
    expect(rendered).not.toContain("hmacSecret");
  });
});

async function receiptCertificateFixture(): Promise<{
  certificate: AuthorityCertificate;
  signers: FixtureEd25519Signer[];
  contractSignature: `hmac-sha256:${string}`;
}> {
  const fixture = await createGreenlitContractWithObligation();
  const gate = await fixture.kernel.gatewayCheck({
    actionContractId: fixture.contract.actionContractId,
    greenlightId: fixture.greenlight.greenlightId,
    observedParameters: { package: "hono", versionRange: "^4.12.19" },
  });
  const signers = await fixtureEd25519Signers();
  const certificate = await fixture.kernel.createAuthorityCertificate({
    terminalObjectRef: `receipt:${gate.receipt.receiptId}`,
    signers: signerInputs(signers),
  });
  const contractSignature = fixture.contract.contractSignature;
  if (!contractSignature?.startsWith("hmac-sha256:")) throw new Error("expected fixture contract signature");
  return { certificate, signers, contractSignature: contractSignature as `hmac-sha256:${string}` };
}

async function createGreenlitContractWithObligation() {
  const fixture = makeKernelFixture();
  await registerFixtureObjects(fixture);
  const compilation = await fixture.kernel.compileIntent({
    tenantId: "tenant_demo",
    organizationId: "org_demo",
    principalIntentRef: "intent:install hono",
    principalId: "principal_demo",
    agentId: "agent_demo",
    runId: "run_demo",
    runtimeAdapterId: "runtime_codex",
    operatingEnvelopeId: "env_demo",
    toolCatalogRef: "tool_catalog_demo@v1",
    actionCatalogRef: "action_catalog_demo@v1",
    gatewayRegistryRef: "gateway_registry@v1",
    generatedCodeOrSpecRefs: ["code:generated-plan"],
    declaredAssumptions: ["package name is explicit"],
    requiredEvidenceRefs: ["evidence:package-lock-diff"],
    candidate: makePackageInstallCandidate(fixture, {
      clearingEvidenceRefs: {
        obligationRef: "obligation:test-hono-install",
        counterpartyRef: "counterparty:npm-registry",
      },
    }),
  });
  const contract = await fixture.kernel.proposeActionContract(proposalInputForCompilation(compilation, "test-secret"));
  const policy = await fixture.kernel.evaluatePolicy({
    actionContractId: contract.actionContractId,
    envelopeId: fixture.envelope.envelopeId,
    signingSecret: "test-secret",
  });
  if (!policy.greenlight) throw new Error("expected greenlight");
  return { ...fixture, compilation, contract, decision: policy.decision, greenlight: policy.greenlight };
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
    algorithm: "ed25519" as const,
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

function certificateCredentialRefInput(): RegisterGatewayCredentialRefInput {
  return {
    tenantId: "tenant_demo",
    organizationId: "org_demo",
    gatewayCredentialRefId: "gcr_certificate_package_manager_token",
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

function certificateCredentialBindingFor(credentialRef: GatewayCredentialRef) {
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
