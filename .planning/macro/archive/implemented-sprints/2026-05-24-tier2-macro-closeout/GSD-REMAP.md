# GSD Remap: Tier 2 Macro Closeout

Date: 2026-05-24

## Mapper Runtime

`gsd-sdk query init.map-codebase` reported that mapper agents were not
installed in this checkout. This remap was performed inline and written to the
existing `.planning/codebase/` scratch documents.

## Remapped Documents

Updated scratch maps:

- `.planning/codebase/STACK.md`
- `.planning/codebase/ARCHITECTURE.md`
- `.planning/codebase/INTEGRATIONS.md`
- `.planning/codebase/STRUCTURE.md`
- `.planning/codebase/CONVENTIONS.md`
- `.planning/codebase/TESTING.md`
- `.planning/codebase/CONCERNS.md`

Key correction: older map entries that described runtime/MCP x402 posture
propagation as current bugs are now stale. Current source includes the posture
fields in both runtime ingress and MCP proposal schema.

## Current Source Map Delta

New or materially expanded source areas:

- `src/protocol/areas/credential-custody/`: gateway custody proof packets and
  post-gate credential resolution evidence.
- `src/protocol/areas/authority-certificate/`: structured terminal verifier
  response, issuer/key/status posture, verifier key-set projection, and JWKS
  projection.
- `src/http/admission/`: hosted deployment-mode admission and caller identity
  posture.
- `src/http/handlers/verifier.ts`: non-mutating hosted verifier routes.
- `src/http/handlers/hosted-readiness.ts`: hosted readiness reporting without
  secret values or mutation authority.
- `src/adapters/package-install/adapter-pack.ts`: package-install material
  adapter-pack evidence/report projection.
- `src/adapters/package-install/host-harness.ts` and
  `src/adapters/protected-path-probes/host-fixture.ts`: named local host bypass
  harness and proof-packet posture.
- `src/surfaces/release-proof.ts`: publication release-state proof and
  non-authority boundary.
- `scripts/check-release-proof.mjs`: publication claim/readiness guard.

## Active Planning State After Closeout

Implemented bundle:

- `.planning/macro/implemented/2026-05-24-tier2-macro-closeout/`

Remaining active macro folder:

- `.planning/macro/active/x402-product-evaluation-20260524`

The remaining active folder was not one of the seven macro plans implemented in
this closeout and must not be archived by association.

## Practical Next Map Queries

Use this remap to route future work:

- Custody or secret-boundary work: start in
  `src/protocol/areas/credential-custody/` and
  `test/protocol/credential-custody.test.ts`.
- Terminal verification work: start in
  `src/protocol/areas/authority-certificate/`, `src/http/handlers/verifier.ts`,
  and `test/protocol/authority-certificate.test.ts`.
- Hosted admission/read work: start in `src/http/admission/`,
  `src/http/handlers/evidence-read.ts`, `src/http/handlers/internal-record-read.ts`,
  `src/http/handlers/hosted-readiness.ts`, and `test/http/http.test.ts`.
- Package-install adapter work: start in
  `src/adapters/package-install/adapter-pack.ts`,
  `src/adapters/package-install/gateway.ts`, and
  `test/adapters/package-install-adapter-pack.test.ts`.
- Host bypass work: start in `src/adapters/protected-path-probes/`,
  `src/adapters/package-install/host-harness.ts`, and
  `test/adapters/package-install-host-harness.test.ts`.
- Publication readiness work: start in `src/surfaces/release-proof.ts`,
  `scripts/check-release-proof.mjs`, and
  `test/architecture/package-release-proof.test.ts`.

## Remap Verdict

The current codebase map now matches the source-closed seven-plan stack. It
still treats `.planning/` as scratch and names external proof gaps instead of
turning them into product claims.
