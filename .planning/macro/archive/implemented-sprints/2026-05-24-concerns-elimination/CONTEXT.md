# Macro Context

## Target

Create an executable implementation plan that eliminates the current `.planning/codebase/CONCERNS.md` concern set through source mechanisms, tests, and gates, not documentation-only closure.

## Run

- Run id: `concerns-elimination-20260524T044836Z`
- Date: 2026-05-24
- Role: CHAIR synthesis
- Output scope: `.planning/macro/*` and `.planning/macro/runs/concerns-elimination-20260524T044836Z/synthesis.md`

## Invariant

No consequential autonomous action executes outside declared bounds, and divergent behavior must be haltable, isolatable, and reconstructable.

## Canon

Canonical repo truth lives in:

- `AGENTS.md`
- `README.md`
- `QUALITY.md`
- `STRUCTURE.md`
- `docs/internal/decisions.md`
- `docs/internal/protocol-definition.md`
- `docs/internal/protocol-kernel-architecture.md`
- `docs/internal/protocol-notes.md`

`.planning/` is scratch. It can identify concerns and implementation order, but it must not become a package surface, exported symbol, script name, CI name, public docs authority, or implementation namespace.

## Input Packet

The chair read:

- `.planning/macro/runs/concerns-elimination-20260524T044836Z/input.md`
- `.planning/macro/runs/concerns-elimination-20260524T044836Z/raw/STRATEGY.md`
- `.planning/macro/runs/concerns-elimination-20260524T044836Z/raw/ARCH.md`
- `.planning/macro/runs/concerns-elimination-20260524T044836Z/raw/EXECUTION.md`
- `.planning/macro/runs/concerns-elimination-20260524T044836Z/raw/RISK.md`
- `.planning/macro/runs/concerns-elimination-20260524T044836Z/raw/ADOPTION.md`
- `/Users/joelchan/.codex/skills/gsd-macro-plan/references/plan-contract.md`

The chair also performed a narrow source check against `.planning/codebase/CONCERNS.md`, `package.json`, `src/runtime/ingress/index.ts`, `src/mcp/x402-proposal.ts`, `src/runtime/LANE.md`, `src/mcp/LANE.md`, `src/adapters/x402-payment/action-proposal.ts`, `src/adapters/x402-payment/sandbox-http.ts`, and `src/protocol/evidence-projections/projections.ts`.

## Current Dirty Worktree From Input Packet

These files were observed dirty before planning and are treated as current worktree state to validate, not as committed proof:

- `README.md`
- `docs/internal/decisions.md`
- `docs/internal/protocol-notes.md`
- `examples/x402-protected-spend/README.md`
- `examples/x402-protected-spend/run.ts`
- `src/adapters/x402-payment/action-proposal.ts`
- `src/adapters/x402-payment/index.ts`
- `src/adapters/x402-payment/upstream-evidence.ts`
- `src/adapters/x402-payment/wallet-gateway.ts`
- `src/protocol/evidence-projections/projections.ts`
- `src/protocol/foundation/reason-codes.ts`
- `src/runtime/ingress/index.ts`
- `test/adapters/x402-payment-action-proposal.test.ts`
- `test/adapters/x402-wallet-gateway.test.ts`
- `test/product/x402-protected-spend-demo-report.test.ts`
- `src/adapters/x402-payment/sandbox-http.ts`

## Source Observations

- Runtime schema already accepts x402 body/provider posture fields, but `x402PaymentAttemptForDispatch()` does not forward `intendedRequestBodyPosture`, `providerEnvironmentPosture`, or `providerEnvironmentRef`.
- Direct x402 adapter parameters include body/provider posture, but idempotency material currently needs explicit posture/ref binding to prevent equivalence drift.
- MCP x402 proposal schema has `intendedRequestBodyDigest` but lacks explicit body posture and provider-environment posture/ref.
- MCP lane documentation forbids policy, gateway, signer, storage, receipt, all-role SDK, and certificate authority imports.
- Runtime lane documentation says runtime may observe and propose, but must not issue policy, greenlights, gateway checks, receipts, mutation attempts, provider enforcement, or production proof.
- Local x402 sandbox already has refusal reason codes for missing signature evidence, wrong header, non-reference environment, and ambiguous body posture, but it needs a stronger typed evidence boundary to prevent settlement/facilitator/custody overread.
- Projection redaction is pattern-based and must be hardened before hosted/provider claims.
- `package.json` already has `quality:claims`, `quality:architecture`, `quality:storage`, `pack:check`, `demo:aps`, `demo:mcp-transcript`, and `check:repo` gates.

## Required Implementation Order

1. Runtime posture propagation and pre-contract refusal.
2. MCP posture parity while staying proposal/evidence only.
3. Local sandbox signed-retry evidence boundary.
4. Runtime family registry/refactor hardening.
5. x402 future-surface, spend metadata, custody, and host-bypass guardrails.
6. Evidence projection scale/redaction mechanisms.
7. Package, `.planning`, demo, and closeout gates.

No user-owned decision blocks starting this plan.
