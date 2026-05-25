import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { chmod, cp, mkdir, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const MANIFEST_PATH = ".handshake-release-repository-manifest.json";
const DEFAULT_NPM_CACHE = "/tmp/handshake-npm-cache";
const forbiddenPackagePaths = [
  "src/",
  "test/",
  "scripts/",
  "examples/",
  "docs/internal/",
  ".planning/",
  ".agents/",
  "node_modules/",
];

const args = process.argv.slice(2);
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = optionValue("--out");
const repositoryUrl = optionValue("--repository-url") ?? "https://github.com/CreasyBear/handshake-protocol-kernel";
const npmCache = optionValue("--npm-cache") ?? DEFAULT_NPM_CACHE;

if (!outDir) {
  fail("Usage: node scripts/project-release-repository.js --out <public-repo-dir> [--repository-url <url>]");
}

const outputRoot = resolve(outDir);
assertSafeOutputRoot(outputRoot);

const workRoot = await makeWorkRoot();
const packageRoot = await packAndExtract(workRoot);
const packageFiles = await listFiles(packageRoot);
assertPackageBoundary(packageFiles);

await prepareOutputRoot(outputRoot);
for (const filePath of packageFiles) {
  await copyPackagedFile(packageRoot, outputRoot, filePath);
}
await patchProjectedPackageJson(outputRoot);
await patchProjectedServerJson(outputRoot);
await writeGeneratedFile(outputRoot, ".github/workflows/trusted-publish.yml", trustedPublishWorkflow());
await writeManifest(outputRoot);

console.log(`Projected package-artifact release repository to ${outputRoot}`);

function optionValue(flag) {
  const index = args.indexOf(flag);
  if (index === -1) return null;
  const value = args[index + 1];
  if (!value) fail(`${flag} requires a non-empty value`);
  return value;
}

function assertSafeOutputRoot(targetRoot) {
  if (targetRoot === repoRoot) {
    fail("Refusing to project the public release repository over the private working repo.");
  }
  if (repoRoot.startsWith(`${targetRoot}${sep}`)) {
    fail("Refusing to project the public release repository into a parent of the private working repo.");
  }
  if (targetRoot === resolve("/") || targetRoot === process.env.HOME) {
    fail(`Refusing unsafe output directory: ${targetRoot}`);
  }
}

async function makeWorkRoot() {
  const tempRoot = resolve("/tmp", `handshake-release-repository-${Date.now()}-${process.pid}`);
  await mkdir(tempRoot, { recursive: true });
  return tempRoot;
}

async function packAndExtract(tempRoot) {
  const pack = spawnSync("npm", ["--cache", npmCache, "pack", "--pack-destination", tempRoot, "--json"], {
    cwd: repoRoot,
    encoding: "utf8",
  });
  if (pack.status !== 0) {
    fail(`npm pack failed:\n${pack.stderr || pack.stdout}`);
  }
  const [packRecord] = JSON.parse(pack.stdout);
  const tarballPath = join(tempRoot, packRecord.filename);
  const extract = spawnSync("tar", ["-xzf", tarballPath, "-C", tempRoot], {
    cwd: repoRoot,
    encoding: "utf8",
  });
  if (extract.status !== 0) {
    fail(`tar extraction failed:\n${extract.stderr || extract.stdout}`);
  }
  return join(tempRoot, "package");
}

async function prepareOutputRoot(targetRoot) {
  await mkdir(targetRoot, { recursive: true });
  const entries = await readdir(targetRoot, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === ".git") continue;
    await rm(join(targetRoot, entry.name), { recursive: true, force: true });
  }
}

async function copyPackagedFile(packageRoot, targetRoot, filePath) {
  const sourcePath = join(packageRoot, filePath);
  const targetPath = join(targetRoot, filePath);
  await mkdir(dirname(targetPath), { recursive: true });
  await cp(sourcePath, targetPath, { recursive: true, force: true, preserveTimestamps: true });
  const sourceStat = await stat(sourcePath);
  await chmod(targetPath, sourceStat.mode);
}

async function writeGeneratedFile(targetRoot, filePath, contents) {
  const targetPath = join(targetRoot, filePath);
  await mkdir(dirname(targetPath), { recursive: true });
  await writeFile(targetPath, contents);
}

async function patchProjectedPackageJson(targetRoot) {
  const packagePath = join(targetRoot, "package.json");
  const packageJson = JSON.parse(await readFile(packagePath, "utf8"));
  packageJson.repository = {
    type: "git",
    url: `git+${repositoryUrl.replace(/\.git$/u, "")}.git`,
  };
  packageJson.homepage = `${repositoryUrl.replace(/\.git$/u, "")}#readme`;
  packageJson.bugs = {
    url: `${repositoryUrl.replace(/\.git$/u, "")}/issues`,
  };
  packageJson.publishConfig = {
    access: "public",
  };
  packageJson.scripts = {
    "smoke:cli": "node bin/handshake schema",
    "smoke:imports":
      "node -e \"Promise.all([import('./dist/index.mjs'),import('./dist/mcp/index.mjs'),import('./dist/x402-protected-tool/index.mjs')]).then(()=>console.log('package imports ok'))\"",
  };
  delete packageJson.devDependencies;
  delete packageJson.overrides;
  delete packageJson.packageManager;
  await writeFile(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`);
}

async function patchProjectedServerJson(targetRoot) {
  const serverPath = join(targetRoot, "server.json");
  const serverJson = JSON.parse(await readFile(serverPath, "utf8"));
  serverJson.repository = {
    url: repositoryUrl.replace(/\.git$/u, ""),
    source: "github",
  };
  await writeFile(serverPath, `${JSON.stringify(serverJson, null, 2)}\n`);
}

async function writeManifest(targetRoot) {
  const packageJson = JSON.parse(await readFile(join(targetRoot, "package.json"), "utf8"));
  const serverJson = JSON.parse(await readFile(join(targetRoot, "server.json"), "utf8"));
  const files = await listFiles(targetRoot);
  const manifestFiles = [];
  for (const filePath of files) {
    if (filePath === MANIFEST_PATH || filePath.startsWith(".git/")) continue;
    const absolutePath = join(targetRoot, filePath);
    const fileStat = await stat(absolutePath);
    manifestFiles.push({
      path: filePath,
      sha256: await sha256File(absolutePath),
      sizeBytes: fileStat.size,
      executable: (fileStat.mode & 0o111) !== 0,
    });
  }
  const manifest = {
    manifestKind: "handshake.release_repository_artifact_projection",
    manifestVersion: "v1",
    generatedAt: new Date().toISOString(),
    repositoryUrl,
    package: {
      name: packageJson.name,
      version: packageJson.version,
      mcpName: packageJson.mcpName,
      repositoryUrl: packageJson.repository?.url ?? null,
      serverJsonName: serverJson.name,
      serverJsonVersion: serverJson.version,
      serverJsonRepositoryUrl: serverJson.repository?.url ?? null,
    },
    authorityBoundary: {
      createsAuthority: false,
      createsPolicyDecision: false,
      createsGreenlight: false,
      performsGatewayCheck: false,
      performsMutation: false,
      publishesPackage: false,
      registersMcpServer: false,
      exposesPrivateSource: false,
    },
    generatedBy: "scripts/project-release-repository.js",
    files: manifestFiles.sort((left, right) => left.path.localeCompare(right.path)),
  };
  await writeFile(join(targetRoot, MANIFEST_PATH), `${JSON.stringify(manifest, null, 2)}\n`);
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
      files.push(relativePath);
    }
  }
  return files.sort();
}

function assertPackageBoundary(filePaths) {
  const forbidden = filePaths.filter((filePath) =>
    forbiddenPackagePaths.some((prefix) => filePath === prefix.slice(0, -1) || filePath.startsWith(prefix)),
  );
  if (forbidden.length > 0) {
    fail(`npm package contains private release-forbidden paths:\n${forbidden.map((path) => `- ${path}`).join("\n")}`);
  }
}

function trustedPublishWorkflow() {
  return `name: trusted-publish

on:
  workflow_dispatch:
    inputs:
      expected_version:
        description: Package version to publish
        required: true

permissions:
  contents: read
  id-token: write

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v6
        with:
          node-version: 24
          registry-url: https://registry.npmjs.org
          package-manager-cache: false
      - name: Verify package version
        run: node -e "const p=require('./package.json'); if (p.version !== process.env.EXPECTED_VERSION) { throw new Error('Expected '+process.env.EXPECTED_VERSION+' but package.json is '+p.version); }"
        env:
          EXPECTED_VERSION: \${{ inputs.expected_version }}
      - name: Verify repository artifact boundary
        run: |
          for path in src test scripts examples docs .planning .agents migrations node_modules; do
            test ! -e "$path"
          done
      - name: Smoke package imports and CLI
        run: npm run smoke:imports && npm run smoke:cli
      - name: Publish package with npm provenance
        run: npm publish --provenance --access public
`;
}

async function sha256File(path) {
  const bytes = await readFile(path);
  return createHash("sha256").update(bytes).digest("hex");
}

function normalizeRelativePath(value) {
  return value.split(sep).join("/");
}

function fail(message) {
  process.stderr.write(`${message}\n`);
  process.exit(1);
}
