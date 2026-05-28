import { digestCanonical } from "../../protocol/foundation/canonical";
import { doctorLocalProject } from "../local-project";
import { cliNonClaims, cliOutput } from "../output";

export async function hostDoctorCommand(input: { cwd: string }) {
  const local = await doctorLocalProject(input.cwd);
  const attestationDigest = await digestCanonical({
    status: local.status,
    reasonCodes: local.reasonCodes,
    configRef: local.configRef,
    workspaceRef: local.workspaceRef,
  });

  return cliOutput({
    command: "host doctor",
    plane: "operator",
    ok: local.status === "ready",
    reasonCodes: local.reasonCodes,
    nextAction: local.status === "ready" ? "read_result" : "fix_install",
    retryability: local.status === "ready" ? "not_retryable" : "retryable_after_fix",
    redactionProfileRef: "cli-host-doctor:v1-redacted",
    nonClaims: [
      ...cliNonClaims,
      "parallel identity system",
      "hosted trust anchor",
      "gateway readiness certification",
    ],
    warnings: [
      "Host doctor output is attestation evidence for binding digests only (D-23).",
      "No ServiceWorkflowAdmission, greenlight, gateway check, or mutation was performed.",
      "configMutationPerformedByDoctor: false",
    ],
    result: {
      ...local,
      evidenceKind: "cli_diagnostic" as const,
      liveHostVerificationStatus: "not_performed" as const,
      configMutationPerformedByDoctor: false,
      attestationEvidence: {
        bindingDigestRefs: [
          local.configRef,
          local.workspaceRef,
          local.trustBundleRef,
        ].filter(Boolean),
        policyVersionDigest: local.policyVersionDigest ?? null,
        gatewayReadinessDigest: local.gatewayReadinessDigest ?? null,
      },
      attestationEvidenceRef: `handshake://local/host-doctor/${attestationDigest.slice("sha256:".length, "sha256:".length + 16)}`,
      attestationDigest,
      bindingDigestInputs: {
        configRef: local.configRef,
        workspaceRef: local.workspaceRef,
        trustBundleRef: local.trustBundleRef,
      },
    },
  });
}
