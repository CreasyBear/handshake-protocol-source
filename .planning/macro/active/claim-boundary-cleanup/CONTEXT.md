# Context

## Target

Plan critical-path item 0 from `.planning/macro/DEFERRED-INTEGRATE-ELIMINATE.md`: Claim Boundary Cleanup.

The cleanup must make eliminated items intentional product boundaries before new capability work. The user correction is controlling: Handshake is protected actions for automated decision making, not just engineering agents. x402 is the first wedge.

## Source Packet

Immutable packet:

- `.planning/macro/active/claim-boundary-cleanup/runs/claim-boundary-cleanup-20260524T065926Z/input.md`

Raw perspectives:

- `raw/STRATEGY.md`
- `raw/ARCH.md`
- `raw/EXECUTION.md`
- `raw/RISK.md`
- `raw/ADOPTION.md`

Contract:

- `/Users/joelchan/.codex/skills/gsd-macro-plan/references/plan-contract.md`

Allowed source checks used during synthesis:

- `AGENTS.md`
- `README.md`
- `docs/internal/decisions.md`
- `docs/internal/protocol-definition.md`
- `.planning/macro/DEFERRED-INTEGRATE-ELIMINATE.md`
- `test/architecture/claim-boundary.test.ts`
- `test/product/x402-protected-spend-demo-report.test.ts`
- `examples/x402-protected-spend/README.md`
- `examples/x402-protected-spend/run.ts`
- `examples/self-hosted-activation/README.md`
- `src/*/LANE.md` files named by the input packet
- `.planning/codebase/CONCERNS.md` as scratch risk evidence only

No archive macro runs or external sources were read.

## Current State

Canonical docs and current README still contain category-level engineering-agent language. The protocol definition is safer: it already describes Handshake as a protocol kernel for protected action control and names the gateway as the pre-consequence enforcement point.

x402 is already source-backed as the first narrow proof wedge. It is one buyer-side `x402_payment.exact` per-call path with local/reference sandbox evidence, gateway-held signer use after `VerifiedGatewayCheck`, replay refusal, and redacted report output. The repo also contains explicit non-claims for broad x402 compatibility, provider custody, hosted operation, facilitator/seller operation, settlement, marketplace/certification, and broad MCP/runtime control.

The main contradiction is claim residue around aggregate spend. `README.md` still says session/day/review spend windows are metadata until a ledger exists, and the current product report test still expects `spend reservation ledger` in `missingProofObjects`. For this cleanup, that should become an explicit non-remit: aggregate payment-budget management is intentionally outside current scope.

`test/architecture/claim-boundary.test.ts` already guards several claim surfaces, but it does not yet force the corrected category or prevent engineering-agent-only product definition. It should be strengthened, not replaced with a broad unstructured grep.

## Relevant Canon

Repo truth lives in:

- `AGENTS.md`
- `README.md`
- `QUALITY.md`
- `STRUCTURE.md`
- `docs/internal/decisions.md`
- `docs/internal/protocol-definition.md`
- `docs/internal/protocol-kernel-architecture.md`
- `docs/internal/protocol-layman.md`
- `docs/internal/protocol-notes.md`

Operational behavior is guarded by:

- `package.json`
- `.github/workflows/check.yml`
- `test/architecture/*`
- `src/*/LANE.md`

`.planning/` is scratch. It can record this run and identify drift, but it must not become source, script, CI, package, or public API truth.

## Synthesis Position

The plan is a test-led claim cleanup:

1. Inventory and phrase table.
2. Strengthen claim guards.
3. Rewrite canonical category language.
4. Clean x402 report/walkthrough wording.
5. Align lane manifests if needed.
6. Clean active scratch drift.
7. Run focused and full validation gates.

No capability work is planned in this slice.
