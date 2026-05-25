# Protected-Action Gates

## Invariant At Stake

Every consequential mutation must pass through the single protected-action
authority spine. Projection/readback vocabulary cannot become a shortcut around
candidate compilation, exact contract, policy, one-use greenlight/refusal,
gateway check, or terminal evidence.

## Source Boundary

Protected-action truth lives in `src/protocol`, `src/adapters`, gateway tests,
runtime tests, product tests, and canonical docs. This planning file defines
gates only; it does not create authority or gateway enforcement.

## Authority Spine

```text
runtime/projection context
-> CandidateAction
-> ActionContract
-> PolicyDecision
-> one-use Greenlight or Refusal
-> GatewayCheck before mutation
-> Receipt / Refusal / ReplayRefusal / ProofGap / AuthorityCertificate
```

## Protected-Action Triggers

- any generated runtime dispatch that may mutate a protected surface;
- any x402 payment attempt;
- any auth.md-backed protected API call;
- any package/repo/preview/cloud/database/deploy mutation path;
- any retry, branch, loop, or sibling call that changes endpoint, payee,
  resource, gateway, credential, delegated authority, body digest, or payment
  requirement.

## Candidate Actions

Candidate actions are proposed commitments only. Passport, Admission, Handle,
Badge-like labels, Clearance wording, Outcome readback, and Certificate evidence
can provide context or references, but they cannot satisfy candidate creation or
contract proposal requirements.

## Authority Boundary

Authority begins only at exact policy greenlight and is usable only once after a
gateway verifies the same exact contract before mutation. Refusals, proof gaps,
isolation, stale posture, and explicit deny conditions dominate projection
convenience.

## Gateway Or Enforcement Boundary

The gateway check is the final pre-mutation enforcement point. SDK clients,
HTTP routes, CLI commands, MCP resources, demos, review screens, receipts, and
projection maps are not gateway enforcement.

## Raw Sibling Or Bypass Posture

Raw sibling package managers, x402 signers, auth.md credentials, browser tools,
direct HTTP/network calls, shell commands, cloud/deploy APIs, and database paths
must be prevented, isolated, or recorded as bypass/proof-gap evidence. Projection
vocabulary cannot claim containment over them.

## Generated-Execution Stress Coverage

Coverage must include loops, retries, branches, dynamic tool construction,
late-bound parameters, stale review/handle evidence, changed observed
parameters, raw sibling paths, replay, ambiguous commits, proof gaps, isolation,
mixed-family same-envelope checks, and x402/auth.md non-composition.

## Evidence Readback Separation

Receipts, refusals, replay refusals, proof gaps, authority certificates,
support bundles, release proof, and projection maps are readback/evidence. They
must distinguish gateway admission from downstream execution/finality and must
not become permission for future attempts.

## Receipt Refusal Proof-Gap Evidence

Every terminal projection must identify whether the source event is a receipt,
policy/gateway/runtime refusal, replay refusal, proof gap, isolation consequence,
or terminal certificate. Missing evidence stays a proof gap.

## Projection Vocabulary Matrix

| Product noun | Allowed use | Required protected-action gate | Forbidden meaning |
| --- | --- | --- | --- |
| Passport | Presented evidence package digest/reference | Fresh candidate and exact contract still required | identity, trust, permission, reusable auth |
| ServiceWorkflowAdmission | Service-side accepted/refused/stale/proof-gap mapping | No policy/gateway authority until fresh clearance | policy approval, gateway admission, receipt |
| ServiceWorkflowHandle | Correlation/readback context for later proposals | May only populate context refs on a fresh request | bearer token, retry permission, greenlight |
| Clearance | Fresh protected-action path | Must include policy/refusal and gateway check before mutation | workflow-level permission |
| Outcome | Terminal event projection | Must derive from receipt/refusal/replay/proof-gap/certificate evidence | downstream success or future authority |
| Certificate | Terminal verification evidence | Must be terminal and verifiable; never pre-action | permission, identity, settlement, hosted trust |
| Badge-like UI | Read-only state label derived from evidence | No schema/protocol/export route authority | executable grant or bearer credential |

The source-owned projection map for these terms belongs under `src/surfaces` and
must validate any lifecycle keys against the existing action-attempt lifecycle.
It must not add a stored protocol object.

## Field-Level Acceptance Matrix

| Field/material | Allowed in projection | Authority posture |
| --- | --- | --- |
| `passportPackageDigest` | yes | correlation only |
| `passportPresentationId` | yes | presentation event only |
| `admissionId` | yes | service-side mapping only |
| `serviceWorkflowHandleId` | yes | readback/context only |
| `serviceWorkflowHandleDigest` | yes | context integrity only |
| `ActionContract` refs | context refs only | proposed commitment, not permission |
| `PolicyDecision` refs | readback after source record | protocol authority state only |
| `Greenlight` refs | never as projection input authority | one-use gateway-bound only |
| `GatewayCheck` refs | readback after source record | enforcement evidence only |
| raw credential/payment/signature material | no | gateway/custody only |

## x402/auth.md Gates

- x402 remains one buyer-side `x402_payment.exact` per-call path.
- PaymentPayload and `PAYMENT-SIGNATURE` remain behind a verified gateway check.
- auth.md evidence can support provenance/custody posture but cannot combine
  with x402 into composite authority.
- A generated block containing both auth.md and x402 must produce separate fresh
  exact contracts or a refusal/proof gap. It cannot produce one composite
  credential-plus-payment authority artifact.
- External sandbox/live provider, settlement/finality, facilitator operation,
  seller middleware, aggregate spend enforcement, and provider custody remain
  proof gaps unless separately proven.

## Hosted/Tier 3 Gate

Service workflow projection clarity is not hosted-operation readiness. Hosted
operation, hosted org auth, retention/search, marketplace trust, cross-org
trust, or new kernel exports require a separate hosted workspace or fresh
pre-hosted kernel task.

## Non-Claims

These gates do not prove hosted operation, provider/customer custody,
settlement/finality, facilitator operation, seller middleware, marketplace
trust, cross-org trust, aggregate spend enforcement, native host containment,
or product UX completion.

## Blocked Checks

- live x402 custody and settlement;
- provider/customer gateway custody;
- hosted operation and hosted org auth;
- marketplace/certification and cross-org trust;
- broad runtime interception or raw sibling inventory;
- UI/product comprehension proof.

## Stop Condition

Stop if any projection noun is accepted as policy input authority, gateway
binding, signer/custody material, mutation command, receipt export, certificate
minting input, or reusable authorization.
