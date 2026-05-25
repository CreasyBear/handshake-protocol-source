# Tier 1 / Tier 2 Product Simplification Macro Plan

## Scope

This package turns the current Passport / Admission / Badge macro map into a full Tier 1 and Tier 2 execution program. The goal is not a small story slice. The goal is to make Handshake simpler to use while preserving the exact contract, policy, one-use greenlight or refusal, gateway check, receipt, refusal, proof-gap, isolation, and reconstruction boundaries.

Tier 3 progression is blocked until Tier 1 and Tier 2 product surfaces are sharp, source-backed, and verified or proof-gapped.

## Source Map

| Source | Role | Status |
| --- | --- | --- |
| `.planning/macro-map/*` | Current macro-map package and lens evidence | Derived planning input |
| `.planning/codebase/*` | Current codebase map for placement, tests, conventions, integrations, and concerns | Derived evidence; implementation must source-check |
| `README.md`, `QUALITY.md`, `STRUCTURE.md` | Current package posture, quality rules, source ownership | Canon |
| `docs/internal/decisions.md`, `docs/internal/protocol-notes.md` | Product kernel, proof ledger, protocol notes, expansion gates | Canon |
| `docs/internal/protocol-definition.md`, `docs/internal/protocol-kernel-architecture.md`, `docs/internal/protocol-layman.md` | Protocol definition, architecture, and plain-language guide | Canon |
| `.planning/macro-plan/runs/20260525T095940Z-tier1-tier2-product-simplification/*` | Run input, source snapshot, sidecar audits, validation evidence | This plan run |

## Sidecar Review

Five sidecar auditors completed bounded reports:

- execution slices and full-program sequencing;
- protected-action posture and non-authority ID model;
- runtime and generated-agent posture;
- evidence, validation, and closeout gates;
- product, design, DevEx, and adoption.

The chair owns sequencing, status, authority claims, and implementation entry. Sidecars pressure-test the plan; they do not promote proof gaps into authority.

## Status

This macro plan is validated as an implementation handoff for the first bounded Tier 1 story/schema/test slice and a full long-running program for the remaining Tier 1 and Tier 2 simplification work. It does not claim protected-action fixture readiness, runtime containment, Tier 3 readiness, hosted operation, external provider custody, settlement finality, marketplace trust, host-wide containment, or reusable passport authority.

## Artifact Index

- `MACRO-PLAN.md`: governing plan, scope, target state, and implementation entry.
- `EXECUTION-SLICES.md`: full Tier 1 and Tier 2 slices with proof gates and stop conditions.
- `AGENT-HANDOFF.md`: fresh-agent execution context and first implementation step.
- `RUNTIME-GATES.md`: host/runtime suitability and continuation gates.
- `PROTECTED-ACTION-GATES.md`: authority, gateway, field-level, bypass, readback, and proof-gap gates.
- `EVIDENCE-PLAN.md`: commands, examples, fixtures, review prompts, and unavailable evidence.
- `REVIEW-GATES.md`: sidecar and review gate reconciliation.
- `RISKS.md`: tracked risks with owners and mitigations.
- `DECISIONS.md`: accepted, rejected, deferred, and revisit-triggered decisions.
- `TASKS.jsonl`: assignable next mechanisms for planning and implementation.
