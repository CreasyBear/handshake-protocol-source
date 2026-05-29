# Phase 04: Service agent gating — Context

**Gathered:** 2026-05-28  
**Status:** Ready for execution (comprehensive replan 2026-05-28)  
**Synthesis:** Eight advisor runs (discuss) + six advisor runs (plan review) + user mandate: **full product, not MVP**

<domain>
## Phase Boundary

**Deliver:** A **complete agent-first operator product** so **any service** can gate agents on consequential endpoints — doctrine, runnable service-side spine, executable atomic install, multi-surface failure taxonomy, Tier-1 integrator platform, HTTP adapter platform, custody runbooks, and **structural bypass enforcement** — without weakening the protocol kernel. **x402 remains the only runnable clearance wedge**; service-side runnable artifacts are admission, bootstrap, and dual-enforcement demos, not second payment/product completion paths.

**Not in scope for this phase:** Kernel transition semantic changes; faking blocked live-x402/host-containment/registry gates green; schema export renames; external PEP as sole enforcement.

**Product chain (agent lane):**

```text
Vague intent
→ Scoped bounds (standing envelope + optional delegated mandate per instance)
→ Protected proposal (compile → exact work order)
→ Clearance (policy → one-use greenlight → gateway check)
→ Outcome (receipt / refusal / proof gap)
```

**Enforcement chain (locked):**

```text
Hosted/API admission (who may talk to the kernel)
+
Gateway check on every mutation (whether this exact greenlight authorizes this exact change)
```

**Explicit rule:** Ingress, middleware, or API auth **alone** is not Handshake unless **every consequential route** is adapter-wrapped and gateway-checked. Document and test that rule; do not imply admission equals protection.

**In scope:**

- Product vocabulary and dual-lane docs mapping agent story ↔ protocol spine (schema names unchanged).
- Progressive service onboarding: catalog triplet per endpoint family + per-instance bounds/mandate.
- Tier-1 integrator golden path (docs, tests, optional non-authority recipe sequencer).
- Hybrid adapter strategy for arbitrary HTTP + existing family adapters.
- Public failure taxonomy (auth vs execution-control) on service APIs.
- Custody split productization (service vs host operator).
- Structural bypass enforcement (architecture tests + service scaffold); not docs-only.

**Out of scope:**

- Protocol kernel transition semantic changes (same constraint as Phase 03).
- Turning blocked proof gates green (live x402 paid retry, host containment, registry).
- Second **runnable** non-payment golden path unless that domain’s admission packet is already green.
- Schema renames of `OperatingEnvelope`, `DelegatedAuthorityRef`, etc.
- External PEP (Envoy/OPA sidecar) as **substitute** for adapter-side gateway enforcement.
- Layer 5 clearing network, hosted marketplace trust, cross-org federation.
- Per-domain siloed golden paths that fragment the agent-first spine.

</domain>

<decisions>
## Implementation Decisions

### Locked before advisor research (user)

- **D-00 — Dual enforcement:** Service operators need **admission** (caller identity / scope before kernel transitions) **and** **gateway check** (before mutation). Ingress-only posture is **advisory**, not Handshake.
- **D-00b — Wedge vs platform:** `x402_payment.exact` remains the **proof wedge**; phase 04 optimizes **any-service agent gating**, not payment-only product.

### Vision → protocol mapping (advisor + canon)

- **D-01 — Standing bounds:** `OperatingEnvelope` = class-level attempt bounds for principal+agent (not permission, not vague intent).
- **D-02 — Delegated mandate:** `DelegatedAuthorityRef` = episodic principal→agent mandate evidence for an instance (e.g. delegated spend); status transitions + isolation; **not** a greenlight or bearer pass.
- **D-03 — Compile bridge:** `IntentCompilationRecord` = vague intent/runtime evidence → one `CandidateAction` (uncertainty recorded, no authority).
- **D-04 — Work order:** `ActionContract` = exact proposed commitment; only this shape enters policy and gateway binding.
- **D-05 — Product vocabulary:** Teach **Standing Bounds → Delegated Mandate (when required) → Compile → Work Order → Clearance → Outcome** in agent-facing docs; keep schema-native names in protocol/API (attenuation-chain dual vocabulary, no export renames in this phase).
- **D-06 — Dual-lane docs:** Extend `service-workflow-story.md` pattern: agent lane parallel to unchanged canonical state path; every projection keeps explicit non-authority flags (`createsAuthority: false`, `freshActionContractRequired: true`).

### Service onboarding order

- **D-07 — Progressive two-tier (default):** Service registers **catalog triplet** per endpoint family (`ToolCapability`, `ActionType`, `GatewayRegistryEntry`) first so gateway binding and bypass posture are real; **per-instance** `OperatingEnvelope` + policy pack and/or `DelegatedAuthorityRef` at delegation/admission time.
- **D-08 — Atomic install per family:** Control-plane `InstallProposal` commits catalog + gateway + baseline policy bundle per family **or refuses** — no orphan catalog without gateway entry.
- **D-09 — Full day-one envelope:** Reserved for **fixed-tenant / regulated** services only — not the default multi-agent hosted path.

### Adapter extensibility

- **D-10 — Hybrid layered model:** Shared **HTTP transport profile** (method, path template, allowlisted headers, raw body digest) for arbitrary REST-like endpoints; **family adapters** (x402, package install, preview deploy, repo write, auth.md) where semantic canonicalization and bypass probes matter.
- **D-11 — auth.md as profile prototype:** Treat `auth_md_protected_api_call.exact` as the pattern for HTTP-profile canonicalization, not as proof that one generic adapter covers all consequence shapes.
- **D-12 — External PEP optional:** Envoy/Kong/OPA may sit **in front** for deployment; Handshake still requires adapter-side observed-parameter re-check against exact greenlight — PEP is glue, not enforcement substitute.

### Operator golden path & kernel UX

- **D-13 — One runnable spine:** Single agent-first recipe: register catalog → agent proposes → policy → gateway → readback; **x402** is the only **runnable** reference implementation in this phase.
- **D-14 — Proof-gap stubs:** Add **non-runnable** recipe stubs for auth.md and package install (transition map + schema + explicit proof-gap / admission boundaries) if integrators need transfer confidence — not second runnable paths.
- **D-15 — Tier-1 kernel UX:** Document and test a **Tier-1** transition set for integrators (catalog, compile/propose, evaluatePolicy, gatewayCheck, readback); full `protocol/navigation` matrix remains reference for extenders.
- **D-16 — Optional recipe sequencer:** SDK/CLI helper that calls transitions in order is allowed only as **explicitly non-authority**, with invariant tests: no greenlight reuse, gateway required, fresh contract on retry, no bundled “execute” API.

### Public failure surface

- **D-17 — Extend `TransitionErrorEnvelope`:** Add `failureClass` / `phase` separating `auth`, `hosted_admission`, `protected_action_refusal`, `proof_gap`, `replay_refusal`, `stale_admission`.
- **D-18 — HTTP status discipline:** **401/403** only for credential/identity; **409** refusals/replay/stale binding; **422** proof gaps; never map clearance failure to generic forbidden (OAuth BCP anti-pattern).
- **D-19 — RFC 9457 compatibility:** Problem Details `type` URIs + `reason-code-remediation` extensions for public HTTP consumers.
- **D-20 — Outcome-as-success:** **200 + claim status** only on dedicated admission/readback routes — not on mutation attempts.

### Custody split (service vs host)

- **D-21 — Responsibility matrix:** Extend production acceptance / operator docs with **configured-by** columns: service operator (gateway registry, gateway credential, mutation enforcement) vs host operator (trusted binding digests, MCP/runtime proposal wiring).
- **D-22 — Bilateral runbooks:** Paired `service-operator` and `host-operator` setup order (registry before host attestation; stale digests fail closed).
- **D-23 — Doctor as attestation:** Host `doctor` / readiness output framed as **attestation evidence** for binding digests — not a parallel identity system (SPIFFE analogy only in prose).

### Bypass proof

- **D-24 — Not documentation-only:** “Every consequential route adapter-wrapped” requires **architecture tests** + **conformance-gated service scaffold** — not prose alone.
- **D-25 — Launch gates deferred:** Product-completion-style per-service bypass proof packets (like x402/MCP activation) ship when route inventory and host evidence exist — not claimed in phase 04 for all services.

### Claude's Discretion

- Exact Tier-1 transition ID list and where it lives (`protocol/navigation` tags vs new doc).
- Whether proof-gap stubs ship in phase 04 or immediately after plan 01.
- Recipe sequencer module placement (`sdk/` vs `cli/quickstart/`).
- How many HTTP profile canonicalization rules are codified vs documented first.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Protocol & invariants
- `AGENTS.md` — Doctrine; vague intent vs contract; gateway enforcement; generated-code bypass.
- `docs/internal/protocol-definition.md` — Authority rule, required separation, canonical state path.
- `docs/internal/protocol-kernel-architecture.md` — Catalog objects, layers, transition map.
- `docs/internal/protocol-layman.md` — Plain-language spine for operator docs.
- `docs/internal/protocol-notes.md` — `delegated-authority`, catalog-envelope, compile/propose notes.
- `docs/internal/decisions.md` — DelegatedAuthorityRef, role-scoped clients, production acceptance matrix, live x402 boundaries.

### Agent-first product story
- `docs/internal/service-workflow-story.md` — Passport → Admission → Handle → Clearance; non-authority IDs.
- `docs/internal/ecosystem-strategy.md` — Layer 0–5 model; do not collapse layers.
- `docs/internal/host-golden-paths-and-trace-guidance.md` — Host golden path (x402 reference).

### Code spine (implementation anchors)
- `src/protocol/kernel.ts` — HandshakeKernel façade.
- `src/protocol/navigation/index.ts` — Full transition catalog.
- `src/protocol/foundation/host-trusted-binding.ts` — Host trusted binding (Phase 03).
- `src/http/admission/index.ts` — Transition admission.
- `src/http/routes/transition-route-registry.ts` — HTTP parity with kernel.
- `src/adapters/` — Family gateway adapters.
- `src/surfaces/service-workflow-admission/` — Admission/handle projections.
- `src/protocol/foundation/reason-code-remediation/` — Remediation on failures.
- `src/http/errors/transition-error-envelope.ts` — Error envelope extension point.

### Prior phase (do not re-litigate)
- `.planning/phases/03-close-enforcement-gaps/03-CONTEXT.md` — Host trusted binding parity; kernel frozen.
- `.planning/phases/03-close-enforcement-gaps/03-VERIFICATION.md` — Phase 03 complete.

### Codebase map (scratch)
- `.planning/codebase/ARCHITECTURE.md` — Layer diagram, Phase 03 spine.
- `.planning/codebase/CONCERNS.md` — Open launch blockers vs recently closed binding parity.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `HandshakeKernel` + `protocol/navigation` — Tier-1 tagging and parity tests without new transitions.
- `InstallClient` / install-setup transitions — Atomic per-family catalog bootstrap.
- `service-workflow-admission` surfaces — Dual-lane agent story already modeled.
- `host-trusted-binding` + MCP/adapter proposal paths — Custody split for host vs service.
- `auth_md_protected_api_call` adapter — HTTP profile template for hybrid extensibility.
- `transition-error-envelope` + `reason-code-remediation` — Public failure surface extension.
- x402 + architecture bypass/activation tests — Reference runnable path and bypass patterns.

### Established Patterns
- Catalog presence is not permission; fresh action contract per consequential event.
- Role-scoped SDK clients (`PolicyClient`, `GatewayClient`, etc.) — custody boundaries.
- Proof packets and `pack:check` — Honest blocked gates; do not fake green in phase 04.
- Architecture tests for boundaries (`workflow-admission-boundary`, `claim-boundary`, host-trusted parity).

### Integration Points
- HTTP transition routes + hosted admission for service operators.
- MCP/runtime proposal for agent hosts (binding digests, not gateway ownership).
- Adapter `run*Gateway` functions as mutation enforcement boundary.
- CLI `doctor`, `simulate`, `quickstart` for recipe sequencer and attestation UX.

</code_context>

<specifics>
## Specific Ideas

- Build for **agents first**: principal delegates to agent within **scoped bounds** for a **particular instance**; policy decides on the **exact** action; service gateway enforces before mutation.
- User concern: kernel feels **rigid** — acceptable; usability via **vocabulary, tiers, recipes, and docs** — not fewer transitions or authority shortcuts.
- Comparative patterns cited by advisors: OAuth delegation/attenuation, Macaroon caveats, Cedar/OPA permit query, Stripe Connect matrix, Envoy ext_authz, MCP gateway CI, SLSA/in-toto conformance — adopt **mechanisms**, not bearer-token or online-only authz models.

</specifics>

<deferred>
## Deferred Ideas

- **Second runnable golden path** (auth.md or package install) in same phase — until admission packet + focused gates green (`decisions.md` proof contexts).
- **Schema export aliases** (`StandingBounds`, `DelegatedMandate`) — product docs only in phase 04.
- **Generic HTTP-only platform claim** without family adapters for wallet/repo/deploy/install — insufficient bypass posture.
- **External PEP as sole gate** — evidence theatre without adapter re-check.
- **Per-domain operator doc silos** — fragments agent-first spine.
- **Layer 5 clearing / cross-org verification** — `ecosystem-strategy.md` Layer 5.
- **Full kernel transition reduction** — breaks reconstruction and parity tests.
- **Hosted operation go-ahead** — separate hosted workspace per `protocol-notes.md` hosted admission lock.

</deferred>

---

*Phase: 04-service-agent-gating*  
*Context gathered: 2026-05-28*
