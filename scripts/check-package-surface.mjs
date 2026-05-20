import { spawnSync } from "node:child_process";

const requiredFiles = [
  "package.json",
  "README.md",
  "QUALITY.md",
  "STRUCTURE.md",
  "docs/internal/decisions.md",
  "docs/internal/protocol-definition.md",
  "docs/internal/protocol-kernel-architecture.md",
  "docs/internal/protocol-layman.md",
  "docs/internal/protocol-notes.md",
  "src/index.ts",
  "src/conformance/index.ts",
  "src/runtime/index.ts",
  "src/experimental.ts",
  "dist/index.d.ts",
  "dist/conformance/index.d.ts",
  "dist/runtime/index.d.ts",
  "dist/experimental.d.ts",
];

const forbiddenPathFragments = [
  ".DS_Store",
  ".planning/",
  ".agents/",
  "skills-lock.json",
  "test/",
  "docs/adr/",
  "docs/audits/",
  "docs/business/",
  "docs/plans/",
  "docs/product/",
  "docs/protocol/",
  "docs/reference/",
  "docs/specs/",
];

const pack = spawnSync("npm", ["pack", "--dry-run", "--json"], {
  encoding: "utf8",
  env: { ...process.env, npm_config_cache: "/tmp/handshake-npm-cache" },
  stdio: ["ignore", "pipe", "pipe"],
});

if (pack.status !== 0) {
  process.stderr.write(pack.stderr);
  process.exit(pack.status ?? 1);
}

const [artifact] = JSON.parse(pack.stdout);
const packageFiles = new Set(artifact.files.map((file) => file.path.replace(/^package\//, "")));
const missingFiles = requiredFiles.filter((file) => !packageFiles.has(file));
const forbiddenFiles = [...packageFiles].filter((file) =>
  forbiddenPathFragments.some((fragment) => file.includes(fragment)),
);

if (missingFiles.length > 0 || forbiddenFiles.length > 0) {
  if (missingFiles.length > 0) {
    process.stderr.write(`Package dry-run is missing required files:\n${missingFiles.join("\n")}\n`);
  }
  if (forbiddenFiles.length > 0) {
    process.stderr.write(`Package dry-run includes forbidden files:\n${forbiddenFiles.join("\n")}\n`);
  }
  process.exit(1);
}

console.log(`Package surface check passed with ${packageFiles.size} files.`);
