# Non-Claims And Theatre

Status: Canonical public alpha
Version: v0.2.4
Audience: Product, engineering, security, runtime builders, gateway owners
Implementation status: Product doctrine; enforced by doc review and protocol tests
Canonical owner: Product owner
Last reviewed: 2026-05-19

## Invariant At Stake

Handshake must not imply more control than the gateway-checked protocol actually provides.

## Claims We Can Make In v0.2

- Handshake reduces consequential agent action attempts into exact action contracts.
- Handshake evaluates exact contracts against envelopes and isolation state.
- Handshake issues one-use greenlights or records refusals.
- Handshake requires the gateway check before mutation in the protocol loop.
- Handshake records generated execution-block evidence for Code Mode-style runtimes, including loop/retry/branch posture, dynamic tool construction, and unobserved regions.
- Handshake can record kernel-level `GeneratedExecutionGraph` evidence for shell/codemode blocks and refuse candidate extraction when the whole generated block is missing, unsupported, truncated, raw-material-bearing, bypass-risk, fail-open, or only observer evidence.
- Handshake can require fresh `gateway_checked` protected-path posture before policy and gateway checks proceed.
- Handshake binds review approval to a rendered artifact whose contract, policy-input, uncertainty, and artifact digests match durable records.
- Handshake records receipts and proof gaps so the chain can be reconstructed.

## Claims We Cannot Make In v0.2

- Installing a runtime plugin alone controls gateway-owned consequence.
- A rendered plan is permission.
- A human review of a summary is the same as binding to an exact contract digest.
- A runtime trace is execution proof.
- A `RuntimeExecutionRecord` is permission.
- A `GeneratedExecutionGraph` is permission.
- A clean `GeneratedExecutionGraph` is an `ActionContract`.
- A command-risk classifier allow/no-match result is authorization.
- A `ProtectedPathPosture` is a gateway check.
- A `ReviewArtifactRecord` is review approval.
- A receipt proves downstream business success.
- A missing evidence state can be treated as success.
- A greenlight can be reused.
- A transition bearer token is principal identity, organization membership, or
  gateway authority.
- A request identity header is principal authority.
- Originating identity evidence is mutation authority.
- Operation reconciliation is retry authority.
- A future operation-claim index is a public operation polling API.
- Handshake observes every terminal, browser, network, MCP, generated-code, or gateway path.
- Handshake controls a gateway while the agent still has raw mutation credentials for that gateway.
- A broad management UI is the product.
- The old repo's strategy docs are canonical for v0.2.
- Passing a local preview-deploy fixture does not prove production provider enforcement.

## Theatre Tests

If the rendered UI says one thing and the action contract says another, this is review theatre.

If generated code can call an unwrapped consequential tool, the generated code escaped the contract boundary.

If a generated block has one eligible node and one unsupported sibling, the eligible node cannot get partial credit.

If the agent keeps raw gateway credentials while Handshake claims control, this is advisory theatre.

If a human decision binds to a plan but not the exact gateway mutation, the decision is theatre.

If the gateway does not enforce the greenlight, this is advisory, not Handshake.

If one greenlight can authorize multiple mutations, this is ambient authority wearing a badge.

If a receipt cannot distinguish gateway check from downstream execution, this is evidence theatre.

If the compiler turns vague intent into excessive scope, the compiler overreached the principal.

If the chain cannot be reconstructed later, this is not auditable.

If a fixture runner pass is presented as production gateway enforcement, this is conformance theatre.

If the local preview-deploy fixture is described as Vercel, Cloudflare, GitHub Deployments, or other provider-side enforcement, this is provider theatre.

If raw request context, operation claims, or debug record reads are treated as public API, this is storage theatre.

Active next mechanism: finish Plan 03 graph drift, catalog/registry miss, and codemode whole-block tests before adding a public graph route or runtime helper. The local preview-deploy adapter is fixture proof only. Proof packets, graph records, and fixture runners are evidence mechanisms only, not authority claims.
