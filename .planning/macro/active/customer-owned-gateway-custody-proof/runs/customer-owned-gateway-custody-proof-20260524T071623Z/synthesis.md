# Chair Synthesis

## Invariant At Stake

A protected action is real only when the mutation credential remains behind a customer/provider gateway boundary, the exact one-use greenlight is checked immediately before consequence, unsafe or drifted custody refuses before mutation, and the surviving evidence is redacted but reconstructable.

## Synthesis Decision

The final plan chooses a new source-owned `GatewayCustodyProofPacket` as evidence, not authority.

This is not a new permission primitive. The packet is subordinate to existing `GatewayCredentialRef`, `ProtectedPathPosture`, bypass probes, policy evaluation, gateway check, `CredentialResolutionEvidence`, and redacted projections.

Reasoning:

- Extending only existing fields keeps the custody story scattered and too easy to overclaim.
- A new top-level authority primitive would violate Tier 1 protocol meaning.
- A packet under credential custody can bind install evidence, credential ref, posture, probes, drift, redaction, and claim level while policy and gateway remain the enforcement points.

## Perspective Reconciliation

- Strategy emphasized that Handshake is protected actions for automated decision making, x402 is the first wedge, and fixture custody must not become customer/provider custody.
- Architecture emphasized that existing primitives are strong, but a source-owned packet is needed to make custody proof digest-bound and reconstructable.
- Execution emphasized test-first sequencing and warned that x402/auth.md adapter work must wait until packet binding semantics are stable.
- Risk emphasized that a packet not consumed by policy and gateway is advisory, not Handshake.
- Adoption emphasized the buyer-readable projection: the buyer should not infer custody from scattered protocol records.

The plan therefore sequences source map verification, failing tests, packet schema/transition, policy/gateway binding, x402 integration, auth.md parity, redacted projection, claim guards, and closeout gates.

## Preserved Boundaries

- Handshake does not hold wallets, private keys, bearer tokens, payment credentials, balances, settlement state, or payment-management state.
- x402 remains one buyer-side exact protected action per call and does not define the protocol.
- customer-owned gateway custody remains the enforcement model.
- Tier 1 meaning remains exact contract, policy decision, one-use greenlight, gateway check, receipt/refusal/proof gap, and isolation.
- Provider-specific vault/KMS/wallet/x402 provider details require later official source verification before implementation.
- Fixture/local/reference custody is regression evidence only and cannot support live customer/provider custody claims.

## Blocked Checks

- Did not inspect companion implementation files outside the allowed planning packet, including protocol public aggregation, object registry, kernel facade, projection schemas, storage/migrations, fixtures, or adapter exports.
- Did not browse official provider, vault, KMS, wallet, x402 provider, JWKS, Cloudflare, npm, MCP Registry, legal, or payment-regulatory sources.
- Did not run tests because this was a planning-only synthesis with a hard write boundary.
- Did not read archive macro runs.
- Did not stage or commit.

## Output Files

- `.planning/macro/active/customer-owned-gateway-custody-proof/PLAN.md`
- `.planning/macro/active/customer-owned-gateway-custody-proof/CONTEXT.md`
- `.planning/macro/active/customer-owned-gateway-custody-proof/ASSUMPTIONS.md`
- `.planning/macro/active/customer-owned-gateway-custody-proof/DECISIONS.md`
- `.planning/macro/active/customer-owned-gateway-custody-proof/RISKS.md`
- `.planning/macro/active/customer-owned-gateway-custody-proof/VALIDATION.md`
- `.planning/macro/active/customer-owned-gateway-custody-proof/TASKS.jsonl`
