# Phase 02: Address Concerns (edge hardening) - Context

**Gathered:** 2026-05-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Pay down **product-surface and enforcement-boundary debt** documented in `.planning/codebase/CONCERNS.md` while the **protocol kernel stays wedge-agnostic and unchanged in authority semantics**.

This phase delivers:

- Closed gaps where new CLI commands, package exports, and A2A surfaces bypass architecture posture enforcement.
- Machine-enforced separation of gateway check, downstream execution, readback, terminal certificate, and proof-packet evidence — without collapsing types in user-facing output.
- Honest proof-gap posture for blocked gates (host containment, live x402, product completion) — no weakening `--expect-status blocked` to fake readiness.
- Targeted hosted-admission hardening on existing paths only (scope/audit/projections), not hosted operation claims.

This phase does **not** deliver:

- Live customer-gateway x402 execution, provider custody, settlement, or marketplace claims.
- Host-wide generated-code containment claims.
- New runtime ingress families unless required to close a manifest-listed surface gap (default: no new families).
- Phase 03 preview-deploy scope (protected MCP/CLI deploy wedge) — prepare only via clean boundaries.

**Evidence basis:** `.planning/codebase/CONCERNS.md` (2026-05-28), advisor research on five decision axes (sequencing, manifest, containment, evidence theatre, hosted slice), `.planning/ROADMAP.md` Phase 02 goals.

</domain>

<decisions>
## Implementation Decisions

### Non-negotiables (kernel integrity)

- **D-00:** Do not change protocol kernel authority semantics (one-use greenlight, exact gateway check, receipt vs proof-gap distinction) to absorb product debt. Debt closure happens at **surfaces, adapters, manifests, schemas, and architecture tests** — not by relaxing `src/protocol/` transitions or widening greenlight scope.
- **D-00b:** Keep runtime ingress **wedge-agnostic**: registry changes are limited to shared scaffolding or explicit per-family bundles (registry + schemas + bypass probes + tests). Do not embed x402-only or A2A-only logic into `src/protocol/`.
- **D-00c:** Preserve modular package exports: consumers use `handshake-protocol-kernel/hosted-admission` and surface subpaths, not HTTP internals (`test/product/hosted-package-consumer.test.ts` posture).

### Remediation sequencing (evidence: CONCERNS priority table + architecture test skip behavior)

- **D-01:** **Wave 1 — boundary manifest + architecture coverage** before any live-proof or ingress-expansion work. Backfill known gaps, then add a CI gate so new exports/CLI handlers cannot ship unlisted.
- **D-02:** **Wave 2 — evidence-type separation** (shared schema fragments, proof-packet/script parity, output labeling) immediately after Wave 1 — prevents blocked `pack:check` outcomes and admission/MCP/doctor readbacks from being read as clearance or execution.
- **D-03:** **Wave 3 — deferred to Phase 03 or dedicated proof gates:** live x402 paid retry, host containment transcript beyond blocked status, hosted operation/custody, auth.md+x402 composite execution marketing.
- **D-04:** Hosted readback work runs as a **bounded parallel track** (projections + scope tightening), not as the lead sequence for CLI/MCP authority hardening.

### Boundary manifest enforcement (evidence: `existingSurfaceFiles()` skip, six known unlisted paths)

- **D-05:** One-time **manual backfill** of `src/surfaces/boundary-manifest.ts` for:
  - CLI: `src/cli/host/doctor.ts`, `src/cli/mcp/doctor.ts`, `src/cli/quality/report.ts`, `src/cli/state/inspect.ts`, `src/cli/simulate/x402-payment.ts`, `src/cli/demo/x402.ts`, `src/cli/quickstart/x402.ts`, `src/cli/x402/readiness.ts` (grouped under existing `cli.operator` / `cli.evidence` / `cli.process` planes per command role).
  - Surfaces: `src/surfaces/a2a-negotiation-support/` (new surface id), `src/surfaces/a2a-negotiation-readback/` (export `./surfaces/a2a-negotiation-readback`).
  - Package exports: ensure `./surfaces/service-workflow-admission` and `./hosted-admission` map to manifest rows with explicit `authorityPosture` and `claimBoundaryLabels`.
- **D-06:** Add an **architecture test** that fails when:
  - `package.json` `exports` surface subpaths lack a manifest surface + `sourceRoots` entry, and
  - `cliCommandManifest` handler implementation files lack coverage under a manifest `sourceRoots` path.
  - Use allowlists for shared files (`command-manifest.ts`, `main.ts`, transport helpers).
- **D-07:** **Reject** directory-wide wildcards (e.g. entire `src/cli/`) as the primary fix — preserves operator vs evidence vs process separation.
- **D-08:** **Reject** annotation/codegen-only manifest as the first mechanism — posture metadata (`authorityPosture`, `allowedRouteFamilies`, `claimBoundaryLabels`) stays hand-authored and reviewable; automation only detects drift.

### Generated-code containment (evidence: blocked `host-generated-code-containment`, three-family registry)

- **D-09:** Keep `host_generated_code_containment` proof packet and `check-host-generated-code-containment.mjs` at **`--expect-status blocked`** through Phase 02 completion. Public copy must state **host-specific transcript proof**, not host-wide containment.
- **D-10:** When investing in containment evidence, use **Codex-first live adapter transcript** via existing `capture` / `build` / `check` pipeline — not profile/fixture projection as containment proof.
- **D-11:** **Do not** expand runtime ingress registry solely to close the containment gate; ingress expansion is out of scope unless a new family is explicitly scoped in a later phase with full bundle (registry + schemas + bypass probes + arch tests + manifest rows).
- **D-12:** **Do not** drop the containment product gate in favor of bypass-probes-only narrative — that would contradict `product-completion` and `decisions.md` transcript requirements.

### Receipt and evidence theatre (evidence: listed theatre patterns in CONCERNS)

- **D-13:** Use a **layered prevention stack** (not documentation-only):
  1. Extract **shared schema fragments** for `evidenceKind`, `readbackBoundary`, `authorityBoundary` used by MCP proposal, runtime ingress, A2A readback, proof packets, SDK repair.
  2. Add **MCP x402 ↔ runtime ingress ↔ action-proposal parity tests** for valid, refusal, and binding-mismatch inputs.
  3. Extend **CLI/MCP/A2A output labeling** to match existing `cliOutput` non-authority envelope patterns (`gatewayCheckPerformed: false`, explicit non-claims).
  4. **Split** monolithic projector files only where review risk is high (`evidence-projections/projections.ts`, `proof-packets/product-completion.ts`) — split is secondary to schema separation.
- **D-14:** Change **proof-packet projectors and check scripts in the same patch** (`product-completion.ts` + `check-product-completion.mjs`) to prevent closeout drift.
- **D-15:** External ship/distribution claims remain **proof-packet-only** with blocked/incomplete expected statuses; npm/MCP registry state does not enter policy or greenlight paths.

### Hosted admission next slice (evidence: Hosted Admission Lock, scope narrowing gap)

- **D-16:** **Primary mechanism:** object-specific **redacted projection endpoints** per `audit_read` types in `src/protocol/areas/object-registry/index.ts` — not new generic raw HTTP read surfaces.
- **D-17:** **Parallel mechanism:** tighten **raw-read audit + fail-closed scope** in `src/http/handlers/hosted-record-scope.ts` and `raw-read-audit.ts` — including tests for records missing `projectId`/`workspaceId` in payload.
- **D-18:** **Defer** mandatory `projectId`/`workspaceId` on all `audit_read` schemas until tenancy semantics are proven — do not invent scope fields org-wide without object-type justification.
- **D-19:** **Freeze** expansion of hosted HTTP routes that imply custody, settlement, search, or mutation authority; package-only integrators continue via `./hosted-admission` exports.

### A2A surfaces (evidence: product tests without surface-boundary-posture coverage)

- **D-20:** Register **A2A negotiation support and readback** in boundary manifest **now** (Wave 1), with explicit non-authority flags aligned to `A2ANegotiationIngressAdmissionAuthorityBoundarySchema` and readback `AuthorityBoundarySchema`.
- **D-21:** Extend `test/architecture/surface-boundary-posture.test.ts` / `claim-boundary.test.ts` coverage to A2A surface roots — agreement evidence must not read as permission (`gatewayCheckRemainsFinalEnforcementPoint` preserved in readback).

### Live x402 and product completion (evidence: blocked gates, local/reference only)

- **D-22:** Keep **live x402 paid retry**, **distribution launch gate**, and **product completion** at blocked/incomplete expected statuses through Phase 02; narrative docs must not outpace `productLaunchGateResolutions` non-claims.
- **D-23:** Phase 03 plan (`docs/plans/03-plan-protected-mcp-cli-preview-deploy.md`) owns preview-deploy and MCP/CLI wedge paths — not this concerns phase.

### Claude's Discretion

- Exact manifest surface IDs and `sourceRoots` groupings for new CLI files (must preserve operator/evidence/process separation).
- Which `audit_read` object types get redacted projections first (prioritize types referenced by service-workflow-admission and hosted identity evidence tests).
- File-split boundaries for evidence projectors (follow `STRUCTURE.md` one-concept-per-folder rule).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Authority doctrine and decisions

- `AGENTS.md` — kernel invariants, generated-code threat model, strategy discipline
- `docs/internal/decisions.md` — Hosted Admission Lock, Evidence Read Boundary, product launch gates
- `docs/internal/protocol-notes.md` — compact protocol notes
- `.planning/codebase/CONCERNS.md` — debt inventory and safe-modification guidance (2026-05-28)
- `.planning/codebase/ARCHITECTURE.md` — authority boundary, x402 flow
- `.planning/codebase/STRUCTURE.md` — where to add code
- `.planning/codebase/TESTING.md` — test commands and architecture test layout
- `.planning/ROADMAP.md` — Phase 02/03 execution order

### Enforcement surfaces (Wave 1–2 touch points)

- `src/surfaces/boundary-manifest.ts` — surface posture contract
- `src/cli/command-manifest.ts` — CLI command registry
- `package.json` — public exports map
- `test/architecture/surface-boundary-posture.test.ts`
- `test/architecture/claim-boundary.test.ts`
- `test/architecture/cli-command-posture.test.ts`
- `test/architecture/workflow-admission-boundary.test.ts`
- `test/architecture/negotiation-no-authority-surface.test.ts`

### Proof packets and blocked gates (honest posture)

- `src/surfaces/proof-packets/host-generated-code-containment.ts`
- `src/surfaces/proof-packets/live-x402/paid-retry.ts`
- `src/surfaces/proof-packets/product-completion.ts`
- `src/surfaces/product-launch-gate-resolution.ts`
- `scripts/check-host-generated-code-containment.mjs`
- `scripts/check-live-x402-paid-retry.mjs`
- `scripts/check-product-completion.mjs`

### Runtime and gateway (read-only for this phase unless D-11 exception)

- `src/runtime/ingress/registry.ts`
- `src/adapters/x402-payment/wallet-gateway.ts`
- `src/protocol/areas/gateway-gate/`

### Hosted admission (bounded track)

- `src/hosted-admission/LANE.md`
- `src/http/handlers/hosted-record-scope.ts`
- `src/http/handlers/raw-read-audit.ts`
- `src/protocol/areas/object-registry/index.ts`

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- `src/surfaces/boundary-manifest.ts` + `test/architecture/surface-boundary-posture.test.ts` — posture enforcement framework; needs coverage extension, not redesign.
- `src/surfaces/proof-packets/shared.ts` — `NonAuthorityBoundary`, `authorityBoundary.createsAuthority: false` patterns for proof packets.
- `src/cli/output.ts` — non-authority CLI envelope patterns to extend to new doctor/quality/simulate commands.
- `src/surfaces/a2a-negotiation-support/ingress-admission.ts` — existing admission authority boundary schema for manifest registration.
- Host containment pipeline: `scripts/capture-host-generated-code-containment.mjs`, `scripts/build-host-generated-code-containment-transcript.mjs`, `scripts/check-host-generated-code-containment.mjs`.

### Established Patterns

- **Manifest-before-export:** LANE docs require manifest update before new surface/CLI exposure.
- **Blocked-as-proof-gap:** `pack:check` expects blocked/incomplete for gates without live evidence — debt fix must not weaken these expectations.
- **Protocol store atomicity:** D1/memory alignment tests are kernel contracts — do not shortcut for product convenience.

### Integration Points

- New architecture test wires `package.json` exports + `cliCommandManifest` → `boundary-manifest.ts`.
- Schema fragments consumed by MCP, runtime ingress, A2A readback, proof packets, SDK repair.
- Hosted projections register in evidence-read route registry (follow existing evidence projection patterns).

</code_context>

<specifics>
## Specific Ideas

- User confirmed: kernel is mostly solid; debt is **edge polishing** (surfaces, manifest lag, evidence collapse, proof-gate misreads) — not kernel redesign.
- User delegated to **evidence-based advisor conclusions** (2026-05-28 research): manifest+arch tests first, layered evidence separation, blocked containment with optional Codex transcript later, hosted projections not HTTP expansion, defer live x402 to Phase 03.

</specifics>

<deferred>
## Deferred Ideas

### Phase 03 / dedicated proof gates

- Live customer-gateway x402 paid retry with funded custody and post-gateway signer proof.
- Protected MCP/CLI preview deploy wedge (`docs/plans/03-plan-protected-mcp-cli-preview-deploy.md`).
- Auth.md + x402 composite execution (`readyForCompositeExecution: false` until separate gate).

### Later phases (capability expansion)

- Host-wide generated-code containment beyond named-adapter transcripts.
- Runtime ingress family expansion beyond three families (each family = full bundle).
- Mandatory `projectId`/`workspaceId` on all `audit_read` types (until tenancy model proven).
- Provider-grade credential custody lifecycle (vault integration, rotation).
- Hosted operation: custody, settlement, marketplace, cross-org trust, aggregate spend, retention/search.
- MCP Registry acceptance and npm distribution unblocking (update launch-gate evidence when external state changes — do not weaken non-claims).
- Evidence projection batching stress tests (`RECEIPT_TIMELINE_EVENT_BATCH_SIZE` boundary) — low priority.

### Reviewed alternatives (rejected for this phase)

- Directory-wide `sourceRoots` wildcards — rejected (D-07): weakens CLI plane separation.
- Documentation/runbook-only evidence theatre fix — rejected (D-13): insufficient vs structured output consumers.
- Drop containment gate; bypass probes only — rejected (D-12): contradicts product-completion contract.
- Expand runtime ingress before manifest gates — rejected (D-11): increases consequential surface without posture enforcement.

</deferred>

---

*Phase: 02-address-concerns*
*Context gathered: 2026-05-28*
