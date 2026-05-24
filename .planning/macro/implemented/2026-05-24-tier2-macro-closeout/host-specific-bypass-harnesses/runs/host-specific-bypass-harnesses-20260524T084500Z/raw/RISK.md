# RISK: Host-Specific Bypass Harnesses

## Invariant At Stake

A host-specific bypass harness may only prove that one named, configured, installed path resisted named bypass attempts at a recorded freshness/version state. Anything broader is advisory, not Handshake.

## Threat Model / Premortem

Six months from now, the failure is not that the x402 bypass harness was useless. The failure is that it got laundered into a broad claim: "host interception is covered." It was not.

The actual threat is generated automation finding an adjacent mutation path that the harness did not name: another binary on `PATH`, a sibling package manager, a direct MCP call, a CLI subcommand, a token passthrough path, a fixture that reports authority without gateway proof, or a stale tool list that no longer matches the installed host.

The harness must assume:

- the automated system can inspect environment shape and choose the easiest reachable mutation path;
- wrapper coverage drifts as hosts upgrade, aliases change, symlinks move, or package managers add subcommands;
- MCP and CLI surfaces expose overlapping authority but different enforcement boundaries;
- source fixtures can fabricate or weaken authority if `sourceAuthority` is not tied to gateway evidence;
- receipts can project evidence from one protected path onto another unless scoped aggressively.

## Risks

| Risk | Failure Mode | Required Counter-Evidence |
|---|---|---|
| Stale host tool list | Harness tests old configured tools while new reachable tools exist. | Fresh host inventory with command path, version, checksum or equivalent identity, generated immediately before probe. |
| Wrapper drift | Wrapped binary no longer matches actual invoked binary, alias, shim, or subcommand path. | Resolution proof for every tested command: configured wrapper path, resolved executable path, and gateway-bound invocation path. |
| Raw sibling tool reachability | `npm` is wrapped but `pnpm`, `yarn`, `bun`, `npx`, `corepack`, or direct package-manager shims remain reachable. | Negative bypass probes for sibling package-manager binaries and direct shim execution. |
| MCP/CLI overclaim | Passing CLI bypass tests is treated as MCP protection, or MCP probes are treated as CLI protection. | Separate receipts for MCP tool calls and CLI invocations, with distinct authority boundary labels. |
| `sourceAuthority` weakness | Weak conformance fixtures claim source authority without proving gateway-side evaluation. | Fixture receipts must distinguish conformance-source authority from gateway-probe authority. Weak fixtures cannot support protection claims. |
| Token passthrough | Runtime obtains or reuses a token that lets raw tools mutate outside the gateway. | Tests showing raw token use fails or is quarantined when not bound to exact greenlight and gateway check. |
| Fixture laundering | A fixture produces a green-looking result that is later cited as enforcement evidence. | Fixture output must be marked non-enforcement unless it includes gateway decision, greenlight binding, gateway check, and mutation attempt result. |
| Evidence projection leakage | Evidence from x402 probes is used to imply package-manager, MCP, cloud, or host-wide protection. | Claim schema must bind evidence to action type, host tool, path, version, gateway registry entry, and freshness timestamp. |

## Validation Gates

1. **Scope Gate**
   Every bypass harness result must name exactly what it covers: host, runtime, installed path, resolved binary, tool version, adapter version, gateway registry entry, action type, and timestamp.

2. **Freshness Gate**
   The harness must fail closed if host inventory is stale, incomplete, or not captured immediately before test execution.

3. **Reachability Gate**
   For package-manager expansion, test the wrapped path and raw sibling paths separately. Passing `x402` probes does not count.

4. **Gateway Evidence Gate**
   A passing result must include proposal, policy decision, one-use greenlight binding, gateway check, execution result or refusal, and proof-gap handling.

5. **Boundary Label Gate**
   Every receipt must label whether it came from fixture conformance, gateway probe, CLI path, MCP path, browser path, or adapter path.

6. **Overclaim Gate**
   Docs, test names, report names, and status summaries must not say "host protected," "interception covered," or "bypass-proof." They may say only: "named configured path resisted named bypass attempts at recorded freshness state."

## Stop Conditions

Stop and do not claim protection if:

- host tool inventory cannot be refreshed;
- raw sibling package-manager reachability is untested;
- wrapper resolution differs from the actual executed binary;
- MCP and CLI evidence are mixed into one claim;
- `sourceAuthority` is fixture-derived without gateway proof;
- token passthrough can mutate without exact greenlight binding;
- a fixture result is cited as gateway enforcement;
- receipts cannot distinguish gateway check from downstream execution;
- evidence from x402 is projected onto package-manager, MCP, CLI, or host-wide claims.

## Brutal Verdict

Keep the host-specific bypass harnesses, but narrow the claim hard. They are useful as named-path adversarial probes. They are dangerous as host protection evidence.

The smallest next mechanism to build: a bypass evidence claim schema that forces every result to bind to `hostToolIdentity`, `resolvedPath`, `adapterVersion`, `gatewayRegistryEntry`, `actionType`, `freshnessTimestamp`, `probeClass`, and `claimScope`.
