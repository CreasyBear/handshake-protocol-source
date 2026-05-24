# CLI/MCP Publish Readiness Plan

## Goal

Bring the CLI and MCP Tier 2 surfaces to publishable package posture without reopening the Tier 1 kernel or implying that CLI/MCP authorize, gate, mutate, certify, settle, or host anything.

## External Source Inputs

- npm package metadata: `private: true` blocks publication, `bin` entries become PATH-installed executables, and package files must be verified through dry-run packaging.
- MCP Registry package rules: npm packages use `registryType: "npm"` in `server.json`, the official registry points to public npm artifacts, and `package.json#mcpName` must match `server.json#name`.
- MCP TypeScript SDK posture: stdio is the right local process transport for local MCP integrations, and the official client/server SDK can exercise tools/resources over stdio.
- MCP security posture: local MCP servers are local code execution surfaces, so the exact command must be inspectable and the server must avoid token passthrough, hosted auth claims, raw credential material, and ambient authority.

## Success Criteria

- `package.json` is publishable and no longer marked private.
- Node users import bundled ESM from `dist`; Bun local development can still use source through the `bun` export condition.
- `handshake` is a bundled Node CLI that emits the existing false-authority JSON envelope.
- `handshake-mcp` is a bundled Node stdio MCP server that exposes only the x402 proposal/evidence tool/resource surface.
- The package-name bin `handshake-protocol-kernel` points to the MCP server so npm/MCP package installation has a server-shaped default executable.
- `server.json` and `package.json#mcpName` are synchronized for MCP Registry publication.
- Package checks prove the npm dry-run includes source, generated types, bundled JS, bins, MCP metadata, and compact canon while excluding `.planning`, tests, scratch, old docs trees, and workspace junk.
- Published entrypoint checks spawn the actual package bins with Node and exercise CLI schema plus MCP stdio list/read/call through the official MCP client SDK.
- Claims remain explicit: CLI and MCP are evidence/proposal posture only, with no policy decision, greenlight, gateway check, mutation, receipt export, authority certificate minting, hosted operation, provider custody, settlement, broad MCP protection, or clearing-house posture.

## Non-Goals

- No hosted control plane.
- No hosted MCP server or process supervisor.
- No provider custody, wallet custody, signer export, payment settlement, facilitator operation, seller middleware, aggregate spend ledger, marketplace, certification, or cross-org trust.
- No new authority routes or Tier 1 schema changes.
- No CLI mutation command, gateway runner, receipt exporter, raw record dump, or certificate minter.
- No broad MCP/browser/shell/network/package-manager/cloud/repo interception claim.

## Mechanism

1. Package boundary
   - Remove `private: true`.
   - Add `license: "UNLICENSED"` until the owner chooses an open-source license.
   - Add `bin` entries for `handshake`, `handshake-mcp`, and `handshake-protocol-kernel`.
   - Add `./cli` and `./mcp` subpaths without exporting them from package root.

2. Build boundary
   - Keep declarations from `tsc`.
   - Add `scripts/build-package-bundles.mjs` to bundle public imports and bins with `bun build --target=node --format=esm`.
   - Keep thin Node shebang wrappers under `bin/`.

3. MCP registry boundary
   - Add `server.json` for `io.github.joelchan/handshake-protocol-kernel`.
   - Keep server description negative about authority, gateway checks, mutations, receipt export, certificates, provider custody, hosted operation, and broad MCP protection.

4. Verification boundary
   - Extend package surface tests and dry-run checks.
   - Add `scripts/check-published-entrypoints.mjs` to run `node bin/handshake schema` and connect to `node bin/handshake-mcp` using the official MCP client SDK.
   - Keep architecture tests proving CLI/MCP stay off root and away from policy/gateway/signer/receipt/certificate authority.

## Closeout Gates

```bash
npm run test -- test/architecture/claim-boundary.test.ts test/architecture/package-surface.test.ts test/architecture/root-exports.test.ts
npm run pack:check
npm run quality:claims
npm run quality:architecture
npm run check:repo
```

## Residual External Action

Actual publication still requires owner-held external credentials: npm login/publish and MCP Registry namespace authentication. Source publish-readiness means the artifact is shaped, tested, and claim-bounded for those actions; it does not mean the package was published during this goal.
