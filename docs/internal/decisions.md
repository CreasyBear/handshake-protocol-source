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

Builder-buyer product language centers on a cleared protected-action event: one specific terminal Handshake event with reconstructable evidence that a service can accept, refuse, or treat as a proof gap.

Shared product/protocol vocabulary:

- `protocol kernel`: the source-owned state machine and schemas for exact contracts, policy decisions, one-use greenlights, gateway checks, receipts, refusals, proof gaps, isolation, and terminal certificates.
- `product surface`: CLI, MCP, SDK, docs, demo, or service-facing readback surfaces that expose proposal/evidence/readback without creating authority.
- `AuthorityCertificate`: verifiable terminal evidence for one event. The certificate is terminal evidence, not permission, identity, settlement, hosted trust, or reusable auth.
- Distribution is separate from authority. Public npm availability does not create authority, and MCP Registry discoverability remains a proof gap until verified.

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
  proposal, wallet-signer `GatewayCredentialRef` binding, policy, gateway
  check, local/reference 402 challenge evidence, gateway-created payment
  signature evidence, local/reference signed retry observation, proof gap,
  credential-ref isolation/stale refusal, and replay refusal;
- public runtime ingress for local x402 payment and package-install dispatch
  boundaries, including a role-scoped runtime-evidence HTTP/SDK proposal handoff,
  wrapped dispatch, dynamic/late-bound refusal, loop/retry sequencing, raw
  sibling bypass refusal, and truncated graph refusal;
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

The clearer buyer-facing version is: Handshake helps a service accept, refuse, and reconstruct a cleared protected-action event. The first product surface is still narrow and source-owned; it is not a hosted enforcement product.

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

## Production Proof Ledger And Expansion Admission

Accepted: production claims are ledgered by evidence state, not by narrative
adjacency to the protocol.

Current ledger:

| Surface or claim                   | Current status                         | Boundary                                                                                    |
| ---------------------------------- | -------------------------------------- | ------------------------------------------------------------------------------------------- |
| `x402_payment.exact` per-call path | locally proven for self-hosted package | Exact contract, policy, one-use greenlight, gateway check, receipt/readback.                |
| Hosted operation                   | proof gap                              | Requires deployed tenant boundary, hosted custody, retention, and ops evidence.             |
| Provider/customer gateway custody  | proof gap beyond local/reference proof | Requires external custody proof, signer lease/rotation/revocation, and monitoring evidence. |
| Settlement/finality                | proof gap                              | Downstream payment observation is not settlement finality.                                  |
| Facilitator operation              | outside current claim                  | First wedge consumes x402 evidence; it does not operate a facilitator.                      |
| Seller middleware                  | outside current claim                  | First wedge is buyer-side only.                                                             |
| Marketplace or certification       | proof gap                              | Requires separate listing, rating, dispute, and trust evidence model.                       |
| Cross-org trust                    | proof gap                              | Local terminal certificates and pinned keys do not create portable trust.                   |
| Broad x402 compatibility           | cut line                               | Only one buyer-side `exact` per-call path is admitted.                                      |
| Aggregate spend enforcement        | proof gap                              | Requires a policy-time and gateway-time aggregate ledger.                                   |
| MCP Registry discoverability       | proof gap until verified               | Public npm availability and `server.json` metadata are distribution facts only.             |
| Host-wide containment              | cut line                               | Host profiles and raw sibling probes record posture, not native containment.                |

Expansion admission requires a proposed second action family to name, in source
and tests, all of the following before it can be called execution-ready:

- generated execution shape;
- protected action path;
- gateway authority holder;
- credential holder or mutation authority holder;
- `CandidateAction`/refusal boundary;
- raw and sibling bypass posture;
- evidence path and redacted readback path;
- proof-gap model;
- recovery/isolation path;
- explicit non-claims and cut lines.

The admission bar also requires focused product gates, `npm run
quality:claims`, `npm run quality:architecture`, `npm run pack:check`, and
the full repo gate (`npm run check:repo`) to pass. Until then, `auth.md + x402`, package install,
repo write, CI/deploy, cloud configuration, database/data-plane, marketplace,
agent-management, or other protected actions remain proof contexts rather than
execution-ready product surfaces.

## Market And Expansion Scoring Boundary

Accepted: market scoring is strategy input, not enforcement proof. A wedge can
score well commercially and still be blocked from product claims until it passes
the expansion admission gate above.

Use this rubric before promoting any candidate wedge:

- enforcement merit: does the mechanism preserve exact contract, one-use
  greenlight, gateway check, receipt/refusal/proof-gap, isolation, and bypass
  posture?
- market merit: is the pain urgent, frequent, budgeted, and expensive enough to
  buy?
- distribution merit: can the wedge spread through npm, MCP Registry,
  Agentic.Market, host profiles, or another repeatable channel without bespoke
  sales every time?
- adoption merit: can one team reach value with one gateway, one action family,
  one runtime/profile, and redacted readback?
- expansion merit: does the wedge expand concentrically into adjacent protected
  actions without weakening the authority boundary?

Current external evidence snapshot, checked on 2026-05-25:

- x402 has visible ecosystem pull: the x402 site reports live transaction,
  volume, buyer, and seller metrics; Coinbase's Agentic.Market announcement
  frames Agentic.Market as an x402 service discovery and integration surface;
  Stripe's machine-payments docs also expose x402 as one supported protocol.
- auth.md is a credential registration and discovery convention. It publishes
  service auth metadata, supported flows, scopes, `/agent/auth` endpoints,
  credential issuance, revocation, and audit events. It does not authorize a
  protected payment or mutation by itself.
- MCP Registry is distribution metadata. It supports server publication,
  namespace verification, REST discovery, and standardized installation
  information, but it is not an authority or enforcement plane.
- Recent x402 security research reinforces replay, binding, authorization, and
  web-layer risks. That strengthens the need for Handshake's exact contract,
  one-use greenlight, gateway check, idempotency, and proof-gap posture; it does
  not prove buyer willingness to pay.

Scoring as of this snapshot:

| Candidate wedge                                    | Enforcement merit | Market merit | Distribution merit                  | Adoption merit | Expansion merit | Verdict                                                                                         |
| -------------------------------------------------- | ----------------- | ------------ | ----------------------------------- | -------------- | --------------- | ----------------------------------------------------------------------------------------------- |
| Agentic.Market/x402 protected buyer calls          | high              | medium       | high via Agentic.Market, MCP, npm   | high           | high            | Keep as the first commercial validation target, but sell it as safe buyer-side protected spend. |
| `auth.md + x402` credentialed paid API calls       | high if admitted  | medium-high  | medium through service docs and PRM | medium         | high            | Rank second; admit only after it names credential holder, gateway holder, and refusal boundary. |
| MCP Registry and host-profile distribution         | low as a market   | medium       | high                                | high           | medium          | Use as distribution, not product authority or market proof.                                     |
| Engineering infra mutations: CI/deploy/repo/cloud  | high              | medium       | medium                              | medium         | high            | Keep as post-x402 expansion; do not reopen as first wedge.                                      |
| Enterprise agent management or governance platform | medium            | high         | low-medium                          | low            | medium          | Cut from immediate product; too broad and too easy to become advisory governance theatre.       |
| Seller middleware, facilitator, settlement, market | medium            | high         | high                                | medium         | medium          | Defer; outside current buyer-side claim and needs a separate seller-side proof model.           |

The immediate market experiment is not "Handshake is listed as an x402
service." The current product is buyer-side protected spend, so an
Agentic.Market listing is blocked unless Handshake exposes a real x402-payable
seller endpoint. The smaller legitimate move is to use Agentic.Market services
as the first paid-resource corpus and prove that an agent can discover a listed
service, propose one exact payment, receive one policy decision, pass one
gateway check, and read back one refusal/receipt/proof gap without signer
material leaving the gateway.

`auth.md + x402` should be the first expansion candidate after that. Its
admission packet must prove that auth.md credential issuance remains principal
or service credential evidence, not protected-action authority, and that each
paid credentialed call still clears through the same exact contract -> policy ->
one-use greenlight -> gateway check chain.

## Product Launch Gate Resolutions

Accepted: no former launch gate remains a user-owned vague branch. Each gate is
either selected, raised to a stricter evidence bar, hard-blocked by current
evidence, or cut from current product language. The source-owned resolution
contract lives in `src/surfaces/product-launch-gate-resolution.ts`.

Codex-local is selected as the first live runtime target. A run-local activation
on 2026-05-25 configured `~/.codex/config.toml` with
`mcp_servers.handshake_x402` pointing at a pinned
`handshake-protocol-kernel@0.2.7` artifact and a fresh Codex host observed and
attempted `handshake.actions.x402_payment.propose`. This closes the
host-origin tool invocation proof gap only. It does not prove host-wide
containment, authority, policy, one-use greenlight, gateway check, signer use,
payment material creation, customer gateway custody, live paid execution, or
registry discovery.

Customer-gateway custody evidence is the external product wording threshold.
Local/reference signer custody supports local proof only. Provider custody,
provider lease, rotation, revocation, and monitoring evidence are stronger later
claims, not prerequisites for the first customer-owned gateway product.

MCP Registry acceptance and lookup remain launch blockers. Public npm
`handshake-protocol-kernel@0.2.7` is verified by trusted-publish workflow,
registry readback, registry signature metadata, provenance publication, and
clean installed-artifact smoke, but official
MCP Registry direct lookup for
`io.github.CreasyBear/handshake-protocol-kernel` returned 404 and registry search
for `handshake-protocol-kernel` returned an empty server list on 2026-05-25.
Public npm availability remains distribution evidence only; it does not create
authority and it does not satisfy registry discoverability.

The first buyer segment is agent builders and engineering organizations
delegating paid x402 resource calls to agents and needing bounded spend, signer
custody, replay refusal, and reconstructable evidence. Agentic.Market services
are the first paid-resource corpus for validation. They are not the first buyer,
and Handshake should not claim seller middleware, facilitator operation,
Agentic.Market listing, or marketplace status without a real x402-payable
seller endpoint.

Terminal certificates are prominent terminal evidence in receipt, support, and
readback surfaces, not permission. Certificate UX may be visible after receipt,
durable refusal, proof gap, replay refusal, or isolation evidence exists; it
must not imply reusable auth, settlement, hosted trust, cross-org trust, or
authority before the gateway chain.

`auth.md + x402` is the first expansion candidate, not current composite
execution. It enters only through an admission packet that keeps auth.md
credential issuance as provenance and routes each paid credentialed call through
exact contract, policy, one-use greenlight, gateway check, and post-gate signer
evidence. auth.md remains credential discovery, registration, provenance, and
lifecycle evidence; it is not authority.

Live 402 challenge evidence from `https://regimeshift.xyz/api/v1/asset/eth/vrp`
was observed on 2026-05-25 through an Agentic.Market-listed service. Stronger
launch language remains blocked until a funded customer gateway signer performs
a post-gate signed retry and records receipt, refusal, or proof-gap evidence
through Handshake. Do not claim live paid execution, settlement finality,
provider custody, or buyer-side production readiness from a 402 challenge
alone.

Package provenance is now satisfied for `0.2.7` by the public artifact
repository's trusted-publish workflow. The successful run published
`handshake-protocol-kernel@0.2.7`, recorded npm registry integrity and
signature metadata, produced GitHub Actions provenance, and passed clean
installed-artifact smoke. This closes the npm current-surface proof gap only.
Publishing does not create authority, and MCP Registry discoverability remains
blocked until official registry acceptance and lookup are verified.

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

Accepted: this checkout declares a publishable npm package boundary with explicit root, runtime, conformance, adapter SDK, role-scoped SDK, CLI, MCP, and experimental subpath exports.

The package is no longer marked private and is licensed as Apache-2.0. Public npm `handshake-protocol-kernel@0.2.7` is verified by trusted-publish workflow, registry readback, npm signature metadata, provenance publication, and clean installed-artifact smoke. Public imports resolve to bundled ESM and generated declarations under `dist/`; source TypeScript is not part of the npm package contract. The `handshake` bin is the local JSON-output evidence/readiness CLI. The `handshake-mcp` bin, and the package-name bin `handshake-protocol-kernel`, start the local stdio MCP proposal/evidence server.

MCP Registry metadata is source-owned through `server.json` and `package.json#mcpName`. This follows the official MCP Registry npm package rule: `server.json` uses `registryType: "npm"` and the package `mcpName` must match the server name. MCP Registry discoverability remains a proof gap until registry acceptance and lookup are verified.

The package check builds declarations and Node bundles, runs an npm dry-run, verifies the package surface is allowlisted to `package.json`, `server.json`, `README.md`, `LICENSE`, `NOTICE`, `bin/`, and `dist/`, excludes source, tests, examples, scripts, planning scratch, repo-internal docs, and local quality manifests, and smoke-tests the packaged CLI plus MCP stdio server through the official MCP client SDK.

The `./adapter-sdk` subpath is a definition-only adapter authoring surface. It lets external SDK authors define third-party protected-action adapter packs, bind install compiler contract references, bind observed-parameter validation and receipt-evidence mapping references, and project install-proposal shape reports for source review. It is not an install client, gateway client, policy evaluator, or mutation runner; it does not register runtime ingress, install catalog records, evaluate policy, create greenlights, perform gateway checks, hold mutation credentials, export receipts, certify adapters, operate a marketplace, or run mutations. Any future runtime ingress or gateway binding remains source-owned until promoted through explicit package-surface and conformance gates.

The `./x402-protected-tool` subpath is the first normal-agent-tool distribution
surface for the protected x402 proposal facade and host profile descriptors. It
lets package consumers prepare the `handshake.actions.x402_payment.propose`
runtime dispatch and Codex/Claude/Hermes/OpenClaw profile artifacts after
trusted gateway readiness evidence exists. That readiness evidence is bound into
the facade/profile input by install digest, probe posture digest, gateway
registration, wallet-signer credential-ref digest/custody, redacted
`GatewayCustodyProofPacket` digest/claim level/external-verification
posture/expiry, policy version, gateway registry entry, operating envelope, and
expiry; a plain `trusted_gateway_ready` flag is not enough. It is
proposal/profile distribution only: not policy evaluation, not greenlight
issuance, not gateway check, not credential resolution, not signer use, not
payment material creation, not mutation, not receipt export, not certificate
minting, not settlement, not provider custody, not hosted operation, and not
host-wide containment.

The first source-owned external runtime transcript target is Codex-local by
local verification default, not by final user launch selection. The transcript
is emitted with the x402 protected-tool profile demo and binds the Codex
activation artifact to proposal/readback compatibility and raw sibling posture.
The source profile artifact itself does not mutate `~/.codex/config.toml`, does
not perform policy or gateway transitions, does not invoke signers, and does
not claim live Codex host-wide containment. A run-local activation on
2026-05-25 configured `mcp_servers.handshake_x402` against a pinned
`handshake-protocol-kernel@0.2.7` extracted artifact and observed a fresh Codex
host attempt `handshake.actions.x402_payment.propose`; that proves host-origin
tool invocation only. It is not host-wide containment, authority, policy,
greenlight, gateway check, signer use, payment material, customer gateway
custody, live paid execution, or registry discovery. Claude Code, Hermes,
OpenClaw, and generic MCP remain parity artifacts with explicit proof gaps
until one is selected and verified.

The source-owned production acceptance matrix for this subpath lives in
`src/surfaces/x402-protected-tool-acceptance.ts`. It is the implementation contract for
the first product path:

```text
package install
-> init / doctor
-> install x402-payment
-> local probes
-> register x402 gateway readiness
-> install health
-> host profile generation
-> protected tool proposal
-> policy decision
-> gateway check before signer use
-> redacted readback/support evidence
```

Every row names its surface owner, authority posture, input evidence, output
record, required non-authority flags, bypass posture, proof gaps, validation
gate, and stop condition. The matrix is descriptive source truth for release
admission; it does not create policy decisions, greenlights, gateway checks,
credential resolution, signer use, payment material, mutations, receipt
exports, terminal certificates, settlement, provider custody, hosted operation,
marketplace certification, or host-wide containment. Readiness rows must remain
`pre_contract`; `trusted_gateway_ready` means ready for the runtime facade, not
authorized to mutate.

The `./sdk/role-clients` subpath now includes a role-scoped
`ControlPlaneClient` for delegated-authority lifecycle management. It accepts
one control-plane credential and can register delegated authority refs or record
terminal delegated-authority status transitions. It cannot evaluate policy,
issue greenlights, perform gateway checks, resolve gateway credentials, use
signers, mutate protected surfaces, export receipts, mint certificates, or read
raw internal records.

The same subpath includes a role-scoped `PolicyClient` for exact policy
evaluation over control-plane custody. It may create one policy decision plus an
optional one-use greenlight or refusal for an exact action contract, and that is
the whole authority it carries. It cannot perform gateway checks, resolve
gateway credentials, use signers, mutate protected surfaces, read evidence,
export receipts, manage delegated authority lifecycle, install setup records,
mint certificates, or read raw internal records.

APS terminal certificate minting is explicitly local-reference-only. The
role-scoped protected gateway claim ends at receipt, durable refusal, replay
refusal, or proof-gap readback until a separate terminal evidence issuer surface
exists. `EvidenceClient` may verify supplied certificates against pinned local
trust material; it must not mint certificates.

The same subpath includes a role-scoped `InstallClient` for setup-only
registration of compiled install records. It accepts one control-plane
credential and can post an `InstallProposal` to one server-side setup commit
that either atomically registers the tool capability, action type,
gateway-registry entry, and operating envelope from a ready proposal or records
refusal evidence for a refused proposal. This is setup evidence, not hosted
installation authority, and it cannot compile proposals, evaluate policy, issue
greenlights, perform gateway checks, register gateway credential refs, resolve
credentials, run probes, mutate protected surfaces, export receipts, mint
certificates, read raw internal records, or run mutation commands.

The same subpath includes a role-scoped `GatewayClient` for gateway-custody
transition transport. It accepts one gateway-custody credential and can record
gateway credential refs, gateway custody proof packets, bypass probes,
protected-path posture, gateway checks, post-gate credential-resolution
evidence, and downstream surface reconciliation. It cannot expose signer
helpers, create payment payloads, evaluate policy, manage delegated authority,
export receipts, mint certificates, read raw internal records, or run mutation
commands.

The source-owned local x402 protected-spend activation path must start from the
same protected-tool facade before runtime ingress proposes an `ActionContract`.
The facade handoff is a proposal/evidence boundary. Delegated spend authority is
recorded as a redacted `DelegatedAuthorityRef` and bound into the exact contract
separately from wallet signer custody; the wallet gateway remains the only
signer path and runs only after exact `VerifiedGatewayCheck`. Registering that
authority ref is evidence of principal-scoped bounds, not permission, and it
does not create policy decisions, greenlights, gateway checks, receipt export,
settlement, or aggregate spend-window enforcement. Revocation and expiry are
recorded as `DelegatedAuthorityStatusTransition` evidence plus `authority_ref`
isolation instead of in-place ref mutation. Policy evaluation and gateway checks
must re-read that isolation, so revoked or expired delegated spend blocks both
future decisions and stale unconsumed greenlights before signer use.
`pack:check` also verifies this boundary from a clean installed artifact by
packing the npm tarball, extracting the package under a temporary
`node_modules`, bare-importing `handshake-protocol-kernel/x402-protected-tool`,
and running the local protected-spend activation path with the installed facade
module.

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
Missing registry evidence remains a proof gap. Public npm availability does not
create authority.

CI must run the same command through `.github/workflows/check.yml`.

## Naming Decision

Source names must describe owned protocol concepts, not buckets. The repo bans source path segments such as `utils`, `helpers`, `common`, `misc`, `stuff`, `manager`, and `service` unless `STRUCTURE.md` explicitly creates an exception.

Internal planning-stage labels must not appear in repo-facing scripts, CI names, README sections, source paths, tests, or exported symbols.

## Repository And Release Administration

Handshake has two repository boundaries for release administration:

- `CreasyBear/handshake-protocol-source` is the full source workbench. It owns
  source code, tests, internal docs, release projection scripts, source tags,
  and the source CI gate. Its workflow runs `npm run check:repo`, and that gate
  must build declaration and bundle output before typechecking and test-time
  package subpath imports so a clean checkout does not depend on preexisting
  `dist/` state. It must not contain npm Trusted Publishing authority.
- `CreasyBear/handshake-protocol-kernel` is the published package artifact
  repository. It owns the projected npm package boundary: `bin/`, `dist/`,
  `README.md`, `CHANGELOG.md`, `LICENSE`, `NOTICE`, `package.json`,
  `server.json`, `.handshake-release-repository-manifest.json`, and
  `.github/workflows/trusted-publish.yml`. It is the only repository boundary
  that may hold npm Trusted Publishing.

Source tags identify the source state that generated a release. Artifact tags
identify the exact package-artifact repository state used for npm distribution.
The two tags may point at different commits because their repository boundaries
are intentionally different.

Repository visibility is an administrative setting, not an authority boundary.
A public source repository would expose source; it still would not create
policy decisions, greenlights, gateway checks, mutations, certificates, hosted
operation, or MCP Registry discoverability. Public npm availability remains
distribution only and does not create authority.

Release administration must run through `npm run release:admin:check` before
artifact pushes, GitHub release creation, repository metadata edits, or launch
claims. The gate is intentionally separate from normal CI: it clones source into
a clean temporary checkout, installs from lockfile, runs `npm run check:repo`,
projects the package-artifact repository, verifies the artifact boundary and
pinned Trusted Publishing workflow, and smokes artifact imports plus CLI. It
does not publish to npm, create GitHub releases, change repository metadata,
create authority, create policy decisions, issue greenlights, perform gateway
checks, mutate protected surfaces, or register MCP discoverability. Use
`npm run release:admin:check:remote` after source and artifact pushes when
remote ref readback is required before launch-admin metadata work.
