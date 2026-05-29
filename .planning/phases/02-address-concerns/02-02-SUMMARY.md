# Plan 02-02 Summary — Manifest drift gate

**Completed:** 2026-05-28  
**Phase:** 02-address-concerns

## What shipped

- Added `test/architecture/manifest-coverage.test.ts`:
  - Product exports (`./hosted-admission`, `./surfaces/*`, `./mcp`, `./x402-protected-tool`) must map to manifest `sourceRoots`.
  - `./cli` covered by union of `cli.operator`, `cli.evidence`, `cli.process` roots.
  - CLI handler implementation files must sit under manifest roots (no `src/cli/` wildcard).
  - In-test negative drift proofs for synthetic export and handler paths.

## Negative drift proof (mandatory)

**Command:** `bun test test/architecture/manifest-coverage.test.ts`

**Observed failure messages:**

- `manifest export coverage failed: export ./surfaces/__manifest_drift_probe__ maps to src/surfaces/__manifest_drift_probe__ but surfaces.a2a_readback sourceRoots do not cover it`
- `manifest CLI handler coverage failed: src/cli/__manifest_drift_probe__.ts is not under any manifest sourceRoots entry`

## CONCERNS update

After Plan 01–02, the "Boundary manifest lags new CLI and package export surfaces" tech-debt row is **partially closed** (backfill + drift gate). Remaining: evidence-type separation and hosted projection slices (Plans 03–05).

## Verification

- `bun test test/architecture/manifest-coverage.test.ts` — pass
- `bun test test/architecture/surface-boundary-posture.test.ts` — pass
