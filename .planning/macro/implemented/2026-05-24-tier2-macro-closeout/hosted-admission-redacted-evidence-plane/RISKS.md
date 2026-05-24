# Risk Register

| Risk | Failure Mode | Impact | Mitigation | Validation |
|---|---|---:|---|---|
| Hosted auth bypass | Route accepts hosted transition without explicit deployment/verifier/role/scope config | Critical | Deny-by-default hosted config | Missing-config rejection tests |
| Caller identity overreach | Provider-neutral identity becomes org/project entitlement | Critical | Explicit tenant/org/project mapping | Cross-scope admission tests |
| Body trust before admission | Parser/kernel observes unadmitted request | Critical | Admission before body parse/kernel invocation | Route-order tests |
| Token/header leakage | Raw auth material appears in receipt/readiness/log/export | Critical | Digest/ref evidence only, redaction schema | Redaction fuzzing |
| Cross-tenant evidence leak | Read route misses tenant/org/project predicate | Critical | Storage keying plus read predicate | Tenant matrix tests |
| Missing-vs-unauthorized oracle | Response distinguishes absent record from cross-tenant record | High | Oracle-safe denial | Negative read matrix |
| Raw evidence exfiltration | Raw reads allowed by role name or convention | Critical | `rawReadPosture` with scope/purpose/time/audit | Raw posture tests |
| D1 production drift | Local D1 proof treated as remote/prod proof | High | Readiness labels local/remote and migration/schema status | Wrangler local and remote proof gates |
| KV authority creep | KV becomes evidence source of truth | High | D1 authoritative decision, KV limitation docs | Storage contract tests |
| Secret leakage | Readiness exposes secret values or dynamic env dump | Critical | Secret names/presence only | Snapshot and fuzz checks |
| Hosted theatre | Readiness says ready while storage/verifier/secrets are stubs | High | `configured_but_unverified`, `not_promoted`, `missing` states | Readiness fixture matrix |
| Claim overreach | Docs imply hosted Handshake, compliance audit, custody, or production operation | High | Claim guard | `quality:claims` |
| Export overreach | Export dumps raw receipts without entitlement/redaction/audit | High | Export scope, redaction, receipt, proof gaps | Export contract tests |
| Retention theatre | Retention language exceeds implemented lifecycle | Medium | Retention classes and proof gaps | Retention matrix |
