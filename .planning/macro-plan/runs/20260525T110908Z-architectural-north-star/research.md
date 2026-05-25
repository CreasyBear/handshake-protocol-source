# Architectural Case Study Research

## Invariant At Stake

External products are useful only if they become mechanisms for Handshake's
single authority spine. They must not become borrowed analogy or permission
theatre.

## Primary Sources Checked

- Stripe PaymentIntents:
  `https://docs.stripe.com/payments/payment-intents` and
  `https://docs.stripe.com/payments/paymentintents/lifecycle`
- Kubernetes Admission Control:
  `https://kubernetes.io/docs/reference/access-authn-authz/admission-controllers/`
- OPA for Kubernetes admission:
  `https://www.openpolicyagent.org/docs/kubernetes`
- HashiCorp Vault leases:
  `https://developer.hashicorp.com/vault/docs/concepts/lease`
- GitHub deployment environments:
  `https://docs.github.com/en/actions/reference/workflows-and-actions/deployments-and-environments`
- AWS IAM policy evaluation:
  `https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_evaluation-logic_policy-eval-denyallow.html`
- SLSA security levels:
  `https://slsa.dev/spec/v1.0/levels`
- GitHub artifact attestations:
  `https://docs.github.com/en/actions/concepts/security/artifact-attestations`
- Vercel Deployment Protection:
  `https://vercel.com/docs/deployment-protection`
- Cloudflare ZTNA access policies:
  `https://developers.cloudflare.com/reference-architecture/design-guides/designing-ztna-access-policies/`

## Mechanisms To Import

| Source | Mechanism | Handshake translation |
| --- | --- | --- |
| Stripe PaymentIntents | One lifecycle object tracks a payment across status changes, retries, and idempotency. | Define one protected-action event spine and make friendly vocabulary projections of it. |
| Kubernetes Admission | Write requests hit admission before persistence; rejection halts the whole request. Side effects need reconciliation. | Gateway check remains the pre-consequence chokepoint; downstream uncertainty becomes receipt/proof-gap reconciliation. |
| OPA Gatekeeper | Policy is queried by the API server on create/update/delete, not by UI copy. | Policy is machine-evaluated against exact action contracts, not product summaries. |
| Vault | Dynamic secret leases force renewal/replacement and support revocation. | Handles and readiness are freshness-bound context, never reusable auth. Credential material stays behind custody/gateway. |
| GitHub environments | Deployment protection rules must pass before jobs referencing an environment proceed. | Protected-action clearance gates each consequential event before mutation. |
| AWS IAM | Default deny and explicit deny override allow. | Refusals, isolation, stale evidence, and bypass posture must dominate product convenience. |
| SLSA / artifact attestations | Provenance establishes build origin and process for verification. | Receipts/certificates are terminal evidence and reconstruction, not permission. |
| Vercel / Cloudflare | Clear protection scope/method; continuous verification avoids stale auth assumptions. | Product copy must name scope and method; every protected action rechecks fresh authority instead of trusting workflow admission. |

## Anti-Mechanisms To Avoid

- `client_secret`-style bearer material leaking into Passport, Admission, or
  Handle.
- Kubernetes-style admission being misread as Handshake service admission.
- Vault lease IDs being treated as permission rather than management handles.
- Deployment approval becoming approval of all generated-code mutations.
- Attestation/certificate being treated as future authority.
- Access-control product language being substituted for execution-control
  enforcement.

## Architectural Conclusion

Handshake should not have product/protocol lanes. It should have:

```text
Projection/readback vocabulary
over one protected-action event lifecycle
over exact policy and gateway enforcement
over append-only evidence and recovery.
```
