# Deferred Items: Integrate Or Eliminate

Date: 2026-05-24

## Vision

Handshake should become the default authority boundary for protected actions in automated decision making:

```text
automated decision or generated execution
-> exact consequential action contract
-> policy decision
-> one-use gateway-bound greenlight
-> customer-owned gateway check before mutation
-> receipt, refusal, proof gap, or terminal certificate
-> redacted reconstruction for humans, auditors, and counterparties
```

The company shape is not "agent auth", not generic tracing, not payment management, not engineering-agent tooling, and not a hosted dashboard over logs. The product wins by making authority evidence boring, portable, and hard to fake for concrete protected actions performed by automated decision systems. Customers keep mutation credentials in their own gateways. Handshake supplies the contract spine, policy/gateway binding, redacted evidence plane, verification surface, and adapter pack discipline.

The immediate product posture is:

- per-call x402 exact authorization, not aggregate payment-budget management;
- customer-owned gateway custody, not Handshake-held payment custody;
- terminal certificate verification, not settlement, identity, or certification;
- proposal/evidence MCP and CLI surfaces, not mutation surfaces;
- one protected action pack at a time, not broad runtime control.

## Plan-Eng Review: Critical Path For Integrating The Integrate List

### Step 0 Scope Challenge

What already exists:

| Existing mechanism | Reuse for integrate path | Do not rebuild |
| --- | --- | --- |
| Exact contract -> policy -> one-use greenlight -> gateway check -> receipt/proof gap | Keep as the only authority spine for every new integrate item. | No parallel "hosted approval", "MCP approval", or dashboard permission path. |
| `GatewayCredentialRef` and `CredentialResolutionEvidence` | Extend into customer-owned gateway custody proof packets and redacted projections. | No new secret model that bypasses credential refs. |
| Protected-path posture and bypass probes | Reuse for adapter-specific custody and host-specific bypass evidence. | No generic "runtime protected" claim without a host harness. |
| D1/HTTP store and route role separation | Promote into hosted admission only when deployment, caller custody, and reader auth are real. | No hosted claim from local Worker routes alone. |
| `AuthorityCertificate` and offline pinned-key verification | Build hosted verifier/JWKS/revocation around terminal evidence. | Do not make certificates permission, identity, settlement, or marketplace marks. |
| CLI/MCP package and registry metadata | Publish/distribute the proposal and evidence surfaces. | Do not add CLI/MCP mutation or signer routes. |
| x402 exact local/reference proof | Keep as the first buyer-side protected-action proof pack and product demo. | Do not broaden into seller/facilitator/settlement or aggregate spend. |

Minimum change set:

1. Clean the source language so eliminated items are intentional boundaries, not pending promises.
2. Implement customer-owned gateway custody proof packets before any hosted claim.
3. Implement terminal certificate verifier/JWKS/revocation before any cross-org trust claim.
4. Implement hosted evidence/admission surfaces only after custody and verifier boundaries exist.
5. Add the next concrete adapter pack only after the above surfaces can prove custody, gateway check, and reconstruction.
6. Publish CLI/MCP/package metadata when package release credentials and namespace ownership are ready.

Complexity check:

This integrate path is too large for one implementation PR. A single "hosted platform" plan would touch protocol, HTTP, storage, SDK, CLI, MCP, adapters, docs, tests, deployment, and package release. Split into macro plans and implementation slices. Each slice must close with a source-owned mechanism, regression tests, and claim guards.

Search check:

No new external architecture is introduced by this document. Before implementation macro plans, run source/external verification for:

- npm package publication and provenance;
- MCP Registry publication requirements;
- JWKS and key rotation conventions;
- Cloudflare Worker/D1 deployment and secrets posture;
- selected customer-gateway custody providers;
- package-manager provenance/attestation standards.

TODO cross-reference:

No `TODOS.md` exists in this checkout. Treat this file as the current planning artifact until a macro plan promotes specific tasks.

Completeness:

The complete plan is to boil the lake for each slice: schema, store/state, route/client surface if needed, redaction, conformance, negative tests, docs, and claim guards. Do not implement happy-path-only custody, verifier, or hosted surfaces.

### Critical Path

```text
0. Claim boundary cleanup
   |
   v
1. Customer-owned gateway custody proof
   |
   v
2. Terminal verifier trust plane
   |
   v
3. Hosted admission + redacted evidence plane
   |
   v
4. Concrete adapter pack expansion
   |
   v
5. Host-specific bypass harnesses
   |
   v
6. Public distribution and publication
```

#### 0. Claim Boundary Cleanup

Goal: remove ambiguity before adding capability.

Implement:

- replace "spend reservation ledger required before claim" wording with "aggregate payment-budget management intentionally out of current remit";
- keep `not_enforced_local_metadata` only where it is clearly local metadata;
- add claim guards so docs/examples cannot imply payment management, settlement, seller/facilitator operation, or hosted trust.

Closeout tests:

- `npm run quality:claims`
- `npm run test -- test/architecture/claim-boundary.test.ts test/product/x402-protected-spend-demo-report.test.ts`

Failure mode:

- If docs imply aggregate spend is merely missing code, future implementation may drift into payment management.
- Must fail through claim-boundary tests.

#### 1. Customer-Owned Gateway Custody Proof

Goal: prove the mutation credential lives behind a customer/provider gateway that enforces the exact greenlight.

Implement:

```text
gateway install evidence
-> credential ref binding
-> protected-path posture
-> custody/bypass probe packet
-> gateway check binds exact contract
-> redacted custody projection
```

Mechanisms:

- gateway custody proof packet schema;
- custody proof digest bound to protected-path posture;
- provider-neutral fields for custody provider, key handle, lease/version, attestation refs, and redacted audit refs;
- negative proofs for agent-exposed signer, stale credential ref, provider drift, missing custody packet, and sibling raw path;
- projection redaction that never returns secret paths, signer material, payment payloads, or mutation credentials.

Tests:

- protocol schema/canonical digest tests;
- adapter custody/bypass tests;
- HTTP/SDK projection redaction tests;
- claim-boundary tests preventing provider custody claims from fixture keys.

Failure mode:

- A stale custody proof remains accepted after credential drift.
- Must refuse at policy/gateway evaluation and expose a redacted reason.

#### 2. Terminal Verifier Trust Plane

Goal: make terminal `AuthorityCertificate` evidence portable without turning it into permission, identity, settlement, or certification.

Implement:

```text
terminal evidence
-> AuthorityCertificate
-> verifier key set
-> revocation/status check
-> verification response
-> audit-safe projection
```

Mechanisms:

- JWKS or equivalent verifier key projection;
- signer-role and key-version model;
- certificate revocation/status record;
- hosted verifier route that verifies terminal binding without protocol-store mutation;
- stale-key, revoked-key, missing-key, wrong-envelope, and tamper refusals.

Tests:

- offline verifier parity tests;
- HTTP verifier route tests;
- key rotation and revocation tests;
- claim tests preventing "certificate = permission/identity/settlement/certification".

Failure mode:

- A revoked or rotated signer still verifies an old terminal certificate as current trust.
- Must return a clear verification failure with audit-safe reason code.

#### 3. Hosted Admission And Redacted Evidence Plane

Goal: turn local HTTP/D1 capabilities into an operated boundary only after caller custody, reader authorization, and evidence redaction are real.

Implement:

```text
caller role token
-> route admission
-> tenant/org/project scope
-> protocol transition or redacted read
-> durable D1/KV storage
-> audit-safe response
```

Mechanisms:

- deployment-mode admission config;
- reader roles distinct from control-plane/runtime/gateway/review roles;
- purpose-built redacted evidence read routes;
- raw-record access limited by `rawReadPosture`;
- retention/export policy boundaries;
- hosted readiness probe that states exactly which claims are active.

Tests:

- route admission matrix tests;
- D1 migration/index tests;
- redaction fuzz tests;
- SDK role-client tests;
- hosted-claim guard tests.

Failure mode:

- A reader token can access internal-only records or secret-bearing evidence.
- Must fail at admission/projection and never serialize raw custody material.

#### 4. Concrete Adapter Pack Expansion

Goal: expand from x402 exact and package-install regression into one more protected-action pack at a time.

Recommended first candidates:

1. package-manager material attestation, because package install already exists as a regression lane;
2. preview deploy, because it is a common automated/generative execution mutation with visible downstream consequence;
3. repo write with protected branch or release consequence, because it exercises generated-code inspection and gateway path binding.

Mechanisms per adapter:

- install proposal compiler;
- action type and gateway registry entry;
- exact parameter canonicalization;
- gateway observed-parameter validator;
- custody/bypass probes;
- receipt/proof-gap mapper;
- conformance fixture;
- buyer-readable report.

Tests:

- adapter proposal tests;
- gateway mismatch/replay/refusal tests;
- runtime/MCP proposal tests only if exposed there;
- conformance tests;
- evidence projection and redaction tests;
- architecture/export tests.

Failure mode:

- Adapter code invents a shortcut authority path because "this mutation is simpler than x402".
- Must fail by import posture, claim boundary, and gateway-required tests.

#### 5. Host-Specific Bypass Harnesses

Goal: prove a configured installed path resists raw sibling bypass in a named host/runtime, without claiming all host actions are protected.

Implement:

```text
host fixture
-> wrapped protected action succeeds only after gateway
-> raw sibling attempt refused or detected
-> bypass proof packet
-> protected-path posture update
```

Mechanisms:

- host/runtime fixture manifest;
- raw sibling attempt probes;
- wrapper integrity checks;
- stale host metadata refusal;
- redacted bypass projection.

Tests:

- fixture pass/fail tests;
- stale metadata tests;
- claim guards preventing host-wide protection language.

Failure mode:

- Host tool list changes after posture is recorded, but gateway still trusts old posture.
- Must refuse or downgrade posture until probes are refreshed.

#### 6. Public Distribution And Publication

Goal: make the already source-owned package surfaces installable without expanding authority.

Implement:

- npm release checklist and provenance validation;
- MCP Registry namespace/authentication checklist;
- package smoke from installed tarball and installed package;
- CLI/MCP docs that preserve proposal/evidence-only posture;
- post-publish verification gates.

Tests:

- `npm run pack:check`;
- installed package smoke;
- MCP stdio process smoke with official SDK;
- package-surface tests;
- docs claim guards.

Failure mode:

- Published package exposes experimental signer/gateway internals or stale metadata.
- Must fail package-surface and root/export guards before publish.

### Test Diagram

```text
Claim cleanup
  -> claim-boundary tests
  -> demo/report assertions

Custody proof packet
  -> schema + digest tests
  -> stale/drift/missing/agent-exposed negative tests
  -> redacted projection tests

Verifier trust plane
  -> offline/hosted parity tests
  -> revoked/stale/tamper tests
  -> no-permission/no-settlement claim tests

Hosted evidence plane
  -> role admission matrix
  -> raw-read posture tests
  -> D1 migration/index tests
  -> SDK role-client tests

Adapter pack
  -> proposal canonicalization
  -> gateway observed-params validation
  -> replay/mismatch/proof-gap tests
  -> conformance and report tests

Host bypass harness
  -> wrapped path pass
  -> raw sibling refuse/detect
  -> stale metadata refuse

Publication
  -> pack check
  -> installed CLI smoke
  -> installed MCP stdio smoke
  -> package export guard
```

### Architecture Review Findings

1. Do not implement "hosted" before custody proof and verifier trust.
   Recommendation: sequence custody and verifier first. Hosted routes without those are evidence theatre.

2. Do not implement all integrate items as one macro plan.
   Recommendation: create one macro plan per critical-path slice, each with a closeout gate and claim guard.

3. Keep x402 as proof pack, not protocol center.
   Recommendation: next adapter pack should reuse the same protocol spine and prove the spine is independent of x402.

### Code Quality Review Findings

1. Any new proof packet must live in an owned protocol area or adapter lane, not a generic helper bucket.
2. Redaction should be projection-owned and test-owned, not scattered string filtering.
3. Public package surfaces must remain curated; gateway/signing internals stay direct internal or experimental fixture exports only.

### Performance Review Findings

1. Hosted evidence reads must use scoped indexes and stream ranges, not tenant-wide scans.
2. Verifier endpoints should verify from certificate material and trust metadata, not require reconstructing the full protocol stream on every call.
3. Bypass harnesses should be explicit probes, not always-on expensive runtime scans.

### NOT In Scope

- aggregate x402 session/day/review payment-budget enforcement;
- Handshake-held wallets, payment credentials, balances, or settlement state;
- seller middleware or facilitator operation;
- broad MCP/CLI/browser/shell/network/package-manager containment;
- marketplace, certification, or clearing-house claims;
- review UI as an authority source;
- hosted dashboard before custody, verifier, admission, and redacted reads are real.

### Completion Summary

- Step 0: Scope Challenge: scope reduced into six implementation slices.
- Architecture Review: 3 issues found.
- Code Quality Review: 3 issues found.
- Test Review: diagram produced, no silent critical gap accepted.
- Performance Review: 3 issues found.
- NOT in scope: written.
- What already exists: written.
- TODOs: no `TODOS.md`; defer task capture to macro plans.
- Failure modes: 6 critical production failure modes named with required test posture.
- Lake Score: 6/6 recommendations choose complete slice-by-slice implementation over shortcut rollout.

## Classification Rule

Integrate only when the deferred item strengthens Handshake's core primitive:

```text
exact action contract
-> policy decision
-> one-use greenlight or refusal
-> gateway check before mutation
-> receipt, refusal, proof gap, or terminal evidence
```

Eliminate when the item turns Handshake into payment management, broad runtime control, marketplace certification, generic agent governance, or trust theatre.

## Integrate

| Deferred item | Integrate as | Why it belongs | Hard boundary |
| --- | --- | --- | --- |
| Customer-owned gateway custody | Concrete gateway custody proof packets and adapter-specific protected-path posture | A protected path is only real when a gateway holds the mutation credential and checks the exact greenlight before mutation. | Handshake must not hold user payment credentials or become a wallet/payment custodian. |
| Provider-neutral credential custody evidence | `GatewayCredentialRef`, `CredentialResolutionEvidence`, redacted projections, and custody/bypass probes | Secret access is not authority, but gateway-side credential binding is necessary to prove the agent did not receive mutation credentials. | No raw secret material, provider secret paths, signer refs, or agent-exposed credentials in public projections. |
| Hosted admission and deployment boundary | Deployment-mode caller custody, route role separation, durable store operation, and reader authorization | Hosted operation is a product tier only when HTTP admission, custody, storage, policy, and evidence reads are actually operated as a deployment boundary. | HTTP transport and OpenAPI shape alone do not prove hosted operation. |
| Hosted verifier, JWKS, revocation, and cross-org certificate verification | AuthorityCertificate verification service and trust-material distribution | Portable evidence eventually needs public verification, signer rotation, revocation, and audit retention. | Certificate verification remains terminal evidence, never permission, identity, settlement, or certification. |
| Purpose-built audit and reconstruction projections | Redacted contract, graph, receipt, proof-gap, idempotency, credential, and transaction projections | This is the product surface that lets teams reconstruct authority without raw record access. | No raw record browsing as an audit product; no secret-bearing evidence in read surfaces. |
| Actual npm and MCP Registry publication | External release process for the already source-owned package and `server.json` metadata | Distribution matters, and publication is not authority-bearing. | Source pack checks prove package shape only; account ownership and registry publication require external credentials. |
| Concrete protected-action adapter packs | Package install, preview deploy, repo write, CI/release, cloud config, and database/data-plane adapter packs | The protocol generalizes by repeating the exact contract/gateway/receipt shape across one protected mutation class at a time. | No adapter family defines the protocol, and no broad runtime claim follows from one adapter. |
| Host-specific bypass harnesses | Narrow conformance probes for installed paths in specific runtimes or hosts | Host evidence can prove a configured path resisted raw sibling bypass in that environment. | No host-wide MCP/browser/shell/network/package-manager protection claim. |
| External package-manager material attestation | Adapter-specific evidence for package-install once that surface is promoted beyond regression fixture | Supply-chain mutation needs observed package identity and provenance evidence. | Package install remains a regression lane until attestation is source-owned and tested. |

## Eliminate

| Deferred item | Eliminate from | Why it should be cut | Allowed residue |
| --- | --- | --- | --- |
| Aggregate x402 spend-window enforcement | Tier 2 x402 and near-term kernel roadmap | Managing session/day/review payment budgets risks making Handshake look like payment management. The x402 wedge should stay per-call exact authorization. | Keep `not_enforced_local_metadata` and claim per-call authorization only. |
| Handshake-held payment custody | Product remit | Holding payment credentials, signer custody, balances, limits, or settlement state drifts toward regulated payment operations. | Customer gateway may hold credentials; Handshake records gateway-bound evidence. |
| Provider-side payment custody claims | Current repo claims | Local fixture keys and gateway probes do not prove provider operation or customer installation. | Integrate customer/provider custody only through real deployed gateway proof packets later. |
| Seller middleware | x402 exact buyer-side wedge | Seller middleware is the seller's enforcement path, not the buyer-side authority-to-sign path currently proven here. | Record seller-provided evidence later only if it is downstream reconstruction evidence. |
| Facilitator operation | Handshake core and current x402 wedge | Running facilitator verify/settle makes Handshake a payment-flow operator instead of authority-control infrastructure. | Store redacted facilitator refs or responses only as evidence/proof gaps. |
| Settlement finality or business success | Receipts and certificates | A receipt proves gateway check and observed downstream evidence, not payment settlement, business success, or merchant fulfillment. | Downstream finality evidence may be attached as evidence; absence remains a proof gap. |
| Broad x402 compatibility | Tier 2 x402 claim | The source proves one official buyer-side `exact` per-call path, not `upto`, batch settlement, auto-pay, signed offers, signed receipts, or all x402 SDK modes. | Future schemes require separate adapter packs and their own proof objects. |
| Broad MCP/CLI/browser/shell/network/package-manager control | Tier 2 surfaces | MCP and CLI are proposal/evidence/readiness surfaces. They do not authorize, mutate, or contain all sibling paths. | Add narrow host-specific probes only for installed protected paths. |
| Generic runtime governance or agent safety | Product language | Handshake does not make agents safe; it contracts consequential mutation attempts. | Keep language to exact action contracts, gateway checks, refusals, and reconstruction. |
| Marketplace, certification, or clearing-house readiness | Current product claim | Local certificates and source package metadata do not prove marketplace trust, certification, settlement, or clearing-house operation. | Keep as strategic vision outside repo-facing claims until verifier, trust, and counterparty integrations exist. |
| Review UI as authority | Protocol model | A rendered screen is theatre unless it binds to the exact contract and policy input. Even then, it records review evidence, not permission by itself. | Build review renderers only as exact-bound projections with receipt evidence. |
| Hosted dashboard before enforcement | Near-term product sequencing | Dashboards without gateway custody, admission, reader auth, and source-owned projections convert protocol truth into observability theatre. | Hosted surfaces may follow once enforcement and redacted reads are real. |

## Source Cleanup Recommendations

1. Keep x402 docs and tests saying per-call authorization only.
2. Replace wording that implies a future "spend reservation ledger" is required with wording that says aggregate payment-budget management is intentionally outside the current remit.
3. Keep hosted verifier/JWKS/revocation in the integrate list because it strengthens terminal evidence without managing payments.
4. Keep actual npm/MCP Registry publication in the integrate list because it is distribution, not authority.
5. Keep seller/facilitator/settlement out of the wedge unless they appear only as redacted downstream evidence or proof gaps.

## Decision

The next Handshake hardening work should integrate customer-owned gateway custody, hosted verification, redacted audit projections, and concrete adapter packs.

It should eliminate aggregate payment-budget management, seller/facilitator/settlement operation, broad runtime control, and clearing-house claims from the current product boundary.
