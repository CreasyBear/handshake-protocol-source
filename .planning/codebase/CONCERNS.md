# Codebase Concerns

**Analysis Date:** 2026-05-24

## Scope

This remap separates three states:

- Current kernel and Tier 2 surface posture through the active pre-hosted response/telemetry closeout tree.
- Committed auth.md protected-call, lifecycle, bypass, evidence-label, and reconstruction posture under `src/adapters/auth-md/*`, `src/protocol/evidence-projections/*`, and tests.
- Current Tier 2 activation closeout work for the source-owned local self-hosted packet and local MCP stdio process proof.

`.planning/` remains scratch. Canonical claims still come from `AGENTS.md`, `README.md`, `QUALITY.md`, `STRUCTURE.md`, `docs/internal/decisions.md`, and `docs/internal/protocol-notes.md`.

Focused closeout verification during this remap passed:

```bash
npm run test -- test/protocol/kernel-policy-gateway.test.ts test/http/d1-http.test.ts
npm run test -- test/mcp/mcp-x402-proposal.test.ts
npm run test -- test/protocol/evidence-projections.test.ts test/http/http.test.ts test/protocol/authority-certificate.test.ts
npm run test -- test/protocol/evidence-projections.test.ts test/integration/x402-d1-http.test.ts test/conformance/x402-payment-conformance.test.ts
npm run test -- test/cli/cli-evidence.test.ts test/cli/cli-support-bundle.test.ts
npm run test -- test/runtime/runtime-ingress.test.ts
npm run test -- test/mcp/mcp-stdio-process.test.ts test/product/self-hosted-activation.test.ts test/cli/cli-self-hosted-readback.test.ts test/architecture/self-hosted-activation-claim-boundary.test.ts
```

Result: all focused closeout slices passed before final repo-wide gates.

## Priority Index

| Priority | Concern | Scope |
| --- | --- | --- |
| P1 | Source-owned self-hosted packet must not be confused with hosted operation or public MCP host/process startup | Closeout |
| P1 | Runtime ingress still routes action families through central conditionals | Committed |
| P1 | auth.md and x402 evidence labels improve reconstruction but must not imply provider custody, gateway admission, or downstream success without matching records | Committed |
| P2 | `src/adapters/auth-md/profiles.ts` is large and close to becoming a lifecycle bucket | Committed |
| P2 | Agent transaction envelope assembly still fans out across tenant/org object families | Committed |
| P2 | MCP x402 proposal and local stdio proof evidence are graphless and must stay narrower than runtime ingress | Committed plus closeout |
| P2 | x402 aggregate spend/review windows remain metadata without a spend ledger | Committed |

## Active Concerns

**Self-hosted activation packet can overclaim**
- Files: `examples/self-hosted-activation/*`, `src/mcp/stdio/*`, `src/mcp/LANE.md`, `README.md`, `test/product/self-hosted-activation.test.ts`, `test/mcp/mcp-stdio-process.test.ts`, `test/architecture/self-hosted-activation-claim-boundary.test.ts`.
- Evidence: focused self-hosted and MCP stdio tests pass; `npm run demo:self-hosted` produces ignored local output artifacts.
- Risk: A local source-owned packet can be misread as hosted operation, public MCP host/process startup, broad runtime control, provider custody, clearing-house operation, or production self-host readiness.
- Required closeout: keep wording local/source-owned, keep generated output ignored, keep `src/mcp/stdio/*` out of package exports, and run claim, architecture, package, and full repo gates before landing.

**Runtime ingress family routing is hardcoded**
- Files: `src/runtime/ingress/index.ts`, `test/runtime/runtime-ingress.test.ts`, `test/runtime/auth-md-candidate-compilation.test.ts`.
- Evidence: auth.md was added by extending central discriminated unions, type guards, config lookup, compile-input conversion, evidence-ref derivation, and grammar-version selection.
- Risk: Every new family increases the chance that raw sibling bypass, ambiguous dispatch, graph coverage, tool-call draft, or response posture behavior drifts.
- Fix approach: Introduce an internal action-family registry with schema, classification, compile-input builder, config resolver, evidence-ref builder, and raw/ambiguous reason-code mapping.

**auth.md and x402 evidence labels can become evidence theatre**
- Files: `src/protocol/evidence-projections/projections.ts`, `src/protocol/evidence-projections/schemas.ts`, `test/integration/auth-md-receipt-reconstruction.test.ts`, `test/product/agent-proof-slice.test.ts`.
- Evidence: labels such as `auth_md_discovery`, `auth_md_registration`, `handshake_gateway_check`, `gateway_credential_resolution`, `auth_md_protected_api_call_evidence`, and x402 downstream evidence make receipts buyer-readable.
- Risk: Labels could be misread as provider custody, downstream success, or auth-provider trust if shown without admission/finality fields.
- Fix approach: keep labels paired with `gatewayAdmissionStatus`, `downstreamOutcomeStatus`, `reconciliationFinalityStatus`, refusal refs, and proof-gap refs.

**auth.md profiles file is large**
- Files: `src/adapters/auth-md/profiles.ts`.
- Evidence: the file owns discovery metadata, agent_auth normalization, ID-JAG evidence, claim evidence, revocation evidence, gateway credential intake, resource refs, evidence refs, redaction, and leak detection.
- Risk: Continued lifecycle growth will turn it into an adapter bucket and make audits harder.
- Fix approach: if lifecycle scope grows again, split by lifecycle boundary: `discovery.ts`, `credential-intake.ts`, `identity-assertion.ts`, `claim.ts`, `revocation-evidence.ts`, and `redaction.ts`, while preserving the `src/adapters/auth-md/index.ts` face.

**MCP proposal and stdio proof remain graphless**
- Files: `src/mcp/x402-proposal.ts`, `src/mcp/stdio/*`, `test/mcp/mcp-x402-proposal.test.ts`, `test/mcp/mcp-stdio-process.test.ts`.
- Evidence: MCP x402 proposals create runtime evidence and tool-call draft posture; the local stdio proof exercises list/read/call behavior through the official MCP TypeScript SDK.
- Risk: A model-facing MCP transcript or stdio process proof can look equivalent to runtime ingress even when it cannot reconstruct branch, loop, retry, sibling-tool structure, browser-side tools, shell tools, package managers, cloud tools, or generated-code containment.
- Fix approach: keep MCP explicitly single-proposal and graphless in docs/tests, or add minimal graph evidence before treating MCP as runtime-ingress equivalent.

**Spend windows are still metadata**
- Files: `src/adapters/x402-payment/install-proposal.ts`, `src/adapters/x402-payment/action-proposal.ts`, `test/conformance/x402-payment-conformance.test.ts`.
- Evidence: x402 per-call exact path is green, but session/day/review windows are not ledger-enforced.
- Risk: Any aggregate spend-control claim would overstate the source.
- Fix approach: add a ledger-backed spend window before claiming aggregate buyer-side limits.

## Resolved Since Prior Map

- auth.md is no longer only proposal/intake. The committed slice now includes gateway execution after `VerifiedGatewayCheck`, runtime ingress binding, lifecycle isolation, bypass probes, evidence labels, integration/reconstruction tests, and architecture export posture.
- auth.md runtime ingress no longer needs to be described as missing for the first protected-call profile. It now has `wrapped_auth_md_protected_api_call`, `raw_sibling_auth_md_protected_api_call`, and `ambiguous_auth_md_protected_api_call` handling in `src/runtime/ingress/index.ts`.
- Runtime ingress refusal posture now carries durable refusal refs in focused tests.
- The stale auth.md closeout concern is closed for the current map. The active closeout concern is the source-owned local self-hosted activation packet and MCP stdio process proof.

## Non-Claims To Preserve

- auth.md support does not make Handshake an auth provider, OAuth server, WorkOS alternative, hosted identity service, certification body, provider custodian, or generic API gateway.
- auth.md discovery, registration, ID-JAG, claim, revocation, and scope evidence are provenance or lifecycle evidence only.
- Credential-ref isolation blocks future policy/gateway use; it is not itself a policy decision, greenlight, gateway check, receipt, or downstream success proof.
- Hostile bypass probes classify posture; they do not prove universal runtime interception unless the protected path is actually enforced.
- Buyer-readable labels are reconstruction aids; they do not replace exact contracts, one-use greenlights, gateway checks, receipts, refusals, or proof gaps.
- The self-hosted activation packet is a local source-owned proof bundle. It is not hosted operation, public MCP hosting, production process supervision, broad generated-tool containment, provider custody, cross-org clearing, or spend-window ledger enforcement.

---

*Concerns audit: 2026-05-24*
