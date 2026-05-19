import { describe, expect, it } from "bun:test";
import packageJson from "../../package.json";

type PackageExport = {
  types: string;
  import: string;
  default: string;
};

type PackageJson = {
  private: boolean;
  types: string;
  exports: Record<string, PackageExport | string>;
  files: string[];
  scripts: Record<string, string>;
};

const pkg = packageJson as PackageJson;
const deletedBusinessDocsPath = ["docs", "business"].join("/");

describe("package surface", () => {
  it("keeps the source package private while declaring protocol reference entrypoints", () => {
    expect(pkg.private).toBe(true);
    expect(pkg.types).toBe("./dist/index.d.ts");
    expect(pkg.exports["."]).toEqual({
      types: "./dist/index.d.ts",
      import: "./src/index.ts",
      default: "./src/index.ts",
    });
    expect(pkg.exports["./conformance"]).toEqual({
      types: "./dist/conformance/index.d.ts",
      import: "./src/conformance/index.ts",
      default: "./src/conformance/index.ts",
    });
    expect(pkg.exports["./experimental"]).toEqual({
      types: "./dist/experimental.d.ts",
      import: "./src/experimental.ts",
      default: "./src/experimental.ts",
    });
    expect(pkg.exports["./package.json"]).toBe("./package.json");
  });

  it("keeps packable files to source, generated declarations, and compact canon", () => {
    expect(pkg.files).toEqual([
      "src",
      "dist",
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
    expect(pkg.scripts.build).toBe("tsc -p tsconfig.build.json");
    expect(pkg.scripts["pack:check"]).toBe("npm run build && node scripts/check-package-surface.mjs");
    expect(pkg.scripts["check:repo"]).toContain("npm run pack:check");
  });
});
