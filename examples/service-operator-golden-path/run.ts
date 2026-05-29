import { mkdir, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const repoRoot = fileURLToPath(new URL("../..", import.meta.url));
const outputDir = new URL("./output/", import.meta.url);
const outputJsonPath = new URL("./output/latest.json", import.meta.url);

const goldenPathDoc = "docs/internal/service-operator-golden-path.md";
const devexIndexDoc = "docs/internal/developer-experience-index.md";

console.log("# Service Operator Golden Path Wrapper\n");
console.log(`Start Here: ${goldenPathDoc}`);
console.log(`Developer index: ${devexIndexDoc}`);
console.log("\nRunning canonical admission demo...\n");

const demo = spawn("npm", ["run", "demo:service-workflow-admission"], {
  cwd: repoRoot,
  stdio: "inherit",
  shell: true,
});

const exitCode: number = await new Promise((resolve, reject) => {
  demo.on("error", reject);
  demo.on("close", (code) => resolve(code ?? 1));
});

if (exitCode !== 0) {
  process.exit(exitCode);
}

await mkdir(outputDir, { recursive: true });

const summary = {
  schemaVersion: "handshake.demo.service-operator-golden-path.v1",
  generatedAt: new Date().toISOString(),
  authorityBoundary: {
    createsAuthority: false,
    permitsMutation: false,
    freshActionContractRequired: true,
  },
  docs: {
    goldenPath: goldenPathDoc,
    developerExperienceIndex: devexIndexDoc,
  },
  canonicalDemo: {
    command: "npm run demo:service-workflow-admission",
    outputJson: "examples/service-workflow-admission/output/latest.json",
  },
  nextCommands: [
    "npm run demo:service-workflow-admission",
    "handshake service bootstrap --help",
    "handshake host doctor",
  ],
};

await writeFile(outputJsonPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
console.log(`\nWrote: ${fileURLToPath(outputJsonPath)}`);
