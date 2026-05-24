# Validation Matrix

| Gate | What Must Be Proven | Evidence |
|---|---|---|
| Hosted deployment mode | Hosted paths fail closed without explicit mode/config | Config tests |
| Admission ordering | Role/freshness/scope/tenant checks happen before body parse/kernel invocation | Route-order tests |
| Exact x402 boundary | Hosted plan remains exact per-call protected action only | Claim guard and protocol tests |
| Digest/ref storage | Hosted transitions do not store raw tokens/user headers | Receipt fixture tests and redaction fuzzing |
| Reader authorization | Evidence reads require tenant/org/project entitlement | Read matrix tests |
| Oracle-safe denial | Missing and unauthorized evidence reads do not leak record existence | Negative read tests |
| Raw-read posture | Raw reads obey unavailable/disabled/gated/allowed states | Raw posture tests |
| D1 authority | D1 owns structured evidence indexes/records | Storage contract tests |
| KV limits | KV is non-authoritative or explicitly limitation-bound | Storage posture tests |
| Cloudflare bindings | D1/KV binding and migration posture are reported separately for local/dev and remote/prod | Wrangler proof artifacts |
| Secrets posture | Secret names/presence are reported, never values | Readiness redaction tests |
| Readiness posture | Readiness returns active/configured_but_unverified/missing/disabled/read_only/not_promoted accurately | Readiness matrix |
| Retention/export | Retention class and export behavior are scoped, redacted, receipted, and proof-gap aware | Retention/export tests |
| Client posture | SDK/CLI/MCP clients are read-only by default and label authority class | Client output tests |
| Claim safety | Hosted claims do not exceed enforcement | Claim guard |

# Closeout Commands

Planning-only expected closeout command set:

```bash
npm run quality:claims
npm run quality:architecture
npm run format:check
npm run check:repo
npm test -- --run hosted
npm test -- --run evidence
npm test -- --run redaction
npm test -- --run d1
npm test -- --run readiness
```

Cloudflare posture proof must be separated:

```bash
wrangler d1 migrations list --local
wrangler d1 migrations list --remote
wrangler d1 execute <database> --local --command "select 1"
wrangler d1 execute <database> --remote --command "select 1"
wrangler secret list
```

These commands are validation targets, not evidence in this planning run.

# Closeout Bar

The slice is not complete until the repo can answer:

- who attempted the hosted transition;
- what exact protected x402 call was admitted;
- whether admission happened before body/kernel trust;
- which tenant/org/project owned the transition;
- what was stored, redacted, unavailable, or refused;
- whether raw access was blocked, gated, or allowed;
- whether D1/KV bindings and migrations were configured;
- whether secrets were present without exposing values;
- whether export/reconstruction is possible within declared limits;
- whether product claims match enforcement.
