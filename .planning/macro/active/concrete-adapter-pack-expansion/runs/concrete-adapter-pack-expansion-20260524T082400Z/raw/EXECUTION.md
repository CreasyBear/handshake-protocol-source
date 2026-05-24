# EXECUTION Perspective

## Invariant At Stake

A concrete adapter may expand Tier 1 only if it preserves exact contract binding: candidate action -> deterministic canonicalization -> policy decision -> one-use gateway check -> receipt/refusal/proof-gap. Anything that adds provenance, reports, or runtime tests without gateway-observed enforcement is advisory, not Handshake.

## First Adapter Selection

Select package install adapter first.

Reason: it already has runtime compiler and gateway test lanes, and the missing piece is sharply bounded: promote material attestation without pretending it proves package safety. That makes it the smallest credible adapter-pack expansion while protecting Tier 1.

Do not select preview deploy or repo write first. They are more operationally valuable, but their blast radius includes environment drift, downstream platform state, filesystem semantics, and rollback ambiguity. Package install gives the adapter pack a cleaner first conformance surface.

## Phase 0: Freeze The Adapter Contract

Tasks:

1. Define the package-install adapter pack boundary.
2. Confirm action type name, protected surface, gateway registry ownership, and receipt event names.
3. State explicitly that npm signatures/provenance are material evidence, not benignness proof.
4. State Bun lockfile evidence as local material evidence only.
5. Add no new Tier 1 claims unless a gateway check observes and validates the same canonical parameters.

Validation gate:

- The adapter pack must be expressible as one action type with one protected mutation path.
- No report or receipt may imply package safety from provenance alone.

Stop condition:

- If the existing package install action contract cannot carry install target, package manager, registry source, lockfile/material evidence fields, and idempotency key without widening Tier 1 primitives, stop and redesign the contract shape first.

## Phase 1: Canonical Package Install Proposal

Tasks:

1. Compile package-install proposals into exact candidate actions.
2. Canonicalize package manager, package names, versions/ranges, registry URL, workspace path, lockfile path, install mode, and expected material evidence.
3. Reject dynamic package names, implicit registries, hidden postinstall scope, or unresolved workspace targets as refusal/review candidates.
4. Preserve generated code/spec references as proposal evidence, not permission.

Validation gate:

- Golden fixture proves semantically equivalent install proposals produce identical canonical contracts.
- Ambiguous versions, registry aliases, and workspace-relative path drift produce refusal/review outcomes.

Stop condition:

- If the compiler converts vague intent like "make tests pass" into package install authority without explicit candidate evidence, stop. The compiler overreached the principal.

## Phase 2: Gateway Observed Parameter Validator

Tasks:

1. Add gateway registry entry for package install.
2. Validate observed gateway parameters against the exact greenlit canonical contract.
3. Enforce one-use greenlight binding.
4. Verify package manager, package spec, registry, workspace path, and idempotency key at the mutation boundary.
5. Record mismatch as refusal or bypass/proof-gap evidence, not a soft warning.

Validation gate:

- Gateway tests prove mismatch on package name, version, registry, workspace, or package manager blocks execution.
- Replay of a used greenlight fails.
- Raw/sibling install path is detected or recorded as bypass posture where possible.

Stop condition:

- If install can proceed through an unwrapped package-manager path while claiming Handshake enforcement, stop. The generated code escaped the contract boundary.

## Phase 3: Material Attestation Mapper

Tasks:

1. Capture npm provenance/signature verification result when npm is the package manager.
2. Capture `npm audit signatures` result as registry-signature/provenance evidence after install where applicable.
3. Capture Bun lockfile deltas as local material evidence only.
4. Map unavailable, unsupported, failed, or skipped attestation to structured proof gaps.
5. Keep attestation separate from gateway check and downstream install result.

Validation gate:

- npm provenance/signature success is recorded as material attestation evidence, not safety approval.
- unsupported package manager or missing registry support records proof gap.
- failed attestation does not get smoothed into generic install failure.

Stop condition:

- If receipt language implies "verified package is safe," stop. Provenance does not prove benignness.

## Phase 4: Custody And Bypass Probes

Tasks:

1. Probe whether install occurred through the Handshake-wrapped gateway.
2. Probe for lockfile/package manifest changes that do not match the greenlit contract.
3. Distinguish gateway-observed install, raw install suspicion, postinstall uncertainty, and unsupported custody evidence.
4. Record bypass/proof-gap evidence even when install appears successful.

Validation gate:

- Fixture proves manifest or lockfile mutation without matching gateway receipt is recorded as bypass/proof gap.
- Fixture proves install success without material attestation does not erase the proof gap.

Stop condition:

- If custody cannot distinguish gateway check from downstream install result, stop. This is evidence theatre.

## Phase 5: Buyer-Readable Adapter Report

Tasks:

1. Generate a compact report for one package install attempt.
2. Include candidate contract, policy result, gateway check, observed install result, material attestation, bypass posture, and proof gaps.
3. Avoid internal planning-stage labels.
4. Make the report reconstructable from receipts, not from runtime logs alone.

Validation gate:

- Report can be regenerated from stored evidence.
- Report does not claim benignness, supply-chain safety, or org-wide enforcement beyond the observed attempt.

Stop condition:

- If the report is manually assembled from runtime trace instead of receipt evidence, stop. This is not auditable.

## Phase 6: Conformance And Export Surface

Tasks:

1. Add package-install adapter conformance fixture.
2. Add architecture/export tests for action type, gateway registry entry, receipt/proof-gap mapper, and report generator.
3. Add runtime/MCP proposal tests only if this adapter is exposed through runtime/MCP proposal surfaces.
4. Keep preview deploy and repo write untouched except for shared adapter-pack interfaces required by this slice.

Validation gate:

- Architecture/export tests prove the adapter pack is wired through declared registries, not ad hoc imports.
- Conformance fixture proves proposal -> canonical contract -> gateway validation -> receipt/report reconstruction.

## Closeout Commands

Run only after implementation:

```bash
npm run quality:claims
npm run quality:architecture
npm run format:check
npm run check:repo
```

Add focused tests if present:

```bash
npm test -- package-install
npm test -- adapter
npm test -- gateway
```

## Rollback Conditions

Rollback or stop the slice if:

1. Tier 1 wording expands from enforced package install attempts to general supply-chain safety.
2. A greenlight can authorize more than one install attempt.
3. Gateway validation does not compare observed parameters to the canonical contract.
4. Provenance/signature evidence is treated as authorization.
5. Receipts collapse gateway check, install result, and attestation into one vague success event.
6. Raw or sibling package-manager bypass is invisible or unrecorded.
7. The adapter requires preview deploy or repo write changes to look complete.

## Smallest Implementation Slice

Build only this:

Package install adapter conformance slice for one npm install attempt:

1. Action catalog entry.
2. Deterministic canonical package-install contract.
3. Gateway registry entry with observed parameter validator.
4. One-use greenlight enforcement test.
5. Receipt mapper that separates gateway check, install result, npm signature/provenance evidence, and proof gaps.
6. One buyer-readable report generated from the receipt.

Smallest next mechanism to build: the package-install gateway observed-parameter validator bound to the canonical contract.
