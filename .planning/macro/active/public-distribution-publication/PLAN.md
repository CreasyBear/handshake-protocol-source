# GSD Macro Plan: Public Distribution And Publication

## Goal

Make Handshake publicly installable and discoverable as a non-authority protocol kernel for protected actions in automated decision making.

The release must prove package shape, published entrypoints, MCP metadata, installability, runtime smoke behavior, provenance posture, and authority boundaries. Publication distributes proposal, evidence, read surfaces, and source-owned metadata only. Publication does not create authority, policy decisions, greenlights, gateway checks, mutations, custody, hosted operation, marketplace certification, settlement, payment management, trust, or host-wide enforcement.

x402 exact per-call remains the first proof wedge. It is not the protocol center.

## Non-Goals

- Do not broaden Handshake into engineering-agent-only infrastructure.
- Do not claim npm publication creates enforcement.
- Do not claim MCP Registry listing creates trust, certification, security review, custody, or hosted operation.
- Do not add marketplace, settlement, payment management, or host-wide enforcement claims.
- Do not publish with stale engineering-agent-only canon unresolved.
- Do not treat local dry-run evidence as proof of public installability.
- Do not treat a registry metadata entry as proof that package artifacts are safe.

## Source Boundary

Authoritative source for this macro item is limited to current tracked repo surfaces and official publication constraints summarized for this run.

Current source surfaces:

- `package.json`
- `server.json`
- `scripts/check-package-surface.mjs`
- `scripts/check-published-entrypoints.mjs`
- `README.md`
- `QUALITY.md`
- `STRUCTURE.md`
- `docs/internal/decisions.md`
- `docs/internal/protocol-notes.md`

Scratch planning files are not source authority. This macro plan may guide work, but implementation must land through tracked source, checks, and receipts.

Official publication constraints:

- npm publication publishes installable package artifacts by name and version.
- `npm pack --dry-run --json` is the local package-content inspection gate.
- `package.json` `name` and `version` identify the publishable package.
- `exports` defines public entrypoints and blocks arbitrary package entrypoints.
- `bin` installs commands and Node bins must use a Node shebang.
- `files` constrains package contents.
- Trusted publishing/OIDC is preferred over long-lived tokens and can generate provenance for public packages under supported conditions.
- 2FA/token posture must be explicit; bypass-2FA tokens are risky.
- MCP Registry is preview, hosts metadata rather than artifacts, uses `server.json`, requires public install methods, and for npm ownership verification requires `package.json#mcpName` to match `server.json#name`.

## Current State

The package currently declares:

- package name `handshake-protocol-kernel`
- version `0.2.4`
- `mcpName` `io.github.joelchan/handshake-protocol-kernel`
- root, conformance, runtime, SDK, role client, CLI, MCP, experimental, and package metadata exports
- bins `handshake`, `handshake-mcp`, and a package-name bin pointing to the MCP server
- files covering bins, source, dist, `server.json`, README, quality/structure docs, and internal docs

`server.json` currently uses MCP Registry schema `2025-12-11`, npm stdio package metadata, and a non-authority description.

Existing checks cover:

- npm pack dry-run JSON inspection
- required packaged files
- forbidden packaged paths
- `private: false`
- `mcpName` and `server.json#name` sync
- Node shebangs for bins
- CLI schema non-authority smoke
- MCP stdio official client smoke
- no raw `PaymentPayload` or `SIGNATURE` leakage in published entrypoints

Known source drift:

- README/docs already describe package entrypoints and MCP metadata.
- Current canon still contains older engineering-agent phrasing that must be corrected before publication.

## Target State

A release is ready only when there is a source-owned release proof that separates:

- `ready_to_publish`: local package contract, pack evidence, metadata checks, runtime smoke, account/namespace posture, provenance posture, and authority-boundary checks have passed.
- `actually_published`: npm publish has occurred for the exact package/version and post-publish clean-install smoke has passed.
- `registry_discoverable`: MCP Registry metadata has been accepted and post-registry discoverability checks have passed, without implying artifact trust or enforcement.

The target proof object is `PackageReleaseProof` with:

- `packageShapeProof`
- `accountNamespaceProof`
- `publishOperationProof`
- `provenanceProof`
- `registryDiscoverabilityProof`
- `runtimeSmokeProof`
- `authorityBoundary`
- `proofGaps`

`authorityBoundary` must explicitly record false/non-authority fields for:

- createsAuthority
- createsPolicyDecision
- createsGreenlight
- performsGatewayCheck
- performsMutation
- holdsCustody
- hostsOperation
- certifiesMarketplace
- managesSettlement
- managesPayment
- establishesTrust
- enforcesHostWidePolicy

## Assumptions

- npm is the first artifact registry for the public package.
- MCP Registry is a preview discoverability surface, not an enforcement or trust root.
- The publishable package remains public and installable by package name.
- Publication receipt must distinguish local readiness, npm publication, post-publish install, MCP Registry metadata, and post-registry discoverability.
- x402 exact per-call is used as the first proof wedge only.
- Existing scripts are close enough to extend, but not sufficient until older engineering-agent-only canon is removed from public-facing claims.
- Any missing account, OIDC, 2FA, provenance, or namespace proof is a proof gap, not a release success.

## Decisions

1. Public distribution is a publication/readiness problem, not an authority primitive.
2. `ready_to_publish`, `actually_published`, and `registry_discoverable` are separate release states.
3. A release manifest must exist before publish; a post-publish verification receipt must exist after publish.
4. MCP Registry metadata must use non-authority wording and must not imply certification, trust, hosted operation, or enforcement.
5. npm trusted publishing/OIDC is preferred; long-lived token publishing requires explicit risk acceptance and proof-gap recording.
6. Clean install smoke after npm publish is mandatory before claiming public installability.
7. Publication checks must fail on package leakage, public export overexposure, stale metadata, missing provenance posture, or engineering-agent-only framing.
8. Rollback posture is deprecate/unpublish-within-registry-policy where possible, plus documentation correction; publication cannot be silently erased from downstream consumers.

## Phases

### Phase 1: Local Readiness Contract

Define the release proof shape and readiness states. Align package metadata, docs, and checks to the protected-actions-for-automated-decision-making invariant.

### Phase 2: npm Preflight

Run dry-run package inspection, public export review, bin shebang checks, CLI/MCP smoke, metadata sync, dependency/install-script review, and authority-boundary wording checks.

### Phase 3: npm Publish

Publish only from an exact version/tag with explicit account, 2FA/token, and provenance posture. Record publish operation evidence and proof gaps.

### Phase 4: Post-npm Verification

Perform clean install by package name and version. Verify bins, exported entrypoints, proposal/evidence/read behavior, and non-authority messaging from installed artifacts.

### Phase 5: MCP Registry Preflight

Verify `server.json`, namespace auth, install method metadata, npm ownership sync, preview-status language, and non-certification claims.

### Phase 6: MCP Registry Publication

Submit registry metadata only after npm post-publish verification passes. Record registry operation evidence separately from npm artifact evidence.

### Phase 7: Post-registry Verification

Verify discoverability, install instructions, metadata drift, and preview limitations. Record `registry_discoverable` only if the metadata is findable and still non-authority.

## Task Graph

- `PD-01` has no dependencies.
- `PD-02` depends on `PD-01`.
- `PD-03` depends on `PD-01`.
- `PD-04` depends on `PD-02` and `PD-03`.
- `PD-05` depends on `PD-04`.
- `PD-06` depends on `PD-05`.
- `PD-07` depends on `PD-06`.
- `PD-08` depends on `PD-07`.
- `PD-09` depends on `PD-08`.
- `PD-10` depends on `PD-09`.
- `PD-11` depends on `PD-10`.
- `PD-12` depends on `PD-11`.

## Risks And Mitigations

- Package leakage: enforce pack dry-run forbidden paths and required files.
- Dist/source mismatch: smoke installed artifacts, not just source checkout paths.
- Public exports overexpose authority internals: review `exports` as public API, not convenience.
- Bins imply mutation: smoke CLI/MCP messaging for proposal/evidence/read posture only.
- Registry overclaims trust: constrain `server.json` and docs to metadata/discoverability.
- Token/2FA/provenance gaps: record account posture before publish and block silent token fallback.
- Namespace ownership gaps: require `mcpName`/`server.json#name` sync and namespace auth evidence.
- Metadata drift: compare package metadata, server metadata, README, and published install instructions.
- Node runtime failures: clean install smoke bins and exported entrypoints.
- Unexpected install scripts/dependencies: inspect package scripts and dependency surface before publish.
- Rollback/deprecation gaps: predefine stop/deprecate/correction procedure before publish.
- MCP preview instability: record registry proof gaps and never make enforcement claims from registry availability.

## Validation Gates

Local gates:

- `npm pack --dry-run --json` evidence captured.
- Required files present in pack contents.
- Forbidden paths absent from pack contents.
- `private` is false.
- `package.json#mcpName` equals `server.json#name`.
- Node bins use Node shebangs.
- CLI schema smoke proves non-authority posture.
- MCP stdio smoke works through official client path.
- Raw `PaymentPayload` and `SIGNATURE` are not exposed through published entrypoints.
- Public docs no longer frame Handshake as engineering-agent-only infrastructure.

Pre-publish gates:

- version/tag are exact.
- account namespace ownership is evidenced.
- 2FA/token posture is explicit.
- provenance posture is explicit.
- rollback/deprecation posture is written.
- release manifest exists.

Post-publish gates:

- clean install by package name and version succeeds.
- installed bins run.
- installed exports resolve.
- proposal/evidence/read surfaces work without implying mutation authority.
- publication receipt distinguishes local, npm, provenance, runtime, and proof-gap evidence.

Registry gates:

- `server.json` uses public install methods only.
- registry wording is metadata/discoverability only.
- namespace auth evidence exists or is recorded as a blocker.
- registry acceptance is recorded separately from package artifact evidence.
- post-registry discoverability is verified without trust/certification claims.

## Cut Lines

Cut any claim that publication:

- creates authority
- makes policy decisions
- creates greenlights
- performs gateway checks
- causes mutation
- holds custody
- hosts operation
- certifies trust
- manages settlement or payment
- enforces host-wide policy

Cut any release path that:

- relies on long-lived token publish without explicit risk recording
- treats MCP Registry as artifact validation
- treats x402 as protocol center
- keeps engineering-agent-only public framing
- cannot distinguish readiness from actual publication
- cannot reconstruct what was published, by whom, under which version/provenance posture

## Rollback / Stop Conditions

Stop before npm publish if:

- pack contents include forbidden paths.
- public exports expose unstable authority internals.
- docs or metadata imply enforcement through publication.
- account/2FA/provenance posture is unknown.
- version/tag is ambiguous.
- release manifest is missing.
- clean local smoke fails.

Stop after npm publish and before registry submission if:

- clean install fails.
- installed bins fail.
- installed artifacts drift from source-owned metadata.
- post-publish receipt cannot be produced.
- non-authority messaging fails from installed artifacts.

Stop after registry submission if:

- registry metadata implies trust, certification, hosted operation, settlement, payment, or enforcement.
- namespace auth fails.
- discoverability cannot be verified.
- preview instability prevents a reliable registry receipt.

Rollback posture:

- prefer immediate correction release for package metadata or docs drift.
- use npm deprecation for unsafe or misleading versions where appropriate.
- use registry metadata correction/removal where supported.
- record every failed publish, deprecation, correction, and unresolved proof gap.

## Smallest Next Action

Define the `PackageReleaseProof` and release-state contract in source-owned docs/checks, with explicit false authority-boundary fields and proof-gap recording before any publish command is considered.
