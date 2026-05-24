# RISK Perspective

## Invariant At Stake

Hosted mode must not turn evidence reads or admission checks into ambient authority. Caller identity evidence, redacted receipts, and hosted verifier status are not permission unless the hosted boundary enforces role, freshness, scope, tenant, and raw-read posture server-side.

## Risk Findings

| Risk | Failure mode | Required control |
| --- | --- | --- |
| Auth bypass | Hosted endpoint becomes a second path around local verifier/gateway checks. | One hosted admission verifier, deny-by-default, no fallback to advisory mode. |
| Caller identity overreach | Caller-supplied digest/ref is treated as authority instead of evidence. | Digest/ref is evidence only; authorization derives from verified issuer, tenant, role, scope, freshness, and policy version. |
| Token/email leakage | Receipts expose bearer tokens, emails, headers, OAuth claims, webhook payloads, or secret-like refs. | Redaction schema with denylisted fields, typed secret markers, email hashing policy, and snapshot tests. |
| Cross-tenant leaks | Evidence read APIs return receipts from another org through guessed IDs, shared indexes, or weak filters. | Tenant/org boundary must be part of the storage key and every read predicate; no app-layer-only filtering. |
| Missing-vs-cross-tenant oracle | 404 missing vs 403 forbidden lets callers enumerate foreign receipt IDs. | Normalize unauthorized and nonexistent reads unless caller has tenant-scoped index permission. |
| Raw record exfiltration | rawReadPosture becomes a boolean escape hatch for full receipt payloads. | Raw reads require explicit role, purpose, time-bound scope, audit receipt, and field-level allowlist. |
| D1 config drift | Local D1 schema, bindings, migrations, or seed data differ from production. | Migration gate must prove local and production migration state, binding name, and schema hash alignment. |
| Secrets via process.env | Worker code accidentally depends on Node-style env or source-defined secrets. | Cloudflare env binding only; static check banning secret literals and process.env in worker/runtime paths. |
| Hosted theatre | Hosted verifier records "checked" but mutation/evidence access can still proceed through local/raw/sibling route. | Plan must identify every hosted and non-hosted ingress and mark bypass posture for each. |
| Replay/status risk | Stale verifier status or copied caller evidence authorizes later reads/admissions. | Nonce or timestamp freshness, policy version binding, single-use admission where consequential, replay receipt on rejection. |
| Retention risk | Evidence plane stores too much raw payload forever. | Retention class per evidence type, redaction-before-persist where possible, deletion/export policy, proof-gap when raw evidence is unavailable. |

## Recommended Plan Shape

1. Define Hosted Admission Contract.
   Inputs: caller credential, caller identity digest/ref, tenant/org, requested action/evidence scope, freshness window, policy version, rawReadPosture.
   Outputs: allow/refuse/review/quarantine plus reason code and receipt reference.
   Non-output: no mutation permission, no proof of downstream execution.

2. Build Redacted Evidence Read Model.
   Separate redactedEvidenceRead from rawEvidenceRead.
   Redacted reads are default and tenant-scoped.
   Raw reads are exceptional, audited, scoped, and purpose-bound.

3. Close Oracle And Exfiltration Paths.
   Same response posture for missing and unauthorized records unless index authorization is proven.
   No raw receipt fetch by ID without tenant-bound authorization.
   No caller-controlled projection fields.

4. Add Cloudflare Deployment Proof.
   D1 binding proof.
   Migration state proof.
   Secret binding proof.
   Production-vs-local config divergence recorded explicitly.

## Cut Lines

- Cut any plan that treats caller identity digest as authorization.
- Cut any read API that can return raw records by default.
- Cut any hosted verifier that does not enumerate bypass posture.
- Cut any production claim without Cloudflare binding and D1 migration proof.
- Cut process.env dependency from worker/runtime code.
- Cut separate error semantics that expose whether a foreign receipt exists.

## Validation Gates

- Auth matrix: tenant x role x scope x freshness x rawReadPosture.
- Cross-tenant negative tests using valid foreign IDs.
- Missing-vs-forbidden response equivalence tests.
- Redaction snapshot tests for tokens, emails, headers, secrets, env names, webhook bodies.
- Raw-read audit tests proving every raw access creates evidence.
- Replay tests for stale caller evidence and reused status.
- D1 migration drift check for local and production binding names/schema hashes.
- Static scan blocking secret literals and process.env in hosted worker paths.
- Hosted bypass test proving unwrapped local/sibling reads cannot access protected evidence.

## Antipatterns

- Hosted mode as a trust label instead of an enforced boundary.
- Redacted evidence implemented as UI filtering.
- Caller identity stored as a digest with no issuer, freshness, or tenant binding.
- Returning 403 for foreign records and 404 for missing records.
- Raw read as admin convenience.
- Production readiness based on local Wrangler success.
- Secrets in vars, source, logs, receipt metadata, or test fixtures.
- Receipts that do not distinguish admission check, evidence read, raw read, and downstream execution.

## Blocked Checks

- No filesystem, source, config, migration, or test verification was performed per instruction.
- Product-level hosted deployment proof remains unverified.
- Existing read authorization model remains unverified.

## Brutal Verdict

Narrow and keep, but only if hosted mode is treated as a new protected ingress, not a deployment flavor. The dangerous part is not transport; it is evidence authority moving server-side without a precise read contract.

Smallest next mechanism to build: a tenant-bound EvidenceReadAuthorization contract with redacted vs raw posture, freshness, role/scope checks, oracle-safe denial semantics, and mandatory audit receipt for every raw read.
