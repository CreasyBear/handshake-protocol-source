# Risks

## P0 Risks

### Raw Material Leakage

Risk: auth.md credential material or x402 signer/payment material appears in
generated execution, runtime, MCP, CLI, SDK, packet, receipt, demo, support, or
logs.

Mitigation: deny-by-default redaction tests; gateway-only custody/signing;
packet redaction manifest; P0 stop condition.

### Ambient Authority

Risk: one greenlight authorizes registration, credential use, payment signing,
retry, or service calls more than once.

Mitigation: one-use consumption key; replay refusal before credential or signer
reuse; idempotency-bound recovery only.

### Gateway Bypass

Risk: raw HTTP, MCP, browser, shell, package, or sibling tool path uses bearer
credentials or signer material outside the protected gateway.

Mitigation: named bypass probes with posture labels: prevented, detected, or
unknown. Unknown is a proof gap.

### Evidence Theatre

Risk: packet or receipt says "success" while only registration, challenge,
gateway admission, signer invocation, signed retry, or downstream unknown is
known.

Mitigation: separate receipt fields for gateway check, credential resolution,
signer invocation, signed retry, downstream finality, refusal, replay refusal,
and proof gap.

## P1 Risks

### Credential Theatre

Risk: auth.md registration, ID-JAG verification, OAuth scopes, trusted issuer,
claim completion, or revocation is treated as permission.

Mitigation: explicit `authMdRegistrationCreatedAuthority: false`; tests proving
auth.md events create no policy, greenlight, gateway check, mutation, receipt,
or certificate.

### Payment Theatre

Risk: x402 challenge, selected requirement, payment payload, payment signature,
or signed retry is treated as payment approval, settlement, or aggregate spend
control.

Mitigation: packet non-claims; per-call amount bounds; signer-after-gate tests;
claim gates.

### Review Theatre

Risk: a review surface shows a friendly combined summary not bound to the exact
contract, policy input, gateway check, and packet refs.

Mitigation: no review UI first; future review must render exact contract facts
and packet refs used by policy/gateway.

### Revocation And Claim Widening

Risk: revocation, expiry, downstream `401`, anonymous in-place scope widening,
or claim state drift fails to isolate credential refs before future authority.

Mitigation: policy and gateway both re-read isolation; rotate/quarantine/refuse
post-claim widening until source-owned behavior exists.

### Stale Metadata And Audience Drift

Risk: stale PRM, AS metadata, `agent_auth`, selected x402 requirement, amount,
payee, network, endpoint, body/header digest, gateway registry, or policy
version still passes policy or gateway.

Mitigation: canonical digest matching; mismatch becomes refusal, isolation, or
proof gap. Model interpretation cannot repair drift at execution time.

## P2 Risks

### Market Claim Drift

Risk: local/reference packet becomes public language for agent auth, payments,
provider custody, settlement, certification, or trust.

Mitigation: non-claims in packet, docs, README, demo, CLI output, and claim
quality gates.

### Adoption Overload

Risk: first-use path asks developers to run auth.md reference services, real
wallets, hosted operation, MCP publication, or external credentials.

Mitigation: x402-first local proof, then packet inspection, then auth.md
provenance lane via fixtures until implementation justifies more.

### Composite Prematurity

Risk: implementing a composite paid authenticated action before packet evidence
is stable creates a bundled authority path.

Mitigation: defer profile; require packet and hostile harness pass before
composite evaluation.
