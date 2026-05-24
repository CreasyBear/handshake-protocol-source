# CLI/MCP Publish Readiness Validation

Status: closed source-owned implementation validation.

## Scope

This validation covers the publish-readiness goal for the Tier 2 CLI and MCP
surfaces only. It does not close hosted operation, provider custody, gateway
operation, receipt export, authority certificate minting, broad MCP protection,
SDK distribution, marketplace/certification, or cross-org trust.

## External Inputs Applied

- npm package metadata and bin behavior: package publication requires the package
  not be private, package bins are installed as command executables, and the
  package payload must be inspected by dry-run packaging.
- MCP Registry package metadata: `server.json` names the MCP server,
  `package.json#mcpName` matches that server name, and the package entry points
  to an npm stdio transport.
- MCP SDK and transport posture: the local MCP server is exercised by the
  official MCP TypeScript client over stdio.
- MCP security posture: the server remains local code execution posture and
  therefore exposes only proposal/evidence tools/resources, with no token,
  credential, mutation, gateway, or hosted authority path.

## Requirement-by-Requirement Audit

| Requirement | Result | Evidence |
| --- | --- | --- |
| Publishable package metadata | Pass | `package.json` has no `private: true`, has package description/license/keywords/engines, and exposes only explicit package subpaths. |
| CLI package command | Pass | `bin/handshake` is a Node wrapper for bundled `dist/bin/handshake.mjs`; `node bin/handshake schema` is exercised by `scripts/check-published-entrypoints.mjs`. |
| MCP package command | Pass | `bin/handshake-mcp` and package-name bin `handshake-protocol-kernel` point to bundled MCP stdio server code. |
| MCP Registry metadata | Pass | `server.json#name`, `package.json#mcpName`, npm package identifier, version, and stdio transport are synchronized by tests and package-entrypoint check. |
| Root export boundary | Pass | CLI and MCP are available only through explicit `./cli` and `./mcp` package subpaths and stay off the package root. |
| Authority boundary | Pass | CLI/MCP command tests, claim tests, and posture tests forbid policy, greenlight, gateway check, mutation, receipt export, certificate minting, raw records, signer custody, and credential material. |
| Package payload | Pass | `npm run pack:check` confirms package dry-run includes bins, source, generated declarations, bundled JS, MCP metadata, README/QUALITY/STRUCTURE, and compact internal docs while excluding `.planning`, tests, scratch, and old docs trees. |
| Published entrypoint smoke | Pass | `scripts/check-published-entrypoints.mjs` spawns actual Node package bins, runs CLI schema, connects to MCP stdio through the official MCP client SDK, lists tools, reads metadata, calls the x402 proposal tool, and checks false-authority fields. |
| npm publish dry-run | Pass | `npm publish --dry-run --access public --cache /tmp/handshake-npm-cache` exits 0, includes 541 files, and reports the publish action as a dry run. |
| Demo evidence | Pass | `npm run demo:mcp-transcript` regenerates the source-owned MCP transcript; `npm run demo:self-hosted` passes `aps_x402_exact_path`, `cli_readbacks`, `mcp_reference_transcript`, and `mcp_stdio_process`. |

## Gates Run

```bash
npm run demo:mcp-transcript
npm run demo:self-hosted
npm run pack:check
npm publish --dry-run --access public --cache /tmp/handshake-npm-cache
npm run quality:claims
npm run quality:architecture
npm run check:repo
```

Observed closeout:

- `npm run quality:claims`: 4 pass, 0 fail.
- `npm run quality:architecture`: 61 pass, 0 fail.
- `npm run check:repo`: 448 pass, 0 fail; package surface check passed with 541 files.
- `npm publish --dry-run --access public --cache /tmp/handshake-npm-cache`: dry-run publish of `handshake-protocol-kernel@0.2.4` succeeded with 541 files.

## Publish Boundary

The source artifact is publish-ready under the Tier 2 boundary. Actual external
publication still requires owner-held credentials for npm and MCP Registry
namespace authentication. That external account action is not performed by this
validation and does not create a Handshake authority claim.

## Residual Product Boundary

CLI/MCP are now publishable proposal/evidence surfaces. They are not execution
gates. The next product mechanism must remain adapter/runtime hardening or
operator adoption over this package boundary, not a claim that MCP or CLI
itself enforces protected mutations.
