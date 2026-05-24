# Tier 2 Macro Closeout Audit

Date: 2026-05-24

Status: passed for repo-owned source closeout; external owner-held publication
and production-hosted proofs remain explicit proof gaps.

## Invariant At Stake

No consequential automated action may be represented as protected unless it is
reduced to an exact action contract, evaluated by policy, bound to a one-use
greenlight, checked by a gateway before consequence, and reconstructable as a
receipt, refusal, proof gap, or terminal certificate.

The seven macro plans are closed only at the source-owned scope proven by the
current repo. They do not claim production hosted readiness, provider custody,
actual npm publication, MCP Registry discoverability, settlement, payment
management, certification, package safety, or host-wide containment.

## Scope

Closed macro folders:

- `claim-boundary-cleanup`
- `customer-owned-gateway-custody-proof`
- `terminal-verifier-trust-plane`
- `hosted-admission-redacted-evidence-plane`
- `concrete-adapter-pack-expansion`
- `host-specific-bypass-harnesses`
- `public-distribution-publication`

Still active and not closed by this audit:

- `.planning/macro/active/x402-product-evaluation-20260524`

## Commit Mapping

| Macro plan | Closeout commit(s) | Evidence summary |
| --- | --- | --- |
| Claim boundary cleanup | `286ea47` | Canonical docs and package metadata now frame Handshake as protected action infrastructure for automated decision making; claim guards reject engineering-agent-only and x402/payment overclaims. |
| Customer-owned gateway custody proof | `0d6cbcf` | `GatewayCustodyProofPacket`, `CredentialResolutionEvidence`, transition/navigation/object registry coverage, and redaction tests landed. |
| Terminal verifier trust plane | `b4c5229`, `3752733` | Issuer/key/status models, verifier key-set projection, JWKS projection, structured verification response, CLI parity, and hosted verifier read routes landed. |
| Hosted admission and redacted evidence plane | `5a257df`, `9718905` | Hosted verifier/read routes, deployment-mode admission config, tenant/read-role split, raw-read posture, and readiness projection landed. |
| Concrete adapter pack expansion | `15c2eee` | Package-install material adapter pack, evidence report, lifecycle-script posture, proof gaps, gateway observed-parameter validation, and conformance coverage landed. |
| Host-specific bypass harnesses | `7760654` | Local package-manager host fixture, raw sibling posture, freshness, proof-packet/report, and host-specific non-claims landed. |
| Public distribution and publication | `b3635c5` | `PackageReleaseProof`, release states, authority non-claims, package metadata guard, and release proof readiness check landed. |

## Requirements Audit

| Requirement | Status | Source evidence | Residual proof gap |
| --- | --- | --- | --- |
| Correct category boundary | Passed | `README.md`, `AGENTS.md`, `docs/internal/decisions.md`, `test/architecture/claim-boundary.test.ts`, `package.json` | None for repo wording. |
| x402 exact per-call remains first wedge | Passed | `README.md`, `docs/internal/protocol-notes.md`, `test/conformance/x402-payment-conformance.test.ts`, `test/conformance/x402-upstream-exact-fixtures.test.ts` | Broad x402 surfaces remain future cuts. |
| No payment-management, settlement, marketplace, or custody overclaim | Passed | `test/architecture/claim-boundary.test.ts`, `scripts/check-release-proof.mjs`, `src/surfaces/release-proof.ts` | Actual external payment/provider operations not implemented or claimed. |
| Custody proof packet binds gateway custody evidence | Passed | `src/protocol/areas/credential-custody/`, `test/protocol/credential-custody.test.ts`, `test/protocol/evidence-projections.test.ts` | Provider-specific/customer deployment proof remains external. |
| Credential resolution is post-gate evidence | Passed | `recordCredentialResolutionEvidence`, `test/protocol/credential-custody.test.ts`, adapter gateway tests | None for source path. |
| Terminal certificate verification is structured evidence | Passed | `src/protocol/areas/authority-certificate/`, `test/protocol/authority-certificate.test.ts`, `src/cli/certificate.ts` | Cross-org trust publication and live revocation operations remain future work. |
| Hosted admission is deny-by-default and tenant-scoped | Passed | `src/http/admission/hosted-admission-config.ts`, `src/http/admission/hosted-caller-identity.ts`, `test/http/http.test.ts` | Production deployment posture remains unproven. |
| Hosted reads are redacted and read-entitled | Passed | `src/http/handlers/evidence-read.ts`, `src/http/handlers/internal-record-read.ts`, `test/http/http.test.ts` | Compliance-grade audit/export program remains future work. |
| Package-install adapter pack proves one exact install attempt | Passed | `src/adapters/package-install/adapter-pack.ts`, `test/adapters/package-install-adapter-pack.test.ts`, `test/integration/package-install-end-to-end.test.ts` | Real external package safety/provenance certification is not claimed. |
| Lifecycle scripts blocked or proof-gapped | Passed | `src/adapters/package-install/adapter-pack.ts`, `src/adapters/package-install/gateway.ts`, adapter-pack and gateway tests | Separately contracted lifecycle script action not implemented. |
| Host-specific bypass harness is narrow | Passed | `src/adapters/package-install/host-harness.ts`, `src/adapters/protected-path-probes/host-fixture.ts`, `test/adapters/package-install-host-harness.test.ts` | Additional hosts and ongoing freshness automation remain future work. |
| Public release states are separated | Passed | `src/surfaces/release-proof.ts`, `test/architecture/package-release-proof.test.ts`, `scripts/check-release-proof.mjs` | Actual npm publish, clean install from public artifact, MCP Registry acceptance, and discoverability are external proof gaps. |

## Integration Audit

The implemented chain is internally coherent:

```text
claim boundary
-> custody proof packet
-> terminal verifier structure
-> hosted read/admission posture
-> package-install adapter pack
-> host-specific bypass harness
-> release-state proof
```

No slice creates an alternate authority path. Runtime ingress, MCP, CLI,
hosted verifier/readiness, release proof, and package-install reports remain
proposal/evidence/read/metadata surfaces. The gateway check remains the
pre-consequence enforcement point.

## Gate Evidence

Final closeout commands run after the seven implementation commits:

```bash
npm run quality:claims
npm run quality:architecture
npm run format:check
npm run check:repo
```

Observed result:

- `quality:claims`: 4 pass, 0 fail.
- `quality:architecture`: 63 pass, 0 fail.
- `format:check`: passed.
- `check:repo`: 495 pass, 0 fail; package surface check passed with 563 files;
  release proof readiness check passed; `git diff --check` passed.

## Verdict

Passed for repo-owned source closeout. The seven macro plans should no longer
live under `.planning/macro/active/`.

Do not collapse the residual proof gaps into success language. Publication,
production hosted operation, provider custody, cross-org trust, package safety,
and host-wide containment remain unclaimed until future source and external
evidence prove them.
