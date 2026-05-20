import type { BypassProbeExecutor, BypassProbeExecutionScope } from "../protected-path-probes";
import { X402PaymentConformancePostureSchema, type X402PaymentConformancePosture } from "./conformance";

export type X402PaymentHostileProbeSurface = {
  readConformancePosture(scope: BypassProbeExecutionScope): Promise<X402PaymentConformancePosture>;
};

type X402ProbeEvaluation = {
  passed: boolean;
  evidenceDetail: string;
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
        evidenceDetail:
          posture.signerCustodyStatus === "gateway_held" ? "signer_gateway_held" : "signer_not_real_gateway_held",
      };
    },
  },
  {
    probeKind: "raw_sibling_blocking",
    evaluate(posture) {
      return {
        passed: posture.rawPrivateKeyEnvStatus === "absent",
        evidenceDetail:
          posture.rawPrivateKeyEnvStatus === "absent" ? "raw_private_key_env_absent" : "raw_private_key_env_reachable",
      };
    },
  },
  {
    probeKind: "mcp_direct_call_blocking",
    evaluate(posture) {
      return {
        passed: ["blocked", "absent"].includes(posture.mcpDirectPaymentStatus),
        evidenceDetail: ["blocked", "absent"].includes(posture.mcpDirectPaymentStatus)
          ? "mcp_direct_payment_blocked"
          : "mcp_direct_payment_reachable",
      };
    },
  },
  {
    probeKind: "token_passthrough_blocking",
    evaluate(posture) {
      return {
        passed: ["blocked", "absent"].includes(posture.tokenPassthroughStatus),
        evidenceDetail: ["blocked", "absent"].includes(posture.tokenPassthroughStatus)
          ? "token_passthrough_blocked"
          : "token_passthrough_reachable",
      };
    },
  },
  {
    probeKind: "wrapper_drift",
    evaluate(posture) {
      return {
        passed: posture.wrapperDriftStatus === "absent",
        evidenceDetail: posture.wrapperDriftStatus === "absent" ? "wrapper_drift_absent" : "wrapper_drift_present",
      };
    },
  },
  {
    probeKind: "failure_closed",
    evaluate(posture) {
      return {
        passed: posture.failureClosedStatus === "passed",
        evidenceDetail: posture.failureClosedStatus === "passed" ? "failure_closed_passed" : "failure_closed_failed",
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
        evidenceRefs: [`evidence:x402-hostile-probe:${spec.probeKind}:${evaluation.evidenceDetail}`],
      };
    },
  }));
}
