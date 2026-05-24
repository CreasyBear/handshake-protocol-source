# EXECUTION Perspective

## Invariant At Stake

Hosted operation must not turn redacted evidence reads into ambient authority. Admission, storage, read authorization, redaction, export, and claims all need explicit boundaries, or this becomes advisory evidence hosting rather than Handshake enforcement support.

## Ordered Implementation Slices

### 1. Deployment-Mode Admission Config

Goal: make hosted/self-hosted/local admission behavior explicit before touching storage or reads.

Candidate paths:

- src/admission/*
- src/hosted/*
- src/config/*
- tests/admission/*.test.ts
- docs/internal/protocol-notes.md

Work:

- Add a typed deployment mode: local | self_hosted | hosted.
- Require hosted mode to declare admission authority holder, storage backend, read policy, retention policy, and raw-read posture.
- Refuse startup/readiness if hosted mode has implicit defaults for protected fields.
- Ensure deployment mode is evidence metadata, not permission.

Tests:

- hosted mode fails closed on missing read policy.
- local mode cannot accidentally expose hosted-read behavior.
- mode is captured in admission/readiness evidence.

Stop condition: any hosted behavior can run with inferred authority defaults.

### 2. Reader Authorization Boundary

Goal: every redacted evidence read must pass a reader authorization check bound to evidence scope.

Candidate paths:

- src/evidence/read*
- src/readers/*
- src/auth/*
- src/protocol/*
- tests/evidence/read-authorization.test.ts

Work:

- Define EvidenceReadRequest, EvidenceReader, EvidenceReadDecision.
- Bind reader authorization to tenant/workspace, action contract id, receipt id, evidence class, redaction profile, and export purpose.
- Return refusal/proof gap for unreadable evidence rather than silently omitting.
- Log read decision separately from mutation receipt.

Tests:

- unauthorized reader cannot read redacted evidence.
- authorized reader cannot widen from receipt-level to workspace-level.
- read refusal is reconstructable.

Stop condition: any redacted evidence read path accepts only a receipt id and returns data without reader context.

### 3. rawReadPosture Hardening

Goal: raw evidence access must be explicitly disabled, break-glass, or delegated to a storage-side authority. Never implicit.

Candidate paths:

- src/evidence/redaction*
- src/evidence/raw*
- src/protocol/evidence*
- tests/evidence/raw-read-posture.test.ts

Work:

- Make rawReadPosture an enum: disabled | storage_only | break_glass.
- Fail hosted mode unless raw reads are disabled or guarded by explicit break-glass policy.
- Make raw-read attempts produce refusal or proof-gap evidence.
- Ensure redacted reads cannot include raw fields through nested payloads or metadata.

Tests:

- hosted mode rejects rawReadPosture: allowed.
- raw evidence is absent from SDK/CLI read clients.
- fuzzed nested objects cannot leak raw payloads.

Stop condition: raw read behavior is controlled by caller convention rather than schema/state.

### 4. D1/KV Deployment Readiness

Goal: hosted persistence must prove schema, namespace, migration, and consistency posture before claiming readiness.

Candidate paths:

- src/storage/d1*
- src/storage/kv*
- src/hosted/readiness*
- wrangler.toml
- migrations/*
- tests/storage/*.test.ts

Work:

- Add readiness checks for D1 schema version, KV namespace binding, receipt/evidence indexes, retention clock, and migration status.
- Separate write-store readiness from read-plane readiness.
- Record unavailable storage as readiness refusal, not degraded success.
- Add fixture-backed storage contract tests.

Tests:

- readiness fails with missing D1 binding.
- readiness fails with missing KV namespace.
- storage adapter round-trips redacted evidence only.
- migration version mismatch blocks hosted admission.

Stop condition: hosted readiness can pass with in-memory or stub persistence.

### 5. Secrets Posture

Goal: hosted admission must not depend on undeclared secrets or leak secret-derived material into evidence.

Candidate paths:

- src/secrets/*
- src/config/secrets*
- src/hosted/readiness*
- tests/secrets/*.test.ts
- docs/internal/decisions.md

Work:

- Define required secret names per deployment mode.
- Add startup/readiness validation for present-but-not-logged secrets.
- Redact secret-like values in evidence and read responses.
- Prevent SDK/CLI from printing secret-bearing config.

Tests:

- missing hosted secret fails readiness.
- evidence redaction catches token/key/env patterns.
- logs/read responses do not include secret values.

Stop condition: hosted mode can boot while discovering secrets dynamically from environment without declared posture.

### 6. Retention And Export

Goal: redacted evidence is useful only if retention/export rules are explicit and auditable.

Candidate paths:

- src/evidence/retention*
- src/evidence/export*
- src/storage/*
- tests/evidence/retention-export.test.ts

Work:

- Add retentionPolicyId, expiry, legal-hold posture, and export profile to evidence metadata.
- Implement redacted export only; raw export requires break-glass refusal/review path.
- Add export receipts distinct from execution receipts.
- Make expired evidence return tombstone/proof gap, not silent 404.

Tests:

- expired evidence is unavailable with reconstructable tombstone.
- export cannot widen redaction profile.
- raw export is refused in hosted mode unless break-glass path exists.

Stop condition: export is just "dump stored receipts."

### 7. Hosted Readiness Probe

Goal: expose a probe that says whether hosted admission/read plane can enforce boundaries now.

Candidate paths:

- src/hosted/readiness*
- src/http/*
- src/cloudflare/*
- tests/hosted/readiness.test.ts

Work:

- Probe admission config, storage, read auth, redaction profile, raw posture, retention, secrets, and claim guard versions.
- Return machine-readable failed gates.
- Keep probe read-only.
- Ensure probe does not disclose secrets or raw evidence.

Tests:

- each missing subsystem maps to a named readiness failure.
- readiness cannot pass when redaction fuzz suite is disabled from claim guard metadata.
- probe response is safe for operator display.

Stop condition: readiness reports "ok" based only on process health.

### 8. Redaction Fuzzing

Goal: prove redaction survives nested payloads, unknown keys, arrays, metadata, and future schema drift.

Candidate paths:

- src/evidence/redaction*
- tests/evidence/redaction-fuzz.test.ts
- tests/fixtures/evidence/*

Work:

- Add property/fuzz tests for secret-like strings, raw payload fields, nested command outputs, env names, URLs with credentials, tokens, and stack traces.
- Assert redacted output preserves structure enough for reconstruction without leaking raw values.
- Add regression corpus for known dangerous shapes.

Tests:

- no raw payload field survives.
- no known secret pattern survives.
- redaction is deterministic for canonical evidence.

Stop condition: redaction is only snapshot-tested on happy-path receipts.

### 9. SDK/CLI/Read Client Posture

Goal: clients must expose redacted evidence reads without implying hosted mutation authority or raw evidence access.

Candidate paths:

- packages/sdk/*
- packages/cli/*
- src/client/*
- tests/sdk/*.test.ts
- tests/cli/*.test.ts

Work:

- Add read client methods that require reader context and requested redaction profile.
- Avoid generic getReceiptRaw or readEvidence(any) surfaces.
- CLI should show refusal/proof-gap/read-decision state explicitly.
- Client docs must say hosted read plane is not hosted execution authority.

Tests:

- CLI cannot request raw evidence in hosted mode.
- SDK method requires reader identity/scope.
- client output distinguishes redacted receipt, read refusal, proof gap, and expired evidence.

Stop condition: SDK/CLI adds convenience methods that bypass the reader authorization model.

### 10. Claim Guards

Goal: repo claims must not say hosted operation exists until all enforcement and evidence gates pass.

Candidate paths:

- scripts/quality/*
- docs/internal/*
- README.md
- QUALITY.md
- tests/quality/*.test.ts

Work:

- Add claim guard terms for hosted, managed, cloud, evidence plane, redacted read, and raw evidence.
- Permit only narrow language until readiness, auth, redaction fuzzing, storage, and retention/export gates exist.
- Require docs to distinguish hosted admission seam from hosted operation.
- Add CI/local quality command coverage.

Tests:

- forbidden hosted claims fail quality checks.
- allowed guarded language passes.
- README cannot claim hosted operation without linking readiness/read authorization posture.

Stop condition: marketing or README claims outpace gateway/read-plane enforcement.

## Dependency Graph

```text
deployment-mode config
  -> reader authorization
  -> rawReadPosture hardening
  -> D1/KV readiness
  -> secrets posture
  -> retention/export
  -> hosted readiness probe
  -> SDK/CLI/read client posture
  -> claim guards

redaction fuzzing
  -> rawReadPosture hardening
  -> hosted readiness probe
  -> claim guards

D1/KV readiness
  -> retention/export
  -> hosted readiness probe

reader authorization
  -> SDK/CLI/read client posture
  -> retention/export
```

## Parallelizable Work

Can run in parallel after deployment-mode config lands:

- reader authorization schema/design
- redaction fuzz corpus
- D1/KV readiness adapter planning
- secrets posture validation
- claim guard vocabulary draft

Must stay serialized:

- rawReadPosture hardening before SDK/CLI raw-read behavior
- storage readiness before hosted readiness probe
- retention/export before external export claims
- final claim guards after all enforcement gates are named

## Closeout Commands

Candidate closeout gates:

```bash
npm run quality:claims
npm run quality:architecture
npm run format:check
npm run check:repo
```

Focused test candidates:

```bash
npm test -- admission
npm test -- evidence
npm test -- storage
npm test -- hosted
npm test -- sdk
npm test -- cli
```

## Rollback / Stop Conditions

Stop immediately if:

- hosted mode can pass readiness with stub or local storage.
- redacted evidence reads do not require reader authorization.
- raw evidence is reachable through SDK, CLI, export, debug, or metadata.
- readiness proves process liveness instead of enforcement readiness.
- docs claim hosted operation before D1/KV, secrets, read auth, retention/export, and redaction fuzzing are gated.
- receipts blur execution evidence, read evidence, export evidence, and proof gaps.

Rollback line:

- keep hosted admission seam and redacted evidence reads as local/self-hosted primitives.
- do not expose hosted mode or hosted claims until readiness and claim guards pass.

## Traps

- Hosted admission can become a product claim without hosted enforcement.
- Redacted read clients can become ambient workspace observability.
- Raw evidence can leak through metadata, stack traces, debug fields, export paths, or CLI formatting.
- D1/KV bindings can exist while schema/index/readiness posture is unproven.
- Retention can delete evidence and destroy reconstructability unless tombstones/proof gaps survive.
- SDK convenience methods can erase the reader authorization boundary.
- Readiness probes often lie by checking uptime instead of enforcement gates.
- Claim guards must police docs and names, not just README prose.

## Smallest Next Mechanism

Build the deployment-mode admission config first: one typed hosted-mode object that fails closed unless reader policy, storage backend, rawReadPosture, secrets posture, and retention policy are explicitly declared.
