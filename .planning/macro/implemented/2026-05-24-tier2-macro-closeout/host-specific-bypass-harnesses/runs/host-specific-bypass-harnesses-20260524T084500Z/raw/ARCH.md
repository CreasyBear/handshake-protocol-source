# ARCH: Host-Specific Bypass Harnesses

## Invariant At Stake

Host-specific bypass harnesses must prove only this: for a named environment, the protected path, wrapper path, raw sibling path, stale metadata path, and redacted evidence path behaved as expected under source-owned fixtures. They must not imply host-wide protection, platform-wide safety, or unobserved gateway enforcement.

## Architecture Plan

### 1. Host Fixture Manifest Contract

Create a source-owned manifest that declares the named host fixture, not the host category.

```ts
type HostFixtureManifest = {
  schemaVersion: "host-fixture-manifest.v1";
  manifestId: string;
  host: {
    kind: "package-install" | "mcp" | "cli" | "x402" | "custom";
    name: string;
    fixtureVersion: string;
    adapterPackage?: string;
  };
  protectedPaths: ProtectedPathFixture[];
  wrappers: WrapperFixture[];
  rawSiblings: RawSiblingFixture[];
  freshness: FreshnessPolicyFixture;
  redaction: RedactionPolicyFixture;
  expectedPosture: ProtectedPathPostureExpectation;
};
```

The manifest must bind every probe to:

- exact host fixture identity;
- exact protected path;
- gateway registry entry;
- wrapper entrypoint;
- raw sibling entrypoint, if known;
- expected refusal/proof-gap behavior;
- metadata freshness policy.

No manifest field may say or imply "host protected." Valid language is "fixture observed," "fixture refused," "fixture proof gap," or "fixture inconclusive."

### 2. Bypass Proof Packet

`runBypassProbeExecutors()` should emit a packet that preserves the chain without overclaiming.

```ts
type BypassProofPacket = {
  packetId: string;
  manifestId: string;
  generatedAt: string;
  host: HostFixtureManifest["host"];
  probes: BypassProbeRecord[];
  wrapperIntegrity: WrapperIntegrityRecord[];
  freshnessDecisions: FreshnessDecisionRecord[];
  protectedPathPosture: ProtectedPathPostureRecord;
  projection: RedactedBypassProjection;
};
```

The packet is evidence of a fixture run. It is not a receipt for real host behavior and not proof that all sibling mutation paths are covered.

### 3. Freshness And Staleness Model

Freshness should be explicit policy, not timestamp vibes.

Each manifest declares:

- `metadataIssuedAt`;
- `metadataExpiresAt`;
- `gatewayRegistryDigest`;
- `wrapperDigest`;
- `adapterDigest`;
- `hostFixtureDigest`;
- `maxAgeMs`;
- `requiredClockSkewMs`.

Stale metadata must produce a refusal-like result:

```ts
type FreshnessDecision =
  | "fresh"
  | "stale_metadata_refused"
  | "missing_metadata_refused"
  | "digest_mismatch_refused"
  | "clock_uncertain_proof_gap";
```

The important boundary: stale fixture metadata cannot update protected-path posture to "covered." At most it can produce `proof_gap_stale_metadata`.

### 4. Protected-Path Posture Update Rules

Posture must be derived from packet evidence, never set by the adapter claiming safety.

Recommended posture states:

```ts
type ProtectedPathPosture =
  | "not_declared"
  | "declared_unprobed"
  | "gateway_checked_fixture_passed"
  | "raw_sibling_refused"
  | "raw_sibling_bypass_observed"
  | "wrapper_integrity_failed"
  | "stale_metadata_refused"
  | "proof_gap"
  | "inconclusive";
```

Update rules:

- gateway-checked probe passed: may mark only that exact protected path as `gateway_checked_fixture_passed`;
- raw sibling attempt refused: may mark only that named sibling path as `raw_sibling_refused`;
- raw sibling attempt succeeds: path becomes `raw_sibling_bypass_observed`;
- wrapper digest mismatch: `wrapper_integrity_failed`;
- stale metadata: `stale_metadata_refused`;
- missing executor or unmodeled sibling: `proof_gap`;
- conflicting records: `inconclusive`.

Never aggregate from one fixture to a host-wide posture.

### 5. Redacted Projection

The redacted projection is the shareable artifact for docs, dashboards, CI, or package users.

It should expose:

- manifest id;
- host kind/name;
- protected path ids;
- probe outcomes;
- posture state;
- refusal/proof-gap reasons;
- timestamps;
- digests or digest prefixes;
- redacted executor labels.

It must hide:

- credentials;
- raw host tokens;
- concrete secret-bearing request bodies;
- local filesystem paths unless explicitly safe;
- environment variables;
- private package registry URLs if sensitive;
- full downstream responses that may contain secrets.

Projection rule: redaction is not allowed to erase the distinction between gateway check, downstream execution, refusal, bypass, and proof gap. If redaction would destroy that distinction, emit `redaction_limited_projection` as a proof gap.

### 6. Relationship To Package-Install Adapter Pack

The package-install adapter pack should become the first named host-family proving ground, not a generic bypass guarantee.

It should provide:

- one manifest per package-manager fixture;
- gateway-checked install probe;
- raw sibling install attempt probe;
- wrapper integrity probe;
- stale metadata fixture;
- redacted bypass projection fixture.

Example fixture families:

- `npm-install.fixture.v1`;
- `pnpm-install.fixture.v1`;
- `bun-add.fixture.v1`;
- `pip-install.fixture.v1`, only when the adapter actually exists.

Do not claim "package installs protected." Claim "this adapter fixture observed exact gateway enforcement and raw sibling refusal for these declared entrypoints."

### 7. MCP / CLI Boundary

MCP and CLI must be treated as separate host boundaries.

For MCP:

- manifest binds server name, tool name, tool schema digest, gateway registry id, and raw tool-call sibling if available;
- probe executor attempts both wrapped MCP call and declared raw sibling call;
- receipt must distinguish MCP transport acceptance from gateway authorization.

For CLI:

- manifest binds command, subcommand, argument normalization, wrapper binary digest, and raw executable sibling;
- raw sibling probe must prove whether direct command execution bypasses the wrapper;
- if the CLI can shell out to another executable, that must become either a declared sibling or a proof gap.

Boundary rule: an MCP server exposing a CLI-backed tool does not inherit CLI protection unless the CLI path is separately declared and probed.

### 8. Import / Export Posture

Exports should be narrow and product-facing only where the invariant is stable.

Recommended public exports:

```ts
export type HostFixtureManifest;
export type BypassProofPacket;
export type RedactedBypassProjection;
export type ProtectedPathPosture;
export function runBypassProbeExecutors(...);
export function projectBypassProofPacket(...);
```

Keep internal:

- hostile executor implementations;
- raw sibling harness internals;
- fixture secret handling;
- digest construction helpers if unstable;
- host-specific test-only executors.

Import rule: adapters import manifest/probe contracts from core. Core must not import package-install, MCP, or CLI adapter internals. Adapter packs register fixtures outward.

## Build Order

1. Define `HostFixtureManifest` and validation tests.
2. Extend probe records into `BypassProofPacket`.
3. Add freshness refusal decisions.
4. Add raw sibling attempt probes.
5. Add wrapper integrity checks.
6. Implement protected-path posture derivation.
7. Add redacted projection.
8. Wire package-install adapter fixtures as the first adapter pack.
9. Add MCP and CLI manifests only after package-install proves the contract shape.

## Brutal Verdict

Keep the harness idea, but keep it small. Host harnesses are conformance fixtures, not universal host protection. The smallest next mechanism to build is the `HostFixtureManifest` plus a packet-level posture derivation test that proves stale metadata and raw sibling bypass cannot be smoothed into "protected."
