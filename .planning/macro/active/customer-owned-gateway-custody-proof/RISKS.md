# Risks

## P0

| Risk | Failure Mode | Mitigation |
| --- | --- | --- |
| Packet theatre | A packet is emitted as projection/install text but policy and gateway do not require it before credential use. | Bind packet id/digest into credential-backed contract/policy/gateway checks; cut custody claims if enforcement is absent. |
| Stale custody after greenlight | Credential ref, resolver version, lease, provider registry, posture, or packet drifts after policy but before mutation. | Gateway re-reads current credential ref, posture, packet, isolation, resolver/lease/provider state, and policy drift before mutation. |
| Agent-exposed signer path | x402/auth-style adapters leave direct SDK signer, private key env, raw signature header, bearer passthrough, MCP/browser/network sibling, or retry loop outside the gateway. | Required bypass probes and raw sibling posture must fail closed before `gateway_checked` posture can satisfy policy. |
| Redaction leak | Projection exposes private keys, bearer tokens, provider secret paths, `PaymentPayload`, `PAYMENT-SIGNATURE`, mutation credentials, payment payloads, authorization headers, claim tokens, JWTs, or PII. | Allowlisted projection fields, denylist/fuzz tests, redaction-failure refusal/proof gap. |
| Payment custody drift | Work introduces Handshake-held wallets, balances, payment credentials, settlement, facilitator/seller operation, or payment management. | Non-goals, claim guards, and x402 limited to one buyer-side exact protected action per call. |

## P1

| Risk | Failure Mode | Mitigation |
| --- | --- | --- |
| x402 overfit | Protocol fields become wallet/payment/x402-specific. | Keep packet provider-neutral; x402 maps into generic refs/digests/statuses. |
| Fixture laundering | `fixture_gateway_held` passes local tests and later docs imply provider/customer custody. | Add `custodyClaimLevel`; claim guards reject provider/customer custody from fixtures. |
| Weak drift detection | Null provider registry or resolver digests allow stale custody to pass. | Custody-backed paths require digest/version/lease presence or become `proof_gap`/unsafe. |
| Resolver failure misclassified | Credential resolution failure becomes downstream uncertainty after mutation. | Resolver failure must refuse before protected mutation; no mutation attempt on pre-gate custody failure. |
| auth.md scope creep | Credential/ref lifecycle lessons turn into auth-provider/OAuth claims. | Import lifecycle isolation/redaction only; cut identity-provider claims. |
| Review laundering | UI says "gateway owned" while contract/packet is stale or weaker. | Review/projection must bind exact contract digest, policy input/greenlight, packet digest, and uncertainty/reason codes. |
| Runtime/MCP authority drift | Proposal surfaces imply enforcement or gain signer/gateway authority. | Runtime/MCP/CLI/SDK remain proposal/evidence/read only; import/surface tests enforce this. |

## P2

| Risk | Failure Mode | Mitigation |
| --- | --- | --- |
| Duplicate state | Packet duplicates credential ref, protected-path posture, and resolution evidence without ownership clarity. | Packet owns aggregation/digest binding only; existing primitives keep their meanings. |
| Hidden storage blast radius | New object needs registry, public schema, D1/memory store, migrations, or indexes not planned. | Phase 0 source map verification before coding. |
| Adoption ceremony | Integrators must manually assemble install evidence, refs, probes, posture, policy, gateway, resolution, and projection. | Add activation helper later, but helper only sequences source-owned transitions. |
| `.planning` becomes canon | Scratch terms leak into source exports, package scripts, CI, or README claims. | Canonical docs change only after source/tests; no planning labels in public source. |

## Antipatterns

- `custodyProof: true` without packet digest and policy/gateway checks.
- wallet profile metadata treated as customer-owned custody proof.
- recording credential resolution before a passed gateway check.
- one greenlight authorizing multiple mutations.
- fixture custody described as live provider/customer custody.
- provider-specific fields such as `vaultPath`, `secretPath`, `walletPrivateKey`, `PaymentPayload`, or `PAYMENT-SIGNATURE` in protocol records or projections.
- regex-only redaction for live provider custody.
- docs claiming hosted trust, marketplace readiness, clearing-house readiness, or broad runtime control.
