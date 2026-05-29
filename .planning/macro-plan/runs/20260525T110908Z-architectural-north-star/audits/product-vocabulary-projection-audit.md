## Audit Scope

Assigned focus: product-vocabulary-projection-audit for the current Handshake gsd-macro-plan correction.

This audit covers product vocabulary around `product surface`, `protocol kernel`, service workflow, `Passport`, `ServiceWorkflowAdmission`, `ServiceWorkflowHandle`, `Handle`, `Outcome`, `AuthorityCertificate`, `Certificate`, `Badge`, `Clearance`, product lane, and protocol lane.

This report is a sidecar audit only. It does not select the macro move, synthesize the final plan, promote final status, or convert protected-action proof gaps into authority.

## Source Boundary

Canonical source boundary:

- `README.md`
- `STRUCTURE.md`
- `QUALITY.md`
- `docs/internal/decisions.md`
- `docs/internal/protocol-notes.md`
- `docs/internal/protocol-layman.md`
- `docs/internal/protocol-definition.md`
- `docs/internal/protocol-kernel-architecture.md`
- `docs/internal/service-workflow-story.md`
- `src/protocol/LANE.md`
- `src/surfaces/LANE.md`
- `src/surfaces/boundary-manifest.ts`
- `src/surfaces/outcome.ts`
- `src/surfaces/service-workflow-admission/index.ts`
- `src/cli/LANE.md`
- `src/cli/command-manifest.ts`
- `src/cli/output.ts`
- `src/mcp/LANE.md`
- `src/mcp/catalog.ts`
- `src/mcp/output.ts`
- `src/sdk/LANE.md`
- architecture and product tests listed below.

Derived planning source boundary:

- `.planning/macro-plan/MACRO-PLAN.md`
- `.planning/macro-plan/DECISIONS.md`
- `.planning/macro-plan/EXECUTION-SLICES.md`
- `.planning/macro-plan/PROTECTED-ACTION-GATES.md`

`.planning/` remains scratch. It can reveal current correction intent, but it is not repo-facing source truth.

## Files Read

- `README.md`
- `STRUCTURE.md`
- `QUALITY.md`
- `docs/internal/decisions.md`
- `docs/internal/protocol-notes.md`
- `docs/internal/protocol-layman.md`
- `docs/internal/protocol-definition.md`
- `docs/internal/protocol-kernel-architecture.md`
- `docs/internal/service-workflow-story.md`
- `src/protocol/LANE.md`
- `src/surfaces/LANE.md`
- `src/surfaces/boundary-manifest.ts`
- `src/surfaces/outcome.ts`
- `src/surfaces/service-workflow-admission/index.ts`
- `src/cli/LANE.md`
- `src/cli/command-manifest.ts`
- `src/cli/output.ts`
- `src/mcp/LANE.md`
- `src/mcp/catalog.ts`
- `src/mcp/output.ts`
- `src/sdk/LANE.md`
- `examples/service-workflow-admission/run.ts`
- `test/architecture/claim-boundary.test.ts`
- `test/architecture/self-hosted-activation-claim-boundary.test.ts`
- `test/architecture/workflow-admission-boundary.test.ts`
- `test/architecture/active-vocabulary.test.ts`
- `test/architecture/naming-posture.test.ts`
- `test/architecture/surface-boundary-posture.test.ts`
- `test/architecture/cli-command-posture.test.ts`
- `test/architecture/mcp-surface-posture.test.ts`
- `test/architecture/root-exports.test.ts`
- `test/product/service-workflow-admission.test.ts`
- `.planning/macro-plan/MACRO-PLAN.md`
- `.planning/macro-plan/DECISIONS.md`
- `.planning/macro-plan/EXECUTION-SLICES.md`
- `.planning/macro-plan/PROTECTED-ACTION-GATES.md`

## Invariant At Stake

Product nouns must be projections, readbacks, or correlation context only. They must not become a second protocol truth, reusable authority, credential posture, policy result, gateway pass, signer permission, receipt export, terminal certificate, retry grant, or widened operating envelope.

Current vocabulary inventory:

| Vocabulary | Current safe meaning | Boundary |
| --- | --- | --- |
| `protocol kernel` | Source-owned state machine and schema set for exact contracts, policy decisions, one-use greenlights, gateway checks, receipts, refusals, proof gaps, isolation, and terminal certificates. | Canonical behavior source only. |
| `product surface` | Canon says CLI/MCP/SDK/docs/demo/service-facing readback exposing proposal/evidence/readback without creating authority. | Currently ambiguous because some SDK role clients are transition clients. |
| `src/surfaces` / product lane | Source-owned boundary manifests and non-authority outcomes for non-kernel product surfaces. | Must not evaluate policy, issue greenlights, perform gateway checks, mutate, mint certificates, export receipts, certify trust, host operation, or read raw records. |
| `src/protocol` / protocol lane | Protocol authority semantics and transition invariants. | Must not own product surface metaphors or service workflow projections. |
| `Passport` | Presented evidence package. | Not identity, trust, spend approval, signer access, permission, or reusable auth. |
| `ServiceWorkflowAdmission` / Admission | Service-side accepted/refused/stale/proof-gap mapping of presented evidence. | Not policy, greenlight, gateway check, receipt, certificate, or mutation permission. |
| `ServiceWorkflowHandle` / Handle | Correlation and readback context for later proposals. | Not badge, bearer token, tool permission, retry permission, x402 payment approval, auth.md credential, or gateway pass. |
| `Clearance` | Shorthand for one fresh protected-action chain. | Must not become a workflow-level permission or standalone artifact. |
| `Outcome` | Readback over receipt, refusal, replay refusal, proof gap, or terminal certificate after the event path. | Not downstream success or future permission. |
| `AuthorityCertificate` / Certificate | Terminal evidence after receipt/refusal/proof-gap/replay-refusal. | Not permission, identity, settlement, hosted trust, cross-org trust, or reusable auth. |
| `Badge` | Optional narrative anti-pattern/shorthand only. | Should not become schema, API, route, export, protocol object, or bearer-token metaphor. |

## Pass Conditions

- The phrase `product surface` cannot imply both non-authority readback and authority-bearing protocol transition clients.
- Product nouns are allowed only in docs/story, `src/surfaces/service-workflow-admission`, local readback/demo output, CLI/MCP/SDK explanatory lane text, and explicit negative tests.
- `Passport`, Admission, Handle, Badge, Clearance, Outcome, and Certificate cannot satisfy `ActionContract`, `PolicyDecision`, `Greenlight`, `GatewayCheck`, signer, credential, mutation, receipt, certificate mint, or operating-envelope requirements.
- `Badge` remains absent from source/API/export/route vocabulary except negative language.
- `Clearance` is always expanded to the exact protected-action chain before any authority claim.
- `Outcome` is always readback over terminal evidence and must distinguish gateway evidence from downstream business success.
- Architecture tests scan authority-bearing lanes, not only protocol areas and adapter/runtime roots.

## Failures

Confusing/unsafe language with file references:

1. P0: `product surface` is overloaded. Canon says product surfaces are non-authority readbacks (`README.md:15-18`, `STRUCTURE.md:9-12`, `docs/internal/decisions.md:42-48`, `docs/internal/protocol-notes.md:13-22`), but `src/surfaces/boundary-manifest.ts:66-72` includes `policy_authority`, and `sdk.policy` may write policy decisions (`src/surfaces/boundary-manifest.ts:296-365`). `README.md:94-100` also teaches `PolicyClient.evaluatePolicy()` as a role-scoped client. That creates dual truth: "SDK product surface" can mean readback-only or policy-authority transport.

2. P1: `Clearance` is too artifact-shaped unless always expanded. `README.md:22-37`, `docs/internal/service-workflow-story.md:10-25`, and `docs/internal/protocol-layman.md:37-55` are mostly safe, but the demo invariant says "fresh protected-action clearance carries authority" (`examples/service-workflow-admission/run.ts:91-97`). That phrasing can make `Clearance` sound like a reusable grant rather than shorthand for exact contract -> policy -> one-use greenlight/refusal -> gateway check.

3. P1: `Badge` is still present as a narrative noun without an architecture guard that bans it from schema/API/export/route names. Current source use is bounded negative language (`docs/internal/service-workflow-story.md:23`, `docs/internal/service-workflow-story.md:94`, `docs/internal/protocol-layman.md:53-55`, `src/mcp/LANE.md:86-88`), but no current test scans for `Badge` as a future source/export/route noun.

4. P1: Workflow-admission tests are strong at object shape but too narrow on placement. `test/architecture/workflow-admission-boundary.test.ts:17-35` scans exact service-workflow names out of `src/protocol/areas`, `src/adapters`, `src/runtime/ingress`, and `src/mcp`, but it does not scan `src/sdk/surface-clients/policy-client.ts`, `src/sdk/surface-clients/gateway-client.ts`, `src/http/routes`, `src/http/handlers`, `src/http/admission`, `src/protocol/public`, root exports, CLI commands, or package metadata for standalone `Passport`, `Admission`, `Badge`, `Handle`, `Clearance`, or `Outcome` drift.

5. P1: `Outcome` is split across product story and reusable surface schema without an explicit vocabulary guard. `docs/internal/service-workflow-story.md:24-25` correctly defines Outcome as terminal readback, and `src/surfaces/outcome.ts:59-86` enforces non-authority flags. But there is no dedicated guard that product `Outcome` cannot be used as downstream success, retry permission, or a second terminal record apart from `Receipt`/`Refusal`/`ProofGap`/`AuthorityCertificate`.

6. P1: `Certificate` is generally well bounded, but product copy must keep saying terminal evidence. The current claim-boundary test covers "certificate is terminal evidence, not permission" (`test/architecture/claim-boundary.test.ts:128-147`), and protocol notes are strict (`docs/internal/protocol-notes.md:388-416`). The residual risk is UX/product copy turning Certificate into Passport/Badge shorthand, explicitly forbidden in `docs/internal/service-workflow-story.md:94`.

## Proof Gaps

- No user-comprehension evidence proves that `Passport`, `Handle`, `Clearance`, or `Certificate` will not be interpreted as identity, permission, or reusable auth.
- No current guard proves `Badge` cannot enter future route names, exported symbols, package surfaces, or public examples.
- No current guard proves product projection nouns are excluded from authority-bearing SDK clients, HTTP transition routes, gateway clients, policy clients, or protocol public exports.
- No test currently enforces a taxonomy split between non-authority product projection/readback surfaces and role-scoped protocol transition clients.
- No tests were run in this audit; product demo tests can write generated outputs, so I inspected them read-only instead.

## Required Changes

Recommended canonical wording:

- Replace broad `product surface` with two terms:
  - `product projection surface`: CLI, MCP, SDK evidence/readback, docs, demos, and service-facing readbacks that expose proposal/evidence/readback without creating authority.
  - `role-scoped protocol transition client`: SDK/HTTP client surface that transports a specific protocol transition under a custody role. It may call policy or gateway routes only when the protocol kernel/gateway path owns the authority.
- Keep `protocol kernel` as: "the source-owned state machine and schema set for exact contracts, policy decisions, one-use greenlights, gateway checks, receipts, refusals, proof gaps, isolation, and terminal certificates."
- Define service workflow as: "`Passport -> ServiceWorkflowAdmission -> ServiceWorkflowHandle -> request one fresh protected-action clearance -> read terminal outcome` is a projection/readback story, not a protocol state path."
- Define `Passport`: "presented evidence package only; not identity, trust, approval, signer access, spend approval, permission, or reusable auth."
- Define `ServiceWorkflowAdmission`: "service-side evidence mapping only; not policy, greenlight, gateway check, receipt, certificate, or mutation permission."
- Define `ServiceWorkflowHandle`: "correlation/readback context only; not bearer token, badge, retry permission, payment approval, credential posture, gateway pass, or operating-envelope expansion."
- Define `Clearance`: "shorthand for one fresh `ActionContract -> PolicyDecision -> one-use Greenlight/Refusal -> GatewayCheck` path; not a record, token, reusable grant, workflow permission, or product object."
- Define `Outcome`: "readback over `Receipt`, `Refusal`, `ReplayRefusal`, `ProofGap`, or terminal `AuthorityCertificate`; not downstream business success or future permission."
- Define `AuthorityCertificate`: "terminal evidence only; never Passport, Badge, identity, settlement, hosted trust, cross-org trust, permission, or reusable auth."
- Define `Badge`: "do not use as an API/schema/route/export noun; if it remains in narrative copy, it must appear only as a forbidden interpretation of `ServiceWorkflowHandle`."

Tests/guards to add or change:

- Add a product-vocabulary projection guard under `test/architecture`, scanning repo-facing files for standalone `Passport`, `Admission`, `Badge`, `Handle`, `Clearance`, `Outcome`, and `Certificate` usage. Allow only approved files and require nearby negative boundary language.
- Extend `workflow-admission-boundary.test.ts` authority roots to include `src/sdk/surface-clients/policy-client.ts`, `src/sdk/surface-clients/gateway-client.ts`, `src/http/routes`, `src/http/handlers`, `src/http/admission`, `src/protocol/public`, `src/index.ts`, `src/experimental.ts`, `package.json`, and `server.json`.
- Add a guard that `Badge` cannot appear in TypeScript source except generated-negative-test strings, and cannot appear in exported symbols, command IDs, route names, schemas, package subpaths, or MCP tool/resource names.
- Add a guard that every use of `Clearance` in docs/examples is adjacent to `ActionContract`, `PolicyDecision`, `Greenlight`, and `GatewayCheck`, or else uses "request clearance" as a non-artifact action phrase.
- Add a guard that product `Outcome` cannot be paired with `downstreamSuccess`, `retry permission`, `future permission`, `business success`, or a new protocol object outside existing receipt/refusal/proof-gap/certificate objects.
- Update claim-boundary tests to require the new taxonomy: `product projection surface` is non-authority; `role-scoped protocol transition client` is a transport over protocol authority, not a product noun projection.
- Add root-export tests that `ServiceWorkflowAdmission`/`ServiceWorkflowHandle` stay off package root unless deliberately exposed through a projection-only subpath with explicit non-authority flags. If root export is intentional, the test must assert no policy/gateway/receipt/certificate/export material accompanies it.

P0/P1 risks and stop conditions:

- P0 stop: any plan or source change that says a product surface creates authority without naming the protocol transition and gateway boundary.
- P0 stop: `Passport`, Admission, Handle, Badge, Clearance, Outcome, or Certificate is accepted as sufficient input for policy, gateway, signer, mutation, receipt export, certificate mint, or operating-envelope expansion.
- P0 stop: role-scoped SDK policy/gateway authority is described as ordinary product surface authority rather than protocol transition transport.
- P1 stop: `Badge` appears in API/schema/export/route/package names.
- P1 stop: `Clearance` is used as a token/record/grant noun rather than a shorthand for the exact protected-action chain.
- P1 stop: readback copy collapses gateway check evidence and downstream business success.
- P1 stop: tests guard prose only while source exports or route names can still imply authority.

Brutal verdict:

Keep the service-workflow projection model. Cut the ambiguous umbrella use of `product surface`. Redesign the vocabulary taxonomy so product nouns are projections/readbacks only, while authority-bearing SDK/HTTP operations are called role-scoped protocol transition clients. Without that split, the repo can truthfully say "product surfaces create no authority" while also shipping `sdk.policy` as policy authority. That is a vocabulary bug with authority consequences.

## Status Recommendation

Recommend `NEEDS_REQUIRED_CHANGES` for product-vocabulary correction.

Do not promote this macro-plan correction to final-ready until the taxonomy split and vocabulary guards are added. The source implementation is mostly disciplined, but the current wording still permits dual product/protocol truth at the SDK surface boundary.

## Commands Or Tools Used

- Read skills: `handshake-grounding`, `gsd-macro-plan`.
- `pwd`
- `git status --short --branch`
- `rg --files ...`
- `wc -l ...`
- `rg -n ...`
- `nl -ba ...`
- `find .planning/macro-plan/runs/20260525T110908Z-architectural-north-star ...`
- `ls -la .planning/macro-plan/runs/20260525T110908Z-architectural-north-star/audits`
- `apply_patch` to write this report only.

No tests were executed. I preserved the read-only constraint except for this audit report.
