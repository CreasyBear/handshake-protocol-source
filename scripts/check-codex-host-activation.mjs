import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const repoRoot = process.cwd();
const { projectCodexHostActivationReadback } = await import(
  pathToFileURL(join(repoRoot, "dist/surfaces/index.mjs")).href
);

const args = process.argv.slice(2);
const configPath = optionValue(args, "--config-path") ?? resolve(homedir(), ".codex/config.toml");
const expectedArtifactPath = optionValue(args, "--expected-artifact");
const expectedServerName = optionValue(args, "--expected-server-name") ?? "handshake_x402";
const expectedCommand = optionValue(args, "--expected-command");
const expectedArgs = optionValues(args, "--expected-arg");
const hostToolReadbackFile = optionValue(args, "--host-tool-readback-file");
const proofOutputPath = optionValue(args, "--write-proof");

const proof = buildCodexHostActivationProof({ configPath, expectedArtifactPath });

if (proofOutputPath) await writeProof(proofOutputPath, proof);

if (proof.status === "blocked") {
  console.log(
    proofOutputPath
      ? `Codex host activation is blocked. Proof written to ${proofOutputPath}.`
      : "Codex host activation is blocked.",
  );
} else {
  console.log(
    proofOutputPath
      ? `Codex host activation config readback passed. Proof written to ${proofOutputPath}.`
      : "Codex host activation config readback passed.",
  );
}

function optionValue(inputArgs, flag) {
  const flagIndex = inputArgs.indexOf(flag);
  if (flagIndex === -1) return null;
  const value = inputArgs[flagIndex + 1];
  assert.equal(typeof value, "string", `${flag} requires a value`);
  assert.notEqual(value.length, 0, `${flag} requires a non-empty value`);
  return value;
}

function optionValues(inputArgs, flag) {
  const values = [];
  for (let index = 0; index < inputArgs.length; index += 1) {
    if (inputArgs[index] !== flag) continue;
    const value = inputArgs[index + 1];
    assert.equal(typeof value, "string", `${flag} requires a value`);
    assert.notEqual(value.length, 0, `${flag} requires a non-empty value`);
    values.push(value);
  }
  return values;
}

function buildCodexHostActivationProof({ configPath, expectedArtifactPath }) {
  const configRead = readConfig(configPath);
  const expectedArtifact = expectedArtifactPath ? readExpectedArtifact(expectedArtifactPath) : null;
  const expectedServer =
    expectedCommand && expectedArgs.length > 0 && expectedArtifact?.sha256
      ? {
          name: expectedServerName,
          command: expectedCommand,
          args: expectedArgs,
          executablePath: expectedArgs[0],
          artifactSha256: expectedArtifact.sha256,
        }
      : undefined;
  return projectCodexHostActivationReadback({
    generatedAt: new Date().toISOString(),
    commandRefs: [
      [
        "node scripts/check-codex-host-activation.mjs",
        `--config-path ${configPath}`,
        expectedArtifactPath ? `--expected-artifact ${expectedArtifactPath}` : null,
        `--expected-server-name ${expectedServerName}`,
        expectedCommand ? `--expected-command ${expectedCommand}` : null,
        ...expectedArgs.map((arg) => `--expected-arg ${arg}`),
        hostToolReadbackFile ? `--host-tool-readback-file ${hostToolReadbackFile}` : null,
        proofOutputPath ? `--write-proof ${proofOutputPath}` : null,
      ]
        .filter(Boolean)
        .join(" "),
    ],
    configPath,
    configExists: configRead.exists,
    configSha256: configRead.sha256,
    configText: configRead.content,
    ...(expectedServer ? { expectedServer } : {}),
    ...(hostToolReadbackFile ? { hostToolInvocation: readHostToolInvocation(hostToolReadbackFile) } : {}),
    expectedArtifact,
  });
}

function readHostToolInvocation(path) {
  const parsed = JSON.parse(readFileSync(path, "utf8"));
  return {
    proofRef: path,
    toolVisible: parsed.tool_visible === true,
    toolCallAttempted: parsed.tool_call_attempted === true,
    outcome: typeof parsed.outcome === "string" ? parsed.outcome : "unknown",
    nonAuthorityClaims: Array.isArray(parsed.non_authority_claims)
      ? parsed.non_authority_claims.filter((claim) => typeof claim === "string")
      : [],
  };
}

function readConfig(path) {
  if (!existsSync(path)) {
    return {
      exists: false,
      content: "",
      sha256: null,
    };
  }
  const content = readFileSync(path, "utf8");
  return {
    exists: true,
    content,
    sha256: createHash("sha256").update(content).digest("hex"),
  };
}

function readExpectedArtifact(path) {
  if (!existsSync(path)) {
    return {
      path,
      exists: false,
      sha256: null,
      sizeBytes: null,
    };
  }
  const bytes = readFileSync(path);
  return {
    path,
    exists: true,
    sha256: createHash("sha256").update(bytes).digest("hex"),
    sizeBytes: bytes.byteLength,
  };
}

async function writeProof(outputPath, outputProof) {
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(outputProof, null, 2)}\n`);
}
