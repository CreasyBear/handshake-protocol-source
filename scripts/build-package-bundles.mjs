import { spawnSync } from "node:child_process";

const bundles = [
  ["./src/index.ts", "./dist/index.mjs"],
  ["./src/conformance/index.ts", "./dist/conformance/index.mjs"],
  ["./src/runtime/index.ts", "./dist/runtime/index.mjs"],
  ["./src/sdk/surface-clients/index.ts", "./dist/sdk/surface-clients/index.mjs"],
  ["./src/cli/index.ts", "./dist/cli/index.mjs"],
  ["./src/mcp/index.ts", "./dist/mcp/index.mjs"],
  ["./src/experimental.ts", "./dist/experimental.mjs"],
  ["./src/cli/main.ts", "./dist/bin/handshake.mjs"],
  ["./src/mcp/stdio/entry.ts", "./dist/bin/handshake-mcp.mjs"],
];

for (const [entrypoint, outfile] of bundles) {
  const result = spawnSync("bun", ["build", entrypoint, "--target=node", "--format=esm", "--outfile", outfile], {
    encoding: "utf8",
    stdio: "pipe",
  });

  if (result.status !== 0) {
    process.stderr.write(result.stdout);
    process.stderr.write(result.stderr);
    process.exit(result.status ?? 1);
  }

  process.stdout.write(result.stdout);
}
