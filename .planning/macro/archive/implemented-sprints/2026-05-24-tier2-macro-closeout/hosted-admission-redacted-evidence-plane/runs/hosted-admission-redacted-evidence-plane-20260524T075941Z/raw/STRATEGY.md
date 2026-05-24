# STRATEGY Perspective

## Invariant At Stake

Hosted Handshake must not turn transport admission plus redacted storage into a product claim that exceeds enforcement. If hosted mode cannot prove caller admission, tenant-scoped evidence reads, redaction posture, deployment binding correctness, and secret handling, then it is a demo seam, not an operated evidence plane.

## Product Posture

The product posture should be narrow: hosted admission and redacted evidence plane for exact x402-protected calls, not "hosted Handshake" broadly.

The wedge is not engineering-agent workflow control yet. Engineering agents remain a stress case. The first marketable primitive is: a remote caller can attempt an exact paid/protected call, Handshake admits or rejects the caller before request body trust, records only digest/ref caller evidence, and exposes evidence reads through tenant/org/project-scoped entitlement.

x402 per-call enforcement forces a clean version of Handshake's doctrine: one exact call, one admission boundary, one evidence posture, no ambient authority.

## Hosted Claim Boundary

Permitted claim:

> Handshake hosted mode can admit exact protected calls before kernel invocation and expose redacted evidence records through tenant-scoped read controls.

Forbidden claims until proven:

- Hosted production readiness.
- Full organization RBAC.
- Compliance-grade evidence retention.
- Secret-safe deployment.
- Cloudflare durable deployment proof.
- General hosted execution control for engineering agents.
- Raw evidence safety unless raw-read posture is explicitly enforced and tested.
- "Auditable" unless export, retention, redaction, and access evidence survive reconstruction.

If the hosted claim guard does not exist, product copy will overreach. That is strategy debt, not docs cleanup.

## Sequencing After Custody/Verifier

The next macro sequence should be:

1. Operated deployment mode.
   Define local/test/hosted deployment modes, required bindings, secret sources, readiness checks, and failure behavior.

2. Tenant/org/project/read entitlement model.
   Make evidence reads impossible without explicit tenant/org/project authority. This is the product boundary for hosted evidence.

3. Redacted evidence contract.
   Define what is stored as digest/ref only, what is never stored, what rawReadPosture permits, and what proof gaps are recorded.

4. Cloudflare D1/KV deployment proof.
   Prove the hosted runtime can actually bind D1/KV correctly under remote configuration. Local D1 tests are not production proof.

5. Hosted readiness probe.
   Add a readiness surface that verifies mode, bindings, migrations/schema posture, secret availability by reference, and evidence-plane availability without leaking sensitive values.

6. Product-level redaction fuzzing.
   Fuzz evidence ingestion and reads for token-like, secret-like, header-like, and body-like leaks.

7. Hosted claim guard.
   Add automated guardrails against README/docs/product claims that exceed the current hosted proof.

## x402-First Implications

x402 should stay first because it forces exact per-call admission. Do not dilute it into general account auth, agent auth, or workflow approval.

Strategically, x402 means:

- The protected action is the call, not the customer journey.
- Admission happens before body parsing and kernel invocation.
- Evidence must prove admission/refusal posture without storing caller secrets.
- Pricing/payment is useful only if it strengthens exact-call control.
- Hosted mode must reject vague "session permission" language.

The danger is turning x402 into a payment feature. The strategic value is not payment. The value is exact, externalized, per-call admission with reconstructable redacted evidence.

## Cut Lines

Cut from this macro plan:

- General engineering-agent dashboards.
- Human review UI polish.
- Broad compliance language.
- Multi-cloud support.
- Full enterprise RBAC.
- Workflow orchestration.
- Raw evidence browsing by default.
- Any claim that hosted mode controls downstream business success.
- Any "agent auth" positioning.
- Any architecture that depends on Cloudflare vars for sensitive values.

Keep only what proves hosted admission and redacted evidence under operated deployment constraints.

## Success Criteria

This plan succeeds when Handshake can prove:

- Hosted mode refuses requests before body parsing/kernel invocation when caller role, freshness, or scope fails.
- Caller evidence is digest/ref only unless rawReadPosture explicitly permits otherwise.
- Evidence reads are tenant/org/project scoped and denied by default.
- Cloudflare D1/KV bindings are configured and tested in remote deployment posture, not only local durable tests.
- Sensitive values use Cloudflare secrets, not vars.
- Readiness probe reports binding/config posture without leaking sensitive data.
- Retention/export policy is explicit, even if minimal.
- Product docs cannot claim more than the hosted proof supports.
- Redaction fuzzing catches secret-like evidence leaks.
- Failures become refusals or proof gaps, not smoothed-over success records.

## Risks

The main risk is evidence theatre: hosted mode records something, but cannot later prove whether admission, redaction, tenant entitlement, and deployment posture were correct.

The second risk is market theatre: calling this "hosted Handshake" before it handles production deployment and read entitlements. That invites enterprise expectations before the primitive is hard.

The third risk is x402 dilution: selling payment instead of exact admission. Payment rails are distribution; exact-call enforcement is the product.

## 10-Star Bar

A 10-star version lets a skeptical org inspect one x402 protected call and answer:

- Who attempted the call?
- Was the caller admitted before body/kernel trust?
- Which tenant/org/project owned the evidence?
- What exact evidence was stored?
- What was redacted, referenced, or deliberately unavailable?
- Was raw evidence blocked unless explicitly permitted?
- Were Cloudflare bindings and secrets configured in operated hosted mode?
- Could this be exported or reconstructed later?
- Did the product claim exactly match the enforced behavior?

If any answer depends on "trust the host runtime," the bar is not met.

## Brutal Verdict

Keep the hosted admission and redacted evidence plane.

Narrow the claim.

Sequence it after custody/verifier, but before broader hosted product language.

Make x402 the first exact-call proof surface, not a payment story.

Smallest next mechanism to build: an operated hosted deployment-mode contract plus readiness probe that validates D1/KV bindings, secret posture, mode config, and evidence-plane availability without parsing protected request bodies or leaking sensitive values.
