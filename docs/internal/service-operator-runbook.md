# Service Operator Runbook

Doc type: How-to

Companion maintenance guide for Branch A service operators (Phase-04 plan `04-02`, D-22).
This runbook does not create authority, greenlights, gateway checks, or mutations.

## Start Here

1. Complete [service-operator-golden-path.md](./service-operator-golden-path.md) once.
2. Keep [service-workflow-story.md](./service-workflow-story.md) vocabulary when writing tickets.
3. Use this runbook when changing HTTP routes, adapter gateway enforcement, or product-completion gates.

## Dual-enforcement checklist

Before any protected mutation ships:

- HTTP admission must scope the caller and transition (middleware).
- The adapter path must run a gateway check before mutation I/O.
- Admission success alone does **not** authorize mutation (see AGENTS.md).

```text
http/admission (identity + transition scope)
  +
adapter.run*Gateway before mutation (route handler enforcement)
```

## Mutation manifest maintenance

Frozen POST inventory lives in `src/http/mutation-route-manifest.ts` (Phase-05 plan `05-01`).
When adding or renaming transition routes:

1. Update `src/http/routes/transition-route-registry.ts` first.
2. Mirror the row in `mutation-route-manifest.ts` with `requiresAdapterGatewayCheck: true`.
3. Run `bun test test/architecture/http-handler-mutation-gating.test.ts`.

Do not treat manifest rows as new surface families — `src/surfaces/boundary-manifest.ts` owns surface ownership.

## Product-completion gate

`dual_enforcement_posture` in product-completion readback audits structural dual enforcement.
Keep gate evidence honest: incomplete until architecture tests prove adapter + admission coupling.

## Failure escalation

| Symptom                         | Likely layer        | Next step                                           |
| ------------------------------- | ------------------- | --------------------------------------------------- |
| 401/403 on transition           | Admission / custody | Verify role credential and transition scope         |
| 409 policy_refused              | Policy              | Read refusal projection; do not retry same contract |
| 409 gateway_refused             | Gateway check       | Inspect gate attempt evidence before mutation       |
| 422 proof_gap                   | Evidence gap        | File proof gap; no silent retry                     |
| Protected mutation without gate | Adapter bypass      | Fix adapter — admission cannot substitute           |

## Non-claims

- Service workflow admission readback is not receipt evidence.
- This runbook does not certify marketplace readiness or cross-org trust.
- Manifest maintenance does not add POST routes by itself.
