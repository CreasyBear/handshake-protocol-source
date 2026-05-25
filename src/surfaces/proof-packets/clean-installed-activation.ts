import { gap, nonAuthorityBoundary, PROOF_PACKET_VERSION } from "./shared";

export type CleanInstalledActivationProofInput = {
  readonly generatedAt: string;
  readonly package: {
    readonly name: string;
    readonly version: string;
    readonly packedFile: string;
    readonly localArtifactPath: string | null;
    readonly tarballSha256: string;
    readonly tarballSizeBytes: number;
    readonly npmIntegrity: string | null;
    readonly npmShasum: string | null;
    readonly fileCount: number | null;
  };
  readonly requiredInstalledSurfaces: {
    readonly bins: readonly string[];
    readonly exports: readonly string[];
    readonly protectedToolExports: readonly string[];
  };
  readonly activationEvidence: {
    readonly facadeImportSource: string;
    readonly runtimeDispatchPrepared: boolean;
    readonly gatewayAdmissionStatus: string;
    readonly downstreamOutcomeStatus: string;
    readonly policyDecision: string;
    readonly gateDecision: string;
    readonly changedParameterDecision: string;
    readonly replayDecision: string;
    readonly signerInvocationsAfterGatewayAdmission: number;
    readonly signerInvocationsAfterReplay: number;
    readonly hostileGeneratedExecutionCaseIds: readonly string[];
    readonly rawCredentialMaterialVisible: boolean;
    readonly outputRefs: readonly string[];
  };
  readonly commandRefs: readonly string[];
};

export type CleanInstalledActivationProof = ReturnType<typeof projectCleanInstalledActivationProof>;

export function projectCleanInstalledActivationProof(input: CleanInstalledActivationProofInput) {
  return {
    proofKind: "clean_installed_activation_proof" as const,
    proofVersion: PROOF_PACKET_VERSION,
    generatedAt: input.generatedAt,
    status: "local_activation_passed" as const,
    scope:
      "Pinned local packed artifact activation for the x402 protected-tool proposal/evidence surface. This is not live host activation.",
    package: input.package,
    requiredInstalledSurfaces: input.requiredInstalledSurfaces,
    activationEvidence: input.activationEvidence,
    commandRefs: input.commandRefs,
    evidenceRefs: [
      `package:${input.package.name}@${input.package.version}:tarball-sha256:${input.package.tarballSha256}`,
      "evidence:clean-installed-import:x402-protected-tool",
      "evidence:clean-installed-demo:x402-protected-spend",
      ...input.activationEvidence.outputRefs,
    ],
    authorityBoundary: {
      ...nonAuthorityBoundary,
      resolvesCredential: false as const,
      invokesSigner: false as const,
      createsPaymentPayload: false as const,
      configuresLiveHost: false as const,
      provesMcpRegistryDiscoverability: false as const,
      provesPublicNpmCurrentSurface: false as const,
      provesCustomerGatewayCustody: false as const,
      provesLivePaidExecution: false as const,
    },
    proofGaps: [
      gap(
        "live_codex_host_not_configured_by_clean_install_check",
        "Clean installed activation does not prove live Codex host configuration or host-origin tool invocation.",
      ),
      gap(
        "mcp_registry_discoverability_not_checked_by_clean_install_check",
        "Clean installed activation does not prove MCP Registry acceptance or lookup.",
      ),
      gap(
        "public_npm_current_surface_not_checked_by_clean_install_check",
        "Clean installed activation uses a local packed artifact and does not prove that the current surface is published.",
      ),
      gap(
        "customer_gateway_live_payment_not_checked_by_clean_install_check",
        "Clean installed activation does not exercise a funded customer-gateway-held signer or live x402 paid retry.",
      ),
    ],
    nextMechanism: "Configure a live Codex MCP host against this exact artifact only after explicit approval.",
  };
}
