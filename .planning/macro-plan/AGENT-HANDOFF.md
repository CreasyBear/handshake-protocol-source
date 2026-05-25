# Agent Handoff

## Objective

Implement the Tier 1/Tier 2 Handshake product simplification program in order, starting with the non-authority service workflow story and surface contract. The user wants the macro plan completed first, then implementation. The first executable slice is deliberately small in code footprint but strict in proof: create the simplified product surface without creating authority.

## Source Boundary

Read these first, in this order:

1. `AGENTS.md`
2. `README.md`
3. `QUALITY.md`
4. `STRUCTURE.md`
5. `docs/internal/decisions.md`
6. `docs/internal/protocol-notes.md`
7. `docs/internal/protocol-layman.md`
8. `.planning/macro-plan/MACRO-PLAN.md`
9. `.planning/macro-plan/EXECUTION-SLICES.md`
10. `.planning/macro-plan/PROTECTED-ACTION-GATES.md`
11. `.planning/macro-plan/RUNTIME-GATES.md`
12. `.planning/macro-plan/TASKS.jsonl`

`.planning/` is scratch except for this active execution handoff. Use it as planning evidence, not repo-facing product truth.

## Runtime Profile

Primary runtime is Codex in a workspace-write checkout with restricted network. Use `apply_patch` for edits. Use `rg` for discovery. Use focused tests before broad gates. Preserve dirty worktree state as user-owned.

Multi-host posture is evidence-only: Codex, Claude Code, Hermes, OpenClaw, MCP, browser, A2A, OpenAPI, auth.md, and x402 do not share one runtime model. Do not claim native containment for any host from this plan.

## Instruction Sources

- `AGENTS.md`: invariant and doctrine.
- `QUALITY.md`: naming, quality, and boundary gates.
- `STRUCTURE.md`: source ownership.
- `docs/internal/*`: current product/protocol canon.
- `src/*/LANE.md`: lane ownership before source edits.
- `.planning/macro-plan/*`: execution program and stop conditions.

## Context Bundle

Core product move:

```text
Passport -> evidence package the agent presents
ServiceWorkflowAdmission -> service-side accepted/refused/stale/proof-gap mapping
ServiceWorkflowHandle -> carried non-authority workflow context
Action Request -> fresh CandidateAction / ActionContract
Clearance -> PolicyDecision + one-use Greenlight/Refusal + GatewayCheck
Outcome -> Receipt / Refusal / ReplayRefusal / ProofGap / AuthorityCertificate
```

Non-authority IDs:

```text
passportPackageDigest
passportPresentationId
admissionId
serviceWorkflowHandleId
serviceWorkflowHandleDigest
```

All are correlation/reconstruction refs only.

## Ignored Context

Ignore older `.planning/macro/runs/20260525T141206-service-gateway-principal-agent-link/final/*` as a governing source. Treat historical Tier 3 plans as boundary reminders only. Do not use `.planning/` labels in repo-facing source, package scripts, public exports, or canonical docs.

## Tool Contract

Allowed:

- read source, docs, tests, and planning artifacts;
- edit tracked docs, `src/surfaces`, architecture/product tests, examples, and narrowly related exports when required by the active slice;
- execute focused quality gates;
- use up to five subagents only when the user explicitly asks for delegation or sidecar work.

Forbidden:

- direct protected mutations outside user-authorized shell commands;
- broad network research unless requested or required for current unstable facts;
- rewriting protocol kernel state unless a slice proves a distinct enforceable transition;
- treating CLI, MCP, SDK, runtime ingress, docs, review screens, examples, certificates, passport IDs, or workflow handles as authority.

## Subagent Topology

Use sidecars only for non-overlapping review or implementation scopes:

- product/docs;
- surface/schema;
- architecture tests;
- runtime/agent negative tests;
- evidence/release gate.

No sidecar owns final authority claims, final plan status, or Tier 3 promotion.

## Protected-Action Boundary

Admission and handle stop before policy. Every protected action still requires:

```text
CandidateAction
ActionContract
PolicyDecision
one-use Greenlight or Refusal
GatewayCheckAttempt
Receipt / Refusal / ProofGap
```

If a gateway cannot enforce before consequence, this is advisory, not Handshake.

## Checkpoints

- After macro-plan validation: git checkpoint.
- After Tier 1 story/schema/tests pass focused gates: git checkpoint.
- After docs convergence passes claims/format checks: git checkpoint.
- After Tier 2 example/runtime gates pass: git checkpoint.
- Before any Tier 3 work: stop and report proof state.

## Stop Conditions

Stop immediately if:

- a Passport, Admission, Badge, or Handle object creates authority;
- `ServiceWorkflowHandle` is accepted as policy/gateway/signer/mutation evidence;
- raw credential, token, private key, `PaymentPayload`, or `PAYMENT-SIGNATURE` appears in passport/admission/handle records;
- a rendered review or docs summary is treated as permission;
- x402/auth.md fixture work precedes non-authority surface tests;
- Tier 3 work starts before Tier 1/Tier 2 proof gates close.

## Evaluation Path

Start narrow:

```bash
npm run quality:claims
npm run quality:architecture
```

Then run focused slices:

```bash
npm run test -- test/protocol/kernel-compilation-contract.test.ts test/protocol/kernel-policy-gateway.test.ts test/protocol/evidence-projections.test.ts test/runtime/runtime-ingress.test.ts
```

Use `npm run check:repo` before claiming implementation closeout.

## Proof Gaps

- No source-owned service workflow admission schema exists yet.
- No negative tests yet prove the five non-authority IDs cannot create authority.
- No local service workflow example exists yet.
- No live provider custody, settlement, hosted operation, or native host containment is proven.

## Non-Claims

This handoff does not authorize Tier 3, hosted operation, provider custody, settlement finality, marketplace trust, cross-org trust, broad x402 compatibility, aggregate spend enforcement, broad runtime interception, or native host containment.

## Next Agent Step

Implement Slice T1-01 and T1-02 together only far enough to make the boundary testable: add `docs/internal/service-workflow-story.md`, add `src/surfaces/service-workflow-admission.ts`, then add or update architecture tests so the new surface is provably non-authority.
