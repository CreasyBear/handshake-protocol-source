# Research Evidence

This file is the current-run evidence ledger requested by the evidence sidecar.
It expands `research.md` with claim-to-source boundaries.

## Access Date

2026-05-25

## Claims Supported

| Macro-plan claim | Primary source | Evidence boundary |
| --- | --- | --- |
| Lifecycle clarity should be one object/spine, not multiple truth lanes. | Stripe PaymentIntents docs and lifecycle docs. | Supports status/idempotency design inspiration only; does not prove Handshake payments or Stripe parity. |
| Enforcement must happen at a chokepoint before mutation/persistence. | Kubernetes admission-control docs and OPA Kubernetes admission docs. | Supports gateway/admission design pattern only; does not make service workflow admission a Kubernetes-style admission controller. |
| Custody material must remain revocable/fresh and behind custody boundaries. | HashiCorp Vault lease docs. | Supports custody/freshness mechanism only; does not prove provider/customer custody in Handshake. |
| Deployment/protected execution gates are conditions before execution proceeds. | GitHub deployment environments docs. | Supports per-event protection gate framing only; does not turn approvals into mutation authority. |
| Deny/refusal/proof-gap blockers should dominate convenience. | AWS IAM policy evaluation docs. | Supports default/explicit deny discipline only; Handshake policy logic remains source-owned. |
| Attestations/provenance are verification evidence, not permission. | SLSA levels and GitHub artifact-attestation docs. | Supports receipt/certificate evidence framing only; does not claim public transparency log or SLSA compliance. |
| Product scope/method must be explicit and reverified. | Vercel Deployment Protection and Cloudflare ZTNA docs. | Supports product copy discipline only; does not turn Handshake into an access-control product. |

## Disconfirming Boundaries

- Stripe PaymentIntents can expose a client secret for client-side payment flow;
  Handshake must not copy that pattern into Passport, Admission, Handle, or
  Clearance.
- Kubernetes admission applies to API-server writes; Handshake service workflow
  admission is evidence/readback mapping before protected-action clearance.
- Vault leases manage secrets; Handshake handles are not lease IDs or
  credentials.
- GitHub deployment approval does not model generated-code inner mutations.
- AWS IAM is ambient principal authorization; Handshake requires exact per-event
  contracts and one-use gateway-bound greenlights.
- SLSA/Sigstore/in-toto evidence verifies provenance; it does not authorize the
  next action.
- Vercel/Cloudflare are access-control products; Handshake is execution-control
  infrastructure.
