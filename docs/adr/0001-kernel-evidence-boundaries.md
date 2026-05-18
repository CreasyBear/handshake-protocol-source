# ADR 0001: Kernel Evidence Boundaries

Status: Accepted and implemented
Date: 2026-05-18
Owner: Protocol owner

## Invariant At Stake

Evidence must not become authority.

Handshake may record generated execution evidence, install posture, review artifacts,
and local fixture proof, but consequential mutation authority still flows only through:

```text
exact ActionContract
  -> PolicyDecision
  -> one-use Greenlight
  -> GatewayCheckAttempt before mutation
  -> Receipt, refusal, or ProofGap
```

## Decision

The v0.2.3 kernel adds five narrow evidence-boundary changes:

1. `RuntimeExecutionRecord` records the generated execution block that produced one
   or more candidate actions. It captures execution shape, runtime posture, code or
   spec digests, observed tool calls, dynamic dispatch flags, unobserved regions,
   uncertainty, and refusal evidence. It does not create contracts, policy decisions,
   greenlights, gateway checks, or mutations.
2. `ProtectedPathPosture` records the current truth of one protected runtime/gateway
   path. It is append-only evidence plus a current-posture index. Policy may refuse
   an exact contract when the current posture cannot satisfy an envelope that requires
   a gateway-checked path. Runtime probes and operator attestations may be evidence,
   but they cannot satisfy `gateway_checked` posture without a gateway, conformance
   fixture, or hosted monitor source authority. The gateway still performs the final
   pre-mutation check.
3. `GatewayRegistryEntry` carries explicit credential custody and enforcement-mode
   fields so gateway authority claims are digest-pinned into candidates and contracts.
4. `ReviewArtifactRecord` records the rendered review artifact and its digest bindings.
   A `ReviewDecision` may approve only when it references a durable review artifact
   whose rendered contract, policy input, gateway policy, and uncertainty evidence
   match the exact decision being reviewed.
5. A local `preview_deploy.create` fixture proves the preview-deploy action shape
   against a provider-shaped local gateway. It is a local proof only, not Vercel,
   Cloudflare, GitHub Deployments, or provider-side enforcement.
6. HTTP transition APIs require caller custody before they create records or
   evaluate authority-adjacent state. The route split is explicit:
   `control_plane`, `runtime_evidence`, `gateway_custody`, and `review_custody`.
   These bearer-token checks protect transition entrypoints; they do not replace
   contract, policy, greenlight, or gateway enforcement.

Protocol version moves from `0.2.2` to `0.2.3` because these are alpha-breaking
schema and transition changes.

## Non-Claims

- Runtime execution evidence is not permission.
- Protected path posture is not a gateway check.
- Hosted control-plane policy is not provider-side enforcement.
- A local preview-deploy fixture is not production provider enforcement.
- A review artifact is not authority unless it is bound to the exact contract and
  policy input that policy evaluates.
- A current posture index is not a mutable source of truth by itself; it points at
  append-only posture evidence.
- A route bearer token is not principal identity, organization membership, or
  gateway authority. It is only an HTTP caller custody check before transition
  code runs.

## Rollout Sequence

1. Add schema/version changes, ADR, and storage support for current posture.
2. Add transition APIs for runtime execution, protected path posture, and review artifacts.
3. Bind runtime execution evidence into intent compilation and action contracts.
4. Bind protected posture into policy input digest and gateway re-checks.
5. Bind review decisions to durable review artifacts.
6. Add the local preview-deploy runtime and gateway fixture.
7. Update HTTP, SDK, OpenAPI, docs, and invariant tests.
8. Add caller custody checks to HTTP transition routes and SDK token forwarding.

## Quality Contract

| Lens | Applies? | Target | Hard Stops | Evidence Required | Closeout |
|---|---:|---:|---|---|---|
| Product / CEO | yes | hard gate | Product claim exceeds gateway enforcement | non-claim scan, tier-state docs | closed |
| Engineering | yes | hard gate | Ambiguous transition or untested branch | state tests, D1 tests, typecheck | closed |
| Security / CSO | yes | hard gate | Caller self-asserts authority or hides raw bypass | posture, custody, gateway refusal tests | closed |
| DevEx | yes | 8/10 | SDK, HTTP, docs, or OpenAPI disagree | Hono, SDK, OpenAPI tests | closed |
| Design | conditional | hard gate | Review can approve a summary not bound to exact digest | review artifact binding tests | closed |
| Architecture | yes | 8/10 | Evidence objects duplicate authority semantics | module map, ADR, deletion test | closed |
| Domain Invariant | yes | hard gate | Mutation without exact contract, greenlight, gateway check, or proof gap | invariant test matrix | closed |

## Outside-Voice Risk Accepted

An outside review recommended splitting this work into ADR-first slices. The chosen
implementation keeps the full five changes in one branch because the current product
claim risk spans all five boundaries. The mitigation is strict sequencing and tests:
new objects must be transition-created, policy-relevant posture must bind into
policy and gate evidence, and preview deploy must remain local fixture proof.

## Smallest Next Mechanism

Replace static transition bearer tokens with organization-scoped caller identity
and role claims before any multi-tenant hosted deployment.

## Closeout

Implemented in v0.2.3 on 2026-05-18.

- Runtime execution, protected-path posture, and review artifact records are
  transition-created evidence records.
- Protected-path posture is policy-relevant only when fresh, scope-bound, and
  sourced from gateway/conformance/hosted-monitor authority.
- Gateway checks reload current posture before mutation when policy depended on
  enforcing posture.
- Review decisions require a durable review artifact whose digest bindings match
  the exact contract, policy input, gateway policy, and uncertainty rendering.
- Local preview deploy remains a fixture proof only and records downstream
  uncertainty as proof gap evidence.
- HTTP transition routes now require explicit caller custody tokens before route
  bodies are parsed or transitions are invoked.
