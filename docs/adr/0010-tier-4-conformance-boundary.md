# ADR 0010: Tier 4 Conformance And Certification Boundary

Status: Accepted
Date: 2026-05-19
Owner: Product and protocol owner
Implementation owner: future Tier 4 conformance plan
Depends on: Tier 2 self-hosted protected path evidence and Tier 3 hosted operation evidence
Informed by: [`../reference/agentic-repo-source-study-2026-05-19.md`](../reference/agentic-repo-source-study-2026-05-19.md)
Blocks: ecosystem, standard, certification, provider-side enforcement, and cross-org receipt verification claims

## Invariant At Stake

Tier 4 is not more integrations.

The ecosystem is filling with agent frameworks, memory systems, browser agents,
workflow graphs, trace tools, MCP servers, A2A-style task protocols, hosted
sandboxes, plugin SDKs, and provider adapters. Handshake should integrate with
them only after it can independently test the same authority boundary across
runtimes and gateways.

An integration without conformance is a demo. A certification without revocation
is marketing. Provider-side enforcement without a gateway check is advisory.

## Decision

Handshake may use Tier 4 language only after it defines and proves versioned
conformance for the full authority path:

```text
runtime emits candidate/refusal/evidence/uncertainty
  -> Handshake canonicalizes exact ActionContract
  -> policy emits decision
  -> one-use Greenlight is consumed only once
  -> gateway refuses before mutation when binding fails
  -> receipt or proof gap is verifiable without raw evidence leakage
```

Tier 4 requires six separate decision classes:

| ID | Decision Class | Requirement |
|---|---|---|
| E1 | Runtime conformance | Runtime adapters prove candidate/refusal/evidence/uncertainty emission without claiming enforcement. |
| E2 | Gateway conformance | Gateway adapters prove refusal-before-mutation for missing, replayed, mismatched, stale, isolated, and drifted greenlights. |
| E3 | Adapter certification | Certified adapters have versioned tests, evidence, revocation, and scope. |
| E4 | Provider-side gateway integration | Provider or certified gateway owns mutation credentials and checks exact greenlights before consequence. |
| E5 | Cross-org receipt verification | Receipts can be verified across org boundaries through redacted projections. |
| E6 | Ecosystem governance and versioning | Schemas, suites, revocations, evidence classes, and compatibility windows are governed. |

## Primitive

Future Tier 4 plans must define evidence equivalent to:

```text
RuntimeConformanceReport
GatewayConformanceReport
AdapterCertificationRecord
ProviderGatewayAttestation
CrossOrgReceiptVerification
ConformanceSuiteVersion
CertificationRevocationRecord
```

These are not product badges until their underlying tests run against real
runtime/gateway behavior.

## Boundary Rules

1. Runtime conformance cannot claim enforcement. Runtimes propose, classify,
   refuse, and record evidence.
2. Gateway conformance must prove refusal before mutation under hostile cases:
   missing greenlight, replay, stale policy, digest mismatch, wrong resource,
   wrong gateway, isolation change, credential drift, idempotency replay, and
   receipt outage.
3. Adapter certification must be scoped by provider, action family, version,
   credential posture, and tested failure modes.
4. Provider-side enforcement requires the provider or certified gateway to own
   the mutation credential and check the exact greenlight before consequence.
5. Cross-org receipt verification requires redacted evidence projections and
   tenant/org authorization. Raw protocol records are not public verification.
6. Certification must be revocable.
7. Governance must version schemas and evidence classes before third parties
   depend on them.

## Non-Claims

- This ADR does not implement conformance.
- This ADR does not claim ecosystem standard status.
- This ADR does not certify any runtime, gateway, adapter, or provider.
- This ADR does not create a marketplace, wallet, settlement layer, fraud
  system, insurance product, or compliance certification.
- This ADR does not let runtime wrappers claim mutation control.
- This ADR does not make hosted Handshake stronger than gateway enforcement.

## Rejected Alternatives

### Count Integrations As Tier 4

Rejected. More adapters increase surface area. They do not prove independent
enforcement unless each adapter passes runtime/gateway conformance.

### Certify Adapters From Happy-Path Receipts

Rejected. Tier 4 must prove refusal before mutation under hostile and drifted
states, not only successful receipts.

### Expose Raw Records For Cross-Org Verification

Rejected. Raw evidence leaks tenants, users, prompts, provider payloads, secrets,
or protected capability inventory. Cross-org verification needs redacted
projections.

## Proof Plan

The future Tier 4 plan must prove:

1. A runtime conformance suite can fail a runtime that emits trace-only evidence
   without candidate/refusal uncertainty.
2. A gateway conformance suite can fail a gateway that mutates before checking a
   greenlight.
3. Adapter certification records include version, scope, evidence, expiry, and
   revocation.
4. Cross-org receipt verification succeeds without exposing raw protocol records.
5. Certification can be revoked and downstream claims can detect that revocation.

Smallest next mechanism: do not start Tier 4 work until the first Tier 2
self-hosted path and Tier 3 hosted evidence model exist; then write the runtime
and gateway conformance red tests first.
