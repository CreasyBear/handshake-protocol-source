import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import assert from "node:assert/strict";
import { Client, StdioClientTransport } from "@modelcontextprotocol/client";

const pkg = JSON.parse(readFileSync("package.json", "utf8"));
const serverJson = JSON.parse(readFileSync("server.json", "utf8"));

assert.notEqual(pkg.private, true, "package.json must not be private when publish readiness is claimed");
assert.equal(pkg.mcpName, serverJson.name, "package.json mcpName must match server.json name");
assert.equal(serverJson.version, pkg.version, "server.json version must match package.json version");
assert.equal(serverJson.packages?.[0]?.registryType, "npm");
assert.equal(serverJson.packages?.[0]?.identifier, pkg.name);
assert.equal(serverJson.packages?.[0]?.version, pkg.version);
assert.equal(serverJson.packages?.[0]?.transport?.type, "stdio");

const requiredPublishedFiles = [
  "bin/handshake",
  "bin/handshake-mcp",
  "dist/index.mjs",
  "dist/adapter-sdk/index.mjs",
  "dist/cli/index.mjs",
  "dist/mcp/index.mjs",
  "dist/surfaces/a2a-negotiation-readback/index.mjs",
  "dist/x402-protected-tool/index.mjs",
  "dist/bin/handshake.mjs",
  "dist/bin/handshake-mcp.mjs",
];

for (const file of requiredPublishedFiles) {
  assert.equal(existsSync(file), true, `${file} must exist after npm run build`);
}

for (const file of ["bin/handshake", "bin/handshake-mcp"]) {
  assert.match(readFileSync(file, "utf8"), /^#!\/usr\/bin\/env node\n/u, `${file} must be a Node executable`);
}

const cli = spawnSync(process.execPath, ["bin/handshake", "schema"], { encoding: "utf8" });
if (cli.status !== 0) {
  process.stderr.write(cli.stderr);
  process.stderr.write(cli.stdout);
  process.exit(cli.status ?? 1);
}

const cliOutput = JSON.parse(cli.stdout);
assert.equal(cliOutput.command, "schema");
assert.equal(cliOutput.authorityCreated, false);
assert.equal(cliOutput.greenlightCreated, false);
assert.equal(cliOutput.gatewayCheckPerformed, false);
assert.equal(cliOutput.mutationAttempted, false);
assert.equal(cliOutput.rawInternalRecordIncluded, false);
assert.equal(cliOutput.credentialMaterialIncluded, false);
assert.ok(cliOutput.nonClaims.includes("broad MCP/CLI/browser/shell/network control"));

await checkMcpStdioBin();
await checkRoleClientsSubpath();
await checkA2ANegotiationReadbackSubpath();
await checkX402ProtectedToolSubpath();

async function checkRoleClientsSubpath() {
  const roleClients = await import("handshake-protocol-kernel/sdk/role-clients");
  const exportNames = Object.keys(roleClients).sort();
  assert.deepEqual(exportNames, [
    "ControlPlaneClient",
    "EvidenceClient",
    "GatewayClient",
    "HandshakeClientError",
    "InstallClient",
    "PolicyClient",
    "RuntimeClient",
  ]);
  assert.equal(typeof roleClients.InstallClient, "function");
  assert.equal(typeof roleClients.PolicyClient, "function");
  assert.equal("HandshakeClient" in roleClients, false);
  assert.equal(/ReceiptExport|AuthorityCertificateMint|PaymentPayload/u.test(exportNames.join(" ")), false);
}

async function checkA2ANegotiationReadbackSubpath() {
  const readback = await import("handshake-protocol-kernel/surfaces/a2a-negotiation-readback");
  const exportNames = Object.keys(readback).sort();
  assert.deepEqual(exportNames, [
    "A2ANegotiationProductReadbackSchema",
    "A2ANegotiationReadbackInputSchema",
    "a2aNegotiationReadbackNonClaims",
    "projectA2ANegotiationProductReadback",
    "renderA2ANegotiationAgentHandoff",
    "renderA2ANegotiationCustomerReadback",
  ]);
  assert.equal(typeof readback.projectA2ANegotiationProductReadback, "function");
  assert.equal(typeof readback.renderA2ANegotiationCustomerReadback, "function");
  assert.equal(typeof readback.renderA2ANegotiationAgentHandoff, "function");
  assert.equal("HandshakeKernel" in readback, false);
  assert.equal("PolicyClient" in readback, false);
  assert.equal(
    /GatewayCheck|GreenlightSchema|PaymentPayload|PAYMENT-SIGNATURE|runX402WalletGateway/u.test(exportNames.join(" ")),
    false,
  );
}

async function checkX402ProtectedToolSubpath() {
  const x402Tool = await import("handshake-protocol-kernel/x402-protected-tool");
  assert.equal(x402Tool.X402_PROTECTED_TOOL_NAME, "handshake.actions.x402_payment.propose");
  assert.equal(typeof x402Tool.prepareProtectedX402ToolDispatch, "function");
  assert.equal(typeof x402Tool.buildProtectedX402ToolHostProfile, "function");
  assert.equal(typeof x402Tool.buildCodexX402ProtectedToolActivation, "function");
  assert.equal(typeof x402Tool.buildClaudeCodeX402ProtectedToolActivation, "function");
  assert.equal(typeof x402Tool.buildHermesX402ProtectedToolActivation, "function");
  assert.equal(typeof x402Tool.buildOpenClawX402ProtectedToolActivation, "function");

  const facadeInput = referenceProtectedToolInput();
  const dispatch = x402Tool.prepareProtectedX402ToolDispatch(facadeInput);
  assert.equal(dispatch.outcome, "dispatch_block_prepared");
  assert.equal(dispatch.authorityCreated, false);
  assert.equal(dispatch.greenlightCreated, false);
  assert.equal(dispatch.gatewayCheckPerformed, false);
  assert.equal(dispatch.mutationAttempted, false);
  assert.equal(dispatch.productBinding.gatewayId, "gateway_x402_package_smoke");
  assert.equal(dispatch.productBinding.gatewayReadinessDigest, facadeInput.gatewayReadinessDigest);
  assert.equal(dispatch.productBinding.gatewayCredentialRefDigest, facadeInput.gatewayCredentialRefDigest);
  assert.equal(dispatch.productBinding.gatewayCustodyProofPacketDigest, facadeInput.gatewayCustodyProofPacketDigest);
  assert.equal(dispatch.productBinding.readinessProofLevel, "control_plane_registration");
  assert.equal(dispatch.idempotencyKey, "idem:x402:package-smoke");

  const profile = x402Tool.buildProtectedX402ToolHostProfile({
    profileId: "profile_package_smoke_codex",
    hostFamily: "codex_local",
    hostProfileRef: "profile:codex:package-smoke",
    runtimeAdapterRef: "adapter:codex:package-smoke",
    toolCatalogDigest: facadeInput.toolCatalogDigest,
    metadataDigest: facadeInput.metadataDigest,
    gatewayReadiness: {
      readinessStatus: "trusted_gateway_ready",
      readinessScope: "pre_contract",
      readinessProofLevel: "control_plane_registration",
      trustedReadiness: true,
      requiredNextMechanism: "ready_for_runtime_facade",
      gatewayReadinessRef: facadeInput.gatewayReadinessRef,
      gatewayReadinessDigest: facadeInput.gatewayReadinessDigest,
      readinessExpiresAt: facadeInput.readinessExpiresAt,
      installDigest: facadeInput.installDigest,
      probePostureDigest: facadeInput.probePostureDigest,
      paymentRequirementsDigest: facadeInput.paymentRequirementsDigest,
      selectedPaymentRequirementDigest: facadeInput.selectedPaymentRequirementDigest,
      gatewayId: "gateway_x402_package_smoke",
      gatewayRegistrationRef: facadeInput.gatewayRegistrationRef,
      gatewayCredentialRefDigest: facadeInput.gatewayCredentialRefDigest,
      gatewayCredentialCustodyStatus: "gateway_held",
      gatewayCustodyProofPacketRef: facadeInput.gatewayCustodyProofPacketRef,
      gatewayCustodyProofPacketDigest: facadeInput.gatewayCustodyProofPacketDigest,
      gatewayCustodyClaimLevel: "customer_gateway_evidence",
      gatewayCustodyExternalVerificationStatus: "verified_by_official_source",
      gatewayCustodyProofExpiresAt: facadeInput.gatewayCustodyProofExpiresAt,
      gatewayPosture: "online",
      policyVersionRef: facadeInput.policyVersionRef,
      policyVersionDigest: facadeInput.policyVersionDigest,
      gatewayRegistryEntryRef: facadeInput.gatewayRegistryEntryId,
      operatingEnvelopeRef: facadeInput.operatingEnvelopeId,
      rawCredentialRefsIncluded: false,
      proofGapReasonCodes: [],
      evidenceRefs: ["evidence:x402:package-smoke:readiness"],
    },
    facadeInput,
    transcriptRef: "transcript:x402:package-smoke",
    evidenceRefs: ["evidence:x402:package-smoke:profile"],
  });
  assert.equal(profile.outcome, "profile_prepared");
  assert.equal(profile.authorityCreated, false);
  assert.equal(profile.gatewayCheckPerformed, false);
  assert.equal(profile.mutationAttempted, false);
  assert.equal(profile.authorityBoundary.invokesSigner, false);
  const activation = x402Tool.buildCodexX402ProtectedToolActivation({
    activationId: "activation_package_smoke_codex",
    packageIdentifier: pkg.name,
    packageVersion: pkg.version,
    profileInput: {
      profileId: "profile_package_smoke_codex",
      hostFamily: "codex_local",
      hostProfileRef: "profile:codex:package-smoke",
      runtimeAdapterRef: "adapter:codex:package-smoke",
      toolCatalogDigest: facadeInput.toolCatalogDigest,
      metadataDigest: facadeInput.metadataDigest,
      gatewayReadiness: {
        readinessStatus: "trusted_gateway_ready",
        readinessScope: "pre_contract",
        readinessProofLevel: "control_plane_registration",
        trustedReadiness: true,
        requiredNextMechanism: "ready_for_runtime_facade",
        gatewayReadinessRef: facadeInput.gatewayReadinessRef,
        gatewayReadinessDigest: facadeInput.gatewayReadinessDigest,
        readinessExpiresAt: facadeInput.readinessExpiresAt,
        installDigest: facadeInput.installDigest,
        probePostureDigest: facadeInput.probePostureDigest,
        paymentRequirementsDigest: facadeInput.paymentRequirementsDigest,
        selectedPaymentRequirementDigest: facadeInput.selectedPaymentRequirementDigest,
        gatewayId: "gateway_x402_package_smoke",
        gatewayRegistrationRef: facadeInput.gatewayRegistrationRef,
        gatewayCredentialRefDigest: facadeInput.gatewayCredentialRefDigest,
        gatewayCredentialCustodyStatus: "gateway_held",
        gatewayCustodyProofPacketRef: facadeInput.gatewayCustodyProofPacketRef,
        gatewayCustodyProofPacketDigest: facadeInput.gatewayCustodyProofPacketDigest,
        gatewayCustodyClaimLevel: "customer_gateway_evidence",
        gatewayCustodyExternalVerificationStatus: "verified_by_official_source",
        gatewayCustodyProofExpiresAt: facadeInput.gatewayCustodyProofExpiresAt,
        gatewayPosture: "online",
        policyVersionRef: facadeInput.policyVersionRef,
        policyVersionDigest: facadeInput.policyVersionDigest,
        gatewayRegistryEntryRef: facadeInput.gatewayRegistryEntryId,
        operatingEnvelopeRef: facadeInput.operatingEnvelopeId,
        rawCredentialRefsIncluded: false,
        proofGapReasonCodes: [],
        evidenceRefs: ["evidence:x402:package-smoke:readiness"],
      },
      facadeInput,
      transcriptRef: "transcript:x402:package-smoke",
      evidenceRefs: ["evidence:x402:package-smoke:profile"],
    },
    args: ["-y", `${pkg.name}@${pkg.version}`, "handshake-mcp"],
    observedAt: "2026-05-25T00:00:00.000Z",
    expiresAt: "2099-01-01T00:00:00.000Z",
    configDigest: digestMcp({ config: "codex-package-smoke" }),
    hostToolDigest: digestMcp({ host: "codex-package-smoke" }),
    toolListDigest: digestMcp({ tools: ["handshake.actions.x402_payment.propose"] }),
    evidenceRefs: ["evidence:x402:package-smoke:codex-activation"],
  });
  assert.equal(activation.activationPosture, "host_specific_ready");
  assert.equal(activation.proofPacket.postureState, "READY");
  assert.equal(activation.authorityAudit.authorityCreated, false);
  assert.equal(activation.authorityAudit.gatewayCheckPerformedByArtifact, false);
  assert.equal(activation.harnessReport.authority.hostWideAuthority, false);

  const claudeActivation = x402Tool.buildClaudeCodeX402ProtectedToolActivation({
    activationId: "activation_package_smoke_claude_code",
    packageIdentifier: pkg.name,
    packageVersion: pkg.version,
    profileInput: {
      profileId: "profile_package_smoke_claude_code",
      hostFamily: "claude_code_mcp",
      hostProfileRef: "profile:claude-code:package-smoke",
      runtimeAdapterRef: "adapter:claude-code:package-smoke",
      toolCatalogDigest: facadeInput.toolCatalogDigest,
      metadataDigest: facadeInput.metadataDigest,
      gatewayReadiness: {
        readinessStatus: "trusted_gateway_ready",
        readinessScope: "pre_contract",
        readinessProofLevel: "control_plane_registration",
        trustedReadiness: true,
        requiredNextMechanism: "ready_for_runtime_facade",
        gatewayReadinessRef: facadeInput.gatewayReadinessRef,
        gatewayReadinessDigest: facadeInput.gatewayReadinessDigest,
        readinessExpiresAt: facadeInput.readinessExpiresAt,
        installDigest: facadeInput.installDigest,
        probePostureDigest: facadeInput.probePostureDigest,
        paymentRequirementsDigest: facadeInput.paymentRequirementsDigest,
        selectedPaymentRequirementDigest: facadeInput.selectedPaymentRequirementDigest,
        gatewayId: "gateway_x402_package_smoke",
        gatewayRegistrationRef: facadeInput.gatewayRegistrationRef,
        gatewayCredentialRefDigest: facadeInput.gatewayCredentialRefDigest,
        gatewayCredentialCustodyStatus: "gateway_held",
        gatewayCustodyProofPacketRef: facadeInput.gatewayCustodyProofPacketRef,
        gatewayCustodyProofPacketDigest: facadeInput.gatewayCustodyProofPacketDigest,
        gatewayCustodyClaimLevel: "customer_gateway_evidence",
        gatewayCustodyExternalVerificationStatus: "verified_by_official_source",
        gatewayCustodyProofExpiresAt: facadeInput.gatewayCustodyProofExpiresAt,
        gatewayPosture: "online",
        policyVersionRef: facadeInput.policyVersionRef,
        policyVersionDigest: facadeInput.policyVersionDigest,
        gatewayRegistryEntryRef: facadeInput.gatewayRegistryEntryId,
        operatingEnvelopeRef: facadeInput.operatingEnvelopeId,
        rawCredentialRefsIncluded: false,
        proofGapReasonCodes: [],
        evidenceRefs: ["evidence:x402:package-smoke:readiness"],
      },
      facadeInput,
      transcriptRef: "transcript:x402:package-smoke:claude-code",
      evidenceRefs: ["evidence:x402:package-smoke:claude-code-profile"],
    },
    args: ["-y", `${pkg.name}@${pkg.version}`, "handshake-mcp"],
    observedAt: "2026-05-25T00:00:00.000Z",
    expiresAt: "2099-01-01T00:00:00.000Z",
    configDigest: digestMcp({ config: "claude-code-package-smoke" }),
    hostToolDigest: digestMcp({ host: "claude-code-package-smoke" }),
    toolListDigest: digestMcp({ tools: ["handshake.actions.x402_payment.propose"] }),
    evidenceRefs: ["evidence:x402:package-smoke:claude-code-activation"],
  });
  assert.equal(claudeActivation.activationPosture, "host_specific_ready");
  assert.equal(claudeActivation.proofPacket.postureState, "READY");
  assert.equal(claudeActivation.authorityAudit.authorityCreated, false);
  assert.equal(claudeActivation.authorityAudit.gatewayCheckPerformedByArtifact, false);
  assert.equal(claudeActivation.harnessReport.authority.hostWideAuthority, false);

  const hermesActivation = x402Tool.buildHermesX402ProtectedToolActivation({
    activationId: "activation_package_smoke_hermes",
    packageIdentifier: pkg.name,
    packageVersion: pkg.version,
    profileInput: {
      profileId: "profile_package_smoke_hermes",
      hostFamily: "hermes",
      hostProfileRef: "profile:hermes:package-smoke",
      runtimeAdapterRef: "adapter:hermes:package-smoke",
      toolCatalogDigest: facadeInput.toolCatalogDigest,
      metadataDigest: facadeInput.metadataDigest,
      gatewayReadiness: {
        readinessStatus: "trusted_gateway_ready",
        readinessScope: "pre_contract",
        readinessProofLevel: "control_plane_registration",
        trustedReadiness: true,
        requiredNextMechanism: "ready_for_runtime_facade",
        gatewayReadinessRef: facadeInput.gatewayReadinessRef,
        gatewayReadinessDigest: facadeInput.gatewayReadinessDigest,
        readinessExpiresAt: facadeInput.readinessExpiresAt,
        installDigest: facadeInput.installDigest,
        probePostureDigest: facadeInput.probePostureDigest,
        paymentRequirementsDigest: facadeInput.paymentRequirementsDigest,
        selectedPaymentRequirementDigest: facadeInput.selectedPaymentRequirementDigest,
        gatewayId: "gateway_x402_package_smoke",
        gatewayRegistrationRef: facadeInput.gatewayRegistrationRef,
        gatewayCredentialRefDigest: facadeInput.gatewayCredentialRefDigest,
        gatewayCredentialCustodyStatus: "gateway_held",
        gatewayCustodyProofPacketRef: facadeInput.gatewayCustodyProofPacketRef,
        gatewayCustodyProofPacketDigest: facadeInput.gatewayCustodyProofPacketDigest,
        gatewayCustodyClaimLevel: "customer_gateway_evidence",
        gatewayCustodyExternalVerificationStatus: "verified_by_official_source",
        gatewayCustodyProofExpiresAt: facadeInput.gatewayCustodyProofExpiresAt,
        gatewayPosture: "online",
        policyVersionRef: facadeInput.policyVersionRef,
        policyVersionDigest: facadeInput.policyVersionDigest,
        gatewayRegistryEntryRef: facadeInput.gatewayRegistryEntryId,
        operatingEnvelopeRef: facadeInput.operatingEnvelopeId,
        rawCredentialRefsIncluded: false,
        proofGapReasonCodes: [],
        evidenceRefs: ["evidence:x402:package-smoke:readiness"],
      },
      facadeInput,
      transcriptRef: "transcript:x402:package-smoke:hermes",
      evidenceRefs: ["evidence:x402:package-smoke:hermes-profile"],
    },
    args: ["-y", `${pkg.name}@${pkg.version}`, "handshake-mcp"],
    observedAt: "2026-05-25T00:00:00.000Z",
    expiresAt: "2099-01-01T00:00:00.000Z",
    configDigest: digestMcp({ config: "hermes-package-smoke" }),
    hostToolDigest: digestMcp({ host: "hermes-package-smoke" }),
    toolListDigest: digestMcp({ tools: ["handshake.actions.x402_payment.propose"] }),
    evidenceRefs: ["evidence:x402:package-smoke:hermes-activation"],
  });
  assert.equal(hermesActivation.activationPosture, "host_specific_ready");
  assert.equal(hermesActivation.proofPacket.postureState, "READY");
  assert.equal(hermesActivation.authorityAudit.authorityCreated, false);
  assert.equal(hermesActivation.authorityAudit.gatewayCheckPerformedByArtifact, false);
  assert.equal(hermesActivation.harnessReport.authority.hostWideAuthority, false);

  const openClawActivation = x402Tool.buildOpenClawX402ProtectedToolActivation({
    activationId: "activation_package_smoke_openclaw",
    packageIdentifier: pkg.name,
    packageVersion: pkg.version,
    profileInput: {
      profileId: "profile_package_smoke_openclaw",
      hostFamily: "openclaw",
      hostProfileRef: "profile:openclaw:package-smoke",
      runtimeAdapterRef: "adapter:openclaw:package-smoke",
      toolCatalogDigest: facadeInput.toolCatalogDigest,
      metadataDigest: facadeInput.metadataDigest,
      gatewayReadiness: {
        readinessStatus: "trusted_gateway_ready",
        readinessScope: "pre_contract",
        readinessProofLevel: "control_plane_registration",
        trustedReadiness: true,
        requiredNextMechanism: "ready_for_runtime_facade",
        gatewayReadinessRef: facadeInput.gatewayReadinessRef,
        gatewayReadinessDigest: facadeInput.gatewayReadinessDigest,
        readinessExpiresAt: facadeInput.readinessExpiresAt,
        installDigest: facadeInput.installDigest,
        probePostureDigest: facadeInput.probePostureDigest,
        paymentRequirementsDigest: facadeInput.paymentRequirementsDigest,
        selectedPaymentRequirementDigest: facadeInput.selectedPaymentRequirementDigest,
        gatewayId: "gateway_x402_package_smoke",
        gatewayRegistrationRef: facadeInput.gatewayRegistrationRef,
        gatewayCredentialRefDigest: facadeInput.gatewayCredentialRefDigest,
        gatewayCredentialCustodyStatus: "gateway_held",
        gatewayCustodyProofPacketRef: facadeInput.gatewayCustodyProofPacketRef,
        gatewayCustodyProofPacketDigest: facadeInput.gatewayCustodyProofPacketDigest,
        gatewayCustodyClaimLevel: "customer_gateway_evidence",
        gatewayCustodyExternalVerificationStatus: "verified_by_official_source",
        gatewayCustodyProofExpiresAt: facadeInput.gatewayCustodyProofExpiresAt,
        gatewayPosture: "online",
        policyVersionRef: facadeInput.policyVersionRef,
        policyVersionDigest: facadeInput.policyVersionDigest,
        gatewayRegistryEntryRef: facadeInput.gatewayRegistryEntryId,
        operatingEnvelopeRef: facadeInput.operatingEnvelopeId,
        rawCredentialRefsIncluded: false,
        proofGapReasonCodes: [],
        evidenceRefs: ["evidence:x402:package-smoke:readiness"],
      },
      facadeInput,
      transcriptRef: "transcript:x402:package-smoke:openclaw",
      evidenceRefs: ["evidence:x402:package-smoke:openclaw-profile"],
    },
    args: ["-y", `${pkg.name}@${pkg.version}`, "handshake-mcp"],
    observedAt: "2026-05-25T00:00:00.000Z",
    expiresAt: "2099-01-01T00:00:00.000Z",
    configDigest: digestMcp({ config: "openclaw-package-smoke" }),
    hostToolDigest: digestMcp({ host: "openclaw-package-smoke" }),
    toolListDigest: digestMcp({ tools: ["handshake.actions.x402_payment.propose"] }),
    evidenceRefs: ["evidence:x402:package-smoke:openclaw-activation"],
  });
  assert.equal(openClawActivation.activationPosture, "host_specific_ready");
  assert.equal(openClawActivation.proofPacket.postureState, "READY");
  assert.equal(openClawActivation.authorityAudit.authorityCreated, false);
  assert.equal(openClawActivation.authorityAudit.gatewayCheckPerformedByArtifact, false);
  assert.equal(openClawActivation.harnessReport.authority.hostWideAuthority, false);

  const serialized = JSON.stringify({
    dispatch,
    profile,
    activation,
    claudeActivation,
    hermesActivation,
    openClawActivation,
  });
  assert.equal(serialized.includes("PaymentPayload"), false);
  assert.equal(serialized.includes("PAYMENT-SIGNATURE"), false);
  assert.equal(serialized.includes("privateKey"), false);
  assert.equal(serialized.includes("signerRef"), false);
}

async function checkMcpStdioBin() {
  const client = new Client({ name: "handshake-package-entrypoint-smoke", version: pkg.version });
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: ["bin/handshake-mcp"],
    cwd: process.cwd(),
    stderr: "pipe",
  });
  const stderr = collectText(transport.stderr);

  try {
    await withTimeout(client.connect(transport), 8_000, "connect");
    const tools = await withTimeout(client.listTools(), 8_000, "tools/list");
    assert.deepEqual(tools.tools.map((tool) => tool.name).sort(), [
      "handshake.actions.x402_payment.propose",
      "handshake.evidence.delegation.verify",
    ]);

    const metadataRead = await readJsonResource(client, "handshake://metadata/actions/x402_payment.exact");
    assert.equal(metadataRead.readOnly, true);
    assert.equal(metadataRead.authorityCreated, false);
    assert.equal(metadataRead.gatewayCheckPerformed, false);

    const proposal = await withTimeout(
      client.callTool({
        name: "handshake.actions.x402_payment.propose",
        arguments: await referenceProposalInput(metadataRead.payload.metadataDigest),
      }),
      8_000,
      "tools/call",
    );
    assert.equal(proposal.isError ?? false, false);
    assert.equal(proposal.structuredContent?.outcome, "action_contract_proposed");
    assert.equal(proposal.structuredContent?.authorityCreated, false);
    assert.equal(proposal.structuredContent?.greenlightCreated, false);
    assert.equal(proposal.structuredContent?.gatewayCheckPerformed, false);
    assert.equal(proposal.structuredContent?.mutationAttempted, false);
  } finally {
    await client.close().catch(() => undefined);
    await transport.close().catch(() => undefined);
  }

  const leaked = stderr();
  assert.equal(leaked.includes("PaymentPayload"), false);
  assert.equal(leaked.includes("PAYMENT-SIGNATURE"), false);
}

function referenceProtectedToolInput() {
  const policyVersionRef = "policy:x402:package-smoke";
  return {
    requestId: "req_x402_package_smoke",
    principalId: "principal_package_smoke",
    agentId: "agent_package_smoke",
    principalIntentRef: "intent:package-smoke",
    generatedCodeOrSpecRef: "code:package-smoke",
    runtimeAdapterRef: "adapter:package-smoke",
    runId: "run_package_smoke",
    dispatchBoundaryRef: "dispatch-boundary:package-smoke",
    dispatchRef: "dispatch:package-smoke:1",
    operatingEnvelopeId: "env_package_smoke",
    toolCapabilityId: "tool_x402_package_smoke",
    actionTypeId: "atype_x402_package_smoke",
    gatewayRegistryEntryId: "gwy_entry_x402_package_smoke",
    gatewayId: "gateway_x402_package_smoke",
    policyOwnerRef: "policy-owner:package-smoke",
    evidenceConsumerRef: "evidence-consumer:package-smoke",
    contractExpiresAt: "2026-05-22T12:00:00.000Z",
    idempotencyKey: "idem:x402:package-smoke",
    metadataDigest: digestMcp({ metadata: "x402-protected-tool-package-smoke" }),
    toolCatalogDigest: digestMcp({ catalog: "tools", actionClass: "x402_payment.exact" }),
    actionCatalogDigest: digestMcp({ catalog: "actions", actionClass: "x402_payment.exact" }),
    gatewayRegistryDigest: digestMcp({ registry: "x402", entry: "package-smoke" }),
    metadataFreshness: "fresh",
    installReadiness: "trusted_gateway_ready",
    gatewayPosture: "online",
    readinessProofLevel: "control_plane_registration",
    gatewayReadinessRef: "readiness:x402:package-smoke",
    gatewayReadinessDigest: digestMcp({ readiness: "x402", profile: "package-smoke" }),
    readinessExpiresAt: "2099-01-01T00:00:00.000Z",
    installDigest: digestMcp({ install: "x402", profile: "package-smoke" }),
    probePostureDigest: digestMcp({ probes: "x402", profile: "package-smoke" }),
    gatewayRegistrationRef: "gateway-registration:x402:package-smoke",
    gatewayCredentialRefDigest: digestMcp({ gatewayCredentialRef: "x402", profile: "package-smoke" }),
    gatewayCredentialCustodyStatus: "gateway_held",
    gatewayCustodyProofPacketRef: "gateway-custody-proof:x402:package-smoke",
    gatewayCustodyProofPacketDigest: digestMcp({ gatewayCustodyProofPacket: "x402", profile: "package-smoke" }),
    gatewayCustodyClaimLevel: "customer_gateway_evidence",
    gatewayCustodyExternalVerificationStatus: "verified_by_official_source",
    gatewayCustodyProofExpiresAt: "2099-01-01T00:00:00.000Z",
    policyVersionRef,
    policyVersionDigest: digestMcp({ policyVersionRef, profile: "package-smoke" }),
    rawCredentialRefsIncluded: false,
    endpointUrl: "https://seller.example/protected",
    payee: "0x0000000000000000000000000000000000000001",
    payTo: "0x0000000000000000000000000000000000000001",
    network: "base-sepolia",
    token: "USDC",
    asset: "USDC",
    atomicAmount: "1000",
    x402EvidenceProfile: "official_payment_required",
    paymentRequirementsDigest: digestMcp({ paymentRequirements: "package-smoke" }),
    paymentRequiredEvidenceRef: "evidence:x402-payment-required:package-smoke",
    facilitatorRef: null,
    intendedHttpMethod: "GET",
    intendedRequestUrl: "https://seller.example/protected",
    intendedRequestBodyPosture: "no_body",
    intendedRequestBodyDigest: null,
    selectedHeadersDigest: digestMcp({ headers: "selected" }),
    providerEnvironmentPosture: "local_reference_sandbox",
    providerEnvironmentRef: null,
    x402Version: 2,
    x402Scheme: "exact",
    maxTimeoutSeconds: 60,
    selectedPaymentRequirementIndex: 1,
    selectedPaymentRequirementDigest: digestMcp({ selectedPaymentRequirementIndex: 1 }),
    sdkPackageVersions: { "@x402/core": "2.12.0", "@x402/evm": "2.12.0" },
    extensionKeys: [],
    sequenceNumber: 1,
    loopDetected: false,
    retryDetected: false,
    branchDetected: false,
    correlationRef: "correlation:x402:package-smoke",
    evidenceRefs: ["evidence:runtime:package-smoke"],
  };
}

async function readJsonResource(client, uri) {
  const result = await withTimeout(client.readResource({ uri }), 8_000, `resources/read ${uri}`);
  const first = result.contents[0];
  assert.equal(typeof first?.text, "string", `${uri} must return JSON text`);
  return JSON.parse(first.text);
}

async function referenceProposalInput(metadataDigest) {
  return {
    requestId: "req_mcp_x402_1",
    tenantId: "ten_demo",
    organizationId: "org_demo",
    principalId: "principal_demo",
    agentId: "agent_demo",
    principalIntentRef: "intent:demo",
    generatedCodeOrSpecRef: "code:demo",
    runtimeAdapterRef: "adapter:mcp",
    runId: "run_demo",
    dispatchBoundaryRef: "dispatch-boundary:demo",
    dispatchRef: "dispatch:mcp:1",
    metadataRef: "handshake://metadata/actions/x402_payment.exact",
    metadataDigest,
    toolCatalogRef: "catalog:tools:x402",
    toolCatalogDigest: digestMcp({ catalog: "tools", actionClass: "x402_payment.exact" }),
    actionCatalogRef: "catalog:actions:x402",
    gatewayRegistryRef: "registry:x402",
    gatewayRegistryDigest: digestMcp({ registry: "x402", entry: "reference" }),
    operatingEnvelopeId: "env_demo",
    toolCapabilityId: "tool_x402_payment",
    actionTypeId: "atype_x402_payment",
    gatewayRegistryEntryId: "gwy_entry_x402",
    gatewayId: "gateway_x402",
    delegatedAuthorityBinding: {
      authorityUseName: "x402_delegated_spend",
      delegatedAuthorityRefId: "dar_mcp_reference_x402",
      delegatedAuthorityRefDigest: digestMcp({ delegatedAuthorityRef: "mcp_reference_x402" }),
      requiredGrantStatus: "active",
      authorityKind: "spend",
      policyPackRef: "policy:x402-payment-exact:mcp-reference",
      policyPackVersion: "v1",
      evidenceExpectationRefs: ["evidence:x402-delegated-spend:principal_demo:agent_demo"],
    },
    contractExpiresAt: "2026-05-22T12:00:00.000Z",
    idempotencyKey: "idem:x402:demo",
    endpointUrl: "https://seller.example/protected",
    intendedHttpMethod: "GET",
    intendedRequestUrl: "https://seller.example/protected",
    intendedRequestBodyPosture: "no_body",
    intendedRequestBodyDigest: null,
    selectedHeadersDigest: digestMcp({ headers: "selected" }),
    providerEnvironmentPosture: "local_reference_sandbox",
    providerEnvironmentRef: null,
    payee: "0x0000000000000000000000000000000000000001",
    payTo: "0x0000000000000000000000000000000000000001",
    network: "base-sepolia",
    token: "USDC",
    asset: "USDC",
    atomicAmount: "1000",
    x402EvidenceProfile: "official_payment_required",
    x402Version: 2,
    x402Scheme: "exact",
    maxTimeoutSeconds: 60,
    paymentRequirementsDigest: digestMcp({ paymentRequirements: "reference" }),
    paymentRequiredEvidenceRef: "evidence:x402-payment-required:reference",
    selectedPaymentRequirementIndex: 1,
    selectedPaymentRequirementDigest: digestMcp({ selectedPaymentRequirementIndex: 1 }),
    sdkPackageVersions: { "@x402/core": "2.12.0" },
  };
}

function digestMcp(value) {
  return `sha256:${createHash("sha256").update(canonicalizeMcp(value)).digest("hex")}`;
}

function canonicalizeMcp(value) {
  if (value === null) return "null";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error("Cannot canonicalize non-finite MCP value.");
    return JSON.stringify(value);
  }
  if (typeof value === "string") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map((item) => canonicalizeMcp(item)).join(",")}]`;
  return `{${Object.keys(value)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonicalizeMcp(value[key])}`)
    .join(",")}}`;
}

function withTimeout(operation, timeoutMs, phase) {
  let timeoutId;
  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(`Published MCP bin timed out during ${phase}`)), timeoutMs);
  });
  return Promise.race([operation, timeout]).finally(() => {
    if (timeoutId) clearTimeout(timeoutId);
  });
}

function collectText(stream) {
  const chunks = [];
  stream?.on?.("data", (chunk) => chunks.push(String(chunk)));
  return () => chunks.join("");
}
