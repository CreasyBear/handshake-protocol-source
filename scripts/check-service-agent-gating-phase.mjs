#!/usr/bin/env node
/**
 * Phase 04 service-agent-gating gate (D-25).
 * Does not assert blocked proof gates green; mutation-route manifest deferred in operator tier.
 */
import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import process from "node:process";

const args = process.argv.slice(2);
const tierIndex = args.indexOf("--tier");
const tier = tierIndex >= 0 ? args[tierIndex + 1] : "operator";

if (tier !== "operator" && tier !== "full") {
  console.error(`Unknown tier: ${tier}. Use --tier operator or --tier full.`);
  process.exit(1);
}

const operatorTests = [
  "test/architecture/operator-product-completion-contract.test.ts",
  "test/architecture/dual-enforcement-posture.test.ts",
  "test/http/transition-error-failure-class.test.ts",
  "test/product/service-operator-bootstrap.test.ts",
  "test/integration/service-operator-golden-path.test.ts",
  "test/architecture/proof-gap-honesty.test.ts",
  "test/architecture/custody-matrix-parity.test.ts",
  "test/architecture/http-handler-mutation-gating.test.ts",
  "test/sdk/role-clients-failure-class.test.ts",
  "test/mcp/mcp-failure-class-parity.test.ts",
];

const fullOnlyTests = [
  "test/architecture/maintainer-product-completion-contract.test.ts",
  "test/architecture/integrator-tier-1-parity.test.ts",
  "test/adapters/http-profile-canonicalization.test.ts",
  "test/adapters/http-profile-orphan-catalog.test.ts",
  "test/cli/cli-agent-spine-sequencer.test.ts",
];

const suite = tier === "full" ? [...operatorTests, ...fullOnlyTests] : operatorTests;

function runTest(path) {
  if (!existsSync(path)) {
    console.error(`MISSING required test: ${path}`);
    return { path, ok: false, skipped: false };
  }
  const result = spawnSync("bun", ["test", path], { stdio: "inherit" });
  return { path, ok: result.status === 0, skipped: false };
}

console.log(`\n=== check-service-agent-gating-phase (${tier} tier) ===\n`);

const results = suite.map(runTest);
const failed = results.filter((row) => !row.ok);

console.log("\n--- summary ---");
for (const row of results) {
  console.log(`${row.ok ? "PASS" : "FAIL"}  ${row.path}`);
}

if (failed.length > 0) {
  console.error(`\n${failed.length} check(s) failed for tier ${tier}.`);
  process.exit(1);
}

console.log(`\nAll ${results.length} checks passed for tier ${tier}.`);
