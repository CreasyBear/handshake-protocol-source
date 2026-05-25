# Protected-Action Gates

## Source Boundary

| Source | Protected-Action Role | Status |
| --- | --- | --- |
| `.planning/macro-map/PROTECTED-ACTION-MAP.md` | Authority, gateway, bypass, and readback map | Derived gate input |
| `.planning/macro-map/views/AUTHORITY.md` | Non-authority and field-boundary pressure | Lens evidence |
| `.planning/macro-map/views/RUNTIME.md` | x402/auth.md and host-profile proof gaps | Lens evidence |
| `.planning/codebase/ARCHITECTURE.md`, `CONCERNS.md`, `INTEGRATIONS.md` | Current authority placement and integration boundaries | Derived codebase evidence |
| `docs/internal/decisions.md`, `docs/internal/protocol-notes.md` | Canon product/protocol boundary | Canon |
| `src/adapters/x402-payment/wallet-gateway.ts` | Current signer boundary after verified gateway evidence | Source anchor for implementation phase |
| `src/adapters/auth-md/gateway.ts` | Current credentialed API fixture after verified gateway evidence | Source anchor for implementation phase |

## Protected-Action Triggers

Protected-action gates apply when an admitted workflow attempts:

- `x402_payment.exact`;
- `auth_md_protected_api_call.exact`;
- credentialed service call;
- external API mutation;
- package install, repo write, preview deploy, cloud config, CI/release, or database/data-plane mutation;
- browser-side paid or consequential action;
- any generated tool call with side effects.

## Candidate Actions

The admission surface may help produce context for a fresh candidate action. It cannot be the candidate action. It cannot be an action contract. It cannot carry a policy result. It cannot carry a one-use greenlight. It cannot carry gateway check evidence.

First admitted Tier 2 candidate:

```text
serviceWorkflowHandle -> fresh x402_payment.exact action request -> ActionContract
```

The handle is context and evidence refs only.

Non-composite rail rule:

```text
serviceWorkflowHandle -> fresh x402_payment.exact action request
serviceWorkflowHandle -> fresh auth_md_protected_api_call.exact action request
```

These are separate rails. No fixture may merge x402 spend authority and auth.md
credential authority into one authority artifact.

## Authority Boundary

Authority begins at exact policy evaluation over an `ActionContract`, then proceeds to one-use greenlight/refusal and gateway check. Admission and handle surfaces must explicitly state:

```text
createsAuthority: false
createsPolicyDecision: false
createsGreenlight: false
performsGatewayCheck: false
permitsMutation: false
exportsReceipt: false
mintsTerminalCertificate: false
freshActionContractRequired: true
```

## Gateway Or Enforcement Boundary

The gateway check remains the final pre-mutation enforcement point. For x402, payment material and `PAYMENT-SIGNATURE` remain behind the gateway and only appear after verified gateway evidence. For auth.md, raw credential material remains outside protocol records and credential resolution occurs after gateway check.

If a path cannot enforce at the gateway before mutation, this is advisory, not Handshake.

## Raw Sibling Or Bypass Posture

The plan must preserve raw sibling posture:

- raw x402 payment payload input is forbidden;
- raw bearer/API tokens are forbidden;
- direct HTTP, MCP, browser, package manager, shell, network, cloud, deploy, or database paths are bypass/proof-gap surfaces unless wrapped by a gateway-owned protected path;
- dynamic endpoint/tool construction requires refusal or recrafting;
- stale metadata, changed observed parameters, consumed greenlight replay, idempotency mismatch, gateway policy drift, authority-ref isolation, and credential-ref isolation require refusal or a fresh exact contract.

## Field-Level Acceptance Matrix

| Field Or Surface | May Carry | Must Not Carry | Authority Posture |
| --- | --- | --- | --- |
| `passportPackageDigest` | digest of evidence bundle | identity trust, spend approval, signer material | evidence only |
| `passportPresentationId` | unique intake/presentation ref | policy decision, gateway admission | correlation only |
| `admissionId` | service-side accepted/refused/stale/proof-gap result ref | greenlight, receipt, certificate | readback only |
| `serviceWorkflowHandleId` | workflow context ref | bearer auth, tool permission, credential ref | context only |
| `serviceWorkflowHandleDigest` | digest of handle payload | resource widening, payment payload, signature | integrity only |
| `ServiceWorkflowAdmission` | claim rows, evidence refs, proof gaps, bounds digest | mutation permission, policy/gateway outputs | product surface |
| `ServiceWorkflowHandle` | context refs, expiry, next action requirements | raw secrets, receipts, certificates, signer refs | product surface |
| Action Request | candidate action input | reusable authority | proposal candidate |
| `ActionContract` | exact protected action commitment | execution proof | proposed commitment |
| `PolicyDecision` | allow/refuse/review/halt/quarantine decision | gateway check or mutation proof | policy authority |
| `Greenlight` | one exact gateway-bound use | reusable auth | one-use authority candidate |
| `GatewayCheckAttempt` | pre-mutation enforcement evidence | downstream business success | gateway authority |
| `Receipt` / `ProofGap` | terminal evidence/readback | future permission | terminal evidence |

## Generated-Execution Stress Coverage

Tests and fixtures must cover:

- loops that reuse the handle;
- retries after refusal, proof gap, replay, or isolation;
- branches that change endpoint, amount, resource, payee, gateway, or credential refs;
- dynamic tool names and late-bound parameters;
- stale rendered review;
- parallel proposals from one handle;
- raw sibling MCP/x402/browser/network/package-manager paths;
- generated code that emits a safe-looking output while attempting unsafe work.

## Evidence Readback Separation

Admission readback is not protected-action receipt evidence. Readback must distinguish:

- passport evidence;
- service admission result;
- workflow handle context;
- candidate action;
- action contract;
- policy decision;
- greenlight or refusal;
- gateway check;
- credential resolution after gateway check;
- mutation attempt;
- downstream observation;
- receipt;
- refusal;
- replay refusal;
- proof gap;
- optional terminal certificate.

## Receipt Refusal Proof-Gap Evidence

Receipts prove the Handshake chain, not downstream business success. Refusals are durable product outcomes, not noise. Proof gaps are explicit missing, stale, contradictory, or unavailable evidence. Replay refusal proves one-use authority was already consumed or duplicated. None of these outcomes grants retry permission without a fresh exact contract.

## Non-Claims

No Passport, Admission, Badge, Handle, Certificate, review surface, MCP tool, OpenAPI route, A2A task, x402 payment capability, auth.md credential issuance, runtime profile, host activation artifact, npm package, or registry listing creates authority.

## Blocked Checks

- Field-level negative tests do not exist yet.
- Workflow-handle-specific raw sibling inventory does not exist yet.
- Live external rails are unverified.
- Hosted operation and native host containment remain proof gaps.
