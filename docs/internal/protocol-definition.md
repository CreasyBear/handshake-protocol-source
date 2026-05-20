# Protocol Definition

Last protocol definition audit: 2026-05-20.

This is the canonical protocol definition for this checkout.

Related canon:

- `docs/internal/protocol-kernel-architecture.md`: kernel architecture and schema map.
- `docs/internal/protocol-layman.md`: plain-English explanation of this definition.
- `docs/internal/protocol-notes.md`: compact implementation notes.

## Definition

Handshake is a protocol kernel for protected action control.

It turns a consequential autonomous action attempt into an exact,
catalog-bound, gateway-bound `ActionContract`; records a `PolicyDecision`; may
issue a one-use `Greenlight`; requires a pre-mutation `GatewayCheck`; and
records the result as `Receipt`, `Refusal`, `ProofGap`, isolation, or recovery
evidence.

## Primitive

Every consequential mutation attempt must be reduced to an exact, inspectable,
policy-evaluated, gateway-bound action contract before consequence.

The primitive is not:

- agent identity;
- tool availability;
- review;
- approval;
- tracing;
- sandboxing;
- hosted policy;
- downstream audit.

Those can support the primitive. They do not replace it.

## Authority Rule

Execution authority exists only when all of these are true:

1. A recorded runtime or generated-execution record produced the candidate.
2. The candidate matched a declared `ToolCapability`, `ActionType`,
   `GatewayRegistryEntry`, and `OperatingEnvelope`.
3. The candidate was canonicalized into an exact `ActionContract`.
4. Policy greenlit that exact contract.
5. The protected idempotency scope was not already bound to prior authority.
6. The `Greenlight` is unexpired, unconsumed, and has `maxUses: 1`.
7. No active `IsolationState` blocks policy or gateway execution.
8. Required protected-path posture is current and probe-backed.
9. The gateway owns or controls the mutation credential.
10. The gateway checks the exact greenlight before mutation.

If the gateway cannot block the mutation, the system is advisory, not
Handshake.

## Required Separation

- Vague intent is not an operating envelope.
- An operating envelope can bound attempts, not authorize mutations.
- Generated code is not an action contract.
- Runtime evidence is not gateway enforcement.
- Tool availability is not tool authorization.
- Catalog presence is not permission.
- A posture record is not installed protection unless current probes support it.
- A rendered review screen is not permission.
- A review decision is not authority unless policy turns it into a greenlight.
- A greenlight is not execution proof.
- A gateway check is the enforcement point before consequence.
- A receipt is not downstream business success.
- Missing or ambiguous evidence is a proof gap, not success.

## Canonical State Path

```text
runtime execution evidence
-> generated execution graph
-> finalized tool-call draft when generated execution supplies parameters
-> intent compilation record
-> candidate action
-> action contract
-> policy decision
-> greenlight, refusal, review, halt, or quarantine
-> gateway check attempt
-> mutation attempt, refusal, receipt, or proof gap
-> operation lifecycle reconciliation
-> recovery or isolation when required
```

## Protocol Objects

Core objects:

- `ToolCapability`
- `ActionType`
- `GatewayRegistryEntry`
- `OperatingEnvelope`
- `RuntimeExecution`
- `GeneratedExecutionGraph`
- `ToolCallDraft`
- `IntentCompilationRecord`
- `CandidateAction`
- `ActionContract`
- `PolicyDecision`
- `IdempotencyLedgerEntry`
- `BypassProbe`
- `ReviewArtifactRecord`
- `ReviewDecision`
- `Greenlight`
- `GatewayCheckAttempt`
- `MutationAttempt`
- `Receipt`
- `Refusal`
- `ProofGap`
- `IsolationState`
- `RecoveryRecommendation`

The schema map and owned source files are defined in
`docs/internal/protocol-kernel-architecture.md`.

## Gateway Policy

Gateway policy is set before action time by the owner of the protected surface.
The gateway policy version is pinned into the contract and greenlight path, then
checked again by the gateway immediately before mutation.

Policy drift narrows authority. It must not broaden a greenlight after it was
issued.

## Deny Events

Denial is a protocol outcome, not an exception to hide.

Refusal can happen during:

- intent compilation;
- action contract proposal;
- policy evaluation;
- review;
- gateway check;
- receipt export;
- recovery;
- transition conflict handling.

A refusal must record phase, relevant object refs, reason code, whether
authority was created, and whether mutation was attempted. Mutation attempted
must be false for `Refusal`.

## Authority Certificate

`AuthorityCertificate` is terminal evidence, not execution authority. It may be
minted only after a receipt, durable refusal, proof gap, or replay refusal
exists. It signs canonical `signingInput`, which includes the redacted
transaction envelope, envelope digest, artifact digest list, and verification
policy plus visible certificate annotations. It excludes only signatures and
the derived signing-input digest.

`verifyAuthorityCertificate()` verifies the exported certificate with pinned
trust material and no protocol-store dependency. Production verification rejects
HMAC and propose-time `contractSignature` as portable authority.

## Conflict Semantics

Conflicts narrow authority.

- Candidate cannot be matched to catalog, envelope, or gateway: refuse before
  contract authority exists.
- Policy and gateway posture disagree: refuse or require review; do not
  greenlight.
- Greenlight was already consumed: replay refusal; do not mutate.
- Idempotency key is already bound to the same protected action scope: refuse
  fresh authority; same params may point to prior evidence, different params
  refuse.
- Gateway policy drift is incompatible: gateway refusal; do not mutate.
- Downstream finality is missing or contradictory: record `ProofGap`.
- Recovery needs follow-up mutation: require a new `ActionContract`.
- Divergence affects future authority: record `IsolationState` or breaker
  decision.

Conflict resolution must never silently convert uncertainty into permission.

## Boundary Claim

Handshake protects only installed protected paths.

A path is protected only when the gateway owns or controls the mutation
credential, checks the exact one-use greenlight before consequence, records the
check, and refuses drift, replay, missing posture, or active isolation.

Outside that installed path, Handshake may collect evidence, but it does not
have enforcement.

The current implementation proves this boundary locally with `x402_payment.exact`
as one proof profile, reference gateways, memory/D1 stores, redacted projections,
local payment D1/HTTP harness coverage, hostile local payment bypass/custody
probes, package-install supply-chain regression binding, internal non-authority
representation contracts, and public runtime ingress surfaces for local x402
payment and package-install dispatch boundaries. It enforces x402 per-call spend
only. It does not prove live provider custody, broad MCP/CLI/browser/shell/network
runtime interception, hosted operation, external package-material verification,
x402 spend-window ledger enforcement, cross-org AuthorityCertificate trust,
live JWKS/revocation, or hosted verifier operation. The local source foundation
does include AuthorityCertificate minting and offline pinned-key verification.

## Extension Boundary

Self-hosted loops, hosted operation, and bilateral ecosystem agreements may add
installation, policy management, receipt retention, recovery workflows, or
coordination across parties.

They must not change the primitive:

```text
one consequential mutation attempt
-> one exact contract
-> one policy decision
-> one-use gateway-bound greenlight
-> gateway check before mutation
-> receipt, refusal, proof gap, isolation, or recovery evidence
```
