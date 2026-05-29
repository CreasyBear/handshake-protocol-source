import type { CodexHostActivationReadback } from "./codex-host-activation";
import type { DistributionProvenanceReadback } from "./distribution-provenance";
import type { LiveX402RequirementReadback } from "./live-x402-requirement";
import {
  assertProductCompletionGateIds,
  PRODUCT_COMPLETION_READBACK_KIND,
  type ProductCompletionGateId,
} from "./product-completion-contract";
import { nonAuthorityBoundary, PROOF_PACKET_VERSION } from "./shared";

export type { ProductCompletionGateId };

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
    readonly dualEnforcementPosture?: {
      readonly dualEnforcementPostureTestPassed: boolean;
      readonly mutationManifestGatingTestPassed: boolean;
      readonly evidenceRefs: readonly string[];
    };
    readonly perCustomerBypassScaffold?: {
      readonly customerOnboardingRef: string | null;
      readonly firstPartyDogfoodCustomerId: string | null;
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
    dualEnforcementPostureGateResult(input),
    perCustomerBypassScaffoldGateResult(input),
  ];
  assertProductCompletionGateIds(gateResults.map((result) => result.gateId));
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
    proofKind: PRODUCT_COMPLETION_READBACK_KIND,
    proofVersion: PROOF_PACKET_VERSION,
    generatedAt: input.generatedAt,
    status,
    scope:
      "Aggregate source-owned closeout readback for the product gates. This object audits evidence posture only; it creates no authority.",
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

/** Phase-04 plans 04-01 / deferred 04-11 — honest incomplete until structural tests pass. */
function dualEnforcementPostureGateResult(input: ProductCompletionReadbackInput) {
  const structuralEvidenceReady =
    input.gates.dualEnforcementPosture?.dualEnforcementPostureTestPassed === true &&
    input.gates.dualEnforcementPosture?.mutationManifestGatingTestPassed === true;
  const blockers = structuralEvidenceReady
    ? []
    : [
        "dual_enforcement_structural_evidence_absent",
        "awaiting_test_architecture_dual_enforcement_posture",
        "awaiting_test_architecture_http_handler_mutation_gating",
      ];
  return productCompletionGateResult({
    gateId: "dual_enforcement_posture",
    title: "Dual enforcement: admission identifies callers; adapter run*Gateway before mutation enforces",
    completed: structuralEvidenceReady,
    hardBlocked: false,
    blockers,
    evidenceRefs: input.gates.dualEnforcementPosture?.evidenceRefs ?? [
      "evidence:phase-04:04-01",
      "evidence:phase-04:04-11-deferred",
      "evidence:test:dual-enforcement-posture",
    ],
  });
}

/** D-25 / D-54 — always incomplete until named first-party dogfood evidence exists. */
function perCustomerBypassScaffoldGateResult(input: ProductCompletionReadbackInput) {
  const gate = input.gates.perCustomerBypassScaffold;
  const dogfoodReady =
    gate?.firstPartyDogfoodCustomerId === "handshake-internal-dogfood" &&
    gate.customerOnboardingRef !== null &&
    gate.customerOnboardingRef.length > 0;
  return productCompletionGateResult({
    gateId: "per_customer_bypass_scaffold",
    title: "Per-customer service-workflow-admission bypass scaffold (first-party dogfood only)",
    completed: false,
    hardBlocked: !dogfoodReady && gate?.customerOnboardingRef === null,
    blockers: dogfoodReady ? [] : ["per_customer_bypass_scaffold_incomplete", "customer_onboarding_ref_absent"],
    evidenceRefs: gate?.evidenceRefs ?? ["evidence:phase-04:D-25-scaffold"],
  });
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
