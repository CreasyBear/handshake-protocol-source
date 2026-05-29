# Source Snapshot

## Git

- Branch: `main`
- Starting status: clean, ahead of `origin/main` by 8 commits.

## Canonical Boundary Observed

- `STRUCTURE.md` says this repo is a TypeScript protocol kernel and defines
  product surfaces as non-authority CLI/MCP/SDK/docs/demos/readbacks.
- `docs/internal/decisions.md` defines the shared product/protocol vocabulary
  and makes `ServiceWorkflowAdmission` / `ServiceWorkflowHandle` non-authority
  records.
- `docs/internal/protocol-notes.md` currently has a "Product And Protocol
  Language" section that can be sharpened into projection-over-spine language.
- `docs/internal/service-workflow-story.md` currently says the story is a
  product surface over the protocol kernel. This is directionally right but
  should be recast as a projection/readback over one event spine.
- `src/surfaces/LANE.md` correctly blocks authority behavior, but the lane name
  can still be mistaken for a peer product truth lane unless docs say surfaces
  are implementation boundaries for projections.

## Implementation Targets

- `README.md`
- `STRUCTURE.md`
- `docs/internal/decisions.md`
- `docs/internal/protocol-notes.md`
- `docs/internal/service-workflow-story.md`
- `src/surfaces/LANE.md`
- `test/architecture/claim-boundary.test.ts`

## Current Proof Gates

- `npm run quality:claims`
- `npm run quality:architecture`
- `npm run test -- test/architecture/claim-boundary.test.ts test/architecture/workflow-admission-boundary.test.ts`
- `npm run check:repo`
