## Audit Scope

Focus: 10-star product design, DevEx, and adoption for Tier 1 / Tier 2 product simplification.

Verdict: keep the simplification direction, but do not let it become executable macro-plan evidence until one source-owned product-surface readback contract, one first-use demo, and negative non-authority tests exist. "Simple" must mean the user sees fewer kernel nouns while the system preserves the exact boundary:

```text
standing evidence
-> service admission/readback
-> non-authority workflow handle
-> fresh protected action request
-> exact policy decision
-> one-use greenlight or refusal
-> gateway check before mutation
-> receipt, refusal, replay refusal, proof gap, or terminal evidence
```

If Passport, Admission, Badge, Handle, Certificate, CLI, MCP, SDK, docs, or examples imply reusable permission, this is ambient authority wearing a badge.

## Source Boundary

Canonical repo truth wins over `.planning/` scratch. The current source boundary says:

- `README.md`, `docs/internal/decisions.md`, and `docs/internal/protocol-notes.md` define Handshake as protected action infrastructure for automated decision making.
- Product surfaces are CLI, MCP, SDK, docs, demos, or service readback that expose proposal/evidence/readback without creating authority.
- The current first official wedge is one buyer-side `x402_payment.exact` per-call protected action.
- Public npm availability, MCP Registry metadata, host profiles, local demos, terminal certificates, and readback surfaces are evidence/distribution, not authority.
- `.planning/macro-map/*` and `.planning/codebase/*` are scratch/derived planning evidence, useful for this audit but not repo-facing canon.

Memory was used only as context for known local Handshake boundary pitfalls. It is not source evidence for this audit.

## Files Read

- `/Users/joelchan/.codex/skills/gsd-macro-plan/SKILL.md`
- `/Users/joelchan/.codex/skills/gsd-macro-plan/references/output-quality-bar.md`
- `/Users/joelchan/.codex/memories/MEMORY.md` context only
- `.planning/macro-plan/runs/20260525T095940Z-tier1-tier2-product-simplification/input.md`
- `.planning/macro-map/EXPERIENCE-MAP.md`
- `.planning/macro-map/views/DESIGN.md`
- `.planning/macro-map/views/DEVEX.md`
- `.planning/macro-map/views/CEO.md`
- `.planning/codebase/STACK.md`
- `.planning/codebase/STRUCTURE.md`
- `.planning/codebase/CONVENTIONS.md`
- `.planning/codebase/TESTING.md`
- `README.md`
- `docs/internal/protocol-layman.md`
- `docs/internal/decisions.md`
- `docs/internal/protocol-notes.md`

## Invariant At Stake

Product simplification may hide protocol complexity from users, but it must not hide or weaken authority, gateway, evidence, refusal, proof-gap, isolation, or reconstruction boundaries.

The product-design invariant:

```text
Every user-facing shortcut must map to a visible non-authority surface or to a source-owned protocol transition. No friendly noun may smuggle permission.
```

The DevEx invariant:

```text
The fastest developer path must teach the protected-action chain by doing one local proof, including a negative authority attempt, without making CLI/MCP/SDK/example artifacts look like enforcement.
```

## Pass Conditions

### 10-Star Criteria Refinements

- The first screen / first doc / first command teaches the story as "service accepts evidence into a bounded workflow, then every protected event still needs fresh clearance."
- Every surfaced object has explicit false posture fields, at minimum: `createsAuthority: false`, `createsGreenlight: false`, `performsGatewayCheck: false`, `permitsMutation: false`, plus existing repo posture fields where applicable.
- The five non-authority correlation fields are preserved and documented: `passportPackageDigest`, `passportPresentationId`, `admissionId`, `serviceWorkflowHandleId`, and `serviceWorkflowHandleDigest`.
- The first-use path includes a negative attempt where a handle alone fails to call a protected API, pay an x402 challenge, mutate a service, satisfy a gateway, export a receipt, or mint a certificate.
- SDK, CLI, MCP, docs, and examples converge on one packet shape. They must not each invent a parallel metaphor.
- Role-scoped SDK clients are taught before the lower-level `HandshakeClient`.
- MCP remains proposal/evidence/readback only. New MCP resources may expose admission/readback, but no MCP tool may imply it can admit, approve, pay, sign, gateway-check, or mutate.
- CLI commands remain evidence/readiness/readback only and must be listed in `src/cli/command-manifest.ts` with explicit non-goals before docs teach them.
- Example output is the source-owned teaching artifact: JSON plus Markdown, product-tested, with no hosted/provider/settlement/marketplace/certification overclaim.
- Tier 3 progression remains blocked until Tier 1 / Tier 2 simplification either has passing proof gates or records explicit proof gaps.

### First-Use Path

The macro plan should require this first-use path:

1. Read a short story section in `docs/internal/protocol-layman.md` that avoids `OperatingEnvelope`, `DelegatedAuthorityRef`, and `ActionContract` until after the user understands the flow.
2. Run a local source-owned fixture that emits a `ServiceWorkflowAdmission` or `ServiceWorkflowAdmissionReport`.
3. Inspect a `ServiceWorkflowHandle` with all non-authority flags and the five correlation fields.
4. Try to use the handle as authority and observe a refusal/proof-gap/readback result before any signer, gateway check, mutation, receipt export, or certificate.
5. Create one fresh `x402_payment.exact` protected action request using the existing readiness ladder.
6. Clear or refuse it through the role-scoped runtime, policy, and gateway clients.
7. Inspect receipt/refusal/replay-refusal/proof-gap readback and, only after terminal evidence exists, optional certificate verification.

The current `README.md` x402 ladder is useful, but it starts with installation mechanics. The simplified path should wrap that ladder in the product story instead of replacing the authority sequence.

### Naming Decisions

- Use `ServiceWorkflowAdmission` or `ServiceWorkflowAdmissionReport` for the surface that records accepted/refused/stale/proof-gap standing evidence.
- Use `ServiceWorkflowHandle` for the carried workflow context object.
- Keep `Badge` out of exported SDK, CLI, MCP, source path, test, and package-surface names. It can appear only as carefully bounded explanatory copy, if at all.
- `AgentPassportPackage` is acceptable as a presented evidence bundle name only if every use says it is not identity, trust, permission, spend approval, gateway acceptance, signer permission, mutation permission, receipt export, terminal certification, or reusable auth.
- Avoid `Admission` as a verb in commands or tools. `admit`, `approve`, `authorize`, `certify`, `trust`, `login`, `verifyAgent`, and `grant` are too authority-loaded unless backed by a source-owned transition with the same authority.
- Keep `AuthorityCertificate` visibly terminal: receipt/refusal/proof-gap/replay evidence only, not a pass or badge.

## Failures

- No source-owned `ServiceWorkflowAdmission`, `ServiceWorkflowAdmissionReport`, or `ServiceWorkflowHandle` schema exists in the required sources.
- No current demo starts with an evidence/passport package, emits admission/readback, proves handle-as-authority failure, and then continues into one `x402_payment.exact` clearance.
- No rendered review/readback artifact was available to inspect for copy, layout, state separation, or hidden authority leakage.
- No negative tests currently prove the proposed fields cannot create policy decisions, greenlights, gateway checks, signer use, mutations, receipts, exports, or certificates.
- `Badge` remains the most dangerous simplification noun. Developers will naturally treat it as reusable auth unless the API name is `ServiceWorkflowHandle` and the false posture fields are mandatory.
- The README first-use ladder is mechanically strong but product-cognitively inverted: it teaches install/x402 mechanics before the larger protected-action story.
- SDK/CLI/MCP/docs/examples are not yet converged around one product packet. Without convergence, simplification becomes more vocabulary, not less complexity.

### UX Anti-Patterns

- Showing a single "approved", "verified", "admitted", or "cleared" badge without separate rows for evidence recognition, action request, policy decision, gateway check, mutation attempt, receipt/refusal/proof gap, and downstream uncertainty.
- Letting the handle appear in UI near buttons that say pay, execute, sign, deploy, approve, retry, or repair.
- Treating refusal, proof gap, replay refusal, or support-bundle generation as retry permission.
- Using certificate visuals before terminal evidence exists.
- Rendering a human summary that is not structurally bound to the exact action contract.
- Teaching `HandshakeClient` first and only later explaining role custody.
- Hiding raw/sibling bypass posture from the first-use proof.
- Copying hand-written JSON into docs instead of generating schema-shaped samples from source-owned demos.

## Proof Gaps

- User comprehension is unproven. The macro map has strong reasoning, but no evidence that new developers will distinguish Passport/Admission/Handle from auth.
- Product-surface source placement is unresolved. The safe default is `src/surfaces` plus example/readback tests, not `src/protocol/areas`, unless a new authority transition is intentionally created.
- CLI command shape is unresolved. A new command may be useful only if it is readback/evidence posture and manifest-tested.
- MCP readback shape is unresolved. A read-only resource is safer than a new tool.
- SDK surface shape is unresolved. Role-scoped clients should expose or consume the readback shape without acquiring all-role authority.
- Adoption value is unproven until a clean installed-artifact or local repo first-use path can be run by a fresh developer without chat memory.
- No source-owned packet yet proves docs, SDK, CLI, MCP, and examples all describe the same object with the same non-authority fields.

## Required Changes

### Docs / SDK / CLI / MCP / Example Convergence Plan

1. Define one source-owned surface packet:

```text
ServiceWorkflowAdmissionReport
  passportPackageDigest
  passportPresentationId
  admissionId
  acceptedStandingEvidenceRefs
  refusedStandingEvidenceRefs
  staleStandingEvidenceRefs
  proofGapEvidenceRefs
  serviceWorkflowHandleId
  serviceWorkflowHandleDigest
  boundedAttemptScope
  nextActionRequestTemplateRef
  createsAuthority: false
  createsGreenlight: false
  performsGatewayCheck: false
  permitsMutation: false
```

2. Place it in a product-surface/readback lane first, not in a protocol primitive lane, unless the chair explicitly scopes a new authority transition.
3. Add a local example such as `examples/service-workflow-admission/` that emits stable JSON and Markdown output and includes a handle-as-authority refusal.
4. Update `docs/internal/protocol-layman.md` to teach this story, then map it to the exact protocol chain.
5. Update `README.md` first-use language so the existing x402 ladder is the protected-event continuation, not the whole product story.
6. SDK: expose or consume the packet through role-scoped clients only. Do not teach the all-role root client as the first activation path.
7. CLI: either reuse existing evidence/readback commands or add only a manifest-declared readback command. It must have explicit non-goals and must not use mutation-shaped names.
8. MCP: expose admission/readback as read-only resources if needed. Keep `handshake.actions.x402_payment.propose` as proposal-only and do not add an authority-sounding admission tool.
9. Examples: make generated demo output the source of docs snippets where possible.
10. Tests: add or extend `quality:claims`, `quality:architecture`, `surface-boundary-posture`, CLI/MCP posture, role-client, and product demo tests to lock the convergence.

### Adoption Gates

- Gate 1: a fresh developer can run the local example and see accepted/refused/stale/proof-gap evidence plus non-authority handle fields without reading kernel internals first.
- Gate 2: the negative handle-as-authority path refuses before policy, greenlight, gateway check, signer use, mutation, receipt export, or certificate.
- Gate 3: the same packet fields appear in docs, SDK typing, CLI/MCP readback, and example output.
- Gate 4: role-scoped SDK client docs remain the first taught SDK path.
- Gate 5: `npm run quality:claims` passes after language changes.
- Gate 6: `npm run quality:architecture` passes after surface, command, export, and naming changes.
- Gate 7: focused product/demo tests pass for the generated output packet.
- Gate 8: package/public-surface checks pass if any export or package README changes.
- Gate 9: `npm run check:repo` passes before the macro plan treats the simplification as implementation-ready.

## Status Recommendation

Sidecar recommendation: design/DevEx/adoption gate is not passable yet. The direction is strong enough to plan, but not strong enough to execute without a source-owned packet, a first-use demo, convergence across surfaces, and negative non-authority tests.

Do not use this focus as evidence for `READY_FOR_AGENT_EXECUTION`. This sidecar does not select the macro-plan status; the chair must reconcile this with other audits and validation.

## Commands Or Tools Used

- `rg -n` over `/Users/joelchan/.codex/memories/MEMORY.md` for relevant Handshake context.
- `wc -l` for required source sizing.
- `sed -n` for required source reads.
- `ls -la` to inspect the assigned audit directory.
- `test -e` to confirm the assigned report did not already exist.
- `git status --short -- <assigned-report>` to check the assigned write path.
- `apply_patch` to write this one report.

## Smallest Next Mechanism

Build the non-authority readback contract before changing public story or SDK ergonomics:

```text
ServiceWorkflowAdmissionReport + ServiceWorkflowHandle
-> explicit false authority fields
-> handle-as-authority refusal fixture
-> one x402 protected-event continuation
-> JSON/Markdown example output
-> claim, architecture, CLI/MCP, SDK, and product tests
```

That is the smallest mechanism that can make the product feel simple without making the system basic or advisory.
