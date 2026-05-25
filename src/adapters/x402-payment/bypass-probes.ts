import type { BypassProbeExecutor, BypassProbeExecutionScope } from "../protected-path-probes";
import { X402PaymentConformancePostureSchema, type X402PaymentConformancePosture } from "./conformance";

export type X402PaymentHostileProbeSurface = {
  readConformancePosture(scope: BypassProbeExecutionScope): Promise<X402PaymentConformancePosture>;
};

type X402ProbeEvaluation = {
  passed: boolean;
  evidenceDetails: string[];
};

type X402ProbeSpec = {
  probeKind: BypassProbeExecutor["probeKind"];
  evaluate(posture: X402PaymentConformancePosture): X402ProbeEvaluation;
};

const x402ProbeSpecs: X402ProbeSpec[] = [
  {
    probeKind: "credential_custody",
    evaluate(posture) {
      return {
        passed: posture.signerCustodyStatus === "gateway_held",
        evidenceDetails: [
          posture.signerCustodyStatus === "gateway_held" ? "signer_gateway_held" : "signer_not_real_gateway_held",
        ],
      };
    },
  },
  {
    probeKind: "raw_sibling_blocking",
    evaluate(posture) {
      const checks = [
        ["raw_private_key_env", posture.rawPrivateKeyEnvStatus === "absent", posture.rawPrivateKeyEnvStatus],
        [
          "direct_core_client_signing",
          blockedOrAbsent(posture.directCoreClientSigningStatus),
          statusLabel(posture.directCoreClientSigningStatus),
        ],
        [
          "direct_x402_client",
          blockedOrAbsent(posture.directX402ClientStatus),
          statusLabel(posture.directX402ClientStatus),
        ],
        [
          "paid_fetch_client",
          blockedOrAbsent(posture.paidFetchClientStatus),
          statusLabel(posture.paidFetchClientStatus),
        ],
        [
          "paid_axios_client",
          blockedOrAbsent(posture.paidAxiosClientStatus),
          statusLabel(posture.paidAxiosClientStatus),
        ],
        [
          "package_script_payment",
          blockedOrAbsent(posture.packageScriptPaymentStatus),
          statusLabel(posture.packageScriptPaymentStatus),
        ],
        [
          "browser_side_payment",
          blockedOrAbsent(posture.browserSidePaymentStatus),
          statusLabel(posture.browserSidePaymentStatus),
        ],
        [
          "raw_network_payment",
          blockedOrAbsent(posture.rawNetworkPaymentStatus),
          statusLabel(posture.rawNetworkPaymentStatus),
        ],
        [
          "raw_payment_signature_header",
          blockedOrAbsent(posture.rawPaymentSignatureHeaderStatus),
          statusLabel(posture.rawPaymentSignatureHeaderStatus),
        ],
        [
          "raw_payment_signature_injection",
          blockedOrAbsent(posture.rawPaymentSignatureInjectionStatus),
          statusLabel(posture.rawPaymentSignatureInjectionStatus),
        ],
        [
          "sibling_x402_wrapper",
          blockedOrAbsent(posture.siblingX402WrapperStatus),
          statusLabel(posture.siblingX402WrapperStatus),
        ],
      ] as const;
      const failedDetails = checks
        .filter(([, passed]) => !passed)
        .map(([name, , status]) => `${name}_${status}_reachable`);
      return {
        passed: failedDetails.length === 0,
        evidenceDetails:
          failedDetails.length === 0
            ? [
                "raw_private_key_env_absent",
                "direct_core_client_signing_blocked",
                "direct_x402_client_absent",
                "paid_fetch_client_blocked",
                "paid_axios_client_absent",
                "package_script_payment_absent",
                "browser_side_payment_absent",
                "raw_network_payment_absent",
                "raw_payment_signature_header_blocked",
                "raw_payment_signature_injection_absent",
                "sibling_x402_wrapper_blocked",
              ]
            : failedDetails,
      };
    },
  },
  {
    probeKind: "mcp_direct_call_blocking",
    evaluate(posture) {
      const checks = [
        ["mcp_direct_payment", statusLabel(posture.mcpDirectPaymentStatus)],
        ["unmanaged_mcp_server", statusLabel(posture.unmanagedMcpServerStatus)],
        ["unmanaged_tool_packet", statusLabel(posture.unmanagedToolPacketStatus)],
      ] as const;
      const failedDetails = checks
        .filter(([, status]) => !blockedOrAbsent(status))
        .map(([name, status]) => `${name}_${status}_reachable`);
      return {
        passed: failedDetails.length === 0,
        evidenceDetails:
          failedDetails.length === 0
            ? ["mcp_direct_payment_blocked", "unmanaged_mcp_server_absent", "unmanaged_tool_packet_absent"]
            : failedDetails,
      };
    },
  },
  {
    probeKind: "token_passthrough_blocking",
    evaluate(posture) {
      return {
        passed: ["blocked", "absent"].includes(posture.tokenPassthroughStatus),
        evidenceDetails: [
          ["blocked", "absent"].includes(posture.tokenPassthroughStatus)
            ? "token_passthrough_blocked"
            : "token_passthrough_reachable",
        ],
      };
    },
  },
  {
    probeKind: "wrapper_drift",
    evaluate(posture) {
      return {
        passed: posture.wrapperDriftStatus === "absent",
        evidenceDetails: [posture.wrapperDriftStatus === "absent" ? "wrapper_drift_absent" : "wrapper_drift_present"],
      };
    },
  },
  {
    probeKind: "failure_closed",
    evaluate(posture) {
      return {
        passed: posture.failureClosedStatus === "passed",
        evidenceDetails: [posture.failureClosedStatus === "passed" ? "failure_closed_passed" : "failure_closed_failed"],
      };
    },
  },
];

export function x402PaymentHostileBypassProbeExecutors(surface: X402PaymentHostileProbeSurface): BypassProbeExecutor[] {
  return x402ProbeSpecs.map((spec) => ({
    probeKind: spec.probeKind,
    async execute(scope) {
      const posture = X402PaymentConformancePostureSchema.parse(await surface.readConformancePosture(scope));
      const evaluation = spec.evaluate(posture);
      const probeOutcome = evaluation.passed ? "passed" : "failed";
      return {
        probeOutcome,
        sourceAuthority: "gateway_probe" as const,
        reasonCodes: [evaluation.passed ? "bypass_probe_passed" : "protected_path_probe_failed"],
        evidenceRefs: evaluation.evidenceDetails.map(
          (detail) => `evidence:x402-hostile-probe:${spec.probeKind}:${detail}`,
        ),
      };
    },
  }));
}

function blockedOrAbsent(status: string | undefined): boolean {
  return status === undefined || status === "blocked" || status === "absent";
}

function statusLabel(status: string | undefined): string {
  return status ?? "absent";
}
