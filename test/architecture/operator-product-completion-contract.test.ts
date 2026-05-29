import { describe, expect, it } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { cliCommandManifest } from "../../src/cli/command-manifest";

const requiredDocs = [
  "docs/internal/service-operator-golden-path.md",
  "docs/internal/developer-experience-index.md",
  "docs/internal/integrator-parity-transitions.md",
] as const;

const requiredModules = [
  "src/protocol/foundation/failure-class/index.ts",
  "src/adapters/http-profile/index.ts",
] as const;

const requiredExamples = ["examples/service-operator-bootstrap/run.ts"] as const;

const forbiddenPaths = [
  "examples/auth-md-protected-api-stub",
  "examples/package-install-protected-action-stub",
  "docs/internal/service-operator-runbook.md",
  "docs/internal/host-operator-runbook.md",
] as const;

const requiredTests = [
  "test/architecture/dual-enforcement-posture.test.ts",
  "test/http/transition-error-failure-class.test.ts",
  "test/product/service-operator-bootstrap.test.ts",
  "test/architecture/proof-gap-honesty.test.ts",
  "test/architecture/custody-matrix-parity.test.ts",
  "test/integration/service-operator-golden-path.test.ts",
  "test/architecture/http-handler-mutation-gating.test.ts",
] as const;

const optionalTests = ["test/cli/cli-agent-spine-sequencer.test.ts"] as const;

function manifestHasAlias(aliases: string[]): boolean {
  return cliCommandManifest.some((entry) =>
    entry.aliases.some((alias) => aliases.some((needle) => alias.includes(needle))),
  );
}

describe("operator product completion contract", () => {
  it("ships operator TTHW docs, modules, and bootstrap example", () => {
    const missing = [
      ...requiredDocs.filter((path) => !existsSync(path)),
      ...requiredModules.filter((path) => !existsSync(path)),
      ...requiredExamples.filter((path) => !existsSync(path)),
    ].sort();
    expect(missing).toEqual([]);
  });

  it("does not require deferred runbooks, stub dirs, or mutation manifest", () => {
    const present = forbiddenPaths.filter((path) => existsSync(path)).sort();
    expect(present).toEqual([]);
    expect(existsSync("src/service-mutation-route-manifest")).toBe(false);
  });

  it("exposes service bootstrap and host doctor commands in the manifest", () => {
    expect(manifestHasAlias(["service bootstrap"])).toBe(true);
    expect(manifestHasAlias(["host doctor"])).toBe(true);
    const goldenPath = readFileSync("docs/internal/service-operator-golden-path.md", "utf8");
    expect(goldenPath).toMatch(/quickstart x402|handshake host doctor/i);
  });

  it("lists operator-tier architecture and integration tests on disk", () => {
    const missing = requiredTests.filter((path) => !existsSync(path)).sort();
    expect(missing).toEqual([]);
    for (const path of optionalTests) {
      if (!existsSync(path)) continue;
      expect(readFileSync(path, "utf8").length).toBeGreaterThan(0);
    }
  });
});
