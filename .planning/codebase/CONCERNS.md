# Codebase Concerns

**Analysis Date:** 2026-05-25

## Map Scope

- This document treats `.planning/` as scratch context. Canonical repo truth lives in tracked source and docs such as `AGENTS.md`, `README.md`, `QUALITY.md`, `STRUCTURE.md`, `docs/internal/decisions.md`, and `docs/internal/protocol-notes.md`.
- No `TODO`, `FIXME`, `HACK`, or `XXX` markers are detected in tracked source, tests, or canonical docs under `src/`, `test/`, `tests/`, `docs/`, `README.md`, `QUALITY.md`, `STRUCTURE.md`, or `AGENTS.md`.
- No source-owned `Passport`, `PrincipalAgentLink`, or standalone service-gateway kernel object is detected. The source model already carries principal/agent identity evidence, delegated attempt authority, gateway registry binding, credential custody, HTTP admission evidence, and gateway checks.
- Existing service gateway references are fixture or endpoint refs, not a kernel object: `test/support/auth-md-flow.ts`, `test/adapters/auth-md-gateway.test.ts`, and `test/adapters/auth-md-adapter.test.ts`.

## Protocol / Kernel Simplification Risks

**Passport/admission/service-gateway/principal-agent object pressure:**
- Issue: Adding a new kernel object named `Passport`, `Admission`, `ServiceGateway`, or `PrincipalAgentLink` duplicates existing protocol responsibilities instead of clarifying authority.
- Files: `src/protocol/areas/catalog-envelope/schemas.ts`, `src/protocol/areas/delegated-authority/schemas.ts`, `src/protocol/areas/delegated-authority/transitions.ts`, `src/http/admission/hosted-caller-identity.ts`, `src/http/admission/request-context.ts`, `src/protocol/areas/object-registry/schemas.ts`.
- Impact: A second object can blur whether authority comes from identity evidence, route admission, delegated authority, gateway custody, or the verified gateway check. That creates ambient permission language around a chain that is meant to stay exact and one-use.
- Fix approach: Reuse the existing primitives. Put principal/agent identity evidence in `ParticipantIdentityBinding` on `OperatingEnvelope`; put scoped attempt authority in `DelegatedAuthorityRef`; put service mutation custody in `GatewayRegistryEntry` and `GatewayCredentialRef`; put transport caller evidence in `TransitionCallerIdentity` and `transition_request_context`; put any "passport" view in a projection or packet under `src/surfaces/` or `src/adapters/`, not a new `src/protocol/areas/` object.

**Kernel object registry expansion is high-friction by design:**
- Issue: New protocol object types require schema ownership, registry posture, navigation, route roles, storage, export/read posture, evidence projection, claim tests, and migration decisions.
- Files: `src/protocol/areas/object-registry/schemas.ts`, `src/protocol/areas/object-registry/index.ts`, `src/protocol/navigation.ts`, `src/http/routes/transition-route-registry.ts`, `src/http/routes/evidence-read-route-registry.ts`, `src/storage/d1/index.ts`, `migrations/0001_protocol_kernel.sql`.
- Impact: A new object that only renames an existing relation increases protocol surface without increasing enforceable control. The likely debt is inconsistent read posture, incomplete isolation scope refs, missing D1 indexes, root export confusion, and product language overclaim.
- Fix approach: Add a kernel object only when it records a distinct terminal or state-transition event that cannot be represented by the existing protocol areas. Otherwise, add a typed projection, proof packet, or adapter profile.

**Principal-agent link already has an evidence-only shape:**
- Issue: A standalone principal-agent link object is redundant with the envelope identity-binding and delegated-authority model.
- Files: `src/protocol/areas/catalog-envelope/schemas.ts`, `test/protocol/participant-identity-binding.test.ts`, `src/protocol/areas/delegated-authority/schemas.ts`, `src/protocol/areas/delegated-authority/transitions.ts`.
- Impact: If the link object reads as permission, it violates the boundary that principal/agent identity is evidence and that delegated authority authorizes only attempts, not mutation.
- Fix approach: Keep participant identity bindings evidence-only and canonicalized into the envelope digest. Use `DelegatedAuthorityRef` for scoped principal-agent-runtime-envelope-gateway attempt authority, with `greenlightCreated: false` and `mutationAuthorityCreated: false`.

**Service gateway is an adapter/gateway role, not a protocol role:**
- Issue: "Service gateway" can be modeled as gateway custody or a protected API adapter, but making it a kernel object creates overlap with gateway registry, credential custody, and gateway check semantics.
- Files: `src/protocol/areas/catalog-envelope/schemas.ts`, `src/protocol/areas/credential-custody/schemas.ts`, `src/adapters/auth-md/gateway.ts`, `src/adapters/x402-payment/wallet-gateway.ts`, `src/http/routes/transition-route-registry.ts`.
- Impact: A service-gateway object can launder operational integration into authority. The authority boundary remains `gatewayCheck`, not service discovery, admission, endpoint registration, or credential provenance.
- Fix approach: Keep service-specific behavior in adapter packages such as `src/adapters/auth-md/` and `src/adapters/x402-payment/`. Promote only generic evidence or terminal protocol state to `src/protocol/areas/`.

## Product-Language Confusion

**"Admission" is overloaded across product, HTTP, gateway, and surface packets:**
- Issue: Admission means expansion admission in `docs/internal/decisions.md`, hosted route admission in `src/http/admission/index.ts`, gateway-admission status in receipt export schemas, and auth.md+x402 admission packets in product surfaces.
- Files: `docs/internal/decisions.md`, `src/http/admission/index.ts`, `src/http/admission/hosted-admission-config.ts`, `src/protocol/areas/receipt-export/schemas.ts`, `src/surfaces/proof-packets.ts`, `src/surfaces/product-launch-gate-resolution.ts`.
- Impact: The word can make read admission, readiness, or a launch packet sound like execution authority. That is advisory, not Handshake, unless the chain reaches exact contract, policy, one-use greenlight, gateway check, and receipt/refusal/proof gap.
- Fix approach: Use narrower names in new work: `route admission`, `expansion evidence packet`, `gateway check posture`, or `launch gate packet`. Avoid standalone `Admission` as a kernel noun.

**auth.md + x402 interlock surfaces are evidence, not composite execution:**
- Issue: The interlock packet verifies structural conditions and proof gaps, but it does not make auth.md credential issuance or x402 payment signing a composite live authority path.
- Files: `src/adapters/auth-md-x402-interlock/packet.ts`, `test/architecture/auth-md-x402-interlock-packet.test.ts`, `src/surfaces/proof-packets.ts`, `src/surfaces/product-launch-gate-resolution.ts`, `docs/internal/decisions.md`.
- Impact: Naming it as admission can imply the service call is already cleared. The packet is a launch/evidence surface; authority remains per protected API call and per x402 exact payment action.
- Fix approach: Keep `readyForCompositeExecution: false` as a hard non-claim until the composite path has exact action contracts, policy decisions, one-use greenlights, verified gateway checks, credential/payment evidence, receipts, refusals, and proof gaps.

**Certificate/passport language risks permission drift:**
- Issue: `AuthorityCertificate` is terminal evidence, but passport-style naming can suggest reusable entry permission.
- Files: `README.md`, `QUALITY.md`, `docs/internal/decisions.md`, `src/protocol/areas/authority-certificate/schemas.ts`, `src/protocol/areas/authority-certificate/transitions.ts`.
- Impact: A certificate or passport label can be mistaken for identity, permission, settlement, hosted trust, or reusable auth. That is ambient authority wearing a badge if it authorizes later calls.
- Fix approach: Use `certificate` only for terminal evidence and use `proof packet` for reviewable surface state. Do not create reusable passport credentials inside the kernel.

## Tech Debt

**Exact protected-action policy is triggered by parameter keys:**
- Issue: `exactProtectedActionPolicyApplies` identifies exact protected-action policy by checking parameter keys such as `gatewayReadinessRef`, `gatewayReadinessDigest`, `policyVersionRef`, `policyVersionDigest`, and `paymentRequirementsDigest`.
- Files: `src/protocol/areas/policy-greenlight/transitions.ts`, `test/protocol/policy-greenlight.test.ts`, `test/protocol/x402-payment-contract.test.ts`.
- Impact: A new action family can accidentally enter this branch by using similar keys, or miss the branch by expressing equivalent evidence under different keys. That makes expansion brittle and can produce inconsistent refusal/greenlight behavior.
- Fix approach: Bind protected-action policy evaluation to explicit action type or policy-pack capability under `src/protocol/areas/policy-greenlight/`, not incidental parameter names.

**D1 conflict classification depends on database error text:**
- Issue: D1 conflict handling classifies failures by matching substrings from SQLite/D1 error messages and by intentionally forcing a `NOT NULL` constraint in mismatch cases.
- Files: `src/storage/d1/index.ts`, `src/storage/d1/statements.ts`, `migrations/0001_protocol_kernel.sql`, `test/protocol/protocol-store-atomicity-contract.test.ts`, `test/http/d1-http.test.ts`.
- Impact: D1 or SQLite message drift can turn a structured idempotency or one-use-greenlight refusal into an unclassified storage error.
- Fix approach: Prefer deterministic post-failure readbacks and table-specific invariant checks for conflict classification. Keep the current atomicity tests as the minimum regression net.

**Surface-boundary posture is enforced by string scans:**
- Issue: The boundary manifest and architecture tests check imports, forbidden terms, and credential shapes through source text patterns.
- Files: `src/surfaces/boundary-manifest.ts`, `test/architecture/surface-boundary-posture.test.ts`, `test/architecture/claim-boundary.test.ts`.
- Impact: String scans can miss dynamic imports, re-export indirection, alias changes, generated code paths, or semantic authority drift. They are claim guardrails, not a runtime enforcement boundary.
- Fix approach: Continue using the tests for product-language discipline, but keep real authority in HTTP route roles, protocol transitions, gateway checks, and storage invariants.

**Large projection/profile files concentrate unrelated risk:**
- Issue: Several files mix schema projection, claim language, evidence transformation, and product gate posture in large modules.
- Files: `src/surfaces/proof-packets.ts`, `src/adapters/auth-md/profiles.ts`, `src/cli/x402/index.ts`, `src/mcp/x402-proposal.ts`, `src/protocol/evidence-projections/projections.ts`, `src/protocol/areas/policy-greenlight/transitions.ts`.
- Impact: Small copy or schema changes can silently alter product claims, packet readiness, and protocol evidence shape in the same edit. Review burden is high.
- Fix approach: Split by owned concern when edits touch these files: schemas, builders, product-gate verdicts, and text projections. Do not combine behavior changes with language cleanup.

**Role clients and root exports are deliberately narrow but easy to blur:**
- Issue: The package exposes curated root exports plus deeper role clients and adapter/runtime subpaths. A convenience export can accidentally imply broader authority or make a proposal-only surface look executable.
- Files: `src/index.ts`, `src/sdk/role-clients/index.ts`, `src/sdk/LANE.md`, `test/architecture/root-exports.test.ts`, `README.md`.
- Impact: Import ergonomics can turn package availability into perceived authority, especially around MCP, runtime ingress, and role clients.
- Fix approach: Keep authority-sensitive helpers behind explicit subpaths and preserve `test/architecture/root-exports.test.ts` as a gate for new exports.

## Known Bugs

**No reproducible source bug detected in the concern scan:**
- Symptoms: No concrete tracked-source bug is identified by `TODO`/`FIXME` markers or by the targeted passport/admission/service-gateway/principal-agent search.
- Files: `src/`, `test/`, `docs/internal/decisions.md`, `docs/internal/protocol-notes.md`.
- Trigger: Not applicable.
- Workaround: Treat documented proof gaps and cut lines as product boundaries, not hidden bugs.

**Live/provider x402 execution is intentionally refused:**
- Symptoms: Non-reference provider environments are rejected before x402 signing.
- Files: `src/adapters/x402-payment/wallet-gateway.ts`, `test/adapters/x402-wallet-gateway.test.ts`, `docs/internal/decisions.md`, `README.md`.
- Trigger: Use of a provider environment posture other than `local_reference_sandbox`.
- Workaround: Keep live/provider x402 claims out of docs and demos until provider custody, facilitator behavior, gateway installation, and settlement evidence are proven.

## Security Considerations

**Hosted admission verifier is a seam, not a production auth system:**
- Risk: A weak `HostedCallerVerifier` can return a validly shaped `TransitionCallerIdentity` for the wrong caller, tenant, org, project, role, or scope.
- Files: `src/http/admission/index.ts`, `src/http/admission/hosted-caller-identity.ts`, `src/http/admission/hosted-admission-config.ts`, `src/http/LANE.md`, `test/http/http.test.ts`.
- Current mitigation: Hosted admission validates identity shape, freshness, roles, hosted read scopes, route scope, and request context evidence. The hosted config explicitly reports no hosted mutation authority, no payment management, no settlement authority, and no provider custody.
- Recommendations: Treat provider verification, org auth, service credential issuance, and hosted operation as deployment-specific security work outside the kernel. Keep hosted operation in proof-gap language until a concrete verifier implementation and threat model exist.

**Static bearer role tokens are reference transport credentials:**
- Risk: `CallerAuthTokens` can be mistaken for production organization authentication.
- Files: `src/http/admission/caller-auth.ts`, `src/sdk/client.ts`, `src/sdk/surface-clients/transport.ts`, `src/sdk/LANE.md`, `README.md`.
- Current mitigation: Tokens are role-scoped and constant-time compared; hosted caller identity is modeled separately.
- Recommendations: Use static tokens only for local/reference deployments. Production paths need a hosted verifier with tenant/org/project/role/scope evidence.

**Credential redaction is heuristic in adapter profiles:**
- Risk: auth.md credential material detection relies on structured schemas plus regex/base64 heuristics that can miss provider-specific secret formats.
- Files: `src/adapters/auth-md/profiles.ts`, `src/adapters/auth-md/gateway.ts`, `src/protocol/areas/credential-custody/schemas.ts`, `docs/internal/protocol-notes.md`.
- Current mitigation: Evidence schemas reject raw credential material and keep `GatewayCredentialRef` opaque. Gateway adapters record credential resolution after verified gateway checks.
- Recommendations: Add provider-specific credential fixtures, fuzzing, and negative tests before any live credential custody claim.

**Runtime ingress is caller-observed evidence, not host containment:**
- Risk: Raw or sibling tool paths can bypass runtime ingress, especially browser-side tools, shell commands, package managers, or direct network calls outside a wrapper.
- Files: `src/runtime/ingress/schemas.ts`, `src/runtime/ingress/index.ts`, `src/runtime/LANE.md`, `docs/internal/protocol-notes.md`.
- Current mitigation: Runtime ingress records wrapped/raw-sibling/ambiguous posture and emits proposals only. It does not create policy, greenlights, gateway checks, or receipts.
- Recommendations: Do not claim broad runtime interception or sandbox containment. For each runtime integration, document raw bypass posture and prove the protected mutation must pass through the gateway.

**MCP surfaces are proposal/evidence only:**
- Risk: Registry availability or MCP tool exposure can be misread as executable protection.
- Files: `src/mcp/server.ts`, `src/mcp/x402-proposal.ts`, `server.json`, `README.md`, `test/architecture/root-exports.test.ts`.
- Current mitigation: README and claim-boundary tests state MCP has no policy decisions, greenlights, gateway checks, signers, mutations, receipt export, hosted operation, or broad protection.
- Recommendations: Keep MCP Registry discoverability as a proof gap until acceptance and lookup are verified, and keep MCP authority claims out of package surfaces.

## Performance Bottlenecks

**In-memory store uses scans and is not a scaling store:**
- Problem: The local store keeps protocol records in memory and resolves many queries by iterating maps or arrays.
- Files: `src/storage/memory/index.ts`, `test/protocol/protocol-store-atomicity-contract.test.ts`.
- Cause: It is designed as local/test/reference storage, not tenant-scale persistence.
- Improvement path: Keep production-facing performance claims on D1 or a real durable store, not `createInMemoryProtocolStore`.

**Evidence projection and proof packet construction parse large JSON records:**
- Problem: Projection paths fetch protocol records and reconstruct evidence views in process.
- Files: `src/protocol/evidence-projections/projections.ts`, `src/surfaces/proof-packets.ts`, `src/storage/d1/index.ts`.
- Cause: Projection code favors reconstructability and schema validation over precomputed read models.
- Improvement path: Add explicit read models or indexed projection tables only after profiling real tenant workloads. Do not make projection caches authority-bearing.

**Runtime ingress has bounded dispatch but no broader throughput model:**
- Problem: Dispatch proposal input is capped and validated, but runtime ingestion is not modeled as high-volume event streaming.
- Files: `src/runtime/ingress/schemas.ts`, `src/runtime/ingress/index.ts`.
- Cause: The runtime path is a proposal compiler for known dispatch families, not a host-wide telemetry pipeline.
- Improvement path: Keep the cap as a safety control. Add backpressure and event-stream storage only when a concrete runtime integration requires it.

## Fragile Areas

**Gateway check consumption and idempotency are correctness-critical:**
- Files: `src/protocol/areas/gateway-gate/transitions.ts`, `src/protocol/areas/gateway-gate/gateway-policy.ts`, `src/storage/d1/index.ts`, `migrations/0001_protocol_kernel.sql`, `test/protocol/protocol-store-atomicity-contract.test.ts`.
- Why fragile: The one-use greenlight invariant depends on exact digest checks, gateway-policy drift checks, idempotency ledger entries, and durable consumption records staying aligned.
- Safe modification: Change gateway consumption, idempotency, or D1 statements only with atomicity tests and replay/refusal tests. Do not loosen digest comparisons to improve ergonomics.
- Test coverage: Strong local and D1 tests exist, but conflict classification remains tied to D1 error behavior.

**Policy evaluation mixes generic and family-specific checks:**
- Files: `src/protocol/areas/policy-greenlight/transitions.ts`, `src/protocol/areas/action-contract/schemas.ts`, `src/protocol/areas/delegated-authority/transitions.ts`.
- Why fragile: Policy checks cover isolation, protected path, sequence deps, gateway credential refs, delegated authority refs, x402-like exact payment parameters, and action-specific matching in one transition area.
- Safe modification: Add explicit evaluators per protected action family while keeping all evaluators under the policy-greenlight transition boundary.
- Test coverage: x402 and delegated-authority tests cover current behavior, but a new action family needs negative tests for accidental policy-branch entry.

**auth.md adapter profiles contain secret-redaction and provenance logic together:**
- Files: `src/adapters/auth-md/profiles.ts`, `src/adapters/auth-md/gateway.ts`, `test/adapters/auth-md-adapter.test.ts`, `test/adapters/auth-md-gateway.test.ts`.
- Why fragile: Credential provenance, identity assertions, lifecycle evidence, gateway intake, and secret-redaction checks share one profile module.
- Safe modification: Keep raw credential rejection tests green for every profile edit. Split helper modules before adding provider-specific credential formats.
- Test coverage: Good reference tests exist; provider-specific fuzzing and live provider fixtures are gaps.

**Surface packets can harden or distort product truth:**
- Files: `src/surfaces/proof-packets.ts`, `src/surfaces/product-launch-gate-resolution.ts`, `test/architecture/claim-boundary.test.ts`.
- Why fragile: These files turn protocol evidence into product-facing claims. A field rename can imply a stronger boundary than the kernel enforces.
- Safe modification: Update product packets with claim-boundary tests and canonical docs in the same review.
- Test coverage: Claim-boundary tests are broad, but they remain text and schema checks rather than formal product-proof validation.

## Scaling Limits

**Per-call spend is modeled; aggregate spend is not enforced:**
- Current capacity: `DelegatedAuthorityRef` supports per-action atomic limits such as `maxAtomicAmountPerAction`, and policy inputs include per-call amount checks.
- Limit: The kernel does not enforce aggregate budget depletion, rolling spend windows, or multi-call balance reservation.
- Scaling path: Add budget ledger semantics only as a new explicit protocol area or transition, with one-use reservation/consumption/refund evidence. Do not overload `DelegatedAuthorityRef` into aggregate spend.

**One official x402 buyer-side exact action is the live proof lane:**
- Current capacity: The official wedge is one buyer-side `x402_payment.exact` per-call protected action.
- Limit: Broad x402 compatibility, seller/facilitator finality, provider custody, settlement proof, and cross-merchant payment management are proof gaps.
- Scaling path: Expand by adding action-specific contracts and gateway checks, not by broadening the meaning of the existing x402 contract.

**Hosted operation is read/admission evidence, not provider enforcement:**
- Current capacity: Hosted admission config and caller identity model route and scope transition/read access.
- Limit: The kernel does not prove production hosted mutation authority, customer gateway installation, provider-side enforcement, or org-wide identity governance.
- Scaling path: Add deployment-specific verifier and gateway-install evidence before claiming hosted operation.

**Protocol object count is already broad:**
- Current capacity: The object registry includes catalog, envelope, delegated authority, credential custody, runtime evidence, intent compilation, action contract, policy, review, gateway gate, mutation, receipt, recovery, certificate, and stream-event objects.
- Limit: Adding synonyms rather than distinct state transitions increases cognitive load and migration cost.
- Scaling path: Prefer projections and packets for new views; promote to protocol object only for new enforceable state.

## Dependencies at Risk

**MCP alpha packages:**
- Risk: `@modelcontextprotocol/client` and `@modelcontextprotocol/server` are alpha-version dependencies.
- Impact: API or protocol drift can break MCP proposal/evidence tooling.
- Migration plan: Keep MCP under proposal/evidence-only subpaths and preserve smoke tests around `src/mcp/` before broadening docs or exports.

**x402 SDK packages:**
- Risk: `@x402/core`, `@x402/evm`, and `@x402/fetch` are external protocol SDK dependencies.
- Impact: Exact payment schema, signature generation, selected payment requirement handling, or provider behavior can drift from local assumptions.
- Migration plan: Keep x402 signing behind `src/adapters/x402-payment/wallet-gateway.ts` and conformance tests. Treat live provider behavior as unproven until tested against real providers.

**Cloudflare D1/Wrangler behavior:**
- Risk: D1 SQL constraints, conflict messages, and Worker runtime behavior are external to the TypeScript kernel.
- Impact: Storage atomicity can fail noisily or classify errors incorrectly if runtime messages change.
- Migration plan: Prefer durable invariant readbacks over message parsing, and keep D1 tests in `test/http/d1-http.test.ts` and `test/integration/x402-d1-http.test.ts`.

**Bun/TypeScript pre-release stack:**
- Risk: The repo targets Bun and TypeScript 6-era tooling.
- Impact: Build, typecheck, and module-resolution behavior can drift under dependency upgrades.
- Migration plan: Keep `bun.lock`, `tsconfig.json`, `package.json`, and repo gates aligned; run `npm run check:repo` for release-sensitive edits.

## Missing Critical Features

**Provider-grade auth.md credential custody:**
- Problem: auth.md credential provenance and redacted gateway intake exist as reference evidence, not provider-grade secret lifecycle proof.
- Blocks: Live protected API custody claims and broad service-gateway claims.
- Files: `src/adapters/auth-md/profiles.ts`, `src/adapters/auth-md/gateway.ts`, `docs/internal/protocol-notes.md`, `docs/internal/decisions.md`.

**Composite auth.md + x402 execution:**
- Problem: The interlock packet is a non-authority readiness/evidence surface; composite paid credentialed API calls are not a finished official execution lane.
- Blocks: Claims that auth.md identity/credential issuance plus x402 payment are cleared as one composite service gateway event.
- Files: `src/adapters/auth-md-x402-interlock/packet.ts`, `src/surfaces/product-launch-gate-resolution.ts`, `test/architecture/auth-md-x402-interlock-packet.test.ts`.

**Hosted operation proof:**
- Problem: Hosted route admission and readiness exist, but production hosted mutation authority and provider/customer gateway installation are proof gaps.
- Blocks: SaaS-style hosted trust claims.
- Files: `src/http/admission/hosted-admission-config.ts`, `src/http/admission/index.ts`, `docs/internal/decisions.md`, `README.md`.

**Aggregate budget management:**
- Problem: Per-call spend controls exist, but no aggregate spend ledger or reservation lifecycle exists.
- Blocks: Customer budget products and multi-call payment limits.
- Files: `src/protocol/areas/delegated-authority/schemas.ts`, `src/protocol/areas/delegated-authority/transitions.ts`, `src/protocol/areas/policy-greenlight/transitions.ts`.

**Broad runtime interception:**
- Problem: Runtime ingress supports selected dispatch families and bypass posture evidence; it does not intercept all generated code, browser-side tools, shells, package managers, or network clients.
- Blocks: Claims of host-wide agent containment.
- Files: `src/runtime/ingress/schemas.ts`, `src/runtime/ingress/index.ts`, `src/runtime/LANE.md`.

## Test Coverage Gaps

**New passport/admission/service-gateway language:**
- What's not tested: No test enforces that `Passport`, standalone `Admission`, `ServiceGateway`, or `PrincipalAgentLink` remains out of the kernel as an authority-bearing object.
- Files: `test/architecture/claim-boundary.test.ts`, `test/architecture/root-exports.test.ts`, `test/protocol/participant-identity-binding.test.ts`, `src/protocol/areas/object-registry/schemas.ts`.
- Risk: A future object or export can introduce permission semantics outside exact contract and gateway check.
- Priority: High.

**Provider-specific credential redaction and custody:**
- What's not tested: Broad provider credential formats, malformed auth.md credentials, and fuzzed encoded secret shapes.
- Files: `src/adapters/auth-md/profiles.ts`, `test/adapters/auth-md-adapter.test.ts`, `test/adapters/auth-md-gateway.test.ts`.
- Risk: Secret material can enter evidence or receipts if new formats bypass heuristics.
- Priority: High.

**Live x402 provider/facilitator behavior:**
- What's not tested: Real provider payment requirements, facilitator responses, settlement/finality evidence, and provider custody outside local reference sandbox.
- Files: `src/adapters/x402-payment/wallet-gateway.ts`, `test/adapters/x402-wallet-gateway.test.ts`, `test/integration/x402-d1-http.test.ts`.
- Risk: Local exact-payment proof can be mistaken for live payment finality.
- Priority: High.

**Semantic boundary enforcement for surfaces:**
- What's not tested: AST-level import restrictions, dynamic imports, generated code, and semantic authority claims in surfaces.
- Files: `src/surfaces/boundary-manifest.ts`, `test/architecture/surface-boundary-posture.test.ts`, `test/architecture/claim-boundary.test.ts`.
- Risk: A surface can import or imply authority through a path that string scans miss.
- Priority: Medium.

**Policy evaluator expansion:**
- What's not tested: Negative cases for new protected-action families that share parameter names with x402-like exact protected actions.
- Files: `src/protocol/areas/policy-greenlight/transitions.ts`, `test/protocol/policy-greenlight.test.ts`.
- Risk: Expansion paths can receive wrong policy behavior without obvious type errors.
- Priority: Medium.

---

*Concerns audit: 2026-05-25*
