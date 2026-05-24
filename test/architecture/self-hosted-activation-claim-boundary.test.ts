import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";

describe("Self-hosted activation claim boundary", () => {
  it("documents the self-hosted activation packet without broad protection or custody claims", () => {
    const readme = readFileSync("README.md", "utf8");
    const activationReadme = readFileSync("examples/self-hosted-activation/README.md", "utf8");
    const deferredGates = readFileSync("examples/self-hosted-activation/DEFERRED_GATES.md", "utf8");
    const runner = readFileSync("examples/self-hosted-activation/run.ts", "utf8");

    expect(readme).toContain("npm run demo:self-hosted");
    expect(readme).toContain("examples/self-hosted-activation/output/latest.md");
    expect(readme).toContain("real local MCP stdio");
    expect(activationReadme).toContain("source-owned local activation packet for the self-hosted product loop");
    expect(activationReadme).toContain("does not claim hosted operation");
    expect(activationReadme).toContain("broad MCP/browser/shell/network/package-manager protection");
    expect(deferredGates).toContain("Spend-window reservation ledger enforcement");
    expect(deferredGates).toContain("WorkOS/auth.md external attestation");
    expect(runner).toContain("no_workos_auth_md_attestation");
    expect(runner).toContain("no_broad_mcp_browser_shell_network_package_manager_protection");

    for (const text of [readme, activationReadme, deferredGates]) {
      expect(text).not.toMatch(/protects all MCP/i);
      expect(text).not.toMatch(/secures every MCP/i);
      expect(text).not.toMatch(/browser.*protected by default/i);
      expect(text).not.toMatch(/shell.*protected by default/i);
      expect(text).not.toMatch(/provider custody proof is complete/i);
      expect(text).not.toMatch(/cross-org certificate trust is live/i);
      expect(text).not.toMatch(/spend-window ledger is enforced/i);
      expect(text).not.toMatch(/WorkOS\/auth\.md attested/i);
      expect(text).not.toMatch(/clearing house is ready/i);
    }
  });
});
