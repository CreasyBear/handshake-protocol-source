# A2A Negotiation Agent Handoff

Status: ready for detailed phase planning

## Objective

Create the detailed `A2A-001 Source And Schema Foundation` phase plan.

Do not implement source code until the phase plan exists and passes review.

## Required Reading

1. `.planning/macro-plan/A2A_NEGOTIATION_META_META_GOAL.md`
2. `.planning/macro-plan/a2a-negotiation/MACRO-PLAN.md`
3. `.planning/macro-plan/a2a-negotiation/ARCHITECTURE.md`
4. `.planning/macro-plan/a2a-negotiation/EXECUTION-SLICES.md`
5. `.planning/macro-plan/a2a-negotiation/EVALUATION.md`
6. `.planning/macro-plan/a2a-negotiation/REVIEW-AUDIT.md`
7. `docs/internal/protocol-kernel-architecture.md`
8. `docs/internal/protocol-layman.md`
9. `src/protocol/foundation/schema-core.ts`
10. `src/protocol/events/schemas.ts`
11. `src/protocol/areas/object-registry/`
12. `src/protocol/kernel.ts`

## Runtime Profile

Runtime: Codex or equivalent coding agent.

Protected-action overlay: mandatory.

Write scope for phase planning:

- `.planning/macro-plan/a2a-negotiation/`
- future phase directory chosen by the planner

Do not edit protocol source during phase planning.

## First Phase Target

`A2A-001 Source And Schema Foundation`

The phase plan must name exact source files, test files, export posture, and
stop conditions for the schema/object/event foundation.

## Non-Negotiable Boundaries

- acceptance is not permission;
- linked agreement is not bearer auth;
- obligation binding is not gateway approval;
- terminal certificate is evidence only;
- receipt is not settlement;
- no cross-org trust without a trust model;
- no root exports before package-surface gates;
- no raw terms, secrets, signer material, payment payload, or payment signature
  in readback.

## Stop Conditions

Stop before implementation if:

- the phase plan cannot prove no-authority acceptance;
- the phase plan requires broad package exports;
- the phase plan needs cross-org trust;
- x402 raw sibling path is used as success;
- policy hook cannot refuse stale/mismatched agreement state;
- tests cannot detect authority overclaim.

## Expected Phase Plan Output

The next agent should produce:

- `PLAN.md`;
- `TASKS.jsonl`;
- `TEST_PLAN.md`;
- `PROTECTED_ACTION_GATES.md`;
- `REVIEW.md` or review gate plan;
- exact source/test file list;
- verification commands;
- residual proof gaps.
