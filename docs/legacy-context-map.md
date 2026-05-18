# Legacy Context Map

Status: Canonical public alpha  
Version: v0.2.0  
Audience: Product, engineering, documentation authors  
Implementation status: Context map for old `/live/handshake` docs; no legacy doc is canonical unless this page says how it maps  
Canonical owner: Product owner  
Last reviewed: 2026-05-17

## Invariant At Stake

The restart must preserve hard-won learning without importing old product debt.

The old repo is research evidence. v0.2 doctrine lives in this repo.

## Mapping Rules

Each legacy artifact gets one status:

- `reuse`: keep the idea with current v0.2 language;
- `rename`: keep the idea but map old terms to current protocol objects;
- `reject`: do not bring the idea into v0.2 doctrine;
- `defer`: valid later, not part of the v0.2 proof.

## Legacy Artifacts

| Legacy artifact | v0.2 status | Reason |
|---|---|---|
| `docs/strategy/AGENTS_FIRST_POSITIONING.md` | reuse | Runtime plugin as adoption front door is correct, as long as receiver gate remains the enforcement boundary. |
| `docs/adr/021-agent-framework-plugin-pattern.md` | rename | Useful mechanics: fail-closed runtime hooks, explicit allowlists, deterministic argument hashing, structured denial, receipt emission, runtime inspect. Old scoped-authority wording must map to action contracts, policy decisions, one-use greenlights, receiver gates, receipts, and proof gaps. |
| `docs/strategy/HERMES_AGENT_RUNTIME_RESEARCH.md` | reuse | Strong runtime surface inventory: tools, MCP, terminal, cron, skills, memory, channels. Use for runtime integration design, not protocol doctrine. |
| `docs/strategy/OPENCLAW_AGENT_RUNTIME_RESEARCH.md` | reuse | Strong TypeScript runtime-hook evidence and local-review boundary analysis. Use for runtime integration design, not receiver enforcement claims. |
| `docs/strategy/AGENT_ECONOMY_AUTHORITY_LAYER.md` | reject | The tiered framing weakens receiver-gated consequential action control. It may remain strategy pressure, but it is non-canonical for v0.2 unless rewritten around exact contracts, one-use greenlights, receiver gates, and receipts. |

## Term Mapping

| Legacy term | v0.2 handling |
|---|---|
| scoped authority artifacts | Rename to exact action contract plus policy decision plus one-use greenlight where applicable. |
| passport | Defer unless represented as agent/principal identity evidence feeding policy; not mutation authority. |
| mandate | Defer unless represented as operating envelope; an envelope authorizes attempts, not mutation. |
| local runtime review | Rename to runtime-side decision input; it is not receiver gate enforcement. |
| agent readiness | Defer as a management surface until the first receiver-gated receipt loop is working. |
| proof trail | Rename to receipt timeline plus proof gap objects. |

## What Must Not Be Copied

Do not copy old pages into this repo as canonical docs. Re-express only the parts that survive the current invariant.

Do not import old broad category claims before the v0.2 receiver-gated loop is legible and runnable.

Do not use old terminology if it lets an operating envelope, runtime plugin, or review screen masquerade as mutation authority.

Ongoing guardrail: require every new canonical page to state which v0.2 protocol objects it depends on.
