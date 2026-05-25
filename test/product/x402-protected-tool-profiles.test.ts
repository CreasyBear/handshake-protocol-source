import { describe, expect, it } from "bun:test";
import { fileURLToPath } from "node:url";
import {
  buildProtectedX402ToolHostProfile,
  ProtectedX402ToolFacadeInputSchema,
  ProtectedX402ToolHostProfileInputSchema,
  X402ProtectedToolReadinessSnapshotSchema,
} from "../../src/adapters/x402-payment";

const repoRoot = fileURLToPath(new URL("../..", import.meta.url));
const outputJsonPath = `${repoRoot}/examples/x402-protected-tool-profiles/output/latest.json`;
const outputMarkdownPath = `${repoRoot}/examples/x402-protected-tool-profiles/output/latest.md`;

describe("x402 protected tool profile artifacts", () => {
  it("emits Codex, Claude, Hermes, OpenClaw, and generic MCP profile artifacts without authority or host-wide claims", async () => {
    const proc = Bun.spawn([process.execPath, "run", "./examples/x402-protected-tool-profiles/run.ts"], {
      cwd: repoRoot,
      stdout: "pipe",
      stderr: "pipe",
    });
    const stdoutPromise = proc.stdout ? new Response(proc.stdout).text() : Promise.resolve("");
    const stderrPromise = proc.stderr ? new Response(proc.stderr).text() : Promise.resolve("");
    const exitCode = await proc.exited;
    const stdout = await stdoutPromise;
    const stderr = await stderrPromise;

    expect(stderr).toBe("");
    expect(exitCode).toBe(0);
    expect(stdout).toContain("# X402 Protected Tool Profiles");
    expect(stdout).toContain("Wrote: examples/x402-protected-tool-profiles/output/latest.md");

    const output = await Bun.file(outputJsonPath).json();
    expect(output).toMatchObject({
      schemaVersion: "handshake.demo.x402-protected-tool-profiles.v1",
      command: "npm run demo:x402-tool-profiles",
      packageIdentifier: "handshake-protocol-kernel",
      mcpBin: "handshake-mcp",
      toolName: "handshake.actions.x402_payment.propose",
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
    });
    expect(output.catalogSnapshot.tools.map((tool: { name: string }) => tool.name)).toEqual([
      "handshake.actions.x402_payment.propose",
    ]);
    expect(output.sampleInputs).toMatchObject({
      generatedBy: "examples/x402-protected-tool-profiles/run.ts",
      schemaValidation: {
        safeHostProfileInput: "ProtectedX402ToolHostProfileInputSchema",
        unsafeProviderPostureHostProfileInput: "ProtectedX402ToolHostProfileInputSchema",
        proofGapReadinessHostProfileInput: "ProtectedX402ToolHostProfileInputSchema",
      },
    });
    const safeHostProfileInput = ProtectedX402ToolHostProfileInputSchema.parse(
      output.sampleInputs.safeHostProfileInput,
    );
    const unsafeProviderPostureInput = ProtectedX402ToolHostProfileInputSchema.parse(
      output.sampleInputs.unsafeProviderPostureHostProfileInput,
    );
    const proofGapReadinessInput = ProtectedX402ToolHostProfileInputSchema.parse(
      output.sampleInputs.proofGapReadinessHostProfileInput,
    );
    expect(ProtectedX402ToolFacadeInputSchema.parse(safeHostProfileInput.facadeInput).providerEnvironmentPosture).toBe(
      "local_reference_sandbox",
    );
    expect(
      ProtectedX402ToolFacadeInputSchema.parse(unsafeProviderPostureInput.facadeInput).providerEnvironmentPosture,
    ).toBe("live");
    expect(
      X402ProtectedToolReadinessSnapshotSchema.parse(proofGapReadinessInput.gatewayReadiness).gatewayCustodyClaimLevel,
    ).toBe("proof_gap");
    expect(buildProtectedX402ToolHostProfile(safeHostProfileInput)).toMatchObject({
      outcome: "profile_prepared",
      authorityCreated: false,
      gatewayCheckPerformed: false,
    });
    expect(buildProtectedX402ToolHostProfile(unsafeProviderPostureInput)).toMatchObject({
      outcome: "facade_challenge",
      facadeOutcome: "refused",
      nextAction: "recraft_request",
      gatewayCheckPerformed: false,
    });
    expect(buildProtectedX402ToolHostProfile(proofGapReadinessInput)).toMatchObject({
      outcome: "profile_not_ready",
      nextAction: "register_control_plane_install",
      gatewayCheckPerformed: false,
    });

    const codex = output.profiles.find((profile: { hostFamily: string }) => profile.hostFamily === "codex_local");
    const claude = output.profiles.find((profile: { hostFamily: string }) => profile.hostFamily === "claude_code_mcp");
    const hermes = output.profiles.find((profile: { hostFamily: string }) => profile.hostFamily === "hermes");
    const openclaw = output.profiles.find((profile: { hostFamily: string }) => profile.hostFamily === "openclaw");
    const genericMcp = output.profiles.find((profile: { hostFamily: string }) => profile.hostFamily === "generic_mcp");
    expect(output.profiles.map((profile: { hostFamily: string }) => profile.hostFamily)).toEqual([
      "codex_local",
      "claude_code_mcp",
      "hermes",
      "openclaw",
      "generic_mcp",
    ]);
    expect(codex).toMatchObject({
      installArtifact: {
        installSurface: "codex_local_profile",
        configTarget: "~/.codex/config.toml",
        configSnippet: {
          mcpServerName: "handshake_x402",
          command: "npx",
        },
        configurationPosture: "reference_profile_snippet_not_live_host_verified",
        authorityPosture: "proposal_and_evidence_only",
      },
      profileResult: {
        outcome: "profile_prepared",
        nextAction: "read_evidence",
        gatewayCheckPerformed: false,
        mutationAttempted: false,
      },
    });
    expect(codex.installArtifact.configSnippet.args).toContain("handshake-mcp");
    expect(output.hostActivations).toHaveLength(5);
    expect(output.hostActivations[0]).toMatchObject({
      schemaVersion: "handshake.adapter.x402-protected-tool-codex-activation.v1",
      activationId: "activation_codex_x402_local",
      hostFamily: "codex_local",
      packageIdentifier: "handshake-protocol-kernel",
      toolName: "handshake.actions.x402_payment.propose",
      codexConfigTarget: "~/.codex/config.toml",
      mcpServerName: "handshake_x402",
      profileOutcome: "profile_prepared",
      facadeOutcome: "dispatch_block_prepared",
      readinessContractVersion: "handshake.adapter.x402-protected-tool-readiness.v1",
      gatewayReadinessRef: "handshake://local/x402/gateway-readiness.json",
      gatewayReadinessDigest: expect.stringMatching(/^sha256:[a-f0-9]{64}$/),
      rawSiblingPosture: "unknown",
      runtimeDispatchPrepared: true,
      activationPosture: "host_specific_ready",
      proofPacket: {
        postureState: "READY",
        gatewayBinding: {
          status: "bound",
          gatewayCheckObserved: true,
          oneUseGreenlightObserved: true,
          downstreamExecutionRecordedSeparately: true,
        },
      },
      harnessReport: {
        postureState: "READY",
        authority: {
          reportAuthority: false,
          cliAuthority: false,
          mcpAuthority: false,
          hostWideAuthority: false,
        },
      },
      authorityAudit: {
        authorityCreated: false,
        policyDecisionCreated: false,
        greenlightCreated: false,
        gatewayCheckPerformedByArtifact: false,
        mutationAttemptedByArtifact: false,
        credentialMaterialIncluded: false,
        signerInvokedByArtifact: false,
        paymentMaterialCreatedByArtifact: false,
        hostWideContainmentClaimed: false,
        liveHostMutationClaimed: false,
      },
    });
    expect(
      output.hostActivations[0].manifest.protectedPath.rawSiblingCandidates.map(
        (candidate: { routeId: string }) => candidate.routeId,
      ),
    ).toEqual([
      "raw_sibling_codex_shell_x402_fetch",
      "raw_sibling_codex_mcp_direct_payment",
      "raw_sibling_codex_env_private_key",
    ]);
    expect(
      output.hostActivations[0].harnessReport.rawSiblingAttempts.map(
        (attempt: { resultKind: string }) => attempt.resultKind,
      ),
    ).toEqual(["refused", "detected", "refused"]);
    expect(output.hostActivations[0].proofGaps).toContain("live_user_codex_config_write_not_performed_by_demo");
    expect(output.hostActivations[0].nonClaims).toContain("codex_activation_artifact_is_not_host_wide_containment");
    expect(output.selectedRuntimeTranscript).toMatchObject({
      schemaVersion: "handshake.adapter.x402-protected-tool-codex-runtime-transcript.v1",
      transcriptId: "transcript_codex_x402_local_default",
      selectedHostFamily: "codex_local",
      selectionPosture: "local_default_pending_user_confirmation",
      toolName: "handshake.actions.x402_payment.propose",
      proposalCompatibility: {
        proposalToolVisible: true,
        proposalOnly: true,
        profileOutcome: "profile_prepared",
        facadeOutcome: "dispatch_block_prepared",
        runtimeDispatchPrepared: true,
        policyDecisionCreated: false,
        greenlightCreated: false,
        gatewayCheckPerformed: false,
      },
      readbackCompatibility: {
        redactedReadbackOnly: true,
        commands: [
          "handshake evidence contract-view",
          "handshake evidence receipt-timeline",
          "handshake support bundle",
        ],
        supportBundleIsPermission: false,
        receiptExportCreated: false,
        terminalCertificateMinted: false,
      },
      rawSiblingPosture: {
        postureState: "READY",
        hostWideContainmentClaimed: false,
      },
      authorityAudit: {
        authorityCreated: false,
        policyDecisionCreated: false,
        greenlightCreated: false,
        gatewayCheckPerformedByTranscript: false,
        mutationAttemptedByTranscript: false,
        credentialMaterialIncluded: false,
        signerInvokedByTranscript: false,
        paymentMaterialCreatedByTranscript: false,
        receiptExportCreatedByTranscript: false,
        terminalCertificateMintedByTranscript: false,
        liveHostMutationClaimed: false,
        hostWideContainmentClaimed: false,
      },
    });
    expect(
      output.selectedRuntimeTranscript.rawSiblingPosture.rawSiblingAttempts.map(
        (attempt: { routeId: string }) => attempt.routeId,
      ),
    ).toEqual([
      "raw_sibling_codex_shell_x402_fetch",
      "raw_sibling_codex_mcp_direct_payment",
      "raw_sibling_codex_env_private_key",
    ]);
    expect(output.selectedRuntimeTranscript.unselectedHostPosture).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ hostFamily: "claude_code_mcp", posture: "parity_artifact_only" }),
        expect.objectContaining({ hostFamily: "hermes", posture: "parity_artifact_only" }),
        expect.objectContaining({ hostFamily: "openclaw", posture: "parity_artifact_only" }),
        expect.objectContaining({ hostFamily: "generic_mcp", posture: "parity_artifact_only" }),
      ]),
    );
    expect(output.selectedRuntimeTranscript.proofGaps).toContain("user_final_runtime_selection_not_recorded");
    expect(output.selectedRuntimeTranscript.proofGaps).toContain(
      "claude_code_mcp_live_runtime_transcript_not_selected",
    );
    expect(output.selectedRuntimeTranscript.nonClaims).toContain("codex_runtime_transcript_is_not_gateway_check");
    expect(output.selectedRuntimeTranscript.nonClaims).toContain("unselected_hosts_remain_parity_artifacts");
    expect(output.hostActivations[1]).toMatchObject({
      schemaVersion: "handshake.adapter.x402-protected-tool-claude-code-activation.v1",
      activationId: "activation_claude_code_x402_managed_mcp",
      hostFamily: "claude_code_mcp",
      packageIdentifier: "handshake-protocol-kernel",
      toolName: "handshake.actions.x402_payment.propose",
      mcpConfigTarget: ".mcp.json",
      mcpServerName: "handshake_x402",
      profileOutcome: "profile_prepared",
      facadeOutcome: "dispatch_block_prepared",
      readinessContractVersion: "handshake.adapter.x402-protected-tool-readiness.v1",
      gatewayReadinessRef: "handshake://local/x402/gateway-readiness.json",
      gatewayReadinessDigest: expect.stringMatching(/^sha256:[a-f0-9]{64}$/),
      rawSiblingPosture: "unknown",
      runtimeDispatchPrepared: true,
      activationPosture: "host_specific_ready",
      proofPacket: {
        postureState: "READY",
        gatewayBinding: {
          status: "bound",
          gatewayCheckObserved: true,
          oneUseGreenlightObserved: true,
          downstreamExecutionRecordedSeparately: true,
        },
      },
      harnessReport: {
        postureState: "READY",
        authority: {
          reportAuthority: false,
          cliAuthority: false,
          mcpAuthority: false,
          hostWideAuthority: false,
        },
      },
      authorityAudit: {
        authorityCreated: false,
        policyDecisionCreated: false,
        greenlightCreated: false,
        gatewayCheckPerformedByArtifact: false,
        mutationAttemptedByArtifact: false,
        credentialMaterialIncluded: false,
        signerInvokedByArtifact: false,
        paymentMaterialCreatedByArtifact: false,
        hostWideContainmentClaimed: false,
        liveHostMutationClaimed: false,
      },
    });
    expect(
      output.hostActivations[1].manifest.protectedPath.rawSiblingCandidates.map(
        (candidate: { routeId: string }) => candidate.routeId,
      ),
    ).toEqual([
      "raw_sibling_claude_code_shell_x402_fetch",
      "raw_sibling_claude_code_managed_mcp_direct_payment",
      "raw_sibling_claude_code_unmanaged_mcp_server",
    ]);
    expect(
      output.hostActivations[1].harnessReport.rawSiblingAttempts.map(
        (attempt: { resultKind: string }) => attempt.resultKind,
      ),
    ).toEqual(["refused", "detected", "detected"]);
    expect(output.hostActivations[1].proofGaps).toContain("live_user_claude_code_config_write_not_performed_by_demo");
    expect(output.hostActivations[1].nonClaims).toContain(
      "claude_code_activation_artifact_is_not_host_wide_containment",
    );
    expect(output.hostActivations[2]).toMatchObject({
      schemaVersion: "handshake.adapter.x402-protected-tool-hermes-activation.v1",
      activationId: "activation_hermes_x402_tool_packet",
      hostFamily: "hermes",
      packageIdentifier: "handshake-protocol-kernel",
      toolName: "handshake.actions.x402_payment.propose",
      toolPacketConfigTarget: "hermes.tool-packet.json",
      toolPacketName: "handshake_x402_protected_tool",
      profileOutcome: "profile_prepared",
      facadeOutcome: "dispatch_block_prepared",
      readinessContractVersion: "handshake.adapter.x402-protected-tool-readiness.v1",
      gatewayReadinessRef: "handshake://local/x402/gateway-readiness.json",
      gatewayReadinessDigest: expect.stringMatching(/^sha256:[a-f0-9]{64}$/),
      rawSiblingPosture: "unknown",
      runtimeDispatchPrepared: true,
      activationPosture: "host_specific_ready",
      proofPacket: {
        postureState: "READY",
        gatewayBinding: {
          status: "bound",
          gatewayCheckObserved: true,
          oneUseGreenlightObserved: true,
          downstreamExecutionRecordedSeparately: true,
        },
      },
      harnessReport: {
        postureState: "READY",
        authority: {
          reportAuthority: false,
          cliAuthority: false,
          mcpAuthority: false,
          hostWideAuthority: false,
        },
      },
      authorityAudit: {
        authorityCreated: false,
        policyDecisionCreated: false,
        greenlightCreated: false,
        gatewayCheckPerformedByArtifact: false,
        mutationAttemptedByArtifact: false,
        credentialMaterialIncluded: false,
        signerInvokedByArtifact: false,
        paymentMaterialCreatedByArtifact: false,
        hostWideContainmentClaimed: false,
        liveHostMutationClaimed: false,
      },
    });
    expect(
      output.hostActivations[2].manifest.protectedPath.rawSiblingCandidates.map(
        (candidate: { routeId: string }) => candidate.routeId,
      ),
    ).toEqual([
      "raw_sibling_hermes_shell_x402_fetch",
      "raw_sibling_hermes_tool_packet_direct_payment",
      "raw_sibling_hermes_unmanaged_tool_packet",
    ]);
    expect(
      output.hostActivations[2].harnessReport.rawSiblingAttempts.map(
        (attempt: { resultKind: string }) => attempt.resultKind,
      ),
    ).toEqual(["refused", "detected", "detected"]);
    expect(output.hostActivations[2].proofGaps).toContain("live_user_hermes_tool_packet_write_not_performed_by_demo");
    expect(output.hostActivations[2].proofGaps).toContain("hermes_native_host_behavior_not_claimed");
    expect(output.hostActivations[2].nonClaims).toContain("hermes_activation_artifact_is_not_host_wide_containment");
    expect(output.hostActivations[3]).toMatchObject({
      schemaVersion: "handshake.adapter.x402-protected-tool-openclaw-activation.v1",
      activationId: "activation_openclaw_x402_tool_packet",
      hostFamily: "openclaw",
      packageIdentifier: "handshake-protocol-kernel",
      toolName: "handshake.actions.x402_payment.propose",
      toolPacketConfigTarget: "openclaw.tool-packet.json",
      toolPacketName: "handshake_x402_protected_tool",
      profileOutcome: "profile_prepared",
      facadeOutcome: "dispatch_block_prepared",
      readinessContractVersion: "handshake.adapter.x402-protected-tool-readiness.v1",
      gatewayReadinessRef: "handshake://local/x402/gateway-readiness.json",
      gatewayReadinessDigest: expect.stringMatching(/^sha256:[a-f0-9]{64}$/),
      rawSiblingPosture: "unknown",
      runtimeDispatchPrepared: true,
      activationPosture: "host_specific_ready",
      proofPacket: {
        postureState: "READY",
        gatewayBinding: {
          status: "bound",
          gatewayCheckObserved: true,
          oneUseGreenlightObserved: true,
          downstreamExecutionRecordedSeparately: true,
        },
      },
      harnessReport: {
        postureState: "READY",
        authority: {
          reportAuthority: false,
          cliAuthority: false,
          mcpAuthority: false,
          hostWideAuthority: false,
        },
      },
      authorityAudit: {
        authorityCreated: false,
        policyDecisionCreated: false,
        greenlightCreated: false,
        gatewayCheckPerformedByArtifact: false,
        mutationAttemptedByArtifact: false,
        credentialMaterialIncluded: false,
        signerInvokedByArtifact: false,
        paymentMaterialCreatedByArtifact: false,
        hostWideContainmentClaimed: false,
        liveHostMutationClaimed: false,
      },
    });
    expect(
      output.hostActivations[3].manifest.protectedPath.rawSiblingCandidates.map(
        (candidate: { routeId: string }) => candidate.routeId,
      ),
    ).toEqual([
      "raw_sibling_openclaw_shell_x402_fetch",
      "raw_sibling_openclaw_tool_packet_direct_payment",
      "raw_sibling_openclaw_unmanaged_tool_packet",
    ]);
    expect(
      output.hostActivations[3].harnessReport.rawSiblingAttempts.map(
        (attempt: { resultKind: string }) => attempt.resultKind,
      ),
    ).toEqual(["refused", "detected", "detected"]);
    expect(output.hostActivations[3].proofGaps).toContain("live_user_openclaw_tool_packet_write_not_performed_by_demo");
    expect(output.hostActivations[3].proofGaps).toContain("openclaw_native_host_behavior_not_claimed");
    expect(output.hostActivations[3].nonClaims).toContain("openclaw_activation_artifact_is_not_host_wide_containment");
    expect(output.hostActivations[4]).toMatchObject({
      schemaVersion: "handshake.adapter.x402-protected-tool-generic-mcp-activation.v1",
      activationId: "activation_generic_mcp_x402_stdio",
      hostFamily: "generic_mcp",
      packageIdentifier: "handshake-protocol-kernel",
      toolName: "handshake.actions.x402_payment.propose",
      mcpConfigTarget: "mcp.json",
      mcpServerName: "handshake_x402",
      profileOutcome: "profile_prepared",
      facadeOutcome: "dispatch_block_prepared",
      readinessContractVersion: "handshake.adapter.x402-protected-tool-readiness.v1",
      gatewayReadinessRef: "handshake://local/x402/gateway-readiness.json",
      gatewayReadinessDigest: expect.stringMatching(/^sha256:[a-f0-9]{64}$/),
      rawSiblingPosture: "unknown",
      runtimeDispatchPrepared: true,
      activationPosture: "host_specific_ready",
      proofPacket: {
        postureState: "READY",
        gatewayBinding: {
          status: "bound",
          gatewayCheckObserved: true,
          oneUseGreenlightObserved: true,
          downstreamExecutionRecordedSeparately: true,
        },
      },
      harnessReport: {
        postureState: "READY",
        authority: {
          reportAuthority: false,
          cliAuthority: false,
          mcpAuthority: false,
          hostWideAuthority: false,
        },
      },
      authorityAudit: {
        authorityCreated: false,
        policyDecisionCreated: false,
        greenlightCreated: false,
        gatewayCheckPerformedByArtifact: false,
        mutationAttemptedByArtifact: false,
        credentialMaterialIncluded: false,
        signerInvokedByArtifact: false,
        paymentMaterialCreatedByArtifact: false,
        hostWideContainmentClaimed: false,
        liveHostMutationClaimed: false,
      },
    });
    expect(
      output.hostActivations[4].manifest.protectedPath.rawSiblingCandidates.map(
        (candidate: { routeId: string }) => candidate.routeId,
      ),
    ).toEqual([
      "raw_sibling_generic_mcp_shell_x402_fetch",
      "raw_sibling_generic_mcp_direct_payment",
      "raw_sibling_generic_mcp_unmanaged_server",
    ]);
    expect(
      output.hostActivations[4].harnessReport.rawSiblingAttempts.map(
        (attempt: { resultKind: string }) => attempt.resultKind,
      ),
    ).toEqual(["refused", "detected", "detected"]);
    expect(output.hostActivations[4].proofGaps).toContain("live_user_generic_mcp_config_write_not_performed_by_demo");
    expect(output.hostActivations[4].proofGaps).toContain("generic_mcp_native_host_behavior_not_claimed");
    expect(output.hostActivations[4].nonClaims).toContain(
      "generic_mcp_activation_artifact_is_not_host_wide_containment",
    );
    expect(claude).toMatchObject({
      installArtifact: {
        installSurface: "claude_code_managed_mcp",
        configTarget: ".mcp.json",
        configSnippet: {
          mcpServers: {
            handshake_x402: {
              command: "npx",
            },
          },
        },
        configurationPosture: "reference_profile_snippet_not_live_host_verified",
      },
      profileResult: {
        outcome: "profile_prepared",
        profileDescriptor: {
          hostWideContainmentClaimed: false,
          runtimeExclusiveClaimed: false,
        },
      },
    });
    expect(claude.installArtifact.configSnippet.mcpServers.handshake_x402.args).toContain("handshake-mcp");
    expect(hermes).toMatchObject({
      installArtifact: {
        installSurface: "hermes_tool_packet",
        configTarget: "hermes.tool-packet.json",
        configSnippet: {
          toolPacket: {
            command: "npx",
            toolName: "handshake.actions.x402_payment.propose",
          },
        },
        hostVerificationPosture: "source_owned_tool_packet_activation_live_host_not_claimed",
      },
      profileResult: {
        outcome: "profile_prepared",
        profileDescriptor: {
          rawSiblingPosture: "unknown",
          hostWideContainmentClaimed: false,
        },
      },
    });
    expect(hermes.installArtifact.configSnippet.toolPacket.args).toContain("handshake-mcp");
    expect(openclaw).toMatchObject({
      installArtifact: {
        installSurface: "openclaw_tool_packet",
        configTarget: "openclaw.tool-packet.json",
        configSnippet: {
          toolPacket: {
            command: "npx",
            toolName: "handshake.actions.x402_payment.propose",
          },
        },
        hostVerificationPosture: "source_owned_tool_packet_activation_live_host_not_claimed",
      },
      profileResult: {
        outcome: "profile_prepared",
        profileDescriptor: {
          rawSiblingPosture: "unknown",
          hostWideContainmentClaimed: false,
        },
      },
    });
    expect(openclaw.installArtifact.configSnippet.toolPacket.args).toContain("handshake-mcp");
    expect(genericMcp).toMatchObject({
      installArtifact: {
        installSurface: "generic_mcp_stdio",
        configTarget: "mcp.json",
        configSnippet: {
          mcpServers: {
            handshake_x402: {
              command: "npx",
            },
          },
        },
        hostVerificationPosture: "source_owned_generic_mcp_activation_live_host_not_claimed",
      },
      profileResult: {
        outcome: "profile_prepared",
        profileDescriptor: {
          rawSiblingPosture: "unknown",
          hostWideContainmentClaimed: false,
        },
      },
    });
    expect(genericMcp.installArtifact.configSnippet.mcpServers.handshake_x402.args).toContain("handshake-mcp");

    expect(output.smokeTranscripts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          caseId: "codex_trusted_ready",
          outcome: "profile_prepared",
          runtimeDispatchPrepared: true,
          authorityCreated: false,
          gatewayCheckPerformed: false,
          mutationAttempted: false,
        }),
        expect.objectContaining({
          caseId: "codex_not_trusted_ready",
          outcome: "profile_not_ready",
          runtimeDispatchPrepared: false,
          reasonCodes: [
            "cli_install_not_ready",
            "protected_x402_custody_proof_missing",
            "protected_x402_install_not_ready",
            "protected_x402_trusted_readiness_missing",
          ],
        }),
        expect.objectContaining({
          caseId: "claude_stale_metadata",
          outcome: "facade_challenge",
          runtimeDispatchPrepared: false,
          reasonCodes: ["protected_x402_metadata_stale"],
        }),
        expect.objectContaining({
          caseId: "hermes_trusted_ready",
          outcome: "profile_prepared",
          runtimeDispatchPrepared: true,
          authorityCreated: false,
          gatewayCheckPerformed: false,
          mutationAttempted: false,
        }),
        expect.objectContaining({
          caseId: "openclaw_trusted_ready",
          outcome: "profile_prepared",
          runtimeDispatchPrepared: true,
          authorityCreated: false,
          gatewayCheckPerformed: false,
          mutationAttempted: false,
        }),
        expect.objectContaining({
          caseId: "generic_mcp_trusted_ready",
          outcome: "profile_prepared",
          runtimeDispatchPrepared: true,
          authorityCreated: false,
          gatewayCheckPerformed: false,
          mutationAttempted: false,
        }),
      ]),
    );
    expect(output.proofGaps).toEqual([
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
    ]);
    expect(output.nonClaims).toEqual(
      expect.arrayContaining([
        "profile_artifact_is_not_authorization",
        "profile_artifact_is_not_gateway_check",
        "profile_artifact_is_not_signer_use",
        "profile_artifact_is_not_host_wide_containment",
      ]),
    );

    const serialized = JSON.stringify(output);
    expect(serialized).not.toContain("PaymentPayload");
    expect(serialized).not.toContain("PAYMENT-SIGNATURE");
    expect(serialized).not.toContain("privateKey");
    expect(serialized).not.toContain("signerRef");
    expect(serialized).not.toContain("gatewayCheckInput");

    const markdown = await Bun.file(outputMarkdownPath).text();
    expect(markdown).toContain("## Host Activation Proof");
    expect(markdown).toContain("## Smoke Transcript");
    expect(markdown).toContain("## Schema-Derived Sample Inputs");
    expect(markdown).toContain("Gateway check performed: `false`");
    expect(markdown).toContain("Host-wide containment claimed: `false`");

    const demoSource = await Bun.file(`${repoRoot}/examples/x402-protected-tool-profiles/run.ts`).text();
    expect(demoSource).toContain("buildClaudeCodeX402ProtectedToolActivation");
    expect(demoSource).toContain("buildCodexX402ProtectedToolActivation");
    expect(demoSource).toContain("buildGenericMcpX402ProtectedToolActivation");
    expect(demoSource).toContain("buildHermesX402ProtectedToolActivation");
    expect(demoSource).toContain("buildOpenClawX402ProtectedToolActivation");
    expect(demoSource).toContain("ProtectedX402ToolHostProfileInputSchema.parse");
    expect(demoSource).toContain("../../src/adapters/x402-payment");
    expect(demoSource).not.toContain("HandshakeKernel");
    expect(demoSource).not.toContain("createOfficialExactX402SigningSurface");
    expect(demoSource).not.toContain("runOfficialExactX402WalletGateway");
  });
});
