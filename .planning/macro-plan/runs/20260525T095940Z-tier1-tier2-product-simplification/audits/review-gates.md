## Audit Scope

Focus: review-gates audit for T2-01 SDK/exports surface posture.

Question under audit: whether `ServiceWorkflowAdmission` should be exported from
the package root or remain surface-only, how SDK role-client guidance should
describe it, and whether the current SDK/package posture creates authority drift.

## Source Boundary

Canonical source beats planning scratch. `.planning/` was used only for the
active macro-plan handoff and T2-01 acceptance criteria.

Read boundary:

- Canon/doctrine: `AGENTS.md`, `README.md`, `docs/internal/decisions.md`,
  `docs/internal/protocol-notes.md`, `docs/internal/service-workflow-story.md`,
  `docs/internal/protocol-layman.md`, `STRUCTURE.md`, `QUALITY.md`.
- Active plan: `.planning/macro-plan/AGENT-HANDOFF.md`,
  `.planning/macro-plan/TASKS.jsonl`,
  `.planning/macro-plan/EXECUTION-SLICES.md`.
- SDK/export source: `src/sdk/surface-clients/index.ts`,
  `src/sdk/surface-clients/runtime-client.ts`,
  `src/sdk/surface-clients/policy-client.ts`,
  `src/sdk/surface-clients/gateway-client.ts`,
  `src/sdk/surface-clients/evidence-client.ts`, `src/sdk/LANE.md`,
  `src/index.ts`, `src/surfaces/index.ts`,
  `src/surfaces/service-workflow-admission/index.ts`, `package.json`.
- Export/package tests: `test/architecture/root-exports.test.ts`,
  `test/architecture/package-surface.test.ts`,
  `test/architecture/workflow-admission-boundary.test.ts`,
  `test/sdk/role-clients.test.ts`.
- Package scripts: `scripts/build-package-bundles.mjs`,
  `scripts/check-package-surface.mjs`,
  `scripts/check-published-entrypoints.mjs`.

## Files Read

- `AGENTS.md`
- `.planning/macro-plan/AGENT-HANDOFF.md`
- `.planning/macro-plan/TASKS.jsonl`
- `.planning/macro-plan/EXECUTION-SLICES.md`
- `.planning/macro-plan/MACRO-PLAN.md`
- `README.md`
- `STRUCTURE.md`
- `QUALITY.md`
- `docs/internal/decisions.md`
- `docs/internal/protocol-notes.md`
- `docs/internal/service-workflow-story.md`
- `docs/internal/protocol-layman.md`
- `src/sdk/LANE.md`
- `src/sdk/surface-clients/index.ts`
- `src/sdk/surface-clients/runtime-client.ts`
- `src/sdk/surface-clients/policy-client.ts`
- `src/sdk/surface-clients/gateway-client.ts`
- `src/sdk/surface-clients/evidence-client.ts`
- `src/index.ts`
- `src/surfaces/index.ts`
- `src/surfaces/service-workflow-admission/index.ts`
- `package.json`
- `test/architecture/root-exports.test.ts`
- `test/architecture/package-surface.test.ts`
- `test/architecture/workflow-admission-boundary.test.ts`
- `test/sdk/role-clients.test.ts`
- `scripts/build-package-bundles.mjs`
- `scripts/check-package-surface.mjs`
- `scripts/check-published-entrypoints.mjs`

## Invariant At Stake

SDK role clients can guide activation, proposal, policy evaluation, gateway
transport, and redacted readback, but they cannot infer authority from service
workflow evidence. `ServiceWorkflowAdmission` and `ServiceWorkflowHandle` are
non-authority product-surface records. They must not become root-level protocol
primitives, role-client permission inputs, policy substitutes, gateway passes,
receipt evidence, signer access, or reusable auth.

## Pass Conditions

- `ServiceWorkflowAdmission` stays off the package root.
- `ServiceWorkflowAdmission` is exposed only as a surface schema if a public
  import path is intentionally added; it must not be exported through
  `./sdk/role-clients`.
- Role-client docs state that admission/handle values are evidence/readback
  context only.
- `RuntimeClient` may cite admission/handle context only while producing fresh
  proposal records or compiler refusals.
- `PolicyClient.evaluatePolicy()` still requires an exact action contract input;
  admission/handle is not policy.
- `GatewayClient.gatewayCheck()` still requires gateway check input bound to a
  one-use greenlight; admission/handle is not a gateway pass.
- `EvidenceClient` readback must distinguish admission evidence from receipt
  timeline, downstream finality, replay refusal, and proof gaps.
- Root/package/export tests remain curated and fail if root or role-client
  exports widen accidentally.

## Failures

1. SDK role-client guidance is not explicit enough for T2-01 closeout.
   `README.md` explains the first-use flow and says
   `ServiceWorkflowAdmission` is not policy and `ServiceWorkflowHandle` is not
   permission. `src/sdk/LANE.md` explains role-client custody boundaries. But
   the role-client guidance never names `ServiceWorkflowAdmission` or
   `ServiceWorkflowHandle`, so it does not tell developers where those records
   may appear: context/evidence refs for fresh proposals and readback only,
   never as policy input, greenlight, gateway input, receipt, credential, or
   role token.

2. The package surface has an unresolved `surfaces` export posture. Build and
   package checks require `dist/surfaces/index.mjs` and
   `dist/surfaces/index.d.ts`, and `src/surfaces/index.ts` exports
   `service-workflow-admission`. `package.json` does not expose a
   `./surfaces` subpath. That is safe against accidental public authority drift,
   but ambiguous for T2-01: if the admission schema is meant to be public, the
   public import path is missing; if it is source-internal only, the package
   currently ships an unaddressable dist artifact.

No current source failure shows `ServiceWorkflowAdmission` exported from root or
from `./sdk/role-clients`.

## Proof Gaps

- No import smoke exists for a public `handshake-protocol-kernel/surfaces`
  subpath because that subpath does not exist.
- No role-client doc/test currently asserts the exact admission/handle wording:
  context-only, fresh action contract required, admission readback is not receipt
  evidence.
- `root-exports.test.ts` would catch a root export by exact export-list drift,
  but it does not have a named regression assertion for
  `ServiceWorkflowAdmission` / `ServiceWorkflowHandle`.
- T2-01 status in `TASKS.jsonl` remains `open`; this audit does not promote it.

## Required Changes

1. Do not export `ServiceWorkflowAdmission` from the package root.

   Root export would place a product-surface admission record beside
   `ActionContractSchema`, `PolicyDecisionSchema`, `GreenlightSchema`,
   `GatewayCheckInputSchema`, `ReceiptSchema`, `verifiedGatewayCheckFromResult`,
   and `HandshakeClient`. That makes admission look like a protocol primitive or
   authority-bearing input. It is review theatre risk in package form.

2. Keep `ServiceWorkflowAdmission` surface-only.

   If a public type/schema import is required, add a deliberate
   `handshake-protocol-kernel/surfaces` package subpath with tests that assert
   non-authority exports and forbid `PolicyDecision`, `Greenlight`,
   `GatewayCheck`, `ReceiptExport`, `PaymentPayload`, signer, mutation, and
   certificate-minting names. Do not use `./sdk/role-clients` for these schemas;
   that subpath should stay role-client constructors plus safe transport/error
   types.

3. Patch role-client guidance before closing T2-01.

   The docs should say:

   - `ServiceWorkflowAdmission` and `ServiceWorkflowHandle` are service
     workflow context/readback records only.
   - `RuntimeClient` may use their IDs/digests as declared assumptions,
     evidence refs, or context while compiling/proposing a fresh exact action
     contract.
   - `PolicyClient.evaluatePolicy()` starts from exact contract input, not from
     admission/handle.
   - `GatewayClient.gatewayCheck()` starts from gateway-check input bound to a
     one-use greenlight, not from admission/handle.
   - `EvidenceClient` may read redacted evidence and receipt timelines, but an
     admission readback is not receipt evidence or downstream success.
   - No role client should retry protected work automatically because an
     admission was accepted.

4. Add named export-posture tests if a `./surfaces` subpath is introduced.

   Required assertions: root does not export `ServiceWorkflowAdmission*` or
   `ServiceWorkflowHandle*`; role-clients do not export those schemas; the
   surfaces subpath exports only non-authority surface schemas/constants/helpers.

## Status Recommendation

Conditional pass for current source posture; do not promote T2-01 to closed.

Current source is safe on the central authority question: root does not export
`ServiceWorkflowAdmission`, role clients remain on an explicit non-root subpath,
and focused tests passed. The unresolved work is documentation and package
surface intent: either keep admission schema source-internal and stop implying a
public import, or add an explicit non-root `./surfaces` subpath with narrow
non-authority tests. Root export is the wrong move.

## Commands Or Tools Used

- `rg -n "T2-01|ServiceWorkflowAdmission|surface-clients|SDK|exports|macro-plan|audit" /Users/joelchan/.codex/memories/MEMORY.md`
- `sed -n '1,220p' /Users/joelchan/.codex/skills/handshake-grounding/SKILL.md`
- `pwd`
- `git status --short --branch`
- `sed -n` reads over the source boundary listed above
- `rg -n "ServiceWorkflowAdmission|ServiceWorkflowHandle|role-client|role client|surface client|surface-clients|sdk/role-clients|sdk/surface-clients|freshActionContractRequired|createsAuthority" . src test docs README.md package.json`
- `find .planning/macro-plan -maxdepth 4 -type d | sort`
- `find .planning/macro-plan/runs -maxdepth 3 -type f | sort`
- `nl -ba` reads for cited line anchors
- `npm run test -- test/architecture/root-exports.test.ts test/sdk/role-clients.test.ts test/architecture/package-surface.test.ts test/architecture/workflow-admission-boundary.test.ts`
