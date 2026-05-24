# Concerns Elimination Macro Plan Input

Run id: `concerns-elimination-20260524T044836Z`
Date: 2026-05-24
Requested by: user

## Target

Create an executable GSD macro plan to eliminate the current `.planning/codebase/CONCERNS.md` concerns with technical implementation that strengthens Handshake rather than applying documentation-only or assertion-only band-aids.

## Invariant

No consequential autonomous action executes outside declared bounds, and divergent behavior must be haltable, isolatable, and reconstructable.

## User Constraints

- Plan for implementation, not vague strategy.
- Eliminate concerns by strengthening source mechanisms, tests, and gates.
- Do not weaken or reopen the Tier 1 protocol/kernel.
- Do not expand Tier 2 claims beyond installed, gateway-owned, exact protected paths.
- Keep CLI/MCP proposal/evidence only.
- Keep runtime ingress proposal-only.
- Keep x402 first wedge exact and buyer-side unless a concern explicitly requires a future cut line.
- Preserve existing dirty worktree changes as current state; do not plan by reverting them.
- No band-aids: each phase must include source-owned mechanism, tests, and validation gates.

## Current Worktree State

Dirty files observed before planning:

```text
M README.md
M docs/internal/decisions.md
M docs/internal/protocol-notes.md
M examples/x402-protected-spend/README.md
M examples/x402-protected-spend/run.ts
M src/adapters/x402-payment/action-proposal.ts
M src/adapters/x402-payment/index.ts
M src/adapters/x402-payment/upstream-evidence.ts
M src/adapters/x402-payment/wallet-gateway.ts
M src/protocol/evidence-projections/projections.ts
M src/protocol/foundation/reason-codes.ts
M src/runtime/ingress/index.ts
M test/adapters/x402-payment-action-proposal.test.ts
M test/adapters/x402-wallet-gateway.test.ts
M test/product/x402-protected-spend-demo-report.test.ts
?? src/adapters/x402-payment/sandbox-http.ts
```

The map should treat these changes as current live worktree state for planning. The plan must not assume they are already validated or committed.

## Required Source Packet

First-pass planners may read:

- `AGENTS.md`
- `README.md`
- `QUALITY.md`
- `STRUCTURE.md`
- `docs/internal/decisions.md`
- `docs/internal/protocol-definition.md`
- `docs/internal/protocol-kernel-architecture.md`
- `docs/internal/protocol-notes.md`
- `.planning/codebase/CONCERNS.md`
- `.planning/codebase/ARCHITECTURE.md`
- `.planning/codebase/STRUCTURE.md`
- `.planning/codebase/TESTING.md`
- `.planning/codebase/INTEGRATIONS.md`
- `.planning/codebase/STACK.md`
- `.planning/codebase/CONVENTIONS.md`
- `src/runtime/ingress/index.ts`
- `src/runtime/LANE.md`
- `src/mcp/x402-proposal.ts`
- `src/mcp/LANE.md`
- `src/adapters/x402-payment/action-proposal.ts`
- `src/adapters/x402-payment/upstream-evidence.ts`
- `src/adapters/x402-payment/wallet-gateway.ts`
- `src/adapters/x402-payment/sandbox-http.ts`
- `src/adapters/x402-payment/install-proposal.ts`
- `src/adapters/x402-payment/conformance.ts`
- `src/adapters/x402-payment/bypass-probes.ts`
- `src/protocol/evidence-projections/projections.ts`
- `src/protocol/evidence-projections/assembly.ts`
- `src/protocol/store/port.ts`
- `src/storage/d1/index.ts`
- `migrations/0001_protocol_kernel.sql`
- `examples/x402-protected-spend/run.ts`
- `examples/x402-protected-spend/README.md`
- relevant tests under `test/runtime/`, `test/mcp/`, `test/adapters/`, `test/conformance/`, `test/protocol/`, `test/http/`, and `test/architecture/`
- `package.json`
- `scripts/check-package-surface.mjs`
- `scripts/check-published-entrypoints.mjs`

First-pass planners must not read sibling raw outputs, normalized outputs, or `.planning/macro/PLAN.md`.

## Concern Groups To Close

1. Runtime x402 posture propagation: runtime ingress must not default away request-body or provider-environment posture.
2. MCP x402 posture parity: MCP proposals must carry/refuse the same body/environment posture that direct adapter/runtime paths enforce.
3. x402 sandbox/signed retry evidence boundary: local sandbox proof must be impossible to confuse with seller middleware, facilitator settlement, or authority.
4. Runtime ingress family hardcoding: cross-family proposal code needs a stronger source-owned family adapter/registry boundary.
5. x402 first-slice and future-surface guards: unsupported x402 surfaces must stay explicit, tested, and unclaimable.
6. Spend window metadata: aggregate spend/session/day/review controls remain metadata until a real reservation ledger exists.
7. Signer custody and provider custody: local signer proof must not become provider/customer custody claim.
8. Host/bypass posture: runtime/MCP bypass evidence is not broad host interception.
9. Evidence projection scale and redaction: projection assembly and credential redaction need stronger source mechanisms before hosted claims.
10. Publish/package drift: publish-ready package surfaces must stay tied to build/pack/published-entrypoint gates.
11. `.planning` scratch drift: derived maps must not become canon or bypass claim/vocabulary gates.

## Required Output

Write a coherent implementation macro plan to:

- `.planning/macro/PLAN.md`
- `.planning/macro/CONTEXT.md`
- `.planning/macro/ASSUMPTIONS.md`
- `.planning/macro/DECISIONS.md`
- `.planning/macro/RISKS.md`
- `.planning/macro/VALIDATION.md`
- `.planning/macro/TASKS.jsonl`
- `.planning/macro/runs/concerns-elimination-20260524T044836Z/synthesis.md`

Also write raw first-pass outputs under:

- `.planning/macro/runs/concerns-elimination-20260524T044836Z/raw/STRATEGY.md`
- `.planning/macro/runs/concerns-elimination-20260524T044836Z/raw/ARCH.md`
- `.planning/macro/runs/concerns-elimination-20260524T044836Z/raw/EXECUTION.md`
- `.planning/macro/runs/concerns-elimination-20260524T044836Z/raw/RISK.md`
- `.planning/macro/runs/concerns-elimination-20260524T044836Z/raw/ADOPTION.md`

## Success Criteria

- Plan has source mechanisms, not documentation-only fixes.
- Plan sequences nearest high-priority defects first: runtime posture propagation, MCP posture parity, and sandbox evidence boundaries.
- Plan explicitly cuts ledger, live custody, host-wide interception, hosted verifier, facilitator/seller middleware, and registry publication unless they are implemented as separate future phases.
- Every task has candidate paths, acceptance tests, and non-goals.
- Validation includes focused tests, architecture/claim gates, package gates, demo regeneration, and full repo check.
- The plan is ready to execute unless a user-owned decision is explicitly identified.
