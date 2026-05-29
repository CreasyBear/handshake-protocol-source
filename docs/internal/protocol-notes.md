# Protocol Notes

Last protocol audit: 2026-05-24.

For the canonical definition, see `docs/internal/protocol-definition.md`. For the architecture and schema map, see `docs/internal/protocol-kernel-architecture.md`. For the plain-English translation, see `docs/internal/protocol-layman.md`. This file keeps implementation-facing protocol notes compact.

## Primitive

Every consequential mutation attempt must be reduced to an exact, inspectable, policy-evaluated, gateway-bound action contract before consequence.

Handshake's category is protected actions for automated decision making.

## Product And Protocol Language

- Product language centers on the cleared protected-action event: one terminal
  Handshake event with reconstructable evidence that a service can accept,
  refuse, or treat as a proof gap.
- The protocol kernel is the source-owned authority state machine and schema
  set for exact contracts, policy decisions, one-use greenlights, gateway
  checks, receipts, refusals, proof gaps, isolation, and terminal certificates.
- A product surface is a projection/readback surface such as CLI, MCP, docs,
  demo, or service-facing readback that exposes proposal/evidence/readback
  without creating authority.
- Role-scoped protocol transition clients, including SDK policy and gateway
  clients, transport specific kernel transitions under custody. They are not
  product authority surfaces and do not make product nouns authoritative.
- The service workflow story is a projection/readback translation only:
  `Passport -> ServiceWorkflowAdmission -> ServiceWorkflowHandle -> fresh
protected-action clearance -> terminal outcome`. Passport, admission, and
  handle records are evidence/readback context; they are not identity, policy,
  greenlight, gateway check, mutation permission, receipt export, terminal
  certificate, or reusable auth.
- `PrincipalAgentLink` and `ServiceWorkflowContextRefs` are product projection
  contracts, not protocol authority primitives. They may provide setup evidence
  and proposal metadata, but they cannot approve spend, widen an envelope,
  satisfy delegated authority, perform a gateway check, or replace a fresh
  exact action contract.
- The certificate is terminal evidence, not permission, identity, settlement,
  hosted trust, or reusable auth.
- Public npm availability does not create authority. MCP Registry
  discoverability remains a proof gap until registry acceptance and lookup are
  verified.
- Hosted admission lock: service workflow simplification is not a
  hosted-operation go-ahead. Hosted work may consume the surface only after the
  pre-hosted service workflow gates have source-owned proof or proof-gap
  posture. Hosted operation, provider custody, settlement/finality, marketplace
  or certification, cross-org trust, aggregate spend enforcement, hosted org
  auth, retention/search, or new kernel exports require a separate hosted
  workspace or a new pre-hosted kernel task with fresh proof gates.
- Clerk-for-agents dual enforcement: admission identifies callers at the HTTP
  middleware layer; adapter `run*Gateway` before mutation is the route-handler
  enforcement point. Ingress-only posture is advisory, not Handshake. External
  PEP (Envoy/Kong/OPA) is deployment glue only — adapter-side re-check against
  the exact greenlight is still required.

## Required Separation

- Vague intent is not an operating envelope.
- Generated code is not an action contract.
- Tool availability is not tool authorization.
- A rendered review screen is not permission.
- A greenlight is not execution proof.
- A receipt is not downstream business success.
- Runtime evidence is not gateway enforcement.

## State Path

```text
runtime execution evidence
-> generated execution graph
-> finalized tool-call draft when generated execution supplies parameters
-> intent compilation record
-> candidate action
-> action contract
-> policy decision
-> greenlight or refusal
-> gateway check attempt
-> credential resolution evidence when gateway-side credential use is required
-> mutation attempt, refusal, receipt, or proof gap
```

## System Design Posture

Use case: reduce automated-decision execution, including generated engineering-agent execution, into exact protected-action authority decisions.

Constraints and assumptions:

- agents may branch, retry, loop, call sibling tools, or generate stale review surfaces;
- gateway checks are the final pre-mutation enforcement point;
- receipt evidence reconstructs protocol events, not downstream business success;
- storage may report conflicts or ambiguous commits, so transitions must be replay-safe;
- installed protected paths are narrow until a real gateway owns mutation credentials.

Core components:

- protocol kernel facade;
- protocol areas for contracts, policy, gateway gate, lifecycle, recovery, and evidence;
- append-only event/record store port;
- HTTP transport/admission surface;
- install proposal compiler;
- runtime proposal helpers;
- reference gateway adapters;
- D1 and memory stores.

Failure and scale posture:

- back pressure is expressed as refusal, isolation, replay refusal, or proof gap rather than hidden retries;
- consistency is preferred over availability for authority-bearing transitions;
- D1 is durable reconstruction truth in the reference implementation;
- KV is cache posture only and cannot become authority;
- future extraction must preserve exact contract binding, one-use greenlights, and gateway-side enforcement.

## Evidence Rules

Receipts must distinguish:

- proposal evidence;
- policy decision evidence;
- gateway check evidence;
- mutation attempt evidence;
- downstream finality evidence;
- proof gaps.

Missing or ambiguous evidence is recorded explicitly as a `ProofGap`.

## Implementation Map

- `src/protocol/foundation`: canonicalization, ids, errors, reason codes, core schemas, protected-action parameter digests, transition guards.
- `src/protocol/public`: public schema and input aggregators.
- `src/protocol/events`: stream event schemas, digest chains, record commits.
- `src/protocol/context`: transition request context schemas and records.
- `src/protocol/navigation`: protocol transition metadata.
- `src/protocol/evidence-projections`: redacted diagnostic read projections.
- `src/protocol/store`: store port.
- `src/protocol/areas`: owned primitives such as action contracts, authority certificates, policy/greenlight, gateway gate, proof gaps, recovery, review binding, runtime evidence, and object registry.
- `src/install`: generic install proposal contracts used by adapter packs to compile protected paths into kernel records.

Protocol areas may depend on foundation/events/context/store and other area public indexes. They must not import HTTP, storage implementations, runtime wrappers, SDK code, or adapter fixtures.

## Protocol Areas

- `catalog-envelope`: declared tool, action, gateway, and envelope records; catalog presence is not authorization. Envelopes may carry provider-neutral participant identity bindings, but those bindings are evidence-only links to the opaque principal/agent refs.
- `delegated-authority`: redacted principal/agent/runtime/envelope/gateway scoped attempt-authority refs; registering a ref records bounds and evidence expectations only, and creates no policy decision, greenlight, gateway check, mutation authority, or receipt. Revocation and expiry are separate status-transition evidence that creates `authority_ref` isolation without mutating the original ref.
- `credential-custody`: opaque gateway credential refs, redacted gateway custody proof packets, and post-gate resolution evidence; no provider clients or secret retrieval API.
  Customer or provider gateway custody claims require official external
  verification, current custody and resolver posture, time-bounded lease or
  rotation evidence, attestation evidence, redaction success, and no raw
  credential or payment material. Fixture-local custody remains local proof and
  cannot satisfy `customer_gateway_evidence`.
- `runtime-evidence`: generated execution evidence; evidence can propose but cannot authorize.
- `generated-execution-graph`: normalized generated-code/spec evidence and action candidates.
- `tool-call-draft`: opened, streaming, finalized, invalid, or abandoned generated tool-call input state.
- `bypass-probe`: protected-path custody, bypass, drift, token-passthrough, and failure-closed evidence.
- `intent-compilation`: candidate action boundary, assumptions, dependencies, uncertainty, and refusal inputs.
- `action-contract`: exact proposed commitment before authority.
- `authority-certificate`: terminal signed evidence and offline pinned-key verification; it cannot mint policy, greenlight, gateway, or mutation authority.
- `policy-greenlight`: decision, idempotency reservation, refusal, and one-use greenlight issuance.
- `gateway-gate`: final pre-mutation verification of exact greenlight binding.
- `idempotency-ledger`: duplicate-authority scope records across contracts.
- `operation-lifecycle`: reconciliation of protected-surface outcomes without pretending downstream certainty.
- `refusal`: portable refusal evidence format; it does not create authority or mutation proof.
- `review-binding`: review artifacts and decisions bound to exact contract and policy records.
- `protected-path-posture`: installed, bypass, and drift posture for a protected path.
- `isolation-breaker`: persistent halt or isolation state checked before future decisions and gates.
- `proof-gap`: explicit missing, expired, contradictory, or unavailable evidence.
- `recovery`: follow-up recommendations and terminal conflict handling.
- `receipt-export`: reconstructable export of the chain, not proof of business success.
- `object-registry`: protocol object metadata, ID selectors, export posture, and raw-read posture.

## Current Proof Lanes

- x402 exact per-call payment is the first local proof profile. Package install
  is the first promoted non-payment adapter pack after that wedge; repo write
  and preview deploy remain reference gateway fixtures. No adapter family
  defines the protocol shape.
- Package install binds gateway-observed package manager, registry,
  manifest/lockfile, install flags, lifecycle-script policy, and resolved
  material evidence fields before mutation. Its material adapter pack projects a
  buyer-readable action, authority, exact-contract, evidence, outcome,
  proof-gap, reconstruction, and bypass-posture report. This is local evidence
  and proof-gap projection, not package safety, npm-audit replacement, Bun
  provenance verification, or external package-material attestation.
- The first host-specific bypass harness is a package-manager local fixture. It
  binds one host, environment, adapter, action type, protected path, wrapper
  digest, named raw sibling routes, gateway registry, policy, freshness,
  redaction, and non-claims into a bypass proof packet and report. Its `READY`
  state is fixture-specific and never proves host-wide containment, package
  manager ecosystem protection, MCP/CLI/browser/shell/network protection, or
  x402 ecosystem coverage.
- The x402 protected-tool facade/profile lane lets Codex, Claude, Hermes, and
  OpenClaw host profiles expose the normal
  `handshake.actions.x402_payment.propose` tool only after protected-tool
  readiness is present and bound to the facade input. The readiness proof binds
  install digest, probe posture digest, gateway registration, wallet-signer
  credential-ref digest/custody, redacted gateway custody proof packet
  digest/claim level/external-verification posture/expiry, policy version,
  gateway registry entry, operating envelope, selected payment requirement
  digest, raw sibling posture, explicit non-authority flags, and expiry; the
  profile refuses if that proof drifts or if customer gateway custody is only
  fixture-local. The profile emits transcript evidence, host bypass posture,
  and non-claims; it does not create policy decisions, greenlights, gateway
  checks, signer use, payment material, settlement, hosted operation, provider
  custody, or host-wide containment.
- The first host activation artifact is Codex-local: it binds the
  `~/.codex/config.toml` MCP server target, `npx ... handshake-mcp` command,
  wrapper/config digest, tool-list digest, source-observed gateway/one-use
  evidence, and named raw sibling probes into a host-specific bypass proof
  packet. It is not a live user host mutation, gateway check, signer path, or
  host-wide containment claim.
- The first external-runtime transcript target is Codex-local by source-owned
  local verification default, with final user launch selection still a proof
  gap. The transcript demonstrates proposal/readback compatibility and raw
  sibling posture for the configured `handshake-mcp` path only. It does not
  mutate `~/.codex/config.toml`, does not perform policy or gateway work, does
  not invoke signers, and does not prove host-wide containment; Claude Code,
  Hermes, OpenClaw, and generic MCP remain parity artifacts until selected and
  verified.
- The local x402 protected-spend walkthrough now starts from that facade:
  protected-tool dispatch preparation -> runtime ingress proposal -> exact
  action contract with a delegated spend `DelegatedAuthorityRef` plus
  wallet-signer `GatewayCredentialRef` -> policy greenlight -> wallet gateway
  check -> gateway-held signing surface. The delegated authority ref and
  credential ref are bound into candidate/contract digest material and re-read
  by policy and gateway checks, so stale or mismatched authority, stale signer
  custody, credential-ref isolation, or authority-ref isolation refuses before
  signing. Delegated-authority terminal status is recorded as a transition plus
  `authority_ref` isolation, so future policy decisions and stale unconsumed
  greenlights fail before signer use. This is still per-call local/reference
  evidence, not aggregate spend-window enforcement, hosted/provider custody, or
  host-wide containment.
- The package gate includes a clean installed-artifact activation smoke: pack
  the npm artifact, extract it under temporary `node_modules`, bare-import
  `handshake-protocol-kernel/x402-protected-tool`, then run the local x402
  protected-spend chain with the installed facade module. The smoke now also
  asserts the installed-path hostile matrix: stale policy metadata, raw x402
  payload input, sibling MCP direct payment, changed observed parameters, and
  consumed-greenlight replay all stop before signer use, mutation, or reusable
  authority.
- The `./x402-protected-tool` package subpath exposes only the proposal facade,
  protected-tool readiness contract, host profile descriptors, and Codex-local,
  Claude Code managed-MCP, Hermes tool-packet, plus OpenClaw tool-packet
  activation artifact builders. The activation artifacts bind one configured
  wrapper or tool packet, config/tool-list digests, gateway/one-use evidence,
  and named raw sibling probes. They are installable distribution posture for
  the normal protected x402 tool, not gateway custody, signing authority, live
  host mutation, native host certification, or host-wide containment.
- The production acceptance matrix for the first x402 protected-tool path is
  source-owned in `src/surfaces/x402-protected-tool-acceptance.ts`. It covers package
  install, init/doctor, x402 install, local probes, gateway-readiness
  registration, install health, host profile generation, protected tool
  proposal, policy decision, gateway check before signer use, and redacted
  readback/support evidence. Each step records surface owner, authority
  posture, input evidence, output record, required non-authority flags, bypass
  posture, proof gaps, validation gate, and stop condition. The matrix is a
  release-admission contract only: readiness remains `pre_contract`, host
  profiles remain posture artifacts, policy is the first authority transition,
  the gateway check remains the signer boundary, and readback remains terminal
  evidence rather than downstream success or retry permission.
- First-use reason codes route to mechanisms, not retries: stale metadata or
  digest drift means reload current evidence; unsafe shape, amount overrun,
  dynamic tool construction, late-bound parameters, or unsupported x402 posture
  means recraft the exact request; offline/readiness/status gaps mean wait or
  fix install evidence; raw sibling or failure-open signals mean stop and
  isolate as needed; isolation, quarantine, revocation, or delegated-authority
  expiry means isolate; parameter/idempotency mismatch and consumed greenlights
  require a new exact contract; proof gaps and downstream unknowns require
  readback/support evidence before any new attempt.
- The installed first-use guide in `README.md` must preserve the same split:
  CLI and MCP commands stop at readiness, proposal, and redacted readback until
  the role-scoped runtime, policy, and gateway clients run. Reason-code guidance
  maps reload, recraft, wait/fix install, stop/isolate, read evidence, and
  create-new-contract outcomes without turning a refusal, proof gap, replay, or
  support bundle into retry permission. Schema-shaped samples should come from
  source-owned demos or current schemas rather than hand-copied JSON in docs.
- Payment-specific protected-action packs live under adapter/plugin lanes, not protocol areas.
- The payment adapter has a local D1/HTTP establishment path, runtime ingress,
  local/reference paid-HTTP 402 challenge and post-gate signed retry evidence,
  and local hostile bypass/custody probe coverage under experimental/reference
  adapter surfaces. The first-slice path registers a redacted x402 wallet
  signer credential ref and carries that binding through runtime config,
  tool-call draft, intent compilation, and action contract. The signed retry is
  downstream fixture observation after gateway-created signature evidence, not
  a policy, greenlight, gateway, or signing authority. It enforces per-call
  spend only; aggregate payment-budget management is intentionally outside the
  current remit, and any local spend window fields are non-enforced metadata.
  This is not live provider custody.
- Protected mutation adapter conformance lives under the `./conformance` package subpath.
- The auth.md adapter profile lives under the experimental/reference adapter
  surface. It treats the OAuth protected-resource to authorization-server
  metadata chain, including authorization-server `agent_auth`, as registration
  provenance, binds both PRM and authorization-server metadata digests in
  custody/action evidence, treats auth.md prose as supporting evidence only,
  imports issued credentials into gateway custody as opaque
  `GatewayCredentialRef` inputs, and proposes
  `auth_md_protected_api_call.exact` contracts. Its reference gateway fixture
  mutates only after a `VerifiedGatewayCheck`, records redacted
  `CredentialResolutionEvidence` after the passed gate, refuses parameter drift
  and replay before service execution, records downstream unknown finality as a
  proof gap, blocks scope/metadata/credential-ref digest drift, gateway policy
  drift, and credential-ref isolation before credential resolution, and fails
  closed when downstream evidence tries to return raw authorization material.
  The profile also owns redacted discovery source/cache,
  authorization-server metadata, ID-JAG identity assertion, claim, and revocation
  evidence shapes as provenance only; adapter-owned lifecycle handling maps
  logout, explicit revocation, expiry, downstream 401, metadata drift, and
  ambiguous lifecycle evidence into credential-ref isolation/quarantine/state
  suspect posture that policy and gateway checks re-read. Runtime ingress can
  compile the fixed protected API call into proposal evidence and refuse unsafe
  generated shapes before policy; policy tests prove lifecycle evidence does not
  mint greenlights. Redacted evidence projections now separate auth.md discovery,
  authorization-server metadata, ID-JAG, registration, claim, revocation,
  credential custody, credential resolution, protected API-call evidence, refusal,
  proof-gap, and downstream uncertainty labels. Hostile auth.md bypass probes
  record raw bearer, direct HTTP, MCP, browser, network, token replay, stale
  metadata, and retry-loop posture as prevented, detected, or proof gap. The
  profile does not make Handshake an auth provider, OAuth server, WorkOS
  alternative, certification body, generic API gateway, or provider-side
  enforcement surface.
- The `./runtime` package subpath exposes runtime ingress for local x402 payment
  package-install, and experimental auth.md protected API dispatch boundaries.
  It emits runtime evidence, graph evidence, finalized tool-call drafts,
  compilations, contracts, and refusals; it does not issue policy decisions,
  greenlights, gateway checks, receipts, or mutations.
- The role-scoped `ControlPlaneClient` exposes delegated authority registration
  and terminal delegated-authority status transitions over `control_plane`
  custody. It records attempt-authority evidence and authority-ref isolation
  only; it does not evaluate policy, issue greenlights, perform gateway checks,
  resolve credentials, use signers, mutate protected surfaces, export receipts,
  or mint certificates.
- The role-scoped `PolicyClient.evaluatePolicy()` exposes exact policy
  evaluation over `control_plane` custody. It may create one policy decision and
  optional one-use greenlight or refusal for an exact action contract. It does
  not perform gateway checks, resolve credentials, use signers, mutate protected
  surfaces, read evidence, export receipts, manage delegated authority
  lifecycle, install setup records, or mint certificates.
- The APS terminal `AuthorityCertificate` remains local-reference-only terminal
  evidence. The strict role-scoped gateway path terminates at receipt, durable
  refusal, replay refusal, or proof-gap readback until a separate terminal
  evidence issuer exists; `EvidenceClient` verifies supplied certificates but
  does not mint them.
- The role-scoped `InstallClient` exposes setup-only registration of compiled
  `InstallProposal` catalog, gateway-registry, and operating-envelope records
  over `control_plane` custody through one server-side setup commit. Ready
  proposals atomically register compiled setup records; refused proposals record
  refusal evidence. It is setup evidence, not hosted installation authority, and
  does not compile proposals, evaluate policy, issue greenlights, perform
  gateway checks, register credential refs, resolve credentials, run probes,
  mutate protected surfaces, export receipts, or mint certificates.
- The role-scoped `GatewayClient` exposes gateway credential refs, gateway
  custody proof packets, bypass probes, protected-path posture, gateway checks,
  post-gate credential-resolution evidence, and downstream surface
  reconciliation over `gateway_custody`. It is gateway transition transport
  only; it does not expose signer helpers, payment payload creation, policy,
  delegated-authority management, receipt export, certificate minting, raw
  record reads, or mutation commands.
- The role-scoped `RuntimeClient.proposeRuntimeIngressActionContracts()` method
  and `/v0.2/runtime-ingress/action-contracts` route expose the same
  proposal-only runtime ingress handoff over `runtime_evidence` custody. They
  return contracts or compiler refusals plus explicit non-authority posture; they
  do not perform policy, gateway, signer, mutation, receipt-export, or
  certificate work.
- Codemode multi-action, x402 payment ingress, package-install, and auth.md
  protected API runtime paths prove generated-execution proposal behavior.
- Internal protected-action representation contracts prove Metadata, Challenge,
  Request, and EvidenceProjection shapes cannot create authority. A local
  source-owned MCP stdio process proof is landed for proposal/evidence transport.
  Public broad MCP/CLI/browser/shell/network interception remains future
  integration work.
- HTTP and SDK evidence reads expose redacted contract, receipt timeline, generated graph, and install-health projections.
- D1 and memory stores prove reconstruction and atomicity mechanics for the reference implementation.
- Provider-neutral gateway credential ref and credential-resolution evidence records
  are landed as foundation kernel primitives. They bind vault-backed custody into
  contracts, policy/gateway checks, isolation, and redacted projections without
  importing provider SDKs or exposing `getSecret`-style APIs.
- Gateway custody proof packets are landed as redacted evidence objects that bind
  credential refs, protected-path posture, bypass probes, resolver/lease
  posture, drift status, and redaction status. They do not create permission,
  policy, greenlights, gateway checks, signer invocation, custody, or downstream
  success.
- Credential resolution is post-gate evidence. It cannot retrieve secrets through
  the protocol API, issue authority, or turn provider resolution failure into
  downstream success.

These are proof lanes, not provider-side enforcement claims.

The production proof ledger lives in `docs/internal/decisions.md`. It keeps
hosted operation, provider/customer gateway custody beyond local proof,
settlement/finality, facilitator operation, seller middleware,
marketplace/certification, cross-org trust, broad x402 compatibility, aggregate
spend enforcement, MCP Registry discoverability, and host-wide containment in
proof-gap, outside-claim, or cut-line status until source evidence changes.
Expansion into a second action family requires a named generated execution
shape, protected action path, gateway authority holder, credential holder,
`CandidateAction`/refusal boundary, bypass posture, evidence path, proof-gap
model, recovery/isolation path, non-claims, focused gates, package gates, and
the full repo gate. Without that packet, the family remains a proof context, not
an execution-ready product surface.

Local/source-owned surfaces are validated for the protocol kernel and product
surface boundary. Codex-local host invocation has been observed for a pinned
`handshake-protocol-kernel@0.2.7` artifact, but that proves only host-origin MCP
tool reachability. Public npm `handshake-protocol-kernel@0.2.7` availability is
verified by trusted-publish workflow, registry readback, npm signature metadata,
provenance publication, and clean installed-artifact smoke. Those distribution
and host-activation facts do not create authority.

## AuthorityCertificate

`AuthorityCertificate` and `verifyAuthorityCertificate()` are landed source
objects for the local foundation kernel. The certificate is a Layer 8 terminal
proof object emitted only after receipt, durable refusal, proof gap, or replay
refusal. Verification rebuilds canonical `signingInput`, checks envelope digest
binding, verifies pinned Ed25519 signer roles, rejects production
HMAC/propose-time signatures as portable trust, and works without the protocol
store. The local verifier response is structured as `verified`, `refused`, or
`proof_gap`; it separates cryptographic, artifact, terminal, gateway-admission,
trust-material, and status checks. Native verifier key-set and JWKS projections
are public-material projections only, not trust decisions. Non-mutating hosted
verifier routes expose metadata, key-set/JWKS, status lookup, and structured
verification against configured local trust material only. Hosted-mode
admission also has an explicit deployment config and read-entitlement split for
redacted evidence reads; missing config, excluded roles, stale identities,
missing scopes, disabled raw-read posture, and missing read-purpose bounds fail
closed before the route can be treated as authority.

A service event verifier may consume the certificate as portable evidence, but
only after checking pinned trust material, terminal kind, action class, resource,
required signer roles, gateway admission, and status. It should return
`accept`, `refuse`, or `proof_gap`; it must not treat the certificate as a bearer
permission token.

This is still local foundation trust. Cross-org trust, remote JWKS trust fetch,
live revocation authority, hosted mutation authority, production hosted
readiness, marketplace certification, compliance-grade audit, and provider
custody remain outside this local foundation.

## Pressure Review Notes

The current kernel is mostly clean under local foundation pressure, but three
debt edges remain intentionally visible:

- Runtime ingress is limited to local x402 payment and package-install dispatch
  families despite being the first public runtime subpath. Do not generalize the
  claim to broad MCP/browser/shell/package/network interception until each host
  path uses the same evidence shape.
- Runtime evidence is caller-observed evidence. It can refuse ambiguous or
  bypass-shaped traces, but it cannot prove that every raw sibling path in a
  host was actually intercepted.
- Credential custody redaction is typed but still not provider-grade secret
  lifecycle proof. Unknown provider credential formats need fuzzing and
  provider-specific gateway tests before live custody claims.
- Frustration risk is highest at the adapter boundary: callers must supply a
  normalized dispatch block, graph closure, and evidence references. A future
  SDK/shim should reduce this ceremony without moving authority into the
  runtime.

## Raw Read Boundary

Raw HTTP record reads must consult object registry `rawReadPosture`.
`internal_only` objects, including stream events, idempotency ledger entries,
bypass probes, and tool-call drafts, are not exposed through the generic record
route. Reconstruction that needs internal records must use store-level test
helpers or purpose-built redacted projections.

In hosted mode, raw record reads are additionally controlled by deployment
`rawReadPosture`: unavailable/disabled refuses, gated/allowed requires a
`rawEvidenceReader` entitlement with `evidence:raw:read`, and each read must
carry purpose and bounded expiry headers. Missing and cross-tenant records use
the same not-found shape.

## Naming Rules

Keep protocol object names exact: `ActionContract`, `PolicyDecision`, `Greenlight`, `GatewayCheck`, `Receipt`, `Refusal`, `ProofGap`, and `IsolationState`.

Avoid names that imply authority without mechanism. A function may observe, derive, propose, record, consume, or reconcile. It must not imply safety, trust, proof, or security that the gateway has not enforced.
