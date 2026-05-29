# Runtime And Protected-Action Gates Audit

## Audit Scope

Sidecar 4/5 audit for runtime and protected-action gates in the
projection-over-spine macro-plan correction.

Assigned focus only: generated-code misuse, loops/retries/branches, dynamic
tools, stale handles/review, raw sibling bypass, x402/auth.md composite
confusion, hosted/Tier 3 pressure, and gateway/signer/payment material
boundaries.

This audit does not select the macro move, synthesize the final plan, promote a
final status, or authorize protected-action behavior.

## Source Boundary

Canonical boundary:

- `AGENTS.md` doctrine supplied in the prompt.
- `docs/internal/decisions.md` for product/kernel/source truth.
- Source lane boundaries in `src/mcp/LANE.md`, `src/runtime/ingress/*`, and
  `src/cli/command-manifest.ts`.

Operational proof boundary:

- `test/runtime/runtime-ingress.test.ts`.
- `test/runtime/auth-md-candidate-compilation.test.ts`.
- `test/product/service-workflow-admission.test.ts`.
- `test/architecture/workflow-admission-boundary.test.ts`.
- `examples/service-workflow-admission/*`.

Planning boundary:

- `.planning/macro-plan/RUNTIME-GATES.md`.
- `.planning/macro-plan/PROTECTED-ACTION-GATES.md`.
- `.planning/macro-plan/runs/20260525T110908Z-architectural-north-star/*`.

`.planning/` is scratch. It is useful for gate pressure, not repo-facing canon.

## Files Read

- `test/runtime/runtime-ingress.test.ts`
- `test/runtime/auth-md-candidate-compilation.test.ts`
- `test/product/service-workflow-admission.test.ts`
- `test/architecture/workflow-admission-boundary.test.ts`
- `examples/service-workflow-admission/run.ts`
- `examples/service-workflow-admission/README.md`
- `src/runtime/ingress/index.ts`
- `src/runtime/ingress/schemas.ts`
- `src/runtime/ingress/families.ts`
- `src/runtime/ingress/registry.ts`
- `src/mcp/LANE.md`
- `src/cli/command-manifest.ts`
- `src/surfaces/service-workflow-admission/index.ts`
- `docs/internal/decisions.md`
- `.planning/macro-plan/MACRO-PLAN.md`
- `.planning/macro-plan/EXECUTION-SLICES.md`
- `.planning/macro-plan/AGENT-HANDOFF.md`
- `.planning/macro-plan/RUNTIME-GATES.md`
- `.planning/macro-plan/PROTECTED-ACTION-GATES.md`
- `.planning/macro-plan/runs/20260525T110908Z-architectural-north-star/input.md`
- `.planning/macro-plan/runs/20260525T110908Z-architectural-north-star/source-snapshot.md`
- `.planning/macro-plan/runs/20260525T110908Z-architectural-north-star/blocked-checks.md`
- `.planning/macro-plan/runs/20260525T110908Z-architectural-north-star/research.md`

## Invariant At Stake

Product vocabulary may project and read back one protected-action event spine.
It must not become a second authority lane.

The runtime invariant is stricter: generated code may propose consequential
dispatches, but runtime ingress may create only proposal evidence and candidate
contracts. It must not create policy decisions, greenlights, gateway checks,
signer access, payment material, mutation attempts, receipts, certificates, or
host containment claims.

The protected-action invariant remains:

```text
CandidateAction / ActionContract
-> PolicyDecision
-> one-use Greenlight or Refusal
-> GatewayCheck before mutation
-> Receipt / Refusal / ReplayRefusal / ProofGap / AuthorityCertificate
```

## Pass Conditions

- Runtime ingress remains proposal-only for package install, x402, and auth.md
  dispatch families.
- Dynamic tool construction, late-bound parameters, ambiguous dispatches,
  truncated graphs, unsupported provider posture, stale handles/reviews, and raw
  sibling paths refuse before contract authority or stop as bypass evidence.
- Loops, retries, branches, and changed parameters produce distinct exact
  candidate/action contracts with distinct sequence and idempotency evidence;
  they do not create aggregate authority.
- `ServiceWorkflowAdmission` and `ServiceWorkflowHandle` remain correlation and
  readback projections only. They cannot carry policy, greenlight, gateway,
  signer, payment payload, credential, receipt, certificate, or mutation
  material.
- x402 and auth.md remain separate protected-action rails. No fixture may merge
  x402 spend authority and auth.md credential authority into one artifact.
- Payment material and `PAYMENT-SIGNATURE` remain behind `VerifiedGatewayCheck`.
  Runtime, MCP, CLI, admission, handle, and review surfaces must not expose
  signer helpers or raw payment material.
- Hosted/Tier 3 language remains locked behind separate hosted proof or a fresh
  Tier 1/Tier 2 kernel task. Projection vocabulary must not expand package or
  kernel authority.

## Failures

P0: mixed-family runtime ingress lacks an explicit same-envelope gate. The code
routes each dispatch through its family config, but `RuntimeExecution` and graph
issuer identity are derived from the first dispatch config in
`buildRuntimeIngressExecutionInput()` and `runtimeIngressGraphIssuerContext()`.
The mixed-family test covers package+x402 ordering, but not mismatched
tenant/org/principal/agent/run/runtimeAdapter/operatingEnvelope across configs.
Projection-over-spine closeout must either forbid mixed-family blocks at this
layer or prove all family configs share the same execution envelope before
runtime evidence is recorded. Otherwise a projection can make multiple authority
contexts look like one runtime spine.

P0: x402/auth.md non-composition is asserted at the service workflow fixture,
but there is no mixed x402+auth.md runtime block test proving separate rails
under generated-code composition. Current auth.md runtime tests prove standalone
candidate/refusal posture; current x402 tests prove standalone and package+x402
mixed posture. The correction needs a gate that prevents "credentialed paid API
call" from becoming composite authority unless each rail clears through its own
fresh exact contract, policy decision, one-use greenlight/refusal, gateway
check, and post-gate evidence.

P1: stale review coverage is too dependent on dynamic/late-bound detection. The
runtime test for stale handle/review refuses because dynamic construction and
late-bound refs are present. Add a static-looking stale review digest/handle
digest mismatch case so a stale rendered review cannot pass merely because its
tool name and parameters are syntactically fixed.

P1: branch coverage is too narrow for the protected-action gate. Runtime tests
cover branch detection and changed amount, but the planning gate asks for
branches that change endpoint, resource, payee, gateway, or credential refs.
Those changes are exactly where a projection can launder scope expansion.

P1: "parallel proposals from one handle" remains under-proven. Tests cover
sequential retry/loop handle context, but not concurrent or sibling proposals
from the same handle. The required behavior is separate fresh contracts and no
aggregate spend or reusable handle authority.

P1: raw sibling inventory is still not specific enough for the corrected
projection surface. Tests cover raw package install, raw x402 shell, direct MCP
x402, and raw auth.md MCP. Runtime gates still name browser, direct HTTP,
network, cloud, deploy, and database paths as bypass/proof-gap surfaces. The
closeout must not claim broad runtime protection until those are either named
as explicit proof gaps or covered by a source-owned raw sibling inventory.

P1: runtime refusal readback is reason-code rich but `RuntimeIngressResponsePosture.refusalRefs`
is always empty. If projection-over-spine readback needs reconstructable refusal
evidence, the runtime outcome should either surface durable refusal refs or
explicitly state that refusal records are recoverable through the
`intentCompilationRefs` only. Without that, refusal evidence can become readback
theatre.

## Proof Gaps

- No tests were executed in this audit; this was a read-only source audit plus
  report write.
- No host-native containment is proven for Codex, Claude Code, Hermes, OpenClaw,
  MCP, browser, A2A, or OpenAPI.
- No live provider/customer custody, funded customer-gateway signer, settlement,
  facilitator operation, seller middleware, marketplace trust, cross-org trust,
  or aggregate spend ledger is proven.
- No hosted operation proof exists. Current hosted/Tier 3 posture is a lock, not
  a go-ahead.
- Runtime ingress has strong local generated-code stress tests, but not a full
  generated-code parser/interceptor proof for arbitrary browser, shell, network,
  package manager, cloud, deploy, repo, or database tools.
- `auth.md + x402` remains an expansion candidate. It is not current composite
  execution authority.

## Required Changes

1. Add a same-envelope runtime ingress gate before closeout. It must reject or
   refuse mixed-family dispatch blocks whose configs disagree on tenant,
   organization, principal, agent, run, runtime adapter, operating envelope,
   gateway registry, or authority holder where those fields are intended to
   share one generated execution spine.

2. Add x402+auth.md composition tests. Minimum case: one generated block carries
   an auth.md protected API call plus one x402 payment attempt. Expected result:
   separate candidates or refusal; no shared credential/signer/payment material;
   no composite action contract; no policy, greenlight, gateway, mutation,
   receipt, or certificate from runtime ingress.

3. Add stale review/handle mismatch tests that do not rely on dynamic tool
   construction. The stale artifact itself must force a fresh action contract or
   refusal.

4. Add branch-scope tests for endpoint, payee, resource, gateway credential ref,
   delegated authority ref, request body digest, and selected payment requirement
   changes. Expected result: separate exact contracts or refusal; never aggregate
   authority.

5. Add parallel/sibling proposal tests from the same
   `ServiceWorkflowHandle`. Expected result: every protected action still needs
   a fresh exact contract and per-call greenlight/gateway chain.

6. Refresh `.planning/macro-plan/RUNTIME-GATES.md` and
   `.planning/macro-plan/PROTECTED-ACTION-GATES.md` for projection-over-spine
   language. They should say product vocabulary is projection/readback over the
   event spine, not a peer lane. Also reconcile stale blocked-check text against
   existing architecture field-negative tests.

7. Preserve and rerun closeout gates before any implementation claim:
   `npm run quality:claims`, `npm run quality:architecture`,
   `npm run test -- test/runtime/runtime-ingress.test.ts test/runtime/auth-md-candidate-compilation.test.ts test/product/service-workflow-admission.test.ts test/architecture/workflow-admission-boundary.test.ts`,
   and `npm run check:repo`.

## Status Recommendation

Sidecar recommendation only: do not close runtime/protected-action gates as
passing until the P0 mixed-family same-envelope gate and x402/auth.md
non-composition test exist.

Brutal verdict: keep projection-over-spine. The current runtime/protected-action
source is mostly disciplined and already refuses many generated-code misuse
shapes. The unsafe version is treating Admission/Handle/review output as a
second lifecycle or allowing mixed-family runtime evidence to blur authority
contexts. That must be blocked before closeout.

## Commands Or Tools Used

- Read `gsd-macro-plan` skill instructions.
- Memory quick pass through `/Users/joelchan/.codex/memories/MEMORY.md`.
- `pwd`
- `git status --short`
- `rg --files`
- `rg -n`
- `sed -n`
- `nl -ba`
- `find`
- `mkdir -p .planning/macro-plan/runs/20260525T110908Z-architectural-north-star/audits`
- `apply_patch` to create this report only.

No tests were run.
