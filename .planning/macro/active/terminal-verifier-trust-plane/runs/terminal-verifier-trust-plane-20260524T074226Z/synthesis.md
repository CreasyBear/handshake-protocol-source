# Synthesis: Terminal Verifier Trust Plane

## Chair Read

The perspectives converge on one hard boundary: the trust plane must make `AuthorityCertificate` portable without letting portability become authority.

The weak version of this initiative would publish keys, add a hosted `/verify`, and market certificates as proof that an x402 call was paid or approved. That is advisory theatre. The strong version separates evidence, discovery, and trust decision planes, then gives external receivers a structured answer about exact terminal evidence.

## Coherent Sequence

The correct order is:

1. Claim guard.
2. Trust read model.
3. Native key-set projection.
4. JWKS projection.
5. Status/revocation records.
6. Structured verification response.
7. Hosted discovery/status routes.
8. Hosted verify route.
9. CLI/SDK/MCP parity.
10. x402 evidence profile.

This order is chosen because hosted verification before status semantics would produce false confidence, and JWKS before native key-set would turn projection into authority. x402 must wait until certificate verification cannot be confused with payment settlement.

## Key Reconciliations

Strategy wanted external portability for x402 receivers and auditors. Architecture required plane separation and protocol-owned read models. Execution proposed slices near existing authority-certificate, CLI, HTTP, and tests. Risk forced fail-closed status and redaction. Adoption required CLI/SDK/MCP surfaces without boolean validity shortcuts.

The merged plan keeps the strategic wedge but makes architecture and risk constraints the gate. x402 is not allowed to define certificate meaning.

## Chosen Primitive

The primitive is structured terminal evidence verification:

- exact certificate;
- exact terminal artifact kind;
- exact signed-over binding;
- exact issuer/key/role/status model;
- exact gateway admission binding;
- exact terminal binding;
- explicit refusal or proof gap when evidence is missing, stale, revoked, or unavailable.

## Boundaries Preserved

- Vague intent is not authority.
- Generated action is not permission.
- `AuthorityCertificate` is not greenlight.
- JWKS is not trust.
- Hosted verifier is not mutation.
- Verification is not settlement.
- Redacted audit response is not raw receipt disclosure.

## Main Product Cut

Cut every claim that says or implies:

- certificate means approved;
- certificate means paid;
- certificate means settled;
- certificate means the actor is trusted;
- certificate means compliance;
- certificate means downstream success;
- JWKS means the verifier is trusted.

The acceptable language is narrower: certificate verifies, refuses, or produces a proof gap against a declared verifier trust plane.

## Readiness To Execute

The plan is ready to execute if the team accepts two user-owned decisions:

- hosted route naming convention;
- initial storage/read-provider posture for status records.

Neither blocks Phase 0 or Phase 1. The smallest next mechanism is the claim guard followed by the issuer/key-version read model.
