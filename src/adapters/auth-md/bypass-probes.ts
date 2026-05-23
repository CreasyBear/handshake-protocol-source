import { z } from "zod";
import type { BypassProbeExecutor, BypassProbeExecutionScope } from "../protected-path-probes";
import { assertNoLeakedAuthMdCredentialMaterial } from "./profiles";

const ReachabilityStatusSchema = z.enum(["blocked", "absent", "present", "unknown"]);
const DriftStatusSchema = z.enum(["absent", "present", "unknown"]);

export const AuthMdProtectedApiCallBypassPostureSchema = z.strictObject({
  credentialCustodyStatus: z.enum(["gateway_held", "runtime_exposed", "fixture_gateway_held", "unknown"]),
  rawBearerPassthroughStatus: ReachabilityStatusSchema,
  directHttpCallStatus: ReachabilityStatusSchema,
  siblingMcpCallStatus: ReachabilityStatusSchema,
  browserToolCallStatus: ReachabilityStatusSchema,
  rawNetworkCallStatus: ReachabilityStatusSchema,
  tokenReplayStatus: ReachabilityStatusSchema,
  metadataFreshnessStatus: z.enum(["fresh", "stale", "unknown"]),
  unsafeRetryLoopStatus: ReachabilityStatusSchema,
  gatewayWrapperDriftStatus: DriftStatusSchema,
  failureClosedStatus: z.enum(["passed", "failed", "unknown"]),
});
export type AuthMdProtectedApiCallBypassPosture = z.infer<typeof AuthMdProtectedApiCallBypassPostureSchema>;

export type AuthMdProtectedApiCallBypassProbeSurface = {
  readBypassPosture(scope: BypassProbeExecutionScope): Promise<AuthMdProtectedApiCallBypassPosture>;
};

type AuthMdProbeEvaluation = {
  postureLabel: AuthMdBypassPostureLabel;
  evidenceDetails: string[];
};

type AuthMdProbeSpec = {
  probeKind: BypassProbeExecutor["probeKind"];
  evaluate(posture: AuthMdProtectedApiCallBypassPosture): AuthMdProbeEvaluation;
};

export type AuthMdBypassPostureLabel = "prevented" | "detected" | "proof_gap";

const probeSpecs: AuthMdProbeSpec[] = [
  {
    probeKind: "credential_custody",
    evaluate(posture) {
      if (posture.credentialCustodyStatus === "gateway_held") {
        return { postureLabel: "prevented", evidenceDetails: ["credential_custody_gateway_held"] };
      }
      if (posture.credentialCustodyStatus === "unknown") {
        return { postureLabel: "proof_gap", evidenceDetails: ["credential_custody_unknown"] };
      }
      return {
        postureLabel: "detected",
        evidenceDetails: [`credential_custody_${posture.credentialCustodyStatus}`],
      };
    },
  },
  {
    probeKind: "raw_sibling_blocking",
    evaluate(posture) {
      return aggregateReachability([
        ["raw_bearer_passthrough", posture.rawBearerPassthroughStatus],
        ["direct_http_call", posture.directHttpCallStatus],
        ["browser_tool_call", posture.browserToolCallStatus],
        ["raw_network_call", posture.rawNetworkCallStatus],
        ["unsafe_retry_loop", posture.unsafeRetryLoopStatus],
      ]);
    },
  },
  {
    probeKind: "mcp_direct_call_blocking",
    evaluate(posture) {
      return reachability("sibling_mcp_call", posture.siblingMcpCallStatus);
    },
  },
  {
    probeKind: "token_passthrough_blocking",
    evaluate(posture) {
      return aggregateReachability([
        ["raw_bearer_passthrough", posture.rawBearerPassthroughStatus],
        ["token_replay", posture.tokenReplayStatus],
      ]);
    },
  },
  {
    probeKind: "wrapper_drift",
    evaluate(posture) {
      const details: string[] = [];
      if (posture.gatewayWrapperDriftStatus === "present") details.push("gateway_wrapper_drift_present");
      if (posture.gatewayWrapperDriftStatus === "unknown") details.push("gateway_wrapper_drift_unknown");
      if (posture.metadataFreshnessStatus === "stale") details.push("auth_md_metadata_stale");
      if (posture.metadataFreshnessStatus === "unknown") details.push("auth_md_metadata_freshness_unknown");
      if (details.some((detail) => detail.endsWith("_unknown"))) {
        return { postureLabel: "proof_gap", evidenceDetails: details };
      }
      if (details.length > 0) return { postureLabel: "detected", evidenceDetails: details };
      return { postureLabel: "prevented", evidenceDetails: ["gateway_wrapper_bound_to_fresh_metadata"] };
    },
  },
  {
    probeKind: "failure_closed",
    evaluate(posture) {
      if (posture.failureClosedStatus === "passed") {
        return { postureLabel: "prevented", evidenceDetails: ["failure_closed_passed"] };
      }
      if (posture.failureClosedStatus === "unknown") {
        return { postureLabel: "proof_gap", evidenceDetails: ["failure_closed_unknown"] };
      }
      return { postureLabel: "detected", evidenceDetails: ["failure_closed_failed"] };
    },
  },
];

export function authMdProtectedApiCallBypassProbeExecutors(
  surface: AuthMdProtectedApiCallBypassProbeSurface,
): BypassProbeExecutor[] {
  return probeSpecs.map((spec) => ({
    probeKind: spec.probeKind,
    async execute(scope) {
      const posture = AuthMdProtectedApiCallBypassPostureSchema.parse(await surface.readBypassPosture(scope));
      const evaluation = spec.evaluate(posture);
      const result = {
        probeOutcome: bypassProbeOutcomeForPostureLabel(evaluation.postureLabel),
        sourceAuthority: "gateway_probe" as const,
        reasonCodes: [reasonCodeForPostureLabel(evaluation.postureLabel)],
        evidenceRefs: evaluation.evidenceDetails.map(
          (detail) => `evidence:auth-md-hostile-probe:${spec.probeKind}:${evaluation.postureLabel}:${detail}`,
        ),
      };
      assertNoLeakedAuthMdCredentialMaterial(result);
      return result;
    },
  }));
}

export function bypassProbeOutcomeForPostureLabel(label: AuthMdBypassPostureLabel) {
  if (label === "prevented") return "passed" as const;
  if (label === "detected") return "failed" as const;
  return "inconclusive" as const;
}

export function reasonCodeForPostureLabel(label: AuthMdBypassPostureLabel): string {
  if (label === "prevented") return "auth_md_bypass_prevented";
  if (label === "detected") return "auth_md_bypass_detected";
  return "auth_md_bypass_proof_gap";
}

function aggregateReachability(
  checks: Array<[string, z.infer<typeof ReachabilityStatusSchema>]>,
): AuthMdProbeEvaluation {
  const detected = checks.filter(([, status]) => status === "present").map(([name]) => `${name}_reachable`);
  if (detected.length > 0) return { postureLabel: "detected", evidenceDetails: detected };
  const unknown = checks.filter(([, status]) => status === "unknown").map(([name]) => `${name}_unknown`);
  if (unknown.length > 0) return { postureLabel: "proof_gap", evidenceDetails: unknown };
  return {
    postureLabel: "prevented",
    evidenceDetails: checks.map(([name, status]) => `${name}_${status}`),
  };
}

function reachability(name: string, status: z.infer<typeof ReachabilityStatusSchema>): AuthMdProbeEvaluation {
  if (status === "present") return { postureLabel: "detected", evidenceDetails: [`${name}_reachable`] };
  if (status === "unknown") return { postureLabel: "proof_gap", evidenceDetails: [`${name}_unknown`] };
  return { postureLabel: "prevented", evidenceDetails: [`${name}_${status}`] };
}
