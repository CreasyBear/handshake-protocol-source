import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";

const repoRoot = process.cwd();
const pkg = JSON.parse(readFileSync("package.json", "utf8"));
const { projectCleanInstalledActivationProof } = await import(
  pathToFileURL(join(repoRoot, "dist/surfaces/index.mjs")).href
);
const args = process.argv.slice(2);
const proofOutputPath = optionValue(args, "--write-proof");
const packDestination = optionValue(args, "--pack-destination");
const tempRoot = await mkdtemp(join(tmpdir(), "handshake-clean-installed-"));

try {
  const packageEvidence = await extractPackedPackage({
    extractionRoot: tempRoot,
    packDestination: packDestination ?? tempRoot,
  });
  await checkBareSubpathImport(tempRoot);
  const activationEvidence = await checkInstalledProtectedToolActivation(packageEvidence.packageDir);
  const proof = projectCleanInstalledActivationProof({
    generatedAt: new Date().toISOString(),
    package: {
      name: pkg.name,
      version: pkg.version,
      packedFile: packageEvidence.packedFile,
      localArtifactPath: packageEvidence.tarballPath.startsWith(`${repoRoot}/`)
        ? packageEvidence.tarballPath.slice(repoRoot.length + 1)
        : packageEvidence.tarballPath,
      tarballSha256: packageEvidence.tarballSha256,
      tarballSizeBytes: packageEvidence.tarballSizeBytes,
      npmIntegrity: packageEvidence.packArtifact?.integrity ?? null,
      npmShasum: packageEvidence.packArtifact?.shasum ?? null,
      fileCount: packageEvidence.packArtifact?.entryCount ?? packageEvidence.packArtifact?.files?.length ?? null,
    },
    requiredInstalledSurfaces: {
      bins: ["handshake", "handshake-mcp", "handshake-protocol-kernel"],
      exports: [
        ".",
        "./adapter-sdk",
        "./cli",
        "./conformance",
        "./experimental",
        "./mcp",
        "./runtime",
        "./sdk/role-clients",
        "./x402-protected-tool",
      ],
      protectedToolExports: [
        "X402_PROTECTED_TOOL_NAME",
        "prepareProtectedX402ToolDispatch",
        "buildProtectedX402ToolHostProfile",
        "buildCodexX402ProtectedToolActivation",
        "buildClaudeCodeX402ProtectedToolActivation",
        "buildHermesX402ProtectedToolActivation",
        "buildOpenClawX402ProtectedToolActivation",
      ],
    },
    activationEvidence,
    commandRefs: [
      "npm run build",
      [
        "node scripts/check-clean-installed-activation.mjs",
        packDestination ? `--pack-destination ${packDestination}` : null,
        proofOutputPath ? `--write-proof ${proofOutputPath}` : null,
      ]
        .filter(Boolean)
        .join(" "),
    ],
  });
  if (proofOutputPath) await writeProof(proofOutputPath, proof);
  console.log(
    proofOutputPath
      ? `Clean installed activation check passed. Proof written to ${proofOutputPath}.`
      : "Clean installed activation check passed.",
  );
} finally {
  await rm(tempRoot, { recursive: true, force: true });
}

function optionValue(args, flag) {
  const flagIndex = args.indexOf(flag);
  if (flagIndex === -1) return null;
  const value = args[flagIndex + 1];
  assert.equal(typeof value, "string", `${flag} requires a value`);
  assert.notEqual(value.length, 0, `${flag} requires a non-empty value`);
  return value;
}

async function extractPackedPackage({ extractionRoot, packDestination }) {
  await mkdir(packDestination, { recursive: true });
  const pack = spawnSync("npm", ["pack", "--pack-destination", packDestination, "--json"], {
    cwd: repoRoot,
    encoding: "utf8",
    env: {
      ...process.env,
      npm_config_cache: join(extractionRoot, "npm-cache"),
    },
  });
  assert.equal(pack.status, 0, pack.stderr || pack.stdout);

  const packed = JSON.parse(pack.stdout);
  const packArtifact = packed[0];
  const packedFile = packArtifact?.filename;
  assert.equal(typeof packedFile, "string", "npm pack must return a package filename");

  const packageDir = join(extractionRoot, "node_modules", pkg.name);
  await mkdir(packageDir, { recursive: true });

  const tarballPath = join(packDestination, packedFile);
  const tarballBytes = readFileSync(tarballPath);
  const extract = spawnSync("tar", ["-xzf", tarballPath, "-C", packageDir, "--strip-components=1"], {
    encoding: "utf8",
  });
  assert.equal(extract.status, 0, extract.stderr || extract.stdout);
  return {
    packageDir,
    packArtifact,
    packedFile,
    tarballPath,
    tarballSha256: createHash("sha256").update(tarballBytes).digest("hex"),
    tarballSizeBytes: tarballBytes.byteLength,
  };
}

async function checkBareSubpathImport(tempDir) {
  const scriptPath = join(tempDir, "bare-subpath-smoke.mjs");
  await writeFile(
    scriptPath,
    `
import assert from "node:assert/strict";

const x402Tool = await import("${pkg.name}/x402-protected-tool");
assert.equal(x402Tool.X402_PROTECTED_TOOL_NAME, "handshake.actions.x402_payment.propose");
assert.equal(typeof x402Tool.prepareProtectedX402ToolDispatch, "function");
assert.equal(typeof x402Tool.buildProtectedX402ToolHostProfile, "function");
assert.equal(typeof x402Tool.buildCodexX402ProtectedToolActivation, "function");
assert.equal(typeof x402Tool.buildClaudeCodeX402ProtectedToolActivation, "function");
assert.equal(typeof x402Tool.buildHermesX402ProtectedToolActivation, "function");
assert.equal(typeof x402Tool.buildOpenClawX402ProtectedToolActivation, "function");
const exportNames = Object.keys(x402Tool).sort();
assert.equal(exportNames.includes("prepareProtectedX402ToolDispatch"), true);
assert.equal(exportNames.includes("buildProtectedX402ToolHostProfile"), true);
assert.equal(exportNames.includes("buildCodexX402ProtectedToolActivation"), true);
assert.equal(exportNames.includes("buildClaudeCodeX402ProtectedToolActivation"), true);
assert.equal(exportNames.includes("buildHermesX402ProtectedToolActivation"), true);
assert.equal(exportNames.includes("buildOpenClawX402ProtectedToolActivation"), true);
assert.equal(exportNames.some((name) => /GatewayCheck|Greenlight|PaymentPayload|Signer/.test(name)), false);
`,
  );

  const smoke = spawnSync(process.execPath, [scriptPath], {
    cwd: tempDir,
    encoding: "utf8",
  });
  assert.equal(smoke.status, 0, smoke.stderr || smoke.stdout);
}

async function checkInstalledProtectedToolActivation(packageDir) {
  const moduleUrl = pathToFileURL(join(packageDir, "dist/x402-protected-tool/index.mjs")).href;
  const demo = spawnSync(
    "bun",
    ["run", "./examples/x402-protected-spend/run.ts", "--x402-protected-tool-module-url", moduleUrl],
    {
      cwd: repoRoot,
      encoding: "utf8",
    },
  );
  assert.equal(demo.status, 0, demo.stderr || demo.stdout);

  const output = JSON.parse(readFileSync("examples/x402-protected-spend/output/latest.json", "utf8"));
  assert.equal(output.report.protectedToolGatewayHandoff.facadeImportSource, "clean_installed_package");
  assert.equal(output.report.protectedToolGatewayHandoff.runtimeDispatchPrepared, true);
  assert.equal(output.report.protectedToolGatewayHandoff.authorityCreated, false);
  assert.equal(output.report.protectedToolGatewayHandoff.greenlightCreated, false);
  assert.equal(output.report.protectedToolGatewayHandoff.gatewayCheckPerformed, false);
  assert.equal(output.report.protectedToolGatewayHandoff.mutationAttempted, false);
  assert.equal(output.report.protectedToolGatewayHandoff.credentialMaterialIncluded, false);
  assert.equal(output.report.authorityPath.policyDecision, "greenlight");
  assert.equal(output.report.authorityPath.gateDecision, "passed");
  assert.equal(output.report.authorityPath.changedParameterDecision, "refused");
  assert.equal(output.report.authorityPath.changedParameterReasonCode, "params_mismatch");
  assert.equal(output.report.authorityPath.replayDecision, "refused");
  assert.equal(output.report.authorityPath.signerInvocationsAfterGatewayAdmission, 1);
  assert.equal(output.report.authorityPath.signerInvocationsAfterReplay, 1);
  assert.equal(output.report.terminalPosture.verificationOutcome, "verified");
  assert.equal(output.report.terminalPosture.productionTerminalEvidenceSource, "receipt");
  assert.equal(output.report.terminalPosture.replayRefusal.signerReused, false);
  assert.equal(output.report.evidencePosture.gatewayAdmissionStatus, "admitted");
  assert.equal(output.report.evidencePosture.downstreamOutcomeStatus, "pending");
  assert.equal(output.report.evidencePosture.rawCredentialMaterialVisible, false);
  assert.equal(output.report.evidencePosture.surfaceOperationEvidenceLabels.includes("local_gateway_check"), true);
  assert.equal(
    output.report.evidencePosture.surfaceOperationEvidenceLabels.includes("gateway_credential_resolution"),
    true,
  );
  assert.equal(
    output.report.evidencePosture.surfaceOperationEvidenceLabels.includes("gateway_signer_invocation"),
    true,
  );
  assert.equal(output.report.evidencePosture.surfaceOperationEvidenceLabels.includes("payment_payload_created"), true);
  assert.equal(output.report.evidencePosture.omittedFields.includes("actionContract.parameters"), true);
  assert.equal(
    output.report.evidencePosture.gatewayCredentialEvidenceRefs.some((ref) =>
      ref.startsWith("gateway_credential_ref:"),
    ),
    true,
  );
  assert.equal(
    output.report.evidencePosture.downstreamEvidenceRefs.includes("evidence:x402-payment-response:demo-local-sandbox"),
    true,
  );
  assert.equal(output.cliArtifacts.contractView.actionClass, "x402_payment.exact");
  assert.equal(output.cliArtifacts.contractView.redactionProfileRef, "contract-view:v0.2-redacted");
  assert.equal(output.cliArtifacts.contractView.omittedFields.includes("parameters"), true);
  assert.equal(output.cliArtifacts.receiptTimeline.gatewayAdmissionStatus, "admitted");
  assert.equal(output.cliArtifacts.receiptTimeline.redactionProfileRef, "receipt-timeline:v0.2-redacted");
  assert.equal(output.cliArtifacts.installHealth.installHealthStatus, "satisfies_gateway_checked");
  assert.equal(output.cliArtifacts.installHealth.redactionProfileRef, "protected-path-install-health:v0.2-redacted");
  assert.equal(output.cliArtifacts.certificate.terminal.terminalKind, "receipt");
  assert.deepEqual(
    output.report.hostileGeneratedExecutionMatrix.map((row) => row.caseId),
    [
      "stale_policy_metadata",
      "raw_x402_payment_payload_input",
      "sibling_mcp_direct_payment",
      "changed_observed_parameters",
      "consumed_greenlight_replay",
    ],
  );
  assert.equal(
    output.report.hostileGeneratedExecutionMatrix.every((row) => row.consequencePrevented === true),
    true,
  );
  assert.deepEqual(output.report.hostileGeneratedExecutionMatrix[0].reasonCodes, ["protected_x402_policy_stale"]);
  assert.deepEqual(output.report.hostileGeneratedExecutionMatrix[1].reasonCodes, [
    "protected_x402_input_schema_invalid",
  ]);
  assert.equal(output.report.hostileGeneratedExecutionMatrix[2].actionContractsCreated, 0);
  assert.equal(output.report.hostileGeneratedExecutionMatrix[3].reasonCodes[0], "params_mismatch");
  assert.equal(output.report.hostileGeneratedExecutionMatrix[3].signerInvocationsAfterAttempt, 0);
  assert.equal(output.report.hostileGeneratedExecutionMatrix[4].reasonCodes[0], "already_consumed");

  const serialized = JSON.stringify(output);
  assert.equal(serialized.includes("PAYMENT-SIGNATURE:"), false);
  assert.equal(serialized.includes("PaymentPayload"), false);
  assert.equal(serialized.includes("privateKey"), false);
  assert.equal(serialized.includes(`0x${"a".repeat(130)}`), false);
  return {
    facadeImportSource: output.report.protectedToolGatewayHandoff.facadeImportSource,
    runtimeDispatchPrepared: output.report.protectedToolGatewayHandoff.runtimeDispatchPrepared,
    gatewayAdmissionStatus: output.report.evidencePosture.gatewayAdmissionStatus,
    downstreamOutcomeStatus: output.report.evidencePosture.downstreamOutcomeStatus,
    policyDecision: output.report.authorityPath.policyDecision,
    gateDecision: output.report.authorityPath.gateDecision,
    changedParameterDecision: output.report.authorityPath.changedParameterDecision,
    replayDecision: output.report.authorityPath.replayDecision,
    signerInvocationsAfterGatewayAdmission: output.report.authorityPath.signerInvocationsAfterGatewayAdmission,
    signerInvocationsAfterReplay: output.report.authorityPath.signerInvocationsAfterReplay,
    hostileGeneratedExecutionCaseIds: output.report.hostileGeneratedExecutionMatrix.map((row) => row.caseId),
    rawCredentialMaterialVisible: output.report.evidencePosture.rawCredentialMaterialVisible,
    outputRefs: ["examples/x402-protected-spend/output/latest.json", "examples/x402-protected-spend/output/latest.md"],
  };
}

async function writeProof(outputPath, proof) {
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(proof, null, 2)}\n`);
}
