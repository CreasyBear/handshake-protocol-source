# Input: Public Distribution And Publication

## Hard Frame

Handshake is protected actions for automated decision making, not engineering-agent-only infrastructure.

x402 exact per-call is the first proof wedge, not the protocol center.

Public distribution means packaging and publishing proposal/evidence/read surfaces and source-owned metadata. It does not create authority, gateway custody, hosted operation, marketplace trust, certification, settlement, payment management, or host-wide enforcement.

CLI/MCP/SDK publication is distribution, not enforcement. Any command, server, package metadata, or registry listing must keep the boundary:

```text
proposal/read/evidence surface != policy decision
proposal/read/evidence surface != greenlight
proposal/read/evidence surface != gateway check
proposal/read/evidence surface != mutation
proposal/read/evidence surface != receipt export
proposal/read/evidence surface != hosted verifier trust
```

## Current Source State

Tracked source already has a publishable package boundary:

- `package.json`
  - name: `handshake-protocol-kernel`
  - version: `0.2.4`
  - `mcpName`: `io.github.joelchan/handshake-protocol-kernel`
  - bin commands:
    - `handshake` -> `bin/handshake`
    - `handshake-mcp` -> `bin/handshake-mcp`
    - `handshake-protocol-kernel` -> `bin/handshake-mcp`
  - exports:
    - `.`
    - `./conformance`
    - `./runtime`
    - `./sdk/role-clients`
    - `./cli`
    - `./mcp`
    - `./experimental`
    - `./package.json`
  - files include `bin`, `src`, `dist`, `server.json`, repo canon, and compact internal docs.

- `server.json`
  - schema: `https://static.modelcontextprotocol.io/schemas/2025-12-11/server.schema.json`
  - name: `io.github.joelchan/handshake-protocol-kernel`
  - package: npm/stdio `handshake-protocol-kernel` version `0.2.4`
  - description explicitly says proposal/evidence only and no policy, greenlight, gateway check, mutation, receipt export, authority certificate, provider custody, hosted operation, or broad MCP protection.

- `scripts/check-package-surface.mjs`
  - runs `npm pack --dry-run --json`
  - verifies required files
  - rejects package leakage of `.planning/`, `.agents/`, tests, old docs trees, `.DS_Store`, and other forbidden paths
  - rejects `package.json#private === true`

- `scripts/check-published-entrypoints.mjs`
  - asserts `package.json#mcpName` matches `server.json#name`
  - asserts `server.json` version/package metadata matches `package.json`
  - asserts bin wrappers exist and use Node shebangs
  - smoke-tests `node bin/handshake schema`
  - smoke-tests `bin/handshake-mcp` through the official MCP client SDK
  - confirms CLI/MCP outputs do not create authority, greenlight, gateway check, mutation, raw records, credential material, receipt export, or certificate mint.

Current local package docs:

- `README.md` describes packaged CLI/MCP entrypoints and MCP Registry metadata.
- `docs/internal/decisions.md` records package boundary decision.
- `.planning/codebase/STACK.md` and `.planning/codebase/INTEGRATIONS.md` record publication posture as scratch mapper outputs.

## Official External Source Constraints

Use these source constraints in the plan:

- npm publish docs:
  - `npm publish` publishes a package installable by name.
  - npm defaults to the public registry unless registry config/scope changes it.
  - `npm pack --dry-run` is the way to inspect what will be included before publication.
  - `npm publish` has `access`, `dry-run`, `otp`, `provenance`, and `provenance-file` configuration surfaces.
  - Source: https://docs.npmjs.com/cli/publish/

- npm pack docs:
  - `npm pack --dry-run --json` can report what would be packed without creating changes and can output JSON.
  - Source: https://docs.npmjs.com/cli/v11/commands/npm-pack

- npm package.json docs:
  - `name` and `version` are required identifiers for publishable packages.
  - `exports` defines the public interface and prevents arbitrary entrypoints outside exports.
  - `bin` installs executable commands and bin files should start with `#!/usr/bin/env node`.
  - `files` controls what is included.
  - Source: https://docs.npmjs.com/cli/v11/configuring-npm/package-json

- npm trusted publishing docs:
  - trusted publishing uses short-lived scoped OIDC credentials and avoids long-lived publish tokens.
  - npm recommends restricting traditional token access after trusted publishing is configured.
  - trusted publishing can automatically generate provenance for public packages from public repositories under supported conditions.
  - Source: https://docs.npmjs.com/trusted-publishers/

- npm access token / 2FA docs:
  - granular tokens can be scoped and can bypass 2FA only if configured.
  - bypassing 2FA should not be used when fully enforced 2FA is required.
  - `Require two-factor authentication and disallow tokens` prevents granular token publishing.
  - Sources:
    - https://docs.npmjs.com/about-access-tokens/
    - https://docs.npmjs.com/requiring-2fa-for-package-publishing-and-settings-modification/

- MCP Registry docs:
  - the official MCP Registry is currently preview and may have breaking changes or data resets before GA.
  - it hosts metadata, not package artifacts.
  - server metadata lives in standardized `server.json`.
  - npm package metadata in `server.json` uses `registryType: "npm"` and package identifier/version/transport.
  - npm package ownership verification requires `package.json#mcpName` to match `server.json#name`.
  - the registry supports only public installation methods / public servers and does not support private servers.
  - namespace authentication determines allowed server names.
  - the registry focuses on namespace authentication and metadata hosting; underlying package registries and downstream aggregators handle broader security scanning/curation.
  - Sources:
    - https://modelcontextprotocol.io/registry/about
    - https://modelcontextprotocol.io/registry/quickstart
    - https://modelcontextprotocol.io/registry/package-types
    - https://modelcontextprotocol.io/registry/authentication
    - https://modelcontextprotocol.io/registry/github-actions

## Planning Question

Create a macro plan for public distribution and publication that makes the package actually release-ready without overclaiming authority.

The plan must cover:

- npm package release readiness;
- MCP Registry publication readiness;
- source-owned package metadata and schema validation;
- CLI/MCP/SDK public-surface boundaries;
- provenance/trusted publishing posture;
- 2FA/token posture;
- dry-run and post-publish verification;
- release rollback/deprecation posture;
- support/readiness bundle;
- versioning/tagging/registry drift;
- docs and claim guards;
- end criteria for "ready to publish" versus "published";
- what a 10-star publication surface looks like;
- antipatterns to avoid.

## Required Output Properties

- The plan must keep CLI/MCP/SDK as proposal/evidence/read surfaces unless paired with actual gateway enforcement.
- The plan must not imply npm or MCP Registry publication is trust, certification, marketplace status, hosted operation, custody, or authority.
- The plan must separate package shape proof, account/namespace proof, publish operation proof, provenance proof, registry discoverability proof, and runtime smoke proof.
- The plan must be executable slice-by-slice.
- The plan must name validation gates and closeout commands.
- The plan must include external-source decisions and cut lines.
- The plan must include non-goals and stop conditions.
- The plan must not implement source changes.
