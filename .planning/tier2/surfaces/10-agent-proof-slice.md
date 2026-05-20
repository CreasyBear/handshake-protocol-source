# Agent Proof Slice (APS) - Tier 2 Activation Proof

Status: planning scratch, rewritten 2026-05-20.
Audience: Tier 2 implementers, runtime/gateway integrators, plan-devex-review,
plan-eng-review.
Source anchors: `AGENTS.md`, `README.md`,
`docs/internal/protocol-definition.md`,
`docs/internal/protocol-kernel-architecture.md`,
`.planning/tier2/README.md`,
`.planning/tier2/surfaces/00-surface-design-principles.md`,
`.planning/tier2/surfaces/04-v1-inventory.md`,
`.planning/tier2/06-policy-agent-management-interface-map.md`,
`.planning/codebase/CONCERNS.md`.

This file is scratch. It is not repo canon, not a public roadmap, and not an
implementation claim.

## Invariant at stake

APS must prove that an automated runtime can propose consequential work without
receiving mutation authority, and that the protected gateway remains the only
place where consequence can happen.

If APS turns into "agent payments", "approval UX", "observability", or a nice
x402 demo, it violates the product kernel. The primitive is still:

```text
observed generated execution
-> exact action contract
-> policy decision
-> one-use gateway-bound greenlight or refusal
-> gateway check before mutation
-> receipt, refusal, proof gap, isolation, or recovery evidence
```

## Rewrite verdict

The previous APS draft treated x402 as the Tier 1 product proof and carried
stale blockers around route custody, invented proof scripts, and a package
install comparison that no longer matches the current kernel. Cut that framing.

APS is now a Tier 2 activation slice over the landed local authority kernel.
x402 remains the worked proof profile because paid HTTP stresses wallet custody,
exact parameter binding, replay, downstream uncertainty, and evidence
reconstruction. It does not define the product.

## APS thesis

An agent runtime should be able to:

1. Observe generated orchestration that attempts a consequential action.
2. Reduce that attempt to a catalog-bound, exact proposed action contract.
3. Receive either a contract handle or a structured refusal/challenge.
4. Hold no install authority, policy authority, gateway authority, wallet key,
   mutation credential, or greenlight minting capability.
5. Read redacted evidence after policy/gateway activity.
6. Reconstruct whether the chain ended in receipt, refusal, proof gap,
   isolation, or recovery.

That is enough for a first developer-facing proof. It is not enough to claim
hosted operation, cross-org clearing, broad MCP safety, or an agentic economy
clearing house.

## APS is not

- Not a generic x402 payment SDK.
- Not a wallet-hosting product.
- Not an approval screen.
- Not a hosted verifier.
- Not MCP productization.
- Not a CLI product.
- Not package-install certification.
- Not a conformance mark.
- Not a claim that all agent actions are controlled.
- Not a claim that downstream business success is proven.

## Why x402 remains the worked proof profile

| Proof profile | Why it belongs | What it does not prove |
| --- | --- | --- |
| `x402_payment.exact` | Exercises money movement, wallet-signature custody, exact paid-HTTP parameters, replay, and downstream proof gaps. | General product scope, hosted wallet custody, session/day spend-window ledgers, provider trust, or universal payment safety. |
| `package_install.npm` | Exercises package-manager bypass, material evidence, lifecycle risk, and supply-chain regression. | Payment semantics, wallet custody, or paid-HTTP proof. |
| preview deploy / repo write | Future reference profiles for cloud/repo mutation paths. | Nothing until an installed gateway path exists. |

x402 is the best local APS profile because payment consequence is obvious and
gateway custody is testable. It must remain a proof profile, not the product
center.

## Current architecture snapshot

The old APS draft had several blockers that are now false. Current source state:

- Protocol version is `0.2.4`.
- `/v0.2/action-contracts` requires `runtime_evidence` custody.
- Runtime execution, generated graph, tool-call draft, and intent compilation
  routes require `runtime_evidence` custody.
- Policy decisions, isolation, breaker decisions, recovery records, and receipt
  exports are `control_plane` custody.
- Bypass probes, protected-path posture, gateway checks, and downstream
  reconciliation are `gateway_custody`.
- Review artifacts and review decisions are `review_custody`.
- Evidence projections are readable by `review_custody` and `runtime_evidence`;
  reads are redacted diagnostics, not authority.
- `ProtectedActionMetadata`, `ProtectedActionRequest`,
  `ProtectedActionChallenge`, and `ProtectedActionEvidenceProjection` exist as
  non-authority representation schemas.
- Runtime ingress supports wrapped/raw/ambiguous package-install and x402
  dispatch observations.
- The local x402 D1/HTTP proof profile covers proposal, policy, gateway check,
  wallet signature after admission, replay refusal, parameter mismatch refusal,
  and proof gap recording.
- `AuthorityCertificate` exists as a local terminal-evidence export. It is not
  hosted trust, JWKS, revocation, provider custody, or cross-org clearing.

## Custody matrix

| Surface | Current custody holder | APS rule |
| --- | --- | --- |
| Tool/action/gateway catalog registration | `control_plane` | Operator/setup only. Never agent-facing authority. |
| Operating envelope registration | `control_plane` | Authorizes attempts, not mutation. |
| Runtime execution evidence | `runtime_evidence` | Agent/runtime may record what generated code attempted. |
| Generated execution graph | `runtime_evidence` | Evidence only; not permission. |
| Tool-call draft creation/transition | `runtime_evidence` | Captures generated dispatch state before contract. |
| Intent compilation | `runtime_evidence` | Emits candidate/refusal boundary; never permission. |
| Action contract proposal | `runtime_evidence` | Produces proposed exact contract; never greenlight. |
| Policy decision / greenlight | `control_plane` | Machine decision layer; greenlight is one-use and gateway-bound. |
| Review artifact / review decision | `review_custody` | Human review evidence bound to exact digests; never gateway authority. |
| Bypass probe / path posture | `gateway_custody` | Gateway-owned protected-path evidence. |
| Gateway check | `gateway_custody` | Final enforcement point before mutation. |
| Surface operation reconciliation | `gateway_custody` | Downstream observation only; no fresh authority. |
| Evidence projection reads | `review_custody` or `runtime_evidence` | Redacted reconstruction only. |

An APS agent must not be able to call install, policy, greenlight, gateway
check, reconcile, isolation, or receipt-export transitions.

## The APS happy path

```text
operator/control_plane:
  register tool catalog, action catalog, gateway registry, envelope

gateway/gateway_custody:
  record bypass probes and protected-path posture

runtime/runtime_evidence:
  observe generated x402 dispatch block
  create runtime execution evidence
  create generated execution graph
  create/finalize tool-call draft
  compile intent
  propose action contract

control_plane:
  evaluate policy
  record one-use greenlight or refusal

gateway/gateway_custody:
  verify exact greenlight binding
  only then create wallet payment signature / mutation attempt
  emit receipt or proof gap
  reconcile downstream state if available

runtime or reviewer:
  read redacted evidence projections
  optionally verify a local terminal AuthorityCertificate
```

The magical developer moment is not "the payment succeeds". It is seeing that
the agent can propose a paid action and read evidence, but the wallet signature
only appears after gateway admission against the exact contract.

## Developer target

Primary persona: runtime or gateway engineer integrating Handshake into an
engineering-agent stack.

Their job is not to become a Handshake protocol expert. Their job is:

```text
wrap one consequential path
-> observe generated dispatch
-> propose exact contract
-> let policy/gateway own authority
-> read reconstructable evidence
```

APS is successful when this engineer can explain four things without reading
internal state-machine code:

1. What generated action was attempted.
2. Why the runtime could propose but not execute.
3. Where the gateway enforced exact authority.
4. What evidence survives if the action is refused, replayed, mismatched, or
   downstream proof is missing.

Target time-to-first-hard-proof for a future public flow: under 10 minutes from
clone/install to a local x402 contract, refusal/proof-gap, receipt timeline, and
terminal evidence verification. The current repo has tests and source APIs, not
yet that public developer command.

## Public APS shape

APS should expose four safe surfaces over the current kernel.

| Surface | Purpose | Non-authority rule |
| --- | --- | --- |
| `ProtectedActionMetadata` | Tell an automated client what it may propose and what evidence/policy shape applies. | Must include `authorityCreated: false`, no greenlight, no gateway check, no mutation. |
| `ProtectedActionRequest` | External proposal envelope that compiles into runtime evidence and candidate action. | Must not bypass intent compilation or canonicalization. |
| `ProtectedActionChallenge` | Structured refusal/proof-gap navigation. | Must not negotiate authority or hide mutation ambiguity. |
| `ProtectedActionEvidenceProjection` / transaction envelope | Redacted reconstruction of graph, contract, receipt, idempotency, posture, and proof gaps. | Must never include raw internal records, mutation commands, secrets, or fresh authority. |

`AuthorityCertificate` can be shown as an optional terminal evidence export once
there is a terminal receipt/refusal/proof-gap/isolation/recovery state. It must
not become a cross-org trust claim in APS.

## Canonical local x402 request shape

The APS x402 request should be a representation over the current adapter input,
not a new authority primitive:

```json
{
  "schemaVersion": "0.2.4",
  "tenantId": "tenant_demo",
  "organizationId": "org_demo",
  "createdAt": "2026-05-20T00:00:00.000Z",
  "requestId": "req_x402_demo",
  "metadataRef": "pam_x402_demo",
  "principalIntentRef": "intent_upgrade_staging",
  "generatedCodeOrSpecRef": "codeblock_x402_001",
  "runtimeExecutionId": "runexec_001",
  "generatedExecutionGraphId": "graph_001",
  "generatedExecutionNodeId": "node_001",
  "toolCallDraftId": "draft_001",
  "actionClass": "x402_payment.exact",
  "resourceRef": "x402:https://api.example.test/paid-report:base-sepolia:0xpayee",
  "parameters": {
    "endpointUrl": "https://api.example.test/paid-report",
    "payee": "0xpayee",
    "network": "base-sepolia",
    "token": "USDC",
    "atomicAmount": "1000",
    "paymentRequirementsDigest": "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    "facilitatorRef": "facilitator:local"
  },
  "nonSecretParamsSummary": {
    "endpointUrl": "https://api.example.test/paid-report",
    "payee": "0xpayee",
    "network": "base-sepolia",
    "token": "USDC",
    "atomicAmount": "1000",
    "paymentRequirementsDigest": "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    "facilitatorRef": "facilitator:local"
  },
  "secretRefs": {},
  "idempotencyKey": "x402-payment:demo",
  "evidenceRefs": ["evidence:x402-payment-required:aaaaaaaaaaaaaaaa"],
  "requestedAt": "2026-05-20T00:00:00.000Z",
  "authorityCreated": false,
  "greenlightRef": null,
  "gatewayCheckRef": null,
  "mutationAttemptRef": null
}
```

The corresponding runtime dispatch observation is narrower and belongs to
runtime ingress:

```json
{
  "principalIntentRef": "intent_upgrade_staging",
  "generatedCodeOrSpecRef": "codeblock_x402_001",
  "dispatchBoundaryRef": "runtime-adapter:demo",
  "graphNonce": "nonce-demo-001",
  "truncationStatus": "complete",
  "unobservedRegionRefs": [],
  "dispatches": [
    {
      "dispatchKind": "wrapped_x402_payment",
      "dispatchRef": "dispatch_x402_001",
      "generatedCodeOrSpecRef": "codeblock_x402_001",
      "dynamicToolConstructionDetected": false,
      "lateBoundParameterRefs": [],
      "retryOfDispatchRef": null,
      "branchRef": null,
      "loopIteration": null,
      "endpointUrl": "https://api.example.test/paid-report",
      "payee": "0xpayee",
      "network": "base-sepolia",
      "token": "USDC",
      "atomicAmount": "1000",
      "paymentRequirementsDigest": "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      "facilitatorRef": "facilitator:local",
      "evidenceRefs": ["evidence:x402-payment-required:aaaaaaaaaaaaaaaa"]
    }
  ],
  "evidenceRefs": ["evidence:runtime-transcript:demo"]
}
```

These shapes can propose. They cannot evaluate policy, mint a greenlight, run a
gateway check, sign a payment, or mutate a protected surface.

## Challenge shape

APS must make refusal and proof gap first-class. Example:

```json
{
  "schemaVersion": "0.2.4",
  "tenantId": "tenant_demo",
  "organizationId": "org_demo",
  "createdAt": "2026-05-20T00:00:00.000Z",
  "challengeId": "challenge_x402_amount_bound",
  "phase": "compilation",
  "actionContractRef": null,
  "refusedObjectRef": "dispatch_x402_001",
  "proofGapRef": null,
  "reasonCode": "x402_amount_exceeds_call_bound",
  "retryability": "terminal",
  "commitState": "not_started",
  "mutationAttempted": false,
  "rawInternalRecordIncluded": false,
  "evidenceRefs": ["evidence:x402-payment-required:aaaaaaaaaaaaaaaa"],
  "nextStepKind": "recraft_request",
  "authorityCreated": false,
  "greenlightRef": null,
  "gatewayCheckRef": null,
  "mutationAttemptRef": null
}
```

If downstream payment confirmation is missing after a gateway-admitted attempt,
the challenge/projection must say proof gap. It must not imply downstream
business success.

## Hostile trace catalog

APS must preserve these hostile cases as product-facing evidence, even if the
implementation uses existing tests underneath.

| Case | Required APS outcome | Current anchor |
| --- | --- | --- |
| Agent tries to propose with `control_plane` token | Rejected as wrong custody; proposal is runtime evidence only. | `test/http/http.test.ts` |
| Agent tries to call policy/gateway routes | Rejected as wrong custody. | `test/http/http.test.ts` |
| Wrapped x402 call within bound | Produces runtime evidence and proposed contract only. | `test/runtime/runtime-ingress.test.ts` |
| x402 amount above `maxAtomicAmountPerCall` | Candidate refusal/challenge, no contract. | `src/adapters/x402-payment/action-proposal.ts` |
| Raw sibling x402 payment path | Refusal/challenge or bypass evidence, no greenlight. | `test/runtime/runtime-ingress.test.ts` |
| Ambiguous x402 dispatch | Refusal/challenge, no greenlight. | `test/runtime/runtime-ingress.test.ts` |
| Dynamic tool construction / late-bound parameter refs | Captured as uncertainty; must not silently contract. | `src/runtime/ingress/index.ts` |
| Gateway receives mismatched params | Refusal before wallet signature. | `test/integration/x402-d1-http.test.ts` |
| Greenlight replay | Rejected; no second mutation. | `test/integration/x402-d1-http.test.ts` |
| Downstream proof missing | Proof gap, not receipt theatre. | `test/integration/x402-d1-http.test.ts` |
| Evidence read attempts to expose internals | Redacted projection only. | `test/protocol/representation-contract.test.ts` |
| Terminal evidence certificate tampered | Verification fails. | `test/protocol/authority-certificate.test.ts` |

## Plan-eng review

Brutal verdict: keep the slice, narrow the claim, and make the next work a
single product-level proof test before any CLI/MCP surface.

Execution concerns:

- Do not build a new control plane for APS.
- Do not add a second x402 adapter path.
- Do not invent `prove:*` scripts until there is a real product-level test to
  wrap.
- Do not expose policy, gateway, install, receipt export, or internal store
  APIs to the agent.
- Do not let `ProtectedActionRequest` bypass runtime evidence or intent
  compilation.
- Do not let evidence projection reads become raw record reads.
- Do not claim session/day/review spend-window enforcement. Current local
  x402 bounds prove atomic amount per call.
- Do not claim hosted gateway custody, provider custody, JWKS, revocation, or
  cross-org clearing.

Minimum implementation path:

1. Add one product-level APS regression that stitches existing x402 runtime
   ingress, proposal, policy, gateway, evidence projection, and terminal
   certificate verification.
2. Assert that the runtime token can propose and read redacted evidence only.
3. Assert that gateway/policy/wallet authority remains outside runtime custody.
4. Assert that mismatch, replay, raw sibling dispatch, and proof gap produce
   refusal/challenge/evidence, not fake receipts.
5. Only after that test is green, consider a tiny developer command that runs
   the same proof.

## Plan-devex review

Brutal verdict: APS is understandable only if the first developer experience is
"watch authority stay out of the runtime", not "make an x402 payment".

Developer-facing assets should be ordered like this:

1. One-page local proof walkthrough.
2. One source-owned product regression.
3. One minimal command wrapping that regression.
4. Optional MCP/SDK convenience after the proof is already stable.

The first screen or walkthrough must show:

- observed generated dispatch;
- exact action contract digest;
- policy outcome;
- gateway check outcome;
- payment signature or refusal/proof gap;
- redacted evidence projection;
- terminal certificate verification if terminal evidence exists.

The walkthrough must not hide:

- which custody role made each transition;
- that the agent never receives wallet/gateway authority;
- that evidence reads are not execution authority;
- that x402 is only the worked proof profile;
- that hosted/cross-org claims are future.

## Acceptance tests

The APS implementation should not duplicate every low-level invariant. It should
compose the source-owned tests into one product story.

| Layer | Existing proof | APS gap |
| --- | --- | --- |
| Route custody | `test/http/http.test.ts` | Product-level assertion that runtime custody cannot cross into policy/gateway. |
| Runtime ingress | `test/runtime/runtime-ingress.test.ts` | Product-level x402 graph from generated dispatch to contract/challenge. |
| x402 D1/HTTP | `test/integration/x402-d1-http.test.ts` | Product-level proof that wallet signature appears only after gateway check. |
| Representation | `test/protocol/representation-contract.test.ts` | Product-level proof that metadata/request/challenge/projection never mint authority. |
| Authority certificate | `test/protocol/authority-certificate.test.ts` | Product-level proof that terminal evidence can be verified offline without hosted claims. |
| Claim boundary | `test/architecture/claim-boundary.test.ts` | Product-level proof that runtime ingress stays curated, not root-exported as broad protocol. |

## Evidence requirements

APS is not green until the product-level proof leaves these reconstructable
references:

- runtime execution id;
- generated execution graph id;
- tool-call draft id;
- intent compilation id;
- candidate action id or refusal/challenge id;
- action contract id when proposed;
- policy decision id;
- greenlight id only when policy admits;
- gateway check id only when gateway attempts;
- mutation attempt id only when mutation is attempted;
- receipt id when evidence is sufficient;
- proof gap id when evidence is missing or downstream state is ambiguous;
- terminal certificate id only for terminal evidence exports.

Any missing link is either a refusal or a proof gap. It is not a TODO comment in
the receipt.

## Product non-claims

APS must explicitly refuse these claims:

- "Handshake secures x402 payments" - false. It proves one local protected x402
  path.
- "Handshake is agent auth" - false. It separates principal authority, runtime
  evidence, policy, and gateway custody.
- "The agent approved a payment" - false. The agent proposed an exact action;
  policy and gateway admitted or refused it.
- "The receipt proves the business outcome" - false unless downstream evidence
  exists and is bound.
- "The review screen authorized execution" - false unless it is bound to exact
  contract/policy digests and the gateway enforces the greenlight.
- "The certificate proves ecosystem trust" - false in APS. Local terminal
  certificate verification is not hosted trust or cross-org clearing.

## Future surfaces after APS

Only after the product-level APS proof is green:

- SDK wrapper for `ProtectedActionMetadata`, `ProtectedActionRequest`,
  `ProtectedActionChallenge`, and redacted evidence projections.
- MCP read/propose surface that follows the v1 inventory and excludes install,
  policy, gateway, and mutation tools.
- CLI wrapper for the local proof flow.
- Generic transaction-envelope projection across x402 and package-install.
- Hosted evidence navigation in Tier 3.
- Cross-org verification and clearing-house trust in Tier 4.

## Smallest next mechanism

Add one `test/product/agent-proof-slice.test.ts` that uses the current x402
runtime ingress and D1/HTTP proof profile to assert:

```text
runtime can propose and read redacted evidence
runtime cannot install, evaluate policy, mint greenlight, gateway-check, or sign
gateway signature appears only after exact gateway admission
replay, mismatch, raw sibling dispatch, and missing downstream proof become refusal/challenge/proof-gap evidence
terminal evidence can be locally verified without hosted trust claims
```

Do that before building any APS CLI, MCP surface, dashboard, hosted verifier, or
clearing-house language.
