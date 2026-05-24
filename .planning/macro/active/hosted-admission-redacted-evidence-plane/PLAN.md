# GSD Macro Plan: Hosted Admission And Redacted Evidence Plane

## Goal

Invariant at stake: hosted admission and hosted reads must not become hosted mutation authority, payment management, settlement, provider custody, general Handshake operation, or compliance theatre.

Build a Tier 2 hosted admission plus redacted evidence plane for exact x402 protected calls:

```text
caller role token
-> route admission
-> tenant/org/project scope
-> protocol transition or redacted read
-> durable D1/KV storage
-> audit-safe response
```

Permitted product claim after closeout: Handshake admits exact protected-call transitions before body/kernel trust and exposes redacted evidence records through tenant-scoped read controls.

## Non-Goals

- No hosted mutation execution authority.
- No hosted payment credential custody beyond gateway-held credential creation already required by exact x402 per-call protected spend.
- No settlement, billing operations, or payment-management product surface.
- No general hosted Handshake operation claim.
- No production-readiness claim until Cloudflare bindings, migrations, secrets, readiness, and redaction matrices are proven.
- No compliance, audit-certification, or retention-policy claim beyond explicit evidence classes and proof gaps.
- No raw evidence read by default.
- No expansion from x402 protected spend into general engineering-agent control.

## Source Boundary

Tier 1 kernel boundaries remain intact:

- operating envelopes authorize attempts, not mutations;
- exact action contracts remain proposed commitments, not execution authority;
- greenlights remain one-use and gateway-bound;
- gateway checks remain the final enforcement point before consequence;
- receipts distinguish proposal, policy decision, gateway check, downstream execution, refusal, and proof gap;
- missing or unavailable evidence is recorded, not smoothed over.

Hosted surfaces are Tier 2 mechanisms only:

- route admission before body parse and kernel invocation;
- caller identity verification;
- tenant/org/project-scoped read authorization;
- redacted evidence response shaping;
- durable storage binding and readiness reporting.

## Current State

Known source state to preserve:

- Hosted mode exists as a transport admission seam.
- `HostedCallerVerifier`, `TransitionCallerIdentity`, and role/freshness/scope checks happen before body parse and kernel invocation.
- Accepted hosted transitions store digest/ref evidence, not raw tokens or raw user headers.
- Evidence read routes check tenant/org boundaries.
- Generic raw record reads consult `rawReadPosture`.
- D1/HTTP tests cover durable protocol surface and local D1 behavior.

Known gaps:

- No operated deployment-mode config.
- No production org/project/RBAC/read entitlement model beyond provider-neutral identity.
- No retention/export policy or audit reader posture.
- No hosted readiness probe.
- No Cloudflare D1/KV deployment and secrets proof.
- No product-level redaction fuzzing or read-entitlement matrix.
- No hosted claim guard beyond no-hosted wording.

## Target State

A hosted admission and redacted evidence plane with these explicit boundaries:

- Deployment modes: `local-dev`, `test`, `preview`, `production`.
- Config declares verifier strategy, freshness window, admitted roles, admitted scopes, tenant source, D1/KV bindings, secret names, public vars, raw read posture, redaction profiles, retention posture, export posture, and readiness expectations.
- Admission is deny-by-default when hosted behavior would run with inferred authority defaults.
- Reader authorization is separate from transition admission.
- Roles are explicit: `viewer`, `auditor`, `operator`, `rawEvidenceReader`.
- Scopes are exact: `evidence:redacted:read`, `evidence:raw:request`, `evidence:raw:read`, `evidence:export:create`, `evidence:retention:admin`, `hosted:readiness:read`.
- D1 owns structured evidence indexes and records.
- KV is non-authoritative unless consistency and audit limits are explicitly documented.
- Redacted reads accept exact receipt/evidence identifiers, tenant/org/project scope, and read entitlement.
- Raw reads are unavailable, disabled, gated, or allowed only through `rawReadPosture`.
- Readiness reports state, not secrets: mode, binding presence, secret names/presence, vars, D1 local vs remote posture, migration/schema status, verifier posture, redaction profile, retention/export posture, and unsupported capabilities.
- SDK/CLI/MCP clients are read-only by default and label authority class, mutation posture, gateway-authority posture, and raw-evidence posture.

## Assumptions

- Cloudflare D1/KV local/dev proof is not production proof.
- Wrangler local/dev and remote/prod posture must be validated separately.
- Sensitive values live in Cloudflare secrets, not public vars.
- Readiness may report secret names and presence, never values.
- KV must not become authoritative evidence storage unless consistency and audit limitations are explicit.
- D1 owns structured evidence indexes and records for this plan.
- Hosted admission cannot infer production behavior from missing config.
- Evidence reads must avoid missing-vs-cross-tenant oracles.
- Redaction correctness requires fuzzing and matrix tests, not snapshot-only confidence.
- Engineering agents remain stress/adoption context, not the product boundary.

## Decisions

1. Keep the wedge as exact x402 per-call protected actions.
2. Treat hosted admission and redacted evidence reads as Tier 2 mechanisms.
3. Add deployment-mode config before adding broader hosted surfaces.
4. Split transition roles from read entitlements.
5. Make redacted evidence the default read plane.
6. Keep raw evidence unavailable or gated by explicit posture, purpose, time bounds, and audit.
7. Use D1 as the authoritative structured evidence store.
8. Use KV only for non-authoritative acceleration or references with explicit limitations.
9. Add readiness as a posture report, not a liveness badge.
10. Add claim guards so docs and scripts cannot claim hosted operation beyond enforcement.

## Phases

### Phase 0 - Boundary And Claim Lock

Codify the hosted claim boundary and stop hosted language from implying production operation, mutation authority, payment management, custody, settlement, or compliance-grade audit.

Outputs:

- hosted claim guard;
- forbidden claim list;
- docs wording updates if needed;
- validation that Tier 1 kernel claims remain unchanged.

### Phase 1 - Deployment-Mode Admission Config

Add operated deployment-mode config for hosted admission.

Outputs:

- `deploymentMode` with `local-dev`, `test`, `preview`, `production`;
- verifier strategy declaration;
- role/scope/freshness config;
- tenant/org/project source config;
- deny-by-default behavior for missing hosted authority config.

### Phase 2 - Reader Authorization Boundary

Split admission identity from evidence reader entitlement.

Outputs:

- read roles and scopes;
- tenant/org/project predicates on every read path;
- oracle-safe denial responses;
- SDK/CLI/MCP read-only posture labels.

### Phase 3 - Redacted Evidence Contract And Raw Posture

Define the redacted evidence response contract and harden raw-read posture.

Outputs:

- redacted evidence schema;
- receipt-id-only read input;
- raw read states: `unavailable`, `disabled`, `gated`, `allowed`;
- raw access purpose/time-bound audit requirements;
- proof-gap responses for unavailable evidence.

### Phase 4 - D1/KV Durable Posture And Readiness

Prove D1/KV binding posture and expose hosted readiness.

Outputs:

- D1 structured evidence index ownership;
- KV non-authoritative posture;
- local/dev vs remote/prod D1 status;
- migration/schema proof;
- secret presence reporting without values;
- readiness states: `active`, `configured_but_unverified`, `missing`, `disabled`, `read_only`, `not_promoted`.

### Phase 5 - Retention, Export, And Redaction Proof

Make evidence lifecycle explicit without claiming compliance certification.

Outputs:

- retention classes;
- export creation scope and receipt;
- redacted support bundle contract;
- redaction fuzz tests;
- product-level read matrix.

## Task Graph

```text
P0 claim boundary
  -> P1 deployment-mode admission config
  -> P2 reader authorization boundary
  -> P3 redacted evidence contract
  -> P3 rawReadPosture hardening
  -> P4 D1/KV readiness
  -> P4 secrets posture
  -> P5 retention/export posture
  -> P5 redaction fuzzing
  -> P5 SDK/CLI/MCP read posture
  -> P5 hosted closeout guard
```

Critical path:

```text
deployment mode
-> deny-by-default hosted config
-> tenant/org/project read predicate
-> redacted evidence schema
-> D1 authoritative evidence proof
-> readiness posture
-> redaction/read matrix
-> claim guard
```

## Risks And Mitigations

- Auth bypass: deny-by-default admission, freshness checks, exact role/scope allowlist.
- Caller identity overreach: provider-neutral identity cannot imply org/project entitlement without mapping.
- Token/email leakage: store digest/ref evidence only and fuzz redaction.
- Cross-tenant read leak: tenant/org/project keying plus read predicates.
- Missing-vs-cross-tenant oracle: same denial shape for missing and unauthorized records.
- Raw record exfiltration: default unavailable/disabled posture, gated role/scope/purpose/time-bound audit.
- D1 config drift: readiness reports local/remote D1 mode, binding, migration, and schema status.
- Secret leakage: readiness reports secret names/presence only.
- Hosted theatre: claim guard blocks production/general-hosted/compliance wording until gates pass.
- Replay/status risk: replay rejection remains explicit evidence.
- Retention risk: retention class and proof-gap language required before export/read claims.

## Validation Gates

Required gates before claiming the plan complete:

- Hosted admission rejects missing deployment-mode config in hosted paths.
- Hosted admission checks caller role, freshness, scope, tenant/org/project mapping before body parse/kernel invocation.
- Accepted hosted transitions store digest/ref evidence only.
- Redacted evidence reads require receipt id and tenant/org/project entitlement.
- Cross-tenant and missing records are oracle-safe.
- Raw reads obey `rawReadPosture`.
- D1 owns structured evidence indexes/records.
- KV posture is explicitly non-authoritative.
- Readiness reports Cloudflare binding, migration, schema, and secret presence without leaking values.
- Wrangler local/dev proof and remote/prod proof are separately labeled.
- Redaction fuzzing covers tokens, headers, emails, authorization strings, cookies, payment hints, and provider metadata.
- Claim guard rejects hosted mutation authority, hosted payment management, settlement, custody, production readiness, compliance audit, and general hosted Handshake claims.

Suggested closeout commands:

```bash
npm run quality:claims
npm run quality:architecture
npm run format:check
npm run check:repo
npm test -- --run hosted
npm test -- --run d1
npm test -- --run evidence
npm test -- --run redaction
```

## Cut Lines

Cut or defer:

- full RBAC administration UI;
- payment management;
- settlement support;
- provider custody;
- general hosted Handshake operation;
- compliance certification;
- raw evidence browsing;
- hosted mutation orchestration;
- write-capable SDK/CLI/MCP clients;
- multi-provider production deployment automation.

Keep:

- deployment-mode config;
- route admission;
- tenant/org/project read boundary;
- redacted evidence contract;
- raw-read posture;
- D1/KV readiness;
- secret-safe readiness;
- redaction fuzzing;
- hosted claim guard.

## Rollback / Stop Conditions

Stop implementation or rollback the slice if:

- hosted behavior can run with inferred authority defaults;
- redacted reads accept broad query filters instead of exact receipt ids;
- raw evidence is controlled only by convention;
- hosted readiness passes with in-memory or stub storage in a promoted mode;
- secret values appear in readiness, logs, receipts, exports, or support bundles;
- clients bypass reader authorization;
- export is a dump of receipts without redaction, entitlement, and audit posture;
- marketing/docs claim hosted operation beyond enforcement;
- Cloudflare local D1 tests are treated as production proof.

## Smallest Next Action

Add the deployment-mode hosted admission config and claim guard first: hosted routes must fail closed unless mode, verifier strategy, freshness, role/scope policy, tenant source, D1 binding posture, raw-read posture, and secret-name declarations are explicit.
