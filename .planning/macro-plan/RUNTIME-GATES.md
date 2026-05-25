# Runtime Gates

## Invariant At Stake

Generated agents will treat simple vocabulary as operational affordance unless
runtime gates prove otherwise. A projection/readback surface may help prepare a
proposal, but it cannot authorize a runtime dispatch.

## Source Boundary

Runtime gate truth lives in `src/runtime/ingress`, `test/runtime/*`,
`test/product/service-workflow-admission.test.ts`, `src/mcp/LANE.md`,
`src/cli/command-manifest.ts`, and protocol/gateway tests. Planning gates are
not runtime enforcement.

## Runtime Targets

| Target | Current posture | Required north-star gate |
| --- | --- | --- |
| Codex | Local profile and MCP/stdout evidence only | No host-wide containment claim; workflow handle is proposal context only |
| Claude Code | Managed/profile artifact evidence | No native containment claim |
| Hermes | Tool-packet/profile artifact evidence | No reusable handle authority |
| OpenClaw | Tool-packet/profile artifact evidence | No raw sibling mutation bypass claim |
| MCP | Proposal/evidence resources and stdio process proof | MCP cannot authorize, pay, execute, retry, recover, or certify |
| x402 | Buyer-side exact per-call local proof lane | Fresh exact action request for each payment; signer material stays behind gateway |
| auth.md | Provenance and credential-custody evidence | auth.md does not become composite authority with x402 |
| Browser / A2A / OpenAPI | Proof-gap contexts | No protected-action readiness without gateway-owned path |

## Suitability Postures

- Suitable for local source-owned proposal/evidence/readback tests.
- Suitable for Codex-local implementation with shell and repo gates.
- Not suitable for host-wide containment claims.
- Not suitable for hosted operation or live provider custody claims.

## Instruction Sources

- `AGENTS.md`
- `src/runtime/ingress/*`
- `src/mcp/LANE.md`
- `src/cli/command-manifest.ts`
- `docs/internal/decisions.md`
- `test/runtime/runtime-ingress.test.ts`
- `test/runtime/auth-md-candidate-compilation.test.ts`
- `test/product/service-workflow-admission.test.ts`

## Tool Contract

Runtime ingress may observe generated dispatches, record evidence, refuse unsafe
shapes, and propose candidates. It must not evaluate policy, issue greenlights,
perform gateway checks, use signers, mutate protected surfaces, export receipts,
mint certificates, or claim host containment.

## Approval Or Permission Behavior

Runtime evidence, service workflow handles, rendered reviews, and MCP/CLI/SDK
outputs are not approval or permission. Permission exists only when the protocol
spine records a policy greenlight and the gateway verifies it for one exact
mutation attempt.

## Subagent Behavior

Subagents may audit runtime gates or implement disjoint tests, but they may not
declare runtime protection, host containment, protected-action authority, or
final closeout. The chair reconciles findings.

## Continuation State

Runtime gates remain open until focused tests pass for mixed-family same-envelope
behavior, x402/auth.md non-composition, stale handle/review posture, and current
service workflow misuse cases.

## Blocked Runtime Checks

- Host-wide containment for Codex, Claude Code, Hermes, OpenClaw, MCP, browser,
  A2A, OpenAPI.
- Live provider custody, settlement, facilitator operation, seller middleware.
- Broad raw sibling inventory for all browser, network, cloud, deploy, database,
  and shell channels.

## Required Runtime Misuse Coverage

- mixed-family dispatch blocks must share one generated execution envelope
  before they can be recorded as one runtime spine;
- loops and retries with the same handle;
- changed observed parameters across retries;
- dynamic tool construction;
- stale rendered review or stale admission context;
- raw sibling x402/auth.md/MCP/browser/network bypass;
- direct protected mutation attempt without fresh contract;
- replay after one-use greenlight consumption;
- proof-gap and isolation propagation.
- x402/auth.md generated composition as separate exact contracts or refusal,
  never one composite authority artifact.

## Pass Condition

Runtime may carry projection context into proposal preparation only if the
resulting protected action still becomes one fresh exact action contract and
passes policy/gateway gates before mutation.

## Stop Condition

Stop if any runtime path treats Passport, Admission, Handle, Badge, Outcome,
Certificate, CLI output, MCP resource, or SDK helper as executable grant.
