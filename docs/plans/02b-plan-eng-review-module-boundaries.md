# Plan Eng Review 02b: Module Boundary Checkpoint

Status: Implemented boundary checkpoint
Version: v0.2.4 boundary implementation checkpoint
Audience: Protocol implementers, SDK authors, runtime builders, gateway owners, platform engineering, security engineering
Implementation status: Implemented for local alpha; record-read custody/objectType validation, transition route registry/OpenAPI parity, per-role SDK tokens, and root export curation are covered. ADR 0005 hosted caller identity and redacted public evidence reads remain deferred.
Canonical owner: Protocol owner
Follows: [`02-plan-eng-review-authority-hardening.md`](./02-plan-eng-review-authority-hardening.md)
References: [`../adr/0001-kernel-evidence-boundaries.md`](../adr/0001-kernel-evidence-boundaries.md), [`../adr/0005-hosted-transition-caller-identity.md`](../adr/0005-hosted-transition-caller-identity.md)
Blocks: no longer blocks local `03` planning; hosted/public `03` claims remain blocked on ADR 0005 hosted caller identity and redacted evidence APIs
Last reviewed: 2026-05-18

## Invariant At Stake

Schema, evidence, route, SDK, and export surfaces must not outrun the authority path.

Handshake can record runtime evidence, posture evidence, review evidence, caller-custody evidence, and fixture evidence. None of that is mutation authority. The only authority path remains:

```text
exact ActionContract
  -> PolicyDecision
  -> one-use Greenlight
  -> GatewayCheckAttempt before mutation
  -> Receipt, refusal, or ProofGap
```

## Decision

Replace the old `02b` freeze document with a narrower module-boundary checkpoint.

ADR 0001 is now implemented. The old facts that blocked the tree are obsolete:

- `RuntimeExecutionRecord`, `ProtectedPathPosture`, and `ReviewArtifactRecord` are transition-created and tested.
- Current protected-path posture is stored append-only and indexed atomically.
- Policy and gateway checks bind required posture without replacing the gateway.
- Review approval binds through `ReviewArtifactRecord` digest evidence.
- Local preview deploy remains fixture proof only.
- HTTP transition routes now require caller-custody bearer tokens before parsing POST bodies.
- The tree is green on test, typecheck, build, and whitespace checks.

The stale false closure is removed: `02b` is not complete just because caller custody
exists on POST transitions and the internal record-read route. The remaining `03`
risk is boundary hygiene:

```text
Do not let internal implementation modules, debug read routes, or static caller
tokens become accidental public API or hosted security claims.
```

Integration decision:

1. Keep `GET /v0.2/records/:objectType/:objectId` only as an `internal_debug`
   route for local/control-plane inspection. It already requires `control_plane`
   caller custody. It must validate `objectType` before storage reads and stay
   out of public OpenAPI until a redacted public receipt/evidence read API is
   designed.
2. Add a metadata-only transition route registry consumed by both Hono route
   binding and OpenAPI security so route custody and published metadata cannot
   drift independently.
3. Treat the package root as a curated alpha API surface. Before `03`, add an
   explicit export posture table and a root export snapshot test. Transition
   internals, recorder internals, event builders, and storage internals must not
   remain accidentally public without an explicit `internal` or `experimental`
   decision.
4. Add a route-role completeness test before any new transition route is added.
   If a route can create records or touch authority-adjacent state, it must have
   a custody role and OpenAPI security posture from the same source of truth.

## Step 0: Scope Challenge

### What Already Solves The Sub-Problems

| Sub-problem | Existing mechanism | Reuse verdict |
|---|---|---|
| Lifecycle authority | `HandshakeKernel` facade plus protocol transition modules | Reuse; do not create route-local lifecycle semantics. |
| Durable evidence | `ProtocolRecorder.commitRecordsWithEvents` and `ProtocolStore` | Reuse; evidence records must stay transition-created. |
| Current posture | D1/memory current-posture index plus append-only posture records | Reuse; do not add a second mutable posture source. |
| HTTP transport | Hono app + OpenAPI + SDK client | Reuse; only add route posture metadata or auth wrappers. |
| Caller custody | `src/http/caller-auth.ts` and role-specific bearer tokens | Reuse for local/control-plane alpha; replace with ADR 0005 `TransitionCallerIdentity` before hosted multi-tenant use. |
| Gateway mutation | package-install, repo-write, and local preview-deploy adapters | Reuse as reference seams; do not move mutation into runtime wrappers. |
| Verification | Hono/D1 tests, invariant tests, active vocabulary guard, authority scans | Reuse; add narrow tests for any boundary change. |

### Minimum Set Before `03`

`03` can proceed only after the strict sequence is satisfied:

```text
02b boundary hardening
  -> 02c-A transition request context
  -> 02c-B operation lifecycle, claims, orphan handling, adapter conformance
  -> 03 adapter-backed generated execution claims
```

Hard-stop items for this slice:

1. Keep `control_plane` custody on `GET /v0.2/records/:objectType/:objectId`
   and validate `objectType` before raw record lookup.
2. Keep that route out of public OpenAPI unless redaction and consumer semantics
   are explicitly designed.
3. Curate the root package export surface now. Keep public SDK/app/schema/input/verified-gate surfaces; expose reference adapters only as explicitly experimental; remove storage, recorder, transition, kernel, and event internals from the root.
4. Add tests for per-role SDK token routing, fallback token behavior, OpenAPI
   security parity, route custody completeness, debug `objectType` validation,
   and root public import smoke coverage.

Static transition bearer tokens are acceptable only for the local alpha fixture
boundary. ADR 0005's server-derived `TransitionCallerIdentity` is required
before hosted multi-tenant deployment, but it does not need to block local `03`
fixture work if the plan states that limit.

### Complexity Check

The current implementation touches more than eight files because ADR 0001 was a full evidence-boundary expansion. That is already done and verified. For `02b`, the next changes should be deliberately small:

```text
metadata-only route registry
internal-debug objectType validation
root export curation
per-role SDK token/fallback tests
route custody/OpenAPI completeness tests
```

If the next implementation touches broad protocol lifecycle modules again, it is probably scope creep.

### Search Check

- [Layer 1] Hono has a built-in bearer-auth middleware for a single token-style route guard: <https://hono.dev/docs/middleware/builtin/bearer-auth>.
- [Layer 3] Handshake needs role-specific custody by transition lane, so the current small custom caller-custody function is defensible. It is explicit, typed, and easier to audit than hiding role selection in route-local middleware closures.
- [Layer 1] OWASP API Security keeps authorization and authentication as distinct API risks: <https://owasp.org/API-Security/editions/2023/en/0x00-header/>. This supports ADR 0001's non-claim: bearer tokens guard entrypoints; they are not principal authority or object-level authorization.

### TODO Cross-Reference

No `TODOS.md` exists in this repo. This review captures potential follow-up TODOs in the final section instead of silently creating vague backlog items.

### Completeness Check

The complete version is still small enough to "boil the lake": add route posture enforcement and export posture tests/docs now, instead of letting accidental API surface leak into `03`.

## Current-State Evidence

Verification on 2026-05-18 after ADR 0001 and caller custody checks:

```bash
bun test
npm run typecheck -- --pretty false
npm run build -- --pretty false
git diff --check
rg -n -i "best[- ]effort|advisory only|approval only|ambient authority|runtime permission|dashboard-first|provider-side enforcement|provider enforcement|route bearer token is .*authority|transition bearer token is .*authority" README.md docs/index.md docs/protocol/protocol-kernel.md docs/protocol/api-protocol.md docs/product/non-claims-and-theatre.md docs/adr src test
rg -n -i "local preview-deploy fixture (proves|is|provides).*provider|preview deploy.*provider-side enforcement|provider-side enforcement.*preview deploy" README.md docs/index.md docs/protocol/protocol-kernel.md docs/protocol/api-protocol.md docs/product/non-claims-and-theatre.md docs/adr src test
```

Observed result:

- `bun test`: 85 pass, 0 fail, 589 assertions.
- `npm run typecheck -- --pretty false`: pass.
- `npm run build -- --pretty false`: pass.
- `git diff --check`: pass.
- Authority and preview-provider scans hit only explicit non-claim/theatre language.

## Architecture Review

### Issue 1: Broad Record-Read Route Must Stay Internal

`GET /v0.2/records/:objectType/:objectId` exists in `src/http/app.ts` and is not represented in OpenAPI. It now runs through `control_plane` caller custody before reading storage.

That is acceptable only as a local/internal debug path. In hosted or shared environments it can expose raw protocol records, including evidence refs, non-secret parameters, review artifacts, proof gaps, and operational metadata.

Decision: keep the route as `internal_debug`, require `control_plane` custody, and keep it out of OpenAPI. Do not present it as a public evidence API.

```text
client
  -> GET /v0.2/records/:type/:id
  -> D1ProtocolStore.getRecord(...)
  -> raw protocol record
```

Failure scenario if this regresses: a runtime caller with network access can fetch records outside its intended run or tenant by guessing object IDs. No mutation occurs, but reconstruction evidence leaks.

### Issue 2: Root Package Exports Still Treat Internals As Public API

`src/index.ts` exports transition modules, recorder/store internals, storage adapters, and protocol implementation helpers from the package root.

This creates accidental API commitments and lets downstream code bypass the intended public surface. It also makes future refactors more expensive because Hyrum's Law turns every export into a contract.

Decision: before `03`, classify root exports into:

```text
public:       SDK client, stable schemas/types, gateway adapter interfaces
experimental: local preview fixture and evidence-boundary alpha helpers
internal:     transition functions, recorder, store internals, event builders
```

The fastest safe implementation is a docs-backed export map plus a root export snapshot test. A deeper package split can wait.

### Issue 3: Static Caller Tokens Are Local Alpha Custody, Not Hosted Auth

The new route guard is useful and correct for local alpha custody, but it is not organization-scoped authorization. ADR 0001 says this plainly.

Decision: do not block local `03` fixture work on full auth, but make hosted
deployment impossible to claim until static tokens are replaced with ADR 0005's
server-derived `TransitionCallerIdentity`.

Failure scenario: one leaked transition token allows every transition in that custody lane until rotated. That is entrypoint compromise, not a failure of the greenlight/gateway invariant, but it is still a hosted-product blocker.

## Code Quality Review

### Issue 4: Route Role Repetition Can Drift

`src/http/app.ts` repeats the same shape on every POST route:

```text
authorize(role)
parseBody(schema)
kernel.transition(...)
return json(...)
```

The explicit repetition is readable today, but it creates drift risk as more transition routes are added. One route can miss custody, use the wrong role, or fall out of OpenAPI alignment.

Decision: before adding any new transition route, introduce a small route metadata table or helper that binds path, role, schema, handler, and OpenAPI security from one source.

### Issue 5: Built-In Hono Bearer Middleware Is Not Quite The Right Primitive

Hono's built-in bearer-auth middleware is good for one-token or route-group protection. Handshake needs transition-role custody and fail-closed behavior before body parsing.

Decision: keep the custom `caller-auth.ts` primitive for now, document why it exists, and prevent it from expanding into full auth. The custom code should remain a thin guard, not an identity provider.

## Test Review

### Test Diagram

```text
POST transition route
  |
  +-- missing token --------------------------> 401 caller_auth_required
  |
  +-- token configured missing in env/options -> 503 caller_auth_not_configured
  |
  +-- wrong custody token --------------------> 403 caller_auth_forbidden
  |
  +-- right token
        |
        +-- invalid body ---------------------> 400 invalid_request
        |
        +-- valid body
              |
              +-- runtime_evidence ----------> RuntimeExecution / IntentCompilation evidence
              +-- gateway_custody -----------> ProtectedPathPosture / GatewayCheck / Reconciliation
              +-- review_custody ------------> ReviewArtifact / ReviewDecision
              +-- control_plane -------------> Catalog / Envelope / Contract / Policy / Recovery
```

```text
Action authority path
  RuntimeExecutionRecord?      evidence only
      |
  IntentCompilationRecord      candidate evidence
      |
  ActionContract               proposed commitment
      |
  PolicyDecision               refusal/review/halt/quarantine/greenlight
      |
  one-use Greenlight           gateway authority input
      |
  GatewayCheckAttempt          enforcement before mutation
      |
  Receipt / Refusal / ProofGap reconstruction evidence
```

### Coverage Map

| New branch/codepath | Covered? | Evidence |
|---|---:|---|
| POST route missing token fails before body parsing | yes | `test/http.test.ts` `caller_auth_required`. |
| POST route configured with no token fails closed | yes | `test/http.test.ts` `caller_auth_not_configured`. |
| POST route wrong custody token refuses | yes | `test/http.test.ts` `caller_auth_forbidden`. |
| OpenAPI declares bearer security for transition routes | yes | Route registry/OpenAPI security parity tests in `test/http.test.ts`. |
| SDK forwards a token through D1/Hono flows | yes | D1 and codemode HTTP tests use `transitionToken`. |
| SDK forwards per-role token map | yes | Focused SDK header-routing test in `test/http.test.ts`. |
| Every POST route has explicit custody metadata | yes | `transitionRouteDefinitions` drives Hono binding and OpenAPI. |
| GET record route has custody/redaction posture | partial | `test/http.test.ts` requires `control_plane` custody and validates `objectType`; redacted public evidence API remains undesigned. |
| Root export posture is enforced | yes | Root export snapshot and smoke tests in `test/root-exports.test.ts`. |

### Deferred Hosted/Public Gaps

1. `GET /v0.2/records/:objectType/:objectId` now has a caller-custody test. The
   remaining hosted-boundary gap is that this route is raw/internal only; a
   redacted public evidence API is still undesigned.
2. Static/local bearer tokens are acceptable for local alpha. Hosted deployment
   still needs ADR 0005 hosted caller identity before multi-tenant use.

## Failure Modes

| Codepath | Production failure mode | Test? | Error handling? | User-visible? | Verdict |
|---|---|---:|---:|---:|---|
| POST transition auth | Missing token writes evidence after body parse | yes | yes | clear 401 | covered |
| POST transition config | Missing server token accidentally opens route | yes | yes | clear 503 | covered |
| Wrong custody token | Runtime token attempts gateway check | yes | yes | clear 403 | covered |
| SDK token forwarding | Caller forgets token and sees generic request failure | partial | yes | generic SDK error | acceptable for alpha |
| Per-role SDK token map | Wrong role fallback masks misconfiguration | no | yes | generic SDK error | test gap |
| GET record read | Unauthorized evidence read by object ID | no | no | silent data exposure | critical gap |
| Root exports | Downstream code imports internals and bypasses intended API | no | no | future API lock-in | boundary gap |

## Performance Review

No current performance blocker.

- Caller token comparison is constant-time over short tokens and runs once per POST route.
- Creating a `HandshakeKernel` facade per request is cheap because the durable work is in the store.
- Current posture lookups are indexed by scope in memory and D1.
- The broad record-read route is a security/API concern, not a performance concern.

## Play-The-Tape Review

### Question Compiler

- Raw ask: harden `02b` and prepare it for integration.
- Artifact under review: `docs/plans/02b-plan-eng-review-module-boundaries.md`.
- Short-term gain: unblock the next `03` integration slice without reopening the
  full ADR 0001 lifecycle.
- Future pain risk: accidental public API, debug-record reads, static caller
  tokens, and root exports become product surface or hosted-security claims.
- Primary tape mode: Full Council
- Secondary tape modes: Architecture, Attack, Debt, API/Protocol.
- Compiled question: If this plan gets a fast path to `03` while debug reads, static caller custody, and root exports look like stable public protocol surface, what boundary residue do we now own?
- Non-question: whether ADR 0001 should be reopened or whether a hosted auth
  provider should be built now.

### Crystal Ball Setup

- Depth: Deep
- Success criteria: the integration slice lands with custody on debug reads,
  intentional exports, route-role completeness tests, per-role SDK token tests,
  and no hosted/public claim expansion.
- Source material: ADR 0001, current `02b`, `src/http/app.ts`,
  `src/http/caller-auth.ts`, `src/sdk/client.ts`, `src/index.ts`, Hono docs,
  OWASP API Security Top 10.
- Council roles: Product / CEO, Engineering, Security / CSO, Architecture,
  DevEx, Future Maintainer, Domain Invariant.
- Uncertainty axes: partial adoption, docs drift, hosted pressure, route growth,
  runtime diversity, leaked token, export cargo-culting, support/debug needs.

### If This Succeeds, We Own

- Product/repo shape: a local-alpha protocol kernel with explicit internal-debug
  record reads and an intentional package-root API posture.
- New product claims: `03` can claim local protected-action integration readiness,
  not hosted multi-tenant authorization or provider enforcement.
- New API/protocol surface: no new public lifecycle route; `GET /v0.2/records/*`
  remains internal debug with control-plane custody.
- New docs source of truth: ADR 0001 owns evidence boundaries; this `02b` owns
  pre-`03` module/API boundary gates.
- New long-term maintenance burden: export snapshot upkeep, route metadata upkeep,
  and explicit migration from static caller tokens to ADR 0005 caller identity
  before hosted deployment.

### Monte Carlo Futures

| Future | Assumptions | Likelihood | Success-State Residue | Tail Risk |
|---|---|---:|---|---|
| Base success | `02b` integration lands before `03`. | medium | Small route/export posture tests become standard. | Low. |
| Dirty integration | A runtime uses SDK but skips some route roles. | medium | Static tokens hide missing org authorization. | Hosted auth claim becomes false. |
| Partial adoption | POST routes are protected but GET records remains open. | high | Debug read route becomes evidence exfiltration path. | Hard stop. |
| Scale pressure | More routes are added after `03`. | medium | Repeated route boilerplate drifts. | One route misses custody or OpenAPI security. |
| Generated-code pressure | Generated code discovers root internals via package exports. | medium | Downstream integrations call transition internals directly. | Public API bypasses intended SDK path. |
| Docs drift | Future docs cite record reads as evidence API. | medium | Internal debug route becomes product truth. | Review/receipt evidence API must later break compatibility. |
| Incident recovery | Support needs raw records after a divergence. | medium | Internal debug route is useful but must be controlled. | Removing route entirely hurts recovery unless replacement exists. |

### Council Passes

| Role | Strongest Residue Callout | What It Would Cut Or Narrow | Hard Stop? |
|---|---|---|---:|
| Product / CEO | Debug record reads can be mistaken for a product evidence API. | Keep route internal and non-OpenAPI. | yes |
| Engineering | Route/auth/OpenAPI roles can drift if each route is hand-wired. | Add route metadata or completeness test. | no |
| Security / CSO | Static bearer tokens are custody, not org authorization. | Block hosted claims until ADR 0005 hosted caller identity exists. | yes for hosted |
| Architecture | Root exports make implementation details look stable. | Add export posture and snapshot test. | no |
| DevEx | Removing raw record reads hurts local debugging. | Keep internal debug with custody. | no |
| Future Maintainer | Tests may bless route plumbing instead of boundaries. | Test route posture and export posture explicitly. | no |
| Domain Invariant | None of these may become mutation authority. | Preserve contract -> policy -> greenlight -> gateway check. | yes |

### Mode Artifact

| Tape Mode | Artifact | Future Pain Exposed | Required Adjustment |
|---|---|---|---|
| Architecture | Coupling and interface pressure map | Hono routes, OpenAPI, SDK, and auth can drift independently. | Introduce route metadata/completeness test before new routes. |
| Attack | Attack and bypass map | Open record reads and leaked static tokens are credible hosted risks. | Custody on record reads; hosted-auth non-claim stays explicit. |
| Debt | Pain ledger with triggers | Static tokens and root exports are acceptable only with cleanup triggers. | Trigger hosted-auth migration before multi-tenant deployment; export snapshot before `03`. |
| Architecture | Surface posture map | Root exports and debug reads become sticky. | Export posture table and root export test. |

### Coupling And Interface Pressure Map

| Surface | Owns | Must Not Know | Current Coupling | Interface Needed | Deletion Test | Adjustment |
|---|---|---|---|---|---|---|
| Hono route table | transport and custody | lifecycle semantics | route handlers call kernel facade | route metadata for role/schema/security | removing one route does not affect protocol modules | add route-role completeness test |
| OpenAPI | public route contract | internal debug reads | POST security declared route-by-route | generated or table-backed security posture | no undocumented public POST route | test every POST has security |
| SDK | HTTP caller ergonomics | protocol internals | per-method role mapping | role-token test | SDK can operate without importing transitions | add per-role token test |
| Package root | public alpha API | transition/store internals by accident | broad export list | export posture table and snapshot | internal module removal does not break public imports | curate exports |
| Record read route | local debug inspection | public evidence API semantics | direct raw store read | internal debug route with custody | route can be removed/replaced without breaking SDK | require custody and omit from OpenAPI |

### Attack And Bypass Map

| Capability Added | Protected Boundary | Bypass Path | Detection Evidence | Halt/Isolation Behavior | Adjustment |
|---|---|---|---|---|---|
| Internal record read | control-plane custody | unauthenticated GET by guessed ID | HTTP 401/403 test once hardened | no mutation, but evidence leak | require custody or remove route |
| Root exports | public API posture | callers import transition internals | export snapshot test | n/a | curate root exports |
| Static caller tokens | route entry guard | leaked lane token | auth failure/success logs only | no mutation without greenlight/gate | non-claim; hosted-auth trigger |
| Route growth | metadata consistency | new POST route skips custody | route completeness test | n/a | route metadata table/test |

### Pain Ledger With Triggers

| Shortcut | Pain Created | When It Hurts | Owner Or Trigger | Reversibility | Adjustment |
|---|---|---|---|---|---|
| Static bearer tokens | no ADR 0005 caller identity | hosted or multi-tenant deployment | hosted deployment plan | moderate | block hosted claims until replaced |
| Raw record read route | accidental evidence API | public SDK/docs consumers appear | before `03` public docs | cheap now, expensive later | internal debug custody now |
| Broad root exports | Hyrum's Law on internals | SDK users import internals | before `03` integration examples | cheap now | export snapshot now |
| Hand-wired route roles | route/security drift | next transition route | any new route | moderate | metadata/completeness test now |

### Convergent Residue

| Residue | Seen In Futures | Seen By Roles | Severity | Reversibility | Evidence | Decision |
|---|---:|---:|---|---|---|---|
| Debug record read becomes public evidence API | 4/7 | 4/7 | high | expensive | route exists, no custody/OpenAPI posture | narrow |
| Root exports freeze internals | 3/7 | 3/7 | medium | expensive | `src/index.ts` blanket exports | narrow |
| Static tokens become hosted-auth claim | 3/7 | 3/7 | high | contained | ADR non-claim | defer |
| Route auth/OpenAPI drift | 3/7 | 3/7 | medium | easy | repeated route wiring | narrow |

### Maintainer Traps

- Trap: future contributors copy `GET /v0.2/records/*` as the evidence API.
  Why this exists after success: it is the easiest way to inspect records.
  Future cleanup trigger: before any public evidence/receipt read API.
- Trap: downstream code imports transition functions from the root package.
  Why this exists after success: root exports are convenient and broad.
  Future cleanup trigger: before publishing SDK examples or `03` integration docs.
- Trap: static caller tokens are described as auth.
  Why this exists after success: they use `Authorization: Bearer`.
  Future cleanup trigger: before hosted or multi-tenant deployment.

### Authority And Claim Risks

- Claim that may exceed enforcement: "Handshake has hosted auth" or "Handshake has
  a public evidence API."
- Boundary that future readers may misunderstand: caller custody is only route
  entry protection; it is not principal authority, reviewer authority, or gateway
  mutation authority.
- Non-claim to preserve: only exact `ActionContract` -> `PolicyDecision` ->
  one-use `Greenlight` -> `GatewayCheckAttempt` can authorize mutation.

### Residue-Reducing Adjustments

| Adjustment | Residue Reduced | Mechanism | Owner Or Trigger | Status |
|---|---|---|---|---|
| Require `control_plane` custody on `GET /v0.2/records/*` or remove it. | Debug route evidence leak. | Hono route guard plus HTTP test. | `02b` integration. | implemented |
| Keep `GET /v0.2/records/*` out of OpenAPI. | Accidental public evidence API. | OpenAPI absence test or explicit internal-debug assertion. | `02b` integration. | accepted |
| Add root export posture and snapshot test. | Hyrum's Law on internals. | Public/experimental/internal table plus import/export test. | `02b` integration. | accepted |
| Add per-role SDK token test. | SDK role fallback drift. | Hono test with distinct role tokens. | `02b` integration. | accepted |
| Add route custody completeness test. | Future route drift. | Route metadata or OpenAPI/security completeness assertion. | Before any new POST route. | accepted |
| Block hosted claims until ADR 0005 caller identity exists. | Static token auth theatre. | Non-claim and future hosted-caller-identity gate. | Hosted deployment trigger. | accepted |

### Chairman Synthesis

Decision: narrow and integrate.

Reason: the plan is directionally correct, but the tape-out shows the same residue
recurring across futures: debug reads, broad exports, and static tokens will become
product surface unless integration makes their posture explicit now.

Smallest next mechanism: implement control-plane custody for the internal record
read route, export posture/snapshot tests, per-role SDK token tests, and route
custody completeness tests.

## Integration Preparation

### Integration Objective

Make `02b` mechanically enforce the module/API boundary before `03` starts.

This is not another evidence-boundary expansion. It is a small boundary-hardening
slice around HTTP route posture, SDK token routing, and root package exports.

### Integration Sequence

```text
1. Transition route registry
   -> bind POST transition route role/schema/response metadata from one source
   -> consume the same registry from Hono and OpenAPI
   -> assert all state-changing routes have custody and OpenAPI security

2. Record-read route posture
   -> keep control_plane custody on GET /v0.2/records/:objectType/:objectId
   -> validate objectType before storage lookup
   -> assert route stays absent from public OpenAPI

3. SDK token routing
   -> add distinct role-token test for transitionTokens
   -> prove fallback transitionToken still works for local fixtures

4. Root export posture
   -> write export posture table in README or API docs
   -> curate src/index.ts exports or label internal/experimental surfaces
   -> add root export snapshot/API test

5. Verification
   -> bun test
   -> npm run typecheck -- --pretty false
   -> npm run build -- --pretty false
   -> git diff --check
   -> authority/provider scans
```

### Integration Acceptance Criteria

- `GET /v0.2/records/*` cannot return a record without `control_plane` custody.
- `GET /v0.2/records/*` is still not advertised as a public OpenAPI route.
- SDK `transitionTokens` chooses role-specific tokens correctly.
- Every state-changing route has a custody role and matching OpenAPI security.
- Root exports are intentionally public, experimental, or internal; tests detect
  accidental export expansion.
- No doc claims static bearer tokens are hosted auth, principal identity, reviewer
  authority, or gateway authority.
- All required verification commands pass.

### Integration Non-Claims

- This does not add hosted auth.
- This does not add organization RBAC.
- This does not create a public evidence read API.
- This does not create provider-side preview enforcement.
- This does not change the mutation authority path.

## NOT In Scope

- No real Vercel, Cloudflare, GitHub Deployments, or provider preview adapter.
- No hosted multi-tenant auth, SSO, SCIM, org RBAC, or principal authority grant system.
- No browser, MCP, or terminal interception surface.
- No public Contract Viewer, Receipt Timeline, Install Health UI, or Cloud workflow.
- No package-splitting refactor unless root exports cannot be curated with a small export map/test.
- No replacement of `caller-auth.ts` with a full auth framework in this checkpoint.

## What Already Exists

The v0.2.3 kernel now proves this loop:

```text
ToolCapability / ActionType / GatewayRegistryEntry / OperatingEnvelope
  -> RuntimeExecutionRecord?                 evidence only
  -> IntentCompilationRecord                 candidate evidence
  -> ActionContract                          proposed commitment
  -> PolicyDecision                          policy result
  -> one-use Greenlight                      gateway authority input
  -> GatewayCheckAttempt                     pre-mutation enforcement
  -> MutationAttempt / Refusal / ProofGap
  -> Receipt
  -> SurfaceOperationReconciliation
  -> RecoveryRecommendation / IsolationState / BreakerDecision
  -> stream reconstruction
```

Existing delivered mechanics:

- `ProtocolRecorder.commitRecordsWithEvents` commits records and stream events together.
- D1 and memory stores support current protected-path posture pointers.
- Policy includes current posture in its decision material when the contract/envelope requires it.
- Gateway check reloads posture before mutation when the greenlight depended on enforcing posture.
- Review approval requires a durable review artifact with exact digest bindings.
- Runtime execution records can describe generated execution blocks without minting authority.
- HTTP POST transitions require role-specific caller custody.
- Local preview deploy proves fixture-only preview evidence and records unknown downstream finality as a proof gap.

## TODO Candidates

These should be decided before implementation. They are not silently appended to `TODOS.md` because no `TODOS.md` exists and this plan is the current source of truth.

1. **Record-read route posture**
   - What: Keep `GET /v0.2/records/:objectType/:objectId` behind `control_plane` custody and out of OpenAPI.
   - Why: Prevent raw evidence reads from becoming accidental public API.
   - Recommendation: keep the implemented guard; design a separate redacted evidence API later if needed.

2. **Root export posture**
   - What: Curate root exports into public, experimental, and internal surfaces.
   - Why: Prevent transition/store internals from becoming accidental SDK API.
   - Recommendation: add an export posture table and a root export snapshot test in the integration slice.

3. **Per-role SDK token test**
   - What: Test `transitionTokens` chooses the token for each route role.
   - Why: The SDK supports role-specific tokens but current D1 flows use one shared test token.
   - Recommendation: add a small SDK/Hono unit test with four distinct tokens in the integration slice.

4. **POST route security completeness test**
   - What: Assert every OpenAPI `POST /v0.2/*` operation has a security scheme and every Hono POST route has a custody role.
   - Why: Avoid future route drift.
   - Recommendation: add in the integration slice, preferably from a route metadata table.

## Completion Summary

- Step 0: Scope Challenge - scope reduced to boundary-hardening integration, not another lifecycle expansion.
- Architecture Review: 3 issues found, decisions accepted.
- Code Quality Review: 2 issues found, decisions accepted.
- Test Review: diagram produced, 3 integration gaps identified.
- Performance Review: 0 issues found.
- NOT in scope: written.
- What already exists: written.
- TODO candidates: 4 items converted into integration work.
- Failure modes: 1 critical hosted-boundary gap flagged and assigned to integration.
- Play-The-Tape Review: produced and converted into accepted adjustments.
- Integration Preparation: written.
- Lake Score: 6/6 recommendations choose the complete small-boundary fix over deferral.

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|----------|
| CEO Review | `/plan-ceo-review` | Scope & strategy | 0 | not run | not required for docs-only boundary refresh |
| Codex Review | `/codex review` | Independent 2nd opinion | 0 | not run | skipped; local review plus ADR evidence used |
| Eng Review | `/plan-eng-review` | Architecture & tests (required) | 1 | integration_ready | 5 issues converted into integration work, 1 hosted-boundary gap assigned |
| Design Review | `/plan-design-review` | UI/UX gaps | 0 | not applicable | no UI surface |

- **UNRESOLVED:** none for local alpha boundary hardening; ADR 0005 hosted caller identity and a redacted evidence API remain deferred.
- **VERDICT:** ENG REVIEW HARDENED AND IMPLEMENTED. Proceed to `02c`/`03` local integration; do not claim hosted/public protocol surface until the deferred hosted-boundary gaps are designed and verified.
