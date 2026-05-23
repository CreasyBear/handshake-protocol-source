import { describe, expect, it } from "bun:test";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runCliCommand } from "../../src/cli/main";

const digestA = `sha256:${"a".repeat(64)}`;
const digestB = `sha256:${"b".repeat(64)}`;
const digestC = `sha256:${"c".repeat(64)}`;
const digestD = `sha256:${"d".repeat(64)}`;

describe("CLI support bundle", () => {
  it("assembles supplied redacted projections and local posture without creating authority", async () => {
    const output = await runCliCommand(["support", "bundle", await writeJson("support", supportBundleInput())]);

    expect(output).toMatchObject({
      command: "support bundle",
      plane: "evidence",
      custodyRole: "review_custody",
      ok: true,
      authorityCreated: false,
      greenlightCreated: false,
      gatewayCheckPerformed: false,
      mutationAttempted: false,
      rawInternalRecordIncluded: false,
      credentialMaterialIncluded: false,
      receiptExportCreated: false,
      result: {
        schemaVersion: "handshake.cli.support-bundle.v1",
        bundleKind: "redacted_evidence_support_bundle",
        sourceAuthority: "caller_supplied_redacted_inputs",
        actionContractRefs: ["contract_demo"],
        includedItems: {
          contractView: {
            present: true,
            redactionProfileRef: "contract-view:v0.2-redacted",
          },
          receiptTimeline: {
            present: true,
            redactionProfileRef: "receipt-timeline:v0.2-redacted",
          },
          installHealth: {
            present: false,
          },
          localX402Install: {
            present: true,
            sourceAuthority: "local_compilation",
          },
          localX402ProbeReport: {
            present: true,
            sourceAuthority: "local_classification",
          },
        },
        terminalPosture: {
          policyDecisionStatus: "greenlight",
          gatewayCheckStatus: "passed",
          gatewayAdmissionStatus: "admitted",
          downstreamOutcomeStatus: "unknown",
          finalityStatus: "suspect",
          proofGapRefs: ["proof_gap_demo"],
        },
        localReadiness: {
          installReadinessAuthority: "local_compilation",
          trustedInstallReadiness: false,
          probeReadinessAuthority: "local_classification",
          trustedProbeReadiness: false,
          nextReadinessAction: "register_control_plane_install",
        },
        reasonCodes: ["x402_paid_fetch_client_not_blocked"],
        rawMaterialOmitted: [
          "payment_payload_material",
          "payment_signature_header",
          "key_material",
          "account_secret_material",
          "role_token_values",
          "transition_token_values",
          "internal_record_dumps",
          "request_body_dumps",
          "gateway_credential_material",
          "mutation_commands",
          "receipt_exports",
        ],
      },
    });
    expect(JSON.stringify(output)).not.toContain("PAYMENT-SIGNATURE");
    expect(JSON.stringify(output)).not.toContain("PaymentPayload");
    expect(JSON.stringify(output)).not.toContain("private_key");
    expect(JSON.stringify(output)).not.toContain("hs.control_plane.");
  });
});

async function writeJson(prefix: string, value: unknown): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), `handshake-cli-${prefix}-`));
  await mkdir(dir, { recursive: true });
  const path = join(dir, "input.json");
  await writeFile(path, JSON.stringify(value, null, 2));
  return path;
}

function supportBundleInput() {
  return {
    supportCaseRef: "support_case_demo",
    contractView: contractView(),
    receiptTimeline: receiptTimeline(),
    localX402Install: localX402Install(),
    localX402ProbeReport: localX402ProbeReport(),
  };
}

function contractView() {
  return {
    actionContractRef: "contract_demo",
    contractDigest: digestA,
    intentCompilationRef: "intent_demo",
    candidateActionRef: "candidate_demo",
    candidateDigest: digestB,
    envelopeRef: "envelope_demo",
    principalRef: "principal_demo",
    agentRef: "agent_demo",
    participantIdentityBindings: [],
    runId: "run_demo",
    runtimeAdapterRef: "runtime_demo",
    actionClass: "x402_payment.exact",
    protectedSurfaceKind: "x402_payment",
    resourceRef: "x402:base-sepolia:payee:https://seller.example.com/report",
    gatewayId: "gateway_demo",
    gatewayPolicyVersion: "v1",
    requiredProtectedPathState: "gateway_checked",
    idempotencyKey: "idempotency_demo",
    paramsDigest: digestC,
    nonSecretParamsSummary: { method: "GET" },
    gatewayCredentialRefs: [],
    evidenceRefs: [],
    clearingEvidenceRefs: {},
    signaturePosture: "local_hmac",
    keyIdentityRef: "key_demo",
    verificationPolicyRef: "verification_demo",
    generatedExecutionGraphRef: null,
    generatedExecutionNodeRef: null,
    redactionProfileRef: "contract-view:v0.2-redacted",
    omittedFields: ["parameters", "secretRefs", "contractSignature"],
  };
}

function receiptTimeline() {
  return {
    receiptRef: "receipt_demo",
    actionContractRef: "contract_demo",
    policyDecisionRef: "policy_demo",
    greenlightRef: "greenlight_demo",
    gateAttemptRef: "gate_demo",
    mutationAttemptRef: "mutation_demo",
    gatewayId: "gateway_demo",
    policyDecisionStatus: "greenlight",
    gatewayCheckStatus: "passed",
    gatewayAdmissionStatus: "admitted",
    greenlightConsumptionStatus: "consumed",
    mutationAttemptStatus: "submitted",
    downstreamExecutionStatus: "unknown",
    downstreamOutcomeStatus: "unknown",
    proofGapRefs: ["proof_gap_demo"],
    finalityStatus: "suspect",
    receiptDigest: null,
    auditChainDigest: null,
    streamOffsets: [],
    events: [],
    missingEventCount: 0,
    failureEvidence: null,
    redactionProfileRef: "receipt-timeline:v0.2-redacted",
    omittedFields: ["payload", "evidenceRefs"],
  };
}

function localX402Install() {
  return {
    schemaVersion: "handshake.cli.x402-install.v1",
    projectId: "proj_support",
    recordedAt: "2026-05-23T00:00:00.000Z",
    installProposalRef: "install_demo",
    installDigest: digestD,
    installStatus: "ready_to_install",
    adapterPackId: "adapter_pack_x402_payment_exact",
    actionClass: "x402_payment.exact",
    protectedSurfaceKind: "x402_payment",
    resourceRef: "x402:cli-local",
    endpointDomain: "seller.example.com",
    paymentRequirementsDigest: digestA,
    selectedPaymentRequirementIndex: 0,
    selectedPaymentRequirementDigest: digestB,
    perCallAmountBound: "2500",
    spendWindowEnforcementStatus: "not_enforced_tier1_metadata",
    gatewayAuthorityRefDigest: digestC,
    paymentCredentialRefDigest: digestD,
    credentialCustodyStatus: "gateway_held",
    rawCredentialRefsIncluded: false,
    unsupportedX402Surfaces: [],
    refusalReasonCodes: [],
    compiledRecordsIncluded: false,
    compiledRecordRefs: null,
    readinessAuthority: "local_compilation",
    trustedInstallReadiness: false,
    nextReadinessAction: "register_control_plane_install",
    controlPlaneRegistrationRequired: true,
    controlPlaneRegistrationPerformed: false,
    authorityCreated: false,
    gatewayCheckPerformed: false,
    mutationAttempted: false,
  };
}

function localX402ProbeReport() {
  return {
    schemaVersion: "handshake.cli.x402-probe-report.v1",
    projectId: "proj_support",
    observedAt: "2026-05-23T00:00:00.000Z",
    expiresAt: "2026-05-23T01:00:00.000Z",
    adapterPackId: "adapter_pack_x402_payment_exact",
    actionClass: "x402_payment.exact",
    protectedSurfaceKind: "x402_payment",
    readinessAuthority: "local_classification",
    trustedReadiness: false,
    passed: false,
    reasonCodes: ["x402_paid_fetch_client_not_blocked"],
    probeCoverage: [],
    postureDigest: digestA,
    authorityCreated: false,
    gatewayCheckPerformed: false,
    mutationAttempted: false,
  };
}
