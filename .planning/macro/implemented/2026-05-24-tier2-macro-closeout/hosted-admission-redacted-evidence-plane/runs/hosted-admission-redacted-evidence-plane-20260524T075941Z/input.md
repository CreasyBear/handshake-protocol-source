# Macro Plan Input: Hosted Admission And Redacted Evidence Plane

Run id: hosted-admission-redacted-evidence-plane-20260524T075941Z
Date: 2026-05-24

## Hard Frame

Handshake is protected actions for automated decision making. Engineering-agent workflows are a stress/adoption context, not the product boundary. x402 exact per-call paid HTTP is the first protected-action wedge, not the protocol.

This is planning only. Do not edit source, tests, docs outside this planning run, package metadata, or previously staged files.

## Goal

Plan how to turn local HTTP/D1 capabilities into an operated boundary only after caller custody, reader authorization, durable storage posture, and evidence redaction are real.

Mechanism target:

```text
caller role token
-> route admission
-> tenant/org/project scope
-> protocol transition or redacted read
-> durable D1/KV storage
-> audit-safe response
```

## Current Source Grounding

Canonical posture:

- `.planning/macro/DEFERRED-INTEGRATE-ELIMINATE.md` says hosted admission and redacted evidence is critical path item 3, after custody proof and terminal verifier trust plane.
- `docs/internal/decisions.md` says HTTP admission, caller custody, OpenAPI projection, and route-scope resolution are protocol transport seams. They may model deployment-mode custody and caller roles, but they do not prove hosted operation, production org auth, provider enforcement, or customer gateway installation.
- `docs/internal/decisions.md` says local HTTP and SDK evidence reads are redacted diagnostic projections, not hosted audit/search product surfaces. The generic raw record route must enforce `rawReadPosture`.
- `README.md` and `docs/internal/protocol-notes.md` explicitly do not claim hosted operation.

Current source anchors:

- `src/http/LANE.md`
- `src/http/app.ts`
- `src/http/app-options.ts`
- `src/http/admission/caller-auth.ts`
- `src/http/admission/hosted-caller-identity.ts`
- `src/http/admission/index.ts`
- `src/http/admission/request-context.ts`
- `src/http/handlers/evidence-read.ts`
- `src/http/handlers/internal-record-read.ts`
- `src/http/routes/evidence-read-route-registry.ts`
- `src/http/routes/transition-route-registry.ts`
- `src/http/routes/transition-scope-resolvers.ts`
- `src/http/store/resolution.ts`
- `src/storage/d1`
- `migrations/`
- `test/http/http.test.ts`
- `test/http/d1-http.test.ts`
- `test/sdk/role-clients.test.ts`
- `test/mcp/mcp-resource-redaction.test.ts`
- `src/surfaces/boundary-manifest.ts`

Landed behavior:

- Hosted mode exists as a transport admission seam.
- `HostedCallerVerifier` verifies caller identity server-side.
- `TransitionCallerIdentity` binds caller identity ref, subject digest, tenant/org, custody roles, provider ref, auth/session/service credential digests, expiry, revocation epoch, and claims digest.
- Hosted admission checks role, freshness, and tenant/org scope before transition body parsing and kernel invocation.
- Accepted hosted transitions store only caller digest/ref evidence, not raw bearer tokens or user-identifying headers.
- Evidence read routes check hosted tenant/org boundaries before returning projections.
- Generic raw record reads consult protocol object `rawReadPosture`, and internal-only records return not found.
- D1/HTTP tests cover durable protocol surface behavior and local D1 evidence paths.

Current gaps:

- No deployment-mode admission config that proves an operated hosted product boundary.
- No production org/project/RBAC/read entitlement model beyond provider-neutral hosted caller identity.
- No retention/export policy or audit-reader posture.
- No hosted readiness probe that states exactly which hosted claims are active.
- No operated Cloudflare D1/KV deployment proof, migration/readiness proof, or secrets posture.
- No proof that hosted evidence responses are safe under redaction fuzzing and reader-role matrices at product level.
- No hosted claim guard beyond current local no-hosted-operation wording.

## Official Source Constraints

Use official source constraints only as planning constraints:

- Cloudflare Workers secrets docs: secrets are encrypted text bindings for sensitive values; do not use `vars` for secrets; deployed secrets can be configured with Wrangler and validated through required secrets configuration.
- Cloudflare Workers environment variable docs: non-secret text/JSON variables are runtime bindings and are not encrypted; with Node compatibility, values may be exposed through `process.env`.
- Cloudflare D1 docs: D1 is accessed from Workers through environment bindings such as `env.DB`; Workers need configured D1 bindings.
- Cloudflare Wrangler configuration docs: D1 database bindings require binding name, database name, and database id.
- Cloudflare D1 getting-started docs: local and remote/production D1 configuration differ; production deployment requires remote database configuration.

Do not claim Cloudflare deployment, org auth, secrets hygiene, D1 production readiness, or hosted operation until implementation verifies the actual config, migrations, secrets, admission, read authorization, and response redaction.

## Required Perspectives

Produce five independent raw perspectives before chair synthesis:

1. Strategy: product posture, hosted claim boundary, sequencing after custody/verifier, x402-first implications.
2. Architecture: admission config, role/read models, scope, durable storage, redacted routes, raw-read posture, readiness probe.
3. Execution: implementation slices, candidate files/tests, closeout commands, dependency graph.
4. Risk/Security: auth bypass, token leakage, tenant leakage, raw record exfiltration, D1/secret/config drift, hosted theatre.
5. Adoption/DevEx: operator setup, SDK/CLI read clients, readiness output, error affordances, support/audit workflow.

## Chair Outputs

Create:

- `PLAN.md`
- `CONTEXT.md`
- `ASSUMPTIONS.md`
- `DECISIONS.md`
- `RISKS.md`
- `VALIDATION.md`
- `TASKS.jsonl`
- `runs/hosted-admission-redacted-evidence-plane-20260524T075941Z/synthesis.md`

The final `PLAN.md` must include:

- Goal
- Non-Goals
- Source Boundary
- Current State
- Target State
- Assumptions
- Decisions
- Phases
- Task Graph
- Risks And Mitigations
- Validation Gates
- Cut Lines
- Rollback / Stop Conditions
- Smallest Next Action

## Must-Haves

- Hosted admission is not authority. It authenticates/contextualizes callers before protocol transitions and redacted reads.
- Route admission must happen before body parsing or kernel invocation for mutating transitions.
- Reader roles must be distinct from control-plane/runtime/gateway/review roles where product semantics require it.
- Raw records must remain gated by `rawReadPosture`; internal-only objects must not be revealed through public/hosted reads.
- Evidence responses must be projection-owned and redaction-tested, not generic raw-record dumps.
- Hosted readiness must state active claims and non-claims explicitly.
- Cloudflare/D1/secrets claims require official-source-informed deployment checks, not local harness evidence alone.

## Antipatterns To Reject

- Hosted dashboard before custody, verifier, admission, and redacted reads are real.
- Treating hosted caller identity as principal authority or greenlight.
- Treating HTTP transport as hosted operation.
- Treating D1 local tests as production deployment readiness.
- Exposing raw protocol records because the caller has a control-plane token.
- Returning different errors for missing vs cross-tenant anchors.
- Storing raw bearer tokens, emails, secrets, or provider tokens in protocol records.
- Reader role overreach that allows evidence exfiltration.
- Claiming provider/customer gateway custody from hosted route admission.

## Closeout Expectations

Planning closeout is successful when every required output exists, `TASKS.jsonl` parses, required plan sections exist, source working tree remains untouched, and the plan states validation commands for eventual implementation.
