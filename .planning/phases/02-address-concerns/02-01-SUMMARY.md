# Plan 02-01 Summary — Manifest backfill

**Completed:** 2026-05-28  
**Phase:** 02-address-concerns

## What shipped

- Added `surfaces.a2a_negotiation`, `surfaces.a2a_readback`, `surfaces.service_workflow_admission`, `surfaces.hosted_admission` to `boundary-manifest.ts` with `evidence_only` / `setup_only` posture and explicit claim labels.
- Extended `cli.operator` and `cli.evidence` `sourceRoots` for doctor, quality, simulate, state, x402 helper commands.
- Updated `expectedSurfaceIds` and `modelOrOperatorSurfaces` in `surface-boundary-posture.test.ts`.
- Posture test helper: strip declared non-authority schema literals on evidence-only surfaces so negative-boundary zod fields do not false-positive on `signer` / `receiptExport` substrings.

## existingSurfaceFiles scorecard (CONCERNS closure)

| Surface | Roots | Approx. `.ts` files walked |
|---------|-------|---------------------------|
| surfaces.a2a_negotiation | `src/surfaces/a2a-negotiation-support` | 12 |
| surfaces.a2a_readback | `src/surfaces/a2a-negotiation-readback` | 1 |
| surfaces.service_workflow_admission | `src/surfaces/service-workflow-admission` | 1 |
| surfaces.hosted_admission | `src/hosted-admission` | 4 |
| cli.operator (new paths) | +7 files | 7 added to walk |
| cli.evidence (new paths) | +3 files | 3 added to walk |

## Verification

- `bun test test/architecture/surface-boundary-posture.test.ts`
- `bun test test/architecture/claim-boundary.test.ts`
- `bun test test/architecture/cli-command-posture.test.ts`

## Kernel

No `src/protocol/` transition changes.
