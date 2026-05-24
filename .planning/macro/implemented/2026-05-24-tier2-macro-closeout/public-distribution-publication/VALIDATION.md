# Validation

## Invariant Gate

A release passes only if every public surface preserves this statement:

Handshake is protected actions for automated decision making. Publication distributes package artifacts, proposal/evidence/read surfaces, and source-owned metadata. Publication does not create authority, policy decisions, greenlights, gateway checks, mutations, custody, hosted operation, marketplace certification, settlement, payment management, trust, or host-wide enforcement.

## Local Readiness Gates

- Package identity is explicit: name, version, `mcpName`.
- `server.json#name` matches `package.json#mcpName`.
- `server.json` uses MCP Registry schema `2025-12-11`.
- `server.json` describes npm stdio install metadata only.
- `package.json#private` is false.
- `exports` are reviewed as the public interface.
- `bin` entries point to Node-shebang executables.
- `files` allow required publication files and exclude forbidden paths.
- `npm pack --dry-run --json` evidence is captured.
- CLI schema smoke proves non-authority behavior.
- MCP stdio smoke proves runtime startup through official client path.
- Published entrypoints do not leak raw `PaymentPayload` or `SIGNATURE`.

## Documentation Gates

- README/package/server metadata do not frame Handshake as engineering-agent-only infrastructure.
- Engineering-agent language is limited to a domain example or wedge.
- x402 exact per-call is described as first proof wedge, not protocol center.
- Public docs do not imply publication-created authority.
- Public docs do not imply MCP Registry trust, certification, security review, custody, settlement, payment management, hosted operation, or enforcement.

## npm Preflight Gates

- Exact version/tag is chosen.
- Release manifest exists.
- Account ownership posture is recorded.
- 2FA/token posture is recorded.
- OIDC/trusted publishing posture is recorded.
- Provenance posture is recorded.
- Rollback/deprecation posture is recorded.
- Known proof gaps are explicit.

## npm Publish Gates

- Publish command uses exact intended package/version/tag.
- Publish operation evidence is captured.
- Provenance evidence is captured or proof gap recorded.
- Failure does not advance `actually_published`.

## Post-npm Gates

- Clean install by package name and exact version succeeds.
- Installed `handshake` bin runs.
- Installed `handshake-mcp` bin runs.
- Installed package-name bin runs.
- Installed exports resolve.
- Proposal/evidence/read surfaces operate without implying mutation authority.
- Post-publish receipt exists.
- `actually_published` is set only after clean install smoke passes.

## MCP Registry Preflight Gates

- npm package metadata is public and installable.
- `package.json#mcpName` equals `server.json#name`.
- Namespace auth evidence exists or blocks.
- Install methods are public.
- Registry wording is metadata/discoverability only.
- Preview limitations are stated.

## MCP Registry Post Gates

- Registry metadata submission evidence is captured.
- Discoverability is verified.
- Registry listing does not imply artifact trust or enforcement.
- `registry_discoverable` is set only after post-registry verification.
- Any registry preview instability is recorded as proof gap.

## Release Status Vocabulary

Allowed readiness statuses:

- `ready:proposal-mode`
- `ready:gateway-mode`
- `blocked:metadata`
- `blocked:runtime`
- `blocked:mcp-stdio`
- `blocked:package-contents`
- `blocked:namespace-auth`
- `blocked:provenance`
- `preview:unsupported-enforcement`

Forbidden status implications:

- no status may imply publication-created authority
- no status may imply MCP Registry certification
- no status may imply gateway enforcement unless a gateway check actually exists and is evidenced
- no status may imply payment or settlement management
