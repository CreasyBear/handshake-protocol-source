# Protocol Notes

Last protocol audit: 2026-05-20.

For the canonical definition, see `docs/internal/protocol-definition.md`. For the architecture and schema map, see `docs/internal/protocol-kernel-architecture.md`. For the plain-English translation, see `docs/internal/protocol-layman.md`. This file keeps implementation-facing protocol notes compact.

## Primitive

Every consequential mutation attempt must be reduced to an exact, inspectable, policy-evaluated, gateway-bound action contract before consequence.

## Required Separation

- Vague intent is not an operating envelope.
- Generated code is not an action contract.
- Tool availability is not tool authorization.
- A rendered review screen is not permission.
- A greenlight is not execution proof.
- A receipt is not downstream business success.
- Runtime evidence is not gateway enforcement.

## State Path

```text
runtime execution evidence
-> generated execution graph
-> finalized tool-call draft when generated execution supplies parameters
-> intent compilation record
-> candidate action
-> action contract
-> policy decision
-> greenlight or refusal
-> gateway check attempt
-> mutation attempt, refusal, receipt, or proof gap
```

## System Design Posture

Use case: reduce generated engineering-agent execution into exact protected-action authority decisions.

Constraints and assumptions:

- agents may branch, retry, loop, call sibling tools, or generate stale review surfaces;
- gateway checks are the final pre-mutation enforcement point;
- receipt evidence reconstructs protocol events, not downstream business success;
- storage may report conflicts or ambiguous commits, so transitions must be replay-safe;
- installed protected paths are narrow until a real gateway owns mutation credentials.

Core components:

- protocol kernel facade;
- protocol areas for contracts, policy, gateway gate, lifecycle, recovery, and evidence;
- append-only event/record store port;
- HTTP transport/admission surface;
- install proposal compiler;
- runtime proposal helpers;
- reference gateway adapters;
- D1 and memory stores.

Failure and scale posture:

- back pressure is expressed as refusal, isolation, replay refusal, or proof gap rather than hidden retries;
- consistency is preferred over availability for authority-bearing transitions;
- D1 is durable reconstruction truth in the reference implementation;
- KV is cache posture only and cannot become authority;
- future extraction must preserve exact contract binding, one-use greenlights, and gateway-side enforcement.

## Evidence Rules

Receipts must distinguish:

- proposal evidence;
- policy decision evidence;
- gateway check evidence;
- mutation attempt evidence;
- downstream finality evidence;
- proof gaps.

Missing or ambiguous evidence is recorded explicitly as a `ProofGap`.

## Implementation Map

- `src/protocol/foundation`: canonicalization, ids, errors, reason codes, core schemas, transition guards.
- `src/protocol/public`: public schema and input aggregators.
- `src/protocol/events`: stream event schemas, digest chains, record commits.
- `src/protocol/context`: transition request context schemas and records.
- `src/protocol/navigation`: protocol transition metadata.
- `src/protocol/evidence-projections`: redacted diagnostic read projections.
- `src/protocol/store`: store port.
- `src/protocol/areas`: owned primitives such as action contracts, authority certificates, policy/greenlight, gateway gate, proof gaps, recovery, review binding, runtime evidence, and object registry.
- `src/install`: generic install proposal contracts used by adapter packs to compile protected paths into kernel records.

Protocol areas may depend on foundation/events/context/store and other area public indexes. They must not import HTTP, storage implementations, runtime wrappers, SDK code, or adapter fixtures.

## Protocol Areas

- `catalog-envelope`: declared tool, action, gateway, and envelope records; catalog presence is not authorization.
- `runtime-evidence`: generated execution evidence; evidence can propose but cannot authorize.
- `generated-execution-graph`: normalized generated-code/spec evidence and action candidates.
- `tool-call-draft`: opened, streaming, finalized, invalid, or abandoned generated tool-call input state.
- `bypass-probe`: protected-path custody, bypass, drift, token-passthrough, and failure-closed evidence.
- `intent-compilation`: candidate action boundary, assumptions, dependencies, uncertainty, and refusal inputs.
- `action-contract`: exact proposed commitment before authority.
- `authority-certificate`: terminal signed evidence and offline pinned-key verification; it cannot mint policy, greenlight, gateway, or mutation authority.
- `policy-greenlight`: decision, idempotency reservation, refusal, and one-use greenlight issuance.
- `gateway-gate`: final pre-mutation verification of exact greenlight binding.
- `idempotency-ledger`: duplicate-authority scope records across contracts.
- `operation-lifecycle`: reconciliation of protected-surface outcomes without pretending downstream certainty.
- `refusal`: portable refusal evidence format; it does not create authority or mutation proof.
- `review-binding`: review artifacts and decisions bound to exact contract and policy records.
- `protected-path-posture`: installed, bypass, and drift posture for a protected path.
- `isolation-breaker`: persistent halt or isolation state checked before future decisions and gates.
- `proof-gap`: explicit missing, expired, contradictory, or unavailable evidence.
- `recovery`: follow-up recommendations and terminal conflict handling.
- `receipt-export`: reconstructable export of the chain, not proof of business success.
- `object-registry`: protocol object metadata, ID selectors, export posture, and raw-read posture.

## Current Proof Lanes

- x402 payment is a local proof profile. Package install, repo write, and
  preview deploy remain reference gateway fixtures. No adapter family defines
  the protocol shape.
- Package install binds gateway-observed package manager, registry,
  manifest/lockfile, install flags, lifecycle-script policy, and resolved
  material evidence fields before mutation. This is local parameter binding, not
  external package-material attestation.
- Payment-specific protected-action packs live under adapter/plugin lanes, not protocol areas.
- The payment adapter has a local D1/HTTP establishment path, runtime ingress,
  and local hostile bypass/custody probe coverage under experimental/reference
  adapter surfaces. It enforces per-call spend only; session/day/review windows
  are metadata until a ledger exists. This is not live provider custody.
- Protected mutation adapter conformance lives under the `./conformance` package subpath.
- The `./runtime` package subpath exposes runtime ingress for local x402 payment
  and package-install dispatch boundaries. It emits runtime evidence, graph evidence,
  finalized tool-call drafts, compilations, contracts, and refusals; it does not
  issue policy decisions, greenlights, gateway checks, receipts, or mutations.
- Codemode multi-action, x402 payment ingress, and package-install runtime paths prove generated-execution proposal behavior.
- Internal protected-action representation contracts prove Metadata, Challenge,
  Request, and EvidenceProjection shapes cannot create authority. Public
  MCP/CLI/browser/shell/network interception remains future integration work.
- HTTP and SDK evidence reads expose redacted contract, receipt timeline, generated graph, and install-health projections.
- D1 and memory stores prove reconstruction and atomicity mechanics for the reference implementation.

These are proof lanes, not provider-side enforcement claims.

## AuthorityCertificate

`AuthorityCertificate` and `verifyAuthorityCertificate()` are landed source
objects for the local foundation kernel. The certificate is a Layer 8 terminal proof
object emitted only after receipt, durable refusal, proof gap, or replay
refusal. Verification rebuilds canonical `signingInput`, checks envelope digest
binding, verifies pinned Ed25519 signer roles, rejects production
HMAC/propose-time signatures as portable trust, and works without the protocol
store.

This is still local foundation trust. Cross-org JWKS, revocation, hosted verify
APIs, marketplace certification, and provider custody remain outside this local foundation.

## Pressure Review Notes

The current kernel is mostly clean under local foundation pressure, but three
debt edges remain intentionally visible:

- Runtime ingress is limited to local x402 payment and package-install dispatch
  families despite being the first public runtime subpath. Do not generalize the
  claim to broad MCP/browser/shell/package/network interception until each host
  path uses the same evidence shape.
- Runtime evidence is caller-observed evidence. It can refuse ambiguous or
  bypass-shaped traces, but it cannot prove that every raw sibling path in a
  host was actually intercepted.
- Frustration risk is highest at the adapter boundary: callers must supply a
  normalized dispatch block, graph closure, and evidence references. A future
  SDK/shim should reduce this ceremony without moving authority into the
  runtime.

## Raw Read Boundary

Raw HTTP record reads must consult object registry `rawReadPosture`.
`internal_only` objects, including stream events, idempotency ledger entries,
bypass probes, and tool-call drafts, are not exposed through the generic record
route. Reconstruction that needs internal records must use store-level test
helpers or purpose-built redacted projections.

## Naming Rules

Keep protocol object names exact: `ActionContract`, `PolicyDecision`, `Greenlight`, `GatewayCheck`, `Receipt`, `Refusal`, `ProofGap`, and `IsolationState`.

Avoid names that imply authority without mechanism. A function may observe, derive, propose, record, consume, or reconcile. It must not imply safety, trust, proof, or security that the gateway has not enforced.
