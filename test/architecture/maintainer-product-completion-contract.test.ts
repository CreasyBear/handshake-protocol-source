import { describe, expect, it } from "bun:test";
import { existsSync, readFileSync } from "node:fs";

const operatorContract = "test/architecture/operator-product-completion-contract.test.ts";

const maintainerOnlyTests = [
  "test/architecture/integrator-tier-1-parity.test.ts",
  "test/adapters/http-profile-canonicalization.test.ts",
  "test/adapters/http-profile-orphan-catalog.test.ts",
  "test/sdk/role-clients-failure-class.test.ts",
  "test/mcp/mcp-failure-class-parity.test.ts",
  "test/architecture/http-handler-mutation-gating.test.ts",
] as const;

const deferredManifestPaths = [
  "src/service-mutation-route-manifest",
  "scripts/sync-service-mutation-manifest-from-registry.mjs",
] as const;

describe("maintainer product completion contract", () => {
  it("includes operator contract and maintainer-only parity tests", () => {
    expect(existsSync(operatorContract)).toBe(true);
    const missing = maintainerOnlyTests.filter((path) => !existsSync(path)).sort();
    expect(missing).toEqual([]);
  });

  it("keeps deferred mutation manifest absent until phase 05", () => {
    const present = deferredManifestPaths.filter((path) => existsSync(path)).sort();
    expect(present).toEqual([]);
    const index = readFileSync(".planning/phases/04-service-agent-gating/04-PLANS-INDEX.md", "utf8");
    expect(index).toMatch(/manifest.*deferred|deferred.*manifest/i);
  });
});
