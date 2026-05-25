import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const repoRoot = process.cwd();
const { buildCodexMcpServerTomlBlock, projectCodexHostActivationReadback, upsertCodexMcpServerToml } = await import(
  pathToFileURL(join(repoRoot, "dist/surfaces/index.mjs")).href
);

const args = process.argv.slice(2);
const apply = args.includes("--apply");
const artifactPath = requiredOption(args, "--artifact");
const configPath = optionValue(args, "--config-path") ?? resolve(homedir(), ".codex/config.toml");
const installRoot =
  optionValue(args, "--install-root") ?? resolve(homedir(), ".codex/handshake/activations/handshake_x402");
const serverName = optionValue(args, "--server-name") ?? "handshake_x402";
const nodeCommand = optionValue(args, "--node-command") ?? process.execPath;
const proofOutputPath = optionValue(args, "--write-proof");
const pkg = JSON.parse(readFileSync("package.json", "utf8"));

const artifact = readArtifact(artifactPath);
const installDir = join(installRoot, `${pkg.name}-${pkg.version}-${artifact.sha256.slice(0, 12)}`);
const packageDir = join(installDir, "package");
const executablePath = join(packageDir, "dist/bin/handshake-mcp.mjs");
const expectedServer = {
  name: serverName,
  command: nodeCommand,
  args: [executablePath],
  executablePath,
  artifactSha256: artifact.sha256,
};
const serverBlockToml = buildCodexMcpServerTomlBlock({
  name: serverName,
  command: nodeCommand,
  args: [executablePath],
});
const configRead = readConfig(configPath);
const configPatch = upsertCodexMcpServerToml({
  existingToml: configRead.content,
  serverName,
  serverBlockToml,
});

let backupPath = null;
if (apply) {
  await installPackageFromArtifact({ artifactPath, installDir, packageDir, executablePath, artifact });
  backupPath = await writeCodexConfig({
    configPath,
    previousContent: configRead.content,
    nextContent: configPatch.toml,
  });
}

const proofConfigRead = apply ? readConfig(configPath) : configRead;
const proof = projectCodexHostActivationReadback({
  generatedAt: new Date().toISOString(),
  commandRefs: [
    [
      "node scripts/install-codex-host-activation.mjs",
      apply ? "--apply" : null,
      `--artifact ${artifactPath}`,
      `--config-path ${configPath}`,
      `--install-root ${installRoot}`,
      `--server-name ${serverName}`,
      `--node-command ${nodeCommand}`,
      proofOutputPath ? `--write-proof ${proofOutputPath}` : null,
    ]
      .filter(Boolean)
      .join(" "),
  ],
  configPath,
  configExists: proofConfigRead.exists,
  configSha256: proofConfigRead.sha256,
  configText: proofConfigRead.content,
  expectedServer,
  expectedArtifact: {
    path: artifactPath,
    exists: true,
    sha256: artifact.sha256,
    sizeBytes: artifact.sizeBytes,
  },
});
const output = {
  operationKind: "codex_host_activation_install",
  applied: apply,
  configChanged: configPatch.changed,
  backupPath,
  installDir,
  packageExecutablePath: executablePath,
  expectedServer,
  proof,
};

if (proofOutputPath) {
  await mkdir(dirname(proofOutputPath), { recursive: true });
  await writeFile(proofOutputPath, `${JSON.stringify(output, null, 2)}\n`);
}

console.log(
  proofOutputPath
    ? `Codex host activation ${apply ? "applied" : "planned"}. Proof written to ${proofOutputPath}.`
    : `Codex host activation ${apply ? "applied" : "planned"}.`,
);

function requiredOption(inputArgs, flag) {
  const value = optionValue(inputArgs, flag);
  assert.equal(typeof value, "string", `${flag} is required`);
  return value;
}

function optionValue(inputArgs, flag) {
  const flagIndex = inputArgs.indexOf(flag);
  if (flagIndex === -1) return null;
  const value = inputArgs[flagIndex + 1];
  assert.equal(typeof value, "string", `${flag} requires a value`);
  assert.notEqual(value.length, 0, `${flag} requires a non-empty value`);
  return value;
}

function readArtifact(path) {
  assert.equal(existsSync(path), true, `Artifact does not exist: ${path}`);
  const bytes = readFileSync(path);
  return {
    sha256: createHash("sha256").update(bytes).digest("hex"),
    sizeBytes: bytes.byteLength,
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

async function installPackageFromArtifact(input) {
  const markerPath = join(input.installDir, "activation-marker.json");
  if (existsSync(markerPath)) return;
  assert.equal(
    existsSync(input.packageDir),
    false,
    `Install package directory already exists without marker: ${input.packageDir}`,
  );
  await mkdir(input.packageDir, { recursive: true });
  const extract = spawnSync("tar", ["-xzf", input.artifactPath, "-C", input.packageDir, "--strip-components=1"], {
    encoding: "utf8",
  });
  assert.equal(extract.status, 0, extract.stderr || extract.stdout);
  assert.equal(existsSync(input.executablePath), true, `Extracted package missing executable: ${input.executablePath}`);
  await writeFile(
    markerPath,
    `${JSON.stringify(
      {
        packageName: pkg.name,
        packageVersion: pkg.version,
        artifactSha256: input.artifact.sha256,
        executablePath: input.executablePath,
        installedAt: new Date().toISOString(),
      },
      null,
      2,
    )}\n`,
  );
}

async function writeCodexConfig(input) {
  await mkdir(dirname(input.configPath), { recursive: true });
  const backupPath = input.previousContent
    ? `${input.configPath}.handshake-backup-${new Date().toISOString().replace(/[:.]/gu, "-")}`
    : null;
  if (backupPath) await writeFile(backupPath, input.previousContent);
  await writeFile(input.configPath, input.nextContent);
  return backupPath;
}
