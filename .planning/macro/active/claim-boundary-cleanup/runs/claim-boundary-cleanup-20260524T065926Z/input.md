# Macro Plan Input: Claim Boundary Cleanup

Run ID: `claim-boundary-cleanup-20260524T065926Z`

## Target

Create a source-grounded macro plan for critical-path item 0 from `.planning/macro/DEFERRED-INTEGRATE-ELIMINATE.md`: **Claim Boundary Cleanup**.

Goal: remove ambiguity before adding new capability. The plan must define the implementation path for making eliminated items intentional product boundaries, not pending promises or roadmap-shaped claims.

Important correction from the user: Handshake is **not specific to engineering agents**. Handshake is protected actions for automated decision making. The current first wedge is x402 protected actions, and engineering-agent workflows are an adoption context, not the category boundary. The plan must preserve modularity so the protocol can extend beyond the first wedge without turning any wedge into the protocol definition.

## User Constraints

- Use `$gsd-macro-plan` as a subagent-first workflow.
- This is planning only. Do not implement source changes under this run.
- Keep Tier 1 protocol/kernel meaning stable.
- Treat protected actions for automated decision making as the product category.
- Treat x402 as the first wedge unless source evidence proves a narrower implementation sequence is required.
- Do not make engineering agents the product boundary; treat them as one current adoption context.
- Do not weaken the Tier 2 x402 exact per-call wedge.
- Preserve customer-owned gateway custody as the future enforcement model.
- Do not turn Handshake into payment management, generic agent governance, hosted observability, settlement, marketplace, certification, or broad runtime control.
- Plans must be executable later: source-owned mechanisms, tests, claim guards, closeout gates, and cut lines.

## Source Boundary

Allowed source files for first-pass agents:

- `AGENTS.md`
- `README.md`
- `QUALITY.md`
- `STRUCTURE.md`
- `docs/internal/decisions.md`
- `docs/internal/protocol-definition.md`
- `docs/internal/protocol-kernel-architecture.md`
- `docs/internal/protocol-layman.md`
- `docs/internal/protocol-notes.md`
- `.planning/macro/README.md`
- `.planning/macro/DEFERRED-INTEGRATE-ELIMINATE.md`
- `.planning/codebase/ARCHITECTURE.md`
- `.planning/codebase/CONCERNS.md`
- `.planning/codebase/CONVENTIONS.md`
- `.planning/codebase/INTEGRATIONS.md`
- `.planning/codebase/STACK.md`
- `.planning/codebase/STRUCTURE.md`
- `.planning/codebase/TESTING.md`
- `test/architecture/claim-boundary.test.ts`
- `test/architecture/import-posture.test.ts`
- `test/architecture/root-exports.test.ts`
- `test/product/x402-protected-spend-demo-report.test.ts`
- `examples/x402-protected-spend/README.md`
- `examples/x402-protected-spend/run.ts`
- `examples/self-hosted-activation/README.md`
- `src/runtime/LANE.md`
- `src/mcp/LANE.md`
- `src/cli/LANE.md`
- `src/sdk/LANE.md`
- `src/adapters/LANE.md`
- `src/conformance/LANE.md`

Forbidden files for first-pass agents:

- sibling raw outputs under this run;
- normalized outputs under this run;
- the final `PLAN.md` for this run before chair synthesis;
- unrelated historical `.planning/macro/archive/**` files unless a specific current source file links to them;
- source files not listed above unless the agent first records why the listed source packet is insufficient.

## Required Output Directory

All artifacts for this item must stay under:

```text
.planning/macro/active/claim-boundary-cleanup/
```

First-pass outputs:

```text
.planning/macro/active/claim-boundary-cleanup/runs/claim-boundary-cleanup-20260524T065926Z/raw/STRATEGY.md
.planning/macro/active/claim-boundary-cleanup/runs/claim-boundary-cleanup-20260524T065926Z/raw/ARCH.md
.planning/macro/active/claim-boundary-cleanup/runs/claim-boundary-cleanup-20260524T065926Z/raw/EXECUTION.md
.planning/macro/active/claim-boundary-cleanup/runs/claim-boundary-cleanup-20260524T065926Z/raw/RISK.md
.planning/macro/active/claim-boundary-cleanup/runs/claim-boundary-cleanup-20260524T065926Z/raw/ADOPTION.md
```

Chair outputs:

```text
.planning/macro/active/claim-boundary-cleanup/PLAN.md
.planning/macro/active/claim-boundary-cleanup/CONTEXT.md
.planning/macro/active/claim-boundary-cleanup/ASSUMPTIONS.md
.planning/macro/active/claim-boundary-cleanup/DECISIONS.md
.planning/macro/active/claim-boundary-cleanup/RISKS.md
.planning/macro/active/claim-boundary-cleanup/VALIDATION.md
.planning/macro/active/claim-boundary-cleanup/TASKS.jsonl
.planning/macro/active/claim-boundary-cleanup/runs/claim-boundary-cleanup-20260524T065926Z/synthesis.md
```

## Plan Requirements

The chair plan must include:

- goal;
- non-goals;
- source boundary;
- current state;
- target state;
- assumptions;
- decisions;
- phases;
- task graph;
- risks and mitigations;
- validation gates;
- cut lines;
- rollback / stop conditions;
- smallest next action.

The plan must explicitly cover:

- replacing "spend reservation ledger required before claim" wording with "aggregate payment-budget management intentionally out of current remit" where source evidence supports that cleanup;
- identifying source language that over-constrains Handshake to engineering agents and planning how to restate it as protected actions for automated decision making without overclaiming broad runtime control;
- keeping `not_enforced_local_metadata` only where clearly local metadata;
- adding or strengthening claim guards so docs/examples cannot imply payment management, settlement, seller/facilitator operation, hosted trust, broad x402 compatibility, broad runtime/MCP/CLI/browser/shell/network/package-manager control, marketplace/certification, clearing-house readiness, or cross-org certificate trust;
- preserving per-call x402 exact authorization as the current wedge;
- preserving modular adapter/action-pack discipline so x402 proves the spine but does not define it;
- preserving customer-owned gateway custody, terminal evidence, proposal/evidence surfaces, and one protected-action-pack-at-a-time discipline;
- identifying which checks are already green versus planned;
- identifying what must remain deferred or eliminated.

## Success Criteria

- The macro plan is executable as a future implementation slice without altering Tier 1 protocol meaning.
- The plan corrects category language toward protected actions for automated decision making while preserving source-backed boundaries.
- The plan narrows claim language and tests; it does not add authority, custody, payment management, settlement, or hosted operation.
- Each task names source/test/doc candidate paths and closeout evidence.
- `TASKS.jsonl` parses as JSONL.
- Validation gates are specific enough to fail overclaims.
- The plan names antipatterns and stop conditions.

## External Verification

This item is mostly repo-claim cleanup. Do not browse by default. If a perspective proposes npm, MCP Registry, JWKS, Cloudflare, x402, or legal/payment-regulatory language as part of this specific slice, it must explicitly mark that as out of scope or require external verification before implementation.

## 10 Star Product Bar

Claim cleanup is successful when a sophisticated buyer, maintainer, auditor, or future agent cannot misread local proof lanes as broad product authority or misread the first adoption context as the whole category. Handshake should read as smaller, sharper, and harder to fake: protected actions for automated decision making, proven first through x402 exact per-call authorization, with exact contract, one-use greenlight, gateway check, redacted evidence, proof gap, and terminal evidence only where the source actually enforces them.
