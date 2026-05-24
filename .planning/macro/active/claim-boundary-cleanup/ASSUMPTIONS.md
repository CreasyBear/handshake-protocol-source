# Assumptions

| ID | Assumption | Confidence | Evidence | Invalidation Trigger |
| --- | --- | --- | --- | --- |
| A1 | The user correction is authoritative: Handshake is protected actions for automated decision making. | High | Immutable input packet and all raw perspectives converge. | User chooses a different category phrase before implementation. |
| A2 | Tier 1 protocol/kernel meaning is stable and must not change in this cleanup. | High | Input constraints and protocol definition already support protected action control. | A strengthened claim guard cannot pass without a protocol behavior change. That should stop the slice. |
| A3 | x402 exact per-call protected action is the current first wedge. | High | README, x402 walkthrough, product report test, and perspectives all point to the official buyer-side `x402_payment.exact` path. | Source evidence proves the x402 path is not the narrowest executable wedge. |
| A4 | Aggregate payment-budget management is intentionally outside current remit. | High | Input explicitly requires replacing spend-ledger-required wording with out-of-remit posture. | User asks to plan spend-budget management as a separate capability. |
| A5 | Engineering-agent workflows remain useful adoption context and threat model. | High | Current canon and examples are built around generated execution and engineering-agent mutation surfaces. | Implementation removes all engineering-agent references and loses first-use clarity. |
| A6 | `not_enforced_local_metadata` may remain only as local metadata. | Medium | Raw perspectives agree; current source uses local spend-window status language. | Search finds the marker used as a product-scope enforcement promise. |
| A7 | Current x402 proof is local/reference evidence, not live custody or hosted operation. | High | README, protocol definition, x402 walkthrough, and report tests state local/reference boundaries. | Future implementation adds real customer/provider gateway custody and verifies it. |
| A8 | Claim guards should use named high-authority surfaces, not unbounded regex sprawl. | High | Maintainability requirement and existing `claim-boundary.test.ts` structure. | Guard coverage cannot express the boundary without a broader source-owned vocabulary mechanism. |
| A9 | External verification is out of scope for this cleanup. | High | Input says do not browse by default and mark external claims out of scope. | A future implementation adds positive external x402, legal, registry, JWKS, npm, or Cloudflare claims. |
| A10 | `.planning/codebase/CONCERNS.md` is scratch risk evidence, not canon. | High | README and decisions canon say `.planning/` is scratch. | User explicitly promotes a planning artifact into repo canon. |
