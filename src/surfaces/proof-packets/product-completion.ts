import type { CodexHostActivationReadback } from "./codex-host-activation";
import type { DistributionProvenanceReadback } from "./distribution-provenance";
import type { LiveX402RequirementReadback } from "./live-x402-requirement";
import { nonAuthorityBoundary, PROOF_PACKET_VERSION } from "./shared";

export type ProductCompletionGateId =
  | "codex_local_host_activation"
  | "public_distribution_and_registry"
  | "customer_gateway_live_x402_paid_proof"
  | "auth_md_x402_admission_packet";

export type ProductCompletionGateStatus = "completed" | "hard_blocked" | "incomplete";

export type ProductCompletionReadbackInput = {
  readonly generatedAt: string;
  readonly commandRefs: readonly string[];
  readonly qualityGate: {
    readonly command: string;
    readonly passed: boolean;
    readonly evidenceRef: string;
  };
  readonly gates: {
    readonly codexLocalHostActivation: {
      readonly status: CodexHostActivationReadback["status"];
      readonly artifactVersion: string;
      readonly artifactSha256: string | null;
      readonly observesHostToolInvocation: boolean;
      readonly authorityCreated: boolean;
      readonly evidenceRefs: readonly string[];
    };
    readonly publicDistributionAndRegistry: {
      readonly status: DistributionProvenanceReadback["status"];
      readonly localVersion: string;
      readonly npmLatestVersion: string | null;
      readonly currentSurfacePublished: boolean;
      readonly mcpRegistryAccepted: boolean;
      readonly mcpRegistryDiscoverable: boolean;
      readonly provenanceAttempted: boolean;
      readonly provenanceSupported: boolean | null;
      readonly proofGapReasonCodes: readonly string[];
      readonly evidenceRefs: readonly string[];
    };
    readonly customerGatewayLiveX402PaidProof: {
      readonly status: LiveX402RequirementReadback["status"];
      readonly customerGatewayCustodyPresent: boolean;
      readonly livePaidRetryPerformed: boolean;
      readonly terminalReadbackPresent: boolean;
      readonly signerInvocationPosture: "post_gateway_check_only" | "not_observed" | "unsafe_or_unknown";
      readonly proofGapReasonCodes: readonly string[];
      readonly evidenceRefs: readonly string[];
    };
    readonly authMdX402AdmissionPacket: {
      readonly packetVersion: "v0";
      readonly packetProjectorPresent: boolean;
      readonly refusalFirstTestsPassed: boolean;
      readonly redactedReadbackTestsPassed: boolean;
      readonly createsAuthority: boolean;
      readonly evidenceRefs: readonly string[];
    };
  };
};

export type ProductCompletionReadback = ReturnType<typeof projectProductCompletionReadback>;

export function projectProductCompletionReadback(input: ProductCompletionReadbackInput) {
  const gateResults = [
    productCompletionGateResult({
      gateId: "codex_local_host_activation",
      title: "Codex-local runtime activation from pinned current-surface artifact",
      completed:
        input.gates.codexLocalHostActivation.status === "host_tool_invocation_observed" &&
        input.gates.codexLocalHostActivation.observesHostToolInvocation &&
        !input.gates.codexLocalHostActivation.authorityCreated,
      hardBlocked: false,
      blockers: [],
      evidenceRefs: input.gates.codexLocalHostActivation.evidenceRefs,
    }),
    productCompletionGateResult({
      gateId: "public_distribution_and_registry",
      title: "Public package distribution, provenance posture, and MCP Registry lookup",
      completed: input.gates.publicDistributionAndRegistry.status === "registry_discoverable",
      hardBlocked:
        !input.gates.publicDistributionAndRegistry.currentSurfacePublished &&
        input.gates.publicDistributionAndRegistry.provenanceAttempted &&
        input.gates.publicDistributionAndRegistry.provenanceSupported === false &&
        !input.gates.publicDistributionAndRegistry.mcpRegistryDiscoverable,
      blockers: input.gates.publicDistributionAndRegistry.proofGapReasonCodes,
      evidenceRefs: input.gates.publicDistributionAndRegistry.evidenceRefs,
    }),
    productCompletionGateResult({
      gateId: "customer_gateway_live_x402_paid_proof",
      title: "Customer-gateway-held live x402 paid proof through Handshake",
      completed:
        input.gates.customerGatewayLiveX402PaidProof.customerGatewayCustodyPresent &&
        input.gates.customerGatewayLiveX402PaidProof.livePaidRetryPerformed &&
        input.gates.customerGatewayLiveX402PaidProof.terminalReadbackPresent &&
        input.gates.customerGatewayLiveX402PaidProof.signerInvocationPosture === "post_gateway_check_only",
      hardBlocked:
        !input.gates.customerGatewayLiveX402PaidProof.customerGatewayCustodyPresent &&
        input.gates.customerGatewayLiveX402PaidProof.proofGapReasonCodes.includes(
          "customer_gateway_custody_packet_absent",
        ),
      blockers: input.gates.customerGatewayLiveX402PaidProof.proofGapReasonCodes,
      evidenceRefs: input.gates.customerGatewayLiveX402PaidProof.evidenceRefs,
    }),
    productCompletionGateResult({
      gateId: "auth_md_x402_admission_packet",
      title: "auth.md+x402 admission packet v0 with refusal tests and redacted readback",
      completed:
        input.gates.authMdX402AdmissionPacket.packetProjectorPresent &&
        input.gates.authMdX402AdmissionPacket.refusalFirstTestsPassed &&
        input.gates.authMdX402AdmissionPacket.redactedReadbackTestsPassed &&
        !input.gates.authMdX402AdmissionPacket.createsAuthority,
      hardBlocked: false,
      blockers: [],
      evidenceRefs: input.gates.authMdX402AdmissionPacket.evidenceRefs,
    }),
  ];
  const incompleteGateIds = gateResults
    .filter((result) => result.status !== "completed" && result.status !== "hard_blocked")
    .map((result) => result.gateId);
  const hardBlockedGateIds = gateResults
    .filter((result) => result.status === "hard_blocked")
    .map((result) => result.gateId);
  const overclaimViolations = productCompletionOverclaimViolations(input);
  const status =
    input.qualityGate.passed && incompleteGateIds.length === 0 && overclaimViolations.length === 0
      ? hardBlockedGateIds.length === 0
        ? ("completed" as const)
        : ("closed_with_hard_blocks" as const)
      : ("incomplete" as const);

  return {
    proofKind: "product_completion_readback" as const,
    proofVersion: PROOF_PACKET_VERSION,
    generatedAt: input.generatedAt,
    status,
    scope:
      "Aggregate source-owned closeout readback for the four product gates. This object audits evidence posture only; it creates no authority.",
    qualityGate: input.qualityGate,
    gates: gateResults,
    incompleteGateIds,
    hardBlockedGateIds,
    overclaimViolations,
    commandRefs: input.commandRefs,
    evidenceRefs: [input.qualityGate.evidenceRef, ...gateResults.flatMap((result) => result.evidenceRefs)],
    authorityBoundary: {
      ...nonAuthorityBoundary,
      createsRelease: false as const,
      publishesPackage: false as const,
      registersMcpServer: false as const,
      configuresHost: false as const,
      resolvesCredential: false as const,
      invokesSigner: false as const,
      createsPaymentPayload: false as const,
      createsPaymentSignature: false as const,
      exportsReceipt: false as const,
      hostsOperation: false as const,
      certifiesMarketplace: false as const,
    },
    nextMechanism:
      status === "completed"
        ? "Move from local/product-surface closeout to hosted operation design."
        : hardBlockedGateIds.includes("public_distribution_and_registry")
          ? "Resolve public distribution: publish the current package with provenance support or explicitly accept the no-provenance release risk, then verify npm and MCP Registry readback."
          : "Resolve the remaining incomplete gate with source-owned evidence before claiming product closeout.",
  };
}

function productCompletionGateResult(input: {
  readonly gateId: ProductCompletionGateId;
  readonly title: string;
  readonly completed: boolean;
  readonly hardBlocked: boolean;
  readonly blockers: readonly string[];
  readonly evidenceRefs: readonly string[];
}) {
  const status: ProductCompletionGateStatus = input.completed
    ? "completed"
    : input.hardBlocked
      ? "hard_blocked"
      : "incomplete";
  return {
    gateId: input.gateId,
    title: input.title,
    status,
    blockers: [...input.blockers].sort(),
    evidenceRefs: [...input.evidenceRefs],
  };
}

function productCompletionOverclaimViolations(input: ProductCompletionReadbackInput): string[] {
  const violations: string[] = [];
  if (input.gates.codexLocalHostActivation.authorityCreated) {
    violations.push("codex_host_activation_claims_authority");
  }
  if (input.gates.publicDistributionAndRegistry.status === "registry_discoverable") {
    if (
      !input.gates.publicDistributionAndRegistry.currentSurfacePublished ||
      !input.gates.publicDistributionAndRegistry.mcpRegistryAccepted ||
      !input.gates.publicDistributionAndRegistry.mcpRegistryDiscoverable
    ) {
      violations.push("distribution_status_exceeds_public_readback");
    }
  }
  if (
    input.gates.customerGatewayLiveX402PaidProof.livePaidRetryPerformed &&
    input.gates.customerGatewayLiveX402PaidProof.signerInvocationPosture !== "post_gateway_check_only"
  ) {
    violations.push("live_paid_retry_without_post_gateway_signer_posture");
  }
  if (input.gates.authMdX402AdmissionPacket.createsAuthority) {
    violations.push("auth_md_x402_packet_claims_authority");
  }
  if (!input.qualityGate.passed) violations.push("quality_gate_not_passing");
  return violations.sort();
}
