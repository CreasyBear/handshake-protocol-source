# Non-Claims And Theatre

Status: Canonical public alpha
Version: v0.2.1
Audience: Product, engineering, security, runtime builders, gateway owners
Implementation status: Product doctrine; enforced by doc review and protocol tests
Canonical owner: Product owner
Last reviewed: 2026-05-18

## Invariant At Stake

Handshake must not imply more control than the gateway-checked protocol actually provides.

## Claims We Can Make In v0.2

- Handshake reduces consequential agent action attempts into exact action contracts.
- Handshake evaluates exact contracts against envelopes and isolation state.
- Handshake issues one-use greenlights or records refusals.
- Handshake requires the gateway check before mutation in the protocol loop.
- Handshake records receipts and proof gaps so the chain can be reconstructed.

## Claims We Cannot Make In v0.2

- Installing a runtime plugin alone controls gateway-owned consequence.
- A rendered plan is permission.
- A human review of a summary is the same as binding to an exact contract digest.
- A runtime trace is execution proof.
- A receipt proves downstream business success.
- A missing evidence state can be treated as success.
- A greenlight can be reused.
- Handshake observes every terminal, browser, network, MCP, generated-code, or gateway path.
- Handshake controls a gateway while the agent still has raw mutation credentials for that gateway.
- A broad management UI is the product.
- The old repo's strategy docs are canonical for v0.2.
- Passing a fixture runner proves production gateway enforcement.

## Theatre Tests

If the rendered UI says one thing and the action contract says another, this is review theatre.

If generated code can call an unwrapped consequential tool, the generated code escaped the contract boundary.

If the agent keeps raw gateway credentials while Handshake claims control, this is advisory theatre.

If a human decision binds to a plan but not the exact gateway mutation, the decision is theatre.

If the gateway does not enforce the greenlight, this is advisory, not Handshake.

If one greenlight can authorize multiple mutations, this is ambient authority wearing a badge.

If a receipt cannot distinguish gateway check from downstream execution, this is evidence theatre.

If the compiler turns vague intent into excessive scope, the compiler overreached the principal.

If the chain cannot be reconstructed later, this is not auditable.

If a fixture runner pass is presented as production gateway enforcement, this is conformance theatre.

Active next mechanism: audit every claim in docs and UI against the Handshake CLI/MCP protected action surface plus its installed gateway adapters. A valid claim must name the exact protocol object, gateway check check, credential-owning adapter, or proof gap it depends on. The GitHub App-backed `repo_write_gateway` is the first gateway adapter, not the whole product. Proof packets and fixture runners are evidence mechanisms only, not authority claims.
