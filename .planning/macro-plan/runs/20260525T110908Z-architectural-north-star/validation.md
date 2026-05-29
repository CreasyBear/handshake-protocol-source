# Validation

## Invariant At Stake

Validation must prove the macro plan is structurally complete before the
implementation starts. It does not prove source implementation, runtime
enforcement, hosted operation, provider custody, or product UX completion.

## Macro-Plan Validator

Command:

```bash
python3 /Users/joelchan/.codex/skills/gsd-macro-plan/scripts/validate_macro_plan_output.py .planning/macro-plan
```

Result:

```text
Macro plan output is valid.
```

## Status

- `NPLAN-001` is complete for planning structure and sidecar incorporation.
- `NPLAN-002` through `NPLAN-005` are implemented in source/docs/tests.
- `NPLAN-006` has full repo gate evidence and is ready for implementation
  commit closeout.

## Focused Implementation Gates

Command:

```bash
npm run test -- test/architecture/service-workflow-lifecycle-projection.test.ts test/architecture/surface-boundary-posture.test.ts test/architecture/claim-boundary.test.ts test/architecture/workflow-admission-boundary.test.ts
```

Result:

```text
21 pass
0 fail
```

Command:

```bash
npm run test -- test/runtime/runtime-ingress.test.ts test/runtime/auth-md-candidate-compilation.test.ts test/product/service-workflow-admission.test.ts
```

Result:

```text
32 pass
0 fail
```

## Quality Gates

Commands and results:

```text
npm run quality:claims
4 pass, 0 fail

npm run quality:architecture
68 pass, 0 fail

npm run format:check
All matched files use Prettier code style.
```

Full repo gate:

```bash
npm run check:repo
```

Result:

```text
build, check:types, lint, format:check, test, pack:check, and git diff --check passed.
bun test: 621 pass, 0 fail.
pack:check: package surface, clean installed activation, release proof, and npm maintainer posture passed.
```

## Proof Gaps Preserved

- Hosted/Tier 3 operation remains blocked pending separate hosted workspace or
  fresh pre-hosted kernel task.
- Live provider custody, settlement finality, marketplace trust, cross-org
  trust, retention/search, and native host containment are still non-proofs.
- x402/auth.md composition is covered as refusal for separate envelopes; no
  composite credential-plus-payment authority artifact is created.
