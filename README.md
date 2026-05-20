# Handshake Protocol Kernel

Handshake is contracted execution infrastructure for engineering agents.

Last canonical audit: 2026-05-20.

This checkout is the TypeScript protocol kernel for protected action control:

```text
vague principal intent
-> runtime execution evidence
-> generated execution graph
-> intent compilation record
-> candidate action
-> exact action contract
-> policy decision
-> one-use greenlight or refusal
-> gateway check before mutation
-> receipt, refusal, or proof gap
-> optional terminal AuthorityCertificate
```

The kernel does not claim hosted operation, provider-side enforcement, broad agent governance, or downstream business success. A path is protected only when the gateway owns the mutation credential and verifies the exact greenlight before mutation.

Current local foundation status: source and tests cover the protected-action kernel chain, derived lifecycle evidence, idempotency ledger, redacted evidence projections including agent transaction envelopes, terminal AuthorityCertificate minting and offline pinned-key verification, package-install supply-chain gate binding, the local x402 payment D1/HTTP durable path, local hostile x402 bypass/custody probes, and public runtime ingress for local x402 payment and package-install dispatch boundaries. x402 is a local proof profile; package install remains a regression fixture. No adapter family defines the protocol. This is local kernel foundation, not live provider custody, hosted operation, generic MCP/runtime control, external package-material attestation, cross-org AuthorityCertificate trust, live JWKS/revocation, hosted verifier operation, or spend-window ledger enforcement. Runtime ingress is observer/compiler evidence and current x402 spend enforcement is per-call only; session/day/review spend windows are metadata until a ledger exists.

## Repo Truth

- `AGENTS.md`: system doctrine and invariant language.
- `QUALITY.md`: TypeScript quality, naming, and verification bar.
- `STRUCTURE.md`: source/test/docs ownership map.
- `docs/internal/decisions.md`: durable product and architecture decisions.
- `docs/internal/protocol-definition.md`: canonical protocol definition and authority rule.
- `docs/internal/protocol-kernel-architecture.md`: protocol kernel architecture and schema map.
- `docs/internal/protocol-layman.md`: plain-English translation of the protocol.
- `docs/internal/protocol-notes.md`: compact protocol notes for implementers.

Files under `.planning/` are scratch. They are not repo truth.

Each first-level `src/*` lane also has a `LANE.md` manifest. Those manifests are local ownership contracts; they do not supersede the canonical documents above.

Operational enforcement surfaces:

- `package.json`: canonical local command contract.
- `.github/workflows/check.yml`: CI gate; it must run `npm run check:repo`.
- `test/architecture/*`: repo-shape, naming, import, vocabulary, and export guards.
- `src/*/LANE.md`: source-lane ownership contracts.

## System Design Posture

This repo treats platform aesthetics as system design clarity:

- use case: convert generated engineering-agent execution into exact protected-action authority decisions;
- constraints: generated code may branch, retry, overreach, or hide consequence inside tool calls;
- high-level design: runtime evidence -> protocol kernel -> durable store -> HTTP transport -> gateway adapters;
- tradeoff: consistency beats availability for authority-bearing transitions;
- failure posture: refusals, isolation, replay refusal, and proof gaps are product outcomes, not log noise.

## Source Map

```text
src/
  protocol/
    kernel.ts
    public/          public schemas, inputs, and transition guard exports
    foundation/      canonicalization, ids, errors, reason codes, core schemas
    events/          stream events, chains, and record commits
    context/         transition request context records
    navigation/      protocol transition metadata
    evidence-projections/
                     redacted diagnostic projections
    store/           protocol store port
    areas/           owned protocol primitives
  install/           protected-action install proposal compiler
  http/
    app.ts
    app-options.ts
    admission/       caller custody and hosted admission seams
    routes/          route metadata, dispatch, scope, response schemas
    handlers/        evidence and internal read handlers
    errors/          HTTP transition error envelopes and codes
    openapi/         OpenAPI projection
    navigation/      HTTP route navigation metadata
    store/           store and kernel resolution
  runtime/           generated-execution proposal helpers
  adapters/          reference gateway fixtures
  conformance/       reference conformance checks
  storage/           D1, memory, KV, and store plumbing
  sdk/               typed HTTP client
  index.ts           curated package export surface
  experimental.ts    explicit experimental reference gateway surface
  worker.ts          Cloudflare Worker entrypoint
```

Other repo surfaces:

```text
migrations/          D1 schema for protocol storage
wrangler.toml        Worker binding and deployment config
.github/             CI bound to npm run check:repo
```

```text
test/
  architecture/      repo shape, naming, exports, vocabulary
  protocol/          primitive and state-machine invariants
  conformance/       reference conformance checks
  http/              transport and D1-over-HTTP behavior
  runtime/           generated-execution proposal helpers
  adapters/          reference gateway fixtures
  integration/       end-to-end protected action paths
  support/           test fixtures and harnesses
```

## Commands

Prerequisite: Bun `1.3.9`.

First run:

```bash
bun install --frozen-lockfile
npm run check:repo
```

| Command                | Purpose                                                                             |
| ---------------------- | ----------------------------------------------------------------------------------- |
| `npm run check:repo`   | Full local and CI gate: types, lint, format, Bun tests, pack check, whitespace diff |
| `npm run check:types`  | CI-stable no-pretty TypeScript gate                                                 |
| `npm run typecheck`    | Interactive TypeScript alias                                                        |
| `npm run lint`         | ESLint over `src` and `test` with zero warnings                                     |
| `npm run format:check` | Prettier check                                                                      |
| `npm run test`         | All Bun tests                                                                       |
| `npm run build`        | Declaration build for the private source package boundary                           |
| `npm run pack:check`   | Dry-run package surface check; excludes scratch and test-only material              |
| `npm run dev`          | Wrangler Worker dev after local D1/KV bindings are configured                       |

Focused gates:

```bash
npm run quality:architecture
npm run quality:storage
npm run quality:claims
```

CI runs `npm run check:repo` from `.github/workflows/check.yml`.

## Working Rule

Do not broaden claims when moving files. Renames are allowed when they improve ownership clarity, but they must preserve protocol behavior, root export curation, and existing invariant tests.
