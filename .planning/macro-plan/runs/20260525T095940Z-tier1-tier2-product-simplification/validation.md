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

## Implementation Checkpoints

T1-01 through T1-03 landed in source as the service workflow story, non-authority
admission/handle surface, and workflow-admission boundary tests. Verified gates:
focused workflow boundary test, `npm run quality:claims`,
`npm run quality:architecture`, `npm run format:check`, `git diff --check`, and
full `npm run check:repo`.

T1-04 landed canonical-doc convergence for the simplified flow. Verified gates:
`npm run quality:claims`, `npm run quality:architecture`,
`npm run format:check`, and `git diff --check`.

T2-01 landed active CLI, MCP, and SDK surface alignment only. It did not add
commands, MCP authority tools, SDK methods, package-root exports, policy,
gateway, signer, mutation, receipt export, or terminal certificate behavior.
Verified gates:

```bash
npm run test -- test/architecture/cli-command-posture.test.ts test/architecture/mcp-surface-posture.test.ts test/cli/cli-evidence.test.ts
npm run test -- test/architecture/mcp-surface-posture.test.ts test/mcp/mcp-schema-contract.test.ts test/mcp/mcp-resource-redaction.test.ts test/mcp/mcp-x402-proposal.test.ts test/architecture/workflow-admission-boundary.test.ts
npm run test -- test/architecture/root-exports.test.ts test/sdk/role-clients.test.ts test/architecture/package-surface.test.ts test/architecture/workflow-admission-boundary.test.ts
npm run check:types
npm run quality:architecture
npm run quality:claims
npm run format:check
git diff --check
```

Open next slice: MPLAN-007 / T2-02 local service workflow admission example.
