# Codebase Concerns

**Analysis Date:** 2026-05-29  
**Branch:** `phase-05-product-coherence` @ `aef9478`  
**Prior map:** 2026-05-28 (authority-boundary narrative; superseded by this pass)

This document lists **open** technical debt, proof gaps, and operational blockers verified against the tree at HEAD. Closed Phase 05 security mitigations (Mechanism A custody, import confinement) are cited only where an **accepted residual** remains.

---

## Open proof gaps (distribution and posture)

### MCP Registry discoverability unverified

| Field | Detail |
|-------|--------|
| **What** | Public npm publication does not prove MCP Registry acceptance or lookup. Launch `distribution_bar` stays blocked. |
| **Where** | `src/surfaces/product-launch-gate-resolution.ts:81-101` (`blockerReasonCodes`: `mcp_registry_submission_not_accepted`, `mcp_registry_discoverability_not_verified`; registry GET 404 + empty search); `src/surfaces/proof-packets/distribution-provenance.ts:153-164`; `docs/internal/decisions.md:77`, `:244`, `:613`; `README.md:24`; `AGENTS.md:154` |
| **Severity** | **High** (blocks distribution launch language; not an authority bug) |
| **Why open** | Registry submission/lookup not verified in this checkout; source records honest blockers. |
| **Closes when** | Official MCP Registry returns server by `io.github.CreasyBear/handshake-protocol-kernel` name/version; update `productLaunchGateResolutions` + distribution readback inputs; re-run `scripts/check-distribution-provenance.mjs` / product-completion gates. |

### Whole-repo export surface vs published npm (manifest + distribution)

| Field | Detail |
|-------|--------|
| **What** | Local `package.json` `exports` omits `./hosted-admission` and `./surfaces/service-workflow-admission` even though `src/hosted-admission/` and `src/surfaces/service-workflow-admission/` exist and `boundary-manifest.ts` registers `surfaces.hosted_admission` / `surfaces.service_workflow_admission`. `test/architecture/manifest-coverage.test.ts` fails; published npm@0.2.7 cannot expose the same subpaths as the repo intends. |
| **Where** | `package.json:26-77` (exports list — subpaths absent); `test/architecture/manifest-coverage.test.ts:21-28`, `:128-131` (expects both exports); `src/surfaces/boundary-manifest.ts:849-884` (`sourceRoots` present); `src/surfaces/proof-packets/distribution-provenance.ts:50-57`, `:137-142` (`missingLocalExports` gap when published tarball lacks local export keys) |
| **Severity** | **High** |
| **Why open** | Exports not added to `package.json` / build bundles after hosted-admission and service-workflow surfaces landed; pre-Phase-04 baseline gap, still open at `aef9478` (see `05-VERIFICATION.md` acceptable_failures). |
| **Closes when** | Add `./hosted-admission` and `./surfaces/service-workflow-admission` to `package.json` `exports`, extend `scripts/build-package-bundles.mjs` / `dist/` outputs, publish new npm version, confirm `manifest-coverage` and distribution readback green. |

### Integrator raw x402 SDK bypass (security F-01 / T-12)

| Field | Detail |
|-------|--------|
| **What** | Host or integrator code can call `@x402/core/client` / `@x402/evm` outside `runX402WalletGateway` / `assertGatewayHeldSigningCommand`. That path produces **no** Handshake clearance evidence; it is not repo-wide enforceable. |
| **Where** | `docs/internal/decisions.md:365-367` (explicit proof gap); `.planning/phases/05-product-coherence/05-SECURITY.md:55-63` (F-01); `test/architecture/import-posture.test.ts:283-298` (confines SDK imports to `src/adapters/x402-payment/wallet-gateway.ts` only **inside this repo**); `src/adapters/x402-payment/wallet-gateway.ts:143-187`, `:301`, `:375` (guard on canonical paths) |
| **Severity** | **Medium** (accepted) |
| **Why open** | Phase 05 disposition: mitigate in-repo, **accept** external bypass as proof gap (D-25-style consumer inventory deferred). |
| **Closes when** | Integrator conformance gate / documented mandatory wrapper entrypoints + optional consumer-repo CI; not claimed closed by kernel-only import rules. |

### HTTP transition sequence matrix ≠ per-request gate (security F-02 / T-08)

| Field | Detail |
|-------|--------|
| **What** | `transitionSequenceMatrix` is a **construction-time** drift guard (matrix/registry parity, acyclicity). It does **not** reject out-of-order HTTP requests by itself. Per-request ordering comes from route `recordScope` + kernel transition guards. |
| **Where** | `src/http/admission/transition-sequence-matrix.ts:4-15`, `:74-85` (comments + `assertTransitionSequenceMatrixCoverage`); `src/http/app.ts:33-34` (wired at app build); `.planning/phases/05-product-coherence/05-SECURITY.md:65-73` (F-02); `.planning/phases/05-product-coherence/05-KEEL-AUDIT.md:73-86` |
| **Severity** | **Medium** (accepted) |
| **Why open** | By design — adding request-time matrix rejection would duplicate kernel guards and risk “second policy engine” theatre. |
| **Closes when** | N/A for acceptance; only “closes” if product docs stop implying matrix is per-request enforcement (already labeled drift guard in source). |

---

## Deferred remote operations (not done at HEAD)

### PR / merge to main / npm publish

| Field | Detail |
|-------|--------|
| **What** | Phase 04+05 work lives on stacked branches locally; `origin/main` is behind local `main` (8 commits ahead per local tracking). Full phase stack (`phase-05-product-coherence`) is **139 commits** ahead of `origin/main` merge-base — not merged/pushed as a unit in this mapping pass. npm publish to expose new export surface blocked operationally (401) when attempted outside trusted-publish workflow. |
| **Where** | Git state at map time: branch `phase-05-product-coherence` @ `aef9478`; `05-VERIFICATION.md:27-28` verified @ `6e23848`; `docs/internal/decisions.md:760-762` (`actually_published` / `registry_discoverable` definitions) |
| **Severity** | **High** (release/process) |
| **Why open** | No `gh` merge + no successful maintainer npm publish of export-complete artifact in this session; operator tooling constraints (per plan context). |
| **Closes when** | PR merged to `main`, `npm publish` with provenance for version containing full export surface, registry verification, tags aligned with `CHANGELOG.md`. |

### CI: check-only, no publish-on-merge

| Field | Detail |
|-------|--------|
| **What** | GitHub Actions runs `npm run check:repo` only — no release, no npm publish, no registry push on merge. |
| **Where** | `.github/workflows/check.yml:14-24` (`bun install` + `npm run check:repo`); `test/architecture/naming-posture.test.ts:161-168` (asserts workflow lacks `trusted-publish` / `npm publish`) |
| **Severity** | **Medium** |
| **Why open** | Trusted publish workflow exists in **release projection** artifact (`.github/workflows/trusted-publish.yml` in projected tree — see `test/architecture/release-repository-projection.test.ts:61-66`), not in live repo CI on every push. |
| **Closes when** | Add trusted-publish (or equivalent) workflow to default branch with OIDC/npm provenance; document in `docs/internal/release-admin-runbook.md`. |

---

## Test residuals (environmental / baseline)

### Repo naming posture (2 failures)

| Field | Detail |
|-------|--------|
| **What** | `test/architecture/naming-posture.test.ts` fails on workspace junk and scratch paths — not authority regressions. |
| **Where** | `:54-60` — `.DS_Store` under `src/**`, `test/`, etc. (21 paths at map run); `:121-124` — `.agents`, `skills-lock.json` still on disk (`nonCanonicalScratchFiles`) |
| **Severity** | **Low** (environmental) |
| **Why open** | macOS metadata + local agent scaffold not removed; Phase 05 verification explicitly lists both as **acceptable_failures** (`05-VERIFICATION.md:10-13`). |
| **Closes when** | Delete `.DS_Store` from tree (or add to global gitignore outside test scope); remove or quarantine `.agents` / `skills-lock.json` per `planning-scratch-quarantine` policy. |

### Manifest coverage (1 failure)

| Field | Detail |
|-------|--------|
| **What** | `manifest coverage > maps each product surface export…` fails: `package.json missing expected export ./hosted-admission` and `./surfaces/service-workflow-admission`. |
| **Where** | `test/architecture/manifest-coverage.test.ts:143` |
| **Severity** | **Medium** (baseline debt; blocks full green `bun test`) |
| **Why open** | Same root cause as export/npm gap above. |
| **Closes when** | Add exports to `package.json` (manifest entries already exist). |

### Release repository projection

| Field | Detail |
|-------|--------|
| **What** | At `aef9478`, isolated test **passes** (~1.5s). Not among the three recorded failures in `05-VERIFICATION.md`. If full-suite CI times out, treat as environmental (Node spawn + temp dir), not a logic failure. |
| **Where** | `test/architecture/release-repository-projection.test.ts:10-88`; `scripts/project-release-repository.js` |
| **Severity** | **Low** (watch) |
| **Why open** | N/A unless reproduced under `npm run check:repo` timeout. |
| **Closes when** | If flaky: increase CI timeout or cache npm for projection smoke; otherwise no code change. |

**Current architecture test tally (this pass):** `bun test` on naming + manifest + release projection → **17 pass / 3 fail** (matches verification doc modulo HEAD `aef9478` vs `6e23848`).

---

## Phase 05 security — accepted MEDs (not fixed)

Source: `.planning/phases/05-product-coherence/05-SECURITY.md` (audited `6e23848`; branch now `aef9478`).

| ID | Severity | Status | Evidence | Closes when |
|----|----------|--------|----------|-------------|
| **F-01** | Medium | **Accepted** | Raw integrator SDK bypass — see proof gap above | D-25 integrator inventory / adoption conformance |
| **F-02** | Medium | **Accepted** | Matrix drift guard only — see proof gap above | Documentation only; do not promote to per-request gate |
| F-03 | Low | Open (optional) | `createLocalX402SandboxSigningSurface` delegates guard to official surface (`05-SECURITY.md:77-84`) | Redundant `assertGatewayHeldSigningCommand` at wrapper entry |
| F-04 | Low | Open (optional) | `src/experimental.ts:22-32` exports wallet types; unstable boundary (`05-SECURITY.md:86-93`) | Keep off `src/index.ts`; custody contract tests if promoted |
| F-05 | Low | Accepted | Test literal `"test-secret"` in fixtures (`05-SECURITY.md:95-102`) | Continue redaction tests; no repo real keys |

---

## Phase 05 review — deferred MEDs (non-blocking, not fixed)

Source: `.planning/phases/05-product-coherence/05-REVIEW.md` (SHIP-WITH-FIXES @ `e60fc87`; HR-01/MR-01 resolved).

| ID | Severity | Status | Where | Why deferred |
|----|----------|--------|-------|--------------|
| **MR-02** | Medium | **Deferred** | `src/protocol/foundation/failure-class/index.ts:55-61`; consumers `src/sdk/surface-clients/transport.ts:76-87`, `src/sdk/client.ts:328-339` | Empty/non-JSON error bodies collapse 409 subtypes via `failureClassFromHttpStatus`; structured envelopes preserve replay vs refusal. Accepted degradation until optional `x-handshake-failure-class` header or documented intentional collapse. |
| **MR-03** | Medium | **Deferred** | `src/adapters/auth-md/gateway.ts:251-265` (cf. x402 `wallet-gateway.ts:143-187`, `:301`, `:375`) | D-64 Mechanism A structural for x402 only; auth.md lacks shared `assertGatewayHeldExecutionCommand` before I/O. Custom `AuthMdProtectedApiCallSurface` could ignore resolution evidence. Needs architecture test analogous to `x402-gateway-credential-custody.test.ts`. |
| **MR-04** | Medium | **Deferred** | `src/adapters/x402-payment/wallet-gateway.ts:332-357` | Bare `catch` maps custody/signing throws to generic `payment_signature_failed`; operators cannot distinguish custody violation from downstream signing failure without parsing message prefix. |

**HR-01 / MR-01 (same hunk):** **Resolved** @ `e60fc87` — registry-first classification; refusal kinds no longer mislabeled as `proof_gap`.

**Phase 05 mitigate threats (T-01–T-11):** marked **CLOSED** in security audit with code pins (wallet gateway custody, import posture, gateway invariants, agent-origin graph). Do not re-list as open unless regressions appear.

---

## Phase 04 review — deferred HIGH/MED status at HEAD

Source: `.planning/phases/04-service-agent-gating/04-REVIEW.md` (SHIP-WITH-FIXES, 2026-05-29).

| ID | Original | At `aef9478` | Evidence |
|----|----------|--------------|----------|
| **H-01** | Policy refusals → `proof_gap` | **Largely fixed** | `src/protocol/foundation/reason-codes.ts:188-197` — `decisionPolarity: "refusal"` on `envelope_not_active`, `action_class_outside_envelope`, `prior_action_not_greenlit`, etc.; `failure-class/index.ts:79-82` honors polarity |
| **H-02** | `"proof"` substring misclassification | **Fixed** | Broad `code.includes("proof")` removed from `classifyFailureClassFromReasonCode`; metadata-driven path only (`failure-class/index.ts:139-167`) |
| **H-03** | Integrator HTTP routes ungated | **Partial** | `src/http/mutation-route-manifest.ts:1-82` + `test/architecture/http-handler-mutation-gating.test.ts:52-84` inventory first-party handlers/examples; **arbitrary integrator services still out of scope** (same as F-01/D-25) |
| **H-04** | SDK loses taxonomy on malformed body | **Partial** | `src/sdk/surface-clients/transport.ts:72-90`, `src/sdk/client.ts:324-342` — malformed body uses `failureClassFromHttpStatus` (409→refusal, 422→proof_gap); typed reason codes still lost without envelope |
| M-01 | Dual-enforcement test doc-only | **Unchanged** | `test/architecture/dual-enforcement-posture.test.ts` — prose guard only; paired with mutation manifest for structural inventory |
| M-02 | Recovery reason-code path | **Improved** | `failure-class/index.ts:85-86` — recovery uses `proofRef` option in metadata path |
| M-03 | Auth.md gateway throws plain `Error` | **Not re-verified this pass** | Still listed in 04-REVIEW; spot-check before claiming closed |
| M-04 | Install proposal plain `Error` | **Not re-verified this pass** | Still listed in 04-REVIEW |
| M-05 | Unknown errors → `internal` | **Partial** | `failure-class/index.ts:119-123` — 4xx without metadata → `protected_action_refusal`; 5xx → `internal` |

**04-REVIEW explicit deferrals to Phase 05:** mutation manifest (shipped `05-01`), MCP registry proof gap (still open), manifest export mapping (still open), failureClass parity hardening (H-01/H-02 largely addressed).

**Note:** No `04-SECURITY.md` artifact in `.planning/phases/04-service-agent-gating/`; security posture for Phase 04 is in `04-REVIEW.md` + Phase 05 `05-SECURITY.md`.

---

## Tech debt (authority and surfaces — still relevant)

### Boundary manifest vs new CLI handlers

- **Issue:** Several CLI handler files are listed in `manifest-coverage.test.ts:40-57` and covered by expanded `cli.*` roots, but export/subpath drift remains the gating failure — not missing CLI roots.
- **Files:** `src/surfaces/boundary-manifest.ts`, `src/cli/command-manifest.ts`, `test/architecture/surface-boundary-posture.test.ts`
- **Impact:** New commands can ship without export-level discoverability even when manifest roots cover handlers.
- **Fix approach:** Export map + manifest export test green together.

### A2A surfaces — product tests only

- **Issue:** `src/surfaces/a2a-negotiation-support/` and `./surfaces/a2a-negotiation-readback` export exist in `package.json:52-56` and manifest (`manifest-coverage.test.ts:29-32`) but A2A negotiation support folder is **not** in `surfaceIds` / `expectedSurfaceIds` in older concern text — verify `boundary-manifest.ts` for `surfaces.a2a_readback` before extending.
- **Impact:** Weaker architecture posture enforcement than MCP/CLI for negotiation ingress.
- **Fix approach:** Add manifest surface IDs + `surface-boundary-posture` expected IDs for A2A support tree.

### Product completion gates still incomplete by design

- **Issue:** `pack:check` and product-completion projectors expect **blocked/incomplete** for host containment, live paid retry, distribution, dual-enforcement evidence unless inputs prove otherwise.
- **Files:** `src/surfaces/proof-packets/product-completion.ts:185-207` (`dual_enforcement_posture` needs `dualEnforcementPostureTestPassed` + `mutationManifestGatingTestPassed` in input); `scripts/check-product-completion.mjs`
- **Impact:** Blocked readbacks are correct; marketing must not read them as live proof.
- **Fix approach:** Feed gate JSON from passing architecture tests + real distribution readback.

### Per-customer bypass scaffold (D-25 / D-54)

- **Issue:** Scaffold only; blocked unless first-party dogfood customer id present.
- **Files:** `src/surfaces/proof-packets/per-customer-bypass-scaffold/index.ts:1-47`
- **Impact:** No per-customer containment claims for external integrators.
- **Fix approach:** Named dogfood evidence only; never auto-complete product completion.

---

## Security considerations (ongoing)

### Host-generated-code containment — blocked proof surface

- **Risk:** Containment proof does not prove host-wide interception.
- **Files:** `src/surfaces/proof-packets/host-generated-code-containment.ts`, `scripts/check-host-generated-code-containment.mjs`
- **Mitigation:** `--expect-status blocked` in pack checks.
- **Recommendations:** Keep blocked until live host transcript evidence exists.

### Hosted raw reads and scope narrowing

- **Risk:** `hosted-record-scope` may not narrow project/workspace when payload omits those fields.
- **Files:** `src/http/handlers/hosted-record-scope.ts`, `src/http/handlers/internal-record-read.ts`, `src/http/handlers/raw-read-audit.ts`
- **Mitigation:** Fail-closed without audit sink; 404 posture.
- **Recommendations:** Object-specific redacted projections per `object-registry` types.

### SDK repair is not recovery authority

- **Risk:** Misuse of `explainHandshakeError` to justify retry without new contract.
- **Files:** `src/sdk/repair.ts`, `src/protocol/foundation/reason-code-remediation/index.ts`
- **Mitigation:** `authorityCreatedByRepair: false`, `requiresNewContract` from remediations.

### Gateway custody transition_errors map to `internal`

- **Risk:** `gateway_custody_proof_*` codes use `kind: "transition_error"` → `failureClass: "internal"` (`failure-class/index.ts:89-90`) unless `classifiedFailure` set per code (`reason-codes.ts:174-186` — no `classifiedFailure` on those lines).
- **Impact:** MCP/SDK taxonomy may show “internal” for custody mismatches (residual of 04-REVIEW H-02 class).
- **Recommendations:** Add `classifiedFailure: "protected_action_refusal"` or `"proof_gap"` per custody code in reason-code registry.

---

## Fragile areas

### Live x402 paid retry vs local/reference gateway

- **Files:** `src/adapters/x402-payment/wallet-gateway.ts`, `src/surfaces/proof-packets/live-x402/paid-retry.ts`
- **Why fragile:** Sandbox/local posture only; live customer-gateway path not proven.
- **Test coverage:** Wallet gateway unit/architecture tests; live funded retry fixture missing.

### One-use greenlight / storage atomicity

- **Files:** `src/storage/d1/index.ts`, `src/storage/memory/index.ts`, `src/protocol/areas/policy-greenlight/transitions.ts`
- **Why fragile:** OCC/idempotency conflicts corrupt reconstruction if misclassified.

### Product launch gates vs external reality

- **Files:** `src/surfaces/product-launch-gate-resolution.ts`, `docs/internal/decisions.md`
- **Why fragile:** Narrative can outpace `resolved_blocked` distribution and registry evidence.

---

## Test coverage gaps (priority)

| Area | What's missing | Files | Risk | Priority |
|------|----------------|-------|------|----------|
| Integrator HTTP mutation inventory | Routes outside `src/http/handlers` allowlist | `src/http/mutation-route-manifest.ts`, `http-handler-mutation-gating.test.ts` | False sense of full-service gating | High |
| Export/manifest/npm parity | Published tarball export keys | `package.json`, `manifest-coverage.test.ts`, `distribution-provenance.ts` | Consumers cannot import hosted/service-workflow subpaths | High |
| MCP/registry readback | Live registry acceptance | `distribution-provenance.ts`, `product-launch-gate-resolution.ts` | False discoverability claims | High |
| Credential custody taxonomy | `gateway_custody_proof_*` failureClass | `reason-codes.ts`, `failure-class/index.ts` | Wrong retry semantics on custody failures | Medium |
| Malformed SDK HTTP body | Typed codes when envelope parse fails | `src/sdk/client.ts`, `surface-clients/transport.ts` | 04-REVIEW H-04 residual | Medium |
| Hosted raw-read matrix | All `audit_read` types under scope rules | `object-registry/index.ts`, `internal-record-read.ts` | Scope leak at tenant/org | High |
| Runtime host-wide interception | Shell/browser/MCP outside registered families | `src/runtime/ingress/`, `host-generated-code-containment` | Ingress evidence ≠ enforcement | High |

---

## Missing critical features (unchanged intent)

| Feature | Blocks | Key files |
|---------|--------|-----------|
| Customer-gateway live x402 paid retry | Live paid execution claims | `src/surfaces/proof-packets/live-x402/paid-retry.ts`, `wallet-gateway.ts` |
| Provider-grade credential custody | Hosted/live custody marketing | `src/protocol/areas/credential-custody/` |
| Host-wide generated-code containment | Whole-host bypass claims | `host-generated-code-containment.ts` |
| Hosted customer-safe readback/search | Hosted operation | `src/hosted-admission/`, `internal-record-read.ts` |
| Current-surface public distribution | Product completion / registry | `package.json`, `product-launch-gate-resolution.ts` |
| Auth.md + x402 composite execution | Composite marketing | `src/adapters/auth-md-x402-interlock/packet.ts` |

---

## Source markers: TODO / FIXME / proof gap

| Scan | Result |
|------|--------|
| `grep TODO\|FIXME\|HACK\|XXX` in `src/` | **No matches** |
| `proof gap` in `src/` | **Domain vocabulary** (protocol transitions, readbacks, launch gates) — not outstanding engineering TODOs. Examples: `src/protocol/navigation/index.ts:467`, `src/surfaces/product-launch-gate-resolution.ts:127`, `src/surfaces/a2a-negotiation-readback/index.ts:204-226`. |

Do not treat protocol `proof_gap` record types as “missing implementation tickets” without reading the surrounding transition or readback contract.

---

## Dependencies at risk

| Dependency | Risk | Files |
|------------|------|-------|
| Cloudflare D1/KV | D1 is authority store; KV must stay cache-only | `src/storage/d1/index.ts`, `src/storage/kv/index.ts` |
| x402 SDK | Drift vs local/reference claims | `wallet-gateway.ts`, x402 proof packets |
| MCP Registry / npm | External; must not drive policy | `product-launch-gate-resolution.ts`, `distribution-provenance.ts` |

---

## Scaling limits (unchanged)

- **Runtime ingress:** Three registered families in `src/runtime/ingress/registry.ts` — each new family needs registry + tests + bypass probes.
- **Hosted operation:** Admission modules exist; hosted custody/settlement/marketplace not closed (`docs/internal/decisions.md` Hosted Admission Lock).
- **Object registry:** New protocol objects need hosted projection declarations (`src/protocol/areas/object-registry/index.ts`).

---

*Concerns audit: 2026-05-29 @ `aef9478`*
