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
- Source/docs/tests implementation remains open under `NPLAN-002` through
  `NPLAN-006`.
- Full repo closeout is not available yet.

## Proof Gaps Preserved

- Runtime same-envelope and x402/auth.md non-composition still need focused
  implementation/test evidence.
- Source-owned projection map still needs implementation.
- Full repo quality gate still needs post-implementation evidence.
