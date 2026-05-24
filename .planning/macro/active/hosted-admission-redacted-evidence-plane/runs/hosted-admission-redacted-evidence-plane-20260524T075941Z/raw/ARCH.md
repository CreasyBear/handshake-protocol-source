# ARCH Perspective

## Invariant At Stake

Hosted admission must prove only that a caller may enter the hosted service path. It must not become execution authority, evidence authority, raw-read authority, or proof that downstream storage/deployment posture is safe.

## Architecture Position

The plan should define a hosted evidence plane with three hard boundaries:

1. Admission boundary: caller identity, role, freshness, and declared scope checked before body parse or kernel invocation.
2. Read entitlement boundary: redacted evidence reads authorized by tenant/org, role, scope, and production RBAC rules.
3. Storage/deployment boundary: D1/KV bindings, secrets, vars, retention, export, and readiness are explicitly configured and provable per deployment mode.

Hosted admission is only the door. The read model and storage posture decide what the caller can see.

## Admission Config

Add an explicit deployment-mode admission configuration, likely:

- local-dev
- test
- preview
- production

Each mode should declare:

- accepted issuer/verifier strategy;
- required freshness window;
- allowed roles;
- allowed scopes;
- tenant/org source;
- whether raw reads are impossible, disabled, or gated;
- required D1/KV bindings;
- required secret names;
- required public vars;
- readiness expectations.

Do not infer production posture from local tests. Local D1 and remote D1 are different authority surfaces.

## Role And Read Models

Split roles from read entitlements.

Roles answer: "who is this caller?"

Read entitlements answer: "what evidence shape may this caller retrieve for this tenant/org/scope?"

Minimum model:

- viewer: redacted evidence only;
- auditor: expanded redacted evidence plus proof-gap/refusal metadata;
- operator: operational readiness/status only, no raw evidence by default;
- rawEvidenceReader: exceptional entitlement, never implied by hosted admission.

Production RBAC must be a first-class policy input, not scattered route conditionals.

## Scope Model

Scopes should be exact capabilities, not vague access labels.

Candidate scopes:

- evidence:redacted:read
- evidence:raw:request
- evidence:raw:read
- evidence:export:create
- evidence:retention:admin
- hosted:readiness:read

A caller with evidence:redacted:read cannot get raw fields through alternate route parameters, export, readiness payloads, debug responses, or error messages.

## Durable Storage Posture

D1 should own structured evidence indexes and redacted read records.

KV should only be used where eventual consistency is acceptable, such as readiness markers, deployment metadata, or non-authoritative cache state. Do not put raw authority-bearing evidence in KV unless the plan explicitly accepts its consistency and audit limits.

Retention/export needs a concrete posture:

- retention class per evidence type;
- redacted export format;
- raw export disabled unless explicitly entitled;
- export receipt records;
- proof-gap behavior when export cannot verify completeness.

## Redacted Routes

Redacted routes must bind every read to:

- tenant/org;
- caller identity;
- role;
- scope;
- evidence record id/query;
- redaction profile;
- storage binding used;
- receipt/read audit event.

Routes should never return "best effort" evidence without labeling proof gaps. If a redaction rule cannot be applied deterministically, fail closed or return a proof gap envelope.

## Raw-Read Posture

Keep rawReadPosture, but make it production-visible and route-enforced.

States should be explicit:

- unavailable: raw evidence is not stored or not reachable in this deployment.
- disabled: raw evidence exists but reads are not allowed.
- gated: raw reads require separate entitlement and audit.
- allowed: only for tightly scoped internal/test modes, preferably never production default.

A raw-read posture flag is not enough. The route must enforce it before storage access.

## Readiness Probe

Hosted readiness should verify configuration, not leak evidence.

It should report:

- deployment mode;
- D1 binding presence;
- KV binding presence if required;
- required secrets configured, names only, never values;
- required vars configured;
- local vs remote D1 posture;
- migration/schema version;
- admission verifier configured;
- redaction profiles loaded;
- retention/export config loaded.

It should not prove that a caller may read evidence. It proves the hosted plane is configured enough to evaluate admission and reads.

## Storage And Deployment Config

The plan must add Cloudflare-specific proof:

- wrangler.toml D1 binding names match source expectations;
- preview and production D1 databases are distinct;
- local tests do not masquerade as remote proof;
- secrets are configured through Cloudflare secrets, not vars;
- non-secret config uses vars;
- KV namespaces are explicitly bound per environment;
- deployment docs show exact commands/checks for local and remote D1.

Do not accept "tests pass locally" as hosted readiness.

## Import And Source Ownership

Keep ownership boring:

- admission config types live with hosted ingress/admission code;
- read entitlement policy lives near evidence read routes, not inside storage adapters;
- D1/KV binding validation lives in hosted platform config;
- redaction profiles live with evidence serialization;
- raw-read posture lives with evidence access policy;
- readiness probe composes config checks but owns no policy.

No route should import kernel internals just to answer hosted read requests.

## Risks

- Admission becomes ambient evidence authority.
- Production RBAC is bolted onto routes after the fact.
- Raw reads leak through export, debug, readiness, or error envelopes.
- Local D1 tests create false confidence for remote Cloudflare deployment.
- Secrets are accidentally modeled as vars.
- KV is used for authoritative evidence because it is convenient.
- Redaction is unit-tested but not fuzzed at product boundary.

## Validation Gates

- Hosted request with valid identity but missing read scope is refused before evidence access.
- Hosted request with valid admission but wrong tenant/org cannot read redacted evidence.
- Raw evidence read fails unless posture and entitlement both allow it.
- Readiness fails when required D1/KV bindings are absent.
- Readiness reports secret presence without exposing secret values.
- Remote D1 deployment proof is separate from local D1 test proof.
- Redaction fuzz tests assert forbidden raw fields never appear in route bodies, export bodies, errors, logs, or readiness output.

## Cut Lines

Cut from this macro plan:

- new dashboard UX;
- broad audit analytics;
- generalized compliance exports;
- mutation authority;
- gateway greenlight changes;
- multi-runtime adapter expansion;
- raw evidence browsing UI.

Keep the wedge narrow: hosted admission plus redacted evidence reads plus deployment posture proof.

## Brutal Verdict

Keep the initiative, but narrow it.

The current source appears to have the right early boundary: admission before body parse/kernel invocation and redacted reads with tenant/org checks. The missing pieces are production hardening, not product expansion.

Hosted admission is not authority. Redacted evidence access is its own entitlement plane. Raw reads are exceptional. Cloudflare deployment proof is a separate gate from local D1 correctness.

## Smallest Next Mechanism

Define a typed HostedAdmissionConfig plus ReadEntitlementPolicy that makes deployment mode, role, scope, tenant/org binding, raw-read posture, and required Cloudflare bindings explicit before adding any new route surface.
