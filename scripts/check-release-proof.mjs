import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const pkg = JSON.parse(readFileSync("package.json", "utf8"));
const serverJson = JSON.parse(readFileSync("server.json", "utf8"));
const readme = readFileSync("README.md", "utf8");
const decisions = readFileSync("docs/internal/decisions.md", "utf8");

assert.match(pkg.description, /protected action infrastructure for automated decision making/i);
assert.doesNotMatch(pkg.description, /engineering agents/i);
assert.ok(pkg.keywords.includes("protected-actions"));
assert.ok(pkg.keywords.includes("automated-decision-making"));
assert.notEqual(pkg.private, true);

assert.equal(pkg.mcpName, serverJson.name);
assert.equal(serverJson.version, pkg.version);
assert.equal(serverJson.packages?.[0]?.registryType, "npm");
assert.equal(serverJson.packages?.[0]?.identifier, pkg.name);
assert.match(serverJson.description, /does not issue policy decisions/i);
assert.match(serverJson.description, /does not .*gateway checks/i);
assert.match(serverJson.description, /does not .*mutations/i);
assert.doesNotMatch(serverJson.description, /certif(?:y|ies)|marketplace|settlement|payment management/i);

for (const state of ["ready_to_publish", "actually_published", "registry_discoverable"]) {
  assert.match(readme, new RegExp(state));
  assert.match(decisions, new RegExp(state));
}

assert.match(decisions, /PackageReleaseProof/);
assert.match(decisions, /npm publish has occurred for the exact package\s+and\s+version/);
assert.match(decisions, /MCP Registry metadata has been accepted/);
assert.match(decisions, /Publication does not create authority/);

console.log("Release proof readiness check passed.");
