import { describe, expect, it } from "bun:test";
import {
  authMdProtectedApiCallBypassProbeExecutors,
  type AuthMdProtectedApiCallBypassPosture,
  type AuthMdProtectedApiCallBypassProbeSurface,
} from "../../src/adapters/auth-md";
import { runBypassProbeExecutors, type BypassProbeExecutionScope } from "../../src/adapters/protected-path-probes";
import type { BypassProbe } from "../../src/protocol/areas/bypass-probe";
import { authMdRawCredential, greenlitAuthMdRuntimeContract } from "../support/auth-md-flow";
import { futureIso } from "../support/fixtures";

describe("auth.md bypass probes", () => {
  it("labels safe auth.md protected-call posture as prevented bypass evidence", async () => {
    const fixture = await greenlitAuthMdRuntimeContract(undefined, "dispatch:auth-md:bypass-safe");
    const probes = await runAuthMdBypassProbes(fixture, safePosture());

    expect(probes.map((probe) => probe.probeOutcome)).toEqual([
      "passed",
      "passed",
      "passed",
      "passed",
      "passed",
      "passed",
    ]);
    expect(new Set(probes.flatMap((probe) => probe.reasonCodes))).toEqual(new Set(["auth_md_bypass_prevented"]));
    expect(probes.flatMap((probe) => probe.evidenceRefs)).toEqual(
      expect.arrayContaining([
        "evidence:auth-md-hostile-probe:credential_custody:prevented:credential_custody_gateway_held",
        "evidence:auth-md-hostile-probe:raw_sibling_blocking:prevented:direct_http_call_blocked",
        "evidence:auth-md-hostile-probe:mcp_direct_call_blocking:prevented:sibling_mcp_call_blocked",
        "evidence:auth-md-hostile-probe:token_passthrough_blocking:prevented:token_replay_blocked",
        "evidence:auth-md-hostile-probe:wrapper_drift:prevented:gateway_wrapper_bound_to_fresh_metadata",
        "evidence:auth-md-hostile-probe:failure_closed:prevented:failure_closed_passed",
      ]),
    );
    expect(JSON.stringify(probes)).not.toContain(authMdRawCredential);
  });

  it("records raw bearer, direct HTTP, MCP, browser, network, token replay, stale metadata, and retry bypasses", async () => {
    const fixture = await greenlitAuthMdRuntimeContract(undefined, "dispatch:auth-md:bypass-hostile");
    const probes = await runAuthMdBypassProbes(fixture, {
      credentialCustodyStatus: "runtime_exposed",
      rawBearerPassthroughStatus: "present",
      directHttpCallStatus: "present",
      siblingMcpCallStatus: "present",
      browserToolCallStatus: "present",
      rawNetworkCallStatus: "present",
      tokenReplayStatus: "present",
      metadataFreshnessStatus: "stale",
      unsafeRetryLoopStatus: "present",
      gatewayWrapperDriftStatus: "present",
      failureClosedStatus: "failed",
    });

    expect(failedProbeKinds(probes)).toEqual([
      "credential_custody",
      "failure_closed",
      "mcp_direct_call_blocking",
      "raw_sibling_blocking",
      "token_passthrough_blocking",
      "wrapper_drift",
    ]);
    expect(new Set(probes.flatMap((probe) => probe.reasonCodes))).toEqual(new Set(["auth_md_bypass_detected"]));
    expect(probes.flatMap((probe) => probe.evidenceRefs).sort()).toEqual(
      expect.arrayContaining([
        "evidence:auth-md-hostile-probe:credential_custody:detected:credential_custody_runtime_exposed",
        "evidence:auth-md-hostile-probe:raw_sibling_blocking:detected:raw_bearer_passthrough_reachable",
        "evidence:auth-md-hostile-probe:raw_sibling_blocking:detected:direct_http_call_reachable",
        "evidence:auth-md-hostile-probe:raw_sibling_blocking:detected:browser_tool_call_reachable",
        "evidence:auth-md-hostile-probe:raw_sibling_blocking:detected:raw_network_call_reachable",
        "evidence:auth-md-hostile-probe:raw_sibling_blocking:detected:unsafe_retry_loop_reachable",
        "evidence:auth-md-hostile-probe:mcp_direct_call_blocking:detected:sibling_mcp_call_reachable",
        "evidence:auth-md-hostile-probe:token_passthrough_blocking:detected:token_replay_reachable",
        "evidence:auth-md-hostile-probe:wrapper_drift:detected:auth_md_metadata_stale",
        "evidence:auth-md-hostile-probe:wrapper_drift:detected:gateway_wrapper_drift_present",
        "evidence:auth-md-hostile-probe:failure_closed:detected:failure_closed_failed",
      ]),
    );
    expect(JSON.stringify(probes)).not.toContain(authMdRawCredential);
  });

  it("records proof-gap posture when auth.md bypass state is unknown", async () => {
    const fixture = await greenlitAuthMdRuntimeContract(undefined, "dispatch:auth-md:bypass-proof-gap");
    const probes = await runAuthMdBypassProbes(fixture, {
      credentialCustodyStatus: "unknown",
      rawBearerPassthroughStatus: "unknown",
      directHttpCallStatus: "blocked",
      siblingMcpCallStatus: "unknown",
      browserToolCallStatus: "blocked",
      rawNetworkCallStatus: "blocked",
      tokenReplayStatus: "unknown",
      metadataFreshnessStatus: "unknown",
      unsafeRetryLoopStatus: "blocked",
      gatewayWrapperDriftStatus: "unknown",
      failureClosedStatus: "unknown",
    });

    expect(inconclusiveProbeKinds(probes)).toEqual([
      "credential_custody",
      "failure_closed",
      "mcp_direct_call_blocking",
      "raw_sibling_blocking",
      "token_passthrough_blocking",
      "wrapper_drift",
    ]);
    expect(new Set(probes.flatMap((probe) => probe.reasonCodes))).toEqual(new Set(["auth_md_bypass_proof_gap"]));
    expect(probes.flatMap((probe) => probe.evidenceRefs)).toEqual(
      expect.arrayContaining([
        "evidence:auth-md-hostile-probe:credential_custody:proof_gap:credential_custody_unknown",
        "evidence:auth-md-hostile-probe:raw_sibling_blocking:proof_gap:raw_bearer_passthrough_unknown",
        "evidence:auth-md-hostile-probe:mcp_direct_call_blocking:proof_gap:sibling_mcp_call_unknown",
        "evidence:auth-md-hostile-probe:token_passthrough_blocking:proof_gap:token_replay_unknown",
        "evidence:auth-md-hostile-probe:wrapper_drift:proof_gap:auth_md_metadata_freshness_unknown",
        "evidence:auth-md-hostile-probe:failure_closed:proof_gap:failure_closed_unknown",
      ]),
    );
    expect(JSON.stringify(probes)).not.toContain(authMdRawCredential);
  });
});

async function runAuthMdBypassProbes(
  fixture: Awaited<ReturnType<typeof greenlitAuthMdRuntimeContract>>,
  posture: AuthMdProtectedApiCallBypassPosture,
): Promise<BypassProbe[]> {
  const surface: AuthMdProtectedApiCallBypassProbeSurface = {
    async readBypassPosture() {
      return posture;
    },
  };
  return runBypassProbeExecutors(
    fixture.kernel,
    probeScope(fixture),
    authMdProtectedApiCallBypassProbeExecutors(surface),
  );
}

function probeScope(fixture: Awaited<ReturnType<typeof greenlitAuthMdRuntimeContract>>): BypassProbeExecutionScope {
  return {
    tenantId: fixture.contract.tenantId,
    organizationId: fixture.contract.organizationId,
    runtimeAdapterId: fixture.contract.runtimeAdapterId,
    gatewayId: fixture.contract.gatewayId,
    actionClass: fixture.contract.actionClass,
    resourceRef: fixture.contract.resourceRef,
    protectedSurfaceKind: fixture.contract.protectedSurfaceKind,
    expiresAt: futureIso(),
  };
}

function safePosture(): AuthMdProtectedApiCallBypassPosture {
  return {
    credentialCustodyStatus: "gateway_held",
    rawBearerPassthroughStatus: "blocked",
    directHttpCallStatus: "blocked",
    siblingMcpCallStatus: "blocked",
    browserToolCallStatus: "absent",
    rawNetworkCallStatus: "blocked",
    tokenReplayStatus: "blocked",
    metadataFreshnessStatus: "fresh",
    unsafeRetryLoopStatus: "blocked",
    gatewayWrapperDriftStatus: "absent",
    failureClosedStatus: "passed",
  };
}

function failedProbeKinds(probes: BypassProbe[]): string[] {
  return probes
    .filter((probe) => probe.probeOutcome === "failed")
    .map((probe) => probe.probeKind)
    .sort();
}

function inconclusiveProbeKinds(probes: BypassProbe[]): string[] {
  return probes
    .filter((probe) => probe.probeOutcome === "inconclusive")
    .map((probe) => probe.probeKind)
    .sort();
}
