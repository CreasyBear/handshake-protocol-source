# Tier 2 Protocol Usability And Clearing-House Research Packet

Status: planning scratch, revised 2026-05-21 after gsd-map-codebase refresh.

This packet records the current Tier 2/Tier 3 architecture thinking around
protocol-facing usability and the longer clearing-house thesis. It is scratch,
not repo canon.

The important correction is that no adapter family defines the protocol shape.
`x402_payment.exact`, preview deploy, package install, and repo write are proof
profiles or reference protected action families. The product center remains a
protected action path for automated decision-making:

```text
observed consequential attempt
-> exact action contract
-> policy decision
-> one-use gateway-bound greenlight
-> gateway check before mutation
-> receipt, refusal, proof gap, isolation, or recovery evidence
```

The clearing-house thesis extends that same loop into a future evidence layer:

```text
protected action path
-> gateway-checked authority evidence
-> local terminal AuthorityCertificate evidence
-> hosted evidence navigation and policy operation
-> cross-org verification and ecosystem clearing
```

Doctrine realignment (autoreason pass_02): [tiered-product-doctrine.md](../strategy/tiered-product-doctrine.md) v0.3.1 — protocol remains Layer 8 authority proof; adapter profiles do not become the product center.

Crypto / signing (autoreason pass_03): [authority-certificate-foundation.md](../strategy/authority-certificate-foundation.md) — Ed25519 over `signingInput`; local `AuthorityCertificate` minting and offline pinned-key verification are now landed source behavior. Older docs **06–09** target language is historical planning context only. Do not reschedule K-D9-K-D12 as unfinished local foundation work, and do not convert local certificate verification into hosted trust, provider custody, marketplace certification, or cross-org clearing.

Files under `.planning/` are scratch. They are not active repo canon.

## Invariant at stake

Tier 2 must prove the same authority chain that future hosted and
provider-integrated Handshake must preserve:

```text
generated execution evidence
-> exact action contract
-> policy decision
-> one-use gateway-bound greenlight
-> gateway check before mutation
-> receipt, refusal, proof gap, isolation, or recovery evidence
```

If Tier 2 only proves a local wrapper, it does not create a credible path to
Tier 3 or Tier 4.

## Packet

- `00-canon-alignment.md`: early canon alignment and non-claim boundaries.
- `01-source-study.md`: early source study; useful but x402-centered.
- `02-users-and-tier-pathway.md`: early Tier 2 -> Tier 3 -> Tier 4 pathway.
- `03-x402-architecture.md`: x402 adapter-family study; treat as example only.
- `04-spec-and-doubt-review.md`: early adversarial review and concerns.
- `05-t2-t3-cli-mcp-sdk-architecture-map.md`: self-hosted/hosted activation
  map across CLI, MCP, SDK, gateway, and evidence surfaces.
- `06-policy-agent-management-interface-map.md`: current consolidated map for
  protocol-facing metadata, challenges, requests, and evidence projections.
- `07-agentic-economy-clearing-house-research.md`: current consolidated
  clearing-house research and kernel-now/kernel-needed map.
- `surfaces/`: Tier 2 activation **constitution** (P1–P12 -> MCP/CLI rules) plus
  **doc 10 Agent Proof Slice** (Tier 2 activation proof over the landed authority
  kernel, with x402 as the worked proof profile, hostile traces, and the current
  product-level regression). Not implementation; preserves runtime
  ingress as proposal evidence and keeps policy/gateway authority out of the
  agent surface.

## Current Kernel

The current source kernel already supports the hard local primitive:

```text
RuntimeExecution / GeneratedExecutionGraph / ToolCallDraft
-> IntentCompilationRecord / CandidateAction
-> ActionContract
-> PolicyDecision
-> one-use Greenlight or Refusal
-> GatewayCheck
-> MutationAttempt / Receipt / Refusal / ProofGap
-> reconciliation, recovery, isolation, and redacted evidence projections
```

That is enough to prove local authority mechanics. It is not enough to claim a
clearing house.

## What The Kernel Needs Next For The Vision

The next required layer is not a new authority primitive. It is a projection and
usability layer that preserves the existing primitive:

- `ProtectedActionMetadata`: what an automated client may propose, not
  permission.
- `ProtectedActionChallenge`: structured refusal/proof-gap navigation, not
  negotiation.
- `ProtectedActionRequest`: an external proposal shape that compiles into
  runtime evidence and candidate action.
- `AgentTransactionEnvelope`: a redacted evidence projection/export, not
  authority.
- Generic protected-path health and receipt timeline across action families, not
  package-install-only diagnostics.
- Real runtime adapters, real bypass probes, and customer/provider gateway
  custody before installed-path claims.
- Hosted policy management, retention, search, alerts, audit exports, and
  reader authorization only in Tier 3.
- Cross-org verification, conformance marks, external verifier signatures, and
  ecosystem clearing only in Tier 4.

## Current APS proof

`test/product/agent-proof-slice.test.ts` now proves that Tier 2 activation can
sit on the existing adapter framework without adding a protocol primitive:

```text
generated runtime dispatch
-> adapter-specific proposal helper
-> generic kernel authority chain
-> adapter-owned gateway check
-> receipt, refusal, or proof gap
-> redacted agent transaction envelope
-> terminal AuthorityCertificate
```

x402 is the worked proof profile; package install is the non-x402 parity check.
The envelope is read-only, redacted, and unable to mint policy decisions,
greenlights, gateway checks, receipts, exports, certificates, or mutations.
The x402 lane is the official buyer-side `exact` path only: gateway-held
`PaymentPayload` / `PAYMENT-SIGNATURE` creation after `VerifiedGatewayCheck`,
with per-call spend authority and explicit cut lines around hosted/provider
custody, facilitator/seller operation, spend-window ledgers, certification, and
cross-org trust.

## Smallest next mechanism

Wrap the product proof in a first-protected-action walkthrough that shows the
same evidence refs without introducing CLI/MCP/hosted clearing-house surface
area.
