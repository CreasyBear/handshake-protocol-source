# Decisions: Host-Specific Bypass Harnesses

## D01: First Host Harness Is Package-Manager Local Host

Use package-manager local host first after package-install conformance.

Reason: package installs are concrete protected actions with obvious wrapper and raw sibling bypass risks.

Rejected alternatives:

- x402 first as host center: rejected because x402 is calibration and proof wedge, not protocol center.
- MCP host first: rejected because MCP surface posture is still proposal/evidence/read unless blocking gateway enforcement is paired.
- generic host harness first: rejected because it invites host-wide claims.

## D02: Define HostFixtureManifest v1 Before Probe Expansion

The manifest must bind:

- host identity
- environment identity
- protected action type
- protected path
- adapter identity and version
- wrapper identity
- wrapper configured path
- wrapper resolved path
- raw sibling candidates
- registry entry
- policy identity
- freshness timestamp
- tool list digest
- expected posture
- redaction policy
- non-claims

Missing required fields fail closed.

## D03: Define BypassProofPacket As Durable Evidence

The packet must preserve:

- probe execution inputs
- probe execution outputs
- wrapper integrity
- gateway binding
- freshness decisions
- protected-path posture
- gateway check result
- downstream execution result
- refusal evidence
- bypass evidence
- proof gaps
- redacted projection
- non-claims

The packet is not a marketing artifact. It is reconstruction evidence.

## D04: Stale Metadata Refuses Or Proof-Gaps

Stale tool list digest, changed host tool digest, stale probe freshness, missing registry binding, wrapper drift, or unknown raw sibling posture cannot produce `READY`.

Allowed outcomes are refusal, proof gap, or advisory-only posture.

## D05: Protected-Path Posture Is Fixture-Specific

Posture attaches to one host fixture at one freshness state.

It does not attach to:

- the whole host
- all tools in the host
- the package manager ecosystem
- MCP generally
- shell/browser/network paths
- x402 generally
- engineering agents generally

## D06: CLI Report First, Dashboard Later

CLI is the first adoption surface because it can show exact status, evidence, and non-claims without creating review theatre.

Dashboard comes after proof packet stability.

## D07: Exit States Are Product Surface

Required exit states:

- `READY`
- `ADVISORY_ONLY`
- `WRAPPER_MISSING`
- `WRAPPER_DRIFTED`
- `GATEWAY_UNBOUND`
- `RAW_SIBLING_MUTATION_POSSIBLE`
- `STALE_PROBE`
- `HOST_TOOL_DIGEST_CHANGED`
- `PROOF_GAP`

These states are not internal details. They are the control vocabulary.
