# Synthesis: Public Distribution And Publication

## Invariant At Stake

Publication must not become ambient authority wearing package metadata.

Handshake is protected actions for automated decision making. Public distribution can make the protocol kernel installable and discoverable, but it cannot authorize protected actions. It cannot create a policy decision, greenlight, gateway check, mutation, custody path, hosted operation, settlement path, payment manager, trust root, certification mark, or host-wide enforcement boundary.

## Chair Synthesis

The perspectives converge on one severe release model:

1. Prove local package shape before publication.
2. Prove credential, namespace, and provenance posture before mutation of public package state.
3. Publish npm artifact only from an exact manifest.
4. Verify clean install from public npm before any registry discoverability work.
5. Submit MCP Registry metadata only after npm artifact proof exists.
6. Verify registry discoverability as metadata only.
7. Record every gap instead of smoothing it into release success.

The strategic correction is important: x402 exact per-call is the first proof wedge, not the center. The center is protected action control for automated decision making: exact contract, one-use greenlight, gateway check, receipt/refusal/proof-gap, isolation, and bypass posture.

## Adopted Model

Use three separate release states:

- `ready_to_publish`
- `actually_published`
- `registry_discoverable`

A local pack dry-run can support `ready_to_publish`. It cannot support `actually_published`.

An npm publish operation can support `actually_published` only after clean install smoke passes.

An MCP Registry submission can support `registry_discoverable` only after post-registry verification passes. It cannot support trust, certification, artifact safety, or enforcement.

## Required Proof Shape

The release proof should be structured as `PackageReleaseProof`:

- `packageShapeProof`
- `accountNamespaceProof`
- `publishOperationProof`
- `provenanceProof`
- `registryDiscoverabilityProof`
- `runtimeSmokeProof`
- `authorityBoundary`
- `proofGaps`

The `authorityBoundary` must make false claims explicit:

- `createsAuthority: false`
- `createsPolicyDecision: false`
- `createsGreenlight: false`
- `performsGatewayCheck: false`
- `performsMutation: false`
- `holdsCustody: false`
- `hostsOperation: false`
- `certifiesMarketplace: false`
- `managesSettlement: false`
- `managesPayment: false`
- `establishesTrust: false`
- `enforcesHostWidePolicy: false`

## Release Sequence

1. Local readiness contract
2. npm preflight
3. npm publish
4. post-npm clean install smoke
5. MCP Registry preflight
6. MCP Registry metadata submission
7. post-registry discoverability smoke

This sequence prevents a common failure: making a package discoverable before the artifact and its public claims have survived installation from the public registry.

## Risk Synthesis

The largest risks are not mechanical publication failures. The largest risks are semantic boundary failures:

- package metadata implies authority
- docs narrow Handshake to engineering agents
- x402 becomes the protocol center
- MCP Registry listing is treated as trust
- provenance is confused with runtime enforcement
- clean install is skipped
- a release receipt conflates local checks, npm publish, registry metadata, and runtime smoke

Those are not wording nits. They are product-boundary failures.

## Adoption Synthesis

The first public install/test-drive should prove:

- package can be installed
- bins can start
- exports resolve
- proposal/evidence/read surfaces are available
- non-authority boundaries are visible
- proof gaps are explicit

It should not require a team to integrate every protected-action gateway up front.

Allowed support statuses:

- `ready:proposal-mode`
- `ready:gateway-mode`
- `blocked:metadata`
- `blocked:runtime`
- `blocked:mcp-stdio`
- `blocked:package-contents`
- `blocked:namespace-auth`
- `blocked:provenance`
- `preview:unsupported-enforcement`

## Brutal Verdict

Keep the publication plan, but narrow its claims.

Public distribution is useful only if it makes Handshake installable, inspectable, and reconstructable without pretending to enforce anything by existing in npm or MCP Registry. Any implementation that treats publication as trust, authority, certification, or gateway enforcement is advisory theatre, not Handshake.

Smallest next mechanism: define the `PackageReleaseProof` and release-state contract with explicit authority-boundary false fields before any publish operation.
