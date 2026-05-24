# Decisions

Last canonical audit: 2026-05-24.

## Canonical Source Set

This checkout keeps a small internal canonical set:

```text
AGENTS.md
README.md
QUALITY.md
STRUCTURE.md
docs/internal/decisions.md
docs/internal/protocol-definition.md
docs/internal/protocol-kernel-architecture.md
docs/internal/protocol-layman.md
docs/internal/protocol-notes.md
```

`.planning/` is scratch. Long plans, source studies, public-facing product docs, and historical prompts are not active repo truth.

Operational enforcement surfaces are also authoritative for behavior:

- `package.json` defines the local command contract.
- `.github/workflows/check.yml` defines the CI gate.
- `test/architecture/*` enforces repo shape, naming posture, import posture, vocabulary, and root export curation.
- `src/*/LANE.md` defines lane-local ownership boundaries.
- `wrangler.toml` defines Worker binding configuration.
- `migrations/` defines the canonical D1 schema.

Files under `.agents/skills` are tool assets. They are not product truth.

## Product Kernel

Handshake is protected action infrastructure for automated decision making.
The category is protected actions for automated decision making.

The current kernel centers on protected action control:

```text
exact action contract
-> exact policy decision
-> one-use gateway-bound greenlight
-> gateway check before mutation
-> receipt, refusal, or proof gap
```

The first official wedge is one buyer-side `x402_payment.exact` per-call
protected action. Engineering-agent actions remain an adoption context and
generated-execution stress case: preview deploys, package installs, CI/release
changes, repository writes with downstream consequence, cloud configuration
mutations, and database/data-plane operations are adjacent proof contexts, not
the category boundary. Current adapter families are proof profiles and
regression lanes. No adapter family defines the protocol shape.

## Foundation Status

Accepted: the current source foundation is locally established for the
protocol kernel boundary, not for external provider operation.

The local foundation includes:

- exact contract -> policy decision -> one-use greenlight -> gateway check ->
  receipt/refusal/proof-gap;
- derived `ActionAttemptLifecycle` evidence over source-owned transitions, with
  no stored lifecycle object and no lifecycle authority;
- idempotency ledger reservation before greenlight issuance, duplicate refusal,
  and read-only prior-evidence projection;
- probe-backed protected-path posture, with local hostile bypass/custody probes;
- provider-neutral `GatewayCredentialRef` and `CredentialResolutionEvidence`
  records bound into candidate/contract digest, policy/gateway evaluation,
  credential-ref isolation, and redacted projections;
- package-install material adapter pack evidence/report projection over
  observed package manager, registry, manifest/lockfile, install flags,
  lifecycle-script posture, resolved material refs, exact gateway binding,
  bypass probe requirements, and proof gaps;
- package-manager local host-specific bypass manifest and proof packet for one
  named package-install wrapper, named raw sibling routes, wrapper integrity,
  freshness, gateway binding, and non-claim posture;
- local x402 payment D1/HTTP establishment path through install, runtime
  proposal, policy, gateway check, local/reference 402 challenge evidence,
  gateway-created payment signature evidence, local/reference signed retry
  observation, proof gap, and replay refusal;
- public runtime ingress for local x402 payment and package-install dispatch
  boundaries, including wrapped dispatch, dynamic/late-bound refusal, loop/retry
  sequencing, raw sibling bypass refusal, and truncated graph refusal;
- redacted diagnostic evidence projections for contracts, generated graphs,
  receipt timelines, idempotency recovery, transaction envelopes, and install
  health;
- internal representation contracts proving Metadata, Challenge, Request, and
  EvidenceProjection shapes cannot create authority.

### AuthorityCertificate

`AuthorityCertificate` and `verifyAuthorityCertificate()` are landed local
foundation kernel/protocol primitives. The certificate is a terminal signed evidence object
for receipt, durable refusal, proof gap, or replay refusal outcomes. It is Layer
8 authority evidence only: it does not create greenlights, gateway checks,
mutation proof, identity, settlement, marketplace status, hosted trust, or
hosted mutation authority.

Source anchors:

- `src/protocol/areas/authority-certificate/`
- `test/protocol/authority-certificate.test.ts`
- `src/protocol/navigation/index.ts`
- `src/protocol/areas/object-registry/`

Planning lineage:

- `.planning/strategy/authority-certificate-foundation.md`
- `.planning/strategy/autoreason/foundation/pass_02/synthesis.md`
- kernel establishment delta planning scratch, K-D9-K-D12

The verifier recomputes canonical `signingInput`, checks envelope digest
binding, verifies pinned Ed25519 signer material, rejects production
HMAC/propose-time `contractSignature` as portable trust, fails tamper,
missing-signer, replay/terminal-binding mismatches, and verifies exported cert
JSON without the protocol store. The local trust read model now separates
`verified`, `refused`, and `proof_gap` outcomes, issuer/key/status failures,
and public verifier key-set/JWKS projections. Those projections expose only
public verification material and create no authority or cross-org trust.
Non-mutating hosted verifier routes can project metadata, key-set/JWKS, status,
and structured verification against configured local trust material; those
routes do not fetch remote trust, mutate certificate/status records, host
operation, or turn verification into permission.

The local foundation does not prove:

- live/provider payment custody;
- live vault-provider custody or provider-side secret lifecycle operation;
- hosted org auth, policy operation, RBAC, retention, search, or mutation authority;
- external package-manager material attestation;
- package safety, npm-audit replacement, or Bun provenance verification from
  the package-install adapter pack;
- broad MCP, CLI, browser, shell, network, package-manager, or generated-tool-stream
  interception beyond the local x402 payment and package-install dispatch boundaries;
- portable cross-org trust, remote JWKS trust fetch, live revocation authority,
  marketplace certification, or provider custody from local fixture keys.

## Current Bought Product

The first bought product is Handshake Protected Actions: an integration kit and receipt experience that lets one coding-agent workflow execute one protected production-adjacent action through gateway-checked action contracts.

The first pilot shape is intentionally small:

```text
one repo
one agent runtime
one consequential action class
one adapter proof profile
one gateway check
one policy file
one receipt timeline
```

## Claims Boundary

Handshake can claim protected control only for installed paths where the gateway owns the mutation credential and checks the exact one-use greenlight before mutation.

Handshake must not claim:

- universal agent governance;
- generic agent safety;
- provider-side enforcement without a provider or customer gateway check;
- downstream business success from a receipt;
- portable verification from local HMAC fields;
- cross-org verifier trust from local fixture keys;
- control over raw sibling tools, browser paths, shell paths, or credentials outside the installed gateway;
- host-wide containment or package-manager ecosystem protection from one
  host-specific bypass harness.

## Repo Boundary

This checkout is an internal TypeScript protocol kernel. It should not carry long public-facing product reports, product-owner prompts, marketing docs, GTM notes, buyer/persona material, or planning taxonomy. Durable decisions are kept here only when they protect implementation boundaries.

## Documentation Canon

Accepted: the active repo canon is compact and internal.

Former ADR, plan, product, protocol, business, reference, audit, and spec subtrees are no longer active repo truth. Durable decisions move into this file only when they protect implementation boundaries. Protocol definition lives in `docs/internal/protocol-definition.md`. Kernel architecture and schema mapping live in `docs/internal/protocol-kernel-architecture.md`. Plain-English translation lives in `docs/internal/protocol-layman.md`. Compact implementation notes live in `docs/internal/protocol-notes.md`. Planning, marketing, source studies, and historical prompts belong outside the active repo tree.

## Structural Decision

The active source tree is organized by authority boundary:

- `src/protocol` owns protocol meaning, public schema/input aggregation, foundation helpers, event records, request context, store port, transition navigation, and primitive-owned areas.
- `src/http` owns Hono/Worker transport, admission, route metadata, handlers, OpenAPI, errors, navigation, and store/kernel resolution.
- `src/runtime` owns generated-execution proposal helpers only.
- `src/adapters` owns reference gateway fixtures that mutate only after `VerifiedGatewayCheck`.
- `src/conformance` owns source-package conformance checks that prove narrow reference invariants without claiming standards compliance.
- `src/storage` owns D1, memory, KV, and store mechanics.
- `src/sdk` owns typed HTTP client ergonomics.

Tests mirror ownership under `test/architecture`, `test/protocol`, `test/http`, `test/runtime`, `test/adapters`, `test/integration`, and `test/support`.

## System Design Aesthetic Decision

Accepted: beautiful code in this repo means system design is visible in the tree before a reader opens implementation details.

Every source lane must state its use cases, constraints and assumptions, core components, and failure/scale posture. A folder is platform-ready only when its boundary answers:

- what uses this lane;
- what inputs, outputs, and authority constraints bind it;
- which components form the high-level design;
- what bottlenecks, consistency boundaries, replay paths, cache boundaries, or failure states it owns;
- what it refuses to own.

This keeps aesthetics tied to operability. A clean path that hides tradeoffs, failure behavior, or authority ownership is not beautiful enough for Handshake.

## Source Ownership Cut

Accepted: protocol behavior is owned by `src/protocol/areas/*`, with foundation, events, context, navigation, store, and public aggregation separated from area internals. First-level source lanes carry `LANE.md` manifests so ownership is visible before opening implementation files.

Rejected: flat protocol files, compatibility shims, and generic helper buckets. HTTP, SDK, runtime, storage, and adapters must import protocol behavior through curated public indexes rather than area internals.

## Hosted Admission Boundary

Accepted: HTTP admission, caller custody, OpenAPI projection, and route-scope resolution are protocol transport seams. They may model deployment-mode custody and caller roles, but they do not prove hosted operation, production org auth, provider enforcement, or customer gateway installation.

Current hosted-mode support is explicitly narrower: a deployment-mode config is
required before hosted routes run, transition roles are allowlisted, read
entitlements are separate from transition custody, raw reads obey a declared
raw-read posture, and readiness reports binding/secret posture without secret
values. This admits exact protected-action transitions and redacted evidence
reads; it is not hosted mutation authority, production readiness, payment
management, settlement, provider custody, retention certification, or compliance
audit.

A hosted operation claim requires a real deployment boundary, credential custody
model, customer or provider gateway check, D1/KV migration proof, secret
management proof, and receipts that distinguish gateway check evidence from
downstream execution evidence.

## Evidence Read Boundary

Accepted: local HTTP and SDK evidence reads are redacted diagnostic projections,
not hosted audit/search product surfaces. Hosted mode can require explicit
read roles and scopes for those same redacted projections, but that
authorization is a read entitlement only. It is not transition custody, policy
authority, gateway authority, raw evidence access, receipt export, or proof of
downstream business success. The active projections are generated graph
evidence, contract view, agent transaction envelope, receipt timeline,
idempotency recovery, credential custody/resolution evidence refs, and
protected-path health.

The generic raw record route must enforce protocol-object `rawReadPosture`.
`internal_only` objects remain unavailable through raw HTTP reads even to
control-plane bearer custody. Credential projections must expose opaque refs and
digests, never raw secret material or provider secret paths. Any future audit
surface must use purpose-built redacted projections and a real reader
authorization model.

## Tooling Decision

The repo uses TypeScript, ESLint, Prettier, Bun tests, and `git diff --check` as the full local gate:

```bash
npm run check:repo
```

## Package Boundary Decision

Accepted: this checkout declares a publishable npm package boundary with explicit root, runtime, conformance, role-scoped SDK, CLI, MCP, and experimental subpath exports.

The package is no longer marked private and is licensed as Apache-2.0. Public imports resolve to bundled ESM and generated declarations under `dist/`; source TypeScript is not part of the npm package contract. The `handshake` bin is the local JSON-output evidence/readiness CLI. The `handshake-mcp` bin, and the package-name bin `handshake-protocol-kernel`, start the local stdio MCP proposal/evidence server.

MCP Registry metadata is source-owned through `server.json` and `package.json#mcpName`. This follows the official MCP Registry npm package rule: `server.json` uses `registryType: "npm"` and the package `mcpName` must match the server name. Registry publishing still requires external npm and MCP Registry authentication; the source gate proves the package shape, not account ownership or actual publication.

The package check builds declarations and Node bundles, runs an npm dry-run, verifies the package surface is allowlisted to `package.json`, `server.json`, `README.md`, `LICENSE`, `NOTICE`, `bin/`, and `dist/`, excludes source, tests, examples, scripts, planning scratch, repo-internal docs, and local quality manifests, and smoke-tests the packaged CLI plus MCP stdio server through the official MCP client SDK.

`PackageReleaseProof` is the release-state contract for public distribution:

- `ready_to_publish` means local package shape, metadata sync, CLI/MCP smoke,
  account namespace posture, provenance posture, license posture, package
  allowlist posture, rollback posture, and authority-boundary checks have
  source-owned evidence.
- `actually_published` means npm publish has occurred for the exact package and
  version, and a clean installed-artifact smoke has passed.
- `registry_discoverable` means MCP Registry metadata has been accepted and
  post-registry discoverability has been verified.

Publication distributes the Apache-2.0 package artifacts, proposal/evidence/read
surfaces, and metadata only. It does not create authority, policy decisions,
greenlights, gateway checks, mutations, custody, hosted operation, marketplace
certification, settlement, payment management, trust, or host-wide enforcement.
Publication does not create authority.
Missing account, namespace, 2FA, provenance, license, package-surface, publish,
clean-install, or registry evidence remains a proof gap.

CI must run the same command through `.github/workflows/check.yml`.

## Naming Decision

Source names must describe owned protocol concepts, not buckets. The repo bans source path segments such as `utils`, `helpers`, `common`, `misc`, `stuff`, `manager`, and `service` unless `STRUCTURE.md` explicitly creates an exception.

Internal planning-stage labels must not appear in repo-facing scripts, CI names, README sections, source paths, tests, or exported symbols.
