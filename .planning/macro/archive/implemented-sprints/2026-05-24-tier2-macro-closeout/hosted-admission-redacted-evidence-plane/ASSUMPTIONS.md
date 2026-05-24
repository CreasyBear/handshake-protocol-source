# Assumptions

## Product Assumptions

- Handshake is protected actions infrastructure for automated decision making.
- x402 exact per-call protected spend is the first wedge.
- Hosted admission and redacted evidence reads are Tier 2 mechanisms.
- Tier 1 kernel authority boundaries remain unchanged.
- Engineering-agent workflows are stress/adoption context, not the product boundary.
- The valid hosted claim is narrow: admit exact protected-call transitions before kernel invocation and expose redacted evidence through tenant-scoped read controls.

## Source Assumptions

- Hosted mode already exists as a transport admission seam.
- `HostedCallerVerifier`, `TransitionCallerIdentity`, role checks, freshness checks, and scope checks already happen before body parse/kernel invocation.
- Accepted hosted transitions already store digest/ref evidence rather than raw tokens or raw user headers.
- Evidence read routes already check tenant/org boundaries.
- Generic raw record reads already consult `rawReadPosture`.
- D1/HTTP tests already cover durable protocol surface and local D1 behavior.

## External Assumptions

- Cloudflare D1/KV local/dev posture is not production proof.
- Wrangler local/dev behavior and remote/prod behavior must be validated separately.
- Cloudflare D1 bindings, KV bindings, migrations, and remote deployment state require explicit proof.
- Sensitive values belong in Cloudflare secrets, not public vars.
- Readiness may report secret names and presence, never secret values.
- KV consistency limits make it unsuitable as authoritative evidence storage unless limitations are explicit.
- D1 should own structured evidence indexes and records for this plan.

## Validation Requirements

- Hosted admission must fail closed when deployment-mode config is absent or inferred.
- Role, scope, freshness, and tenant/org/project mapping must be checked before body parse/kernel invocation.
- Redacted reads must require tenant/org/project entitlement and exact receipt/evidence id.
- Missing and unauthorized records must produce oracle-safe denial.
- Raw reads must obey explicit `rawReadPosture`.
- Readiness must distinguish local/dev, preview, and production posture.
- Secret values must never appear in readiness, receipts, logs, exports, or support bundles.
- Redaction must be proven by fuzzing and read matrices, not wording.
- Hosted claims must be guarded by enforcement evidence.
