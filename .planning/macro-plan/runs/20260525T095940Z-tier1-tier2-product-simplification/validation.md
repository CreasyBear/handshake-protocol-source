# Validation

## Macro-Plan Validator

Command:

```bash
python3 /Users/joelchan/.codex/skills/gsd-macro-plan/scripts/validate_macro_plan_output.py .planning/macro-plan
```

Observed output:

```text
Macro plan output is valid.
```

## Status Reconciliation

The plan is implementation-ready only for the first bounded Tier 1 story/schema/test slice. It is not a claim that protected-action fixtures, multi-host runtime posture, SDK/CLI/MCP convergence, live rails, hosted operation, or Tier 3 are ready.

Sidecar audit recommendations were reconciled as gates:

- protected-action posture -> field matrix, false authority flags, negative tests, no fixture until surface proof exists;
- runtime-agent posture -> host-specific rows, raw sibling posture, generated-execution stress gates, no containment claim;
- product/DevEx posture -> one source-owned packet, first-use demo later, convergence after schema/tests;
- evidence posture -> validator output and git state must be recorded before implementation;
- slices posture -> full long-running program captured before source edits.

## Git State

`.planning/` is ignored by `.gitignore`, so normal `git status --short` does not show these artifacts. If the user wants planning artifacts committed, they must be force-added deliberately.
