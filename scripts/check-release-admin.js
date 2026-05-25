import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdtemp, readFile, readdir, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const GATE_KIND = "handshake.release_admin_gate";
const GATE_VERSION = "v1";
const DEFAULT_ARTIFACT_REPOSITORY_URL = "https://github.com/CreasyBear/handshake-protocol-kernel";
const DEFAULT_NPM_CACHE = "/tmp/handshake-npm-cache";
const FORBIDDEN_ARTIFACT_PATHS = [
  "src",
  "test",
  "scripts",
  "examples",
  "docs",
  ".planning",
  ".agents",
  "migrations",
  "node_modules",
];
const REQUIRED_ARTIFACT_PATHS = [
  "bin/handshake",
  "dist/index.mjs",
  "README.md",
  "CHANGELOG.md",
  "LICENSE",
  "NOTICE",
  "package.json",
  "server.json",
  ".handshake-release-repository-manifest.json",
  ".github/workflows/trusted-publish.yml",
];

const args = process.argv.slice(2);
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dryRun = hasFlag("--dry-run");
const jsonOutput = hasFlag("--json");
const remoteReadback = hasFlag("--remote-readback");
const allowDirty = hasFlag("--allow-dirty");
const keepTemp = hasFlag("--keep-temp");
const sourceRepo = resolve(optionValue("--source-repo") ?? repoRoot);
const artifactRepositoryUrl = optionValue("--repository-url") ?? DEFAULT_ARTIFACT_REPOSITORY_URL;
const npmCache = optionValue("--npm-cache") ?? DEFAULT_NPM_CACHE;
const explicitArtifactOut = optionValue("--artifact-out");

if (hasFlag("--help")) {
  printUsage();
  process.exit(0);
}

const sourceHead = commandOutput("git", ["rev-parse", "HEAD"], repoRoot).trim();
const sourceBranch = commandOutput("git", ["rev-parse", "--abbrev-ref", "HEAD"], repoRoot).trim();
const sourceRemote = optionalCommandOutput("git", ["config", "--get", "remote.origin.url"], repoRoot)?.trim() ?? null;
const sourceRef = optionValue("--source-ref") ?? sourceHead;
const plannedArtifactOut = explicitArtifactOut
  ? resolve(explicitArtifactOut)
  : join(tmpdir(), `handshake-release-admin-artifact-${sourceHead.slice(0, 12)}`);

const gate = {
  gateKind: GATE_KIND,
  gateVersion: GATE_VERSION,
  source: {
    repoRoot,
    sourceRepo,
    sourceRef,
    sourceHead,
    sourceBranch,
    sourceRemote,
  },
  artifact: {
    repositoryUrl: artifactRepositoryUrl,
    outDir: plannedArtifactOut,
  },
  authorityBoundary: {
    createsAuthority: false,
    createsPolicyDecision: false,
    createsGreenlight: false,
    performsGatewayCheck: false,
    performsMutation: false,
    publishesPackage: false,
    createsGitHubRelease: false,
    changesRepositoryMetadata: false,
  },
  stages: [
    stage("source.clean_worktree", "Require committed source state before release admin work."),
    stage(
      "source.clean_clone",
      "Clone source into a temporary checkout so generated local state cannot hide failures.",
    ),
    stage("source.install_dependencies", "Install from lockfile in the clean checkout."),
    stage("source.repo_gate", "Run the full source repo gate from the clean checkout."),
    stage("artifact.project", "Project the npm package artifact repository from the checked source state."),
    stage(
      "artifact.boundary",
      "Verify artifact allowlist, manifest non-authority posture, and pinned trusted-publish actions.",
    ),
    stage("artifact.smoke_imports", "Smoke package import subpaths from the artifact repository."),
    stage("artifact.smoke_cli", "Smoke the artifact CLI entrypoint."),
    stage("remote.readback", "Optionally verify source and artifact remote refs after pushes.", remoteReadback),
  ],
};

if (dryRun) {
  emit(gate);
  process.exit(0);
}

let tempRoot = null;
try {
  if (!allowDirty) assertCleanWorktree(repoRoot);
  tempRoot = await mkdtemp(join(tmpdir(), "handshake-release-admin-"));
  const cleanSourceRoot = join(tempRoot, "source");
  const artifactOut = explicitArtifactOut ? resolve(explicitArtifactOut) : join(tempRoot, "artifact");
  gate.artifact.outDir = artifactOut;

  run("git", ["clone", "--no-hardlinks", "--quiet", sourceRepo, cleanSourceRoot], repoRoot, "source.clean_clone");
  run("git", ["checkout", "--quiet", sourceRef], cleanSourceRoot, "source.clean_clone");
  assertCleanWorktree(cleanSourceRoot);

  run("bun", ["install", "--frozen-lockfile"], cleanSourceRoot, "source.install_dependencies");
  run("npm", ["run", "check:repo"], cleanSourceRoot, "source.repo_gate");
  run(
    "node",
    [
      "scripts/project-release-repository.js",
      "--out",
      artifactOut,
      "--repository-url",
      artifactRepositoryUrl,
      "--npm-cache",
      npmCache,
    ],
    cleanSourceRoot,
    "artifact.project",
  );
  await assertArtifactBoundary(artifactOut);
  run("npm", ["run", "smoke:imports"], artifactOut, "artifact.smoke_imports");
  run("npm", ["run", "smoke:cli"], artifactOut, "artifact.smoke_cli");

  if (remoteReadback) {
    runRemoteReadback(artifactOut);
  }

  emit({
    ...gate,
    status: "passed",
    tempRoot: keepTemp ? tempRoot : null,
  });
} finally {
  if (tempRoot && !keepTemp) await rm(tempRoot, { recursive: true, force: true });
}

function stage(id, description, enabled = true) {
  return { id, description, enabled };
}

function optionValue(flag) {
  const index = args.indexOf(flag);
  if (index === -1) return null;
  const value = args[index + 1];
  if (!value) fail(`${flag} requires a value`);
  return value;
}

function hasFlag(flag) {
  return args.includes(flag);
}

function run(command, commandArgs, cwd, stageId) {
  logStage(stageId, `${command} ${commandArgs.join(" ")}`);
  const result = spawnSync(command, commandArgs, {
    cwd,
    encoding: "utf8",
    env: { ...process.env, npm_config_cache: npmCache },
  });
  if (result.status !== 0) {
    fail(
      `${stageId} failed with exit ${result.status ?? "unknown"}\n${trimOutput(result.stderr)}${trimOutput(result.stdout)}`,
    );
  }
  return result.stdout;
}

function commandOutput(command, commandArgs, cwd) {
  const result = spawnSync(command, commandArgs, { cwd, encoding: "utf8" });
  if (result.status !== 0) fail(`${command} ${commandArgs.join(" ")} failed:\n${result.stderr || result.stdout}`);
  return result.stdout;
}

function optionalCommandOutput(command, commandArgs, cwd) {
  const result = spawnSync(command, commandArgs, { cwd, encoding: "utf8" });
  if (result.status !== 0) return null;
  return result.stdout;
}

function assertCleanWorktree(cwd) {
  const status = commandOutput("git", ["status", "--porcelain"], cwd);
  if (status.trim()) {
    fail(`source.clean_worktree failed: release admin requires a clean source worktree.\n${status}`);
  }
}

async function assertArtifactBoundary(artifactRoot) {
  for (const requiredPath of REQUIRED_ARTIFACT_PATHS) {
    if (!existsSync(join(artifactRoot, requiredPath))) {
      fail(`artifact.boundary failed: missing required artifact path ${requiredPath}`);
    }
  }
  for (const forbiddenPath of FORBIDDEN_ARTIFACT_PATHS) {
    if (existsSync(join(artifactRoot, forbiddenPath))) {
      fail(`artifact.boundary failed: artifact exposes forbidden path ${forbiddenPath}`);
    }
  }

  const packageJson = JSON.parse(await readFile(join(artifactRoot, "package.json"), "utf8"));
  if (packageJson.devDependencies || packageJson.overrides || packageJson.packageManager) {
    fail("artifact.boundary failed: projected package retains source-only package metadata");
  }
  if (!packageJson.scripts?.["smoke:imports"] || !packageJson.scripts?.["smoke:cli"]) {
    fail("artifact.boundary failed: projected package is missing smoke scripts");
  }

  const manifest = JSON.parse(
    await readFile(join(artifactRoot, ".handshake-release-repository-manifest.json"), "utf8"),
  );
  if (manifest.manifestKind !== "handshake.release_repository_artifact_projection") {
    fail("artifact.boundary failed: manifest kind mismatch");
  }
  for (const [key, value] of Object.entries(manifest.authorityBoundary ?? {})) {
    if (value !== false) fail(`artifact.boundary failed: manifest authority boundary ${key} is not false`);
  }

  const workflow = await readFile(join(artifactRoot, ".github/workflows/trusted-publish.yml"), "utf8");
  const floatingUses = Array.from(workflow.matchAll(/uses:\s*([^\s#]+)/g))
    .map((match) => match[1] ?? "")
    .filter((action) => !/@[0-9a-f]{40}$/.test(action));
  if (floatingUses.length > 0) {
    fail(`artifact.boundary failed: trusted-publish uses floating actions: ${floatingUses.join(", ")}`);
  }

  const artifactFiles = await listFiles(artifactRoot);
  const leaked = artifactFiles.filter((filePath) =>
    FORBIDDEN_ARTIFACT_PATHS.some(
      (forbiddenPath) => filePath === forbiddenPath || filePath.startsWith(`${forbiddenPath}/`),
    ),
  );
  if (leaked.length > 0) fail(`artifact.boundary failed: forbidden files leaked:\n${leaked.join("\n")}`);
}

function runRemoteReadback(artifactOut) {
  if (sourceRemote && sourceBranch !== "HEAD") {
    const remoteHead = firstLsRemoteSha(sourceRemote, `refs/heads/${sourceBranch}`);
    if (remoteHead !== sourceHead) {
      fail(
        `remote.readback failed: ${sourceRemote} ${sourceBranch} is ${remoteHead || "missing"}, expected ${sourceHead}`,
      );
    }
  }

  const artifactRemote = artifactRepositoryUrl.endsWith(".git")
    ? artifactRepositoryUrl
    : `${artifactRepositoryUrl}.git`;
  const artifactRemoteHead = firstLsRemoteSha(artifactRemote, "refs/heads/main");
  if (!artifactRemoteHead) fail(`remote.readback failed: artifact remote main is missing at ${artifactRemote}`);

  if (existsSync(join(artifactOut, ".git"))) {
    const localArtifactHead = commandOutput("git", ["rev-parse", "HEAD"], artifactOut).trim();
    if (artifactRemoteHead !== localArtifactHead) {
      fail(
        `remote.readback failed: artifact remote main is ${artifactRemoteHead}, but local artifact HEAD is ${localArtifactHead}`,
      );
    }
  }
}

function firstLsRemoteSha(remote, ref) {
  const output = commandOutput("git", ["ls-remote", remote, ref], repoRoot).trim();
  return output.split(/\s+/u)[0] ?? "";
}

async function listFiles(startPath) {
  const entries = await readdir(startPath, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.name === ".git") continue;
    const absolutePath = join(startPath, entry.name);
    const relativePath = normalizeRelativePath(relative(startPath, absolutePath));
    if (entry.isDirectory()) {
      const childFiles = await listFiles(absolutePath);
      files.push(...childFiles.map((childPath) => `${relativePath}/${childPath}`));
    } else if (entry.isFile()) {
      const fileStat = await stat(absolutePath);
      if (fileStat.isFile()) files.push(relativePath);
    }
  }
  return files.sort();
}

function normalizeRelativePath(value) {
  return value.split(sep).join("/");
}

function logStage(stageId, command) {
  if (!jsonOutput) process.stdout.write(`[${stageId}] ${command}\n`);
}

function emit(payload) {
  if (jsonOutput) {
    process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
    return;
  }
  process.stdout.write(`${payload.gateKind}@${payload.gateVersion}: ${payload.status ?? "planned"}\n`);
  for (const entry of payload.stages) {
    process.stdout.write(`- ${entry.enabled ? "run" : "skip"} ${entry.id}: ${entry.description}\n`);
  }
}

function trimOutput(value) {
  if (!value) return "";
  const text = value.trim();
  if (!text) return "";
  return `${text.slice(-4000)}\n`;
}

function printUsage() {
  process.stdout.write(`Usage: node scripts/check-release-admin.js [options]

Options:
  --artifact-out <dir>       Artifact repository output directory. Defaults to a temp directory.
  --source-repo <path>       Source repository to clone. Defaults to this checkout.
  --source-ref <ref>         Source ref to verify. Defaults to current HEAD.
  --repository-url <url>     Artifact repository URL. Defaults to ${DEFAULT_ARTIFACT_REPOSITORY_URL}.
  --npm-cache <dir>          npm cache used by projection. Defaults to ${DEFAULT_NPM_CACHE}.
  --remote-readback          Verify pushed source/artifact remote refs after local gates.
  --allow-dirty              Permit a dirty source checkout. Do not use for release admin.
  --dry-run                  Emit the ordered gate plan without executing it.
  --json                     Emit JSON output.
  --keep-temp                Keep temporary clean clone and artifact directories.
`);
}

function fail(message) {
  process.stderr.write(`${message}\n`);
  process.exit(1);
}
