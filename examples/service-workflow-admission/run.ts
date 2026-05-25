import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import {
  ServiceWorkflowAdmissionSchema,
  ServiceWorkflowHandleSchema,
  serviceWorkflowAdmissionSchemaVersion,
  serviceWorkflowNonAuthorityBoundary,
} from "../../src/surfaces/service-workflow-admission";

const repoRoot = fileURLToPath(new URL("../..", import.meta.url));
const outputDir = new URL("./output/", import.meta.url);
const outputJsonPath = new URL("./output/latest.json", import.meta.url);
const outputMarkdownPath = new URL("./output/latest.md", import.meta.url);
const x402OutputPath = `${repoRoot}/examples/x402-protected-spend/output/latest.json`;

const generatedAt = "2026-05-25T00:00:00.000Z";
const digest = (char: string) => `sha256:${char.repeat(64)}` as const;
const authorityBoundary = serviceWorkflowNonAuthorityBoundary();

await runExistingX402Demo();
const x402Output = asRecord(await Bun.file(x402OutputPath).json(), "x402 output");
const x402Report = asRecord(x402Output.report, "x402 report");
const protectedAction = asRecord(x402Report.protectedAction, "x402 protectedAction");
const authorityPath = asRecord(x402Report.authorityPath, "x402 authorityPath");
const evidencePosture = asRecord(x402Report.evidencePosture, "x402 evidencePosture");

const workflowHandle = ServiceWorkflowHandleSchema.parse({
  schemaVersion: serviceWorkflowAdmissionSchemaVersion,
  passportPackageDigest: digest("1"),
  passportPresentationId: "passport-presentation:x402-demo-agent:001",
  admissionId: "service-workflow-admission:x402-demo:001",
  serviceWorkflowHandleId: "service-workflow-handle:x402-demo:001",
  serviceWorkflowHandleDigest: digest("2"),
  issuedAt: generatedAt,
  expiresAt: "2026-05-25T01:00:00.000Z",
  workflowBoundsDigest: digest("3"),
  sourceAdmissionDigest: digest("4"),
  runtimePostureDigest: digest("5"),
  authorityBoundary,
  nextProtectedActionRequirement: "fresh_action_contract_required",
  allowedUse: "correlation_and_readback_context_only",
});

const admissionPacket = ServiceWorkflowAdmissionSchema.parse({
  schemaVersion: serviceWorkflowAdmissionSchemaVersion,
  passportPackageDigest: workflowHandle.passportPackageDigest,
  passportPresentationId: workflowHandle.passportPresentationId,
  admissionId: workflowHandle.admissionId,
  admissionDigest: workflowHandle.sourceAdmissionDigest,
  serviceRef: "service:x402-demo-intake",
  presentedAt: generatedAt,
  evaluatedAt: "2026-05-25T00:00:01.000Z",
  claimResults: [
    {
      claimRef: "passport:evidence-bundle:x402-demo-agent",
      claimDigest: workflowHandle.passportPackageDigest,
      status: "accepted",
      reasonCodes: ["standing_evidence_recognized_for_workflow_context"],
      evidenceRefs: ["evidence:passport-package:x402-demo-agent"],
      proofGapRefs: [],
    },
    {
      claimRef: "provider-custody:live-x402",
      claimDigest: null,
      status: "proof_gap",
      reasonCodes: ["provider_custody_not_established_by_admission"],
      evidenceRefs: [],
      proofGapRefs: ["proof-gap:provider-custody-live-x402"],
    },
  ],
  runtimePosture: [
    {
      runtimeRef: "runtime:codex-local",
      hostProfileEvidenceRef: "host-profile:codex-local-x402",
      rawSiblingBypassPostureRef: "bypass-posture:x402-raw-sibling",
      nativeContainmentClaimed: false,
      proofGapRefs: ["proof-gap:host-wide-containment"],
    },
  ],
  serviceWorkflowHandle: workflowHandle,
  authorityBoundary,
  nextActionRequirement: "fresh_action_contract_required",
  clearanceBoundary: "fresh_action_contract_required_for_each_protected_action",
  readbackBoundary: "admission_readback_is_not_receipt_evidence",
});

const output = {
  schemaVersion: "handshake.demo.service-workflow-admission.v1",
  generatedAt,
  command: "npm run demo:service-workflow-admission",
  invariant:
    "Passport, admission, and handle records support correlation and readback only; fresh protected-action clearance carries authority.",
  proofBoundary: "local_source_owned_product_surface",
  outputFiles: {
    markdown: "examples/service-workflow-admission/output/latest.md",
    json: "examples/service-workflow-admission/output/latest.json",
    composedProtectedActionJson: "examples/x402-protected-spend/output/latest.json",
  },
  admissionPacket,
  admissionReadback: {
    readbackBoundary: admissionPacket.readbackBoundary,
    admissionStatus: "accepted_with_proof_gap",
    serviceWorkflowHandleId: workflowHandle.serviceWorkflowHandleId,
    policyDecisionRef: null,
    greenlightRef: null,
    gatewayCheckRef: null,
    mutationAttemptRef: null,
    receiptRef: null,
    authorityCertificateRef: null,
    nextActionRequirement: "fresh_action_contract_required",
  },
  workflowHandle,
  freshClearanceRequest: {
    actionClass: stringField(protectedAction, "actionClass"),
    protectedSurfaceKind: stringField(protectedAction, "protectedSurfaceKind"),
    resourceRef: stringField(protectedAction, "resourceRef"),
    contextRefs: {
      passportPackageDigest: workflowHandle.passportPackageDigest,
      passportPresentationId: workflowHandle.passportPresentationId,
      admissionId: workflowHandle.admissionId,
      serviceWorkflowHandleId: workflowHandle.serviceWorkflowHandleId,
      serviceWorkflowHandleDigest: workflowHandle.serviceWorkflowHandleDigest,
    },
    contextAuthorityCreated: false,
    freshActionContractRequired: true,
  },
  freshClearanceAuthorityPath: {
    actionClass: stringField(protectedAction, "actionClass"),
    actionContractId: stringField(authorityPath, "actionContractId"),
    policyDecisionId: stringField(authorityPath, "policyDecisionId"),
    policyDecision: stringField(authorityPath, "policyDecision"),
    greenlightId: stringField(authorityPath, "greenlightId"),
    gateAttemptId: stringField(authorityPath, "gateAttemptId"),
    gateDecision: stringField(authorityPath, "gateDecision"),
    receiptId: stringField(authorityPath, "receiptId"),
    changedParameterDecision: stringField(authorityPath, "changedParameterDecision"),
    changedParameterReasonCode: stringField(authorityPath, "changedParameterReasonCode"),
    replayDecision: stringField(authorityPath, "replayDecision"),
    replayReasonCode: stringField(authorityPath, "replayReasonCode"),
  },
  evidenceSeparation: {
    admissionEvidenceRefs: admissionPacket.claimResults.flatMap((claim) => claim.evidenceRefs),
    admissionProofGapRefs: admissionPacket.claimResults.flatMap((claim) => claim.proofGapRefs),
    protectedActionOutcomeRefs: stringArrayField(evidencePosture, "surfaceOperationEvidenceRefs"),
    protectedActionProofGapRefs: stringArrayField(evidencePosture, "proofGapRefs"),
    protectedActionRefusalRefs: stringArrayField(evidencePosture, "refusalRefs"),
  },
  authorityAudit: {
    passportCreatedAuthority: false,
    admissionCreatedAuthority: false,
    handleCreatedAuthority: false,
    readbackCreatedAuthority: false,
    markdownCreatedAuthority: false,
    freshClearanceRequiredForProtectedAction: true,
    paymentMaterialInAdmissionOrHandle: false,
    credentialMaterialInAdmissionOrHandle: false,
  },
  nonClaims: [
    "hosted operation",
    "provider custody",
    "settlement finality",
    "broad x402 compatibility",
    "host-wide containment",
    "reusable passport authority",
    "handle-as-permission",
    "receipt evidence from admission readback",
  ],
  proofGaps: [
    "provider_custody_not_established_by_admission",
    "host_wide_containment_not_established_by_admission",
    "downstream_finality_remains_x402_outcome_evidence_only",
  ],
  artifacts: [
    "docs/internal/service-workflow-story.md",
    "src/surfaces/service-workflow-admission/index.ts",
    "examples/x402-protected-spend/output/latest.json",
  ],
} as const;

const markdown = renderMarkdown(output);

await mkdir(outputDir, { recursive: true });
await writeFile(outputJsonPath, `${JSON.stringify(output, null, 2)}\n`);
await writeFile(outputMarkdownPath, markdown);

console.log(markdown);
console.log("Wrote: examples/service-workflow-admission/output/latest.md");
console.log("Wrote: examples/service-workflow-admission/output/latest.json");

async function runExistingX402Demo(): Promise<void> {
  const proc = Bun.spawn([process.execPath, "run", "./examples/x402-protected-spend/run.ts"], {
    cwd: repoRoot,
    stdout: "pipe",
    stderr: "pipe",
  });
  const stdoutPromise = proc.stdout ? new Response(proc.stdout).text() : Promise.resolve("");
  const stderrPromise = proc.stderr ? new Response(proc.stderr).text() : Promise.resolve("");
  const exitCode = await proc.exited;
  const stdout = await stdoutPromise;
  const stderr = await stderrPromise;
  if (exitCode !== 0 || stderr !== "") {
    throw new Error(`x402 protected-spend demo failed: exit=${exitCode} stdout=${stdout} stderr=${stderr}`);
  }
}

function asRecord(value: unknown, label: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(`${label} must be an object.`);
  }
  return value as Record<string, unknown>;
}

function stringField(record: Record<string, unknown>, key: string): string {
  const value = record[key];
  if (typeof value !== "string") throw new Error(`${key} must be a string.`);
  return value;
}

function stringArrayField(record: Record<string, unknown>, key: string): string[] {
  const value = record[key];
  if (!Array.isArray(value)) throw new Error(`${key} must be an array.`);
  if (!value.every((entry) => typeof entry === "string")) throw new Error(`${key} must contain strings.`);
  return value;
}

function renderMarkdown(report: typeof output): string {
  return `# Service Workflow Admission Example

Generated: ${report.generatedAt}

Command: \`${report.command}\`

## Invariant

${report.invariant}

## Admission Evidence

| Field | Value |
| --- | --- |
| Passport package digest | \`${report.admissionPacket.passportPackageDigest}\` |
| Passport presentation ID | \`${report.admissionPacket.passportPresentationId}\` |
| Admission ID | \`${report.admissionPacket.admissionId}\` |
| Admission status | \`${report.admissionReadback.admissionStatus}\` |
| Creates authority | \`${report.admissionPacket.authorityBoundary.createsAuthority}\` |
| Creates policy decision | \`${report.admissionPacket.authorityBoundary.createsPolicyDecision}\` |
| Performs gateway check | \`${report.admissionPacket.authorityBoundary.performsGatewayCheck}\` |

## Workflow Handle

| Field | Value |
| --- | --- |
| Handle ID | \`${report.workflowHandle.serviceWorkflowHandleId}\` |
| Handle digest | \`${report.workflowHandle.serviceWorkflowHandleDigest}\` |
| Allowed use | \`${report.workflowHandle.allowedUse}\` |
| Next protected action requirement | \`${report.workflowHandle.nextProtectedActionRequirement}\` |
| Is reusable auth | \`${report.workflowHandle.authorityBoundary.isReusableAuth}\` |

## Readback Boundary

Admission readback is not receipt evidence. The handle is not permission. The
readback carries no policy decision, greenlight, gateway check, mutation,
receipt, certificate, credential material, x402 \`PaymentPayload\`, or
\`PAYMENT-SIGNATURE\`.

## Fresh Clearance Path

| Field | Value |
| --- | --- |
| Action class | \`${report.freshClearanceAuthorityPath.actionClass}\` |
| Action contract | \`${report.freshClearanceAuthorityPath.actionContractId}\` |
| Policy decision | \`${report.freshClearanceAuthorityPath.policyDecision}\` |
| Gateway decision | \`${report.freshClearanceAuthorityPath.gateDecision}\` |
| Replay decision | \`${report.freshClearanceAuthorityPath.replayDecision}\` |
| Changed parameter decision | \`${report.freshClearanceAuthorityPath.changedParameterDecision}\` |

x402 clearance comes only from fresh \`ActionContract -> PolicyDecision ->
one-use Greenlight -> GatewayCheck\`. The workflow handle contributes context
only.

## Evidence Separation

| Evidence class | Refs |
| --- | --- |
| Admission evidence | ${report.evidenceSeparation.admissionEvidenceRefs.map((ref) => `\`${ref}\``).join(", ") || "none"} |
| Admission proof gaps | ${report.evidenceSeparation.admissionProofGapRefs.map((ref) => `\`${ref}\``).join(", ") || "none"} |
| Protected-action outcome evidence | ${report.evidenceSeparation.protectedActionOutcomeRefs.map((ref) => `\`${ref}\``).join(", ")} |
| Protected-action proof gaps | ${report.evidenceSeparation.protectedActionProofGapRefs.map((ref) => `\`${ref}\``).join(", ") || "none"} |
| Protected-action refusals | ${report.evidenceSeparation.protectedActionRefusalRefs.map((ref) => `\`${ref}\``).join(", ")} |

## Non-Claims

${report.nonClaims.map((claim) => `- ${claim}`).join("\n")}

## Proof Gaps

${report.proofGaps.map((gap) => `- ${gap}`).join("\n")}

## Artifacts

${report.artifacts.map((artifact) => `- \`${artifact}\``).join("\n")}
`;
}
