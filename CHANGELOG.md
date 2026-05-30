# Changelog

All notable public package changes are recorded here.

This changelog tracks the installable `handshake-protocol-kernel` package and
public artifact repository. It does not claim hosted operation, provider
custody, settlement finality, marketplace certification, MCP Registry
discoverability, or Handshake authority from publication alone.

## 0.2.9 - 2026-05-30

### Added

- Handshake-owned delegation evidence verifier at `src/integrations/a1-evidence/`
  (Ed25519 zip215 + BLAKE3, conformance vectors, parent-swap resistance).
- Optional `delegationEvidenceRef` on candidate actions and
  `ReceiptExport.delegationProvenance` — separable from gateway check and
  downstream outcome (KILL-08).
- Agent-native runtime ingress: committed refusals surfaced in
  `refusalRefs`; malformed wire returns structured refusal instead of throw
  (D-76).
- Downgrade-only delegation evidence policy hook and compilation-phase proof
  gaps for required-but-unverifiable evidence.
- MCP read-only tool `handshake.evidence.delegation.verify` — offline chain
  verify with explicit non-authority outcome (D-75: no mint/authorize tools).

### Changed

- Delegation evidence domains re-namespaced to `handshake::delegation::*::v1`
  (D-74); A1 wire interop is not a goal.
- MCP catalog lists read-only verify before x402 proposal tool; stdio server
  registration order unchanged for proposal-first harness flows.

### Boundary Notes

- Delegation evidence verifies provenance when policy requires it. Valid
  evidence alone never creates a greenlight or substitutes for gateway check.
- This release does not add A1 gateway HTTP, `VerifiedToken` clearance, or
  ambient delegation authority.

## 0.2.8 - 2026-05-29

### Added

- Service-agent gating phase: operator and full tier architecture gates,
  `check:service-agent-gating-phase` scripts, service-operator golden path and
  bootstrap examples, dual-enforcement posture tests, and HTTP mutation-route
  manifest gating.
- FailureClass taxonomy with registry-first derivation across HTTP transitions,
  SDK role clients, and MCP failure surfaces.
- x402 gateway-held credential custody (Mechanism A): signer unreachable without
  passed gateway check and gateway-resolved redacted evidence.
- Product coherence phase: unified readback spine, intent-compilation projection
  rows, forbidden-copy lint, keel-integrity audit, and claim-boundary fixes
  across CLI, SDK, and MCP surfaces.
- Service-operator and host-operator runbooks, integrator parity docs, and
  persona golden paths under internal docs.

### Changed

- Renamed service-agent integration vocabulary to service-operator where
  product surfaces describe Branch A bootstrap and maintenance flows.
- Root SDK re-export of role clients for one-import agent ergonomics without a
  factory wrapper.
- Product launch gate and proof-packet fixtures track `0.2.8` as the current
  package surface after Phase 04+05 land.

### Boundary Notes

- This release does not broaden authority. The public package remains proposal,
  evidence, conformance, SDK, CLI, and local MCP distribution only.
- Service-agent gating proves structural dual enforcement and FailureClass
  parity; it does not claim hosted operation, provider custody, or universal
  agent governance.
- MCP Registry discoverability remains a proof gap until registry acceptance
  and lookup are verified.
- Public npm availability does not create authority.

### Release State

- `ready_to_publish`: verified locally by repo gates and package projection.
- `actually_published`: verified by maintainer passkey publish from source
  checkout, npm registry readback for `0.2.8`, and registry signature metadata.
  Artifact-repo trusted-publish workflow and clean installed-artifact smoke remain
  to reconcile when `handshake-protocol-kernel` is re-projected from this source
  state.
- `registry_discoverable`: pending MCP Registry acceptance and lookup.

## 0.2.7 - 2026-05-25

### Changed

- Replaced the long npm-facing README with a shorter contract README focused on
  install, first-use, MCP, SDK imports, the current x402 wedge, release proof
  states, and explicit non-claims.
- Published a package-page cleanup release so npm no longer carries the stale
  `0.2.6` pre-publish sentence.
- Kept the public repository as a package artifact repository, not a source
  mirror.

### Boundary Notes

- This release does not broaden authority. The public package remains proposal,
  evidence, conformance, SDK, CLI, and local MCP distribution only.
- MCP Registry discoverability remains a proof gap until registry acceptance
  and lookup are verified.
- Public npm availability does not create authority.

### Release State

- `ready_to_publish`: verified locally by repo gates and package projection.
- `actually_published`: verified by npm trusted-publish workflow, npm registry
  readback, registry signature metadata, provenance publication, and clean
  installed-artifact smoke.
- `registry_discoverable`: pending MCP Registry acceptance and lookup.

## 0.2.6 - 2026-05-25

### Added

- Added the `./x402-protected-tool` package subpath for the protected x402
  proposal facade and host profile descriptors.
- Added the `./adapter-sdk` package subpath for definition-only protected-action
  adapter pack authoring and install-proposal report projection.
- Added role-scoped SDK clients for install setup, delegated-authority control,
  exact policy evaluation, gateway-custody transition transport, runtime
  proposal, and redacted evidence readback.
- Added local x402 install/probe/readiness CLI commands and clean
  installed-artifact activation checks.
- Added public package-artifact repository projection with a trusted-publish
  GitHub Actions workflow for npm provenance publishing.

### Changed

- Renamed the MCP package identity to
  `io.github.CreasyBear/handshake-protocol-kernel`.
- Rewrote the package README around the public artifact boundary, authority
  cut lines, x402 protected-action wedge, MCP server posture, trusted
  publishing, and release proof states.
- Tightened package-surface checks so the npm artifact remains limited to
  runtime bundles, binaries, metadata, README, license notices, and this
  changelog.
- Expanded protocol evidence around delegated spend authority, gateway custody
  proof packets, replay refusal, proof gaps, and protected-tool host profiles.

### Boundary Notes

- The official public package wedge remains one buyer-side
  `x402_payment.exact` per-call protected action.
- The MCP server remains proposal/evidence only. It does not create policy
  decisions, greenlights, gateway checks, payment material, mutations, receipt
  exports, AuthorityCertificates, hosted operation, or provider custody.
- Public npm availability does not create authority.
- MCP Registry discoverability remains a proof gap until registry acceptance
  and lookup are verified.
- An `AuthorityCertificate` remains terminal evidence, not permission,
  identity, settlement, hosted trust, or reusable auth.

### Release State

- `ready_to_publish`: verified locally by repo gates and package projection.
- `actually_published`: verified by npm trusted-publish workflow, npm registry
  readback, registry signature metadata, provenance publication, and clean
  installed-artifact smoke.
- `registry_discoverable`: pending MCP Registry acceptance and lookup.

## 0.2.5 - 2026-05-24

### Added

- Published the first public npm package artifact for
  `handshake-protocol-kernel`.
- Added bundled runtime, CLI, MCP, conformance, SDK, and experimental reference
  entrypoints under `dist/`.
- Added local JSON-output CLI evidence/readiness commands and local stdio MCP
  proposal/evidence server binaries.

### Boundary Notes

- Public npm `0.2.5` established distribution evidence only.
- The package did not claim hosted operation, provider custody, broad x402
  compatibility, broad MCP control, settlement finality, marketplace
  certification, or cross-org certificate trust.
