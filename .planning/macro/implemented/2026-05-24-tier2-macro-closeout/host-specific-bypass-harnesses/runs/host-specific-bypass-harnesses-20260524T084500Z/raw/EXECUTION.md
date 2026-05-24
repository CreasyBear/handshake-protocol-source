# EXECUTION: Host-Specific Bypass Harnesses

## Invariant At Stake

Broad host interception is not proven until a host-specific harness shows the exact protected path is enforced, a raw sibling path is refused or detected, stale host posture is rejected, and the surviving evidence is reconstructable.

## First Host Target

First target: **package-manager local host**, after package-install conformance lands.

Reason: package install is consequential, local, cheap to fixture, and has obvious raw siblings: `npm install`, `pnpm add`, `bun add`, `npx`, lockfile mutation, lifecycle scripts, and direct binary invocation. It is narrower and less flaky than preview deploys or cloud APIs, but still exercises the real primitive: generated automation can bypass the wrapped gateway path through the host.

This plan must stay host-specific. Do not claim broad host interception from one package-manager harness.

## Phase 0: Scope Lock And Preconditions

Tasks:

1. Confirm package-install conformance defines the canonical protected action contract.
2. Identify the wrapped package-install path that already requires policy greenlight and gateway check.
3. Define the raw sibling paths for the first host:
   - direct package-manager command
   - alternate package-manager binary if present
   - package-manager subcommand that mutates lockfile or dependency manifest
   - lifecycle-script-triggered mutation path if safe to fixture
4. Define the minimum host metadata required before any host claim:
   - host kind
   - package-manager binary path
   - package-manager version
   - project root
   - manifest path
   - lockfile path
   - interception adapter version
   - timestamp / freshness window
   - fixture id

Dependencies:

- Package-install action catalog entry exists.
- Gateway check can bind greenlight to one exact package-install mutation attempt.
- Receipt model can distinguish gateway check from downstream package-manager result.

Validation gate:

- If package-install conformance is not landed, stop. A bypass harness without the canonical wrapped path becomes theatre.

## Phase 1: Host Fixture Contract

Tasks:

1. Add a fixture definition for `package-manager-local`.
2. Make the fixture describe both paths:
   - `wrappedPath`: expected to succeed only after exact gateway greenlight
   - `rawSiblingPath`: expected to be refused, blocked, or detected as bypass
3. Require fixture metadata to be fresh.
4. Define stale metadata refusal:
   - stale fixture timestamp
   - binary path changed
   - package-manager version changed
   - manifest or lockfile path changed
   - adapter version mismatch
5. Emit a refusal when metadata is stale, not a warning.

Dependencies:

- Host fixture model.
- Reason-code registry or equivalent refusal taxonomy.
- Protected path posture store.

Validation gate:

- A stale host fixture must produce a refusal/proof-gap receipt before any mutation attempt is allowed.

## Phase 2: Wrapped Path Success

Tasks:

1. Use the package-manager fixture to propose one exact package-install contract.
2. Evaluate policy.
3. Issue one greenlight.
4. Run the wrapped package-manager path through the gateway.
5. Record:
   - candidate action
   - canonical contract hash
   - policy decision
   - gateway check result
   - package-manager execution result
   - manifest/lockfile evidence
   - greenlight consumed state

Dependencies:

- Deterministic canonicalization.
- One-use greenlight enforcement.
- Receipt store can record gateway and downstream result separately.

Validation gate:

- The wrapped path must fail without greenlight.
- The wrapped path must succeed with exact greenlight.
- Reusing the same greenlight must fail.

## Phase 3: Raw Sibling Refusal Or Detection

Tasks:

1. Execute the equivalent raw package-manager sibling path inside the host fixture.
2. Confirm one of the allowed outcomes:
   - refused before mutation
   - blocked by host interception
   - detected as bypass with proof packet
3. Forbid success-without-evidence.
4. Record the bypass attempt against the same fixture id and protected surface.

Dependencies:

- Raw sibling command list.
- Interception adapter or detector for package-manager local host.
- Receipt shape for bypass proof packet.

Validation gate:

- If raw sibling mutation succeeds and no bypass proof packet is recorded, stop. The generated program escaped the contract boundary.

## Phase 4: Bypass Proof Packet

Tasks:

1. Define the proof packet fields:
   - fixture id
   - host kind
   - protected surface
   - wrapped action contract hash if related
   - raw sibling command or invocation fingerprint
   - host metadata snapshot
   - detection/refusal mechanism
   - mutation evidence or non-mutation evidence
   - timestamp
   - posture update recommendation
2. Ensure the proof packet distinguishes:
   - refused before mutation
   - blocked before mutation
   - detected after attempted mutation
   - proof gap
3. Add claim guards so docs/tests cannot say "host interception works" without naming the specific host and proof packet.

Dependencies:

- Receipt/proof-gap schema.
- Protected path posture model.
- Quality claim guard script or equivalent repo quality check.

Validation gate:

- A bypass result without a proof packet is not a pass.
- A proof packet that cannot distinguish gateway check from downstream execution is evidence theatre.

## Phase 5: Protected Path Posture Update

Tasks:

1. Update posture for `package-manager-local`.
2. Use narrow statuses:
   - `unproven`
   - `wrapped-path-conformant`
   - `raw-sibling-detected`
   - `raw-sibling-blocked`
   - `proof-gap`
   - `stale-host-metadata-refused`
3. Make posture host-specific and fixture-specific.
4. Prevent broad claims like "host bypass is solved."

Dependencies:

- Posture store or internal protocol note.
- Claim guards.
- Validation output from phases 2-4.

Validation gate:

- Posture cannot advance unless wrapped success, raw sibling refusal/detection, and proof packet all exist for the same host fixture.

## Phase 6: Claim Guards And Closeout

Tasks:

1. Add guards that reject unsupported claims:
   - "broad host interception"
   - "host bypass solved"
   - "raw tools blocked" without host target
   - "package-manager protected" without proof packet
2. Require docs to name:
   - host target
   - fixture id or test family
   - wrapped path result
   - raw sibling result
   - stale metadata refusal behavior
3. Keep `.planning/` scratch out of canonical claims.

Dependencies:

- Existing quality claim checks.
- Canonical docs ownership rules.

Validation gate:

- Any repo-facing claim about host interception must be backed by host-specific test evidence.

## Closeout Commands

Run only after implementation, not during this planning turn:

```bash
npm run quality:claims
npm run quality:architecture
npm run format:check
npm run check:repo
```

Add focused gates when implemented:

```bash
npm run test:package-install-conformance
npm run test:host-bypass:package-manager-local
```

If those script names do not exist, the implementation should add or map the focused checks before claiming closeout.

## Rollback / Stop Conditions

Stop immediately if:

1. Package-install conformance is not landed.
2. The wrapped path does not require an exact gateway greenlight.
3. The same greenlight can authorize more than one mutation.
4. Raw sibling mutation succeeds without refusal, block, detection, or proof packet.
5. Host metadata can go stale and still allow a greenlight or gateway check.
6. The receipt cannot distinguish gateway check from downstream package-manager execution.
7. A claim guard allows broad host-interception language from one host fixture.

Rollback posture to `unproven` if:

1. Package-manager binary path/version changes without refreshed metadata.
2. The fixture no longer exercises a real raw sibling mutation path.
3. The bypass detector only observes logs after consequence and cannot bind evidence to the protected surface.
4. The proof packet cannot be reconstructed from stored evidence.

## Smallest Implementation Slice

Build the smallest slice as:

1. `package-manager-local` fixture.
2. One wrapped package-install path that succeeds after exact gateway greenlight.
3. One raw sibling package-manager invocation that is refused or detected.
4. One bypass proof packet.
5. One stale host metadata refusal.
6. One claim guard preventing broad host-interception claims.

Smallest next mechanism to build: **a package-manager-local fixture that proves wrapped install succeeds only after gateway greenlight while the equivalent raw sibling path produces a bypass proof packet or refusal.**
