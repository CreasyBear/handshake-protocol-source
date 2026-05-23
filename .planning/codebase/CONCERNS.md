# Codebase Concerns

**Analysis Date:** 2026-05-23

## Scope

This audit covers Tier 2 SDK, CLI, MCP, x402, package/repo/preview adapter proofs, examples, scripts, tests, package exports, and planning-drift surfaces only.

Canonical source for this audit:
- `AGENTS.md`
- `README.md`
- `QUALITY.md`
- `STRUCTURE.md`
- `docs/internal/decisions.md`
- `docs/internal/protocol-notes.md`
- `src/sdk/LANE.md`
- `src/cli/LANE.md`
- `src/mcp/LANE.md`
- `src/runtime/LANE.md`
- `src/adapters/LANE.md`
- `.planning/codebase/CONCERNS.md`

## Current Rollout Closeout

Resolved in the 2026-05-23 Tier 2 hardening rollout:

- `package.json` now exposes `./sdk/role-clients` as the first stable package activation surface for `RuntimeClient` and `EvidenceClient`, while root exports remain curated and do not expose those clients.
- `examples/x402-protected-spend/run.ts` now imports role-scoped clients through `handshake-protocol-kernel/sdk/role-clients`, and tests reject `HandshakeClient` usage in that walkthrough.
- CLI usage failures now return structured non-authority envelopes instead of plain terminal strings.
- CLI x402 local install output now names `readinessAuthority: "local_compilation"`, `trustedInstallReadiness: false`, and `nextReadinessAction: "register_control_plane_install"`.
- CLI now includes `support.bundle`, a file-backed redacted support bundle over supplied redacted projections and local posture records. It remains evidence-only and does not fetch HTTP state, export receipts, dump raw records, or create authority.
- `test/architecture/surface-boundary-posture.test.ts` now enforces active surface imports against `allowedImportRoots`.

Remaining high-priority gaps after this rollout:

- no public CLI `bin`;
- no public MCP package export or MCP host/process proof;
- no gateway worker/process activation path;
- no runtime-generated graph evidence through MCP proposals;
- no aggregate x402 spend ledger;
- no provider-grade package/repo/preview integration.

## Priority Index

| Priority | Severity | Concern | Candidate files | Smallest remediation |
|----------|----------|---------|-----------------|----------------------|
| P0 | Critical | CLI/MCP/process activation surfaces are still not distributable authority surfaces | `package.json`, `src/cli/LANE.md`, `src/mcp/LANE.md`, `examples/mcp-reference-transcript/README.md` | Keep CLI/MCP/process claims deferred until a bin/host/worker target has exact custody and posture tests |
| P0 | Critical | MCP transcript is a source harness, not a real MCP host/process proof | `src/mcp/reference-transcript.ts`, `examples/mcp-reference-transcript/README.md`, `test/mcp/mcp-reference-transcript.test.ts` | Implement one concrete MCP host/client target or keep every MCP claim explicitly reference-only |
| P0 | High | Gateway/process activation path is still cut from proposed contracts | `src/cli/LANE.md`, `src/surfaces/boundary-manifest.ts`, `.planning/macro/surfaces/CLOSEOUT.md` | Add a pending gateway work feed plus minimal gateway process runner for exact unconsumed greenlights |
| P0 | High | Trusted x402 install readiness remains deferred after local posture | `src/cli/x402/index.ts`, `src/cli/local-project/index.ts`, `test/cli/cli-x402-install-probes.test.ts` | Add a real control-plane registration/readiness projection before `doctor` can trust x402 setup |
| Resolved | High | Role-scoped SDK clients are now the first public package activation surface | `package.json`, `src/sdk/surface-clients/index.ts`, `src/sdk/LANE.md`, `test/sdk/role-clients.test.ts` | Keep root export curated and block activation examples from low-level client use |
| P1 | High | MCP proposals bypass runtime-ingress graph creation and carry graphless evidence | `src/mcp/x402-proposal.ts`, `src/mcp/LANE.md`, `test/mcp/mcp-x402-proposal.test.ts` | Expose bounded runtime graph creation to the role-scoped surface or narrow MCP claims to exact proposal-only |
| P1 | Medium | Planning artifacts conflict with current Tier 2 source paths and status | `.planning/macro/surfaces/sdk/PLAN.md`, `.planning/macro/surfaces/cli/PLAN.md`, `.planning/macro/surfaces/mcp/PLAN.md` | Mark stale plans superseded or rewrite only their live status/pointer sections |
| Resolved | Medium | Support/debug handoff now has a file-backed redacted bundle | `src/cli/support-bundle.ts`, `src/cli/command-manifest.ts`, `test/cli/cli-support-bundle.test.ts` | Add an EvidenceClient-backed collector only after the credential model is selected |
| P1 | Medium | Package/repo/preview adapter proofs remain local fixtures, not provider-grade integrations | `src/adapters/LANE.md`, `src/adapters/package-install/gateway.ts`, `src/adapters/repo-write/gateway.ts`, `src/adapters/preview-deploy/gateway.ts` | Promote one non-x402 adapter to a real gateway-held credential integration with hostile probes |
| P1 | Medium | x402 spend windows are metadata while only per-call bounds are enforced | `src/adapters/x402-payment/install-proposal.ts`, `src/mcp/x402-proposal.ts`, `docs/internal/protocol-notes.md` | Add an atomic reserve/commit/release spend ledger before aggregate budget claims |
| Resolved | Medium | Surface `allowedImportRoots` are mechanically enforced | `src/surfaces/boundary-manifest.ts`, `test/architecture/surface-boundary-posture.test.ts` | Keep allowed roots updated with every surface import change |
| P2 | Medium | Some MCP/CLI resources are source-catalog references rather than durable projections | `src/mcp/resources.ts`, `src/cli/x402/index.ts`, `test/mcp/mcp-resource-redaction.test.ts` | Add durable pre-contract projection records for metadata, install health, and certificate status |
| P2 | Medium | Demo scripts can create local proof churn that looks like product state | `examples/x402-protected-spend/run.ts`, `examples/mcp-reference-transcript/run.ts`, `test/product/x402-protected-spend-demo-report.test.ts` | Write generated outputs outside committed example paths or gate them as ignored artifacts |
| P2 | Low | x402 official SDK shape is pinned but not version-compatibility gated | `package.json`, `src/adapters/x402-payment/wallet-gateway.ts`, `test/adapters/x402-wallet-gateway.test.ts` | Add a supported-version compatibility check and refuse unknown x402 payment shapes |

## Tech Debt

**P0: CLI/MCP/process activation surfaces are still not distributable authority surfaces**
- Severity: Critical
- Issue: The repo now has a package-level role-client SDK activation subpath, but CLI, MCP, and process surfaces remain local/source-only and must not be described as installed authority surfaces.
- Evidence: `package.json` exports `./sdk/role-clients` for runtime/evidence role clients, plus `.`, `./conformance`, `./runtime`, `./experimental`, and `./package.json`; it still has no `bin` field and no `./mcp` export. `src/cli/LANE.md` states the CLI has no package-root export and commands are local source entrypoints. `src/mcp/LANE.md` states MCP has no package-root export and no process start. `examples/mcp-reference-transcript/README.md` states the transcript does not provide a public MCP host quickstart, SDK install/gateway clients, or CLI public package bin.
- Files: `package.json`, `src/index.ts`, `src/cli/LANE.md`, `src/mcp/LANE.md`, `examples/mcp-reference-transcript/README.md`, `test/architecture/package-surface.test.ts`, `test/architecture/root-exports.test.ts`
- Impact: A developer can now import the safest SDK proposal/readback surface, but operators and MCP hosts still cannot install a CLI/MCP/process authority boundary. Claim pressure remains around CLI/MCP demos.
- Smallest remediation: Pick a separate CLI bin, MCP host, or gateway worker target only when the exact custody, package export, process, and non-authority/authority tests are ready.

**P0: MCP transcript is a source harness, not a real MCP host/process proof**
- Severity: Critical
- Issue: The MCP reference transcript is source-owned and useful, but it does not prove a real MCP server process, client handshake, host credential isolation, or sibling tool containment under an MCP runtime.
- Evidence: `src/mcp/reference-transcript.ts` sets `externalHostClaimed: false`, `processLaunchClaimed: false`, `customerEnvironmentClaimed: false`, and `hostedGatewayClaimed: false`. The transcript uses fake runtime and evidence clients in `src/mcp/reference-transcript.ts`. `examples/mcp-reference-transcript/README.md` states it does not show a public MCP host quickstart. `src/mcp/LANE.md` states process startup remains out of scope.
- Files: `src/mcp/reference-transcript.ts`, `examples/mcp-reference-transcript/run.ts`, `examples/mcp-reference-transcript/README.md`, `test/mcp/mcp-reference-transcript.test.ts`, `src/mcp/LANE.md`
- Impact: The project can prove source contract mapping but cannot prove the model-facing transport boundary where real agents see tools. A real MCP host could accidentally expose authority credentials, sibling mutation tools, stale tool metadata, or non-Handshaked payment paths.
- Smallest remediation: Choose one concrete MCP host/client target and add a process-level fixture that proves `runtime_evidence` credential scope, tool list freshness refusal, sibling raw-payment containment, and absence of authority route access.

**P0: Gateway/process activation path is still cut from proposed contracts**
- Severity: High
- Issue: Tier 2 can create proposed contracts and local proof paths, but there is no source-owned process path that turns pending, exact greenlights into isolated gateway execution work.
- Evidence: `src/cli/LANE.md` lists process startup, gateway worker launch, MCP gateway proxy launch, and browser shell launch as explicitly out of scope. `src/surfaces/boundary-manifest.ts` marks `cli.process` as `deferred`. `.planning/macro/surfaces/CLOSEOUT.md` leaves `cli-011`, `cli-012`, and `cli-013` deferred. `examples/x402-protected-spend/run.ts` wires kernel, runtime, policy, and gateway locally inside the demo rather than through an operator process.
- Files: `src/cli/LANE.md`, `src/surfaces/boundary-manifest.ts`, `examples/x402-protected-spend/run.ts`, `.planning/macro/surfaces/CLOSEOUT.md`, `.planning/macro/surfaces/VERIFY-WORK.md`
- Impact: Operators can see a proposal story but have no boring path to run the enforcement worker. This leaves a weak workflow seam between "contract proposed" and "gateway process enforced", which is the place Handshake cannot afford ambiguity.
- Smallest remediation: Add a minimal pending gateway work feed that lists exact unconsumed greenlights for one gateway family, then add a process runner that consumes only those records and refuses terminal-supplied mutation parameters.

**P0: Trusted x402 install readiness remains deferred after local posture**
- Severity: High
- Issue: The CLI x402 install/probe flow now explicitly labels local compilation and trusted readiness false, but there is still no source-owned trusted control-plane registration/readiness projection.
- Evidence: `src/cli/x402/index.ts` returns `readinessAuthority: "local_compilation"`, `trustedInstallReadiness: false`, `nextReadinessAction: "register_control_plane_install"`, `controlPlaneRegistrationPerformed: false`, `gatewayCheckPerformed: false`, and a warning that no greenlight, signer use, gateway check, or mutation occurred. `LocalX402ProbeReportSchema` has `trustedReadiness: false`. `installHealthCommand()` returns `healthScope: "pre_contract"` and `contractKeyedProjectionStatus: "not_contract_keyed_yet"`. `test/cli/cli-x402-install-probes.test.ts` asserts doctor still reports not ready after local probe posture.
- Files: `src/cli/x402/index.ts`, `src/cli/local-project/index.ts`, `src/cli/command-manifest.ts`, `test/cli/cli-x402-install-probes.test.ts`, `test/architecture/cli-command-posture.test.ts`
- Impact: The operator story is clearer, but `doctor` must remain not-ready until a trusted control-plane/gateway source exists.
- Smallest remediation: Add one real registration/readiness projection so `install.health` can distinguish local compile success from trusted install readiness without implication drift.

**Resolved: Role-scoped SDK clients are now the first public package activation surface**
- Severity: High
- Issue: Closed for the first activation path. `package.json` now exports `./sdk/role-clients`; root still does not export `RuntimeClient` or `EvidenceClient`.
- Evidence: `test/sdk/role-clients.test.ts` imports from `handshake-protocol-kernel/sdk/role-clients` and asserts the subpath exports only `RuntimeClient`, `EvidenceClient`, and `HandshakeClientError`. `test/architecture/root-exports.test.ts` asserts root does not export role clients. `examples/x402-protected-spend/run.ts` imports role clients from the package subpath and does not import `HandshakeClient`.
- Files: `package.json`, `src/sdk/LANE.md`, `src/sdk/surface-clients/index.ts`, `examples/x402-protected-spend/run.ts`, `test/sdk/role-clients.test.ts`, `test/architecture/root-exports.test.ts`, `test/architecture/package-surface.test.ts`, `test/product/x402-protected-spend-demo-report.test.ts`
- Residual risk: `HandshakeClient` remains root-exported for route parity and tests. Public examples must keep steering activation code to the role-client subpath.
- Smallest remediation: Keep activation examples and docs guarded against low-level `HandshakeClient` usage.

**P1: MCP proposals bypass runtime-ingress graph creation and carry graphless evidence**
- Severity: High
- Issue: The MCP x402 tool directly uses role-scoped runtime client methods for execution, draft, compilation, and action proposal, but generated execution graph creation is not exposed through the role-scoped runtime surface.
- Evidence: `src/mcp/x402-proposal.ts` returns `generatedExecutionGraphId: null` and `generatedExecutionGraphPosture: "not_exposed_by_role_scoped_runtime_surface"`. `src/mcp/LANE.md` states generated graph creation remains kernel-only. `test/mcp/mcp-x402-proposal.test.ts` asserts the happy path creates runtime evidence, tool draft, compilation, and action contract only. `src/runtime/ingress/index.ts` has richer raw/ambiguous/truncated generated graph handling, but MCP does not call that ingress surface.
- Files: `src/mcp/x402-proposal.ts`, `src/mcp/LANE.md`, `src/runtime/ingress/index.ts`, `test/mcp/mcp-x402-proposal.test.ts`, `test/runtime/runtime-ingress.test.ts`
- Impact: MCP proves exact proposal and refusal outcomes, but it does not preserve the same generated-code graph evidence used by runtime ingress. Branch, loop, retry, and sibling behavior are represented as caller-supplied evidence flags rather than source-owned execution graph records.
- Smallest remediation: Either expose a bounded runtime role method for generated graph creation or explicitly keep MCP as exact action proposal only and prevent graph/branch claims in docs and examples.

**P1: Planning artifacts conflict with current Tier 2 source paths and status**
- Severity: Medium
- Issue: `.planning/` is scratch, but stale Tier 2 plans still contain source-contradicting statements and candidate paths that future agents can follow by mistake.
- Evidence: `.planning/macro/surfaces/sdk/PLAN.md` says there is no source implementation in the macro run and names paths such as `src/sdk/roles.ts` and `src/sdk/activation/transport.ts`, while source uses `src/sdk/surface-clients/transport.ts`. `.planning/macro/surfaces/cli/PLAN.md` says there is no CLI binary or source-owned CLI lane and names command shapes that do not match `src/cli/command-manifest.ts`. `.planning/macro/surfaces/mcp/PLAN.md` says no `src/mcp` lane exists and names install health URI shapes that differ from `src/mcp/catalog.ts`. `AGENTS.md` states `.planning/` files are scratch and must not become canonical source paths.
- Files: `.planning/macro/surfaces/sdk/PLAN.md`, `.planning/macro/surfaces/cli/PLAN.md`, `.planning/macro/surfaces/mcp/PLAN.md`, `.planning/macro/surfaces/CLOSEOUT.md`, `AGENTS.md`, `src/cli/command-manifest.ts`, `src/mcp/catalog.ts`
- Impact: The project can lose time rebuilding old plan shapes, adding files in wrong directories, or treating verified source as absent. This is a planning friction issue that directly blocks the next implementation phase.
- Smallest remediation: Mark the stale plan files as superseded at the top with links to live `LANE.md` files and closeout status, or rewrite only their status and path sections.

**Resolved: Support/debug handoff has a file-backed redacted bundle**
- Severity: Medium
- Issue: Closed for local/file-backed recovery. `support.bundle` assembles supplied redacted projections and local posture records into one evidence-only envelope.
- Evidence: `src/cli/support-bundle.ts` accepts contract, receipt timeline, install-health, local x402 install, and local x402 probe records. `test/cli/cli-support-bundle.test.ts` asserts non-authority flags, terminal posture, local readiness, reason codes, redaction posture, and absence of payment payload/signature/private token strings.
- Files: `src/cli/support-bundle.ts`, `src/cli/command-manifest.ts`, `src/cli/main.ts`, `test/cli/cli-support-bundle.test.ts`, `test/architecture/cli-command-posture.test.ts`
- Residual risk: The bundle is caller-supplied/file-backed, not HTTP/EvidenceClient-backed collection. That is deliberate until the credential model for support collection is selected.
- Smallest remediation: Add an EvidenceClient-backed collector only after deciding where support credentials live.

**P1: Package/repo/preview adapter proofs remain local fixtures, not provider-grade integrations**
- Severity: Medium
- Issue: The non-x402 Tier 2 protected actions have gateway-check discipline, but their adapters are reference/local proofs rather than production provider integrations.
- Evidence: `src/adapters/LANE.md` states adapters are reference gateways and proof lanes, not production integrations. `src/adapters/package-install/gateway.ts`, `src/adapters/repo-write/gateway.ts`, and `src/adapters/preview-deploy/gateway.ts` rely on caller-supplied gateway surfaces after `VerifiedGatewayCheck`. `docs/internal/protocol-notes.md` says the package-install path uses a regression fixture rather than external package material attestation.
- Files: `src/adapters/LANE.md`, `src/adapters/package-install/gateway.ts`, `src/adapters/repo-write/gateway.ts`, `src/adapters/preview-deploy/gateway.ts`, `test/adapters/package-install-gateway.test.ts`, `test/adapters/repo-write-gateway.test.ts`, `test/adapters/preview-deploy-gateway.test.ts`, `docs/internal/protocol-notes.md`
- Impact: The first engineering-agent wedge still lacks one non-payment provider-grade proof. This makes x402 stronger than package/repo/preview and limits confidence that the same gateway discipline survives normal engineering mutation channels.
- Smallest remediation: Promote one non-x402 adapter to a real provider-grade fixture with gateway-held credential custody, hostile raw/sibling bypass probes, and downstream proof-gap recording.

**P1: x402 spend windows are metadata while only per-call bounds are enforced**
- Severity: Medium
- Issue: x402 install metadata includes session/day/review spend window concepts, but actual enforcement is limited to exact per-call payment requirement matching and trusted maximum atomic amount.
- Evidence: `src/adapters/x402-payment/install-proposal.ts` sets `spendWindowsStatus: "not_enforced_tier1_metadata"` and the human summary says session/day/review windows are metadata. `src/mcp/x402-proposal.ts` checks `trustedMaxAtomicAmountPerCall` but no aggregate ledger. `docs/internal/protocol-notes.md` states `spendWindowRef` remains metadata until a ledger-backed reserve/commit/release mechanism exists.
- Files: `src/adapters/x402-payment/install-proposal.ts`, `src/adapters/x402-payment/action-proposal.ts`, `src/mcp/x402-proposal.ts`, `docs/internal/protocol-notes.md`, `test/cli/cli-x402-install-probes.test.ts`
- Impact: Repeated or parallel generated-code attempts can each stay under the per-call amount while exceeding the operator's intuitive aggregate budget. If docs or UI imply budget enforcement, the compiler overreaches the principal.
- Smallest remediation: Add an atomic spend ledger with reserve, commit, and release records before exposing session/day/review spend windows as enforcement.

## Known Bugs

Not detected in Tier 2 source as executable defects. Current blocking risks are activation gaps, reference-only proof seams, and planning/source drift rather than confirmed runtime bugs.

## Security Considerations

**Resolved: Surface `allowedImportRoots` are mechanically enforced**
- Severity: Medium
- Risk: Closed for active existing surface roots. The boundary manifest declares allowed import roots, and architecture tests now resolve internal imports against those roots.
- Evidence: `src/surfaces/boundary-manifest.ts` includes `allowedImportRoots` per surface. `test/architecture/surface-boundary-posture.test.ts` now includes `enforces allowed internal import roots for existing surface implementation roots`.
- Files: `src/surfaces/boundary-manifest.ts`, `test/architecture/surface-boundary-posture.test.ts`, `.planning/macro/surfaces/VERIFY-WORK.md`
- Current mitigation: Forbidden authority imports, allowed import roots, forbidden credential shapes, forbidden output fields, and claim-boundary tests are present.
- Recommendations: Keep allowed roots updated whenever surface source roots import new internal modules.

**P2: Some MCP/CLI resources are source-catalog references rather than durable projections**
- Severity: Medium
- Risk: Metadata, challenge, pre-contract install health, and certificate status can be surfaced as source/reference payloads rather than durable evidence projections.
- Evidence: `src/mcp/resources.ts` routes contract, envelope, receipt, idempotency, and contract-keyed install health through `EvidenceClient`, but metadata, challenge, pre-contract install health, and certificate resources are source-catalog/reference-only. `src/cli/x402/index.ts` reports local pre-contract install health and `contractKeyedProjectionStatus: "not_contract_keyed_yet"`. `test/mcp/mcp-resource-redaction.test.ts` asserts source-owned metadata and pre-contract health behavior.
- Files: `src/mcp/resources.ts`, `src/mcp/catalog.ts`, `src/cli/x402/index.ts`, `test/mcp/mcp-resource-redaction.test.ts`, `test/cli/cli-x402-install-probes.test.ts`
- Current mitigation: Resource payloads preserve non-authority flags and distinguish pre-contract/local posture.
- Recommendations: Add durable pre-contract projection records for metadata, install health, and certificate status, or keep their names explicitly reference-only.

**P2: Demo scripts can create local proof churn that looks like product state**
- Severity: Medium
- Risk: Example scripts write generated artifacts into example output paths, which can create dirty-worktree churn and make local proof output look like an installed product state.
- Evidence: `examples/x402-protected-spend/run.ts` writes APS report output under the example path. `examples/mcp-reference-transcript/run.ts` writes transcript output under the example path. `test/product/x402-protected-spend-demo-report.test.ts` spawns the demo and inspects generated report output.
- Files: `examples/x402-protected-spend/run.ts`, `examples/mcp-reference-transcript/run.ts`, `examples/x402-protected-spend/output/latest-aps-report.json`, `examples/mcp-reference-transcript/output/latest-transcript.json`, `test/product/x402-protected-spend-demo-report.test.ts`
- Current mitigation: Example READMEs and output envelopes carry non-claim language.
- Recommendations: Write generated outputs to ignored or temporary paths by default and keep committed examples as static fixtures only.

## Performance Bottlenecks

No Tier 2 performance bottleneck is currently visible from source inspection. The important scaling limit is control-plane state, not CPU throughput.

## Fragile Areas

**MCP freshness and tool-list refusal posture**
- Severity: Medium
- Files: `src/mcp/x402-proposal.ts`, `src/mcp/catalog.ts`, `test/mcp/mcp-x402-proposal.test.ts`, `test/mcp/mcp-schema-contract.test.ts`
- Why fragile: MCP proposal correctness depends on current metadata digest, tools digest, gateway posture, and exact caller-supplied x402 evidence. The source handles stale metadata and changed tools, but a real host process is not present to prove those checks happen across actual MCP list/call boundaries.
- Safe modification: Preserve fail-closed outcomes for `tools_list_changed`, `metadata_stale`, `install_not_ready`, `gateway_offline`, and `tool_execution_error`; add host-process tests before adding broad MCP claims.
- Test coverage: Schema, refusal, happy path, and reference transcript tests exist in `test/mcp/`; host-process/client integration tests are absent.

**CLI local project state**
- Severity: Medium
- Files: `src/cli/local-project/index.ts`, `src/cli/x402/local-state.ts`, `test/cli/cli-local-project.test.ts`, `test/cli/cli-x402-install-probes.test.ts`
- Why fragile: Local project config, token file refs, state root safety, symlink checks, and x402 install/probe posture all determine whether the operator sees "ready" or "not_ready". The flow is correct but easy to misread because local install compile success and trusted readiness are separate states.
- Safe modification: Keep token refs outside workspace, never write token values, preserve unsafe permission checks, and add explicit output fields for local compile status versus trusted readiness.
- Test coverage: Local init/doctor and x402 install/probe tests exist; live registration/readiness projection tests are absent.

**x402 exact payment matching**
- Severity: Medium
- Files: `src/adapters/x402-payment/wallet-gateway.ts`, `src/adapters/x402-payment/action-proposal.ts`, `src/adapters/x402-payment/conformance.ts`, `test/adapters/x402-wallet-gateway.test.ts`, `test/adapters/x402-bypass-probes.test.ts`
- Why fragile: The official x402 payment requirement, selected requirement index, digest, endpoint, scheme, amount, payee, network, token, and payment identifier all have to match before signing. Any upstream SDK shape drift can turn a valid proof into a refusal or, worse, a missed comparison if new fields matter.
- Safe modification: Treat unknown official x402 shapes as unsupported until tests include the new fields; signer invocation must remain after verified gateway check only.
- Test coverage: Good hostile and replay coverage exists for current x402 shapes; version-compatibility tests are absent.

## Scaling Limits

**Aggregate spend control**
- Current capacity: Exact per-call x402 payment bound checks exist in `src/mcp/x402-proposal.ts` and exact wallet gateway checks exist in `src/adapters/x402-payment/wallet-gateway.ts`.
- Limit: Session/day/review spend windows are metadata in `src/adapters/x402-payment/install-proposal.ts`; no atomic ledger prevents many valid per-call attempts from exceeding aggregate spend expectations.
- Scaling path: Add ledger-backed reserve, commit, release, and reconciliation records keyed to principal, gateway, action class, and spend window before advertising aggregate spend enforcement.

**Gateway worker queue**
- Current capacity: Source demos can invoke local gateway paths directly in `examples/x402-protected-spend/run.ts`; adapter tests prove gateway check before local mutations.
- Limit: No pending gateway work feed or worker process exists in `src/cli/` or package exports.
- Scaling path: Add exact-greenlight work listing, worker leasing, one-use consumption, and replay refusal before adding broad process launchers.

## Dependencies at Risk

**x402 official SDK**
- Risk: The project depends on current official x402 shapes and helpers while Tier 2 x402 proof logic is highly schema-sensitive.
- Impact: A minor upstream shape change can break exact payment matching, payment payload creation, or conformance classification.
- Files: `package.json`, `src/adapters/x402-payment/wallet-gateway.ts`, `src/adapters/x402-payment/conformance.ts`, `test/adapters/x402-wallet-gateway.test.ts`, `test/conformance/x402-payment-conformance.test.ts`
- Migration plan: Add a supported-version compatibility gate and fixture tests that refuse unknown payment requirement shapes until mapped.

## Missing Critical Features

**Public activation target**
- Problem: The SDK role-client subpath is now available, but no public CLI bin or MCP process/export exists.
- Blocks: Operator quickstart, MCP host validation, and process-level adoption tests.
- Files: `package.json`, `src/cli/LANE.md`, `src/mcp/LANE.md`, `src/sdk/LANE.md`
- Smallest remediation: Choose the next activation surface only after defining its exact custody and non-authority/authority posture.

**MCP host/runtime target**
- Problem: MCP source code proves schemas, proposal mapping, and reference transcript behavior but not a real host/client runtime boundary.
- Blocks: Model-facing transport proof, credential isolation validation, sibling tool containment, and real MCP user docs.
- Files: `src/mcp/reference-transcript.ts`, `examples/mcp-reference-transcript/README.md`, `test/mcp/mcp-reference-transcript.test.ts`
- Smallest remediation: Implement one source-owned MCP server process fixture using only runtime/evidence roles.

**Gateway work feed and process runner**
- Problem: There is no source-owned path from exact greenlights to a gateway worker process.
- Blocks: Operator workflow from proposed contract to enforced mutation outside the local demo harness.
- Files: `src/cli/LANE.md`, `src/surfaces/boundary-manifest.ts`, `.planning/macro/surfaces/CLOSEOUT.md`
- Smallest remediation: Add pending work read model and one worker command for x402 or package install.

**Redacted support bundle**
- Problem: File-backed `support.bundle` exists, but HTTP/EvidenceClient-backed support collection is not implemented.
- Blocks: One-command collection from a running control plane.
- Files: `src/cli/support-bundle.ts`, `src/cli/command-manifest.ts`, `src/sdk/surface-clients/evidence-client.ts`
- Smallest remediation: Add support collection through `EvidenceClient` only after support credential custody is selected.

**Aggregate spend ledger**
- Problem: x402 aggregate spend windows are not enforced.
- Blocks: Safe product language around spend budgets beyond per-call payment bounds.
- Files: `src/adapters/x402-payment/install-proposal.ts`, `src/mcp/x402-proposal.ts`, `docs/internal/protocol-notes.md`
- Smallest remediation: Add reserve/commit/release ledger primitives and proof-gap reconciliation.

## Test Coverage Gaps

**Package-level activation tests**
- What's not tested: Installing/using the package as a consumer with intended Tier 2 CLI or MCP surfaces. The role-client SDK package subpath now has source/package import smoke coverage.
- Files: `package.json`, `test/architecture/package-surface.test.ts`, `test/architecture/root-exports.test.ts`
- Risk: CLI/MCP source tests can pass while those surfaces remain unusable as installed process/package targets.
- Priority: High

**MCP process/client tests**
- What's not tested: Real MCP server process startup, client list/call flow, role credential isolation, and sibling tool containment.
- Files: `src/mcp/reference-transcript.ts`, `test/mcp/mcp-reference-transcript.test.ts`, `examples/mcp-reference-transcript/README.md`
- Risk: The model-facing boundary can drift from source reference behavior.
- Priority: High

**Gateway worker tests**
- What's not tested: Work-feed listing, worker leasing, exact greenlight consumption, replay refusal, and terminal parameter refusal for a gateway process.
- Files: `src/cli/LANE.md`, `src/surfaces/boundary-manifest.ts`, `src/adapters/x402-payment/wallet-gateway.ts`
- Risk: Gateway enforcement remains demo-local rather than operator-runnable.
- Priority: High

**Positive surface import allowlist tests**
- What's not tested: Future dynamic/generated import patterns beyond static `from` import specifiers. Active static surface imports are now checked against `allowedImportRoots`.
- Files: `src/surfaces/boundary-manifest.ts`, `test/architecture/surface-boundary-posture.test.ts`
- Risk: Authority drift can enter through non-static imports or new roots if tests are not updated with source changes.
- Priority: Medium

**Aggregate spend ledger tests**
- What's not tested: Atomic x402 budget reserve/commit/release across retries, parallel attempts, refusals, and proof gaps.
- Files: `src/adapters/x402-payment/install-proposal.ts`, `src/mcp/x402-proposal.ts`, `test/cli/cli-x402-install-probes.test.ts`
- Risk: Product can accidentally imply budget enforcement that source does not provide.
- Priority: Medium

**Support bundle redaction tests**
- What's not tested: HTTP/EvidenceClient-backed support bundle collection against a running control-plane/evidence route. File-backed redacted support bundle assembly is tested.
- Files: `src/cli/support-bundle.ts`, `src/cli/output.ts`, `src/sdk/surface-clients/evidence-client.ts`
- Risk: Operators still need to supply projection files manually until a credentialed collector is selected.
- Priority: Medium

---

*Concerns audit: 2026-05-23*
