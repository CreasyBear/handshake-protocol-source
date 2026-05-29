# Phase 04 — Working tree reconciliation

**Generated:** 2026-05-29
**Branch:** codex/architectural-north-star-simplification
**Last clean commit:** 1e801b7
**Working tree entries:** 265
**Disposition tallies:**
- plan-04-NN-task-M-complete: 0
- independent-fix: 19
- out-of-scope-defer: 179
- phase-05-candidate: 45
- plan-04-01-task-1-partial: 2
- plan-04-01-task-2-partial: 2
- plan-04-01-task-3-partial: 1
- plan-04-02-task-2-partial: 1
- plan-04-02-task-3-partial: 1
- plan-04-03-task-2-partial: 2
- plan-04-03-task-3-partial: 1
- plan-04-04-task-1-partial: 1
- plan-04-04-task-4-partial: 1
- plan-04-05-task-1-partial: 1
- plan-04-05-task-2-partial: 2
- plan-04-06-task-2-partial: 3
- plan-04-06-task-4-partial: 1
- plan-04-07-task-1-partial: 1
- plan-04-10-task-3-partial: 2
- revert: 0

**Drift percentage** (independent-fix + revert + out-of-scope-defer ÷ total): 74.7%

> Halt condition per plan: drift > 20% halts reconciliation pending user triage.

**Halt verdict:** HALT — drift 74.7% exceeds 20% threshold. Working tree is predominantly north-star / phase-05 product-coherence drift (179 defer + 45 phase-05 park) against 22 phase-04 partial matches and 0 complete.

---

## Commit landing order (per Step 2 of execution plan)

### Order 1 — plan task complete commits (per matched plan task)

_No files classified as plan-task-complete. All phase-04 `files_modified` matches are partial relative to locked acceptance criteria._

### Order 2 — plan task partial commits (with gap notes)

#### `wip(04-01): partial — No shortened agent chain with schema-native non-authority bullets`
Files (2):
- `docs/internal/protocol-layman.md` — evidence: protocol-layman.md; gap: No shortened agent chain with schema-native non-authority bullets per 04-01-T1
- `docs/internal/service-workflow-story.md` — evidence: service-workflow-story.md:1-150; gap: Passport/admission story present but Agent lane D-05 mapping table absent per 04-01-T1
**Gap to close in Step 3:** No shortened agent chain with schema-native non-authority bullets per 04-01-T1

#### `wip(04-01): partial — Large north-star edits but missing Clerk-for-agents run*Gateway subsection and configuredBy custody matrix`
Files (2):
- `docs/internal/decisions.md` — evidence: decisions.md; gap: Large north-star edits but missing Clerk-for-agents run*Gateway subsection and configuredBy custody matrix per 04-01-T2/04-10-T1
- `docs/internal/protocol-notes.md` — evidence: protocol-notes.md; gap: Updated notes lack dual-enforcement cross-ref paragraph per 04-01-T2
**Gap to close in Step 3:** Large north-star edits but missing Clerk-for-agents run*Gateway subsection and configuredBy custody matrix per 04-01-T2/04-10-T1

#### `wip(04-01): partial — Modified but dual-enforcement-posture.test.ts still missing`
Files (1):
- `test/architecture/claim-boundary.test.ts` — evidence: claim-boundary.test.ts; gap: Modified but dual-enforcement-posture.test.ts still missing; D-00 claim matrix extensions unverified
**Gap to close in Step 3:** Modified but dual-enforcement-posture.test.ts still missing; D-00 claim matrix extensions unverified

#### `wip(04-02): partial — Start Here lists host/CLI surfaces not service-operator-golden-path.md single entry`
Files (1):
- `docs/internal/developer-experience-index.md` — evidence: developer-experience-index.md:7-19; gap: Start Here lists host/CLI surfaces not service-operator-golden-path.md single entry per 04-02-T2
**Gap to close in Step 3:** Start Here lists host/CLI surfaces not service-operator-golden-path.md single entry per 04-02-T2

#### `wip(04-02): partial — Scripts expanded for product closeout`
Files (1):
- `package.json` — evidence: package.json; gap: Scripts expanded for product closeout; demo:service-workflow-admission canonization and check-service-agent-gating-phase.mjs absent per 04-02-T3/04-12-T3
**Gap to close in Step 3:** Scripts expanded for product closeout; demo:service-workflow-admission canonization and check-service-agent-gating-phase.mjs absent per 04-02-T3/04-12-T3

#### `wip(04-03): partial — Manifest adds doctor/quality/simulate but not handshake service bootstrap or quickstart agent-spine`
Files (2):
- `src/cli/command-manifest.ts` — evidence: command-manifest.ts; gap: Manifest adds doctor/quality/simulate but not handshake service bootstrap or quickstart agent-spine per 04-03/04-04
- `src/cli/index.ts` — evidence: cli/index.ts; gap: Router wired for north-star CLI modules; service bootstrap and agent-spine routes missing per 04-03/04-04
**Gap to close in Step 3:** Manifest adds doctor/quality/simulate but not handshake service bootstrap or quickstart agent-spine per 04-03/04-04

#### `wip(04-03): partial — HTTP tests modified`
Files (1):
- `test/http/http.test.ts` — evidence: http.test.ts; gap: HTTP tests modified; InstallProposal orphan-catalog assertions from 04-03-T3 not verified
**Gap to close in Step 3:** HTTP tests modified; InstallProposal orphan-catalog assertions from 04-03-T3 not verified

#### `wip(04-04): partial — Directory has x402 quickstart only`
Files (1):
- `src/cli/quickstart/` — evidence: src/cli/quickstart/x402.ts; gap: Directory has x402 quickstart only; agent-spine.ts sequencer missing per 04-04-T1
**Gap to close in Step 3:** Directory has x402 quickstart only; agent-spine.ts sequencer missing per 04-04-T1

#### `wip(04-04): partial — New untracked host guidance doc`
Files (1):
- `docs/internal/host-golden-paths-and-trace-guidance.md` — evidence: host-golden-paths-and-trace-guidance.md; gap: New untracked host guidance doc; bilateral setup order and service prerequisite sections incomplete vs 04-04-T4/04-10-T2
**Gap to close in Step 3:** New untracked host guidance doc; bilateral setup order and service prerequisite sections incomplete vs 04-04-T4/04-10-T2

#### `wip(04-05): partial — Schema still lacks failureClass, failurePhase, problemType fields`
Files (1):
- `src/http/errors/transition-error-envelope.ts` — evidence: transition-error-envelope.ts:32-45; gap: Schema still lacks failureClass, failurePhase, problemType fields per 04-05-T1
**Gap to close in Step 3:** Schema still lacks failureClass, failurePhase, problemType fields per 04-05-T1

#### `wip(04-05): partial — Minor edits`
Files (2):
- `src/http/admission/caller-auth.ts` — evidence: caller-auth.ts; gap: Minor edits; admission errors not mapped to failureClass/httpStatus discipline per 04-05-T2
- `src/protocol/foundation/reason-code-remediation/` — evidence: reason-code-remediation/index.ts; gap: Module exists; failureClass remediation rows for new classes not verified per 04-05-T2
**Gap to close in Step 3:** Minor edits; admission errors not mapped to failureClass/httpStatus discipline per 04-05-T2

#### `wip(04-06): partial — HandshakeClientError lacks failureClass/failurePhase parsing`
Files (3):
- `src/sdk/client.ts` — evidence: sdk/client.ts; gap: HandshakeClientError lacks failureClass/failurePhase parsing per 04-06-T2
- `src/sdk/surface-clients/transport.ts` — evidence: transport.ts; gap: Transport parses envelope but not failureClass per 04-06-T2
- `src/sdk/repair.ts` — evidence: sdk/repair.ts; gap: Repair helpers present but not wired to failureClass retry guidance per 04-06-T2
**Gap to close in Step 3:** HandshakeClientError lacks failureClass/failurePhase parsing per 04-06-T2

#### `wip(04-06): partial — Proposal path updated`
Files (1):
- `src/mcp/x402-proposal.ts` — evidence: x402-proposal.ts; gap: Proposal path updated; shared failureClass classifier wiring and parity test absent per 04-06-T4
**Gap to close in Step 3:** Proposal path updated; shared failureClass classifier wiring and parity test absent per 04-06-T4

#### `wip(04-07): partial — integratorTier1 metadata tags and export array not present`
Files (1):
- `src/protocol/navigation/index.ts` — evidence: navigation/index.ts; gap: integratorTier1 metadata tags and export array not present per 04-07-T1
**Gap to close in Step 3:** integratorTier1 metadata tags and export array not present per 04-07-T1

#### `wip(04-10): partial — Contains doctor.ts`
Files (2):
- `src/cli/host/` — evidence: src/cli/host/doctor.ts:23-42; gap: Contains doctor.ts; lacks attestationEvidence/nonClaims attestation framing per 04-10-T3
- `src/cli/mcp/` — evidence: src/cli/mcp/doctor.ts; gap: Contains MCP doctor; attestation parity vs host doctor not verified per 04-10-T3
**Gap to close in Step 3:** Contains doctor.ts; lacks attestationEvidence/nonClaims attestation framing per 04-10-T3

### Order 3 — independent-fix scrub commits (max 5)

#### `chore(scrub): CLI and operator surface companions`
Files:
- `examples/service-workflow-admission/README.md` — Admission demo README companion for 04-02 demo canonization
- `examples/service-workflow-admission/run.ts` — Canonical service-workflow-admission demo referenced by 04-02-T3
- `src/cli/LANE.md` — CLI lane doc for new operator commands in manifest 04-04
- `src/cli/output.ts` — Shared cliOutput helper for bootstrap/doctor CLI surfaces 04-03/04-10
- `src/cli/projection-evidence.ts` — Projection evidence helper for SDK repair/readback 04-06
- `src/cli/support-bundle.ts` — Support bundle CLI uses reason-code remediation metadata 04-05
- `src/cli/x402/index.ts` — x402 CLI surface for host quickstart path 04-04
- `src/http/LANE.md` — HTTP lane doc adjacent to transition-error envelope work 04-05
- `test/architecture/cli-command-posture.test.ts` — CLI manifest posture test companion to command-manifest 04-04-T2
- `test/cli/cli-evidence.test.ts` — Evidence CLI tests companion to SDK repair 04-06
- `test/cli/cli-support-bundle.test.ts` — Support bundle CLI test companion 04-05 failure taxonomy surfaces
- `test/cli/cli-x402-install-probes.test.ts` — Host/x402 install probe tests companion to doctor CLI 04-10
- `test/sdk/role-clients.test.ts` — Role client tests adjacent to failureClass SDK work 04-06
- `src/cli/demo/` — CLI demo module adjacent to quickstart/host operator path 04-04
- `src/cli/quality/` — Quality report CLI in devex index 04-04
- `src/cli/simulate/` — Simulate x402-payment module referenced by agent-spine plan 04-04-T1
- `src/cli/state/` — State inspect CLI listed in devex index host path 04-04
- `src/cli/x402/readiness.ts` — x402 readiness helper for host operator commands 04-04
- `test/cli/cli-mcp-doctor.test.ts` — MCP doctor test companion to 04-10-T3

### Order 4 — revert commits

_None. No working-tree changes contradict locked phase-04 decisions strongly enough to require restore (D-62 concierge lock not evidenced in modified src paths)._ 

### Order 5 — phase-05-candidate (PARK, do not commit on this branch)

Files to leave uncommitted on `codex/architectural-north-star-simplification` branch:
- `README.md` — matches 05-10-PLAN files_modified
- `src/cli/main.ts` — matches 05-06-PLAN files_modified
- `src/http/admission/hosted-admission-config.ts` — matches 05-09-PLAN files_modified
- `src/http/admission/hosted-caller-identity.ts` — matches 05-09-PLAN files_modified
- `src/http/app.ts` — matches 05-01-PLAN files_modified
- `src/http/routes/evidence-read-route-registry.ts` — matches 05-08-PLAN files_modified
- `src/index.ts` — matches 05-07-PLAN files_modified
- `src/mcp/resources.ts` — matches 05-06-PLAN files_modified
- `src/protocol/evidence-projections/projections.ts` — matches 05-08-PLAN files_modified
- `src/protocol/evidence-projections/schemas.ts` — matches 05-08-PLAN files_modified
- `src/sdk/surface-clients/evidence-client.ts` — matches 05-06-PLAN files_modified
- `src/surfaces/boundary-manifest.ts` — matches 05-09-PLAN files_modified
- `src/surfaces/proof-packets/index.ts` — matches 05-05-PLAN files_modified
- `src/surfaces/proof-packets/live-x402-requirement.ts` — Deleted monolith replaced by live-x402/ directory per product-completion refactor
- `src/surfaces/proof-packets/product-completion.ts` — matches 05-03-PLAN files_modified
- `src/surfaces/service-workflow-admission/index.ts` — matches 05-05-PLAN files_modified
- `src/x402-protected-tool/index.ts` — matches 05-13-PLAN files_modified
- `test/adapters/x402-wallet-gateway.test.ts` — matches 05-13-PLAN files_modified
- `test/architecture/root-exports.test.ts` — matches 05-07-PLAN files_modified
- `scripts/build-product-closeout-bundle.mjs` — Product closeout bundle builder for phase 05 product coherence
- `scripts/build-publish-handoff-packet.mjs` — Publish handoff packet builder for product completion
- `scripts/check-live-x402-paid-retry.mjs` — Product completion proof script cluster
- `scripts/check-product-completion.mjs` — matches 05-03-PLAN files_modified
- `src/cli/evidence/` — Evidence readback CLI for 05-08
- `src/hosted-admission/` — Hosted admission reexport module for 05-09
- `src/http/admission/hosted-verifier-adapter.ts` — matches 05-09-PLAN files_modified
- `src/http/handlers/scoped-evidence-record.ts` — matches 05-08-PLAN files_modified
- `src/protocol/evidence-projections/store-reader.ts` — matches 05-08-PLAN files_modified
- `src/protocol/foundation/host-trusted-binding.ts` — matches 05-13-PLAN files_modified
- `src/sdk/transport-url.ts` — SDK transport URL helper for export surface 05-07
- `src/surfaces/proof-packets/live-x402/` — Live x402 proof packet split aligns with product-completion phase 05-03
- `src/surfaces/proof-packets/product-completion-contract.ts` — matches 05-03-PLAN files_modified
- `test/adapters/x402-host-trusted-binding.test.ts` — matches 05-13-PLAN files_modified
- `test/adapters/x402-hosted-custody-readiness.test.ts` — Hosted custody readiness adapter test
- `test/architecture/cli-non-authority-copy.test.ts` — matches 05-11-PLAN files_modified
- `test/architecture/host-trusted-binding-parity.test.ts` — Host trusted binding parity for 05-13
- `test/architecture/hosted-admission-reexport-only.test.ts` — matches 05-09-PLAN files_modified
- `test/architecture/pack-check-expect-status.test.ts` — Pack check posture for product completion
- `test/architecture/planning-scratch-quarantine.test.ts` — matches 05-11-PLAN files_modified
- `test/architecture/product-closeout-bundle.test.ts` — Product closeout architecture test
- `test/architecture/product-completion-parity.test.ts` — matches 05-03-PLAN files_modified
- `test/architecture/proof-script-build-freshness.test.ts` — Proof script freshness gate
- `test/architecture/publish-handoff-packet.test.ts` — Publish handoff architecture test
- `test/http/hosted-identity-evidence.test.ts` — Hosted identity evidence HTTP tests
- `test/protocol/host-trusted-binding.test.ts` — Protocol host-trusted-binding tests

### Order 6 — out-of-scope-defer (PARK to .planning/inbox/)

Files to park for later evaluation:
- `.gitignore` — Repo metadata/orientation outside phase-04/05 files_modified
- `.planning/codebase/ARCHITECTURE.md` — Planning scratch / macro-plan edits; not phase-04 executable deliverable
- `.planning/codebase/CONCERNS.md` — Planning scratch / macro-plan edits; not phase-04 executable deliverable
- `.planning/codebase/CONVENTIONS.md` — Planning scratch / macro-plan edits; not phase-04 executable deliverable
- `.planning/codebase/INTEGRATIONS.md` — Planning scratch / macro-plan edits; not phase-04 executable deliverable
- `.planning/codebase/STACK.md` — Planning scratch / macro-plan edits; not phase-04 executable deliverable
- `.planning/codebase/STRUCTURE.md` — Planning scratch / macro-plan edits; not phase-04 executable deliverable
- `.planning/codebase/TESTING.md` — Planning scratch / macro-plan edits; not phase-04 executable deliverable
- `.planning/macro-plan/AGENT-HANDOFF.md` — Planning scratch / macro-plan edits; not phase-04 executable deliverable
- `.planning/macro-plan/DECISIONS.md` — Planning scratch / macro-plan edits; not phase-04 executable deliverable
- `.planning/macro-plan/EVIDENCE-PLAN.md` — Planning scratch / macro-plan edits; not phase-04 executable deliverable
- `.planning/macro-plan/EXECUTION-SLICES.md` — Planning scratch / macro-plan edits; not phase-04 executable deliverable
- `.planning/macro-plan/MACRO-PLAN.md` — Planning scratch / macro-plan edits; not phase-04 executable deliverable
- `.planning/macro-plan/PROTECTED-ACTION-GATES.md` — Planning scratch / macro-plan edits; not phase-04 executable deliverable
- `.planning/macro-plan/README.md` — Planning scratch / macro-plan edits; not phase-04 executable deliverable
- `.planning/macro-plan/REVIEW-GATES.md` — Planning scratch / macro-plan edits; not phase-04 executable deliverable
- `.planning/macro-plan/RISKS.md` — Planning scratch / macro-plan edits; not phase-04 executable deliverable
- `.planning/macro-plan/RUNTIME-GATES.md` — Planning scratch / macro-plan edits; not phase-04 executable deliverable
- `.planning/macro-plan/TASKS.jsonl` — Planning scratch / macro-plan edits; not phase-04 executable deliverable
- `.planning/phases/02-address-concerns/02-PLANS-INDEX.md` — Planning scratch / macro-plan edits; not phase-04 executable deliverable
- `CHANGELOG.md` — Repo metadata/orientation outside phase-04/05 files_modified
- `QUALITY.md` — Repo metadata/orientation outside phase-04/05 files_modified
- `STRUCTURE.md` — Repo metadata/orientation outside phase-04/05 files_modified
- `docs/internal/protocol-definition.md` — Canonical/protocol doc drift from north-star; not in phase-04 files_modified
- `docs/internal/protocol-kernel-architecture.md` — Canonical/protocol doc drift from north-star; not in phase-04 files_modified
- `docs/internal/release-admin-runbook.md` — Canonical/protocol doc drift from north-star; not in phase-04 files_modified
- `examples/a2a-negotiated-x402-room/README.md` — A2A negotiated room example; negotiation surface work outside phase-04 scope
- `examples/a2a-negotiated-x402-room/agent-handoff.md` — A2A negotiated room example; negotiation surface work outside phase-04 scope
- `examples/a2a-negotiated-x402-room/evaluation.md` — A2A negotiated room example; negotiation surface work outside phase-04 scope
- `examples/a2a-negotiated-x402-room/generate.ts` — A2A negotiated room example; negotiation surface work outside phase-04 scope
- `examples/a2a-negotiated-x402-room/latest.json` — A2A negotiated room example; negotiation surface work outside phase-04 scope
- `examples/a2a-negotiated-x402-room/latest.md` — A2A negotiated room example; negotiation surface work outside phase-04 scope
- `examples/a2a-negotiated-x402-room/local-reference-records.ts` — A2A negotiated room example; negotiation surface work outside phase-04 scope
- `examples/a2a-negotiated-x402-room/local-reference-room.ts` — A2A negotiated room example; negotiation surface work outside phase-04 scope
- `scripts/build-package-bundles.mjs` — Release/proof script maintenance from north-star; not phase-04 files_modified
- `scripts/check-clean-installed-activation.mjs` — Release/proof script maintenance from north-star; not phase-04 files_modified
- `scripts/check-codex-host-activation.mjs` — Release/proof script maintenance from north-star; not phase-04 files_modified
- `scripts/check-distribution-provenance.mjs` — Release/proof script maintenance from north-star; not phase-04 files_modified
- `scripts/check-npm-maintainer-posture.mjs` — Release/proof script maintenance from north-star; not phase-04 files_modified
- `scripts/check-package-surface.mjs` — Release/proof script maintenance from north-star; not phase-04 files_modified
- `scripts/check-published-entrypoints.mjs` — Release/proof script maintenance from north-star; not phase-04 files_modified
- `scripts/check-release-proof.mjs` — Release/proof script maintenance from north-star; not phase-04 files_modified
- `scripts/install-codex-host-activation.mjs` — Release/proof script maintenance from north-star; not phase-04 files_modified
- `server.json` — Repo metadata/orientation outside phase-04/05 files_modified
- `src/adapters/downstream-failure-evidence.ts` — Source changes from north-star simplification; not in phase-04 files_modified
- `src/adapters/x402-payment/action-proposal.ts` — Source changes from north-star simplification; not in phase-04 files_modified
- `src/adapters/x402-payment/protected-tool-profile/index.ts` — Source changes from north-star simplification; not in phase-04 files_modified
- `src/adapters/x402-payment/protected-tool-readiness/index.ts` — Source changes from north-star simplification; not in phase-04 files_modified
- `src/http/app-options.ts` — Source changes from north-star simplification; not in phase-04 files_modified
- `src/http/errors/codes.ts` — Source changes from north-star simplification; not in phase-04 files_modified
- `src/http/handlers/evidence-read.ts` — Source changes from north-star simplification; not in phase-04 files_modified
- `src/http/handlers/hosted-readiness.ts` — Source changes from north-star simplification; not in phase-04 files_modified
- `src/http/handlers/internal-record-read.ts` — Source changes from north-star simplification; not in phase-04 files_modified
- `src/http/routes/transition-scope-resolvers.ts` — Source changes from north-star simplification; not in phase-04 files_modified
- `src/mcp/catalog.ts` — Source changes from north-star simplification; not in phase-04 files_modified
- `src/mcp/reference-transcript-fixtures.ts` — Source changes from north-star simplification; not in phase-04 files_modified
- `src/mcp/reference-transcript.ts` — Source changes from north-star simplification; not in phase-04 files_modified
- `src/mcp/stdio/process-proof.ts` — Source changes from north-star simplification; not in phase-04 files_modified
- `src/mcp/stdio/server.ts` — Source changes from north-star simplification; not in phase-04 files_modified
- `src/protocol/areas/action-attempt-lifecycle/matrix.ts` — Source changes from north-star simplification; not in phase-04 files_modified
- `src/protocol/areas/authority-certificate/transitions.ts` — Source changes from north-star simplification; not in phase-04 files_modified
- `src/protocol/areas/generated-execution-graph/transitions.ts` — Source changes from north-star simplification; not in phase-04 files_modified
- `src/protocol/areas/intent-compilation/transitions.ts` — Source changes from north-star simplification; not in phase-04 files_modified
- `src/protocol/areas/negotiation/LANE.md` — Negotiation protocol area edits outside phase-04 kernel-freeze scope
- `src/protocol/areas/negotiation/inputs.ts` — Negotiation protocol area edits outside phase-04 kernel-freeze scope
- `src/protocol/areas/negotiation/policy.ts` — Negotiation protocol area edits outside phase-04 kernel-freeze scope
- `src/protocol/areas/negotiation/schemas.ts` — Negotiation protocol area edits outside phase-04 kernel-freeze scope
- `src/protocol/areas/negotiation/transitions.ts` — Negotiation protocol area edits outside phase-04 kernel-freeze scope
- `src/protocol/areas/object-registry/index.ts` — Source changes from north-star simplification; not in phase-04 files_modified
- `src/protocol/areas/object-registry/schemas.ts` — Source changes from north-star simplification; not in phase-04 files_modified
- `src/protocol/areas/operation-lifecycle/inputs.ts` — Source changes from north-star simplification; not in phase-04 files_modified
- `src/protocol/areas/operation-lifecycle/schemas.ts` — Source changes from north-star simplification; not in phase-04 files_modified
- `src/protocol/areas/operation-lifecycle/transitions.ts` — Source changes from north-star simplification; not in phase-04 files_modified
- `src/protocol/areas/policy-greenlight/policy-record/index.ts` — Source changes from north-star simplification; not in phase-04 files_modified
- `src/protocol/areas/policy-greenlight/schemas.ts` — Source changes from north-star simplification; not in phase-04 files_modified
- `src/protocol/areas/policy-greenlight/sequence-dependencies.ts` — Source changes from north-star simplification; not in phase-04 files_modified
- `src/protocol/areas/policy-greenlight/transitions.ts` — Source changes from north-star simplification; not in phase-04 files_modified
- `src/protocol/events/records.ts` — Source changes from north-star simplification; not in phase-04 files_modified
- `src/protocol/events/schemas.ts` — Source changes from north-star simplification; not in phase-04 files_modified
- `src/protocol/evidence-projections/index.ts` — Source changes from north-star simplification; not in phase-04 files_modified
- `src/protocol/foundation/index.ts` — Source changes from north-star simplification; not in phase-04 files_modified
- `src/protocol/foundation/reason-codes.ts` — Source changes from north-star simplification; not in phase-04 files_modified
- `src/protocol/kernel.ts` — Source changes from north-star simplification; not in phase-04 files_modified
- `src/runtime/ingress/index.ts` — Source changes from north-star simplification; not in phase-04 files_modified
- `src/sdk/surface-clients/index.ts` — Source changes from north-star simplification; not in phase-04 files_modified
- `src/storage/d1/index.ts` — Source changes from north-star simplification; not in phase-04 files_modified
- `src/storage/kv/index.ts` — Source changes from north-star simplification; not in phase-04 files_modified
- `src/surfaces/LANE.md` — Source changes from north-star simplification; not in phase-04 files_modified
- `src/surfaces/a2a-negotiation-readback/index.ts` — A2A negotiation support surface; not phase-04 service-agent-gating deliverable
- `src/surfaces/a2a-negotiation-support/index.ts` — A2A negotiation support surface; not phase-04 service-agent-gating deliverable
- `src/surfaces/product-launch-gate-resolution.ts` — Source changes from north-star simplification; not in phase-04 files_modified
- `src/surfaces/proof-packets/clean-installed-activation.ts` — Source changes from north-star simplification; not in phase-04 files_modified
- `src/surfaces/proof-packets/codex-host-activation.ts` — Source changes from north-star simplification; not in phase-04 files_modified
- `src/surfaces/proof-packets/distribution-provenance.ts` — Source changes from north-star simplification; not in phase-04 files_modified
- `src/surfaces/proof-packets/shared.ts` — Source changes from north-star simplification; not in phase-04 files_modified
- `src/surfaces/release-proof.ts` — Source changes from north-star simplification; not in phase-04 files_modified
- `src/x402-protected-tool/LANE.md` — Source changes from north-star simplification; not in phase-04 files_modified
- `test/adapters/package-install-gateway.test.ts` — Test updates from north-star/product-coherence; not phase-04 files_modified
- `test/adapters/x402-bypass-probes.test.ts` — Test updates from north-star/product-coherence; not phase-04 files_modified
- `test/adapters/x402-protected-tool-claude-code-activation.test.ts` — Test updates from north-star/product-coherence; not phase-04 files_modified
- `test/adapters/x402-protected-tool-codex-activation.test.ts` — Test updates from north-star/product-coherence; not phase-04 files_modified
- `test/adapters/x402-protected-tool-generic-mcp-activation.test.ts` — Test updates from north-star/product-coherence; not phase-04 files_modified
- `test/adapters/x402-protected-tool-hermes-activation.test.ts` — Test updates from north-star/product-coherence; not phase-04 files_modified
- `test/adapters/x402-protected-tool-openclaw-activation.test.ts` — Test updates from north-star/product-coherence; not phase-04 files_modified
- `test/architecture/negotiation-no-authority-surface.test.ts` — Test updates from north-star/product-coherence; not phase-04 files_modified
- `test/architecture/npm-maintainer-posture.test.ts` — Test updates from north-star/product-coherence; not phase-04 files_modified
- `test/architecture/package-release-proof.test.ts` — Test updates from north-star/product-coherence; not phase-04 files_modified
- `test/architecture/package-surface.test.ts` — Test updates from north-star/product-coherence; not phase-04 files_modified
- `test/architecture/product-launch-gate-resolution.test.ts` — Test updates from north-star/product-coherence; not phase-04 files_modified
- `test/architecture/proof-packets.test.ts` — Test updates from north-star/product-coherence; not phase-04 files_modified
- `test/architecture/release-repository-projection.test.ts` — Test updates from north-star/product-coherence; not phase-04 files_modified
- `test/architecture/workflow-admission-boundary.test.ts` — Test updates from north-star/product-coherence; not phase-04 files_modified
- `test/integration/auth-md-receipt-reconstruction.test.ts` — Test updates from north-star/product-coherence; not phase-04 files_modified
- `test/integration/x402-d1-http.test.ts` — Test updates from north-star/product-coherence; not phase-04 files_modified
- `test/mcp/mcp-reference-transcript.test.ts` — Test updates from north-star/product-coherence; not phase-04 files_modified
- `test/mcp/mcp-resource-redaction.test.ts` — Test updates from north-star/product-coherence; not phase-04 files_modified
- `test/mcp/mcp-schema-contract.test.ts` — Test updates from north-star/product-coherence; not phase-04 files_modified
- `test/product/a2a-negotiated-x402-room.test.ts` — A2A/negotiation test cluster outside phase-04 plans
- `test/product/agent-proof-slice.test.ts` — Test updates from north-star/product-coherence; not phase-04 files_modified
- `test/product/service-workflow-admission.test.ts` — Test updates from north-star/product-coherence; not phase-04 files_modified
- `test/product/x402-protected-spend-demo-report.test.ts` — Test updates from north-star/product-coherence; not phase-04 files_modified
- `test/protocol/authority-certificate.test.ts` — Test updates from north-star/product-coherence; not phase-04 files_modified
- `test/protocol/evidence-projections.test.ts` — Test updates from north-star/product-coherence; not phase-04 files_modified
- `test/protocol/kernel-operation-lifecycle.test.ts` — Test updates from north-star/product-coherence; not phase-04 files_modified
- `test/protocol/kernel-policy-gateway.test.ts` — Test updates from north-star/product-coherence; not phase-04 files_modified
- `test/protocol/negotiation-events.test.ts` — A2A/negotiation test cluster outside phase-04 plans
- `test/protocol/negotiation-object-registry.test.ts` — A2A/negotiation test cluster outside phase-04 plans
- `test/protocol/negotiation-policy.test.ts` — A2A/negotiation test cluster outside phase-04 plans
- `test/protocol/negotiation-schemas.test.ts` — A2A/negotiation test cluster outside phase-04 plans
- `test/protocol/negotiation-transitions.test.ts` — A2A/negotiation test cluster outside phase-04 plans
- `test/protocol/object-registry.test.ts` — Test updates from north-star/product-coherence; not phase-04 files_modified
- `test/protocol/protocol-navigation.test.ts` — Test updates from north-star/product-coherence; not phase-04 files_modified
- `test/protocol/reason-code-registry.test.ts` — Test updates from north-star/product-coherence; not phase-04 files_modified
- `test/protocol/transition-matrix.test.ts` — Test updates from north-star/product-coherence; not phase-04 files_modified
- `test/runtime/runtime-ingress.test.ts` — Test updates from north-star/product-coherence; not phase-04 files_modified
- `test/support/http-protocol-fixtures.ts` — Test updates from north-star/product-coherence; not phase-04 files_modified
- `test/support/negotiation-fixtures.ts` — Test updates from north-star/product-coherence; not phase-04 files_modified
- `test/support/x402-negotiation-fixture.ts` — Test updates from north-star/product-coherence; not phase-04 files_modified
- `.github/CODEOWNERS` — Repo metadata/orientation outside phase-04/05 files_modified
- `docs/internal/ecosystem-strategy.md` — 04-PLANS-INDEX eliminated ecosystem-strategy dual-lane expansion; park until strategy scope re-opened
- `docs/internal/gold-standard-devex-build-order.md` — Working-tree drift not mapped to phase-04/05 plan files_modified
- `examples/a2a-negotiated-x402-room/mcp-readback.json` — A2A negotiated room example; negotiation surface work outside phase-04 scope
- `examples/a2a-negotiated-x402-room/mcp-readback.md` — A2A negotiated room example; negotiation surface work outside phase-04 scope
- `scripts/build-host-generated-code-containment-transcript.mjs` — Release/proof script maintenance from north-star; not phase-04 files_modified
- `scripts/capture-host-generated-code-containment.mjs` — Release/proof script maintenance from north-star; not phase-04 files_modified
- `scripts/check-auth-md-x402-admission-packet.mjs` — Release/proof script maintenance from north-star; not phase-04 files_modified
- `scripts/check-host-generated-code-containment.mjs` — Release/proof script maintenance from north-star; not phase-04 files_modified
- `src/http/handlers/hosted-record-scope.ts` — Source changes from north-star simplification; not in phase-04 files_modified
- `src/http/handlers/raw-read-audit.ts` — Source changes from north-star simplification; not in phase-04 files_modified
- `src/protocol/foundation/telemetry-context/` — Source changes from north-star simplification; not in phase-04 files_modified
- `src/surfaces/a2a-negotiation-support/adapter-apply.ts` — A2A negotiation support surface; not phase-04 service-agent-gating deliverable
- `src/surfaces/a2a-negotiation-support/adapter-contract.ts` — A2A negotiation support surface; not phase-04 service-agent-gating deliverable
- `src/surfaces/a2a-negotiation-support/adapter-transcript/` — A2A negotiation support surface; not phase-04 service-agent-gating deliverable
- `src/surfaces/a2a-negotiation-support/agreement-linker/` — A2A negotiation support surface; not phase-04 service-agent-gating deliverable
- `src/surfaces/a2a-negotiation-support/external-protocol-evidence.ts` — A2A negotiation support surface; not phase-04 service-agent-gating deliverable
- `src/surfaces/a2a-negotiation-support/ingress-admission.ts` — A2A negotiation support surface; not phase-04 service-agent-gating deliverable
- `src/surfaces/a2a-negotiation-support/ingress-normalizer.ts` — A2A negotiation support surface; not phase-04 service-agent-gating deliverable
- `src/surfaces/a2a-negotiation-support/ingress-pressure.ts` — A2A negotiation support surface; not phase-04 service-agent-gating deliverable
- `src/surfaces/a2a-negotiation-support/move-compiler.ts` — A2A negotiation support surface; not phase-04 service-agent-gating deliverable
- `src/surfaces/a2a-negotiation-support/obligation-binder/` — A2A negotiation support surface; not phase-04 service-agent-gating deliverable
- `src/surfaces/proof-packets/host-generated-code-containment.ts` — Source changes from north-star simplification; not in phase-04 files_modified
- `test/cli/cli-quality-report.test.ts` — Test updates from north-star/product-coherence; not phase-04 files_modified
- `test/cli/cli-simulate.test.ts` — Test updates from north-star/product-coherence; not phase-04 files_modified
- `test/cli/cli-state-inspect.test.ts` — Test updates from north-star/product-coherence; not phase-04 files_modified
- `test/mcp/mcp-stdio-binding-integration.test.ts` — Test updates from north-star/product-coherence; not phase-04 files_modified
- `test/product/a2a-adapter-move-contract.test.ts` — A2A/negotiation test cluster outside phase-04 plans
- `test/product/a2a-adapter-transcript.test.ts` — A2A/negotiation test cluster outside phase-04 plans
- `test/product/a2a-agreement-linker.test.ts` — A2A/negotiation test cluster outside phase-04 plans
- `test/product/a2a-external-protocol-evidence.test.ts` — A2A/negotiation test cluster outside phase-04 plans
- `test/product/a2a-ingress-admission.test.ts` — A2A/negotiation test cluster outside phase-04 plans
- `test/product/a2a-ingress-normalizer.test.ts` — A2A/negotiation test cluster outside phase-04 plans
- `test/product/a2a-ingress-pressure.test.ts` — A2A/negotiation test cluster outside phase-04 plans
- `test/product/a2a-move-compiler.test.ts` — A2A/negotiation test cluster outside phase-04 plans
- `test/product/a2a-obligation-binder.test.ts` — A2A/negotiation test cluster outside phase-04 plans
- `test/product/hosted-package-consumer.test.ts` — Test updates from north-star/product-coherence; not phase-04 files_modified
- `test/protocol/a2a-ingress-checkpoint.test.ts` — A2A/negotiation test cluster outside phase-04 plans
- `test/protocol/evidence-audit-read-projections.test.ts` — Test updates from north-star/product-coherence; not phase-04 files_modified
- `test/protocol/negotiation-game-state.test.ts` — A2A/negotiation test cluster outside phase-04 plans
- `test/storage/` — Test updates from north-star/product-coherence; not phase-04 files_modified

---

## Full per-file disposition table

| # | path | status | disposition | plan/task | evidence | one-line note |
|---|------|--------|-------------|-----------|----------|---------------|
| 1 | `.gitignore` | M | out-of-scope-defer | - | .gitignore | Repo metadata/orientation outside phase-04/05 files_modified |
| 2 | `.planning/codebase/ARCHITECTURE.md` | M | out-of-scope-defer | - | .planning/codebase/ARCHITECTURE.md | Planning scratch / macro-plan edits; not phase-04 executable deliverable |
| 3 | `.planning/codebase/CONCERNS.md` | M | out-of-scope-defer | - | .planning/codebase/CONCERNS.md | Planning scratch / macro-plan edits; not phase-04 executable deliverable |
| 4 | `.planning/codebase/CONVENTIONS.md` | M | out-of-scope-defer | - | .planning/codebase/CONVENTIONS.md | Planning scratch / macro-plan edits; not phase-04 executable deliverable |
| 5 | `.planning/codebase/INTEGRATIONS.md` | M | out-of-scope-defer | - | .planning/codebase/INTEGRATIONS.md | Planning scratch / macro-plan edits; not phase-04 executable deliverable |
| 6 | `.planning/codebase/STACK.md` | M | out-of-scope-defer | - | .planning/codebase/STACK.md | Planning scratch / macro-plan edits; not phase-04 executable deliverable |
| 7 | `.planning/codebase/STRUCTURE.md` | M | out-of-scope-defer | - | .planning/codebase/STRUCTURE.md | Planning scratch / macro-plan edits; not phase-04 executable deliverable |
| 8 | `.planning/codebase/TESTING.md` | M | out-of-scope-defer | - | .planning/codebase/TESTING.md | Planning scratch / macro-plan edits; not phase-04 executable deliverable |
| 9 | `.planning/macro-plan/AGENT-HANDOFF.md` | M | out-of-scope-defer | - | .planning/macro-plan/AGENT-HANDOFF.md | Planning scratch / macro-plan edits; not phase-04 executable deliverable |
| 10 | `.planning/macro-plan/DECISIONS.md` | M | out-of-scope-defer | - | .planning/macro-plan/DECISIONS.md | Planning scratch / macro-plan edits; not phase-04 executable deliverable |
| 11 | `.planning/macro-plan/EVIDENCE-PLAN.md` | M | out-of-scope-defer | - | .planning/macro-plan/EVIDENCE-PLAN.md | Planning scratch / macro-plan edits; not phase-04 executable deliverable |
| 12 | `.planning/macro-plan/EXECUTION-SLICES.md` | M | out-of-scope-defer | - | .planning/macro-plan/EXECUTION-SLICES.md | Planning scratch / macro-plan edits; not phase-04 executable deliverable |
| 13 | `.planning/macro-plan/MACRO-PLAN.md` | M | out-of-scope-defer | - | .planning/macro-plan/MACRO-PLAN.md | Planning scratch / macro-plan edits; not phase-04 executable deliverable |
| 14 | `.planning/macro-plan/PROTECTED-ACTION-GATES.md` | M | out-of-scope-defer | - | .planning/macro-plan/PROTECTED-ACTION-GATES.md | Planning scratch / macro-plan edits; not phase-04 executable deliverable |
| 15 | `.planning/macro-plan/README.md` | M | out-of-scope-defer | - | .planning/macro-plan/README.md | Planning scratch / macro-plan edits; not phase-04 executable deliverable |
| 16 | `.planning/macro-plan/REVIEW-GATES.md` | M | out-of-scope-defer | - | .planning/macro-plan/REVIEW-GATES.md | Planning scratch / macro-plan edits; not phase-04 executable deliverable |
| 17 | `.planning/macro-plan/RISKS.md` | M | out-of-scope-defer | - | .planning/macro-plan/RISKS.md | Planning scratch / macro-plan edits; not phase-04 executable deliverable |
| 18 | `.planning/macro-plan/RUNTIME-GATES.md` | M | out-of-scope-defer | - | .planning/macro-plan/RUNTIME-GATES.md | Planning scratch / macro-plan edits; not phase-04 executable deliverable |
| 19 | `.planning/macro-plan/TASKS.jsonl` | M | out-of-scope-defer | - | .planning/macro-plan/TASKS.jsonl | Planning scratch / macro-plan edits; not phase-04 executable deliverable |
| 20 | `.planning/phases/02-address-concerns/02-PLANS-INDEX.md` | M | out-of-scope-defer | - | .planning/phases/02-address-concerns/02-PLANS-INDEX.md | Planning scratch / macro-plan edits; not phase-04 executable deliverable |
| 21 | `CHANGELOG.md` | M | out-of-scope-defer | - | CHANGELOG.md | Repo metadata/orientation outside phase-04/05 files_modified |
| 22 | `QUALITY.md` | M | out-of-scope-defer | - | QUALITY.md | Repo metadata/orientation outside phase-04/05 files_modified |
| 23 | `README.md` | M | phase-05-candidate | 05-10-PLAN | README.md | matches 05-10-PLAN files_modified |
| 24 | `STRUCTURE.md` | M | out-of-scope-defer | - | STRUCTURE.md | Repo metadata/orientation outside phase-04/05 files_modified |
| 25 | `docs/internal/decisions.md` | M | plan-04-01-task-2-partial | 04-01/T2 | decisions.md | Large north-star edits but missing Clerk-for-agents run*Gateway subsection and configuredBy custody matrix per 04-01-T2/04-10-T1 |
| 26 | `docs/internal/protocol-definition.md` | M | out-of-scope-defer | - | docs/internal/protocol-definition.md | Canonical/protocol doc drift from north-star; not in phase-04 files_modified |
| 27 | `docs/internal/protocol-kernel-architecture.md` | M | out-of-scope-defer | - | docs/internal/protocol-kernel-architecture.md | Canonical/protocol doc drift from north-star; not in phase-04 files_modified |
| 28 | `docs/internal/protocol-layman.md` | M | plan-04-01-task-1-partial | 04-01/T1 | protocol-layman.md | No shortened agent chain with schema-native non-authority bullets per 04-01-T1 |
| 29 | `docs/internal/protocol-notes.md` | M | plan-04-01-task-2-partial | 04-01/T2 | protocol-notes.md | Updated notes lack dual-enforcement cross-ref paragraph per 04-01-T2 |
| 30 | `docs/internal/release-admin-runbook.md` | M | out-of-scope-defer | - | docs/internal/release-admin-runbook.md | Canonical/protocol doc drift from north-star; not in phase-04 files_modified |
| 31 | `docs/internal/service-workflow-story.md` | M | plan-04-01-task-1-partial | 04-01/T1 | service-workflow-story.md:1-150 | Passport/admission story present but Agent lane D-05 mapping table absent per 04-01-T1 |
| 32 | `examples/a2a-negotiated-x402-room/README.md` | M | out-of-scope-defer | - | examples/a2a-negotiated-x402-room/README.md | A2A negotiated room example; negotiation surface work outside phase-04 scope |
| 33 | `examples/a2a-negotiated-x402-room/agent-handoff.md` | M | out-of-scope-defer | - | examples/a2a-negotiated-x402-room/agent-handoff.md | A2A negotiated room example; negotiation surface work outside phase-04 scope |
| 34 | `examples/a2a-negotiated-x402-room/evaluation.md` | M | out-of-scope-defer | - | examples/a2a-negotiated-x402-room/evaluation.md | A2A negotiated room example; negotiation surface work outside phase-04 scope |
| 35 | `examples/a2a-negotiated-x402-room/generate.ts` | M | out-of-scope-defer | - | examples/a2a-negotiated-x402-room/generate.ts | A2A negotiated room example; negotiation surface work outside phase-04 scope |
| 36 | `examples/a2a-negotiated-x402-room/latest.json` | M | out-of-scope-defer | - | examples/a2a-negotiated-x402-room/latest.json | A2A negotiated room example; negotiation surface work outside phase-04 scope |
| 37 | `examples/a2a-negotiated-x402-room/latest.md` | M | out-of-scope-defer | - | examples/a2a-negotiated-x402-room/latest.md | A2A negotiated room example; negotiation surface work outside phase-04 scope |
| 38 | `examples/a2a-negotiated-x402-room/local-reference-records.ts` | M | out-of-scope-defer | - | examples/a2a-negotiated-x402-room/local-reference-records.ts | A2A negotiated room example; negotiation surface work outside phase-04 scope |
| 39 | `examples/a2a-negotiated-x402-room/local-reference-room.ts` | M | out-of-scope-defer | - | examples/a2a-negotiated-x402-room/local-reference-room.ts | A2A negotiated room example; negotiation surface work outside phase-04 scope |
| 40 | `examples/service-workflow-admission/README.md` | M | independent-fix | 04-02/T3 | examples/service-workflow-admission/README.md | Admission demo README companion for 04-02 demo canonization |
| 41 | `examples/service-workflow-admission/run.ts` | M | independent-fix | 04-02/T3 | examples/service-workflow-admission/run.ts | Canonical service-workflow-admission demo referenced by 04-02-T3 |
| 42 | `package.json` | M | plan-04-02-task-3-partial | 04-02/T3 | package.json | Scripts expanded for product closeout; demo:service-workflow-admission canonization and check-service-agent-gating-phase.mjs absent per 04-02-T3/04-12-T3 |
| 43 | `scripts/build-package-bundles.mjs` | M | out-of-scope-defer | - | scripts/build-package-bundles.mjs | Release/proof script maintenance from north-star; not phase-04 files_modified |
| 44 | `scripts/check-clean-installed-activation.mjs` | M | out-of-scope-defer | - | scripts/check-clean-installed-activation.mjs | Release/proof script maintenance from north-star; not phase-04 files_modified |
| 45 | `scripts/check-codex-host-activation.mjs` | M | out-of-scope-defer | - | scripts/check-codex-host-activation.mjs | Release/proof script maintenance from north-star; not phase-04 files_modified |
| 46 | `scripts/check-distribution-provenance.mjs` | M | out-of-scope-defer | - | scripts/check-distribution-provenance.mjs | Release/proof script maintenance from north-star; not phase-04 files_modified |
| 47 | `scripts/check-npm-maintainer-posture.mjs` | M | out-of-scope-defer | - | scripts/check-npm-maintainer-posture.mjs | Release/proof script maintenance from north-star; not phase-04 files_modified |
| 48 | `scripts/check-package-surface.mjs` | M | out-of-scope-defer | - | scripts/check-package-surface.mjs | Release/proof script maintenance from north-star; not phase-04 files_modified |
| 49 | `scripts/check-published-entrypoints.mjs` | M | out-of-scope-defer | - | scripts/check-published-entrypoints.mjs | Release/proof script maintenance from north-star; not phase-04 files_modified |
| 50 | `scripts/check-release-proof.mjs` | M | out-of-scope-defer | - | scripts/check-release-proof.mjs | Release/proof script maintenance from north-star; not phase-04 files_modified |
| 51 | `scripts/install-codex-host-activation.mjs` | M | out-of-scope-defer | - | scripts/install-codex-host-activation.mjs | Release/proof script maintenance from north-star; not phase-04 files_modified |
| 52 | `server.json` | M | out-of-scope-defer | - | server.json | Repo metadata/orientation outside phase-04/05 files_modified |
| 53 | `src/adapters/downstream-failure-evidence.ts` | M | out-of-scope-defer | - | src/adapters/downstream-failure-evidence.ts | Source changes from north-star simplification; not in phase-04 files_modified |
| 54 | `src/adapters/x402-payment/action-proposal.ts` | M | out-of-scope-defer | - | src/adapters/x402-payment/action-proposal.ts | Source changes from north-star simplification; not in phase-04 files_modified |
| 55 | `src/adapters/x402-payment/protected-tool-profile/index.ts` | M | out-of-scope-defer | - | src/adapters/x402-payment/protected-tool-profile/index.ts | Source changes from north-star simplification; not in phase-04 files_modified |
| 56 | `src/adapters/x402-payment/protected-tool-readiness/index.ts` | M | out-of-scope-defer | - | src/adapters/x402-payment/protected-tool-readiness/index.ts | Source changes from north-star simplification; not in phase-04 files_modified |
| 57 | `src/cli/LANE.md` | M | independent-fix | 04-04/T2 | src/cli/LANE.md | CLI lane doc for new operator commands in manifest 04-04 |
| 58 | `src/cli/command-manifest.ts` | M | plan-04-03-task-2-partial | 04-03/T2 | command-manifest.ts | Manifest adds doctor/quality/simulate but not handshake service bootstrap or quickstart agent-spine per 04-03/04-04 |
| 59 | `src/cli/index.ts` | M | plan-04-03-task-2-partial | 04-03/T2 | cli/index.ts | Router wired for north-star CLI modules; service bootstrap and agent-spine routes missing per 04-03/04-04 |
| 60 | `src/cli/main.ts` | M | phase-05-candidate | 05-06-PLAN | src/cli/main.ts | matches 05-06-PLAN files_modified |
| 61 | `src/cli/output.ts` | M | independent-fix | 04-03/T2 | src/cli/output.ts | Shared cliOutput helper for bootstrap/doctor CLI surfaces 04-03/04-10 |
| 62 | `src/cli/projection-evidence.ts` | M | independent-fix | 04-06/T2 | src/cli/projection-evidence.ts | Projection evidence helper for SDK repair/readback 04-06 |
| 63 | `src/cli/support-bundle.ts` | M | independent-fix | 04-05/T5 | src/cli/support-bundle.ts | Support bundle CLI uses reason-code remediation metadata 04-05 |
| 64 | `src/cli/x402/index.ts` | M | independent-fix | 04-04/T2 | src/cli/x402/index.ts | x402 CLI surface for host quickstart path 04-04 |
| 65 | `src/http/LANE.md` | M | independent-fix | 04-05/T1 | src/http/LANE.md | HTTP lane doc adjacent to transition-error envelope work 04-05 |
| 66 | `src/http/admission/caller-auth.ts` | M | plan-04-05-task-2-partial | 04-05/T2 | caller-auth.ts | Minor edits; admission errors not mapped to failureClass/httpStatus discipline per 04-05-T2 |
| 67 | `src/http/admission/hosted-admission-config.ts` | M | phase-05-candidate | 05-09-PLAN | src/http/admission/hosted-admission-config.ts | matches 05-09-PLAN files_modified |
| 68 | `src/http/admission/hosted-caller-identity.ts` | M | phase-05-candidate | 05-09-PLAN | src/http/admission/hosted-caller-identity.ts | matches 05-09-PLAN files_modified |
| 69 | `src/http/app-options.ts` | M | out-of-scope-defer | - | src/http/app-options.ts | Source changes from north-star simplification; not in phase-04 files_modified |
| 70 | `src/http/app.ts` | M | phase-05-candidate | 05-01-PLAN | src/http/app.ts | matches 05-01-PLAN files_modified |
| 71 | `src/http/errors/codes.ts` | M | out-of-scope-defer | - | src/http/errors/codes.ts | Source changes from north-star simplification; not in phase-04 files_modified |
| 72 | `src/http/errors/transition-error-envelope.ts` | M | plan-04-05-task-1-partial | 04-05/T1 | transition-error-envelope.ts:32-45 | Schema still lacks failureClass, failurePhase, problemType fields per 04-05-T1 |
| 73 | `src/http/handlers/evidence-read.ts` | M | out-of-scope-defer | - | src/http/handlers/evidence-read.ts | Source changes from north-star simplification; not in phase-04 files_modified |
| 74 | `src/http/handlers/hosted-readiness.ts` | M | out-of-scope-defer | - | src/http/handlers/hosted-readiness.ts | Source changes from north-star simplification; not in phase-04 files_modified |
| 75 | `src/http/handlers/internal-record-read.ts` | M | out-of-scope-defer | - | src/http/handlers/internal-record-read.ts | Source changes from north-star simplification; not in phase-04 files_modified |
| 76 | `src/http/routes/evidence-read-route-registry.ts` | M | phase-05-candidate | 05-08-PLAN | src/http/routes/evidence-read-route-registry.ts | matches 05-08-PLAN files_modified |
| 77 | `src/http/routes/transition-scope-resolvers.ts` | M | out-of-scope-defer | - | src/http/routes/transition-scope-resolvers.ts | Source changes from north-star simplification; not in phase-04 files_modified |
| 78 | `src/index.ts` | M | phase-05-candidate | 05-07-PLAN | src/index.ts | matches 05-07-PLAN files_modified |
| 79 | `src/mcp/catalog.ts` | M | out-of-scope-defer | - | src/mcp/catalog.ts | Source changes from north-star simplification; not in phase-04 files_modified |
| 80 | `src/mcp/reference-transcript-fixtures.ts` | M | out-of-scope-defer | - | src/mcp/reference-transcript-fixtures.ts | Source changes from north-star simplification; not in phase-04 files_modified |
| 81 | `src/mcp/reference-transcript.ts` | M | out-of-scope-defer | - | src/mcp/reference-transcript.ts | Source changes from north-star simplification; not in phase-04 files_modified |
| 82 | `src/mcp/resources.ts` | M | phase-05-candidate | 05-06-PLAN | src/mcp/resources.ts | matches 05-06-PLAN files_modified |
| 83 | `src/mcp/stdio/process-proof.ts` | M | out-of-scope-defer | - | src/mcp/stdio/process-proof.ts | Source changes from north-star simplification; not in phase-04 files_modified |
| 84 | `src/mcp/stdio/server.ts` | M | out-of-scope-defer | - | src/mcp/stdio/server.ts | Source changes from north-star simplification; not in phase-04 files_modified |
| 85 | `src/mcp/x402-proposal.ts` | M | plan-04-06-task-4-partial | 04-06/T4 | x402-proposal.ts | Proposal path updated; shared failureClass classifier wiring and parity test absent per 04-06-T4 |
| 86 | `src/protocol/areas/action-attempt-lifecycle/matrix.ts` | M | out-of-scope-defer | - | src/protocol/areas/action-attempt-lifecycle/matrix.ts | Source changes from north-star simplification; not in phase-04 files_modified |
| 87 | `src/protocol/areas/authority-certificate/transitions.ts` | M | out-of-scope-defer | - | src/protocol/areas/authority-certificate/transitions.ts | Source changes from north-star simplification; not in phase-04 files_modified |
| 88 | `src/protocol/areas/generated-execution-graph/transitions.ts` | M | out-of-scope-defer | - | src/protocol/areas/generated-execution-graph/transitions.ts | Source changes from north-star simplification; not in phase-04 files_modified |
| 89 | `src/protocol/areas/intent-compilation/transitions.ts` | M | out-of-scope-defer | - | src/protocol/areas/intent-compilation/transitions.ts | Source changes from north-star simplification; not in phase-04 files_modified |
| 90 | `src/protocol/areas/negotiation/LANE.md` | M | out-of-scope-defer | - | src/protocol/areas/negotiation/LANE.md | Negotiation protocol area edits outside phase-04 kernel-freeze scope |
| 91 | `src/protocol/areas/negotiation/inputs.ts` | M | out-of-scope-defer | - | src/protocol/areas/negotiation/inputs.ts | Negotiation protocol area edits outside phase-04 kernel-freeze scope |
| 92 | `src/protocol/areas/negotiation/policy.ts` | M | out-of-scope-defer | - | src/protocol/areas/negotiation/policy.ts | Negotiation protocol area edits outside phase-04 kernel-freeze scope |
| 93 | `src/protocol/areas/negotiation/schemas.ts` | M | out-of-scope-defer | - | src/protocol/areas/negotiation/schemas.ts | Negotiation protocol area edits outside phase-04 kernel-freeze scope |
| 94 | `src/protocol/areas/negotiation/transitions.ts` | M | out-of-scope-defer | - | src/protocol/areas/negotiation/transitions.ts | Negotiation protocol area edits outside phase-04 kernel-freeze scope |
| 95 | `src/protocol/areas/object-registry/index.ts` | M | out-of-scope-defer | - | src/protocol/areas/object-registry/index.ts | Source changes from north-star simplification; not in phase-04 files_modified |
| 96 | `src/protocol/areas/object-registry/schemas.ts` | M | out-of-scope-defer | - | src/protocol/areas/object-registry/schemas.ts | Source changes from north-star simplification; not in phase-04 files_modified |
| 97 | `src/protocol/areas/operation-lifecycle/inputs.ts` | M | out-of-scope-defer | - | src/protocol/areas/operation-lifecycle/inputs.ts | Source changes from north-star simplification; not in phase-04 files_modified |
| 98 | `src/protocol/areas/operation-lifecycle/schemas.ts` | M | out-of-scope-defer | - | src/protocol/areas/operation-lifecycle/schemas.ts | Source changes from north-star simplification; not in phase-04 files_modified |
| 99 | `src/protocol/areas/operation-lifecycle/transitions.ts` | M | out-of-scope-defer | - | src/protocol/areas/operation-lifecycle/transitions.ts | Source changes from north-star simplification; not in phase-04 files_modified |
| 100 | `src/protocol/areas/policy-greenlight/policy-record/index.ts` | M | out-of-scope-defer | - | src/protocol/areas/policy-greenlight/policy-record/index.ts | Source changes from north-star simplification; not in phase-04 files_modified |
| 101 | `src/protocol/areas/policy-greenlight/schemas.ts` | M | out-of-scope-defer | - | src/protocol/areas/policy-greenlight/schemas.ts | Source changes from north-star simplification; not in phase-04 files_modified |
| 102 | `src/protocol/areas/policy-greenlight/sequence-dependencies.ts` | M | out-of-scope-defer | - | src/protocol/areas/policy-greenlight/sequence-dependencies.ts | Source changes from north-star simplification; not in phase-04 files_modified |
| 103 | `src/protocol/areas/policy-greenlight/transitions.ts` | M | out-of-scope-defer | - | src/protocol/areas/policy-greenlight/transitions.ts | Source changes from north-star simplification; not in phase-04 files_modified |
| 104 | `src/protocol/events/records.ts` | M | out-of-scope-defer | - | src/protocol/events/records.ts | Source changes from north-star simplification; not in phase-04 files_modified |
| 105 | `src/protocol/events/schemas.ts` | M | out-of-scope-defer | - | src/protocol/events/schemas.ts | Source changes from north-star simplification; not in phase-04 files_modified |
| 106 | `src/protocol/evidence-projections/index.ts` | M | out-of-scope-defer | - | src/protocol/evidence-projections/index.ts | Source changes from north-star simplification; not in phase-04 files_modified |
| 107 | `src/protocol/evidence-projections/projections.ts` | M | phase-05-candidate | 05-08-PLAN | src/protocol/evidence-projections/projections.ts | matches 05-08-PLAN files_modified |
| 108 | `src/protocol/evidence-projections/schemas.ts` | M | phase-05-candidate | 05-08-PLAN | src/protocol/evidence-projections/schemas.ts | matches 05-08-PLAN files_modified |
| 109 | `src/protocol/foundation/index.ts` | M | out-of-scope-defer | - | src/protocol/foundation/index.ts | Source changes from north-star simplification; not in phase-04 files_modified |
| 110 | `src/protocol/foundation/reason-codes.ts` | M | out-of-scope-defer | - | src/protocol/foundation/reason-codes.ts | Source changes from north-star simplification; not in phase-04 files_modified |
| 111 | `src/protocol/kernel.ts` | M | out-of-scope-defer | - | src/protocol/kernel.ts | Source changes from north-star simplification; not in phase-04 files_modified |
| 112 | `src/protocol/navigation/index.ts` | M | plan-04-07-task-1-partial | 04-07/T1 | navigation/index.ts | integratorTier1 metadata tags and export array not present per 04-07-T1 |
| 113 | `src/runtime/ingress/index.ts` | M | out-of-scope-defer | - | src/runtime/ingress/index.ts | Source changes from north-star simplification; not in phase-04 files_modified |
| 114 | `src/sdk/client.ts` | M | plan-04-06-task-2-partial | 04-06/T2 | sdk/client.ts | HandshakeClientError lacks failureClass/failurePhase parsing per 04-06-T2 |
| 115 | `src/sdk/surface-clients/evidence-client.ts` | M | phase-05-candidate | 05-06-PLAN | src/sdk/surface-clients/evidence-client.ts | matches 05-06-PLAN files_modified |
| 116 | `src/sdk/surface-clients/index.ts` | M | out-of-scope-defer | - | src/sdk/surface-clients/index.ts | Source changes from north-star simplification; not in phase-04 files_modified |
| 117 | `src/sdk/surface-clients/transport.ts` | M | plan-04-06-task-2-partial | 04-06/T2 | transport.ts | Transport parses envelope but not failureClass per 04-06-T2 |
| 118 | `src/storage/d1/index.ts` | M | out-of-scope-defer | - | src/storage/d1/index.ts | Source changes from north-star simplification; not in phase-04 files_modified |
| 119 | `src/storage/kv/index.ts` | M | out-of-scope-defer | - | src/storage/kv/index.ts | Source changes from north-star simplification; not in phase-04 files_modified |
| 120 | `src/surfaces/LANE.md` | M | out-of-scope-defer | - | src/surfaces/LANE.md | Source changes from north-star simplification; not in phase-04 files_modified |
| 121 | `src/surfaces/a2a-negotiation-readback/index.ts` | M | out-of-scope-defer | - | src/surfaces/a2a-negotiation-readback/index.ts | A2A negotiation support surface; not phase-04 service-agent-gating deliverable |
| 122 | `src/surfaces/a2a-negotiation-support/index.ts` | M | out-of-scope-defer | - | src/surfaces/a2a-negotiation-support/index.ts | A2A negotiation support surface; not phase-04 service-agent-gating deliverable |
| 123 | `src/surfaces/boundary-manifest.ts` | M | phase-05-candidate | 05-09-PLAN | src/surfaces/boundary-manifest.ts | matches 05-09-PLAN files_modified |
| 124 | `src/surfaces/product-launch-gate-resolution.ts` | M | out-of-scope-defer | - | src/surfaces/product-launch-gate-resolution.ts | Source changes from north-star simplification; not in phase-04 files_modified |
| 125 | `src/surfaces/proof-packets/clean-installed-activation.ts` | M | out-of-scope-defer | - | src/surfaces/proof-packets/clean-installed-activation.ts | Source changes from north-star simplification; not in phase-04 files_modified |
| 126 | `src/surfaces/proof-packets/codex-host-activation.ts` | M | out-of-scope-defer | - | src/surfaces/proof-packets/codex-host-activation.ts | Source changes from north-star simplification; not in phase-04 files_modified |
| 127 | `src/surfaces/proof-packets/distribution-provenance.ts` | M | out-of-scope-defer | - | src/surfaces/proof-packets/distribution-provenance.ts | Source changes from north-star simplification; not in phase-04 files_modified |
| 128 | `src/surfaces/proof-packets/index.ts` | M | phase-05-candidate | 05-05-PLAN | src/surfaces/proof-packets/index.ts | matches 05-05-PLAN files_modified |
| 129 | `src/surfaces/proof-packets/live-x402-requirement.ts` | D | phase-05-candidate | 05-03 | deleted→live-x402/ | Deleted monolith replaced by live-x402/ directory per product-completion refactor |
| 130 | `src/surfaces/proof-packets/product-completion.ts` | M | phase-05-candidate | 05-03-PLAN | src/surfaces/proof-packets/product-completion.ts | matches 05-03-PLAN files_modified |
| 131 | `src/surfaces/proof-packets/shared.ts` | M | out-of-scope-defer | - | src/surfaces/proof-packets/shared.ts | Source changes from north-star simplification; not in phase-04 files_modified |
| 132 | `src/surfaces/release-proof.ts` | M | out-of-scope-defer | - | src/surfaces/release-proof.ts | Source changes from north-star simplification; not in phase-04 files_modified |
| 133 | `src/surfaces/service-workflow-admission/index.ts` | M | phase-05-candidate | 05-05-PLAN | src/surfaces/service-workflow-admission/index.ts | matches 05-05-PLAN files_modified |
| 134 | `src/x402-protected-tool/LANE.md` | M | out-of-scope-defer | - | src/x402-protected-tool/LANE.md | Source changes from north-star simplification; not in phase-04 files_modified |
| 135 | `src/x402-protected-tool/index.ts` | M | phase-05-candidate | 05-13-PLAN | src/x402-protected-tool/index.ts | matches 05-13-PLAN files_modified |
| 136 | `test/adapters/package-install-gateway.test.ts` | M | out-of-scope-defer | - | test/adapters/package-install-gateway.test.ts | Test updates from north-star/product-coherence; not phase-04 files_modified |
| 137 | `test/adapters/x402-bypass-probes.test.ts` | M | out-of-scope-defer | - | test/adapters/x402-bypass-probes.test.ts | Test updates from north-star/product-coherence; not phase-04 files_modified |
| 138 | `test/adapters/x402-protected-tool-claude-code-activation.test.ts` | M | out-of-scope-defer | - | test/adapters/x402-protected-tool-claude-code-activation.test.ts | Test updates from north-star/product-coherence; not phase-04 files_modified |
| 139 | `test/adapters/x402-protected-tool-codex-activation.test.ts` | M | out-of-scope-defer | - | test/adapters/x402-protected-tool-codex-activation.test.ts | Test updates from north-star/product-coherence; not phase-04 files_modified |
| 140 | `test/adapters/x402-protected-tool-generic-mcp-activation.test.ts` | M | out-of-scope-defer | - | test/adapters/x402-protected-tool-generic-mcp-activation.test.ts | Test updates from north-star/product-coherence; not phase-04 files_modified |
| 141 | `test/adapters/x402-protected-tool-hermes-activation.test.ts` | M | out-of-scope-defer | - | test/adapters/x402-protected-tool-hermes-activation.test.ts | Test updates from north-star/product-coherence; not phase-04 files_modified |
| 142 | `test/adapters/x402-protected-tool-openclaw-activation.test.ts` | M | out-of-scope-defer | - | test/adapters/x402-protected-tool-openclaw-activation.test.ts | Test updates from north-star/product-coherence; not phase-04 files_modified |
| 143 | `test/adapters/x402-wallet-gateway.test.ts` | M | phase-05-candidate | 05-13-PLAN | test/adapters/x402-wallet-gateway.test.ts | matches 05-13-PLAN files_modified |
| 144 | `test/architecture/claim-boundary.test.ts` | M | plan-04-01-task-3-partial | 04-01/T3 | claim-boundary.test.ts | Modified but dual-enforcement-posture.test.ts still missing; D-00 claim matrix extensions unverified |
| 145 | `test/architecture/cli-command-posture.test.ts` | M | independent-fix | 04-04/T2 | test/architecture/cli-command-posture.test.ts | CLI manifest posture test companion to command-manifest 04-04-T2 |
| 146 | `test/architecture/negotiation-no-authority-surface.test.ts` | M | out-of-scope-defer | - | test/architecture/negotiation-no-authority-surface.test.ts | Test updates from north-star/product-coherence; not phase-04 files_modified |
| 147 | `test/architecture/npm-maintainer-posture.test.ts` | M | out-of-scope-defer | - | test/architecture/npm-maintainer-posture.test.ts | Test updates from north-star/product-coherence; not phase-04 files_modified |
| 148 | `test/architecture/package-release-proof.test.ts` | M | out-of-scope-defer | - | test/architecture/package-release-proof.test.ts | Test updates from north-star/product-coherence; not phase-04 files_modified |
| 149 | `test/architecture/package-surface.test.ts` | M | out-of-scope-defer | - | test/architecture/package-surface.test.ts | Test updates from north-star/product-coherence; not phase-04 files_modified |
| 150 | `test/architecture/product-launch-gate-resolution.test.ts` | M | out-of-scope-defer | - | test/architecture/product-launch-gate-resolution.test.ts | Test updates from north-star/product-coherence; not phase-04 files_modified |
| 151 | `test/architecture/proof-packets.test.ts` | M | out-of-scope-defer | - | test/architecture/proof-packets.test.ts | Test updates from north-star/product-coherence; not phase-04 files_modified |
| 152 | `test/architecture/release-repository-projection.test.ts` | M | out-of-scope-defer | - | test/architecture/release-repository-projection.test.ts | Test updates from north-star/product-coherence; not phase-04 files_modified |
| 153 | `test/architecture/root-exports.test.ts` | M | phase-05-candidate | 05-07-PLAN | test/architecture/root-exports.test.ts | matches 05-07-PLAN files_modified |
| 154 | `test/architecture/workflow-admission-boundary.test.ts` | M | out-of-scope-defer | - | test/architecture/workflow-admission-boundary.test.ts | Test updates from north-star/product-coherence; not phase-04 files_modified |
| 155 | `test/cli/cli-evidence.test.ts` | M | independent-fix | 04-06/T2 | test/cli/cli-evidence.test.ts | Evidence CLI tests companion to SDK repair 04-06 |
| 156 | `test/cli/cli-support-bundle.test.ts` | M | independent-fix | 04-05/T5 | test/cli/cli-support-bundle.test.ts | Support bundle CLI test companion 04-05 failure taxonomy surfaces |
| 157 | `test/cli/cli-x402-install-probes.test.ts` | M | independent-fix | 04-10/T3 | test/cli/cli-x402-install-probes.test.ts | Host/x402 install probe tests companion to doctor CLI 04-10 |
| 158 | `test/http/http.test.ts` | M | plan-04-03-task-3-partial | 04-03/T3 | http.test.ts | HTTP tests modified; InstallProposal orphan-catalog assertions from 04-03-T3 not verified |
| 159 | `test/integration/auth-md-receipt-reconstruction.test.ts` | M | out-of-scope-defer | - | test/integration/auth-md-receipt-reconstruction.test.ts | Test updates from north-star/product-coherence; not phase-04 files_modified |
| 160 | `test/integration/x402-d1-http.test.ts` | M | out-of-scope-defer | - | test/integration/x402-d1-http.test.ts | Test updates from north-star/product-coherence; not phase-04 files_modified |
| 161 | `test/mcp/mcp-reference-transcript.test.ts` | M | out-of-scope-defer | - | test/mcp/mcp-reference-transcript.test.ts | Test updates from north-star/product-coherence; not phase-04 files_modified |
| 162 | `test/mcp/mcp-resource-redaction.test.ts` | M | out-of-scope-defer | - | test/mcp/mcp-resource-redaction.test.ts | Test updates from north-star/product-coherence; not phase-04 files_modified |
| 163 | `test/mcp/mcp-schema-contract.test.ts` | M | out-of-scope-defer | - | test/mcp/mcp-schema-contract.test.ts | Test updates from north-star/product-coherence; not phase-04 files_modified |
| 164 | `test/product/a2a-negotiated-x402-room.test.ts` | M | out-of-scope-defer | - | test/product/a2a-negotiated-x402-room.test.ts | A2A/negotiation test cluster outside phase-04 plans |
| 165 | `test/product/agent-proof-slice.test.ts` | M | out-of-scope-defer | - | test/product/agent-proof-slice.test.ts | Test updates from north-star/product-coherence; not phase-04 files_modified |
| 166 | `test/product/service-workflow-admission.test.ts` | M | out-of-scope-defer | - | test/product/service-workflow-admission.test.ts | Test updates from north-star/product-coherence; not phase-04 files_modified |
| 167 | `test/product/x402-protected-spend-demo-report.test.ts` | M | out-of-scope-defer | - | test/product/x402-protected-spend-demo-report.test.ts | Test updates from north-star/product-coherence; not phase-04 files_modified |
| 168 | `test/protocol/authority-certificate.test.ts` | M | out-of-scope-defer | - | test/protocol/authority-certificate.test.ts | Test updates from north-star/product-coherence; not phase-04 files_modified |
| 169 | `test/protocol/evidence-projections.test.ts` | M | out-of-scope-defer | - | test/protocol/evidence-projections.test.ts | Test updates from north-star/product-coherence; not phase-04 files_modified |
| 170 | `test/protocol/kernel-operation-lifecycle.test.ts` | M | out-of-scope-defer | - | test/protocol/kernel-operation-lifecycle.test.ts | Test updates from north-star/product-coherence; not phase-04 files_modified |
| 171 | `test/protocol/kernel-policy-gateway.test.ts` | M | out-of-scope-defer | - | test/protocol/kernel-policy-gateway.test.ts | Test updates from north-star/product-coherence; not phase-04 files_modified |
| 172 | `test/protocol/negotiation-events.test.ts` | M | out-of-scope-defer | - | test/protocol/negotiation-events.test.ts | A2A/negotiation test cluster outside phase-04 plans |
| 173 | `test/protocol/negotiation-object-registry.test.ts` | M | out-of-scope-defer | - | test/protocol/negotiation-object-registry.test.ts | A2A/negotiation test cluster outside phase-04 plans |
| 174 | `test/protocol/negotiation-policy.test.ts` | M | out-of-scope-defer | - | test/protocol/negotiation-policy.test.ts | A2A/negotiation test cluster outside phase-04 plans |
| 175 | `test/protocol/negotiation-schemas.test.ts` | M | out-of-scope-defer | - | test/protocol/negotiation-schemas.test.ts | A2A/negotiation test cluster outside phase-04 plans |
| 176 | `test/protocol/negotiation-transitions.test.ts` | M | out-of-scope-defer | - | test/protocol/negotiation-transitions.test.ts | A2A/negotiation test cluster outside phase-04 plans |
| 177 | `test/protocol/object-registry.test.ts` | M | out-of-scope-defer | - | test/protocol/object-registry.test.ts | Test updates from north-star/product-coherence; not phase-04 files_modified |
| 178 | `test/protocol/protocol-navigation.test.ts` | M | out-of-scope-defer | - | test/protocol/protocol-navigation.test.ts | Test updates from north-star/product-coherence; not phase-04 files_modified |
| 179 | `test/protocol/reason-code-registry.test.ts` | M | out-of-scope-defer | - | test/protocol/reason-code-registry.test.ts | Test updates from north-star/product-coherence; not phase-04 files_modified |
| 180 | `test/protocol/transition-matrix.test.ts` | M | out-of-scope-defer | - | test/protocol/transition-matrix.test.ts | Test updates from north-star/product-coherence; not phase-04 files_modified |
| 181 | `test/runtime/runtime-ingress.test.ts` | M | out-of-scope-defer | - | test/runtime/runtime-ingress.test.ts | Test updates from north-star/product-coherence; not phase-04 files_modified |
| 182 | `test/sdk/role-clients.test.ts` | M | independent-fix | 04-06/T2 | test/sdk/role-clients.test.ts | Role client tests adjacent to failureClass SDK work 04-06 |
| 183 | `test/support/http-protocol-fixtures.ts` | M | out-of-scope-defer | - | test/support/http-protocol-fixtures.ts | Test updates from north-star/product-coherence; not phase-04 files_modified |
| 184 | `test/support/negotiation-fixtures.ts` | M | out-of-scope-defer | - | test/support/negotiation-fixtures.ts | Test updates from north-star/product-coherence; not phase-04 files_modified |
| 185 | `test/support/x402-negotiation-fixture.ts` | M | out-of-scope-defer | - | test/support/x402-negotiation-fixture.ts | Test updates from north-star/product-coherence; not phase-04 files_modified |
| 186 | `.github/CODEOWNERS` | ?? | out-of-scope-defer | - | .github/CODEOWNERS | Repo metadata/orientation outside phase-04/05 files_modified |
| 187 | `docs/internal/developer-experience-index.md` | ?? | plan-04-02-task-2-partial | 04-02/T2 | developer-experience-index.md:7-19 | Start Here lists host/CLI surfaces not service-operator-golden-path.md single entry per 04-02-T2 |
| 188 | `docs/internal/ecosystem-strategy.md` | ?? | out-of-scope-defer | - | docs/internal/ecosystem-strategy.md | 04-PLANS-INDEX eliminated ecosystem-strategy dual-lane expansion; park until strategy scope re-opened |
| 189 | `docs/internal/gold-standard-devex-build-order.md` | ?? | out-of-scope-defer | - | docs/internal/gold-standard-devex-build-order.md | Working-tree drift not mapped to phase-04/05 plan files_modified |
| 190 | `docs/internal/host-golden-paths-and-trace-guidance.md` | ?? | plan-04-04-task-4-partial | 04-04/T4 | host-golden-paths-and-trace-guidance.md | New untracked host guidance doc; bilateral setup order and service prerequisite sections incomplete vs 04-04-T4/04-10-T2 |
| 191 | `examples/a2a-negotiated-x402-room/mcp-readback.json` | ?? | out-of-scope-defer | - | examples/a2a-negotiated-x402-room/mcp-readback.json | A2A negotiated room example; negotiation surface work outside phase-04 scope |
| 192 | `examples/a2a-negotiated-x402-room/mcp-readback.md` | ?? | out-of-scope-defer | - | examples/a2a-negotiated-x402-room/mcp-readback.md | A2A negotiated room example; negotiation surface work outside phase-04 scope |
| 193 | `scripts/build-host-generated-code-containment-transcript.mjs` | ?? | out-of-scope-defer | - | scripts/build-host-generated-code-containment-transcript.mjs | Release/proof script maintenance from north-star; not phase-04 files_modified |
| 194 | `scripts/build-product-closeout-bundle.mjs` | ?? | phase-05-candidate | 05-03 | scripts/build-product-closeout-bundle.mjs | Product closeout bundle builder for phase 05 product coherence |
| 195 | `scripts/build-publish-handoff-packet.mjs` | ?? | phase-05-candidate | 05-03 | scripts/build-publish-handoff-packet.mjs | Publish handoff packet builder for product completion |
| 196 | `scripts/capture-host-generated-code-containment.mjs` | ?? | out-of-scope-defer | - | scripts/capture-host-generated-code-containment.mjs | Release/proof script maintenance from north-star; not phase-04 files_modified |
| 197 | `scripts/check-auth-md-x402-admission-packet.mjs` | ?? | out-of-scope-defer | - | scripts/check-auth-md-x402-admission-packet.mjs | Release/proof script maintenance from north-star; not phase-04 files_modified |
| 198 | `scripts/check-host-generated-code-containment.mjs` | ?? | out-of-scope-defer | - | scripts/check-host-generated-code-containment.mjs | Release/proof script maintenance from north-star; not phase-04 files_modified |
| 199 | `scripts/check-live-x402-paid-retry.mjs` | ?? | phase-05-candidate | 05-03 | scripts/check-live-x402-paid-retry.mjs | Product completion proof script cluster |
| 200 | `scripts/check-product-completion.mjs` | ?? | phase-05-candidate | 05-03-PLAN | scripts/check-product-completion.mjs | matches 05-03-PLAN files_modified |
| 201 | `src/cli/demo/` | ?? | independent-fix | 04-04/T2 | src/cli/demo/ | CLI demo module adjacent to quickstart/host operator path 04-04 |
| 202 | `src/cli/evidence/` | ?? | phase-05-candidate | 05-08 | src/cli/evidence/operation-readback-view.ts | Evidence readback CLI for 05-08 |
| 203 | `src/cli/host/` | ?? | plan-04-10-task-3-partial | 04-10/T3 | src/cli/host/doctor.ts:23-42 | Contains doctor.ts; lacks attestationEvidence/nonClaims attestation framing per 04-10-T3 |
| 204 | `src/cli/mcp/` | ?? | plan-04-10-task-3-partial | 04-10/T3 | src/cli/mcp/doctor.ts | Contains MCP doctor; attestation parity vs host doctor not verified per 04-10-T3 |
| 205 | `src/cli/quality/` | ?? | independent-fix | 04-04/T2 | src/cli/quality/ | Quality report CLI in devex index 04-04 |
| 206 | `src/cli/quickstart/` | ?? | plan-04-04-task-1-partial | 04-04/T1 | src/cli/quickstart/x402.ts | Directory has x402 quickstart only; agent-spine.ts sequencer missing per 04-04-T1 |
| 207 | `src/cli/simulate/` | ?? | independent-fix | 04-04/T1 | src/cli/simulate/ | Simulate x402-payment module referenced by agent-spine plan 04-04-T1 |
| 208 | `src/cli/state/` | ?? | independent-fix | 04-04/T2 | src/cli/state/ | State inspect CLI listed in devex index host path 04-04 |
| 209 | `src/cli/x402/readiness.ts` | ?? | independent-fix | 04-04/T2 | src/cli/x402/readiness.ts | x402 readiness helper for host operator commands 04-04 |
| 210 | `src/hosted-admission/` | ?? | phase-05-candidate | 05-09 | src/hosted-admission/index.ts | Hosted admission reexport module for 05-09 |
| 211 | `src/http/admission/hosted-verifier-adapter.ts` | ?? | phase-05-candidate | 05-09-PLAN | src/http/admission/hosted-verifier-adapter.ts | matches 05-09-PLAN files_modified |
| 212 | `src/http/handlers/hosted-record-scope.ts` | ?? | out-of-scope-defer | - | src/http/handlers/hosted-record-scope.ts | Source changes from north-star simplification; not in phase-04 files_modified |
| 213 | `src/http/handlers/raw-read-audit.ts` | ?? | out-of-scope-defer | - | src/http/handlers/raw-read-audit.ts | Source changes from north-star simplification; not in phase-04 files_modified |
| 214 | `src/http/handlers/scoped-evidence-record.ts` | ?? | phase-05-candidate | 05-08-PLAN | src/http/handlers/scoped-evidence-record.ts | matches 05-08-PLAN files_modified |
| 215 | `src/protocol/evidence-projections/store-reader.ts` | ?? | phase-05-candidate | 05-08-PLAN | src/protocol/evidence-projections/store-reader.ts | matches 05-08-PLAN files_modified |
| 216 | `src/protocol/foundation/host-trusted-binding.ts` | ?? | phase-05-candidate | 05-13-PLAN | src/protocol/foundation/host-trusted-binding.ts | matches 05-13-PLAN files_modified |
| 217 | `src/protocol/foundation/reason-code-remediation/` | ?? | plan-04-05-task-2-partial | 04-05/T2 | reason-code-remediation/index.ts | Module exists; failureClass remediation rows for new classes not verified per 04-05-T2 |
| 218 | `src/protocol/foundation/telemetry-context/` | ?? | out-of-scope-defer | - | src/protocol/foundation/telemetry-context/ | Source changes from north-star simplification; not in phase-04 files_modified |
| 219 | `src/sdk/repair.ts` | ?? | plan-04-06-task-2-partial | 04-06/T2 | sdk/repair.ts | Repair helpers present but not wired to failureClass retry guidance per 04-06-T2 |
| 220 | `src/sdk/transport-url.ts` | ?? | phase-05-candidate | 05-07 | src/sdk/transport-url.ts | SDK transport URL helper for export surface 05-07 |
| 221 | `src/surfaces/a2a-negotiation-support/adapter-apply.ts` | ?? | out-of-scope-defer | - | src/surfaces/a2a-negotiation-support/adapter-apply.ts | A2A negotiation support surface; not phase-04 service-agent-gating deliverable |
| 222 | `src/surfaces/a2a-negotiation-support/adapter-contract.ts` | ?? | out-of-scope-defer | - | src/surfaces/a2a-negotiation-support/adapter-contract.ts | A2A negotiation support surface; not phase-04 service-agent-gating deliverable |
| 223 | `src/surfaces/a2a-negotiation-support/adapter-transcript/` | ?? | out-of-scope-defer | - | src/surfaces/a2a-negotiation-support/adapter-transcript/ | A2A negotiation support surface; not phase-04 service-agent-gating deliverable |
| 224 | `src/surfaces/a2a-negotiation-support/agreement-linker/` | ?? | out-of-scope-defer | - | src/surfaces/a2a-negotiation-support/agreement-linker/ | A2A negotiation support surface; not phase-04 service-agent-gating deliverable |
| 225 | `src/surfaces/a2a-negotiation-support/external-protocol-evidence.ts` | ?? | out-of-scope-defer | - | src/surfaces/a2a-negotiation-support/external-protocol-evidence.ts | A2A negotiation support surface; not phase-04 service-agent-gating deliverable |
| 226 | `src/surfaces/a2a-negotiation-support/ingress-admission.ts` | ?? | out-of-scope-defer | - | src/surfaces/a2a-negotiation-support/ingress-admission.ts | A2A negotiation support surface; not phase-04 service-agent-gating deliverable |
| 227 | `src/surfaces/a2a-negotiation-support/ingress-normalizer.ts` | ?? | out-of-scope-defer | - | src/surfaces/a2a-negotiation-support/ingress-normalizer.ts | A2A negotiation support surface; not phase-04 service-agent-gating deliverable |
| 228 | `src/surfaces/a2a-negotiation-support/ingress-pressure.ts` | ?? | out-of-scope-defer | - | src/surfaces/a2a-negotiation-support/ingress-pressure.ts | A2A negotiation support surface; not phase-04 service-agent-gating deliverable |
| 229 | `src/surfaces/a2a-negotiation-support/move-compiler.ts` | ?? | out-of-scope-defer | - | src/surfaces/a2a-negotiation-support/move-compiler.ts | A2A negotiation support surface; not phase-04 service-agent-gating deliverable |
| 230 | `src/surfaces/a2a-negotiation-support/obligation-binder/` | ?? | out-of-scope-defer | - | src/surfaces/a2a-negotiation-support/obligation-binder/ | A2A negotiation support surface; not phase-04 service-agent-gating deliverable |
| 231 | `src/surfaces/proof-packets/host-generated-code-containment.ts` | ?? | out-of-scope-defer | - | src/surfaces/proof-packets/host-generated-code-containment.ts | Source changes from north-star simplification; not in phase-04 files_modified |
| 232 | `src/surfaces/proof-packets/live-x402/` | ?? | phase-05-candidate | 05-03 | src/surfaces/proof-packets/live-x402/ | Live x402 proof packet split aligns with product-completion phase 05-03 |
| 233 | `src/surfaces/proof-packets/product-completion-contract.ts` | ?? | phase-05-candidate | 05-03-PLAN | src/surfaces/proof-packets/product-completion-contract.ts | matches 05-03-PLAN files_modified |
| 234 | `test/adapters/x402-host-trusted-binding.test.ts` | ?? | phase-05-candidate | 05-13-PLAN | test/adapters/x402-host-trusted-binding.test.ts | matches 05-13-PLAN files_modified |
| 235 | `test/adapters/x402-hosted-custody-readiness.test.ts` | ?? | phase-05-candidate | 05-13 | test/adapters/x402-hosted-custody-readiness.test.ts | Hosted custody readiness adapter test |
| 236 | `test/architecture/cli-non-authority-copy.test.ts` | ?? | phase-05-candidate | 05-11-PLAN | test/architecture/cli-non-authority-copy.test.ts | matches 05-11-PLAN files_modified |
| 237 | `test/architecture/host-trusted-binding-parity.test.ts` | ?? | phase-05-candidate | 05-13 | test/architecture/host-trusted-binding-parity.test.ts | Host trusted binding parity for 05-13 |
| 238 | `test/architecture/hosted-admission-reexport-only.test.ts` | ?? | phase-05-candidate | 05-09-PLAN | test/architecture/hosted-admission-reexport-only.test.ts | matches 05-09-PLAN files_modified |
| 239 | `test/architecture/pack-check-expect-status.test.ts` | ?? | phase-05-candidate | 05-03 | test/architecture/pack-check-expect-status.test.ts | Pack check posture for product completion |
| 240 | `test/architecture/planning-scratch-quarantine.test.ts` | ?? | phase-05-candidate | 05-11-PLAN | test/architecture/planning-scratch-quarantine.test.ts | matches 05-11-PLAN files_modified |
| 241 | `test/architecture/product-closeout-bundle.test.ts` | ?? | phase-05-candidate | 05-03 | test/architecture/product-closeout-bundle.test.ts | Product closeout architecture test |
| 242 | `test/architecture/product-completion-parity.test.ts` | ?? | phase-05-candidate | 05-03-PLAN | test/architecture/product-completion-parity.test.ts | matches 05-03-PLAN files_modified |
| 243 | `test/architecture/proof-script-build-freshness.test.ts` | ?? | phase-05-candidate | 05-03 | test/architecture/proof-script-build-freshness.test.ts | Proof script freshness gate |
| 244 | `test/architecture/publish-handoff-packet.test.ts` | ?? | phase-05-candidate | 05-03 | test/architecture/publish-handoff-packet.test.ts | Publish handoff architecture test |
| 245 | `test/cli/cli-mcp-doctor.test.ts` | ?? | independent-fix | 04-10/T3 | test/cli/cli-mcp-doctor.test.ts | MCP doctor test companion to 04-10-T3 |
| 246 | `test/cli/cli-quality-report.test.ts` | ?? | out-of-scope-defer | - | test/cli/cli-quality-report.test.ts | Test updates from north-star/product-coherence; not phase-04 files_modified |
| 247 | `test/cli/cli-simulate.test.ts` | ?? | out-of-scope-defer | - | test/cli/cli-simulate.test.ts | Test updates from north-star/product-coherence; not phase-04 files_modified |
| 248 | `test/cli/cli-state-inspect.test.ts` | ?? | out-of-scope-defer | - | test/cli/cli-state-inspect.test.ts | Test updates from north-star/product-coherence; not phase-04 files_modified |
| 249 | `test/http/hosted-identity-evidence.test.ts` | ?? | phase-05-candidate | 05-09 | test/http/hosted-identity-evidence.test.ts | Hosted identity evidence HTTP tests |
| 250 | `test/mcp/mcp-stdio-binding-integration.test.ts` | ?? | out-of-scope-defer | - | test/mcp/mcp-stdio-binding-integration.test.ts | Test updates from north-star/product-coherence; not phase-04 files_modified |
| 251 | `test/product/a2a-adapter-move-contract.test.ts` | ?? | out-of-scope-defer | - | test/product/a2a-adapter-move-contract.test.ts | A2A/negotiation test cluster outside phase-04 plans |
| 252 | `test/product/a2a-adapter-transcript.test.ts` | ?? | out-of-scope-defer | - | test/product/a2a-adapter-transcript.test.ts | A2A/negotiation test cluster outside phase-04 plans |
| 253 | `test/product/a2a-agreement-linker.test.ts` | ?? | out-of-scope-defer | - | test/product/a2a-agreement-linker.test.ts | A2A/negotiation test cluster outside phase-04 plans |
| 254 | `test/product/a2a-external-protocol-evidence.test.ts` | ?? | out-of-scope-defer | - | test/product/a2a-external-protocol-evidence.test.ts | A2A/negotiation test cluster outside phase-04 plans |
| 255 | `test/product/a2a-ingress-admission.test.ts` | ?? | out-of-scope-defer | - | test/product/a2a-ingress-admission.test.ts | A2A/negotiation test cluster outside phase-04 plans |
| 256 | `test/product/a2a-ingress-normalizer.test.ts` | ?? | out-of-scope-defer | - | test/product/a2a-ingress-normalizer.test.ts | A2A/negotiation test cluster outside phase-04 plans |
| 257 | `test/product/a2a-ingress-pressure.test.ts` | ?? | out-of-scope-defer | - | test/product/a2a-ingress-pressure.test.ts | A2A/negotiation test cluster outside phase-04 plans |
| 258 | `test/product/a2a-move-compiler.test.ts` | ?? | out-of-scope-defer | - | test/product/a2a-move-compiler.test.ts | A2A/negotiation test cluster outside phase-04 plans |
| 259 | `test/product/a2a-obligation-binder.test.ts` | ?? | out-of-scope-defer | - | test/product/a2a-obligation-binder.test.ts | A2A/negotiation test cluster outside phase-04 plans |
| 260 | `test/product/hosted-package-consumer.test.ts` | ?? | out-of-scope-defer | - | test/product/hosted-package-consumer.test.ts | Test updates from north-star/product-coherence; not phase-04 files_modified |
| 261 | `test/protocol/a2a-ingress-checkpoint.test.ts` | ?? | out-of-scope-defer | - | test/protocol/a2a-ingress-checkpoint.test.ts | A2A/negotiation test cluster outside phase-04 plans |
| 262 | `test/protocol/evidence-audit-read-projections.test.ts` | ?? | out-of-scope-defer | - | test/protocol/evidence-audit-read-projections.test.ts | Test updates from north-star/product-coherence; not phase-04 files_modified |
| 263 | `test/protocol/host-trusted-binding.test.ts` | ?? | phase-05-candidate | 05-13 | test/protocol/host-trusted-binding.test.ts | Protocol host-trusted-binding tests |
| 264 | `test/protocol/negotiation-game-state.test.ts` | ?? | out-of-scope-defer | - | test/protocol/negotiation-game-state.test.ts | A2A/negotiation test cluster outside phase-04 plans |
| 265 | `test/storage/` | ?? | out-of-scope-defer | - | test/storage/ | Test updates from north-star/product-coherence; not phase-04 files_modified |

---

## Open questions for orchestrator

- Q1: Drift is 74.7% (>20% halt threshold). Confirm whether to HALT and triage ~179 out-of-scope-defer north-star files before any phase-04 partial commits, or cherry-pick only the 22 phase-04 partial + 19 independent-fix rows.
- Q2: `docs/internal/decisions.md` mixes north-star acceptance matrix work with phase-04 Clerk-for-agents/custody obligations — should executor split into separate commits or one partial 04-01/04-10 commit?
