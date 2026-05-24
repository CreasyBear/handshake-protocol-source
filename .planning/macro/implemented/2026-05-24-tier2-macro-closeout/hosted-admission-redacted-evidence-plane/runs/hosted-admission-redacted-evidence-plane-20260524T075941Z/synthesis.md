# Chair Synthesis: Hosted Admission And Redacted Evidence Plane

## Invariant At Stake

Hosted admission and hosted reads must remain evidence-plane mechanisms. They cannot become hosted mutation authority, payment management, settlement, provider custody, general hosted Handshake operation, or audit/compliance theatre.

The core invariant is still exact protected action control:

```text
vague intent is not authority
generated orchestration is not authority
hosted admission is not authority to mutate
redacted evidence is not proof of downstream success
readiness is not production proof
```

## Perspective Reconciliation

STRATEGY is right to narrow the claim. The market/product claim must be hosted admission plus redacted evidence for exact x402-protected calls, not hosted Handshake. The necessary sequence is deployment mode, read entitlement, redaction contract, Cloudflare durable proof, readiness, redaction fuzzing, and claim guard.

ARCH is right about the three boundaries: admission, read entitlement, and storage/deployment. The plan adopts deployment modes, explicit verifier/read config, separated roles/scopes, D1 authority, KV limitation, rawReadPosture, and readiness posture.

EXECUTION is right about stop conditions. The plan fails if hosted behavior runs with inferred authority defaults, if raw reads are convention-controlled, if readiness passes against stubs, if export is a receipt dump, or if clients bypass reader authorization.

RISK is right that the dangerous failures are not abstract. They are auth bypass, identity overreach, token leakage, cross-tenant leakage, oracle leaks, raw exfiltration, D1 drift, secret leakage, hosted theatre, replay/status confusion, and retention theatre. The mitigation set is now mapped into validation gates.

ADOPTION is right that the operator path must be small: provision endpoint, bind D1, migrate, register role/scope policy, configure secrets/redaction/raw-read/retention-export, run readiness, expose read clients. The useful operator answer is what is enforcing, observing, redacted, unavailable, retained, and exportable.

## 10-Star Bar

A 10-star implementation can answer, from durable evidence and safe hosted reads:

- who attempted the hosted transition;
- whether admission happened before body parse and kernel invocation;
- which tenant/org/project owned the attempt;
- what exact x402 protected call was admitted;
- what evidence was stored as digest/ref;
- what evidence was redacted;
- what evidence is unavailable;
- what raw evidence is blocked, gated, or allowed;
- whether D1 bindings, migrations, and schema are configured;
- whether KV is non-authoritative;
- whether required secrets are present without revealing values;
- whether export/reconstruction is possible within declared limits;
- whether the public claim matches enforcement.

## Antipatterns

- Hosted readiness passes because the process is alive.
- Local D1 tests are treated as Cloudflare production proof.
- Provider-neutral identity becomes tenant/org/project entitlement.
- A transition caller automatically becomes an evidence reader.
- Redacted read APIs accept broad filters instead of exact receipt/evidence ids.
- Raw reads are guarded by naming convention.
- KV becomes the de facto evidence source of truth.
- Readiness dumps `process.env` or secret values.
- Export is a raw receipt dump.
- SDK/CLI/MCP clients imply gateway authority.
- Docs say hosted Handshake when the system only admits transitions and serves redacted reads.
- Compliance language appears before retention/export/audit posture exists.

## Final Verdict

Keep, but narrow.

This is a valid Tier 2 macro plan only if it remains hosted admission plus redacted evidence plane for exact x402 per-call protected actions. The plan should not promote hosted mutation authority, general engineering-agent execution control, payment management, custody, settlement, production readiness, or compliance audit.

The smallest next mechanism is explicit deployment-mode hosted admission config with fail-closed defaults and a hosted claim guard.
