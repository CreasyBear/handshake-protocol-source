# Phase 04 Security Audit

**Auditor:** gsd-security-auditor · **Date:** 2026-05-29 · **Range:** 1e801b7..979b99c

## Verdict

**PASS-WITH-FINDINGS** — Wedge-path enforcement (x402 wallet gateway, kernel HTTP read-only posture, bootstrap refusal boundaries, failureClass taxonomy, custody proof checks) is structurally present and tested. No declared `mitigate` threat in phase plans lacks code evidence. The highest-confidence gap is **partial structural bypass coverage for arbitrary integrator services** (honestly deferred to Phase 05), not a silent regression in the runnable x402 spine.

| Severity | Count |
|----------|------:|
| HIGH | 0 |
| MEDIUM | 1 |
| LOW | 2 |
| Watch (≤6/10) | 2 |

**Threat register:** 33/33 `mitigate` CLOSED · 2/2 `accept` CLOSED · 2/2 `defer` documented

---

## Findings

### [MEDIUM] P04-SEC-01. Integrator mutation routes lack inventory-level gateway binding — `test/architecture/http-handler-mutation-gating.test.ts:6-8`

- Threat (STRIDE): **Elevation of privilege** — generated agent code or a sibling HTTP handler can mutate outside `run*Gateway` if an integrator adds unlisted consequential routes.
- Attack scenario: A service operator follows Phase 04 docs, registers catalog via bootstrap, and ships a custom Express/Fastify route that calls a wallet signer directly. Handshake kernel HTTP remains read-only, but the operator’s **own** service process is not inventory-gated in this phase.
- Evidence (code): D-24 enforcement is limited to first-party handler allowlist + three example runners; manifest deferred explicitly:

```6:8:test/architecture/http-handler-mutation-gating.test.ts
 * Phase 04 D-24 enforcement: handler walk only.
 * service-mutation-route-manifest deferred to maintainer lane (phase 05).
```

- Mitigation status: **partial** — `T-04-11-01` CLOSED for repo kernel; `T-04-11-02` / `T-04-11-03` deferred.
- Recommendation: Phase 05 must land `service-mutation-route-manifest` + CI inventory before marketing “any service” as structurally gated.

### [LOW] P04-SEC-02. Default bootstrap seeds `fixture_gateway_held` catalog posture — `src/cli/service-operator/bootstrap.ts:77-79`

- Threat (STRIDE): **Spoofing / elevation confusion** — operators may treat bootstrap output as production gateway-held enforcement.
- Attack scenario: Agent runs `handshake service bootstrap` with defaults; catalog records `enforcementMode: reference_fixture` and `credentialCustodyStatus: fixture_gateway_held` while CLI prints success. Operator skips live custody packet and readiness registration; later runtime facade refuses mutation (fail-closed), but catalog posture overstates production readiness.
- Evidence (code):

```77:79:src/cli/service-operator/bootstrap.ts
      signerCustodyStatus: "fixture_gateway_held",
      signerRef: "secretref:service-bootstrap-fixture-signer",
```

```388:390:src/adapters/x402-payment/install-proposal.ts
      credentialCustodyStatus: gateway.signerCustodyStatus,
      enforcementMode:
        gateway.signerCustodyStatus === "fixture_gateway_held" ? "reference_fixture" : "customer_gateway_adapter",
```

- Mitigation status: **partial** — runtime facade + CLI readiness refuse unverified `customer_gateway_evidence` (`src/adapters/x402-payment/protected-tool-facade/index.ts:290-308`); bootstrap CLI warnings state no mutation (`bootstrap.ts:207-210`).
- Recommendation: Emit explicit `proofGapRefs` or `enforcementMode` in bootstrap CLI result so operators cannot confuse fixture catalog with live gateway-held posture.

### [LOW] P04-SEC-03. Dual-enforcement structural proof is doc-grep for arbitrary services — `test/architecture/dual-enforcement-posture.test.ts:20-57`

- Threat (STRIDE): **Repudiation** — doctrine tests grep markdown; they do not exercise an integrator’s unwrapped route at runtime.
- Attack scenario: Docs claim dual enforcement; integrator code bypasses adapters; architecture tests still pass.
- Evidence (code): Test only scans documentation files for gateway/admission language patterns.
- Mitigation status: **partial** (honest deferral per `04-VERIFICATION.md` G0/D-24 row).
- Recommendation: Pair doc-grep with Phase 05 manifest gate; keep doc test as necessary but not sufficient.

### Watch items (confidence ≤6/10)

1. **Agent-supplied `signerRef` in bootstrap `installInput`** — Zod-validated ref strings are stored in gateway registry (`mutationCredentialHolderRef`) but bootstrap result omits raw credential material (`credentialMaterialIncluded: false` in CLI envelope). Risk is misconfiguration, not direct secret exfil via failureClass payloads; no ≥7/10 exploit path found without subsequent unverified custody claims (which facade rejects).
2. **`fixture_gateway_held` idempotent re-bootstrap** — Second bootstrap run does not duplicate registry entries (`service-operator-bootstrap.test.ts:92-101`); no ambient authority amplification observed.

---

## Threat-model mitigation verification

Claims sourced from per-plan `<threat_model>` blocks in `04-01-PLAN.md` … `04-12-PLAN.md` and D-decisions in `04-CONTEXT.md`.

| Claimed mitigation (plan threat ID) | Exists in code? | Evidence |
|-------------------------------------|-----------------|----------|
| Non-authority dual-lane docs (T-04-01-01, T-04-01-02) | Yes | `test/architecture/claim-boundary.test.ts`, `test/architecture/dual-enforcement-posture.test.ts` |
| Forbid middleware theatre claims (T-04-01-03) | Yes | `claim-boundary.test.ts` forbiddenPatterns |
| No new npm deps (T-04-01-SC, T-04-02-SC) | Yes | `git diff 1e801b7..HEAD -- package.json` — scripts only |
| Golden path x402-only runnable + authorityBoundary (T-04-02-01, T-04-02-02) | Yes | `docs/internal/service-operator-golden-path.md`; `examples/service-operator-golden-path/run.ts` |
| Bootstrap x402-only + non-authority flags (T-04-03-01) | Yes | `bootstrap.ts:141-147`, `193-213`; `service-operator-bootstrap.test.ts:70-81` |
| Atomic install / orphan catalog refusal (T-04-03-02, T-04-08-03) | Yes | `http-profile-orphan-catalog.test.ts:35-37`; `install-setup/transitions.ts:190-193` |
| Refuse non-x402 families (T-04-03-03) | Yes | `bootstrap.ts:141-147` |
| Agent-spine non-authority sequencer (T-04-04-01, T-04-04-02) | Yes | `cli-agent-spine-sequencer.test.ts:11-36` |
| Doctor attestation nonClaims (T-04-04-03, T-04-10-01) | Yes | `src/cli/host/doctor.ts`; `custody-matrix-parity.test.ts:28-33` |
| failureClass HTTP status discipline (T-04-05-01, T-04-05-02) | Yes | `transition-error-envelope.ts:102-124`; `transition-error-failure-class.test.ts` |
| Readback-only 200+claim (T-04-05-03) | Yes | `http.test.ts` readback cases; OpenAPI failureClass notes |
| MCP/SDK failureClass parity (T-04-06-01, T-04-06-03) | Yes | `mcp-failure-class-parity.test.ts`; `role-clients-failure-class.test.ts` |
| SDK repair requires fresh contract (T-04-06-02) | Yes | `src/sdk/repair.ts:51-63` |
| Integrator parity / no bundled execute (T-04-07-01, T-04-07-02) | Yes | `integrator-parity.test.ts`; `role-clients-walkthrough.test.ts` |
| HTTP profile definition_only skeleton (T-04-08-01) | Yes | `generic-gateway-skeleton.ts:5-22` |
| Dynamic construction refusal (T-04-08-02) | Yes | `http-profile-canonicalization.test.ts:25-31` |
| Proof-gap honesty / no stub runnable paths (T-04-09-01) | Yes | `proof-gap-honesty.test.ts` |
| Custody matrix configuredBy (T-04-10-02, T-04-10-03) | Yes | `custody-matrix-parity.test.ts`; `docs/internal/decisions.md` |
| Handler mutation gating (T-04-11-01) | Yes | `http-handler-mutation-gating.test.ts:48-79` |
| Route manifest inventory (T-04-11-02) | **Deferred** | Documented Phase 05; no `service-mutation-route-manifest` module |
| Product-completion inventory slice (T-04-11-03) | **Deferred** | `maintainer-product-completion-contract.test.ts` |
| Phase gate tier exits (T-04-12-01) | Yes | `scripts/check-service-agent-gating-phase.mjs:61-63` |
| Integration non-authority (T-04-12-02) | Yes | `service-operator-golden-path.test.ts` |
| VERIFICATION honest gaps (T-04-12-03) | Yes | `04-VERIFICATION.md` partial rows |

### User-requested control areas (04-CONTEXT invariants)

| Control area | Status | Evidence |
|--------------|--------|----------|
| Ambient authority / greenlight reuse | **Enforced (wedge)** | `x402-wallet-gateway.test.ts:224-253` (`already_consumed`, single signature); `recovery/schemas.ts:70` `mayReuseGreenlight: false` |
| Gateway bypass (kernel + examples) | **Enforced (partial)** | Read-only handler allowlist; `runX402WalletGateway` gates before sign (`wallet-gateway.ts:201-213`); example runners require `run*Gateway` |
| Credential / secret custody | **Enforced** | `agent_exposed` install refused (`install-proposal.ts:419-420`, `service-operator-bootstrap.test.ts:37-50`); customer custody claims require verification (`protected-tool-facade/index.ts:295-307`); CLI envelope `credentialMaterialIncluded: false` |
| Trusted-binding integrity | **Enforced** | Tampered readiness fails doctor (`cli-x402-install-probes.test.ts:432-474`); MCP refuses missing bindings before runtime (`mcp-x402-proposal.test.ts:161-178`) |
| Replay / idempotency | **Enforced** | Changed params refused pre-sign (`x402-wallet-gateway.test.ts:199-221`); replay maps to `replay_refusal` (`failure-class/index.ts:118-119`) |
| Supply chain / CI | **Enforced** | No new dependencies; CI uses `npm run check:repo` without publish (`naming-posture.test.ts:161-167`) |
| Injection into privileged ops | **Bounded** | Bootstrap/control-plane inputs Zod-parsed (`ServiceBootstrapInputSchema`); MCP oversized fields refused pre-runtime; HTTP profile rejects dynamic construction |
| Proof-gap honesty | **Enforced** | Proof gaps recorded in adapter outcomes (`payment_signature_proof_gap`); generic HTTP skeleton returns proof gap code; architecture forbids fake runnable stubs |

---

## Supply-chain / CI posture

| Check | Status |
|-------|--------|
| New `package.json` dependencies in diff | **PASS** — none added |
| Phase scripts only (`check:service-agent-gating-phase*`) | **PASS** |
| CI bound to `npm run check:repo` | **PASS** — `naming-posture.test.ts:165` |
| CI excludes `npm publish` / trusted-publish | **PASS** — `naming-posture.test.ts:166-167` |
| GitHub Actions pinned to commit SHAs | **PASS** — `naming-posture.test.ts:170-179` |
| Publish token surfaces untouched by Phase 04 diff | **PASS** — no `.github/workflows` changes in range |

---

## Deferred / accepted risk (with rationale)

| ID | Disposition | Rationale |
|----|-------------|-----------|
| T-04-11-02 | **defer** | Full mutation route manifest requires integrator inventory not available in Phase 04 scope (D-25). Bypass risk acknowledged in `04-VERIFICATION.md` and P04-SEC-01. |
| T-04-11-03 | **defer** | `check-product-completion` inventory slice depends on manifest module. |
| T-04-01-SC / T-04-02-SC | **accept** | No new npm packages; supply-chain delta limited to scripts and tests. |
| MCP Registry discoverability | **proof gap (honest)** | Documented in AGENTS.md; not faked green (`proof-gap-honesty.test.ts`). |

---

## Auditor notes

- **ASVS level:** 2 (protocol control plane; no payment PAN/storage in scope).
- **block_on policy:** `open` mitigations → **0 open**; deferred threats documented.
- **Highest-severity finding:** P04-SEC-01 (integrator route inventory gap) — advisory for Phase 04 operator tier, blocking for “any arbitrary service structurally gated” product claim until Phase 05.
