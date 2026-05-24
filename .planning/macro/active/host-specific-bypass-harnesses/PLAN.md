# GSD Macro Plan: Host-Specific Bypass Harnesses

## Goal

Invariant at stake: a protected action for automated decision making must not execute through an uncontracted host path while Handshake claims gateway-checked control.

Build the first host-specific bypass harness for one configured installed host path, beginning with package-manager local host after package-install conformance is boring. The harness must prove only this narrow claim:

In environment E, host H, adapter A, policy P, action T, Handshake resisted named bypass routes B and recorded evidence R at freshness state F.

The harness must not claim host-wide containment, platform safety, package-manager safety, MCP safety, browser/shell/network protection, or x402 ecosystem coverage.

x402 exact per-call remains the first proof wedge and calibration surface. It is not the protocol center. Handshake is protected actions for automated decision making, not engineering-agent-only infrastructure.

## Non-Goals

- No generic host sandbox.
- No host-wide safety claim.
- No MCP-wide or CLI-wide enforcement claim.
- No browser, shell, network, package-manager ecosystem, or platform containment claim.
- No claim that a host harness proves all sibling tools are blocked.
- No claim that x402 coverage implies broader payment ecosystem coverage.
- No dashboard-first delivery.
- No implementation in this macro step.
- No use of fixture evidence to manufacture establishment custody, gateway ownership, or host-wide control.

## Source Boundary

Current source named by the input packet:

- `src/adapters/protected-path-probes/executor.ts`
  - already contains `runBypassProbeExecutors`
  - already contains `BypassProbeExecutor`
- conformance fixture support already has `fixtureGatewayCheckedBypassProbeExecutors`
- `src/adapters/x402-payment/bypass-probes.ts`
  - already contains hostile x402 bypass probe executors
- existing x402 tests already prove:
  - policy greenlights only after gateway-owned hostile probes pass
  - raw x402 bypass paths cause policy refusal
  - official SDK side channels are raw sibling bypass evidence
  - direct payment, token passthrough, wrapper drift, and failure-open probes are distinct
  - conformance fixture probes cannot manufacture gateway-checked posture
  - fixture wallet custody is not establishment custody evidence
- auth.md bypass probes and MCP surface posture tests exist, but MCP and CLI are proposal, evidence, and read surfaces unless paired with blocking gateway enforcement.

Canonical planning boundary:

- This macro plan is scratch under `.planning/`.
- Repo-facing durable truth must only move into canonical docs or source after implementation validates it.
- No planning label from this macro may become an exported product claim.

## Current State

Handshake already has reusable bypass probe executor machinery and x402 hostile probe examples. That proves the shape of gateway-owned hostile probing, but not a host-specific harness for an installed configured host path.

The current evidence posture is narrower than many tempting claims:

- x402 evidence proves exact per-call bypass behavior for named payment paths.
- conformance fixture probes prove fixture behavior only.
- MCP and CLI surfaces can report, propose, or show evidence, but they do not enforce unless a gateway blocks mutation.
- existing probe results do not prove host-wide containment.
- existing probe results do not prove sibling package-manager, browser, shell, network, MCP, or SDK safety.

The missing layer is a host fixture contract that binds a configured host, protected path, wrapped tool identity, raw sibling routes, freshness, wrapper integrity, expected posture, evidence redaction, and non-claims.

## Target State

A package-manager local host harness exists behind a strict fixture manifest.

The first acceptable report states:

- host identity
- environment identity
- adapter identity and version
- protected action type
- protected path
- configured wrapper path
- resolved wrapper path
- raw sibling candidates
- tool list digest
- registry entry
- policy identity
- freshness timestamp
- probe classes
- wrapper integrity result
- gateway binding result
- one-use greenlight result
- raw sibling refusal, detection, proof gap, or stop condition
- protected-path posture
- redacted bypass proof packet
- explicit non-claims

The product bar is 10-star only if the report makes the boundary impossible to misunderstand:

- it names exactly what was protected
- it names exactly what was probed
- it names exactly what was not probed
- it refuses stale metadata
- it refuses wrapper drift
- it distinguishes gateway check from downstream execution
- it records proof gaps instead of smoothing uncertainty
- it treats raw sibling reachability as evidence, not as a hidden detail
- it never lets redaction erase enforcement distinctions
- it exits advisory-only when the gateway cannot block consequence

## Assumptions

- Package-install conformance is the prerequisite first host boundary because package installation is a concrete protected action with visible raw sibling paths.
- x402 hostile probes are calibration examples, not the center of the protocol.
- A host harness can only speak about a named configured installed path and named bypass routes at a recorded freshness state.
- Host tool identity and resolved path can drift between runs.
- Tool catalogs can become stale.
- Raw sibling tools may remain reachable.
- Wrapper integrity can drift independently from policy logic.
- CLI and MCP reports are evidence surfaces unless paired with blocking gateway enforcement.
- Redaction is necessary, but redaction must preserve gateway, downstream, refusal, bypass, and proof-gap distinctions.

## Decisions

1. Choose package-manager local host first.
   - Rationale: package install is a protected action with direct raw sibling risk and clear local host fixture boundaries.
   - Constraint: start only after package-install conformance is stable enough to avoid fixture laundering.

2. Use x402 hostile probes second as calibration.
   - Rationale: x402 already has hostile bypass executor shape and exact per-call discipline.
   - Constraint: do not recenter the protocol around x402.

3. Define `HostFixtureManifest` v1 before adding more probes.
   - Required bindings: host, environment, adapter, action type, protected path, wrapper path, raw sibling paths, registry entry, freshness, redaction, expected posture, non-claims.

4. Define `BypassProofPacket` as the durable evidence object.
   - Required sections: probes, wrapper integrity, freshness decisions, protected-path posture, raw sibling results, redacted projection, proof gaps, non-claims.

5. Treat stale metadata as refusal or proof gap.
   - Stale tool list digest, changed host tool digest, wrapper drift, stale probe results, or missing registry binding cannot produce gateway-checked posture.

6. Keep protected-path posture fixture-specific.
   - Posture is derived for one fixture, one host, one adapter, one action type, one freshness state.
   - It is never host-wide.

7. Put CLI report first.
   - Dashboard can render later.
   - First commands are conceptual product targets: `handshake harness init`, `check`, `probe`, `report`, and `doctor`.

8. Keep MCP and CLI as separate host boundaries.
   - They may show proposal and evidence posture.
   - They are not enforcement unless paired with blocking gateway checks.

## Phases

Phase 0: Scope Lock And Precondition

- Confirm package-install conformance is the first host harness target.
- Confirm x402 hostile probes remain calibration only.
- Write claim guards before new product claims can land.
- Stop if the plan drifts into host-wide protection.

Phase 1: Host Fixture Contract

- Define `HostFixtureManifest` v1.
- Bind host identity, protected action path, wrapper identity, raw sibling candidates, registry entry, adapter version, policy identity, freshness timestamp, expected posture, redaction policy, and non-claims.
- Add fixture validation that fails closed on missing or stale bindings.

Phase 2: Wrapped Path Success

- Prove a wrapped package-install path can receive one exact greenlight.
- Bind greenlight to one action contract and one gateway check.
- Record downstream execution separately from gateway acceptance.
- Stop if a greenlight can authorize multiple mutations.

Phase 3: Raw Sibling Probes

- Add raw sibling probes for package-manager bypass paths.
- Record each raw sibling as refusal, detection, proof gap, or stop condition.
- Stop if raw sibling mutation succeeds without refusal, proof gap, or quarantine evidence.

Phase 4: Wrapper Integrity And Freshness

- Detect wrapper missing, wrapper drift, gateway unbound, host tool digest changed, and stale probe results.
- Refuse or proof-gap stale metadata.
- Do not allow stale success to produce gateway-checked posture.

Phase 5: Bypass Proof Packet And Redacted Projection

- Emit `BypassProofPacket`.
- Emit redacted projection for CLI reports.
- Preserve distinctions between gateway check, downstream result, refusal, bypass evidence, and proof gap.

Phase 6: Protected-Path Posture Updates

- Derive fixture-specific protected-path posture from manifest plus proof packet.
- Supported exit states:
  - `READY`
  - `ADVISORY_ONLY`
  - `WRAPPER_MISSING`
  - `WRAPPER_DRIFTED`
  - `GATEWAY_UNBOUND`
  - `RAW_SIBLING_MUTATION_POSSIBLE`
  - `STALE_PROBE`
  - `HOST_TOOL_DIGEST_CHANGED`
  - `PROOF_GAP`

Phase 7: CLI Report And Claim Guard Closeout

- CLI report shows protected path, tool list digest, wrapper integrity, gateway binding, probe freshness, raw sibling attempts, evidence, and non-claims.
- Dashboard remains deferred.
- Claim guards reject host-wide, platform-wide, MCP-wide, package-manager-wide, x402-ecosystem-wide, or engineering-agent-only framing.

## Task Graph

- T01 locks the scope and precondition.
- T02 defines `HostFixtureManifest` v1.
- T03 defines package-install fixture data.
- T04 proves wrapped path success with one-use greenlight.
- T05 adds raw sibling probes.
- T06 adds wrapper integrity checks.
- T07 adds freshness refusal and proof-gap behavior.
- T08 defines `BypassProofPacket`.
- T09 derives protected-path posture.
- T10 adds CLI report shape.
- T11 adds claim guards and closeout validation.

No later task may claim posture without T02, T06, T07, and T08.

## Risks And Mitigations

- Stale tool list:
  - Mitigation: bind tool list digest and freshness timestamp; stale digest becomes refusal or proof gap.

- Wrapper drift:
  - Mitigation: bind resolved path and wrapper digest; drift exits `WRAPPER_DRIFTED`.

- Raw sibling reachability:
  - Mitigation: enumerate named siblings in manifest; mutation-capable sibling exits `RAW_SIBLING_MUTATION_POSSIBLE`.

- MCP or CLI overclaim:
  - Mitigation: claim guard text says proposal/evidence/read surface unless blocking gateway enforcement exists.

- Weak `sourceAuthority` fixtures:
  - Mitigation: fixture source authority cannot stand in for establishment custody or host-wide posture.

- Token passthrough:
  - Mitigation: keep token passthrough as a distinct bypass class, not a generic wrapper failure.

- Fixture laundering:
  - Mitigation: conformance fixtures cannot manufacture gateway-checked posture.

- Redaction leakage:
  - Mitigation: redaction policy must hide sensitive values while preserving enforcement distinctions.

- Evidence projection flattening:
  - Mitigation: CLI report must keep gateway check, downstream execution, refusal, bypass, and proof gap separate.

## Validation Gates

Precondition gates:

- package-install conformance passes before host harness posture can be claimed.
- x402 hostile bypass tests remain passing as calibration.
- existing bypass probe executor tests remain passing.

Implementation closeout commands, once code exists:

- `npm run quality:claims`
- `npm run quality:architecture`
- `npm run format:check`
- `npm run check:repo`

Focused validation targets to add or run when available:

- host fixture manifest schema tests
- wrapped package-install path one-use greenlight test
- raw sibling refusal or proof-gap tests
- wrapper missing and wrapper drift tests
- stale tool digest and stale probe tests
- bypass proof packet redaction tests
- protected-path posture derivation tests
- CLI report non-claim tests

Report validation must show:

- protected path
- tool list digest
- wrapper integrity
- gateway binding
- probe freshness
- raw sibling attempts
- evidence
- non-claims

## Cut Lines

Cut any claim that says or implies:

- Handshake protects the whole host.
- Handshake protects all package-manager operations.
- Handshake protects MCP tools generally.
- Handshake protects browser, shell, or network paths.
- Handshake proves platform-wide containment.
- x402 coverage proves payment ecosystem coverage.
- Host harnesses prove engineering-agent safety generally.
- Fixture evidence proves establishment custody.
- A report is enforcement.
- A CLI or MCP surface is blocking without a gateway.
- A wrapped path success covers raw siblings.
- A redacted report can omit proof gaps.

## Rollback / Stop Conditions

Stop immediately if:

- raw sibling mutation succeeds without refusal, quarantine, or proof-gap evidence
- gateway check and downstream execution are collapsed into one receipt field
- stale metadata still produces `READY`
- wrapper drift still produces gateway-checked posture
- one greenlight can authorize more than one mutation attempt
- fixture probes manufacture gateway-checked posture
- redacted projection hides bypass/proof-gap distinction
- CLI or MCP report claims enforcement without blocking gateway checks
- package-install harness expands into host-wide claims

Rollback posture to `ADVISORY_ONLY` or `PROOF_GAP` when evidence is incomplete.

## Smallest Next Action

Write the `HostFixtureManifest` v1 contract for the package-manager local host harness, including non-claims and freshness refusal rules, before adding any new probe implementation.
