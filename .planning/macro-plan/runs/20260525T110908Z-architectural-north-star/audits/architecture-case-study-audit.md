## Audit Scope

Assigned focus: slices.

This audit covers the architectural north star for the correction run: one protocol authority spine with non-authority projection surfaces. It does not select the macro move, synthesize the final plan, or promote final status. The question under audit is whether current repo language and source shape support projection-over-one-authority-spine strongly enough to guide the macro plan.

Report path: `.planning/macro-plan/runs/20260525T110908Z-architectural-north-star/audits/architecture-case-study-audit.md`.

## Source Boundary

Repo-local evidence is from the current checkout only. `.planning/` was treated as scratch except for this assigned output path. Current git state observed: `main...origin/main [ahead 8]`.

Official/primary case-study sources used:

- Stripe PaymentIntents lifecycle and idempotency: `https://docs.stripe.com/payments/payment-intents`, `https://docs.stripe.com/api/idempotent_requests`.
- Kubernetes admission and OPA Gatekeeper: `https://kubernetes.io/docs/reference/access-authn-authz/validating-admission-policy/`, `https://open-policy-agent.github.io/gatekeeper/website/docs/customize-admission/`.
- HashiCorp Vault leases: `https://developer.hashicorp.com/vault/docs/concepts/lease`.
- GitHub deployment environments: `https://docs.github.com/en/actions/reference/workflows-and-actions/deployments-and-environments`.
- AWS IAM evaluation: `https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_evaluation-logic_policy-eval-denyallow.html`.
- SLSA, in-toto, Sigstore/Rekor evidence: `https://slsa.dev/spec/v1.2-rc2/build-provenance`, `https://in-toto.io/docs/getting-started/`, `https://docs.sigstore.dev/logging/overview/`.
- Vercel and Cloudflare scope clarity: `https://vercel.com/docs/environment-variables`, `https://developers.cloudflare.com/fundamentals/api/reference/permissions/`.

Browsing was available. No secondary sources were used for external facts.

## Files Read

- `AGENTS.md`
- `README.md`
- `STRUCTURE.md`
- `package.json`
- `docs/internal/decisions.md`
- `docs/internal/protocol-definition.md`
- `docs/internal/protocol-kernel-architecture.md`
- `docs/internal/protocol-notes.md`
- `docs/internal/service-workflow-story.md`
- `src/protocol/LANE.md`
- `src/protocol/kernel.ts`
- `src/protocol/areas/policy-greenlight/transitions.ts`
- `src/protocol/areas/policy-greenlight/policy-record/index.ts`
- `src/protocol/areas/gateway-gate/transitions.ts`
- `src/protocol/areas/gateway-gate/artifacts.ts`
- `src/protocol/areas/gateway-gate/replay-refusal/index.ts`
- `src/protocol/areas/idempotency-ledger/entries.ts`
- `src/http/routes/transition-route-registry.ts`
- `src/http/routes/transition-invokers.ts`
- `src/sdk/LANE.md`
- `src/sdk/surface-clients/index.ts`
- `src/sdk/surface-clients/policy-client.ts`
- `src/sdk/surface-clients/gateway-client.ts`
- `src/surfaces/LANE.md`
- `src/surfaces/boundary-manifest.ts`
- `src/surfaces/outcome.ts`
- `src/surfaces/service-workflow-admission/index.ts`
- `test/architecture/surface-boundary-posture.test.ts`
- `test/architecture/claim-boundary.test.ts`
- `test/architecture/import-posture.test.ts`
- `test/architecture/package-surface.test.ts`
- `test/sdk/role-clients.test.ts`

Searches also covered `src`, `test`, `docs/internal`, and the assigned run directory.

## Invariant At Stake

Every projection must remain a read/write view over one authority spine. A product-facing SDK, CLI, MCP tool, service-workflow handle, certificate view, launch gate, or hosted surface must not become a second place where policy, greenlight, gateway acceptance, credential custody, execution proof, or terminal trust is invented.

If a projection can mint or imply authority independently of the protocol kernel state path and gateway check, it is advisory theatre with a nicer API.

## Pass Conditions

### What the case studies imply as mechanisms, not analogies

- Stripe PaymentIntents imply a durable lifecycle object plus idempotency binding. A retry cannot silently become a second purchase; idempotency keys bind to parameters and parameter drift is an error. Handshake equivalent: `ActionContract` plus idempotency ledger must bind protected-surface, resource, key, and parameter digest before greenlight reuse or duplicate authority can happen.
- Kubernetes admission and Gatekeeper imply a chokepoint, not a dashboard. Every matching policy/binding/parameter combination must pass before admission. Gatekeeper's default fail-open posture is a warning: any macro slice that cannot prove fail-closed behavior for protected mutation is not an enforcement slice.
- Vault implies custody is lifecycle state: lease id, TTL, renewability, revocation, and audit trail. A `GatewayCredentialRef` without external custody, expiry, revocation, and rotation evidence is local/reference custody, not provider or customer custody.
- GitHub deployment environments imply protected material is withheld until the gate passes. Environment secrets are unavailable to a job until protection rules pass. Handshake equivalent: signer/payment material must stay behind `VerifiedGatewayCheck`, not behind a review screen or SDK convenience method.
- AWS IAM implies default deny plus explicit deny dominance. Handshake equivalent: refusal, isolation, stale custody, policy drift, replay, and proof-gap blockers must dominate projection convenience and future greenlights.
- SLSA, in-toto, and Sigstore imply evidence is useful only when it is digest-bound to a subject, builder/control-plane boundary, ordered layout/links, and append-only verification posture. Handshake equivalent: receipt/proof projections must carry record refs, digests, stream events, audit-chain posture, and proof gaps; a certificate is terminal evidence, not permission.
- Vercel and Cloudflare imply scope names must be operationally concrete: team/project/environment; zone/account/user permission groups. Handshake equivalent: every projection must name caller role, custody role, action family, gateway holder, protected surface, and non-claims. Distribution scope is not authority.

Repo pass evidence:

- The protocol definition already states one state path and authority rule: `docs/internal/protocol-definition.md:48-70`, `docs/internal/protocol-definition.md:88-104`.
- `HandshakeKernel` centralizes transition entrypoints over protocol areas rather than letting SDK/MCP/CLI own behavior: `src/protocol/kernel.ts:100-245`.
- Policy evaluation derives isolation, protected-path posture, idempotency, credential binding, delegated authority, and sequence state before decision/greenlight: `src/protocol/areas/policy-greenlight/transitions.ts:125-162`, `src/protocol/areas/policy-greenlight/transitions.ts:188-237`.
- Gateway check rereads contract, greenlight, policy decision, observed parameter digest, isolation, posture, custody bindings, sequence dependencies, and idempotency before mutation: `src/protocol/areas/gateway-gate/transitions.ts:87-103`, `src/protocol/areas/gateway-gate/transitions.ts:128-190`.
- Receipts distinguish gateway decision, greenlight consumption, mutation attempt, downstream status, proof gaps, and audit chain: `src/protocol/areas/gateway-gate/artifacts.ts:301-343`.
- Service workflow admission is explicitly non-authority and requires a fresh action contract: `src/surfaces/service-workflow-admission/index.ts:21-35`, `src/surfaces/service-workflow-admission/index.ts:95-111`.

## Failures

### Repo conflicts with projection-over-spine architecture

1. The repo still frames the boundary as product/protocol vocabulary instead of one authority spine with projections.

   Evidence: `STRUCTURE.md:7-13`, `docs/internal/decisions.md:42-48`, `docs/internal/protocol-notes.md:13-40`, `docs/internal/protocol-kernel-architecture.md:35-40`, and `README.md:15-20`.

   The content usually says the right thing, but the architecture label is wrong for the target. The macro plan should not preserve a two-lane mental model where product surfaces and protocol are peers. Projections are subordinate views over the one authority spine.

2. `sdk.policy` is modeled as an explicit authority surface.

   Evidence: `src/surfaces/boundary-manifest.ts:296-365` marks `sdk.policy` with `authorityPosture: "policy_authority"` and allows `policy_decision_write`. `test/architecture/surface-boundary-posture.test.ts:51-110` codifies `authoritySurfaces: ["sdk.policy"]` and asserts it is "policy authority". `src/sdk/LANE.md:110-115` calls `PolicyClient` the narrow policy-authority surface.

   This is the sharpest conflict. The implementation of `PolicyClient` is only a transport call to `/v0.2/policy-decisions` (`src/sdk/surface-clients/policy-client.ts:24-33`), and the HTTP invoker delegates to `kernel.evaluatePolicy` (`src/http/routes/transition-invokers.ts:49-53`). That is good source shape. The naming and tests are bad architecture: they teach that a projection surface owns authority. It should be modeled as a control-plane projection over a kernel transition, not as an authority surface.

3. Surface route-family manifests are parallel authority maps, not visibly derived from the transition registry.

   Evidence: `src/surfaces/boundary-manifest.ts:90-105` defines per-surface allowed/forbidden route families; `src/http/routes/transition-route-registry.ts:80-120` and `src/http/routes/transition-route-registry.ts:251-300` define the actual transition routes and caller roles; `test/architecture/surface-boundary-posture.test.ts:74-123` checks the manifest internally but does not prove every allowed surface route is a projection over a specific kernel transition route.

   Mechanism risk: a future surface can become "allowed" in the manifest without proving the route maps to the kernel spine, caller role, scope resolver, and transition invoker.

4. Gateway projection language is better than policy projection language, but still needs a macro gate.

   Evidence: `src/surfaces/boundary-manifest.ts:430-483` marks `sdk.gateway` as `transport_only` while allowing `gateway_check_write`; `src/sdk/surface-clients/gateway-client.ts:40-75` posts to gateway-custody routes; the actual route delegates to the kernel (`src/http/routes/transition-route-registry.ts:292-300`, `src/http/routes/transition-invokers.ts:49-53`).

   This is acceptable only if the macro plan keeps saying "gateway custody projection over the kernel gateway-check transition." If it drifts into "SDK gateway authority," the generated code escaped the contract boundary.

5. Current docs contain correct non-claims, but they are scattered enough that projection-over-spine is not yet the obvious governing test.

   Evidence: `README.md:129-146`, `docs/internal/decisions.md:173-230`, `docs/internal/decisions.md:232-256`, and `docs/internal/protocol-notes.md:367-386` all carry cut lines. This is useful, but the macro plan needs a single gate that fails any slice whose projection wording exceeds the kernel/gateway evidence.

## Proof Gaps

- No current architecture test proves that every product projection route family is derived from `transitionRouteDefinitions` and `transitionInvokers`.
- No current architecture test forbids the concept of an "authority surface"; one test requires it for `sdk.policy`.
- No current architecture test enforces the target vocabulary: authority spine plus projection surfaces.
- Provider/customer gateway custody remains a proof gap beyond local/reference proof, already acknowledged in `docs/internal/decisions.md:196-205` and `docs/internal/decisions.md:340-343`.
- Hosted operation remains a proof gap until there is deployment boundary, custody, migration, secret-management, and receipt evidence, as acknowledged in `docs/internal/decisions.md:436-452`.
- External audit-log or transparency-log guarantees are not present. Local append-only protocol records and stream/audit-chain digests are not Sigstore/Rekor-style public transparency.

## Required Changes

### Required macro-plan slices/gates

P0 slice: vocabulary correction.

- Replace boundary language that treats "product" and "protocol" as peer lanes with "authority spine" and "projection surfaces".
- Gate: no positive architecture section may describe a product surface as creating authority. It may only expose, request, render, or transport spine-backed records.

P0 slice: remove authority-surface modeling.

- Recast `sdk.policy` from `policy_authority` to a control-plane projection over `kernel.evaluatePolicy`.
- Gate: `test/architecture/surface-boundary-posture.test.ts` must have no `authoritySurfaces` list. It should assert zero projection surfaces own authority, while allowing narrowly scoped transition projections to call authority-bearing routes only through the kernel route registry.

P0 slice: route/projection derivation gate.

- Tie every surface route family to `transitionRouteDefinitions`, caller role, scope resolver, and `transitionInvokers`.
- Gate: adding an allowed projection route without a kernel transition mapping fails architecture tests.

P0 slice: chokepoint and bypass gate for every admitted action family.

- Each action family must name the generated execution shape, exact protected path, final gateway enforcement point, raw/sibling bypass posture, failure-closed behavior, and proof-gap output.
- Gate: if mutation can occur without the gateway checking the exact one-use greenlight, stop the slice. This is advisory, not Handshake.

P0 slice: custody lease/revocation gate.

- Before any customer/provider custody claim, require evidence for credential holder, gateway holder, TTL/expiry, revocation, rotation, isolation, and post-gate credential-resolution evidence.
- Gate: local fixture custody cannot be promoted to provider/customer custody.

P1 slice: evidence/provenance projection gate.

- Every projection outcome must carry digest-bound refs to protocol records, stream events or audit-chain material, and proof-gap/refusal separation.
- Gate: terminal certificate, receipt, release proof, package provenance, or registry listing cannot be used as permission.

P1 slice: distribution and scope gate.

- Treat npm, MCP Registry, host profile, Vercel-like environment scope, and Cloudflare-like token scope as distribution or caller-scope facts only.
- Gate: listing/discoverability/installation cannot satisfy authority, custody, gateway, settlement, hosted trust, or cross-org trust.

### P0/P1 risks and stop conditions

P0 risk: macro plan preserves `policy_authority` as a surface posture.

Stop condition: any plan slice says `PolicyClient`, SDK role clients, MCP, CLI, service workflow, or hosted surface owns policy authority rather than projecting a kernel transition.

P0 risk: projection route drift.

Stop condition: a surface manifest permits a route family that is not bound to `transitionRouteDefinitions`, caller custody, scope resolver, and a `HandshakeKernel` transition.

P0 risk: custody claim outruns proof.

Stop condition: provider/customer custody, signer lease, payment material, or revocation is claimed without external custody evidence and gateway-time reread.

P0 risk: generated execution bypass.

Stop condition: raw sibling, browser, shell, package manager, MCP sibling, direct signer, or hosted endpoint can mutate outside the exact contract -> policy -> one-use greenlight -> gateway check path.

P1 risk: evidence inflation.

Stop condition: receipt, certificate, provenance, package publication, registry lookup, or host invocation is described as permission, settlement, hosted trust, or cross-org trust.

P1 risk: fail-open posture hidden as product convenience.

Stop condition: outage, stale metadata, missing posture, ambiguous commit, or proof gap produces a retry or success path rather than refusal, isolation, replay refusal, or explicit proof gap.

## Status Recommendation

### Brutal verdict

Keep the current source spine. Redesign the macro-plan language and surface boundary tests.

The implementation is closer to the target than the vocabulary is: `PolicyClient` and `GatewayClient` are transport projections that call HTTP routes which delegate to `HandshakeKernel`. But the repo currently teaches one dangerous idea: an SDK projection can be an "authority surface." That is ambient authority wearing a planning label.

Do not promote the architectural north star until the macro plan contains the P0 vocabulary, surface-model, and route/projection derivation slices above. The smallest next mechanism is an architecture gate that forbids authority-owned projection surfaces and proves every projection call maps back to the one kernel transition spine.

## Commands Or Tools Used

- Read repo files with `awk`, `find`, and `rg`.
- Checked dirty state with `git status --short --branch`.
- Used `web.search_query`, `web.open`, and `web.find` for official primary sources only.
- Created the assigned audit directory with `mkdir -p`.
- Wrote this single report with `apply_patch`.
