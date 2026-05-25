import { mkdir, writeFile } from "node:fs/promises";
import packageJson from "../../package.json";
import {
  buildClaudeCodeX402ProtectedToolActivation,
  buildCodexX402ProtectedToolRuntimeTranscript,
  buildCodexX402ProtectedToolActivation,
  buildGenericMcpX402ProtectedToolActivation,
  buildHermesX402ProtectedToolActivation,
  buildOpenClawX402ProtectedToolActivation,
  buildProtectedX402ToolHostProfile,
  ProtectedX402ToolHostProfileInputSchema,
  type ProtectedX402ToolHostProfileInput,
  type X402ProtectedToolHostFamily,
  type X402ProtectedToolHostProfileResult,
  X402_PROTECTED_TOOL_NAME,
} from "../../src/adapters/x402-payment";
import { mcpCatalogSnapshot } from "../../src/mcp/catalog";

const outputDir = new URL("./output/", import.meta.url);
const outputJsonPath = new URL("./output/latest.json", import.meta.url);
const outputMarkdownPath = new URL("./output/latest.md", import.meta.url);
const packageVersion = (packageJson as { version: string }).version;

type ProfileHost = Extract<
  X402ProtectedToolHostFamily,
  "codex_local" | "claude_code_mcp" | "hermes" | "openclaw" | "generic_mcp"
>;

const hostFamilies = [
  "codex_local",
  "claude_code_mcp",
  "hermes",
  "openclaw",
  "generic_mcp",
] as const satisfies readonly ProfileHost[];

const trustedProfiles = hostFamilies.map((hostFamily) => {
  const profileResult = buildProtectedX402ToolHostProfile(validProfileInput(hostFamily));
  return {
    hostFamily,
    installArtifact: installArtifactFor(hostFamily),
    profileResult,
  };
});
const codexActivation = buildCodexX402ProtectedToolActivation({
  activationId: "activation_codex_x402_local",
  packageIdentifier: packageJson.name,
  packageVersion,
  profileInput: validProfileInput("codex_local"),
  codexConfigTarget: "~/.codex/config.toml",
  mcpServerName: "handshake_x402",
  command: "npx",
  args: ["-y", `${packageJson.name}@${packageVersion}`, "handshake-mcp"],
  observedAt: "2026-05-25T00:00:00.000Z",
  expiresAt: "2099-01-01T00:00:00.000Z",
  configDigest: digest(30),
  hostToolDigest: digest(31),
  toolListDigest: digest(32),
  evidenceRefs: ["evidence:codex-x402-activation:wrapped-gateway-check"],
});
const claudeActivation = buildClaudeCodeX402ProtectedToolActivation({
  activationId: "activation_claude_code_x402_managed_mcp",
  packageIdentifier: packageJson.name,
  packageVersion,
  profileInput: validProfileInput("claude_code_mcp"),
  mcpConfigTarget: ".mcp.json",
  mcpServerName: "handshake_x402",
  command: "npx",
  args: ["-y", `${packageJson.name}@${packageVersion}`, "handshake-mcp"],
  observedAt: "2026-05-25T00:00:00.000Z",
  expiresAt: "2099-01-01T00:00:00.000Z",
  configDigest: digest(33),
  hostToolDigest: digest(34),
  toolListDigest: digest(35),
  evidenceRefs: ["evidence:claude-code-x402-activation:wrapped-gateway-check"],
});
const hermesActivation = buildHermesX402ProtectedToolActivation({
  activationId: "activation_hermes_x402_tool_packet",
  packageIdentifier: packageJson.name,
  packageVersion,
  profileInput: validProfileInput("hermes"),
  toolPacketConfigTarget: "hermes.tool-packet.json",
  toolPacketName: "handshake_x402_protected_tool",
  command: "npx",
  args: ["-y", `${packageJson.name}@${packageVersion}`, "handshake-mcp"],
  observedAt: "2026-05-25T00:00:00.000Z",
  expiresAt: "2099-01-01T00:00:00.000Z",
  configDigest: digest(36),
  hostToolDigest: digest(37),
  toolListDigest: digest(38),
  evidenceRefs: ["evidence:hermes-x402-activation:wrapped-gateway-check"],
});
const openClawActivation = buildOpenClawX402ProtectedToolActivation({
  activationId: "activation_openclaw_x402_tool_packet",
  packageIdentifier: packageJson.name,
  packageVersion,
  profileInput: validProfileInput("openclaw"),
  toolPacketConfigTarget: "openclaw.tool-packet.json",
  toolPacketName: "handshake_x402_protected_tool",
  command: "npx",
  args: ["-y", `${packageJson.name}@${packageVersion}`, "handshake-mcp"],
  observedAt: "2026-05-25T00:00:00.000Z",
  expiresAt: "2099-01-01T00:00:00.000Z",
  configDigest: digest(39),
  hostToolDigest: digest(40),
  toolListDigest: digest(41),
  evidenceRefs: ["evidence:openclaw-x402-activation:wrapped-gateway-check"],
});
const genericMcpActivation = buildGenericMcpX402ProtectedToolActivation({
  activationId: "activation_generic_mcp_x402_stdio",
  packageIdentifier: packageJson.name,
  packageVersion,
  profileInput: validProfileInput("generic_mcp"),
  mcpConfigTarget: "mcp.json",
  mcpServerName: "handshake_x402",
  command: "npx",
  args: ["-y", `${packageJson.name}@${packageVersion}`, "handshake-mcp"],
  observedAt: "2026-05-25T00:00:00.000Z",
  expiresAt: "2099-01-01T00:00:00.000Z",
  configDigest: digest(42),
  hostToolDigest: digest(43),
  toolListDigest: digest(44),
  evidenceRefs: ["evidence:generic-mcp-x402-activation:wrapped-gateway-check"],
});
const selectedRuntimeTranscript = buildCodexX402ProtectedToolRuntimeTranscript({
  transcriptId: "transcript_codex_x402_local_default",
  activationArtifact: codexActivation,
  observedAt: "2026-05-25T00:00:00.000Z",
  selectionPosture: "local_default_pending_user_confirmation",
  evidenceRefs: ["evidence:codex-x402-runtime-transcript:source-owned-default"],
});

const blockedReadiness = buildProtectedX402ToolHostProfile(
  validProfileInput("codex_local", {
    gatewayReadiness: {
      readinessStatus: "local_posture_evidence_present",
      readinessScope: "pre_contract",
      readinessProofLevel: "local_classification",
      trustedReadiness: false,
      requiredNextMechanism: "register_control_plane_install",
      gatewayReadinessRef: null,
      gatewayReadinessDigest: null,
      readinessExpiresAt: null,
      installDigest: digest(14),
      probePostureDigest: digest(15),
      paymentRequirementsDigest: digest(5),
      selectedPaymentRequirementDigest: digest(6),
      gatewayId: null,
      gatewayRegistrationRef: null,
      gatewayCredentialRefDigest: null,
      gatewayCredentialCustodyStatus: "missing",
      gatewayCustodyProofPacketRef: null,
      gatewayCustodyProofPacketDigest: null,
      gatewayCustodyClaimLevel: "proof_gap",
      gatewayCustodyExternalVerificationStatus: "required_before_live_claim",
      gatewayCustodyProofExpiresAt: null,
      gatewayPosture: "unknown",
      policyVersionRef: null,
      policyVersionDigest: null,
      gatewayRegistryEntryRef: null,
      operatingEnvelopeRef: null,
      rawCredentialRefsIncluded: false,
      proofGapReasonCodes: ["cli_install_not_ready"],
      evidenceRefs: ["evidence:x402:local-install"],
    },
  }),
);

const staleMetadata = buildProtectedX402ToolHostProfile(
  validProfileInput("claude_code_mcp", {
    facadeInput: {
      ...validFacadeInput(),
      metadataFreshness: "stale",
    },
  }),
);

const sampleInputs = {
  generatedBy: "examples/x402-protected-tool-profiles/run.ts",
  schemaValidation: {
    safeHostProfileInput: "ProtectedX402ToolHostProfileInputSchema",
    unsafeProviderPostureHostProfileInput: "ProtectedX402ToolHostProfileInputSchema",
    proofGapReadinessHostProfileInput: "ProtectedX402ToolHostProfileInputSchema",
  },
  safeHostProfileInput: ProtectedX402ToolHostProfileInputSchema.parse(validProfileInput("codex_local")),
  unsafeProviderPostureHostProfileInput: ProtectedX402ToolHostProfileInputSchema.parse(
    validProfileInput("codex_local", {
      facadeInput: {
        ...validFacadeInput(),
        providerEnvironmentPosture: "live",
        providerEnvironmentRef: "provider:x402-live",
      },
    }),
  ),
  proofGapReadinessHostProfileInput: ProtectedX402ToolHostProfileInputSchema.parse(
    validProfileInput("codex_local", {
      gatewayReadiness: proofGapGatewayReadiness(),
    }),
  ),
} as const;

const report = {
  schemaVersion: "handshake.demo.x402-protected-tool-profiles.v1",
  command: "npm run demo:x402-tool-profiles",
  packageIdentifier: packageJson.name,
  packageVersion,
  mcpBin: "handshake-mcp",
  toolName: X402_PROTECTED_TOOL_NAME,
  catalogSnapshot: mcpCatalogSnapshot(),
  profiles: trustedProfiles,
  hostActivations: [codexActivation, claudeActivation, hermesActivation, openClawActivation, genericMcpActivation],
  selectedRuntimeTranscript,
  smokeTranscripts: [
    smokeTranscript("codex_trusted_ready", trustedProfiles[0].profileResult),
    smokeTranscript("claude_trusted_ready", trustedProfiles[1].profileResult),
    smokeTranscript("hermes_trusted_ready", trustedProfiles[2].profileResult),
    smokeTranscript("openclaw_trusted_ready", trustedProfiles[3].profileResult),
    smokeTranscript("generic_mcp_trusted_ready", trustedProfiles[4].profileResult),
    smokeTranscript("codex_not_trusted_ready", blockedReadiness),
    smokeTranscript("claude_stale_metadata", staleMetadata),
  ],
  sampleInputs,
  authorityAudit: {
    authorityCreated: false,
    policyDecisionCreated: false,
    greenlightCreated: false,
    gatewayCheckPerformed: false,
    mutationAttempted: false,
    credentialMaterialIncluded: false,
    mutationCommandIncluded: false,
    rawInternalRecordIncluded: false,
    receiptExportCreated: false,
    authorityCertificateMinted: false,
    signerInvoked: false,
    paymentMaterialCreated: false,
    hostedOperationClaimed: false,
    providerCustodyClaimed: false,
    hostWideContainmentClaimed: false,
    marketplaceCertificationClaimed: false,
    settlementClaimed: false,
  },
  proofGaps: [
    "codex_live_user_config_write_not_performed_by_demo",
    "claude_code_live_user_config_write_not_performed_by_demo",
    "hermes_live_user_tool_packet_write_not_performed_by_demo",
    "openclaw_live_user_tool_packet_write_not_performed_by_demo",
    "claude_code_unmanaged_mcp_server_control_not_claimed",
    "hermes_native_host_behavior_not_claimed",
    "hermes_unmanaged_tool_packet_control_not_claimed",
    "openclaw_native_host_behavior_not_claimed",
    "openclaw_unmanaged_tool_packet_control_not_claimed",
    "generic_mcp_live_user_config_write_not_performed_by_demo",
    "generic_mcp_native_host_behavior_not_claimed",
    "generic_mcp_unmanaged_server_control_not_claimed",
    "host_raw_sibling_paths_not_controlled_by_profile",
    "host_wide_containment_not_claimed",
  ],
  nonClaims: [
    "profile_artifact_is_not_authorization",
    "profile_artifact_is_not_policy_decision",
    "profile_artifact_is_not_greenlight",
    "profile_artifact_is_not_gateway_check",
    "profile_artifact_is_not_signer_use",
    "profile_artifact_is_not_payment_settlement",
    "profile_artifact_is_not_hosted_operation",
    "profile_artifact_is_not_provider_custody",
    "profile_artifact_is_not_host_wide_containment",
  ],
} as const;

const markdown = renderMarkdown(report);

await mkdir(outputDir, { recursive: true });
await writeFile(outputJsonPath, `${JSON.stringify(report, null, 2)}\n`);
await writeFile(outputMarkdownPath, markdown);

console.log(markdown);
console.log("Wrote: examples/x402-protected-tool-profiles/output/latest.md");
console.log("Wrote: examples/x402-protected-tool-profiles/output/latest.json");

function installArtifactFor(hostFamily: ProfileHost) {
  const base = {
    artifactKind: "x402_protected_tool_host_profile",
    artifactVersion: "v1",
    packageInstall: {
      registry: "npm",
      identifier: packageJson.name,
      version: packageVersion,
      serverBin: "handshake-mcp",
    },
    toolName: X402_PROTECTED_TOOL_NAME,
    requiredGatewayReadiness: {
      readinessStatus: "trusted_gateway_ready",
      readinessProofLevel: "control_plane_registration",
      requiredNextMechanism: "ready_for_runtime_facade",
      requiredLocalRef: "handshake://local/x402/gateway-readiness.json",
    },
    configurationPosture: "reference_profile_snippet_not_live_host_verified",
    authorityPosture: "proposal_and_evidence_only",
    nonClaims: [
      "not_authorization",
      "not_gateway_check",
      "not_signer_use",
      "not_host_wide_containment",
      "not_provider_custody",
    ],
  } as const;

  if (hostFamily === "codex_local") {
    return {
      ...base,
      hostFamily,
      installSurface: "codex_local_profile",
      configTarget: "~/.codex/config.toml",
      configSnippet: {
        mcpServerName: "handshake_x402",
        command: "npx",
        args: ["-y", `${packageJson.name}@${packageVersion}`, "handshake-mcp"],
      },
    };
  }

  if (hostFamily === "claude_code_mcp") {
    return {
      ...base,
      hostFamily,
      installSurface: "claude_code_managed_mcp",
      configTarget: ".mcp.json",
      configSnippet: {
        mcpServers: {
          handshake_x402: {
            command: "npx",
            args: ["-y", `${packageJson.name}@${packageVersion}`, "handshake-mcp"],
          },
        },
      },
    };
  }

  if (hostFamily === "hermes") {
    return {
      ...base,
      hostFamily,
      installSurface: "hermes_tool_packet",
      configTarget: "hermes.tool-packet.json",
      configSnippet: {
        toolPacket: {
          name: "handshake_x402_protected_tool",
          command: "npx",
          args: ["-y", `${packageJson.name}@${packageVersion}`, "handshake-mcp"],
          toolName: X402_PROTECTED_TOOL_NAME,
        },
      },
      hostVerificationPosture: "source_owned_tool_packet_activation_live_host_not_claimed",
    };
  }

  if (hostFamily === "openclaw") {
    return {
      ...base,
      hostFamily,
      installSurface: "openclaw_tool_packet",
      configTarget: "openclaw.tool-packet.json",
      configSnippet: {
        toolPacket: {
          name: "handshake_x402_protected_tool",
          command: "npx",
          args: ["-y", `${packageJson.name}@${packageVersion}`, "handshake-mcp"],
          toolName: X402_PROTECTED_TOOL_NAME,
        },
      },
      hostVerificationPosture: "source_owned_tool_packet_activation_live_host_not_claimed",
    };
  }

  return {
    ...base,
    hostFamily,
    installSurface: "generic_mcp_stdio",
    configTarget: "mcp.json",
    configSnippet: {
      mcpServers: {
        handshake_x402: {
          command: "npx",
          args: ["-y", `${packageJson.name}@${packageVersion}`, "handshake-mcp"],
        },
      },
    },
    hostVerificationPosture: "source_owned_generic_mcp_activation_live_host_not_claimed",
  };
}

function smokeTranscript(caseId: string, result: X402ProtectedToolHostProfileResult) {
  return {
    caseId,
    hostFamily: result.hostFamily,
    outcome: result.outcome,
    nextAction: result.nextAction,
    facadeInvoked: result.facadeInvoked,
    facadeOutcome: result.facadeOutcome,
    runtimeDispatchPrepared: result.runtimeIngressBlock !== null,
    reasonCodes: result.reasonCodes,
    transcript: result.transcript,
    authorityCreated: result.authorityCreated,
    greenlightCreated: result.greenlightCreated,
    gatewayCheckPerformed: result.gatewayCheckPerformed,
    mutationAttempted: result.mutationAttempted,
    credentialMaterialIncluded: result.credentialMaterialIncluded,
    mutationCommandIncluded: result.mutationCommandIncluded,
    rawInternalRecordIncluded: result.rawInternalRecordIncluded,
    receiptExportCreated: result.receiptExportCreated,
    authorityCertificateMinted: result.authorityCertificateMinted,
  };
}
function validProfileInput(
  hostFamily: ProfileHost,
  overrides: {
    gatewayReadiness?: ProtectedX402ToolHostProfileInput["gatewayReadiness"];
    facadeInput?: ProtectedX402ToolHostProfileInput["facadeInput"];
  } = {},
): ProtectedX402ToolHostProfileInput {
  return {
    profileId: `profile_x402_${hostFamily}`,
    hostFamily,
    hostProfileRef: `host-profile:${hostFamily}:x402`,
    runtimeAdapterRef: `runtime-adapter:${hostFamily}`,
    toolCatalogDigest: digest(11),
    metadataDigest: digest(12),
    gatewayReadiness: overrides.gatewayReadiness ?? validGatewayReadiness(),
    facadeInput: overrides.facadeInput ?? validFacadeInput(),
    transcriptRef: `transcript:${hostFamily}:x402`,
    evidenceRefs: [`evidence:host-profile:${hostFamily}`],
  };
}

function validGatewayReadiness(): ProtectedX402ToolHostProfileInput["gatewayReadiness"] {
  return {
    readinessStatus: "trusted_gateway_ready",
    readinessScope: "pre_contract",
    readinessProofLevel: "control_plane_registration",
    trustedReadiness: true,
    requiredNextMechanism: "ready_for_runtime_facade",
    gatewayReadinessRef: "handshake://local/x402/gateway-readiness.json",
    gatewayReadinessDigest: digest(13),
    readinessExpiresAt: "2099-01-01T00:00:00.000Z",
    installDigest: digest(14),
    probePostureDigest: digest(15),
    paymentRequirementsDigest: digest(5),
    selectedPaymentRequirementDigest: digest(6),
    gatewayId: "gateway_x402_self_hosted",
    gatewayRegistrationRef: "gateway-registration:x402:self-hosted",
    gatewayCredentialRefDigest: digest(16),
    gatewayCredentialCustodyStatus: "gateway_held",
    gatewayCustodyProofPacketRef: "gateway-custody-proof:x402:self-hosted",
    gatewayCustodyProofPacketDigest: digest(18),
    gatewayCustodyClaimLevel: "customer_gateway_evidence",
    gatewayCustodyExternalVerificationStatus: "verified_by_official_source",
    gatewayCustodyProofExpiresAt: "2099-01-01T00:00:00.000Z",
    gatewayPosture: "online",
    policyVersionRef: "policy:x402-payment-exact:v1",
    policyVersionDigest: digest(17),
    gatewayRegistryEntryRef: "gateway_registry_x402",
    operatingEnvelopeRef: "envelope_x402_paid_api",
    rawCredentialRefsIncluded: false,
    proofGapReasonCodes: [],
    evidenceRefs: ["evidence:x402:gateway-readiness"],
  };
}

function proofGapGatewayReadiness(): ProtectedX402ToolHostProfileInput["gatewayReadiness"] {
  return {
    ...validGatewayReadiness(),
    readinessStatus: "local_posture_evidence_present",
    readinessProofLevel: "local_classification",
    trustedReadiness: false,
    requiredNextMechanism: "register_control_plane_install",
    gatewayReadinessRef: null,
    gatewayReadinessDigest: null,
    readinessExpiresAt: null,
    gatewayId: null,
    gatewayRegistrationRef: null,
    gatewayCredentialRefDigest: null,
    gatewayCredentialCustodyStatus: "missing",
    gatewayCustodyProofPacketRef: null,
    gatewayCustodyProofPacketDigest: null,
    gatewayCustodyClaimLevel: "proof_gap",
    gatewayCustodyExternalVerificationStatus: "required_before_live_claim",
    gatewayCustodyProofExpiresAt: null,
    gatewayPosture: "unknown",
    policyVersionRef: null,
    policyVersionDigest: null,
    gatewayRegistryEntryRef: null,
    operatingEnvelopeRef: null,
    proofGapReasonCodes: ["cli_install_not_ready"],
    evidenceRefs: ["evidence:x402:local-install"],
  };
}

function validFacadeInput(): ProtectedX402ToolHostProfileInput["facadeInput"] {
  return {
    requestId: "req_x402_profile_demo",
    principalId: "principal_platform_team",
    agentId: "agent_paid_api_worker",
    principalIntentRef: "intent:agent-paid-api",
    generatedCodeOrSpecRef: "generated:agent-program",
    runtimeAdapterRef: "adapter:runtime-neutral",
    runId: "run_x402_profile_demo",
    dispatchBoundaryRef: "dispatch-boundary:x402-tool",
    dispatchRef: "dispatch:x402:profile-demo",
    operatingEnvelopeId: "envelope_x402_paid_api",
    toolCapabilityId: "tool_x402_payment",
    actionTypeId: "atype_x402_payment",
    gatewayRegistryEntryId: "gateway_registry_x402",
    gatewayId: "gateway_x402_self_hosted",
    policyOwnerRef: "policy-owner:platform",
    evidenceConsumerRef: "evidence-consumer:support",
    contractExpiresAt: "2026-01-01T00:00:00.000Z",
    idempotencyKey: "idem:x402:paid-api:profile-demo",
    metadataDigest: digest(7),
    toolCatalogDigest: digest(8),
    actionCatalogDigest: digest(9),
    gatewayRegistryDigest: digest(10),
    metadataFreshness: "fresh",
    installReadiness: "trusted_gateway_ready",
    gatewayPosture: "online",
    readinessProofLevel: "control_plane_registration",
    gatewayReadinessRef: "handshake://local/x402/gateway-readiness.json",
    gatewayReadinessDigest: digest(13),
    readinessExpiresAt: "2099-01-01T00:00:00.000Z",
    installDigest: digest(14),
    probePostureDigest: digest(15),
    gatewayRegistrationRef: "gateway-registration:x402:self-hosted",
    gatewayCredentialRefDigest: digest(16),
    gatewayCredentialCustodyStatus: "gateway_held",
    gatewayCustodyProofPacketRef: "gateway-custody-proof:x402:self-hosted",
    gatewayCustodyProofPacketDigest: digest(18),
    gatewayCustodyClaimLevel: "customer_gateway_evidence",
    gatewayCustodyExternalVerificationStatus: "verified_by_official_source",
    gatewayCustodyProofExpiresAt: "2099-01-01T00:00:00.000Z",
    policyVersionRef: "policy:x402-payment-exact:v1",
    policyVersionDigest: digest(17),
    rawCredentialRefsIncluded: false,
    endpointUrl: "https://seller.example/protected",
    payee: "0x0000000000000000000000000000000000000001",
    payTo: "0x0000000000000000000000000000000000000001",
    network: "base-sepolia",
    token: "USDC",
    asset: "USDC",
    atomicAmount: "1000",
    x402EvidenceProfile: "official_payment_required",
    paymentRequirementsDigest: digest(5),
    paymentRequiredEvidenceRef: "evidence:x402-payment-required:demo",
    facilitatorRef: null,
    intendedHttpMethod: "GET",
    intendedRequestUrl: "https://seller.example/protected",
    intendedRequestBodyPosture: "no_body",
    intendedRequestBodyDigest: null,
    selectedHeadersDigest: digest(4),
    providerEnvironmentPosture: "local_reference_sandbox",
    providerEnvironmentRef: null,
    x402Version: 2,
    x402Scheme: "exact",
    maxTimeoutSeconds: 60,
    selectedPaymentRequirementIndex: 1,
    selectedPaymentRequirementDigest: digest(6),
    sdkPackageVersions: { "@x402/core": "2.12.0", "@x402/evm": "2.12.0" },
    extensionKeys: [],
    correlationRef: "correlation:x402:profile-demo",
    evidenceRefs: ["evidence:runtime:tool-call"],
  };
}

function digest(seed: number): `sha256:${string}` {
  return `sha256:${seed.toString(16).padStart(64, "0")}`;
}

function renderMarkdown(input: typeof report): string {
  const profileRows = input.profiles
    .map(
      (profile) =>
        `| ${profile.hostFamily} | ${profile.installArtifact.installSurface} | ${profile.profileResult.outcome} | ${profile.profileResult.nextAction} | ${profile.profileResult.profileDescriptor?.rawSiblingPosture ?? "unknown"} |`,
    )
    .join("\n");
  const smokeRows = input.smokeTranscripts
    .map(
      (row) =>
        `| ${row.caseId} | ${row.hostFamily} | ${row.outcome} | ${row.nextAction} | ${row.runtimeDispatchPrepared} | ${row.reasonCodes.join(", ") || "none"} |`,
    )
    .join("\n");
  const activationRows = input.hostActivations
    .map(
      (activation) =>
        `| ${activation.hostFamily} | ${activation.activationPosture} | ${activation.proofPacket.postureState} | ${activation.harnessReport.rawSiblingAttempts.map((attempt) => `${attempt.routeId}:${attempt.resultKind}`).join(", ")} |`,
    )
    .join("\n");
  return `# X402 Protected Tool Profiles

Command: \`${input.command}\`

Tool: \`${input.toolName}\`

## Profiles

| Host | Install surface | Outcome | Next action | Raw sibling posture |
| --- | --- | --- | --- | --- |
${profileRows}

## Host Activation Proof

| Host | Activation posture | Bypass proof posture | Raw sibling results |
| --- | --- | --- | --- |
${activationRows}

## Selected Runtime Transcript

- Selected host: \`${input.selectedRuntimeTranscript.selectedHostFamily}\`
- Selection posture: \`${input.selectedRuntimeTranscript.selectionPosture}\`
- Proposal tool visible: \`${input.selectedRuntimeTranscript.proposalCompatibility.proposalToolVisible}\`
- Runtime dispatch prepared: \`${input.selectedRuntimeTranscript.proposalCompatibility.runtimeDispatchPrepared}\`
- Redacted readback only: \`${input.selectedRuntimeTranscript.readbackCompatibility.redactedReadbackOnly}\`
- Raw sibling posture: \`${input.selectedRuntimeTranscript.rawSiblingPosture.postureState}\`
- Host-wide containment claimed: \`${input.selectedRuntimeTranscript.rawSiblingPosture.hostWideContainmentClaimed}\`
- Gateway check performed by transcript: \`${input.selectedRuntimeTranscript.authorityAudit.gatewayCheckPerformedByTranscript}\`

## Smoke Transcript

| Case | Host | Outcome | Next action | Runtime dispatch prepared | Reason codes |
| --- | --- | --- | --- | --- | --- |
${smokeRows}

## Schema-Derived Sample Inputs

- Safe host profile input: \`${input.sampleInputs.schemaValidation.safeHostProfileInput}\`
- Unsafe provider-posture input: \`${input.sampleInputs.schemaValidation.unsafeProviderPostureHostProfileInput}\`
- Proof-gap readiness input: \`${input.sampleInputs.schemaValidation.proofGapReadinessHostProfileInput}\`

## Authority Boundary

- Authority created: \`${input.authorityAudit.authorityCreated}\`
- Policy decision created: \`${input.authorityAudit.policyDecisionCreated}\`
- Greenlight created: \`${input.authorityAudit.greenlightCreated}\`
- Gateway check performed: \`${input.authorityAudit.gatewayCheckPerformed}\`
- Mutation attempted: \`${input.authorityAudit.mutationAttempted}\`
- Signer invoked: \`${input.authorityAudit.signerInvoked}\`
- Payment material created: \`${input.authorityAudit.paymentMaterialCreated}\`
- Host-wide containment claimed: \`${input.authorityAudit.hostWideContainmentClaimed}\`
- Provider custody claimed: \`${input.authorityAudit.providerCustodyClaimed}\`

## Proof Gaps

${input.proofGaps.map((gap) => `- \`${gap}\``).join("\n")}

## Non-Claims

${input.nonClaims.map((claim) => `- \`${claim}\``).join("\n")}
`;
}
