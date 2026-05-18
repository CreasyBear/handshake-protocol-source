# Planning and Technical Data Store Framework

## Invariant at Stake

Planning memory is useful only if it does not become accidental authority.

For Handshake, local planning artifacts may compile vague intent into proposed work, candidate contracts, review findings, and proof expectations. They must not become permission, gateway proof, product claims, or durable protocol canon until deliberately promoted.

## Primitive

Use `.planning/` as the canonical local planning and technical data store for active agent work.

`.planning/` is intentionally gitignored. It is the working memory for GSD, Addy-style execution discipline, GStack reviews, Matt Pocock issue/domain workflows, and Handshake-specific contract design. The tracked repository remains the durable source for accepted product, protocol, API, and architectural facts.

## Boundary

There are two stores:

1. `.planning/`
   Local, mutable, gitignored, agent-facing working state.

2. `docs/`, source files, tests, and ADRs
   Tracked, reviewable, durable project state.

Nothing in `.planning/` grants execution authority. A `PLAN.md`, `SPEC.md`, `CONTEXT.md`, review report, or generated contract draft is still intent compilation. Only gateway-checked execution against an exact greenlight can authorize consequence.

## What Belongs in `.planning/`

Use `.planning/` for artifacts that are valuable during active work but should not pollute repo history:

- project state, phase state, and session handoff notes
- GSD artifacts: `PROJECT.md`, `REQUIREMENTS.md`, `ROADMAP.md`, `STATE.md`, phase directories, UAT notes, summaries, and local config
- codebase maps, mutation-surface inventories, gateway inventories, and technical reconnaissance
- draft specs, draft plans, research notes, uncertainty markers, and open questions
- candidate action contracts, canonicalization notes, policy-tabletop results, proof-gap ledgers, and receipt expectations
- GStack review outputs before they are distilled into tracked issues, docs, tests, or code
- local issue triage scratch work and backlog shaping before promotion
- temporary agent coordination state, workstream notes, and context restoration artifacts

Do not store secrets, credentials, customer data, private production payloads, or raw environment dumps in `.planning/`.

## Suggested Layout

```text
.planning/
  PROJECT.md
  ROADMAP.md
  STATE.md
  MAP.md
  WORKFLOW.md
  TEMPLATES.md
```

This layout is deliberately small. Add a new file only when it replaces or significantly shortens one of these six files.

Runtime contracts live in typed schemas and gateway checks, not markdown folders.

## Skill Routing

GSD owns lifecycle state:

- initialize project context
- define phases
- plan phases
- execute interactively
- verify work
- summarize and ship readiness

Addy skills own craft inside the lifecycle:

- `interview-me` and `idea-refine` clarify vague intent before specs
- `spec-driven-development` and `api-and-interface-design` sharpen requirements and interfaces
- `planning-and-task-breakdown` turns specs into implementable tasks
- `test-driven-development`, `source-driven-development`, and `doubt-driven-development` constrain implementation quality
- `security-and-hardening`, `performance-optimization`, and `documentation-and-adrs` harden and record decisions

GStack owns adversarial pressure:

- `office-hours` before committing to a product direction
- `plan-ceo-review`, `plan-eng-review`, and `plan-design-review` before implementation
- `health`, `qa`, `qa-only`, `cso`, and `review` before landing
- `ship` only after verification and review gates pass

Matt Pocock skills own repo mechanics and React-specific quality:

- `setup-matt-pocock-skills` configures issue tracker, labels, and domain docs
- `to-prd`, `to-issues`, and `triage` promote validated planning into work items
- `tdd`, `diagnose`, `improve-codebase-architecture`, and `zoom-out` support implementation and analysis
- `react-useeffect`, `vercel-react-best-practices`, and `vercel-composition-patterns` apply only to React/Next implementation and review

Handshake invariants override all generic skill workflows.

## Handshake Phase Requirements

Every consequential Handshake phase should answer these inside `STATE.md`, `MAP.md`, or a short temporary scratch section:

- invariant: what can break?
- primitive: what control mechanism is being added or changed?
- boundary: where is authority enforced?
- contract: what exact gateway-bound action is proposed?
- policy: what greenlight/refusal/review/halt/quarantine outcomes exist?
- receipt: what proves gateway check, mutation attempt, downstream finality, refusal, or proof gap?

If a phase cannot name the gateway check, it is not ready for execution. If the answers need to become durable, promote them into tracked docs, schemas, tests, or ADRs.

## Promotion Rules

Promote from `.planning/` into tracked files only when the artifact has become durable project knowledge.

Promote to `docs/` when:

- the decision changes the product kernel, protocol model, or public architecture
- the artifact defines a stable gateway integration, action catalog, policy primitive, or receipt model
- future agents need the fact outside the active planning session
- the claim has been reviewed and no longer depends on raw brainstorming context

Promote to tests when:

- an invariant can be checked mechanically
- a bypass path can be reproduced
- a proof-gap case should remain impossible to smooth over

Promote to issues when:

- work is independently grabbable
- scope and acceptance criteria are clear
- the issue names the invariant, primitive, gateway boundary, and expected evidence

Do not promote raw GSD plans, review transcripts, model research dumps, or tentative claims directly.

## Review Gates

Before implementation:

1. Run GSD planning.
2. Apply Addy task breakdown, source grounding, and doubt review.
3. Run GStack plan review for engineering/product/design as applicable.
4. Confirm every consequential task maps to a known action type or is explicitly non-consequential.

Before landing:

1. Run tests and repo health checks.
2. Run GStack review or QA when UI/runtime behavior changed.
3. Update tracked docs only with distilled decisions.
4. Record remaining proof gaps explicitly.

## Failure Modes

If `.planning/` is treated as tracked truth, stale generated plans will pollute the repo.

If `.planning/` is treated as permission, this is approval theatre.

If a GSD phase executes broad mutations without a gateway boundary, the generated code escaped the contract boundary.

If a review artifact says one thing and the exact action contract says another, this is review theatre.

If the final docs cannot reconstruct why a primitive exists without `.planning/`, the durable project record is incomplete.

## Brutal Verdict

Keep `.planning/` as local working memory. Keep it small. Keep `docs/` as durable canon. Promote only reviewed, stable, mechanism-level facts.

Smallest next mechanism to build: update `GatewayConformanceReport` in schemas/tests/docs instead of creating more planning documents.
