# Agent Review: A2A Negotiation

Status: PROFILE_REQUIRED_BEFORE_AGENT_EXECUTION
Runtime: multi
Protected-action overlay: required

## Invariant At Stake

Agents may negotiate, propose, and inspect evidence. They must not inherit raw
mutation, signer, payment, gateway, or cross-party authority from the
negotiation.

## Execution Shape

```text
buyer agent
-> receives seller offer
-> proposes acceptance evidence
-> Handshake records linked agreement
-> buyer agent proposes x402_payment.exact CandidateAction
-> Handshake binds obligation to ActionContract
-> policy/gateway decide consequence
```

Seller agent may present terms and read terminal evidence. It cannot authorize
buyer spend. Buyer agent cannot authorize seller-side mutation.

## Agent Plan Contract

The implementation plan must name:

- runtime profile: Codex first, multi-host later;
- instruction sources: `AGENTS.md`, meta-meta goal, macro plan, source anchors;
- tool contract: read, propose, fixture-run, test only until gateway slice;
- write scopes: negotiation area, tests, examples, docs;
- stop conditions: authority overclaim, raw signer exposure, cross-org trust
  dependency, unsupported broad export;
- evals: no-authority acceptance, binding mismatch, replay, proof gap;
- handoff: one fresh-agent packet per slice.

## P0/P1 Findings

P0: Without a runtime profile and fixture packet, a coding agent may implement
generic negotiation instead of protected-action clearing.

P0: Any plan that asks the agent to call raw x402 payment paths outside a
gateway-protected wrapper must stop.

P1: If the agent can dynamically construct action types or gateways from
negotiation text, policy must refuse until catalog-bound.

P1: Parallel agents need disjoint write scopes because protocol schema,
object registry, kernel facade, tests, and examples are tightly coupled.

## Suitability Matrix

| Runtime | Posture | Reason |
| --- | --- | --- |
| Codex | `PROFILE_REQUIRED` | Can execute slices with file gates, but needs exact handoff. |
| MCP | `PROTECTED_ACTION_OVERLAY_REQUIRED` | Proposal/evidence only, no authority. |
| x402 | `PROTECTED_ACTION_OVERLAY_REQUIRED` | Payment material must stay behind gateway. |
| Multi-host | `BLOCKED_BY_TRUST_MODEL` | Cross-org trust and host parity are not proven. |

## Agent Recommendation

Proceed to phase planning, not autonomous implementation. First produce
`A2A-001` phase plan with source anchors, exact files, tests, and stop
conditions.
