# Context: Host-Specific Bypass Harnesses

## Invariant

Handshake controls protected actions for automated decision making. It is not engineering-agent-only. A host harness is valid only when it binds a protected action attempt to a named configured installed path and records whether named bypass routes were refused, detected, proof-gapped, or left advisory-only.

## Why This Macro Exists

Handshake already has bypass probe executor machinery and x402 hostile bypass probe precedent. That is not enough to claim host protection.

The missing mechanism is host-specific evidence:

- which host was tested
- which installed path was configured
- which protected action was attempted
- which wrapper was expected
- which raw sibling routes were reachable
- which registry entry bound the gateway
- which freshness state applied
- which evidence survived redaction
- which claims are explicitly not made

## Product Boundary

Handshake is protected actions for automated decision making.

Engineering-agent actions are still an important wedge, but the product category is broader. The host harness must avoid language that narrows Handshake into engineering-agent-only infrastructure.

x402 exact per-call remains the first proof wedge because it demonstrates exact action contract, policy, gateway check, refusal, and bypass evidence. It is not the protocol center.

## First Host Choice

Choose package-manager local host first, after package-install conformance is stable.

Reason:

- package installs are consequential protected actions
- local host paths have visible wrapper and raw sibling distinctions
- package manager bypasses are concrete enough to test
- the adoption path is understandable to engineering organizations
- the evidence boundary can stay narrow

x402 hostile bypass probes should be used second as calibration for hostile probe discipline.

MCP host harnesses are deferred until the package-install host contract is boring. MCP and CLI are proposal, evidence, and read surfaces unless paired with blocking gateway enforcement.

## Evidence Shape

The required evidence object is `BypassProofPacket`.

It must include:

- manifest reference
- host identity
- environment identity
- adapter identity and version
- registry entry
- policy identity
- protected action type
- protected path
- wrapper identity and resolved path
- raw sibling candidates
- tool list digest
- freshness timestamp
- probe results
- wrapper integrity result
- gateway binding result
- gateway check result
- downstream execution result
- refusal evidence
- bypass evidence
- proof gaps
- redacted projection
- non-claims

Redaction must not erase the distinction between gateway check, downstream execution, refusal, bypass, and proof gap.

## Adoption Surface

CLI report comes first.

Target command shape:

- `handshake harness init --host codex --protected-path package-install`
- `handshake harness check --host codex --protected-path package-install`
- `handshake harness probe --host codex --protected-path package-install`
- `handshake harness report --host codex --protected-path package-install`
- `handshake harness doctor --host codex --protected-path package-install`

The CLI must report status and non-claims. Dashboard rendering is deferred until the evidence object is stable.

## Product Bar

A 10-star version does not say "safe."

It says:

- ready for this host fixture
- advisory only for these routes
- stale for this digest
- drifted at this wrapper
- unbound at this gateway
- raw sibling mutation possible at this named path
- proof gap for this missing evidence
- not tested for browser, shell, network, MCP, platform, or ecosystem coverage
