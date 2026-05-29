# Planning Roadmap

Generated: 2026-05-18  
Refreshed: 2026-05-28

## Invariant at Stake

Planning may compile product intent into proposed work. It must not become authority, and it must not silently import archived or draft artifacts as completed truth.

## Current Track (`.planning/phases/`)

This is the active planning track. The legacy `docs/plans/` track is preserved at the bottom for provenance.

| Phase | Folder | Status | Last update |
|-------|--------|--------|-------------|
| 02 | [`02-address-concerns`](./phases/02-address-concerns/) | **Complete** — see [02-VERIFICATION.md](./phases/02-address-concerns/02-VERIFICATION.md) and [02-UAT.md](./phases/02-address-concerns/02-UAT.md) | 2026-05-28 |
| 03 | [`03-close-enforcement-gaps`](./phases/03-close-enforcement-gaps/) | **Complete** — see [03-VERIFICATION.md](./phases/03-close-enforcement-gaps/03-VERIFICATION.md) | 2026-05-28 |
| 04 | [`04-service-agent-gating`](./phases/04-service-agent-gating/) | **Complete** — see [04-VERIFICATION.md](./phases/04-service-agent-gating/04-VERIFICATION.md) and [04-UAT.md](./phases/04-service-agent-gating/04-UAT.md) | 2026-05-29 |
| 05 | [`05-product-coherence`](./phases/05-product-coherence/) | **Complete** — see [05-VERIFICATION.md](./phases/05-product-coherence/05-VERIFICATION.md) and [05-UAT.md](./phases/05-product-coherence/05-UAT.md) | 2026-05-29 |

### Phase 05 framing

Phase 05 is the post-Phase-04 product unification pass. It is **not** a new mechanism layer. It covers four buckets:

- **A — Phase-04 deferred lane** (service mutation manifest, HTTP profile adapter conformance expansion, dual-enforcement inventory slice, operator runbooks, D-25 per-customer scaffolds)
- **B — Surface scrub** (live evidence fetch parity across CLI/SDK/MCP, one-import agent ergonomics, intent-compilation projection stage, correlation index, hosted-admission consolidation polish)
- **C — Narrative polish** (README + protocol-layman category-claim integrity, developer-experience-index persona golden paths, Diataxis doc coverage, forbidden-copy lint expansion, concierge demand test scaffold)
- **D — Keel-integrity audit** (10-invariant re-verification, gateway-held credential custody for x402 signer, adversarial architecture test promotion, global transition admission matrix at HTTP, mandatory generated-execution-graph for agent-origin compilations)

Comprehensive-scale (target ~10–14 plans). Phase 05 plans assume Phase 04 lands first.

## Current Phase

**Phases 04 and 05 are complete locally** (2026-05-29). Remote ship (PR/merge/npm publish) is deferred until gh and npm credentials are available.

**Phase 04** — service-agent gating: operator golden path, dual-enforcement doctrine, structural HTTP/example gating, tier gates 10/10 + 15/15. See [04-VERIFICATION.md](./phases/04-service-agent-gating/04-VERIFICATION.md).

**Phase 05** — product coherence: deferred lane, live-fetch spine, narrative + forbidden-copy lint, gateway-held x402 custody (Mechanism A), keel audit. See [05-VERIFICATION.md](./phases/05-product-coherence/05-VERIFICATION.md).

## Smallest Next Mechanism

Push branch, open PR, and run remote CI/npm publish when tooling allows. Optional hygiene: pre-existing manifest-coverage and repo-naming-posture test residuals.

---

## Historical Track (legacy `docs/plans/`)

The earlier planning track lived under `docs/plans/`. Retained for provenance; **not the current source of truth**. The active track is `.planning/phases/` above.

**Completed (legacy):**

- `docs/plans/01-plan-eng-review-primitive-fields-state.md`
- `docs/plans/01a-plan-eng-review-protocol-migration.md`

**Current (legacy):**

- `docs/plans/02-plan-eng-review-authority-hardening.md`

**Archived / not executable:**

- `docs/plans/archive/02-plan-eng-review-agent-requirements.md`
- `.planning/archive/agent-native-product-requirements-handoff/*`

**Next (legacy):**

- `docs/plans/03-plan-protected-mcp-cli-preview-deploy.md`

Treat the `docs/plans/` track as historical context for the kernel and authority-hardening work that fed the current `.planning/phases/` track. Do not promote legacy plans into CI names, exports, or product claims without re-anchoring them in the current phase structure.
