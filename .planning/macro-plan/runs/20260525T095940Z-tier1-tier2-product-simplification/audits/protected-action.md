## Audit Scope

Verdict: accept the Passport / Admission / Handle ID model only as a non-authority product-surface or projection contract. Do not let it become a protocol primitive, gateway input, reusable workflow credential, signer permission, x402/auth.md clearance, receipt, or terminal certificate.

Assigned focus: protected-action posture and authority boundaries for `passportPackageDigest`, `passportPresentationId`, `admissionId`, `serviceWorkflowHandleId`, and `serviceWorkflowHandleDigest`.

Out of scope: selecting the macro move, synthesizing the final macro plan, promoting final plan status, editing source, running implementation gates, or proving runtime containment.

## Source Boundary

Canonical source truth for authority claims is `README.md`, `QUALITY.md`, `docs/internal/decisions.md`, and `docs/internal/protocol-notes.md`. These sources say product surfaces expose proposal/evidence/readback without creating authority; authority remains exact contract, policy decision, one-use greenlight, gateway check, and receipt/refusal/proof gap.

Derived planning evidence is `.planning/macro-map/*` and `.planning/codebase/*`. It can pressure-test the plan, but it cannot promote Passport, Admission, Badge, or Handle fields into source truth.

The run input explicitly requires all five ID fields to be correlation/reconstruction fields with `createsAuthority: false`. A read-only source search did not find those five field names in non-hidden source/docs; they are not source-owned implementation yet.

Memory was used only for prior-boundary context and was not treated as authority.

## Files Read

- `/Users/joelchan/.codex/skills/gsd-macro-plan/SKILL.md`
- `/Users/joelchan/.codex/skills/gsd-macro-plan/references/macro-protected-action-gates.md`
- `/Users/joelchan/.codex/memories/MEMORY.md`
- `.planning/macro-plan/runs/20260525T095940Z-tier1-tier2-product-simplification/input.md`
- `.planning/macro-map/PROTECTED-ACTION-MAP.md`
- `.planning/macro-map/views/AUTHORITY.md`
- `.planning/macro-map/views/RUNTIME.md`
- `.planning/macro-map/CONCERNS.md`
- `.planning/codebase/ARCHITECTURE.md`
- `.planning/codebase/CONCERNS.md`
- `.planning/codebase/INTEGRATIONS.md`
- `README.md`
- `docs/internal/decisions.md`
- `docs/internal/protocol-notes.md`
- `QUALITY.md`

## Invariant At Stake

Passport, Admission, and Handle fields may help correlate a service workflow and reconstruct later protected-action evidence. They must not create permission, trust, policy, greenlight, gateway acceptance, signer access, payment material, mutation authority, receipt export, terminal certification, hosted operation, or reusable auth.

Every protected event still needs a fresh `CandidateAction` or refusal, exact `ActionContract`, `PolicyDecision`, one-use `Greenlight` or `Refusal`, `GatewayCheckAttempt`, and terminal receipt/refusal/replay refusal/proof gap. If an admitted workflow or handle can execute without that chain, the compiler overreached the principal.

## Pass Conditions

### Field-Level Protected-Action Acceptance Matrix Additions

| Field | Allowed Meaning | Required Flags | Forbidden Interpretation | Required Rejection |
| --- | --- | --- | --- | --- |
| `passportPackageDigest` | Content digest of the presented evidence bundle for reconstruction. | `createsAuthority: false`; `createsPolicyDecision: false`; `createsGreenlight: false`; `performsGatewayCheck: false`; `permitsMutation: false`; `containsSecretOrPaymentMaterial: false`. | Identity proof, trust proof, credential custody proof, policy input that bypasses fresh action evaluation. | Reject if used as `ActionContract` digest, delegated authority digest, credential-ref digest, gateway-readiness digest, or signer/payment material. |
| `passportPresentationId` | Unique per service intake or presentation event. | Same false authority flags. | Session token, bearer auth, reusable service admission, future-call permission. | Reject if reused to satisfy policy, gateway, SDK role-client auth, MCP tool auth, or OpenAPI security. |
| `admissionId` | Service-side workflow intake result reference: accepted, refused, or proof gap. | Same false authority flags plus `isProtectedActionClearance: false`. | `PolicyDecision`, `Greenlight`, gateway admission, route custody, mutation approval, receipt. | Reject if passed to policy/gateway APIs as sufficient evidence, or if an accepted admission skips `CandidateAction` creation/refusal. |
| `serviceWorkflowHandleId` | Carried workflow correlation reference for context and readback. | Same false authority flags plus `isReusableAuth: false`; `widensOperatingEnvelope: false`. | Badge, API key, capability token, x402 payment approval, auth.md credential, retry permission. | Reject if runtime, MCP, browser, shell, HTTP, x402, or auth.md code treats it as permission to call a protected surface. |
| `serviceWorkflowHandleDigest` | Digest of carried workflow handle context for drift detection and reconstruction. | Same false authority flags plus `isGatewayBinding: false`. | Contract digest, greenlight digest, gateway check digest, receipt digest, terminal certificate digest. | Reject if digest drift is smoothed over; require refusal or a new exact contract. |

### Boundary Conditions

- `CandidateAction`/refusal boundary: Admission may prepare context only. Each protected action must still create a fresh candidate or refusal with current assumptions, parameters, idempotency, delegated-authority status, credential posture, bypass posture, and evidence expectations.
- Gateway/enforcement boundary: Only the exact contract -> policy -> one-use greenlight -> gateway check chain may precede mutation. The five ID fields must never satisfy `VerifiedGatewayCheck`.
- Raw sibling bypass: Direct x402 payloads/signatures, bearer tokens, raw HTTP/MCP/browser/shell/package/network routes, dynamic tool names, changed parameters, stale metadata, and consumed greenlights must be refused or recorded as bypass/proof gap. If enforcement is not gateway-backed, This is advisory, not Handshake.
- x402 posture: current wedge stays one buyer-side `x402_payment.exact` per call. `PaymentPayload` and `PAYMENT-SIGNATURE` stay behind the wallet gateway after `VerifiedGatewayCheck`.
- auth.md posture: auth.md prose, PRM/AS metadata, registration, claims, scopes, revocation, and credentials are provenance/custody evidence only until a protected API call clears through exact contract, policy, one-use greenlight, gateway check, and post-gate credential resolution.
- Receipt/refusal/proof-gap separation: Admission/handle readback is not receipt evidence. Downstream finality unknown stays proof gap, not success.
- Tier 3 block: hosted operation, provider/customer gateway custody beyond local proof, marketplace/certification, cross-org trust, aggregate spend, seller/facilitator operation, and hosted mutation authority remain blocked until source evidence and gates prove them.

### Non-Claims Required

- Passport package does not prove identity authorization.
- Presentation ID does not prove principal understanding.
- Admission ID does not prove protected-action approval.
- Service workflow handle does not prove permission, settlement, signer access, credential access, gateway acceptance, or retry authority.
- Handle digest does not prove contract, greenlight, gateway, receipt, or certificate binding.
- MCP visibility, x402 capability, auth.md credential issuance, OpenAPI route shape, browser observation, host profile, or public npm/MCP Registry distribution does not create authority.

## Failures

- The macro map already records that no field-level acceptance matrix exists for `ServiceWorkflowAdmission`; this report supplies required additions, but source does not yet enforce them.
- No negative test proves `ServiceWorkflowHandle` cannot be passed into policy, gateway, runtime, SDK, MCP, x402, or auth.md APIs as permission.
- `Admission` is overloaded across route custody, hosted readiness, product admission packets, and receipt/export language. A standalone `Admission` object would blur route admission, workflow acceptance, policy decision, and gateway clearance. This is advisory, not Handshake.
- The five fields are not yet source-owned schema fields with hard false booleans; they currently live in planning intent.
- Raw sibling bypass posture is documented, but no Passport/Admission/Handle-specific probe proves generated code cannot route around the protected path.
- x402/auth.md composite execution remains an expansion candidate, not current execution authority. auth.md credential issuance plus x402 payment capability must not be marketed as a cleared composite call.
- Tier 3 hosted-operation language must remain blocked. The current sources explicitly leave hosted mutation authority, provider/customer gateway custody beyond local proof, settlement/finality, marketplace/certification, cross-org trust, aggregate spend enforcement, and host-wide containment as proof gaps or cut lines.

## Proof Gaps

- No source-owned `ServiceWorkflowAdmission` / `ServiceWorkflowHandle` schema was read.
- No source-owned matrix row proves all five fields have `createsAuthority: false`.
- No test gate was run for claim boundary, architecture boundary, protocol compilation, policy/gateway refusal, runtime ingress, x402, auth.md, or receipt projection.
- No host-specific smoke was run for browser, A2A, Claude Code, Hermes, OpenClaw, generic MCP, shell, package manager, or direct network bypass.
- No external x402 provider/facilitator finality, provider custody, settlement, or customer gateway custody proof exists in the audited sources.
- No provider-grade auth.md credential lifecycle or credential redaction fuzzing proof exists.
- No proof shows a handle cannot widen `OperatingEnvelope.allowedResources`, carry raw credential/payment material, or stand in for delegated authority.
- No receipt/export fixture proves admission readback cannot be mistaken for receipt, terminal certificate, downstream success, or retry permission.

## Required Changes

### Implementation Blockers

- Block source implementation until the field-level acceptance matrix is source-owned and tested.
- Block docs, demos, SDK, CLI, MCP, and examples from saying Passport, Admission, Badge, or Handle creates authority.
- Block any kernel object, root export, protocol-area path, gateway-route name, or role-client method that makes the five fields look authority-bearing.
- Block x402/auth.md demo promotion until the non-authority surface is in place and the paid/credentialed call still routes through exact event clearance.
- Block Tier 3 progression until Tier 1/Tier 2 simplification has proof gates or explicit proof gaps recorded.

### Negative Tests Required

- Architecture/claim-boundary test: `Passport`, standalone `Admission`, `Badge`, `ServiceWorkflowAdmission`, and `ServiceWorkflowHandle` must not appear under `src/protocol/areas/*`, authority-bearing root exports, gateway execution paths, or policy/gateway route names unless a distinct enforceable transition is documented.
- Schema test: all five fields require `createsAuthority: false`; any `true`, omitted flag, raw secret, payment payload/signature, bearer token, signer ref, or resource-widening field fails.
- Policy/gateway test: `admissionId` and `serviceWorkflowHandleId` cannot satisfy `PolicyDecision`, `Greenlight`, `GatewayCheckAttempt`, `VerifiedGatewayCheck`, `Receipt`, or `AuthorityCertificate` inputs.
- Runtime stress test: loops, retries, branches, dynamic tool construction, stale review surfaces, late-bound parameters, and changed observed parameters produce refusal/new contract, not handle reuse.
- x402 test: handle/admission fields cannot create `PaymentPayload`, `PAYMENT-SIGNATURE`, signer invocation, live provider custody, or aggregate spend authority.
- auth.md test: handle/admission fields cannot resolve credentials, create Authorization headers, widen scopes, bypass revocation/isolation, or make `readyForCompositeExecution` true.
- Receipt/projection test: admission readback cannot be emitted as receipt, receipt export, terminal certificate, downstream success, or retry permission.
- Raw sibling bypass test: direct HTTP, MCP, browser, shell, package-manager, network, raw x402, and raw bearer paths remain prevented, refused, isolated, or proof-gapped per host posture.

### Smallest Next Mechanism

Add a source-owned product-surface contract outside `src/protocol/areas/*`:

```text
ServiceWorkflowAdmission -> accepted | refused | proof_gap
ServiceWorkflowHandle -> correlation/readback context only
```

The schema must include the five ID fields, the hard false authority flags, host/runtime bypass posture refs, and redacted evidence refs. Pair it with the negative tests above before any product-language, SDK, CLI, MCP, demo, or Tier 3 work uses the model.

## Status Recommendation

Recommendation for this protected-action gate: `NEEDS_PROTECTED_ACTION_POSTURE`.

Do not promote to `READY_FOR_AGENT_EXECUTION` on this focus until the field-level matrix, source-owned non-authority schema, and negative tests exist. Keep the move only as a non-authority product-surface simplification. The macro chair can still plan around it, but only with the blockers preserved as proof gates.

## Commands Or Tools Used

- `sed -n '1,220p' /Users/joelchan/.codex/skills/gsd-macro-plan/SKILL.md`
- `sed -n '1,260p' /Users/joelchan/.codex/skills/gsd-macro-plan/references/macro-protected-action-gates.md`
- `rg -n "Tier 3|Passport|Admission|Handle|passportPackageDigest|passportPresentationId|admissionId|serviceWorkflowHandleId|serviceWorkflowHandleDigest|protected action|x402|authority|createsAuthority|greenlight|gateway|CandidateAction|refusal|proof gap|bypass" /Users/joelchan/.codex/memories/MEMORY.md`
- `wc -l` on required source files and the target report path.
- `sed -n` on the required macro-plan input, macro-map, codebase, README, decisions, protocol-notes, and QUALITY files.
- `rg -n "passportPackageDigest|passportPresentationId|admissionId|serviceWorkflowHandleId|serviceWorkflowHandleDigest|ServiceWorkflowAdmission|ServiceWorkflowHandle|createsAuthority" . README.md QUALITY.md docs/internal/decisions.md docs/internal/protocol-notes.md`
- `rg -n "CandidateAction|Refusal|Greenlight|GatewayCheck|VerifiedGatewayCheck|PaymentPayload|PAYMENT-SIGNATURE|auth\\.md|x402_payment\\.exact|proof gap|bypass|host-wide containment|Tier 3|hosted" ...`
- `git status --short -- .planning/macro-plan/runs/20260525T095940Z-tier1-tier2-product-simplification/audits/protected-action.md`
- `ls -la .planning/macro-plan/runs/20260525T095940Z-tier1-tier2-product-simplification/audits`
- `apply_patch` to add this report only.
