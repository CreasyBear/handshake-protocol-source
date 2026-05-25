## Audit Scope

Sidecar 3/5 audited the protected-action lifecycle focus for run `20260525T110908Z-architectural-north-star`.

Question audited: whether the repo has a single protected-action event lifecycle/table that product projections can derive from, and how `Passport`, `Admission`, `Handle`, `Clearance`, `Outcome`, and `Certificate` can be defined as projections without becoming protocol primitives.

This report is read-only analysis except for writing this file. It does not select a macro move, synthesize the final plan, promote final status, or edit source/docs/tests.

## Source Boundary

Canonical source boundary used:

- Current checkout at `/Users/joelchan/Documents/Coding/App-Dev/live/Handshake v0.0.2`.
- `git status --short --branch` reported `## main...origin/main [ahead 8]`; no dirty tracked files were present before this audit file was written.
- `.planning/` is treated as scratch/derived planning output. The run directory did not exist before this report directory was created.
- Tracked source and docs are the evidence boundary; prior memory was used only as context to preserve Handshake/GSD constraints.

## Files Read

Required files read:

- `src/protocol/navigation/index.ts`
- `src/protocol/areas/action-attempt-lifecycle/index.ts`
- `src/protocol/areas/action-attempt-lifecycle/types.ts`
- `src/protocol/areas/action-attempt-lifecycle/schemas.ts`
- `src/protocol/areas/action-attempt-lifecycle/matrix.ts`
- `src/protocol/public/transitions.ts`
- `docs/internal/protocol-definition.md`
- `docs/internal/protocol-kernel-architecture.md`
- `docs/internal/protocol-notes.md`
- `docs/internal/service-workflow-story.md`
- `test/protocol/action-attempt-lifecycle.test.ts`
- `test/protocol/protocol-navigation.test.ts`

Additional files read for projection and terminal-evidence boundary:

- `docs/internal/decisions.md`
- `src/surfaces/service-workflow-admission/index.ts`
- `src/surfaces/outcome.ts`
- `src/surfaces/index.ts`
- `src/index.ts`
- `package.json`
- `test/product/service-workflow-admission.test.ts`
- `test/architecture/workflow-admission-boundary.test.ts`
- `test/architecture/root-exports.test.ts`
- `src/protocol/areas/operation-lifecycle/schemas.ts`
- `src/protocol/areas/operation-lifecycle/lifecycle.ts`
- `src/protocol/areas/operation-lifecycle/transitions.ts`
- `test/protocol/operation-lifecycle.test.ts`
- `src/protocol/events/chains.ts`
- `src/protocol/areas/receipt-export/schemas.ts`
- `src/protocol/areas/receipt-export/status.ts`
- `src/protocol/evidence-projections/schemas.ts`
- `src/protocol/evidence-projections/projections.ts`
- `src/protocol/areas/protected-action-representation/schemas.ts`
- `src/protocol/areas/protected-action-representation/projections.ts`
- `test/protocol/representation-contract.test.ts`
- `src/protocol/areas/authority-certificate/schemas.ts`
- `src/protocol/areas/authority-certificate/transitions.ts`

## Invariant At Stake

Product-facing nouns must derive from the source-owned protected-action lifecycle. They must not become parallel authority primitives.

If `Passport`, `Admission`, `Handle`, `Clearance`, `Outcome`, or `Certificate` can be interpreted without the exact lifecycle path, product language can accidentally mint authority outside `ActionContract -> PolicyDecision -> one-use Greenlight -> GatewayCheck -> Receipt/Refusal/ProofGap`.

## Pass Conditions

- There is one source-owned transition/lifecycle spine for protected-action attempts.
- Product projection nouns point into that spine or into explicitly non-authority surface schemas.
- `Passport`, `Admission`, and `Handle` are evidence/readback/correlation only.
- `Clearance` means a fresh exact action path, not workflow permission.
- `Outcome` means terminal readback over receipt/refusal/replay/proof-gap/certificate evidence, not downstream business success.
- `Certificate` remains terminal evidence over existing terminal records, not identity, admission, permission, reusable auth, settlement, or hosted trust.
- Tests fail if a product projection term appears in authority-bearing protocol roots or if projection mapping drifts from lifecycle keys.

## Existing Lifecycle Spine And Evidence

The repo has a real source-owned lifecycle spine for protected-action attempts.

1. `src/protocol/navigation/index.ts` owns the transition inventory. Each entry declares `transitionId`, `kernelMethod`, `phase`, `outcomeClasses`, `recordsWritten`, `eventsEmitted`, `authorityBoundary`, and `evidenceObligation` (`ProtocolNavigationEntry`, lines 96-105). The table covers catalog/setup, runtime evidence, compilation, contract, policy, review, gateway, operation lifecycle, isolation, receipt export, recovery, and authority certificate transitions (lines 107-431).

2. `src/protocol/areas/action-attempt-lifecycle/schemas.ts` owns the derived lifecycle vocabulary: phase, state, authority effect, terminal outcome, and evidence obligation. The important boundary types are explicit: `authorityEffect` distinguishes `none`, `evidence_only`, `proposed_commitment`, `one_use_authority`, `gateway_admission`, `downstream_evidence`, and `future_authority_reduction` (lines 64-72). `terminalOutcome` distinguishes `open`, `contract`, `refusal`, `proof_gap`, `terminal_unknown`, `evidence_only`, `recovery`, `isolation`, `receipt`, `projection`, and `closed` (lines 75-87).

3. `src/protocol/areas/action-attempt-lifecycle/matrix.ts` maps `ProtocolTransitionId:TransitionOutcomeClass` to lifecycle entries. It is derived over `protocolNavigation`, not a stored protocol object. The exact lookup and enumeration functions are source-owned (`actionAttemptLifecycleEntry`, `actionAttemptLifecycleEntries`, lines 606-622). The matrix correctly marks contract proposal as proposed commitment, policy greenlight as one-use authority, gateway check as gateway admission, receipt export/certificate export as projection, and recovery/isolation as non-mutating authority reduction/evidence (notably lines 333-377, 443-550).

4. `test/protocol/action-attempt-lifecycle.test.ts` proves lifecycle coverage over every protocol navigation outcome exactly once (lines 13-22), proves the lifecycle is derived from evidence-chain transitions and not stored instances (lines 24-50), maps hostile generated-agent paths to refusal or proof-gap outcomes (lines 52-117), and keeps projections/recovery non-authoritative (lines 119-131).

5. `test/protocol/protocol-navigation.test.ts` proves HTTP transition navigation derives from protocol transitions and route metadata (lines 10-65), keeps generated graph coverage and certificate minting kernel-only evidence (lines 67-79), validates declared protocol objects/events (lines 81-94), and keeps evidence reads diagnostic/read-only (lines 96-112).

6. `src/protocol/public/transitions.ts` is a public guard narrative over the same state shape. It states compilation cannot mint authority, gateway check proceeds only from greenlight, receipt export packages existing evidence only, and recovery cannot reuse a greenlight or mutate gateway state (lines 22-115). This is useful documentation, but the stronger table is `protocolNavigation` plus `ActionAttemptLifecycle`.

7. Downstream finality is separately source-owned in `src/protocol/areas/operation-lifecycle/lifecycle.ts`. `OPERATION_LIFECYCLE_MATRIX` maps `pending/succeeded/refused/failed/unknown` to reconciliation status, finality status, claim state, receipt downstream status, proof-gap reason, claim blocking, and isolation behavior (lines 18-78). `test/protocol/operation-lifecycle.test.ts` proves all downstream observation branches (lines 4-56).

8. Reconstruction evidence has a source spine. `src/protocol/events/chains.ts` binds action lifecycle events by action contract, run, gateway, and resource (`actionLifecycleStreamRefs`, lines 58-67), and stream partitioning uses `action:<actionContractId>` when available (lines 126-140).

9. Docs reflect the lifecycle rule. `docs/internal/protocol-definition.md` defines the canonical path and primitive (lines 15-28, 88-104, 262-270). `docs/internal/protocol-kernel-architecture.md` states the gateway is the enforcement point and the store is reconstruction truth (lines 31-33), then gives the authority sequence diagram (lines 342-381). `docs/internal/protocol-notes.md` preserves compact product/protocol language and exact naming rules (lines 13-40, 452-456).

## Missing Projection Mapping

The source spine exists. The missing piece is a source-owned product projection mapping from service workflow words to lifecycle entries.

Current partial coverage:

- `docs/internal/service-workflow-story.md` defines the plain flow and correctly warns that `Passport`, `ServiceWorkflowAdmission`, `ServiceWorkflowHandle`, `Clearance`, and `Outcome` are not permission or downstream success (lines 7-25, 55-73, 88-98).
- `src/surfaces/service-workflow-admission/index.ts` source-owns `ServiceWorkflowAdmission` and `ServiceWorkflowHandle` as non-authority schemas. The boundary fields are hard literals: no authority, no policy decision, no greenlight, no gateway check, no mutation, no receipt export, no terminal certificate, no credential/payment material, no reusable auth, and fresh action contract required (lines 21-35, 39-53, 76-111).
- `test/architecture/workflow-admission-boundary.test.ts` rejects attempts to turn admission/handle into authority and keeps workflow nouns out of authority-bearing roots (`src/protocol/areas`, `src/adapters`, `src/runtime/ingress`, `src/mcp`) (lines 37-92).
- `test/product/service-workflow-admission.test.ts` proves the demo keeps admission/readback separate from fresh x402 clearance and excludes payment/auth authority material (lines 13-99, 101-228, 230-322).

Gaps:

1. There is no single source-owned `ServiceWorkflowProjectionMap` or equivalent table that maps `Passport`, `Admission`, `Handle`, `Clearance`, `Outcome`, and `Certificate` to `ActionAttemptLifecycle` keys, protocol object refs, and explicit non-authority flags.

2. `Passport` is not source-owned as a projection schema. It appears as `passportPackageDigest` and `passportPresentationId` fields in admission/handle schemas, but there is no `PassportProjection` type that states it is a presented evidence package only, never identity/trust/permission/spend/signer access/reusable auth.

3. `Admission` and `Handle` are source-owned as schemas, but not source-owned as lifecycle projections. They correctly avoid protocol authority roots, but no mapping ties them to pre-contract evidence/readback posture and says they cannot satisfy `compileIntent`, `proposeActionContract`, `evaluatePolicy`, or `gatewayCheck`.

4. `Clearance` is prose only. The docs define it as a fresh exact protected-action path, but there is no source-owned projection that says clearance is a composite over existing lifecycle keys such as `proposeActionContract:recorded`, `evaluatePolicy:greenlight|refusal|review_required|proof_gap`, and `gatewayCheck:recorded|replay_refusal|proof_gap|conflict`. Without that table, the word can drift into workflow-level permission.

5. `Outcome` is overloaded. `src/surfaces/outcome.ts` is a non-authority surface outcome helper for proposal/readiness/error shapes and explicitly prevents authority creation (lines 5-17, 59-86, 88-160), but it is not the terminal service-workflow Outcome described in `service-workflow-story.md` as receipt/refusal/replay/proof-gap/certificate. Terminal outcome derivation currently lives across `Receipt`, `ReceiptTimelineProjection`, `AgentTransactionEnvelopeProjection`, `OperationLifecycle`, `Refusal`, `ProofGap`, and `AuthorityCertificate` rather than a product-facing projection table.

6. `Certificate` is source-owned as `AuthorityCertificate`, but not mapped into the service workflow vocabulary as a projection. `src/protocol/areas/authority-certificate/transitions.ts` only mints after receipt/refusal/proof-gap/replay terminal records (lines 149-176), and its schema binds terminal kind, artifacts, signatures, and verification policy (schemas lines 16-22, 24-40, 75-107). The product mapping should say `Certificate` means "optional terminal evidence projection over an Outcome", not "Passport", "Admission", or "Clearance".

7. The current tests prevent misuse of admission/handle, but no test proves the entire product projection vocabulary is source-derived from `ActionAttemptLifecycle` and does not add protocol primitives.

## Failures

- Product projection mapping is not yet source-owned. The lifecycle table is source-owned; the product words are split across prose, admission schemas, demo outputs, and representation/outcome helpers.
- `Outcome` is not a single product projection over terminal event evidence. It is partly prose and partly unrelated non-authority surface outcome helper.
- `Clearance` has no source-owned projection contract. That is the most dangerous gap because it is the word closest to authority.
- `Passport` lacks a first-class projection schema. Digest fields exist, but the non-authority semantics are not pinned by a dedicated source map.

## Proof Gaps

- No current test asserts that `Passport`, `Admission`, `Handle`, `Clearance`, `Outcome`, and `Certificate` all resolve through one source-owned projection map.
- No current test asserts that `Clearance` maps only to a fresh exact contract/policy/gateway lifecycle chain and never to a reusable workflow handle.
- No current test asserts that terminal `Outcome` maps to receipt/refusal/replay/proof-gap/certificate evidence and not downstream business success.
- No current source constant links service workflow prose to `actionAttemptLifecycleEntry()` keys.
- No current docs pointer names the source file that owns the product projection map, because that file does not exist.

## Required Changes

1. Add one source-owned projection map under `src/surfaces`, not under `src/protocol/areas`.

   Suggested shape:

   ```ts
   export const serviceWorkflowLifecycleProjectionMap = {
     Passport: {
       projectionKind: "passport",
       protocolPrimitive: false,
       createsAuthority: false,
       lifecycleKeys: [],
       sourceObjects: ["participant_identity_binding", "evidence_projection", "protected_path_health"],
       boundary: "presented evidence package only",
     },
     Admission: {
       projectionKind: "service_workflow_admission",
       protocolPrimitive: false,
       createsAuthority: false,
       lifecycleKeys: [],
       sourceObjects: ["ServiceWorkflowAdmission"],
       boundary: "service-side evidence/readback evaluation only",
     },
     Handle: {
       projectionKind: "service_workflow_handle",
       protocolPrimitive: false,
       createsAuthority: false,
       lifecycleKeys: [],
       sourceObjects: ["ServiceWorkflowHandle"],
       boundary: "correlation and readback context only",
     },
     Clearance: {
       projectionKind: "clearance",
       protocolPrimitive: false,
       createsAuthority: "derived_from_policy_greenlight_only",
       lifecycleKeys: [
         "proposeActionContract:recorded",
         "evaluatePolicy:greenlight",
         "gatewayCheck:recorded",
       ],
       refusalOrGapKeys: [
         "evaluatePolicy:refusal",
         "evaluatePolicy:review_required",
         "evaluatePolicy:proof_gap",
         "gatewayCheck:replay_refusal",
         "gatewayCheck:proof_gap",
         "gatewayCheck:conflict",
       ],
       boundary: "fresh exact protected-action path for one event",
     },
     Outcome: {
       projectionKind: "outcome",
       protocolPrimitive: false,
       createsAuthority: false,
       lifecycleKeys: [
         "gatewayCheck:recorded",
         "gatewayCheck:replay_refusal",
         "gatewayCheck:proof_gap",
         "reconcileSurfaceOperation:recorded",
         "reconcileSurfaceOperation:proof_gap",
       ],
       sourceObjects: ["receipt", "refusal", "proof_gap", "surface_operation_reconciliation"],
       boundary: "terminal readback, not downstream business success or retry permission",
     },
     Certificate: {
       projectionKind: "certificate",
       protocolPrimitive: false,
       createsAuthority: false,
       lifecycleKeys: ["createAuthorityCertificate:exported"],
       sourceObjects: ["authority_certificate"],
       boundary: "optional terminal evidence over one existing terminal event",
     },
   } as const;
   ```

   The exact implementation should use existing `ActionAttemptLifecycleKey`/`actionAttemptLifecycleEntry()` so invalid lifecycle keys fail in tests.

2. Keep the map in `src/surfaces` or a similarly explicit product-surface lane. Do not add `Passport`, `Admission`, `Handle`, `Clearance`, or `Outcome` to `src/protocol/areas` as protocol objects.

3. Add schemas if needed for `PassportProjection`, `ClearanceProjection`, `TerminalOutcomeProjection`, and `CertificateProjection`, but make them projections over existing refs. All should carry the same kind of hard non-authority booleans used by `ServiceWorkflowAuthorityBoundarySchema`.

4. Update docs to name the source-owned projection map:

   - `docs/internal/service-workflow-story.md`: replace prose-only mapping with "plain words derive from `serviceWorkflowLifecycleProjectionMap`".
   - `docs/internal/protocol-notes.md`: keep naming rules and add that service workflow terms live under `src/surfaces` as projections.
   - `docs/internal/protocol-definition.md`: keep protocol primitive names exact; mention product lifecycle projections are non-authority projections over the canonical state path.

5. Add tests:

   - `test/architecture/service-workflow-lifecycle-projection.test.ts`: every product term maps to existing lifecycle keys or explicitly has no lifecycle key because it is pre-contract evidence; all entries set `protocolPrimitive: false`.
   - Test `Clearance` includes `proposeActionContract`, `evaluatePolicy`, and `gatewayCheck` lifecycle keys, and refuses/review/proof-gap/replay branches are represented.
   - Test `Outcome` includes terminal evidence refs and does not equate receipt to downstream business success.
   - Test `Certificate` maps only to `createAuthorityCertificate:exported` and `authority_certificate` terminal evidence.
   - Extend the existing workflow-admission boundary test so product terms remain absent from authority-bearing protocol roots.

## Recommended Source/Docs/Test Changes

Source:

- Add `src/surfaces/service-workflow-lifecycle-projections.ts`.
- Export it from `src/surfaces/index.ts`; do not export it from the root unless product surface export policy explicitly allows it.
- Reuse `ServiceWorkflowAuthorityBoundarySchema` or factor a shared non-authority boundary schema for projection entries.

Docs:

- Make `docs/internal/service-workflow-story.md` a projection explanation over the source map, not a standalone vocabulary authority.
- Keep `docs/internal/protocol-definition.md` strict: the protocol object list must not gain Passport/Admission/Handle/Clearance/Outcome.
- Add one compact note in `docs/internal/protocol-notes.md` that product workflow terms are non-authority projections under `src/surfaces`.

Tests:

- Add projection-map coverage tests.
- Add a docs/source consistency test only if the repo already tolerates this style; otherwise keep the source map as the single tested authority and let docs point to it.
- Do not broaden tests into hosted trust, provider custody, live revocation, settlement, or marketplace claims.

## Risks If Product Projection Mapping Is Not Source-Owned

- `Clearance` becomes ambient authority wearing a badge: a workflow handle could be read as permission instead of correlation.
- `Passport` can swallow the product: identity/admission evidence starts posing as spend approval, signer access, or reusable auth.
- `Outcome` becomes evidence theatre: receipt, downstream finality, proof gap, and certificate get blurred into one success word.
- `Certificate` can be misused as a passport or badge if the product story does not derive it from terminal evidence only.
- Docs can drift faster than source. The current prose is good, but prose is not a mechanism.
- A future macro plan could create tasks around product names without touching the actual gateway-enforced lifecycle.

## Status Recommendation

Focus recommendation only: `NEEDS_REQUIRED_CHANGES` for the product projection mapping gate.

The protocol lifecycle spine itself is present and source-owned. The product projection vocabulary is not yet source-owned as one derivation table. Do not promote any macro-plan status that depends on Passport/Admission/Handle/Clearance/Outcome/Certificate being a mechanically enforced projection layer until that source map and tests exist.

## Brutal Verdict

Keep the existing lifecycle spine. It is the right primitive.

Cut any impulse to add Passport, Admission, Handle, Clearance, or Outcome as protocol primitives. That would create a second authority model.

Narrow the product story into one source-owned projection table under `src/surfaces`. `Clearance` must be the fresh exact lifecycle chain. `Outcome` must be terminal readback. `Certificate` must be optional terminal evidence. `Passport`, `Admission`, and `Handle` must stay pre-contract evidence/correlation.

Smallest next mechanism: add `serviceWorkflowLifecycleProjectionMap` under `src/surfaces` and test it against `ActionAttemptLifecycle`.

## Commands Or Tools Used

- Read skill guidance: `handshake-grounding`, `gsd-macro-plan`.
- Memory quick pass: searched `MEMORY.md` for Handshake macro-plan/protected-action context.
- Repo grounding: `pwd`, `git status --short --branch`.
- File discovery: `rg --files`, `find`.
- Source/doc/test reads: `awk` and `rg`.
- Report write: `mkdir -p` for the audit directory, then `apply_patch` to add this file.
- Tests were not run; this was a read-only audit of source/docs/tests, not a verification pass.
