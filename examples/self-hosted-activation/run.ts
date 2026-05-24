import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { runCliCommand } from "../../src/cli/main";
import { buildMcpX402ReferenceTranscript } from "../../src/mcp/reference-transcript";
import { runMcpStdioProcessProof } from "../../src/mcp/stdio/process-proof";

const repoRoot = fileURLToPath(new URL("../..", import.meta.url));
const outputDir = new URL("./output/", import.meta.url);
const outputJsonPath = new URL("./output/latest.json", import.meta.url);
const outputMarkdownPath = new URL("./output/latest.md", import.meta.url);
const apsOutputPath = "examples/x402-protected-spend/output/latest.json";

const artifactPaths = {
  contractView: "examples/self-hosted-activation/output/contract-view.json",
  receiptTimeline: "examples/self-hosted-activation/output/receipt-timeline.json",
  installHealth: "examples/self-hosted-activation/output/install-health.json",
  certificate: "examples/self-hosted-activation/output/authority-certificate.json",
  trustBundle: "examples/self-hosted-activation/output/trust-bundle.json",
  supportBundleInput: "examples/self-hosted-activation/output/support-bundle-input.json",
} as const;

const activationNonClaims = [
  "no_hosted_operation",
  "no_provider_custody",
  "no_customer_custody",
  "no_cross_org_certificate_trust",
  "no_spend_window_ledger_enforcement",
  "no_broad_mcp_browser_shell_network_package_manager_protection",
  "no_workos_auth_md_attestation",
  "no_clearing_house_readiness",
] as const;

type ApsDemoOutput = {
  readonly phases: readonly {
    readonly phase: string;
    readonly verdict: string;
  }[];
  readonly cliArtifacts: {
    readonly contractView: unknown;
    readonly receiptTimeline: unknown;
    readonly installHealth: unknown;
    readonly certificate: unknown;
    readonly trustBundle: unknown;
  };
  readonly report: {
    readonly proofObject: unknown;
    readonly protectedAction: {
      readonly actionClass: string;
    };
    readonly authorityPath: {
      readonly policyDecision: unknown;
      readonly gateDecision: unknown;
      readonly replayDecision: unknown;
    };
    readonly evidencePosture: unknown;
    readonly terminalPosture: {
      readonly verificationOutcome: "verified" | "refused" | "proof_gap";
    };
  };
};

const apsRun = await runCommand("aps_x402_exact_path", [
  process.execPath,
  "run",
  "./examples/x402-protected-spend/run.ts",
]);
const apsOutput = await readJson<ApsDemoOutput>(`${repoRoot}/${apsOutputPath}`);
const cliArtifacts = apsOutput.cliArtifacts;

await mkdir(outputDir, { recursive: true });
await writeJson(artifactPaths.contractView, cliArtifacts.contractView);
await writeJson(artifactPaths.receiptTimeline, cliArtifacts.receiptTimeline);
await writeJson(artifactPaths.installHealth, cliArtifacts.installHealth);
await writeJson(artifactPaths.certificate, cliArtifacts.certificate);
await writeJson(artifactPaths.trustBundle, cliArtifacts.trustBundle);
await writeJson(artifactPaths.supportBundleInput, {
  supportCaseRef: "self-hosted-activation-local-proof",
  contractView: cliArtifacts.contractView,
  receiptTimeline: cliArtifacts.receiptTimeline,
  installHealth: cliArtifacts.installHealth,
  operatorNotes: ["Self-hosted activation fixture assembled from the local APS proof output."],
});

const cliReadbacks = await runCliReadbacks();
const mcpReference = await buildMcpX402ReferenceTranscript();
const mcpStdio = await runMcpStdioProcessProof({ cwd: repoRoot });

const output = {
  schemaVersion: "handshake.demo.self-hosted-activation.v1",
  generatedAt: new Date().toISOString(),
  invariant:
    "Self-hosted activation proves one local protected x402 path plus MCP proposal/evidence transport and CLI readbacks; it does not create hosted, custody, cross-org, or broad runtime protection claims.",
  activationCommand: "npm run demo:self-hosted",
  proofBoundary: "local_self_hosted_reference",
  outputFiles: {
    markdown: "examples/self-hosted-activation/output/latest.md",
    json: "examples/self-hosted-activation/output/latest.json",
  },
  artifacts: {
    apsReport: apsOutputPath,
    ...artifactPaths,
  },
  rows: [
    {
      id: "aps_x402_exact_path",
      verdict: apsRun.exitCode === 0 ? "pass" : "fail",
      source: "examples/x402-protected-spend/run.ts",
      evidence: {
        phases: apsOutput.phases.map((phase: { phase: string; verdict: string }) => ({
          phase: phase.phase,
          verdict: phase.verdict,
        })),
        actionClass: apsOutput.report.protectedAction.actionClass,
        policyDecision: apsOutput.report.authorityPath.policyDecision,
        gateDecision: apsOutput.report.authorityPath.gateDecision,
        replayDecision: apsOutput.report.authorityPath.replayDecision,
        certificateVerificationOutcome: apsOutput.report.terminalPosture.verificationOutcome,
      },
    },
    {
      id: "cli_readbacks",
      verdict: cliReadbacks.every((readback) => readback.ok) ? "pass" : "fail",
      source: "src/cli/main.ts",
      evidence: cliReadbacks.map((readback) => ({
        id: readback.id,
        command: readback.command,
        ok: readback.ok,
        authorityCreated: readback.authorityCreated,
        gatewayCheckPerformed: readback.gatewayCheckPerformed,
        mutationAttempted: readback.mutationAttempted,
        credentialMaterialIncluded: readback.credentialMaterialIncluded,
      })),
    },
    {
      id: "mcp_reference_transcript",
      verdict: mcpReference.rows.length === mcpReference.transcriptContract.requiredCaseIds.length ? "pass" : "fail",
      source: "src/mcp/reference-transcript.ts",
      evidence: {
        rows: mcpReference.rows.map((row) => ({
          id: row.id,
          expectedOutcome: row.expectedOutcome,
          expectedNextAction: row.expectedNextAction,
        })),
        nonClaims: mcpReference.transcriptContract.nonClaims,
      },
    },
    {
      id: "mcp_stdio_process",
      verdict: mcpStdio.toolNames.includes("handshake.actions.x402_payment.propose") ? "pass" : "fail",
      source: "src/mcp/stdio/entry.ts",
      evidence: {
        transport: mcpStdio.transport,
        toolNames: mcpStdio.toolNames,
        rows: mcpStdio.rows,
        stderr: mcpStdio.stderr,
        sdkPosture: mcpStdio.sdkPosture,
      },
    },
  ],
  apsReport: {
    proofObject: apsOutput.report.proofObject,
    protectedAction: apsOutput.report.protectedAction,
    authorityPath: apsOutput.report.authorityPath,
    evidencePosture: apsOutput.report.evidencePosture,
    terminalPosture: apsOutput.report.terminalPosture,
  },
  cliReadbacks,
  mcpStdio,
  nonClaims: activationNonClaims,
  deferredGates: [
    "hosted_control_plane_operation",
    "provider_or_customer_custody_proof_packet",
    "spend_window_reservation_ledger",
    "cross_org_certificate_trust_registry",
    "host_specific_mcp_browser_shell_network_package_manager_interception",
    "workos_auth_md_attestation",
  ],
};

assertRedacted(output);
await writeFile(outputJsonPath, `${JSON.stringify(output, null, 2)}\n`);
await writeFile(outputMarkdownPath, activationMarkdown(output));
printSummary(output);

async function runCliReadbacks() {
  const commands = [
    { id: "schema", argv: ["schema"] },
    { id: "evidence.aps-report", argv: ["evidence", "aps-report", `${repoRoot}/${apsOutputPath}`] },
    { id: "evidence.contract-view", argv: ["evidence", "contract-view", `${repoRoot}/${artifactPaths.contractView}`] },
    {
      id: "evidence.receipt-timeline",
      argv: ["evidence", "receipt-timeline", `${repoRoot}/${artifactPaths.receiptTimeline}`],
    },
    { id: "install.health", argv: ["install", "health", `${repoRoot}/${artifactPaths.installHealth}`] },
    {
      id: "cert.verify",
      argv: [
        "cert",
        "verify",
        `${repoRoot}/${artifactPaths.certificate}`,
        "--trust-bundle",
        `${repoRoot}/${artifactPaths.trustBundle}`,
      ],
    },
    { id: "support.bundle", argv: ["support", "bundle", `${repoRoot}/${artifactPaths.supportBundleInput}`] },
  ] as const;

  return Promise.all(
    commands.map(async (command) => ({
      id: command.id,
      ...(await runCliCommand(command.argv)),
    })),
  );
}

async function runCommand(label: string, command: readonly string[]) {
  const proc = Bun.spawn([...command], {
    cwd: repoRoot,
    stdout: "pipe",
    stderr: "pipe",
  });
  const stdoutPromise = proc.stdout ? new Response(proc.stdout).text() : Promise.resolve("");
  const stderrPromise = proc.stderr ? new Response(proc.stderr).text() : Promise.resolve("");
  const exitCode = await proc.exited;
  const stdout = await stdoutPromise;
  const stderr = await stderrPromise;
  if (exitCode !== 0) {
    throw new Error(`${label} failed with exit ${exitCode}: ${stderr || stdout}`);
  }
  return { label, exitCode, stdout: redact(stdout), stderr: redact(stderr) };
}

async function readJson<T>(path: string): Promise<T> {
  return JSON.parse(await readFile(path, "utf8")) as T;
}

async function writeJson(relativePath: string, value: unknown): Promise<void> {
  await writeFile(`${repoRoot}/${relativePath}`, `${JSON.stringify(value, null, 2)}\n`);
}

function assertRedacted(value: unknown): void {
  const text = JSON.stringify(value);
  const forbidden = [
    "PAYMENT-SIGNATURE",
    "PaymentPayload",
    "privateKey",
    "privateKeyPkcs8",
    "transitionTokens",
    "allRoles",
    `0x${"a".repeat(130)}`,
  ];
  for (const token of forbidden) {
    if (text.includes(token)) throw new Error(`Self-hosted packet contains raw or authority-shaped material: ${token}`);
  }
}

function redact(value: string): string {
  return value
    .replace(/PAYMENT-SIGNATURE/gu, "[redacted-payment-header-name]")
    .replace(/PaymentPayload/gu, "[redacted-payment-payload-type]")
    .replace(/privateKey/giu, "[redacted-key-field]")
    .replace(/0x[a-fA-F0-9]{64,}/gu, "[redacted-hex-material]");
}

function printSummary(outputValue: typeof output): void {
  console.log("Handshake self-hosted activation");
  console.log(`Invariant: ${outputValue.invariant}`);
  console.log(`Wrote: ${outputValue.outputFiles.markdown}`);
  console.log(`Wrote: ${outputValue.outputFiles.json}`);
  for (const row of outputValue.rows) {
    console.log(`${row.verdict.toUpperCase()} ${row.id}`);
  }
}

function activationMarkdown(outputValue: typeof output): string {
  const lines = [
    "# Handshake Self-Hosted Activation Packet",
    "",
    `Generated: ${outputValue.generatedAt}`,
    "",
    "## Invariant",
    "",
    outputValue.invariant,
    "",
    "## Activation Command",
    "",
    "```bash",
    outputValue.activationCommand,
    "```",
    "",
    "## Proof Boundary",
    "",
    outputValue.proofBoundary,
    "",
    "## Rows",
    "",
    "| Row | Verdict | Source |",
    "| --- | --- | --- |",
    ...outputValue.rows.map((row) => `| ${row.id} | ${row.verdict} | ${row.source} |`),
    "",
    "## CLI Readbacks",
    "",
    "| Command | OK | Authority created | Gateway check | Mutation | Credential material |",
    "| --- | --- | --- | --- | --- | --- |",
    ...outputValue.cliReadbacks.map(
      (readback) =>
        `| ${readback.command} | ${String(readback.ok)} | ${String(readback.authorityCreated)} | ${String(
          readback.gatewayCheckPerformed,
        )} | ${String(readback.mutationAttempted)} | ${String(readback.credentialMaterialIncluded)} |`,
    ),
    "",
    "## MCP Stdio Process",
    "",
    `- Transport: ${outputValue.mcpStdio.transport}`,
    `- Entrypoint: ${outputValue.mcpStdio.serverEntrypoint}`,
    `- Tools: ${outputValue.mcpStdio.toolNames.join(", ")}`,
    `- SDK posture: ${outputValue.mcpStdio.sdkPosture.releasePosture}`,
    "",
    "## Non-Claims",
    "",
    ...outputValue.nonClaims.map((claim) => `- ${claim}`),
    "",
    "## Deferred Gates",
    "",
    ...outputValue.deferredGates.map((gate) => `- ${gate}`),
    "",
    "## Artifacts",
    "",
    "```json",
    JSON.stringify(outputValue.artifacts, null, 2),
    "```",
    "",
  ];
  return `${lines.join("\n")}\n`;
}
