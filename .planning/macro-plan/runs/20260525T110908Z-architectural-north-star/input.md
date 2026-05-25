# Architectural North Star Macro Plan Input

Run id: `20260525T110908Z-architectural-north-star`
Date: 2026-05-25
Mode: `gsd-macro-plan`
Runtime posture: multi-host evidence only, no host-native containment claim
Protected-action posture: one authority spine, projection-only product vocabulary

## User Request

Re-run the macro-plan around the architectural north star. The previous position
created concern that Handshake now has dual product/protocol lanes. The new goal
is end to end: research, plan, implementation, evaluation, review, and commit.

## Invariant At Stake

Handshake must have one authority spine:

```text
CandidateAction / ActionContract
-> PolicyDecision
-> one-use Greenlight or Refusal
-> GatewayCheck before mutation
-> Receipt / Refusal / ReplayRefusal / ProofGap / AuthorityCertificate
```

Product vocabulary may simplify readback and service intake, but it must remain
a projection over that spine. It must not become a peer lane of truth.

## North Star

```text
Product vocabulary = projection/readback over one protected-action event spine.
Protocol kernel = only source of authority state and gateway-enforced mutation.
Surfaces = implementation boundaries for projection and readback, not product
truth lanes.
```

## Research Targets

Primary-source case studies to convert into mechanisms, not analogy:

- Stripe PaymentIntents: lifecycle object, status model, idempotency, retries.
- Kubernetes Admission / OPA Gatekeeper: pre-write chokepoint, rejection,
  validating/mutating separation, reconciliation for side effects.
- HashiCorp Vault: custody, leases, renewal, revocation, audit value.
- GitHub deployment environments: protection rules before jobs proceed.
- AWS IAM: default deny and explicit deny overriding allow.
- SLSA / GitHub artifact attestations / Sigstore family: provenance and
  signed evidence as post-fact verification, not permission.
- Vercel Deployment Protection / Cloudflare Access: product scope/method clarity
  and continuous verification language.

## Source Boundary

Canonical repo truth:

- `AGENTS.md`
- `README.md`
- `QUALITY.md`
- `STRUCTURE.md`
- `docs/internal/decisions.md`
- `docs/internal/protocol-definition.md`
- `docs/internal/protocol-kernel-architecture.md`
- `docs/internal/protocol-layman.md`
- `docs/internal/protocol-notes.md`
- `docs/internal/service-workflow-story.md`

Derived planning input:

- `.planning/macro-map/MACRO-HANDOFF.md`
- `.planning/macro-map/*`
- `.planning/codebase/*`
- prior `.planning/macro-plan/*` product-simplification package

Operational proof:

- `src/protocol/navigation`
- `src/protocol/areas/action-attempt-lifecycle`
- `src/surfaces`
- `src/runtime/ingress`
- `src/cli`
- `src/mcp`
- `examples/service-workflow-admission`
- `test/architecture/*`
- `test/runtime/runtime-ingress.test.ts`
- `test/product/service-workflow-admission.test.ts`

## Cut Lines

- No "product lane" and "protocol lane" as peer truth systems.
- No product surface may create, reinterpret, or bypass protocol authority.
- No Passport, Admission, Handle, Outcome, Certificate, Badge, or review screen
  can be identity, permission, reusable auth, policy, greenlight, gateway
  admission, mutation permission, receipt substitute, hosted trust, or terminal
  settlement.
- No hosted/Tier 3 work may expand kernel/package exports because the projection
  vocabulary is cleaner.

## Desired Outputs

- Revised macro-plan package with source boundary, official research,
  execution slices, runtime gates, protected-action gates, evidence plan,
  review gates, risks, decisions, task JSONL, validation, and sidecar audits.
- Source implementation that changes docs/source/tests from dual-lane language
  to projection-over-spine language.
- Focused tests that fail if product vocabulary becomes a second authority lane.
- Full repo gate or explicitly justified equivalent before closeout.
