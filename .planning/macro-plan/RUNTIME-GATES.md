# Runtime Gates

## Source Boundary

| Source | Runtime Role | Status |
| --- | --- | --- |
| `.planning/macro-map/AGENT-RUNTIME-MAP.md` | Runtime posture for Passport / Admission / Handle move | Derived gate input |
| `.planning/macro-map/views/AGENT.md` | Generated-agent handoff and misuse risks | Lens evidence |
| `.planning/macro-map/views/RUNTIME.md` | Multi-host and x402/auth.md posture | Lens evidence |
| `.planning/codebase/INTEGRATIONS.md` | Current external rail and host profile map | Derived codebase evidence |
| `src/runtime/ingress/index.ts`, `src/runtime/ingress/schemas.ts` | Proposal-only runtime ingress | Source proof for current runtime posture |
| `src/mcp/x402-proposal.ts`, `src/x402-protected-tool/LANE.md` | MCP proposal and x402 host-profile posture | Source proof for proposal/readback non-authority |
| `README.md`, `docs/internal/protocol-notes.md` | Canonical non-claims for MCP, host profiles, x402, and runtime evidence | Canon |

## Runtime Targets

| Target | Current Evidence | Suitability Posture |
| --- | --- | --- |
| Codex | Local profile and MCP proposal/readback evidence | Usable for first implementation and local verification; no host-wide containment claim |
| Claude Code | Managed profile artifact in x402 protected-tool lane | Surface parity target; verify before runtime-specific claims |
| Hermes | Tool-packet/profile artifact | Surface parity target; verify before runtime-specific claims |
| OpenClaw | Tool-packet/profile artifact | Surface parity target; verify before runtime-specific claims |
| MCP | Local stdio proposal/evidence server | Proposal/readback only; no policy/gateway/mutation |
| x402 | One buyer-side exact per-call local proof path | Protected-action rail; gateway/signer boundary still required |
| auth.md | Credential provenance and protected API profile | Evidence rail; not action approval |
| Browser | Potential side channel | Treat as bypass/proof-gap unless gateway-owned path exists |
| A2A | Task/metadata context | Evidence only |
| OpenAPI | Route/catalog context | Operation description only |

## Suitability Postures

The weakest host posture controls the claim. The plan may say "multi-host evidence posture" but not "multi-host containment." Codex is the active implementation runtime. Other hosts remain product-surface parity and future verification targets until their activation artifacts are source-checked and executed.

## Instruction Sources

Runtime agents must receive:

- `AGENTS.md` invariant and cut lines;
- `AGENT-HANDOFF.md` context bundle;
- `PROTECTED-ACTION-GATES.md` authority boundary;
- source lane `LANE.md` files before edits;
- focused tests for runtime ingress, MCP posture, and surface boundary.

## Tool Contract

Allowed runtime actions:

- inspect admission and handle evidence;
- propose fresh action requests;
- use runtime ingress as proposal evidence;
- read redacted evidence and proof gaps;
- recraft exact contracts after drift or refusal.

Forbidden runtime actions:

- treat handle as permission;
- invoke signer or payment payload generation from admission;
- mutate from Passport/Badge/Handle;
- retry proof gaps as permission;
- dynamically construct protected tools without classifier/refusal checks;
- route around gateway via browser, shell, network, package manager, raw MCP, raw x402, or direct HTTP sibling paths.

## Approval Or Permission Behavior

Human approval of a story, rendered review, or admission report is not permission. Runtime approval must bind to the exact protected-action contract and later gateway check. If the generated code can call an unwrapped consequential tool, the generated code escaped the contract boundary.

## Subagent Behavior

Subagents can review runtime posture, write isolated tests, or implement disjoint slices. They must not claim final runtime suitability. Promoting a host from profile evidence to native operation requires source-specific verification and a separate proof packet.

## Continuation State

Continuation must survive compaction and restart through:

- `.planning/macro-plan/AGENT-HANDOFF.md`;
- `TASKS.jsonl`;
- source comments avoided unless necessary;
- git checkpoints after validated slices;
- test output captured in closeout notes or run validation files.

## Blocked Runtime Checks

These checks block broad claims, not the first Tier 1 implementation:

- no browser/A2A/OpenAPI gateway-owned path exists for this workflow handle;
- no Claude Code, Hermes, OpenClaw, or generic MCP runtime smoke has been executed for service workflow admission;
- no native host containment proof exists;
- no raw sibling inventory specific to this new handle surface exists until runtime misuse tests are written.
