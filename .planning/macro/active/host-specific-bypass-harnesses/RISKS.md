# Risks: Host-Specific Bypass Harnesses

## R01: Host-Wide Overclaim

Failure mode: a fixture-level result is described as host protection.

Mitigation: claim guards must reject host-wide, platform-wide, package-manager-wide, MCP-wide, browser/shell/network, and ecosystem-wide claims.

Stop condition: any report says or implies host-wide containment.

## R02: Stale Tool List

Failure mode: a previously valid wrapper or raw sibling list changes, but old probe results still produce `READY`.

Mitigation: bind tool list digest and freshness timestamp. Digest change exits `HOST_TOOL_DIGEST_CHANGED` or `STALE_PROBE`.

## R03: Wrapper Drift

Failure mode: the configured wrapper path changes or no longer binds to the gateway.

Mitigation: compare configured path, resolved path, wrapper digest, and registry binding. Drift exits `WRAPPER_DRIFTED` or `GATEWAY_UNBOUND`.

## R04: Raw Sibling Mutation

Failure mode: package install succeeds through an unwrapped sibling path while Handshake reports protected posture.

Mitigation: raw sibling probes are required. Mutation-capable sibling exits `RAW_SIBLING_MUTATION_POSSIBLE` and blocks `READY`.

Stop condition: raw sibling mutation succeeds without refusal, quarantine, or proof-gap evidence.

## R05: Gateway/Downstream Evidence Collapse

Failure mode: receipt cannot distinguish gateway check from downstream execution.

Mitigation: `BypassProofPacket` has separate gateway check and downstream result fields.

Stop condition: evidence projection flattens these fields.

## R06: MCP/CLI Enforcement Overclaim

Failure mode: report or proposal surfaces are treated as enforcement.

Mitigation: MCP and CLI are proposal/evidence/read surfaces unless paired with blocking gateway checks.

## R07: Weak Source Authority

Failure mode: fixture `sourceAuthority` is treated as establishment custody or real gateway ownership.

Mitigation: fixture authority remains fixture-only and cannot produce establishment custody evidence.

## R08: Token Passthrough

Failure mode: a token or payment proof is passed around the wrapper, creating false gateway posture.

Mitigation: token passthrough remains a distinct bypass class and must be recorded separately.

## R09: Fixture Laundering

Failure mode: conformance fixture probes are used to manufacture gateway-checked host posture.

Mitigation: conformance fixture evidence can satisfy schema behavior only, not host posture.

## R10: Redaction Erases Control Meaning

Failure mode: redacted report hides the difference between refusal, bypass, downstream uncertainty, and proof gap.

Mitigation: redaction policy must preserve control-state labels and evidence categories.
