import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "bun:test";

const repoRoot = process.cwd();
const repositoryUrl = "https://github.com/CreasyBear/handshake-protocol-kernel";

describe("release repository projection", () => {
  it("projects only the package artifact plus trusted publish workflow", () => {
    const tempRoot = mkdtempSync(join(tmpdir(), "handshake-release-repository-"));
    const releaseRoot = join(tempRoot, "release");

    try {
      const project = runNode([
        "scripts/project-release-repository.js",
        "--out",
        releaseRoot,
        "--repository-url",
        repositoryUrl,
      ]);
      expect(project.status).toBe(0);

      const manifest = readJson(join(releaseRoot, ".handshake-release-repository-manifest.json"));
      const projectedPackage = readJson(join(releaseRoot, "package.json"));
      const projectedServer = readJson(join(releaseRoot, "server.json"));
      const paths = new Set(manifest.files.map((file: { path: string }) => file.path));

      expect(manifest.manifestKind).toBe("handshake.release_repository_artifact_projection");
      expect(manifest.repositoryUrl).toBe(repositoryUrl);
      expect(manifest.package.mcpName).toBe("io.github.CreasyBear/handshake-protocol-kernel");
      expect(manifest.package.repositoryUrl).toBe("git+https://github.com/CreasyBear/handshake-protocol-kernel.git");
      expect(manifest.package.serverJsonRepositoryUrl).toBe("https://github.com/CreasyBear/handshake-protocol-kernel");
      expect(projectedPackage.mcpName).toBe(manifest.package.mcpName);
      expect(projectedPackage.repository).toEqual({
        type: "git",
        url: "git+https://github.com/CreasyBear/handshake-protocol-kernel.git",
      });
      expect(projectedPackage.scripts).toEqual({
        "smoke:cli": "node bin/handshake schema",
        "smoke:imports":
          "node -e \"Promise.all([import('./dist/index.mjs'),import('./dist/mcp/index.mjs'),import('./dist/x402-protected-tool/index.mjs')]).then(()=>console.log('package imports ok'))\"",
      });
      expect("devDependencies" in projectedPackage).toBe(false);
      expect("overrides" in projectedPackage).toBe(false);
      expect(projectedServer.name).toBe(manifest.package.mcpName);
      expect(projectedServer.repository).toEqual({
        url: "https://github.com/CreasyBear/handshake-protocol-kernel",
        source: "github",
      });

      expect(paths.has("bin/handshake")).toBe(true);
      expect(paths.has("dist/index.mjs")).toBe(true);
      expect(paths.has("LICENSE")).toBe(true);
      expect(paths.has("NOTICE")).toBe(true);
      expect(paths.has("README.md")).toBe(true);
      expect(paths.has("CHANGELOG.md")).toBe(true);
      expect(paths.has("package.json")).toBe(true);
      expect(paths.has("server.json")).toBe(true);
      expect(paths.has(".github/workflows/trusted-publish.yml")).toBe(true);

      expect(existsSync(join(releaseRoot, "src"))).toBe(false);
      expect(existsSync(join(releaseRoot, "test"))).toBe(false);
      expect(existsSync(join(releaseRoot, "scripts"))).toBe(false);
      expect(existsSync(join(releaseRoot, "examples"))).toBe(false);
      expect(existsSync(join(releaseRoot, "docs"))).toBe(false);
      expect(existsSync(join(releaseRoot, ".planning"))).toBe(false);

      const readme = readFileSync(join(releaseRoot, "README.md"), "utf8");
      expect(readme).toContain("package artifact repository, not source mirror");
      expect(readme).toContain("Trusted Publishing");
      expect(readme).toContain("MCP Registry discoverability is separate from npm publication");
      expect(readme).not.toContain("Repo Truth");
      expect(readme).not.toContain("npm run check:repo");
    } finally {
      rmSync(tempRoot, { recursive: true, force: true });
    }
  });
});

function runNode(args: string[]) {
  const path =
    process.env.PATH ??
    "/Users/joelchan/.nvm/versions/node/v22.22.0/bin:/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin:/usr/sbin:/sbin";
  return spawnSync("/usr/bin/env", ["node", ...args], {
    cwd: repoRoot,
    encoding: "utf8",
    env: { ...process.env, PATH: path, npm_config_cache: "/tmp/handshake-npm-cache" },
  });
}

function readJson(path: string) {
  return JSON.parse(readFileSync(path, "utf8"));
}
