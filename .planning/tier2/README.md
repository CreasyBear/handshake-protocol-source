# Tier 2 Protocol Usability And Clearing-House Research Packet

Status: planning scratch, revised 2026-05-20.

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
-> terminal AuthorityCertificate (TARGET — K-D9–K-D12)
-> hosted evidence navigation and policy operation
-> cross-org verification and ecosystem clearing
```

Doctrine realignment (autoreason pass_02): [tiered-product-doctrine.md](../strategy/tiered-product-doctrine.md) v0.3.0 — protocol remains Layer 8 authority proof; adapter profiles do not become the product center.

Crypto / signing (autoreason pass_03): [authority-certificate-foundation.md](../strategy/authority-certificate-foundation.md) — Ed25519 over `signingInput`; docs 05–09 aligned; implement K-D9-K-D12 in `src/` before canon promotion. Docs **06–09** incorporation is complete when four-terminal mint scope and adapter-proof-profile language are consistent across the suite.

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
- `surfaces/`: Tier 2 activation **constitution** (P1–P12 → MCP/CLI rules) plus
  **doc 10 Agent Proof Slice** (Tier 1 product shapes, hostile traces, `prove:*` gates).
  Not implementation; anchors doc 05; defers to runtime ingress until APS green.

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

## Smallest next mechanism

Define the minimal local `AgentTransactionEnvelope` projection over existing
receipt/evidence projection records:

```text
participants
authority refs
protected action refs
gateway check refs
outcome refs
proof-gap/recovery refs
receipt/export digest
```

It must be read-only, redacted, and unable to mint policy decisions,
greenlights, gateway checks, receipts, or mutations.
