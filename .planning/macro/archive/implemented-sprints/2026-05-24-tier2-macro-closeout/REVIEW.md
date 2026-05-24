# Tier 2 Macro Closeout Review

Date: 2026-05-24

## Review Posture

This is a source-closeout review of the seven macro implementation commits, not
a release approval for external npm/MCP publication or production hosted
operation.

Reviewed axes:

- correctness against the seven macro plans;
- authority-boundary preservation;
- security and redaction posture;
- architecture/import posture;
- test and gate credibility;
- residual proof gaps.

## Findings

No blocking findings were found in the closeout state.

## Important Residual Risks

### External publication remains a proof gap

`PackageReleaseProof` correctly separates `ready_to_publish`,
`actually_published`, and `registry_discoverable`, but the repo has not
performed npm publish, post-publish clean install from the public artifact, MCP
Registry submission, or registry discoverability verification. This is not a
source bug; it is an external release-operator boundary.

Required discipline: do not say "published" or "registry discoverable" until
the proof state advances with external evidence.

### Hosted readiness is not production hosted operation

Hosted admission, read-role separation, raw-read posture, and readiness reports
exist. They prove source-level local foundation behavior and configured posture,
not production operation, remote D1/KV proof, live revocation authority, abuse
control, or cross-org trust.

Required discipline: keep "hosted" wording bound to admission/readiness and
evidence projections unless deployment evidence exists.

### Package-install material evidence is not package safety

The package-install adapter pack records material evidence, lifecycle-script
posture, proof gaps, exact contract binding, and gateway observed-parameter
validation. It does not prove package code is benign, replace npm audit, or
verify Bun provenance.

Required discipline: preserve the report non-claims in future adapter pack
work.

### Host-specific harness is not host-wide containment

The host bypass harness proves one named local package-manager environment and
named raw sibling candidates at a freshness state. It does not prove generic
browser, shell, network, MCP, package-manager ecosystem, or runtime sandbox
containment.

Required discipline: every new host claim needs its own manifest, probe list,
freshness, raw sibling posture, and proof-packet evidence.

## Architecture Review

The implementation preserves the core boundary:

- Protocol primitives stay under `src/protocol/`.
- Runtime ingress remains observer/compiler/proposal posture.
- MCP remains proposal/evidence/read-only.
- CLI remains evidence/local readiness/readback.
- Hosted verifier/readiness routes are non-mutating.
- Release proof records publication evidence states, not authority.
- Adapter reports are reconstruction/evidence projections, not enforcement.

The main architectural watch item is runtime ingress size. It is still the
largest cross-family conversion module. Current tests and the runtime registry
keep it proposal-only, so this is not a closeout blocker. The next family beyond
package install should trigger a narrow extraction before the module becomes a
god registry.

## Security Review

Redaction and custody posture improved:

- Custody proof packets reject raw credential-looking material.
- Credential resolution evidence is post-gate.
- Evidence projections redact signer/payment/auth material.
- Hosted reads hide cross-tenant existence and gate raw records by posture.
- Verifier/JWKS projection exposes public key material only.

Residual security boundaries are explicit:

- no provider/customer custody proof from local fixtures;
- no live secret manager/vault provider integration;
- no production hosted trust or revocation distribution;
- no package safety guarantee;
- no host-wide bypass containment.

## Test Review

The final gate is credible because it includes:

- full TypeScript checking;
- ESLint;
- Prettier;
- all Bun tests;
- package build and surface checks;
- published-entrypoint smoke checks;
- release proof readiness checks;
- whitespace diff check.

Focused tests cover the new slices:

- custody: `test/protocol/credential-custody.test.ts`;
- verifier: `test/protocol/authority-certificate.test.ts`, `test/http/http.test.ts`;
- hosted: `test/http/http.test.ts`, `test/sdk/role-clients.test.ts`;
- adapter pack: `test/adapters/package-install-adapter-pack.test.ts`;
- bypass harness: `test/adapters/package-install-host-harness.test.ts`;
- publication states: `test/architecture/package-release-proof.test.ts`;
- claims: `test/architecture/claim-boundary.test.ts`.

## Review Verdict

Keep. The seven-plan source stack is coherent, guarded, and narrow enough.

Do not broaden it in closeout language. The next useful review is a
buyer-facing proof-path read: one concrete protected action from proposal to
contract, policy, one-use greenlight, gateway check, custody proof, receipt or
proof gap, terminal certificate, hosted redacted read, bypass posture, and
release metadata.
