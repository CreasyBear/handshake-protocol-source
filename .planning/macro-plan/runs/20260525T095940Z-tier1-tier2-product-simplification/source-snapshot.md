# Source Snapshot

## Git State

- Branch: `main`
- Upstream: `origin/main`
- Initial `git status --short`: clean

## Canonical Product Truth

- `README.md` says Handshake is protected action infrastructure for automated decision making and reduces one consequential automated action to an exact contract before mutation.
- `README.md` says product surfaces expose proposal/evidence without creating authority, and MCP is proposal/evidence only.
- `docs/internal/decisions.md` defines the current kernel chain as exact action contract -> policy decision -> one-use gateway-bound greenlight -> gateway check before mutation -> receipt/refusal/proof gap.
- `docs/internal/decisions.md` keeps hosted operation, provider custody, settlement/finality, marketplace/certification, cross-org trust, host-wide containment, aggregate spend, and broad x402 compatibility as proof gaps, outside claims, or cut lines.
- `docs/internal/protocol-notes.md` defines the primitive as reducing every consequential mutation attempt to an exact, inspectable, policy-evaluated, gateway-bound action contract before consequence.
- `QUALITY.md` and `STRUCTURE.md` require product surfaces to expose proposal/evidence/readback without becoming protocol authority.

## Macro Map Truth

- `.planning/macro-map/MACRO-HANDOFF.md` status is decision-gated and warns that Passport, Admission, Badge, and Handle are evidence/context only.
- `.planning/macro-map/MACRO-MAP.md` says the kernel authority chain should remain unchanged and the first mechanism belongs in product-surface admission/readback schema, not a new protocol primitive.
- `.planning/macro-map/CONCERNS.md` has open P0/P1 blockers for non-authority flags, handle misuse, multi-host overclaim, naming drift, metaphor-only docs, and free verifier versus paid clearance confusion.
- `.planning/macro-map/PROTECTED-ACTION-MAP.md` says the triggering consequence begins only when an admitted workflow tries to perform a protected action.
- `.planning/macro-map/AGENT-RUNTIME-MAP.md` says multi-host runtime claims must remain proof-gapped and host-specific.

## Codebase Map Truth

- `.planning/codebase/ARCHITECTURE.md` places authority in policy greenlight, gateway gate, verified gateway adapters, and replay-sensitive storage, not runtime ingress, HTTP admission, projections, CLI, MCP, SDK, or demos.
- `.planning/codebase/STRUCTURE.md` says Passport readback should be a projection over existing records, Admission changes belong in HTTP admission and route metadata only if needed, and service gateway language maps to existing gateway registry, credential custody, gateway gate, and adapter files.
- `.planning/codebase/CONCERNS.md` flags no current source-owned Passport primitive and warns that standalone Passport, Admission, ServiceGateway, or PrincipalAgentLink objects can duplicate existing authority-adjacent state.
- `.planning/codebase/TESTING.md` names the focused gates for simplification: `npm run quality:claims`, `npm run quality:architecture`, and focused protocol/runtime projection tests.

## Source Boundary Status

The source boundary is sufficient for full macro planning. The implementation phase must still source-open named files before edits and must not treat `.planning/` as canon.

## Non-Proofs

- No `ServiceWorkflowAdmission` or `ServiceWorkflowHandle` schema exists yet.
- No negative tests currently prove the new product nouns cannot create authority.
- No local demo connects an admitted workflow handle to one fresh x402 exact clearance.
- No live provider custody, settlement, hosted operation, native host containment, external registry acceptance, or marketplace trust is proven.
