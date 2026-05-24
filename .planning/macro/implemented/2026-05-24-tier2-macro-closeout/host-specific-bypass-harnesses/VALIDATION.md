# Validation: Host-Specific Bypass Harnesses

## Validation Principle

A host harness passes only when it proves a narrow protected-path claim and records explicit non-claims. Broad confidence is failure.

## Precondition Gates

- Package-install conformance must pass before package-manager local host posture can be claimed.
- Existing x402 hostile bypass tests must remain passing as calibration.
- Existing bypass probe executor behavior must remain passing.
- Claim guards must reject engineering-agent-only framing and host-wide safety language.

## Required Test Classes

1. Host fixture manifest schema
   - missing host fails
   - missing protected path fails
   - missing wrapper fails
   - missing raw sibling list fails
   - missing freshness fails
   - missing non-claims fails

2. Wrapped path success
   - wrapped package-install path receives one exact greenlight
   - greenlight binds to one action contract
   - gateway check is recorded before mutation
   - downstream execution is recorded separately

3. Raw sibling probes
   - named raw sibling attempts are executed or proof-gapped
   - raw sibling mutation blocks `READY`
   - raw sibling refusal records evidence

4. Wrapper integrity
   - missing wrapper exits `WRAPPER_MISSING`
   - digest drift exits `WRAPPER_DRIFTED`
   - gateway-unbound wrapper exits `GATEWAY_UNBOUND`

5. Freshness
   - stale probe exits `STALE_PROBE`
   - changed host tool digest exits `HOST_TOOL_DIGEST_CHANGED`
   - stale metadata cannot produce `READY`

6. Bypass proof packet
   - packet includes manifest reference
   - packet separates gateway check from downstream result
   - packet records refusal, bypass, and proof-gap evidence separately

7. Redacted projection
   - secrets are hidden
   - control distinctions remain visible
   - non-claims remain visible

8. Protected-path posture
   - `READY` requires wrapper integrity, gateway binding, fresh probes, and no raw sibling mutation evidence
   - `ADVISORY_ONLY` is used when reporting exists without blocking enforcement
   - `PROOF_GAP` is used when evidence is missing

9. CLI report
   - shows protected path
   - shows tool list digest
   - shows wrapper integrity
   - shows gateway binding
   - shows probe freshness
   - shows raw sibling attempts
   - shows evidence
   - shows non-claims

## Closeout Commands

Run when implementation exists:

- `npm run quality:claims`
- `npm run quality:architecture`
- `npm run format:check`
- `npm run check:repo`

Focused commands should be added or used for:

- host fixture manifest tests
- package-install conformance tests
- protected-path bypass probe tests
- x402 hostile bypass calibration tests
- claim guard tests

## Acceptance Claim

The only acceptable product claim after closeout:

In environment E, host H, adapter A, policy P, action T, Handshake resisted named bypass routes B and recorded evidence R at freshness state F.

Any stronger claim fails validation.
