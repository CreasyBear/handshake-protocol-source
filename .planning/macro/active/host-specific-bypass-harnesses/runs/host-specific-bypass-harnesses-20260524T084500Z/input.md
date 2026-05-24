# GSD Macro Input: Host-Specific Bypass Harnesses

Run id: `host-specific-bypass-harnesses-20260524T084500Z`
Date: 2026-05-24

## Hard Frame

Handshake is protected actions for automated decision making, not engineering-agent-only.

x402 exact per-call protected action is the first wedge, not the protocol center.

Host-specific bypass harnesses must prove a configured installed path resisted named host/runtime bypass in a specific environment. They must not claim host-wide MCP/browser/shell/network/package-manager protection.

The target proof shape:

```text
host fixture
-> wrapped protected action succeeds only after gateway
-> raw sibling attempt refused or detected
-> bypass proof packet
-> protected-path posture update
```

## Current Source State

Existing source already contains:

- `runBypassProbeExecutors()` and `BypassProbeExecutor` in `src/adapters/protected-path-probes/executor.ts`.
- `fixtureGatewayCheckedBypassProbeExecutors()` for conformance fixture probes.
- x402 hostile bypass probe executors in `src/adapters/x402-payment/bypass-probes.ts`.
- x402 hostile tests proving:
  - policy greenlights only after gateway-owned hostile probes pass;
  - raw x402 bypass paths cause policy refusal;
  - official SDK side channels are raw sibling bypass evidence;
  - direct payment, token passthrough, wrapper drift, and failure-open probes are distinct;
  - conformance fixture probes cannot manufacture gateway-checked posture;
  - fixture wallet custody is not establishment custody evidence.
- Auth.md bypass probes and MCP surface posture tests exist.

Current `.planning/codebase/CONCERNS.md` says:

- Broad host interception is not proven.
- Runtime ingress and MCP record observed or synthetic bypass-shaped evidence.
- They do not prove all browser, shell, MCP, package-manager, cloud, network, database, or repo mutation paths are intercepted in a real host.
- Require host-specific bypass probes and gateway-owned credentials before claiming protection for a runtime, MCP host, browser tool, shell wrapper, package manager, or cloud adapter.

Current `.planning/macro/DEFERRED-INTEGRATE-ELIMINATE.md` says host-specific bypass harnesses should implement:

```text
host fixture
-> wrapped protected action succeeds only after gateway
-> raw sibling attempt refused or detected
-> bypass proof packet
-> protected-path posture update
```

Mechanisms:

- host/runtime fixture manifest;
- raw sibling attempt probes;
- wrapper integrity checks;
- stale host metadata refusal;
- redacted bypass projection.

Tests:

- fixture pass/fail tests;
- stale metadata tests;
- claim guards preventing host-wide protection language.

Failure mode:

- Host tool list changes after posture is recorded, but gateway still trusts old posture.
- Must refuse or downgrade posture until probes are refreshed.

## Planning Question

Create a macro plan for host-specific bypass harnesses that makes the harnesses source-owned, host-specific, freshness-bound, and impossible to launder into broad host protection claims.

Select the first host harness target. Likely answer: start with local package-manager host harness after package-install adapter conformance, because package install is the next adapter pack and raw package-manager bypass is the sharpest first risk. Challenge if x402-hostile or MCP-host harness should come first.

## Required Output Properties

The plan must include:

- selected first host harness and why;
- explicit non-goals and cut lines;
- host fixture manifest contract;
- raw sibling attempt probes;
- wrapper integrity checks;
- stale metadata and freshness refusal;
- protected-path posture update rules;
- bypass proof packet/redacted projection;
- relationship to package-install adapter expansion;
- relationship to MCP/CLI proposal-only surfaces;
- validation gates and closeout commands;
- claim guards preventing broad host protection language;
- 10-star product bar and antipatterns.

Do not implement source changes in this run.
