# Codebase Concerns

**Analysis Date:** 2026-05-24

## Closeout Remap Basis

This map is scratch GSD context, not repo canon. It was refreshed after commit
`b3635c5` and the final closeout gate:

```bash
npm run quality:claims
npm run quality:architecture
npm run format:check
npm run check:repo
```

Final observed `check:repo` result: 495 tests passed, 0 failed; package surface
check passed with 563 files; release proof readiness check passed.

## Closed Former Concerns

The following concerns appeared in older maps and should not be treated as
current defects:

- Runtime x402 request/provider posture propagation is now present in
  `src/runtime/ingress/index.ts`.
- MCP x402 request/provider posture representation is now present in
  `src/mcp/x402-proposal.ts`.
- Claim-boundary cleanup now frames Handshake as protected action
  infrastructure for automated decision making, with engineering agents as
  wedge/threat-model context rather than category boundary.
- Package publication checks now include release-state and non-authority
  boundary checks through `scripts/check-release-proof.mjs` and
  `src/surfaces/release-proof.ts`.

## Active Residual Risks

### External Publication Is Not Completed

- Source state: `PackageReleaseProof` separates `ready_to_publish`,
  `actually_published`, and `registry_discoverable`.
- Risk: local pack/readiness proof can be mistaken for npm publication or MCP
  Registry discoverability.
- Guard: `scripts/check-release-proof.mjs`,
  `test/architecture/package-release-proof.test.ts`, and README/decisions
  wording state publication non-authority and proof gaps.
- Remaining proof gap: npm publish, post-publish clean install, MCP Registry
  acceptance, and registry discoverability require owner-held external actions.

### Hosted Operation Is Local Foundation Only

- Source state: hosted admission config, verifier routes, redacted reads,
  raw-read posture, and readiness reporting exist under `src/http/`.
- Risk: hosted verifier/readiness could be read as production hosted operation,
  cross-org trust, live revocation authority, or remote JWKS trust.
- Guard: `test/http/http.test.ts`, `test/architecture/claim-boundary.test.ts`,
  and docs/internal non-claims.
- Remaining proof gap: production deployment, remote D1/KV posture, live
  revocation operations, external trust distribution, and rate/abuse controls.

### Custody Proof Is Evidence, Not Secret Management

- Source state: `GatewayCustodyProofPacket` and
  `CredentialResolutionEvidence` record redacted custody evidence and post-gate
  credential resolution evidence.
- Risk: custody proof packet can be overread as provider custody, secret
  retrieval, or Handshake-held mutation credential.
- Guard: `test/protocol/credential-custody.test.ts`,
  `test/protocol/evidence-projections.test.ts`, root export tests, and claim
  guards reject raw credential material and fixture-custody overclaims.
- Remaining proof gap: provider-specific custody verification and customer
  gateway deployment evidence.

### Terminal Verification Is Not Trust Establishment

- Source state: `AuthorityCertificateVerificationResponse`,
  issuer/key/status models, native verifier key-set projection, JWKS projection,
  and hosted verifier routes are implemented.
- Risk: verified terminal evidence can be misrepresented as approval, identity,
  settlement, certification, compliance, or downstream success.
- Guard: `test/protocol/authority-certificate.test.ts`,
  `test/http/http.test.ts`, CLI evidence tests, and claim guards.
- Remaining proof gap: cross-org trust registry, remote trust publication,
  operational revocation distribution, and compliance-grade audit program.

### Package-Install Adapter Pack Is Narrow

- Source state: `packageInstallMaterialAdapterPack`,
  `PackageInstallMaterialEvidence`, gateway observed-parameter validation,
  lifecycle-script posture, material proof gaps, and a buyer-readable report
  exist.
- Risk: material evidence or lockfile evidence can be laundered into package
  safety, npm audit replacement, Bun provenance verification, or broad
  supply-chain security.
- Guard: `test/adapters/package-install-adapter-pack.test.ts`,
  `test/adapters/package-install-gateway.test.ts`, conformance tests, and
  report non-claims.
- Remaining proof gap: real external npm provenance/signature verification,
  package safety analysis, and support for lifecycle scripts as separately
  contracted protected actions.

### Host-Specific Bypass Harness Is Named, Not Host-Wide

- Source state: local package-manager host fixture and bypass proof packet
  report named host, environment, adapter, action, protected path, raw sibling
  candidates, freshness, and non-claims.
- Risk: a named local harness can be overclaimed as host-wide containment,
  package-manager ecosystem protection, browser/shell/network protection, or
  generic runtime sandboxing.
- Guard: `test/adapters/package-install-host-harness.test.ts`,
  `test/architecture/claim-boundary.test.ts`, and non-claim fields in the
  manifest.
- Remaining proof gap: additional host families, real host instrumentation, and
  ongoing freshness automation.

### Runtime Ingress Still Needs Size Discipline

- Source state: runtime ingress has proposal-only family registry coverage and
  exact dispatch handling for package install, x402 payment, and auth.md
  protected API calls.
- Risk: new families can bloat `src/runtime/ingress/index.ts` and accidentally
  turn proposal routing into ambient authority.
- Guard: `test/runtime/runtime-ingress.test.ts`,
  `test/architecture/import-posture.test.ts`, and runtime lane non-authority
  wording.
- Preferred next move: split family-specific conversion code only when another
  concrete protected-action pack creates real pressure. Do not introduce a god
  registry.

## Current Non-Claims To Preserve

- Not engineering-agent-only infrastructure.
- Not x402-as-protocol.
- Not aggregate payment-budget management.
- Not settlement, seller middleware, facilitator operation, or payment
  management.
- Not provider/customer custody proof from local fixtures.
- Not hosted mutation authority or production hosted readiness.
- Not remote JWKS trust fetching or cross-org certificate trust.
- Not package safety proof, npm audit replacement, Bun provenance
  verification, or broad supply-chain security.
- Not host-wide containment, browser/shell/network protection, or generic MCP
  enforcement.
