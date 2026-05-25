# Codebase Concerns

**Analysis Date:** 2026-05-25

## Tech Debt

**Passport / admission / service-gateway vocabulary can duplicate existing authority primitives:**
- Issue: No tracked source object named `passport`, `principal_agent_link`, or `service_gateway` exists. The existing model already carries the relevant evidence: `OperatingEnvelope.participantIdentityBindings` binds principal/agent identity as evidence only, `DelegatedAuthorityRef` records principal/agent/runtime/envelope/gateway scoped attempt bounds, `GatewayRegistryEntry` names the gateway authority holder, and `GatewayCredentialRef` names credential custody. Adding a new kernel object for "passport" or "principal-agent link" would create a second identity/authority lane unless it records a terminal event that none of these objects can represent.
- Files: `src/protocol/areas/catalog-envelope/schemas.ts`, `src/protocol/areas/delegated-authority/schemas.ts`, `src/protocol/areas/credential-custody/schemas.ts`, `src/http/admission/hosted-caller-identity.ts`, `test/protocol/participant-identity-binding.test.ts`, `docs/internal/protocol-notes.md`
- Impact: A new kernel object can make credential issuance, caller admission, or identity proof look like protected-action authority. That violates the current split between evidence-only participant identity, delegated attempt bounds, gateway custody, policy greenlight, and gateway check.
- Fix approach: Keep "passport" as a service-facing/readback projection or adapter evidence packet under `src/surfaces/` or `src/adapters/*` unless a concrete transition needs append-only state, isolation, replay semantics, and receipt/proof-gap reconstruction. Put principal-agent evidence into `OperatingEnvelope.participantIdentityBindings`; put spend or mutation attempt bounds into `DelegatedAuthorityRef`; put service gateway custody into `GatewayRegistryEntry` plus `GatewayCredentialRef`.

**The word "admission" is overloaded across product, HTTP, and gateway evidence:**
- Issue: `docs/internal/decisions.md` uses "expansion admission" for second-family readiness, `src/http/admission/*` uses hosted admission for caller custody and read entitlements, and receipt/readback code uses `GatewayAdmissionStatus` for gateway check outcomes. The auth.md+x402 surface also names an `auth_md_x402_admission_packet` even though the packet is non-authority.
- Files: `docs/internal/decisions.md`, `src/http/admission/index.ts`, `src/protocol/areas/receipt-export/schemas.ts`, `src/adapters/auth-md-x402-interlock/packet.ts`, `src/surfaces/proof-packets.ts`, `src/surfaces/product-launch-gate-resolution.ts`
- Impact: Product and implementation discussions can accidentally treat a documentation admission packet or HTTP route admission as gateway admission. That would turn read/admission posture into authority language.
- Fix approach: Use precise nouns in new work: `expansion evidence packet` for product readiness, `hosted caller admission` for HTTP, and `gateway check/admission status` only for post-policy gateway results. Do not introduce a generic `Admission` kernel primitive.

**auth.md+x402 interlock is non-authority but close to product-completion wording:**
- Issue: `AuthMdX402InterlockPacket` structurally sets `readyForCompositeExecution: false` and every authority flag false, but `projectProductCompletionReadback()` can mark the `auth_md_x402_admission_packet` gate completed when packet/projector/refusal/readback tests pass.
- Files: `src/adapters/auth-md-x402-interlock/packet.ts`, `src/surfaces/proof-packets.ts`, `test/architecture/auth-md-x402-interlock-packet.test.ts`, `test/architecture/proof-packets.test.ts`, `docs/internal/decisions.md`
- Impact: A completed packet gate can be misread as admitted composite execution. The actual source truth says auth.md credential issuance is provenance and every paid credentialed call still needs exact contract -> policy -> one-use greenlight -> gateway check.
- Fix approach: Keep this as a surface/adapters proof packet, not a protocol object. If promoted, the first source change should be a clearer name and claim-boundary test, not a new kernel object.

**Exact protected-action policy is parameter-triggered instead of action-type owned:**
- Issue: `exactProtectedActionPolicyApplies()` activates when x402-specific parameter names are present rather than by a declared policy pack/action-family handler. This is currently acceptable for the first wedge but fragile for future protected actions that may share fields such as `gatewayReadinessDigest` or `policyVersionDigest`.
- Files: `src/protocol/areas/policy-greenlight/transitions.ts`, `src/adapters/x402-payment/action-proposal.ts`, `src/runtime/ingress/schemas.ts`, `test/protocol/kernel-policy-gateway.test.ts`
- Impact: A second action family can either accidentally trigger x402-shaped checks or avoid exact protected-action checks by omitting the marker fields. This is a protocol simplification risk: generic field sniffing becomes hidden policy.
- Fix approach: Before admitting another action family, make exact policy selection explicit by action class, action type, or policy pack contract. Keep shared readiness/version/credential checks generic only when their semantics are identical.

**Large manually curated evidence/projector files concentrate drift risk:**
- Issue: `src/surfaces/proof-packets.ts` and `src/adapters/auth-md/profiles.ts` each contain many schemas, redaction checks, proof-gap builders, and projection helpers. They are readable but act as vocabulary choke points.
- Files: `src/surfaces/proof-packets.ts`, `src/adapters/auth-md/profiles.ts`, `src/surfaces/boundary-manifest.ts`, `src/adapters/LANE.md`
- Impact: Product-language changes can land in one projector without corresponding claim-boundary tests or docs updates. Future "passport" work would likely increase this debt if added as another broad schema block.
- Fix approach: Split only by stable proof kind or adapter evidence family after tests pin the boundary. Do not split into generic `utils`, `service`, or `passport` buckets.

**D1 conflict classification depends on provider error strings:**
- Issue: `D1ProtocolStore` maps unique/constraint failures by checking error-message substrings such as `stream_events`, `greenlight_issuances`, and `receipt_by_mutation_attempt`.
- Files: `src/storage/d1/index.ts`, `src/storage/d1/statements.ts`, `migrations/0001_protocol_kernel.sql`, `test/protocol/protocol-store-atomicity-contract.test.ts`
- Impact: If D1 error wording changes, a conflict that should become structured replay/refusal/proof-gap behavior can throw as an unclassified error. That weakens operational reconstruction under concurrency.
- Fix approach: Prefer deterministic post-failure readback checks for each indexed claim, as already done for greenlight consumption, and keep the memory/D1 atomicity contract tests paired.

**Surface-boundary enforcement is strong but text based:**
- Issue: `test/architecture/surface-boundary-posture.test.ts` scans imports and forbidden strings with regex/string matching. This catches many regressions but is not semantic TypeScript analysis.
- Files: `src/surfaces/boundary-manifest.ts`, `test/architecture/surface-boundary-posture.test.ts`, `test/architecture/root-exports.test.ts`
- Impact: Alias imports, generated names, or innocuous comments can evade or falsely trigger guardrails. This is not gateway enforcement; it is repo-shape review automation.
- Fix approach: Keep the manifest as an architecture guard, but do not treat it as a security boundary. For any new public surface, add runtime/schema tests that prove the surface cannot create policy, greenlight, gateway check, receipt export, signer use, or mutation.

## Known Bugs

**No reproducible source bug detected during this read-only mapping:**
- Symptoms: No `TODO`, `FIXME`, `HACK`, or `XXX` markers were found in tracked `src/`, `test/`, or canonical docs during the scan.
- Files: `src/`, `test/`, `README.md`, `QUALITY.md`, `STRUCTURE.md`, `docs/internal/decisions.md`, `docs/internal/protocol-notes.md`
- Trigger: Not applicable.
- Workaround: Not applicable.

**Intentional refusal paths can look like missing feature failures:**
- Symptoms: Official x402 signing currently refuses non-reference provider environments; auth.md+x402 interlock packets always report `readyForCompositeExecution: false`.
- Files: `src/adapters/x402-payment/wallet-gateway.ts`, `src/adapters/auth-md-x402-interlock/packet.ts`, `docs/internal/decisions.md`
- Trigger: Attempting to treat local/reference x402 or auth.md+x402 interlock evidence as live provider/customer execution.
- Workaround: Keep these as proof gaps until customer gateway custody, post-gate signer use, terminal readback, and admission criteria are source-proven.

## Security Considerations

**Hosted caller verifier is a seam, not production org auth:**
- Risk: `HostedCallerVerifier` is caller-supplied server code. The kernel validates the returned identity shape, freshness, roles, scopes, and tenant/org match, but it cannot prove that the verifier correctly validates JWTs, sessions, service credentials, revocation, or provider trust.
- Files: `src/http/admission/index.ts`, `src/http/admission/hosted-caller-identity.ts`, `src/http/admission/hosted-admission-config.ts`, `src/http/LANE.md`, `test/http/http.test.ts`
- Current mitigation: Hosted mode requires explicit config, server-side verifier, role admission, read entitlements, raw-read purpose/expiry, and tenant/org scope checks.
- Recommendations: Treat verifier implementation and deployment configuration as external proof gaps. Do not move provider-specific auth into `src/protocol/`; keep it in hosted integration code with tests for stale identity, revoked epoch, cross-tenant hiding, and service-credential rotation.

**Local bearer custody is suitable for reference operation only:**
- Risk: Non-hosted HTTP admission uses static role bearer tokens for `control_plane`, `runtime_evidence`, `gateway_custody`, and `review_custody`.
- Files: `src/http/admission/caller-auth.ts`, `src/sdk/client.ts`, `src/sdk/surface-clients/transport.ts`, `src/sdk/LANE.md`, `test/http/http.test.ts`
- Current mitigation: Routes fail closed when token bindings are missing, compare tokens in constant time, and role-scoped clients avoid teaching the low-level all-token `HandshakeClient` path.
- Recommendations: For production hosted claims, require `HostedCallerVerifier` plus deployment evidence; do not represent static bearer possession as principal-agent authority or service gateway custody.

**Credential and payment redaction is typed but not provider-grade proof:**
- Risk: Redaction guards look for common secret patterns, URL-decoded strings, and base64-like decoded material. Unknown provider credential formats can evade heuristics.
- Files: `src/adapters/auth-md/profiles.ts`, `src/protocol/areas/delegated-authority/schemas.ts`, `src/protocol/areas/credential-custody/schemas.ts`, `test/adapters/auth-md-serialization-redaction.test.ts`, `test/protocol/credential-custody.test.ts`
- Current mitigation: Evidence schemas carry explicit `credentialMaterialIncluded: false`, `secretMaterialIncluded: false`, and digest/ref-only fields; gateway fixtures record post-gate credential-resolution evidence without raw material.
- Recommendations: Add provider-specific fuzz fixtures before live custody claims. Keep raw provider SDKs and secret retrieval outside protocol APIs.

**Raw evidence read posture is powerful even when gated:**
- Risk: Hosted raw record reads expose audit-readable protocol records when `rawReadPosture` permits them. Object registry blocks `internal_only` records, but `audit_read` objects can still include sensitive operational metadata.
- Files: `src/http/handlers/internal-record-read.ts`, `src/http/admission/hosted-admission-config.ts`, `src/protocol/areas/object-registry/index.ts`, `docs/internal/protocol-notes.md`
- Current mitigation: Hosted raw reads require `rawEvidenceReader`, `evidence:raw:request`, `evidence:raw:read`, explicit purpose, bounded expiry, tenant/org match, and object `rawReadPosture`.
- Recommendations: Prefer purpose-built redacted projections in `src/protocol/evidence-projections/` for service-facing readback. Do not build a passport/readback product on generic raw record reads.

## Performance Bottlenecks

**Evidence assembly is read-heavy and JSON-parse heavy:**
- Problem: D1 storage keeps canonical payloads as JSON and projection code assembles readbacks by loading records, streams, indexes, and projection-specific objects.
- Files: `src/storage/d1/index.ts`, `src/protocol/evidence-projections/projections.ts`, `src/http/handlers/evidence-read.ts`, `migrations/0001_protocol_kernel.sql`
- Cause: The protocol preserves object-level reconstruction and portable schemas instead of denormalizing every view.
- Improvement path: Keep this until actual hosted read volume exists. Add projection-specific indexes/materialized redacted views only after the service-facing readback path proves which queries need scale.

**In-memory store scans are local/test posture only:**
- Problem: `InMemoryProtocolStore` uses maps plus O(n) scans for record listing, stream tails, and action-contract matching.
- Files: `src/storage/memory/index.ts`, `test/support/fixtures.ts`, `test/protocol/protocol-store-atomicity-contract.test.ts`
- Cause: The memory store is a deterministic fixture/reference implementation, not the production storage path.
- Improvement path: Do not optimize this into a second storage model. Keep D1 as durable reconstruction truth and memory as test harness.

## Fragile Areas

**Runtime ingress is public but family-limited:**
- Files: `src/runtime/ingress/schemas.ts`, `src/runtime/ingress/index.ts`, `src/runtime/LANE.md`, `docs/internal/protocol-notes.md`
- Why fragile: The public runtime subpath currently supports package-install, x402 payment, and experimental auth.md protected API dispatch families. It records loops, retries, raw siblings, dynamic tool construction, and late-bound parameters, but it does not prove broad MCP/browser/shell/network interception.
- Safe modification: Add one dispatch family at a time with generated execution shape, protected path, gateway holder, credential holder, bypass posture, proof-gap model, recovery/isolation path, and explicit non-claims.
- Test coverage: `test/runtime/runtime-ingress.test.ts`, `test/runtime/package-install-runtime.test.ts`, `test/runtime/auth-md-candidate-compilation.test.ts`, and `test/protocol/generated-execution-graph.test.ts` cover current families, not broad host interception.

**Gateway transport and signer custody can be conflated:**
- Files: `src/sdk/surface-clients/gateway-client.ts`, `src/sdk/LANE.md`, `src/adapters/x402-payment/wallet-gateway.ts`, `src/adapters/auth-md/gateway.ts`, `src/surfaces/boundary-manifest.ts`
- Why fragile: `GatewayClient` can record gateway checks and custody evidence, while adapter fixtures can invoke signer/API-call surfaces after `VerifiedGatewayCheck`. Product copy can accidentally imply that the SDK client itself holds signer custody or executes mutation.
- Safe modification: Keep signer/payment payload creation only inside gateway-owned adapter surfaces, and keep role-client outputs free of `PaymentPayload`, `PAYMENT-SIGNATURE`, raw credentials, or mutation commands.
- Test coverage: `test/architecture/surface-boundary-posture.test.ts`, `test/adapters/x402-wallet-gateway.test.ts`, and `test/adapters/auth-md-gateway.test.ts` guard current boundaries.

**Codex host activation readback uses a narrow custom TOML parser:**
- Files: `src/surfaces/proof-packets.ts`, `test/architecture/proof-packets.test.ts`, `docs/internal/decisions.md`
- Why fragile: The parser reads simple `[mcp_servers.*]` TOML sections with regexes. It is enough for current readback proof but not a general TOML parser.
- Safe modification: Keep it scoped to read-only proof packets. If host config editing or broader config support returns, use a structured TOML parser and preserve secret redaction.
- Test coverage: `test/architecture/proof-packets.test.ts` covers the current proof packet behavior, not arbitrary TOML.

**Object registry is the raw-read and export-posture chokepoint:**
- Files: `src/protocol/areas/object-registry/schemas.ts`, `src/protocol/areas/object-registry/index.ts`, `test/protocol/object-registry.test.ts`, `test/protocol/protocol-navigation.test.ts`
- Why fragile: Every new kernel object must be added to the discriminated union, registry metadata, raw-read posture, navigation, D1 storage expectations, and tests. A casual `passport` object would increase this surface immediately.
- Safe modification: Refuse new protocol objects unless they have a transition, id selector, raw-read/export posture, isolation/replay implications, and evidence projection. Prefer fields on existing objects or surface packets first.
- Test coverage: Object registry and transition-matrix tests catch current registration shape, not product-level semantic duplication.

## Scaling Limits

**First wedge remains per-call x402 protected spend:**
- Current capacity: `x402_payment.exact` enforces one buyer-side exact payment attempt with one gateway credential ref and one delegated authority ref.
- Limit: Aggregate spend windows, session/day budgets, facilitator operation, seller middleware, settlement finality, and broad x402 compatibility remain proof gaps or cut lines.
- Scaling path: Add a policy-time and gateway-time aggregate ledger only after per-call enforcement remains stable.
- Files: `src/protocol/areas/policy-greenlight/transitions.ts`, `src/protocol/areas/delegated-authority/transitions.ts`, `src/adapters/x402-payment/wallet-gateway.ts`, `docs/internal/decisions.md`

**Runtime dispatch blocks are intentionally bounded:**
- Current capacity: `RuntimeIngressDispatchBlockSchema` allows up to 32 observed dispatches and graph sizing defaults around the observed node count.
- Limit: Long-running generated programs, streaming tool graphs, unobserved browser actions, and host-native sibling paths remain outside current proof.
- Scaling path: Add host-specific graph chunks/proof-gap handling only when a real runtime integration needs it.
- Files: `src/runtime/ingress/schemas.ts`, `src/runtime/ingress/index.ts`, `src/protocol/areas/generated-execution-graph/schemas.ts`

**Hosted operation is not proven by local D1/HTTP readiness:**
- Current capacity: Hosted admission, readiness, redacted reads, and raw-read posture are modeled.
- Limit: Production tenancy, retention, operational RPO/RTO, provider/customer gateway custody, external secret lifecycle, abuse controls, and live revocation remain proof gaps.
- Scaling path: Build a hosted deployment proof packet before hosted product claims; keep it outside `src/protocol/` unless it creates protocol evidence.
- Files: `src/http/admission/hosted-admission-config.ts`, `src/http/handlers/hosted-readiness.ts`, `src/storage/d1/index.ts`, `docs/internal/decisions.md`

## Dependencies at Risk

**MCP SDK is alpha:**
- Risk: `@modelcontextprotocol/client` and `@modelcontextprotocol/server` are pinned to `^2.0.0-alpha.2`, so API changes can break MCP stdio proposal/evidence behavior.
- Impact: `handshake-mcp`, package smoke tests, and MCP proposal/readback examples can fail across dependency updates.
- Migration plan: Keep package-surface and MCP stdio smoke tests in `npm run pack:check`; pin or vendor compatibility if the SDK API churns.
- Files: `package.json`, `src/mcp/stdio/server.ts`, `test/mcp/mcp-stdio-process.test.ts`, `scripts/check-clean-installed-activation.mjs`

**x402 dependencies define a moving external protocol surface:**
- Risk: `@x402/core`, `@x402/evm`, and `@x402/fetch` are version-pinned, while the source only admits official V2 PaymentRequired exact-scheme evidence for the first wedge.
- Impact: External x402 ecosystem changes can make "broad compatibility" language false or cause signing/validation drift.
- Migration plan: Keep `x402_payment.exact` narrow; update conformance fixtures and `test/conformance/x402-upstream-exact-fixtures.test.ts` before changing product claims.
- Files: `package.json`, `src/adapters/x402-payment/wallet-gateway.ts`, `src/adapters/x402-payment/upstream-evidence.ts`, `test/conformance/x402-payment-conformance.test.ts`

**Cloudflare/D1 behavior is part of the reference storage contract:**
- Risk: `wrangler`, `@cloudflare/workers-types`, and D1 error/transaction behavior affect atomicity and hosted readiness checks.
- Impact: Storage conflict handling and Worker-hosted route behavior can drift without TypeScript failures.
- Migration plan: Keep `test/http/d1-http.test.ts` and `test/protocol/protocol-store-atomicity-contract.test.ts` in the storage quality gate.
- Files: `package.json`, `src/storage/d1/index.ts`, `wrangler.toml`, `migrations/0001_protocol_kernel.sql`

## Missing Critical Features

**Customer gateway custody proof is not complete product proof:**
- Problem: Local/reference signer custody exists, but customer/provider gateway custody beyond local proof remains a proof gap.
- Blocks: Live paid execution claims, production buyer-side readiness, provider custody language, and stronger service-facing claims.
- Files: `docs/internal/decisions.md`, `src/adapters/x402-payment/wallet-gateway.ts`, `src/protocol/areas/credential-custody/schemas.ts`, `src/surfaces/product-launch-gate-resolution.ts`

**Aggregate spend enforcement is absent by design:**
- Problem: Delegated spend bounds enforce per-call limits, not aggregate windows.
- Blocks: Session/day budget guarantees, recurring spend limits, and broader buyer spend-management claims.
- Files: `src/protocol/areas/delegated-authority/schemas.ts`, `src/protocol/areas/delegated-authority/transitions.ts`, `src/protocol/areas/policy-greenlight/transitions.ts`, `README.md`, `docs/internal/decisions.md`

**MCP Registry discoverability remains distribution proof gap:**
- Problem: Public npm availability is verified, but MCP Registry acceptance and lookup are still separated from authority and product proof.
- Blocks: Registry-discoverable distribution claims and some launch language.
- Files: `README.md`, `server.json`, `src/surfaces/release-proof.ts`, `docs/internal/decisions.md`

**auth.md+x402 is not an execution-ready composite action:**
- Problem: The interlock packet links provenance and protected spend evidence but does not resolve credentials, sign payments, perform gateway checks, or create authority.
- Blocks: Composite credentialed paid API-call claims.
- Files: `src/adapters/auth-md-x402-interlock/packet.ts`, `src/adapters/auth-md/profiles.ts`, `src/adapters/auth-md/gateway.ts`, `docs/internal/decisions.md`

## Product-Language Confusion

**Service gateway should mean gateway custody plus service-call adapter, not a new authority class:**
- Current source: Auth.md fixtures use `gateEndpointRef: "internal:auth-md-service-gateway"` only in tests, while real gateway identity lives in `GatewayRegistryEntry.gatewayId`, `gatewayAuthorityHolderRef`, `mutationCredentialHolderRef`, and `GatewayCredentialRef`.
- Files: `test/support/auth-md-flow.ts`, `src/adapters/auth-md/gateway.ts`, `src/protocol/areas/catalog-envelope/schemas.ts`, `src/protocol/areas/credential-custody/schemas.ts`
- Prescriptive rule: Say "auth.md protected API-call gateway adapter" or "service-call gateway custody" when referring to the auth.md fixture. Do not introduce `ServiceGateway` in the kernel.

**Principal-agent link should remain evidence-only unless policy consumes scoped authority:**
- Current source: `ParticipantIdentityBinding` records provider-neutral principal/agent identity refs as `authorityPosture: "evidence_only"` and tests prove those bindings cannot widen the envelope.
- Files: `src/protocol/areas/catalog-envelope/schemas.ts`, `test/protocol/participant-identity-binding.test.ts`, `src/protocol/evidence-projections/projections.ts`
- Prescriptive rule: Put identity/provider proof in `participantIdentityBindings`; put action attempt authority in `DelegatedAuthorityRef`; put policy/gateway enforcement in `PolicyDecision`, `Greenlight`, and `GatewayCheck`.

**Passport should not become reusable permission:**
- Current source: `AuthorityCertificate` is terminal evidence, not permission; `DelegatedAuthorityRef` creates no greenlight; `GatewayCredentialRef` records custody metadata only.
- Files: `src/protocol/areas/authority-certificate/schemas.ts`, `src/protocol/areas/delegated-authority/schemas.ts`, `src/protocol/areas/credential-custody/schemas.ts`, `README.md`
- Prescriptive rule: If "passport" is useful UX, model it as a readback/projection name over exact records. Never make it a bearer token, reusable credential, or pre-policy authority object.

## Protocol / Kernel Simplification Risks

**Do not add kernel objects for lifecycle summaries already derivable from records:**
- Risk: `ActionAttemptLifecycle` is currently derived evidence, not a stored object. Adding summary objects such as `Passport`, `Admission`, or `PrincipalAgentLink` can repeat this mistake in the identity/admission domain.
- Files: `docs/internal/decisions.md`, `src/protocol/areas/action-attempt-lifecycle/matrix.ts`, `src/protocol/evidence-projections/projections.ts`
- Simplification path: Derive lifecycle and passport-like readbacks from `OperatingEnvelope`, `DelegatedAuthorityRef`, `GatewayCredentialRef`, `ActionContract`, `PolicyDecision`, `Greenlight`, `GatewayCheck`, `Receipt`, `Refusal`, and `ProofGap`.

**Keep admission work outside the protocol kernel unless it changes exact action authority:**
- Risk: HTTP hosted admission and expansion admission are product/transport gates. Moving them into `src/protocol/areas/*` would make route admission look like protected-action clearance.
- Files: `src/http/admission/index.ts`, `src/http/LANE.md`, `docs/internal/decisions.md`, `src/protocol/LANE.md`
- Simplification path: Keep `src/protocol/` for exact protected-action authority semantics. Keep service/onboarding/admission packets in `src/surfaces/` and adapter evidence in `src/adapters/*`.

**Keep auth.md as provenance until a protected API call clears through the gateway chain:**
- Risk: auth.md registration, credential issuance, ID-JAG, claim, and revocation evidence can be mistaken for permission.
- Files: `src/adapters/auth-md/profiles.ts`, `src/adapters/auth-md/action-proposal.ts`, `src/adapters/auth-md/gateway.ts`, `docs/internal/protocol-notes.md`
- Simplification path: Treat auth.md evidence as `GatewayCredentialRef` provenance and lifecycle/isolation input. The only authority path is still action contract -> policy -> greenlight -> gateway check -> post-gate credential resolution/use.

## Test Coverage Gaps

**No direct guard against introducing `Passport`, `ServiceGateway`, or `PrincipalAgentLink` kernel objects:**
- What's not tested: Architecture tests ban some vocabulary and bucket names, but there is no explicit regression test that rejects new identity/admission authority objects duplicating existing primitives.
- Files: `test/architecture/naming-posture.test.ts`, `test/protocol/object-registry.test.ts`, `src/protocol/areas/object-registry/schemas.ts`
- Risk: A future discussion can land a new object name that passes generic object-registry tests while weakening the authority model.
- Priority: High if passport/admission work proceeds.

**Provider-grade credential fuzzing is incomplete:**
- What's not tested: Unknown credential/token formats, provider-specific secret refs, and non-standard auth.md material across raw evidence, failure evidence, and gateway command paths.
- Files: `src/adapters/auth-md/profiles.ts`, `src/adapters/auth-md/gateway.ts`, `test/adapters/auth-md-serialization-redaction.test.ts`
- Risk: Redacted evidence may miss a provider-specific secret shape.
- Priority: High before live provider custody claims.

**Hosted verifier correctness is out of repo scope:**
- What's not tested: Real Cloudflare Access JWT, pinned JWKS, revocation epoch service, service credential rotation, and production tenant mapping.
- Files: `src/http/admission/hosted-caller-identity.ts`, `src/http/admission/hosted-admission-config.ts`, `test/http/http.test.ts`
- Risk: Hosted admission can be configured with a weak verifier while the kernel correctly validates only the verifier output.
- Priority: High before hosted operation claims.

**Broad host bypass/interception is intentionally unproven:**
- What's not tested: Native containment of shell, browser, MCP sibling servers, arbitrary network paths, package-manager ecosystems, and long-running generated programs.
- Files: `src/runtime/ingress/schemas.ts`, `src/adapters/x402-payment/bypass-probes.ts`, `src/adapters/auth-md/bypass-probes.ts`, `src/adapters/package-install/host-harness.ts`
- Risk: Host profile/probe language can be overread as containment.
- Priority: Medium; keep as proof gap unless the product claim expands.

---

*Concerns audit: 2026-05-25*
