import { describe, expect, it } from "bun:test";
import packageJson from "../../package.json";
import serverJson from "../../server.json";

type PackageExport = {
  types: string;
  bun: string;
  import: string;
  default: string;
};

type PackageJson = {
  private?: boolean;
  types: string;
  bin: Record<string, string>;
  mcpName: string;
  exports: Record<string, PackageExport | string>;
  files: string[];
  scripts: Record<string, string>;
};

const pkg = packageJson as PackageJson;
const mcpServer = serverJson as {
  name: string;
  title: string;
  description: string;
  version: string;
  packages: { registryType: string; identifier: string; version: string; transport: { type: string } }[];
};
const deletedBusinessDocsPath = ["docs", "business"].join("/");

describe("package surface", () => {
  it("declares publishable protocol, CLI, and MCP entrypoints without exposing source-only authority", () => {
    expect(pkg.private).not.toBe(true);
    expect(pkg.mcpName).toBe("io.github.joelchan/handshake-protocol-kernel");
    expect(pkg.types).toBe("./dist/index.d.ts");
    expect(pkg.bin).toEqual({
      handshake: "bin/handshake",
      "handshake-protocol-kernel": "bin/handshake-mcp",
      "handshake-mcp": "bin/handshake-mcp",
    });
    expect(pkg.exports["."]).toEqual({
      types: "./dist/index.d.ts",
      bun: "./src/index.ts",
      import: "./dist/index.mjs",
      default: "./dist/index.mjs",
    });
    expect(pkg.exports["./conformance"]).toEqual({
      types: "./dist/conformance/index.d.ts",
      bun: "./src/conformance/index.ts",
      import: "./dist/conformance/index.mjs",
      default: "./dist/conformance/index.mjs",
    });
    expect(pkg.exports["./runtime"]).toEqual({
      types: "./dist/runtime/index.d.ts",
      bun: "./src/runtime/index.ts",
      import: "./dist/runtime/index.mjs",
      default: "./dist/runtime/index.mjs",
    });
    expect(pkg.exports["./sdk/role-clients"]).toEqual({
      types: "./dist/sdk/surface-clients/index.d.ts",
      bun: "./src/sdk/surface-clients/index.ts",
      import: "./dist/sdk/surface-clients/index.mjs",
      default: "./dist/sdk/surface-clients/index.mjs",
    });
    expect(pkg.exports["./cli"]).toEqual({
      types: "./dist/cli/index.d.ts",
      bun: "./src/cli/index.ts",
      import: "./dist/cli/index.mjs",
      default: "./dist/cli/index.mjs",
    });
    expect(pkg.exports["./mcp"]).toEqual({
      types: "./dist/mcp/index.d.ts",
      bun: "./src/mcp/index.ts",
      import: "./dist/mcp/index.mjs",
      default: "./dist/mcp/index.mjs",
    });
    expect(pkg.exports["./experimental"]).toEqual({
      types: "./dist/experimental.d.ts",
      bun: "./src/experimental.ts",
      import: "./dist/experimental.mjs",
      default: "./dist/experimental.mjs",
    });
    expect(pkg.exports["./package.json"]).toBe("./package.json");
  });

  it("keeps packable files to source, generated declarations, and compact canon", () => {
    expect(pkg.files).toEqual([
      "bin",
      "src",
      "dist",
      "server.json",
      "README.md",
      "QUALITY.md",
      "STRUCTURE.md",
      "docs/internal/decisions.md",
      "docs/internal/protocol-definition.md",
      "docs/internal/protocol-kernel-architecture.md",
      "docs/internal/protocol-layman.md",
      "docs/internal/protocol-notes.md",
    ]);
    expect(pkg.files).not.toContain("test");
    expect(pkg.files).not.toContain(".planning");
    expect(pkg.files).not.toContain(".agents");
    expect(pkg.files).not.toContain(deletedBusinessDocsPath);
  });

  it("binds package checks into the full repo gate", () => {
    expect(pkg.scripts.build).toBe("npm run build:types && npm run build:bundles");
    expect(pkg.scripts["build:types"]).toBe("tsc -p tsconfig.build.json");
    expect(pkg.scripts["build:bundles"]).toBe("node scripts/build-package-bundles.mjs");
    expect(pkg.scripts["demo:self-hosted"]).toBe("bun run ./examples/self-hosted-activation/run.ts");
    expect(pkg.scripts["pack:check"]).toBe(
      "npm run build && node scripts/check-package-surface.mjs && node scripts/check-published-entrypoints.mjs",
    );
    expect(pkg.scripts["check:repo"]).toContain("npm run pack:check");
  });

  it("keeps MCP registry metadata synchronized and non-authority", () => {
    expect(mcpServer.name).toBe(pkg.mcpName);
    expect(mcpServer.version).toBe(packageJson.version);
    expect(mcpServer.packages).toEqual([
      {
        registryType: "npm",
        identifier: packageJson.name,
        version: packageJson.version,
        transport: { type: "stdio" },
      },
    ]);
    expect(mcpServer.description).toContain("does not issue policy decisions");
    expect(mcpServer.description).toContain("broad MCP protection");
  });
});
