# Decisions

## Accepted

- D1: Runtime x402 posture propagation is first. The plan starts with failing runtime tests and a source patch to forward body/provider posture into the x402 attempt.
- D2: Runtime refusal must be pre-contract. Unsupported, omitted, external, live, or unknown x402 posture cannot produce an `ActionContract`.
- D3: Direct x402 idempotency material must include request-body posture, provider-environment posture, and provider-environment ref for new proposals.
- D4: MCP posture parity is second. MCP must carry or refuse the same posture boundary as the direct adapter/runtime path while staying proposal/evidence only.
- D5: MCP schema should require explicit posture fields. Missing posture is schema-invalid or structured pre-contract refusal, never silent local-reference defaulting.
- D6: Sandbox signed retry is local/reference downstream fixture evidence only. It is not settlement, facilitator operation, seller middleware, provider custody, gateway authority, or mutation proof.
- D7: Runtime family registry extraction waits until posture propagation tests pass. The refactor is a hardening phase, not the first fix.
- D8: Spend-window controls remain metadata in this macro. Guard the claim instead of building a partial ledger.
- D9: Custody, hosted verifier, host-wide interception, publication, and broad x402 surfaces are future cuts with tests and claim gates.
- D10: Package/public readiness requires `npm run pack:check`; dirty source and checked-in `dist/` are not proof by themselves.

## Rejected

- R1: Do not close concerns through docs-only or copy-only edits.
- R2: Do not make runtime/MCP import wallet gateway, signer, storage, policy, gateway, receipt, all-role SDK, or certificate authority code to achieve parity.
- R3: Do not add a runtime-side aggregate spend sum as a substitute for a real reservation ledger.
- R4: Do not use the sandbox signed retry as evidence of seller middleware, facilitator operation, settlement finality, provider custody, or live paid HTTP operation.
- R5: Do not broaden `x402_payment.exact` to `upto`, batch settlement, lifecycle hooks, signed offers, signed receipts, MCP auto-pay, or seller/facilitator surfaces.
- R6: Do not treat runtime/MCP bypass posture as broad host interception.
- R7: Do not claim npm/MCP Registry publication from source-owned package gates.

## Deferred

- F1: Aggregate spend reservation ledger with tenant/org/principal/agent/action/resource/window keys, conflicts, recovery, D1 persistence, and receipt evidence.
- F2: Provider/customer custody with vault resolver, rotation, revocation, gateway failure, and provider-specific redaction tests.
- F3: Hosted verifier with JWKS, revocation, cross-org trust, retention, and operational deployment proof.
- F4: Host-specific bypass interception for browser, shell, package manager, cloud API, repo, network, database, and sibling MCP tools.
- F5: Seller middleware, facilitator operation, settlement finality, and broader x402 action classes.
- F6: Actual npm and MCP Registry publication with owner-held credentials.
- F7: Dedicated support-bundle expansion beyond existing non-authority diagnostic surfaces.

## User-Owned

No user-owned decision blocks the implementation plan.

Future user-owned choices:

- Whether to fund the aggregate spend ledger.
- Which live custody provider or vault should be first.
- Which host/runtime deserves first real bypass-interception proof.
- Whether and when to publish to npm or MCP Registry with owner credentials.
- Whether to broaden x402 beyond exact buyer-side payment after the first wedge survives closeout.
