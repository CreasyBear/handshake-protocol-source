# Evidence Plan

## Invariant At Stake

The closeout must prove the architectural correction, not just successful text
edits. Evidence must distinguish research, plan, implementation, test, review,
and residual proof gaps.

## Evidence Artifacts

| Artifact | Purpose |
| --- | --- |
| `runs/20260525T110908Z-architectural-north-star/input.md` | Immutable goal and source boundary |
| `runs/20260525T110908Z-architectural-north-star/research.md` | Primary-source case-study mechanisms |
| `runs/20260525T110908Z-architectural-north-star/source-snapshot.md` | Starting repo/source posture |
| `runs/20260525T110908Z-architectural-north-star/blocked-checks.md` | Preserved proof gaps and stop conditions |
| `runs/20260525T110908Z-architectural-north-star/audits/*.md` | Sidecar pressure reports |
| `runs/20260525T110908Z-architectural-north-star/validation.md` | Command and review closeout |

## Current Evidence

- Current run input, research, research-evidence, source snapshot, blocked
  checks, and five sidecar audits exist.
- Macro-plan validator must be rerun after final plan edits.
- Source/docs/tests implementation evidence is not complete until focused gates
  and `npm run check:repo` run after final changes.

## Command Evidence

Plan validation:

```bash
/Users/joelchan/.codex/skills/gsd-macro-plan/scripts/validate_macro_plan_output.py .planning/macro-plan
```

Focused implementation gates:

```bash
npm run quality:claims
npm run quality:architecture
npm run test -- test/architecture/claim-boundary.test.ts test/architecture/workflow-admission-boundary.test.ts
npm run test -- test/runtime/runtime-ingress.test.ts test/product/service-workflow-admission.test.ts
```

Closeout:

```bash
npm run format:check
npm run check:repo
git status --short --branch
```

## Fixtures Or Examples

- `examples/service-workflow-admission/latest.json` and `latest.md` must remain
  service workflow readbacks, not authority artifacts.
- Product/architecture fixtures must assert Passport, Admission, Handle,
  Clearance, Outcome, and Certificate as projections over existing lifecycle
  entries or explicit pre-contract evidence context.
- Runtime fixtures must cover mixed-family envelope refusal and x402/auth.md
  non-composition, not one composite authority object.

## Readback And Redaction Checks

- Readbacks may include correlation and reconstruction references, including
  digest and presentation/admission/handle IDs, only when those IDs are marked
  non-authority.
- Readbacks must not expose payment material, signer payloads, gateway-held
  credentials, authority tokens, or live provider secrets.
- Redaction must preserve enough structure to reconstruct proposal, policy,
  gateway check, receipt/refusal/proof gap, and terminal certificate posture
  without turning evidence into reusable auth.

## Runtime Proof Artifacts

- Runtime proof must include generated execution shape, runtime posture,
  protected action path, gateway authority holder, raw or sibling bypass
  posture, and surviving receipt/refusal/proof-gap evidence.
- Mixed-family runtime proof must show a same-envelope pass or an explicit
  refusal before one projected workflow readback is assembled.
- x402/auth.md runtime proof must show separate exact contracts or refusal,
  never one composite credential-plus-payment authority artifact.

## Evidence Not Yet Available

- Post-implementation focused test outputs are not available until source/docs
  edits land.
- Full `npm run check:repo` evidence is not available until after focused gates
  pass.
- Hosted/Tier 3 proof remains unavailable by design in this run.
- Live provider custody, native host containment, registry acceptance, and
  marketplace trust remain proof gaps.

## Verification Commands

Use the command matrix above. Record exact outputs in
`runs/20260525T110908Z-architectural-north-star/validation.md`.

## Evidence Success Criteria

- Sidecar findings are resolved or carried as explicit proof gaps.
- Tests require projection-over-spine language and non-authority service
  workflow semantics.
- Full repo gate passes before final implementation closeout.
- Git commits separate macro-plan reset from implementation when possible.

## Replay And Refusal Cases

Evidence must include or preserve tests for replay refusal, policy/runtime
refusal, gateway refusal, stale handle/review refusal, mixed-family envelope
refusal, x402/auth.md non-composition refusal, and proof-gap readback.

## Review Prompts

- Does the diff preserve one authority spine?
- Does any product noun create authority or imply a second lane?
- Are sidecar P0 findings resolved in source/tests or recorded as proof gaps?
- Were focused gates and full repo gate run after final changes?

## Browser Or Visual Evidence

This correction is architecture/source owned, not a finished product UI slice.
Browser evidence is optional unless docs/demo pages or rendered service workflow
readbacks are changed. If visual/browser surfaces are touched, capture:

- rendered service workflow readback showing projection language;
- absence of authority, trusted identity, reusable credential, or badge-style
  permission wording;
- console and route errors for the changed route;
- a note that visual readback is evidence only and not an enforcement boundary.

## Residual Proof Gaps To Preserve

- No live provider custody or settlement finality.
- No hosted operation or hosted org auth.
- No marketplace/certification or cross-org trust.
- No native host containment.
- No finished product UI beyond source-owned docs/schema/demo/readback.
