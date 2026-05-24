# Decisions

## Accepted

### D1 - Add A Custody Proof Packet As Evidence

Add `GatewayCustodyProofPacket` or the final source-owned equivalent under `src/protocol/areas/credential-custody/`.

Justification: existing primitives are necessary but scattered. A buyer-readable customer-owned custody claim needs a digest-bound object that references install evidence, credential ref, protected-path posture, bypass probes, resolver/lease/provider posture, drift status, redaction status, and claim level.

Boundary: the packet creates no permission. It cannot replace policy, greenlight, gateway check, mutation evidence, credential resolution evidence, or downstream reconciliation.

### D2 - Extend Existing Authority Bindings

Extend `GatewayCredentialRef`, `ProtectedPathPosture`, bypass probe inputs, policy input, gateway check evidence, and projections only as needed to bind the packet id/digest and drift status.

Justification: a new custody authority plane would violate Tier 1 protocol meaning. The gateway check remains the enforcement point before consequence.

### D3 - Require Packet First For Credential-Backed Protected Paths

Require custody packet binding first for credential-backed protected paths such as x402 signer custody. Do not make custody proof mandatory for every `gateway_checked` path in this slice.

Justification: this avoids changing Tier 1 protocol meaning while proving the stronger enforcement story where mutation credential custody is the issue.

### D4 - x402 Uses The Generic Packet

x402 install/proposal/gateway paths should bind signer custody through generic `GatewayCredentialRef` plus custody packet digest.

Justification: x402 is the first wedge but not the protocol. Payment-specific signer fields must not become generic protocol semantics.

### D5 - Fixture Custody Is Local-Only Evidence

Introduce or preserve an explicit claim level such as `local_fixture`, `customer_gateway_evidence`, `provider_gateway_evidence`, and `proof_gap`.

Justification: local fixture keys can test mechanics but cannot prove live customer/provider custody.

### D6 - Projection Is Redacted And Reconstruction-Oriented

The buyer-facing artifact is a redacted custody projection over refs/digests/statuses, not raw packet browsing.

Justification: custody proof must be auditable without exposing signer material, secret paths, payment payloads, bearer tokens, or mutation credentials.

## Rejected

### R1 - Only Add More Fields To Existing Records

Rejected because it leaves custody proof distributed across credential refs, posture, probes, resolution evidence, and projections. That makes customer-owned custody too easy to overclaim and hard to reconstruct.

### R2 - Add A New Custody Permission Or Greenlight

Rejected because it creates a second authority plane. The packet is evidence, not permission.

### R3 - Make x402 Payment Management The Slice

Rejected because the product primitive is protected-action custody proof. Balances, settlement, payment management, seller/facilitator operation, and aggregate spend ledgers are outside scope.

### R4 - Claim Live Provider Custody From Fixtures

Rejected because fixture custody is local/reference evidence only. Live provider/customer custody requires source-owned packet behavior, negative tests, redacted projections, and later official source verification for provider-specific implementation.

### R5 - Move Enforcement Into Runtime, MCP, CLI, Or SDK Convenience

Rejected because runtime-facing surfaces can propose and read evidence but cannot own policy decisions, greenlights, gateway checks, credential resolution, receipts, or mutation authority.

## Deferred

### F1 - Exact Public Object Registration Pattern

Deferred until Phase 0 verifies object registry, public schemas, kernel facade, projection schemas, storage, and fixture ownership.

### F2 - Exact Gateway Check Artifact Shape

Deferred until schema ownership is verified. Preferred shape is explicit packet refs/digests seen on gateway evidence. Fallback is only acceptable if posture digest deterministically includes packet digest and drift state, with tests proving it.

### F3 - Provider-Specific Custody Implementations

Deferred until official source verification for named vault, KMS, wallet, x402 provider, JWKS, Cloudflare, legal, or payment-regulatory details.

### F4 - Activation Helper Or Buyer Quickstart

Deferred until the packet, policy/gateway binding, x402 integration, and projection exist. A helper may sequence transitions but cannot move authority into runtime/MCP/SDK.

## User-Owned

No P1 user-owned decision blocks the next implementation slice. The plan chooses the packet approach.

User or maintainer decision may be needed later if Phase 0 reveals a wider public API/storage migration blast radius than expected.
