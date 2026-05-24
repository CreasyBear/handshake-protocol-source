# Decisions

## Accepted

- Use "protected actions for automated decision making" as the category phrase for this cleanup.
- Keep Tier 1 protocol meaning stable. The cleanup changes claims, examples, report wording, and tests, not protocol authority behavior.
- Treat engineering-agent workflows as adoption context and generated-execution stress case, not category boundary.
- Treat x402 as the first official buyer-side exact per-call protected-action wedge.
- Keep `x402_payment.exact` as the protected action class. Treat `x402_paid_http_call.exact` as buyer-readable report language only.
- Replace product-scope "spend reservation ledger required before claim" language with "aggregate payment-budget management intentionally out of current remit."
- Preserve customer-owned gateway custody as the future enforcement model while denying current provider/customer custody claims from local fixtures.
- Strengthen source-owned claim guards before or alongside prose changes.
- Use a small, named claim-surface list and grouped assertions. Avoid god files, regex sprawl, pass-through abstractions, and broad unstructured repo scans.

## Rejected

- Engineering agents as the product category.
- x402 as the protocol definition.
- Payment management, balances, aggregate spend windows, reservations, settlement, seller middleware, facilitator operation, or Handshake-held payment custody in this slice.
- Hosted operation, hosted trust, hosted verifier, live JWKS/revocation, marketplace/certification, clearing-house readiness, or cross-org certificate trust in this slice.
- Broad runtime, MCP, CLI, browser, shell, network, package-manager, cloud, repo, or database control claims.
- Treating runtime/MCP/CLI/SDK/review/report/certificate surfaces as authority surfaces.
- Implementing capability to make stale claims true.
- Promoting `.planning/` scratch into repo-facing source truth.

## Deferred

- Customer-owned gateway custody proof packets.
- Terminal verifier trust plane, JWKS/revocation, and portable verification.
- Hosted admission and redacted evidence plane.
- Additional protected-action packs beyond x402 exact per-call.
- Host-specific bypass harnesses for browser, shell, package manager, cloud, repo, database, or broad MCP/runtime surfaces.
- Public npm/MCP Registry publication proof and external package provenance claims.
- External x402 compatibility, legal, payment-regulatory, Cloudflare, or standards claims.
- Whether `test/architecture/active-vocabulary.test.ts` should join the cleanup. It was not in the chair's allowed source read, so implementation should verify it during inventory if needed.

## User-Owned Decisions

No P1 user-owned decision blocks execution of this cleanup plan.

Potential future user decisions before capability expansion:

- Which second protected-action pack follows x402 after claim cleanup.
- Whether the long-run clearing-house thesis should be captured in strategy docs outside this current repo.
- Whether active `.planning/codebase/CONCERNS.md` should be cleaned in the same implementation slice or left as stale scratch evidence with the active macro plan overriding it.
