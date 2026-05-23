# Codebase Concerns

**Analysis Date:** 2026-05-23

## Scope

This remap separates three states:

- Committed kernel and Tier 2 surface posture through commit `7bba365`.
- Committed auth.md protected-call profile under `src/adapters/auth-md/*`.
- Current dirty auth.md expansion for revocation, bypass probes, evidence labels, and reconstruction tests.

`.planning/` remains scratch. Canonical claims still come from `AGENTS.md`, `README.md`, `QUALITY.md`, `STRUCTURE.md`, `docs/internal/decisions.md`, and `docs/internal/protocol-notes.md`.

Focused auth.md verification during this remap passed:

```bash
npm run test -- test/adapters/auth-md-adapter.test.ts test/adapters/auth-md-gateway.test.ts test/adapters/auth-md-bypass-probes.test.ts test/adapters/auth-md-revocation.test.ts test/adapters/auth-md-gateway-pressure.test.ts test/adapters/auth-md-serialization-redaction.test.ts test/runtime/auth-md-candidate-compilation.test.ts test/protocol/policy-auth-md.test.ts test/integration/auth-md-protected-call.test.ts test/integration/auth-md-receipt-reconstruction.test.ts
```

Result: 34 pass / 0 fail / 459 expects.

## Priority Index

| Priority | Concern | Scope |
| --- | --- | --- |
| P1 | Dirty auth.md expansion is focused-test green but not full-gated or committed | Dirty |
| P1 | Runtime ingress still routes action families through central conditionals | Committed plus dirty |
| P1 | Runtime ingress response posture carries refusal reason codes but still needs durable refusal refs surfaced directly | Committed |
| P1 | auth.md evidence labels improve reconstruction but must not imply provider custody, gateway admission, or downstream success without matching records | Dirty |
| P2 | `src/adapters/auth-md/profiles.ts` is large and close to becoming a lifecycle bucket | Committed plus dirty |
| P2 | Agent transaction envelope assembly still fans out across tenant/org object families | Committed |
| P2 | MCP x402 proposal evidence is graphless and must stay narrower than runtime ingress | Committed |
| P2 | x402 aggregate spend/review windows remain metadata without a spend ledger | Committed |

## Active Concerns

**Dirty auth.md expansion is not landed**
- Files: `src/adapters/auth-md/revocation.ts`, `src/adapters/auth-md/bypass-probes.ts`, `src/protocol/evidence-projections/projections.ts`, `src/protocol/evidence-projections/schemas.ts`, `test/support/auth-md-flow.ts`, `test/adapters/auth-md-*`, `test/integration/auth-md-*`, `test/protocol/policy-auth-md.test.ts`.
- Evidence: focused auth.md tests pass.
- Risk: A partial commit could expose lifecycle/probe/projection posture without architecture guards, full repo gate, claim gate, or pack check.
- Required closeout: stage atomically, run `npm run quality:architecture`, `npm run quality:claims`, and `npm run check:repo`.

**Runtime ingress family routing is hardcoded**
- Files: `src/runtime/ingress/index.ts`, `test/runtime/runtime-ingress.test.ts`, `test/runtime/auth-md-candidate-compilation.test.ts`.
- Evidence: auth.md was added by extending central discriminated unions, type guards, config lookup, compile-input conversion, evidence-ref derivation, and grammar-version selection.
- Risk: Every new family increases the chance that raw sibling bypass, ambiguous dispatch, graph coverage, tool-call draft, or response posture behavior drifts.
- Fix approach: Introduce an internal action-family registry with schema, classification, compile-input builder, config resolver, evidence-ref builder, and raw/ambiguous reason-code mapping.

**Runtime ingress refusal refs are still weak**
- Files: `src/runtime/ingress/index.ts`, `src/protocol/areas/intent-compilation/transitions.ts`, `test/runtime/runtime-ingress.test.ts`.
- Evidence: runtime responses expose refusal reason codes, but the response posture shape still needs direct durable refusal refs when rejection records exist.
- Risk: Reconstruction exists in the store but the immediate caller lacks a direct refusal handle.
- Fix approach: add refusal refs to runtime proposal/refusal results and assert `responsePosture.refusalRefs` for rejected runtime ingress paths.

**auth.md evidence labels can become evidence theatre**
- Files: dirty `src/protocol/evidence-projections/projections.ts`, dirty `src/protocol/evidence-projections/schemas.ts`, `test/integration/auth-md-receipt-reconstruction.test.ts`.
- Evidence: labels such as `auth_md_discovery`, `auth_md_registration`, `handshake_gateway_check`, `gateway_credential_resolution`, and `auth_md_protected_api_call_evidence` make receipts buyer-readable.
- Risk: Labels could be misread as provider custody, downstream success, or auth-provider trust if shown without admission/finality fields.
- Fix approach: keep labels paired with `gatewayAdmissionStatus`, `downstreamOutcomeStatus`, `reconciliationFinalityStatus`, refusal refs, and proof-gap refs.

**auth.md profiles file is large**
- Files: `src/adapters/auth-md/profiles.ts`.
- Evidence: the file owns discovery metadata, agent_auth normalization, ID-JAG evidence, claim evidence, revocation evidence, gateway credential intake, resource refs, evidence refs, redaction, and leak detection.
- Risk: Continued lifecycle growth will turn it into an adapter bucket and make audits harder.
- Fix approach: after the dirty expansion lands, split by lifecycle boundary: `discovery.ts`, `credential-intake.ts`, `identity-assertion.ts`, `claim.ts`, `revocation-evidence.ts`, and `redaction.ts`, while preserving the `src/adapters/auth-md/index.ts` face.

**MCP proposal remains graphless**
- Files: `src/mcp/x402-proposal.ts`, `test/mcp/mcp-x402-proposal.test.ts`.
- Evidence: MCP x402 proposals create runtime evidence and tool-call draft posture but intentionally do not expose generated graph coverage equivalent to `src/runtime/ingress/index.ts`.
- Risk: A model-facing MCP transcript can look equivalent to runtime ingress even when it cannot reconstruct branch, loop, retry, or sibling-tool structure.
- Fix approach: keep MCP explicitly single-proposal and graphless in docs/tests, or add minimal graph evidence before treating MCP as runtime-ingress equivalent.

**Spend windows are still metadata**
- Files: `src/adapters/x402-payment/install-proposal.ts`, `src/adapters/x402-payment/action-proposal.ts`, `test/conformance/x402-payment-conformance.test.ts`.
- Evidence: x402 per-call exact path is green, but session/day/review windows are not ledger-enforced.
- Risk: Any aggregate spend-control claim would overstate the source.
- Fix approach: add a ledger-backed spend window before claiming aggregate buyer-side limits.

## Resolved Since Prior Map

- auth.md is no longer only proposal/intake. The committed slice now includes gateway execution after `VerifiedGatewayCheck`, runtime ingress binding, adapter tests, gateway tests, and architecture export posture.
- auth.md runtime ingress no longer needs to be described as missing for the first protected-call profile. It now has `wrapped_auth_md_protected_api_call`, `raw_sibling_auth_md_protected_api_call`, and `ambiguous_auth_md_protected_api_call` handling in `src/runtime/ingress/index.ts`.
- auth.md policy/gateway/projection/reconstruction coverage exists in the dirty expansion and passed focused tests, but it still needs full gate and atomic commit.
- The previous concern that tracked auth.md exports pointed at untracked implementation is stale for the committed first slice. The new dirty concern is lifecycle/bypass/projection expansion not yet landed.

## Non-Claims To Preserve

- auth.md support does not make Handshake an auth provider, OAuth server, WorkOS alternative, hosted identity service, certification body, provider custodian, or generic API gateway.
- auth.md discovery, registration, ID-JAG, claim, revocation, and scope evidence are provenance or lifecycle evidence only.
- Credential-ref isolation blocks future policy/gateway use; it is not itself a policy decision, greenlight, gateway check, receipt, or downstream success proof.
- Hostile bypass probes classify posture; they do not prove universal runtime interception unless the protected path is actually enforced.
- Buyer-readable labels are reconstruction aids; they do not replace exact contracts, one-use greenlights, gateway checks, receipts, refusals, or proof gaps.

---

*Concerns audit: 2026-05-23*
