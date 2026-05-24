# ADOPTION: Host-Specific Bypass Harnesses

## Invariant At Stake

A host-specific bypass harness may prove only one installed protected path. If it implies whole-host containment while raw sibling tools can still mutate, it becomes evidence theatre.

## Operator Workflow

1. Install one protected adapter path, e.g. `package-install`.
2. Register the expected host surface:
   `handshake harness init --host codex --protected-path package-install`
3. Run readiness:
   `handshake harness check --host codex --path package-install`
4. Run bypass probes:
   `handshake harness probe --host codex --path package-install`
5. Review the report:
   `handshake harness report --host codex --path package-install`
6. Decide posture:
   `ready`, `advisory`, `blocked`, or `unknown`.

The workflow should answer one question:

> "For this host, is this installed protected package-install path actually gateway-bound, and what nearby raw paths remain outside Handshake?"

Not:

> "Is this host safe?"

## Report Affordances

The report should be intentionally narrow:

```text
Host: codex
Protected path: package-install
Adapter version: ...
Tool list digest: sha256:...
Wrapper integrity: pass/fail/unknown
Probe freshness: 2026-05-24T...
Gateway authority holder: ...
Raw sibling attempts: detected/refused/unobserved/not-tested
Protected path posture: enforced/advisory/missing/drifted
Non-claims: listed explicitly
```

Required sections:

- `Protected Path`: exact tool/action path under test.
- `Tool List Digest`: host-exposed tool inventory hash at probe time.
- `Wrapper Integrity`: whether the installed wrapper matches expected adapter identity/config.
- `Gateway Binding`: whether mutation requires exact greenlight verification.
- `Probe Freshness`: when probes last ran, against which host digest.
- `Raw Sibling Attempts`: nearby mutation routes attempted outside the wrapper.
- `Evidence`: receipts, refusals, proof gaps, bypass findings.
- `Non-Claims`: what this report does not prove.

## Command Names

Keep command names boring and explicit:

```bash
handshake harness init --host codex --protected-path package-install
handshake harness check --host codex --protected-path package-install
handshake harness probe --host codex --protected-path package-install
handshake harness report --host codex --protected-path package-install
handshake harness doctor --host codex --protected-path package-install
```

Avoid names like `secure-host`, `contain`, `lockdown`, or `verify-agent`. They overclaim.

Useful exit states:

```text
READY
ADVISORY_ONLY
WRAPPER_MISSING
WRAPPER_DRIFTED
GATEWAY_UNBOUND
RAW_SIBLING_MUTATION_POSSIBLE
STALE_PROBE
HOST_TOOL_DIGEST_CHANGED
PROOF_GAP
```

## Diagnostics And Errors

Good errors name the broken boundary.

```text
GATEWAY_UNBOUND:
The package-install adapter produced evidence, but no gateway check enforced an exact greenlight before mutation.
This is advisory, not Handshake.
```

```text
RAW_SIBLING_MUTATION_POSSIBLE:
The protected package-install path is wrapped, but the host still exposes a raw sibling install path.
This harness does not prove host containment.
```

```text
HOST_TOOL_DIGEST_CHANGED:
The host tool list changed since the last passing probe.
Re-run bypass probes before relying on this readiness report.
```

```text
WRAPPER_DRIFTED:
The installed wrapper does not match the expected adapter digest.
Do not treat prior receipts as evidence for the current protected path.
```

```text
PROOF_GAP:
The harness could not determine whether the mutation reached the gateway before consequence.
Record the gap; do not smooth it into pass/fail.
```

## Anti-Frustration Details

- Always show the one protected path that is in scope.
- Always show raw sibling paths separately from protected path failures.
- Do not fail the whole harness because whole-host containment is absent; mark posture as `ADVISORY_ONLY` or `RAW_SIBLING_MUTATION_POSSIBLE`.
- Cache prior passing probes, but invalidate on host digest, adapter digest, gateway config, or policy version change.
- Give a copy-paste next command after every failure.
- Make `doctor` explain whether the operator needs to install a wrapper, bind a gateway, rerun probes, or accept a non-claim.
- Let operators produce a report even when blocked. A blocked report is useful evidence.
- Do not require dashboard setup for first value. CLI report first; UI later.

## 10-Star Bar

A 10-star first host harness does this:

- Proves one package-install path is gateway-bound before mutation.
- Detects wrapper drift deterministically.
- Hashes the host tool list and invalidates stale readiness.
- Attempts raw sibling package-install routes and reports their posture.
- Separates `protected path enforced` from `host contained`.
- Emits receipts/refusals/proof gaps with stable IDs.
- Produces an operator-readable report in under one minute.
- Gives precise remediation commands.
- Makes non-claims impossible to miss.
- Never lets CLI/MCP evidence masquerade as enforcement.

## Cut Lines

Cut whole-host containment claims.

Cut "agent safety" language.

Cut host-wide badges unless every consequential sibling path is gateway-enforced.

Cut CLI/MCP mutation unless it performs a real gateway check before consequence.

Cut dashboard dependency for the first harness.

Cut generic "policy passed" language unless the exact contract and one-use greenlight are shown.

Cut any report that cannot distinguish:

```text
proposal observed
policy evaluated
gateway checked
mutation attempted
downstream result known
proof gap recorded
```

## Brutal Verdict

Keep the host-specific bypass harness, but narrow it hard.

The first harness should be a package-install protected-path readiness report, not a host security product. Its job is to make an operator confident that one installed adapter path is real Handshake enforcement, while loudly showing every adjacent path that remains advisory, raw, stale, or unproven.

Smallest next mechanism to build: define the `package-install` harness report schema with `host`, `protectedPath`, `toolListDigest`, `wrapperIntegrity`, `probeFreshness`, `rawSiblingAttempts`, `protectedPathPosture`, `evidenceRefs`, and `nonClaims`.
