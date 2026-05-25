# Review Gates

## Gate Summary

| Gate | Evidence | Status |
| --- | --- | --- |
| CEO | Buyer story and economic unit reviewed in macro-map lens | Keep language, contain it |
| Engineering | Source placement and tests reviewed in macro-map lens | Surface first, no protocol primitive |
| Design | User mental model reviewed in macro-map lens | State separation required |
| DevEx | First-use path and docs/SDK/CLI/MCP reviewed in macro-map lens | Converge surfaces after schema |
| Agent | Generated-agent misuse reviewed in macro-map lens | Handle misuse tests required |
| Runtime | Multi-host posture reviewed in macro-map lens | Host-specific proof gaps required |
| Protected Action | Authority and gateway boundary reviewed in macro-map lens | Non-authority matrix required |
| Evidence | Macro-plan validation and proof gaps | Validator and sidecar reconciliation required |

## Sidecar Review

Sidecar audits are expected under `.planning/macro-plan/runs/20260525T095940Z-tier1-tier2-product-simplification/audits/`:

- `slices.md`
- `protected-action.md`
- `runtime-agent.md`
- `evidence.md`
- `product-devex-design.md`

All five sidecar reports are present. The chair reconciled them by narrowing implementation readiness to the first Tier 1 story/schema/test slice. Protected-action fixture work, multi-host runtime claims, public-surface convergence, and Tier 3 remain gated until their source proof exists. Sidecar findings can add gates, risks, and task details; they cannot authorize weaker authority claims.

| Report | Chair Reconciliation |
| --- | --- |
| `audits/slices.md` | Full-program slices are captured in `EXECUTION-SLICES.md`; implementation starts only after macro validation. |
| `audits/protected-action.md` | Field-level matrix and negative-test requirements are captured in `PROTECTED-ACTION-GATES.md`; protected-action fixtures stay gated. |
| `audits/runtime-agent.md` | Host-specific posture and generated-execution stress gates are captured in `RUNTIME-GATES.md`; no generic multi-host execution claim. |
| `audits/evidence.md` | Validator result and status reconciliation are recorded in `EVIDENCE-PLAN.md` and run-local `validation.md`. |
| `audits/product-devex-design.md` | 10-star product criteria and convergence plan are captured in execution slices and tasks; public ergonomics wait for source schema/tests. |

## CEO Gate

Pass condition: the buyer story centers on protected-event clearing and reconstruction, not passport validation as authority. Passport validation may be free/open adoption plumbing. Paid value remains protected-event terminalization, retention/readback/export, and gateway readiness.

Fail condition: the product sells trusted agents, reusable badges, passport permissions, marketplace certification, settlement, cross-org trust, or hosted clearing before proof.

## Engineering Gate

Pass condition: first implementation lives in `docs/internal`, `src/surfaces`, and architecture/product tests. It does not add `src/protocol/areas/passport`, protocol object registry entries, gateway adapter authority, root authority exports, or store migrations.

Fail condition: source placement makes a surface noun look like protocol state without a distinct enforceable transition.

## Design Gate

Pass condition: the user-facing model separates Passport evidence, Service Admission, Workflow Handle, Action Request, Clearance, Gateway Check, and Outcome. The review surface does not show one approval badge over mixed states.

Fail condition: admission review is substituted for exact action-contract review. This is review theatre.

## DevEx Gate

Pass condition: README, protocol-layman docs, role-client guidance, CLI/MCP descriptions, and examples teach the simplified flow while preserving non-authority flags and proof gaps.

Fail condition: developers receive a badge/handle API before learning that every protected action requires fresh clearance.

## Agent Gate

Pass condition: agent handoff and tests cover loops, retries, branches, dynamic tool construction, stale review, changed params, raw siblings, replay, proof gaps, and isolation.

Fail condition: generated code can pass a handle into an unwrapped consequential tool. The generated code escaped the contract boundary.

## Runtime Gate

Pass condition: runtime posture is host-specific. Codex, Claude Code, Hermes, OpenClaw, MCP, browser, A2A, OpenAPI, auth.md, and x402 are not collapsed into one runtime claim.

Fail condition: host profiles, MCP visibility, OpenAPI routes, or A2A metadata are treated as enforcement.

## Protected-Action Gate

Pass condition: the field-level matrix proves admission and handle cannot create authority, policy decisions, greenlights, gateway checks, signer use, payment material, mutation, receipts, certificates, or resource widening. x402/auth.md remain exact per-event rails.

Fail condition: one admission or handle can authorize multiple mutations. This is ambient authority wearing a badge.
