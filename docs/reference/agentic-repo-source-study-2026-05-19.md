# Agentic Repo Source Study

Status: Provenance research input
Date: 2026-05-19
Audience: Product, protocol, security, architecture
Canonical owner: None; use only as source-study input for ADRs and plans
Supports: [`../plans/README.md`](../plans/README.md), [`../adr/0006-agent-native-surface-binding.md`](../adr/0006-agent-native-surface-binding.md), [`../adr/0007-remote-delegation-continuation-boundary.md`](../adr/0007-remote-delegation-continuation-boundary.md), [`../adr/0008-persistent-context-replay-boundary.md`](../adr/0008-persistent-context-replay-boundary.md), [`../adr/0009-protected-resource-custody-boundary.md`](../adr/0009-protected-resource-custody-boundary.md), [`../adr/0010-tier-4-conformance-boundary.md`](../adr/0010-tier-4-conformance-boundary.md)

## Invariant At Stake

External agentic patterns are evidence of pressure, not authority.

Handshake should study what the agent ecosystem is normalizing, then decide which
patterns become explicit contract boundaries, refusal states, proof gaps, or
non-claims. It must not capitulate to the broad claim that any agent framework,
memory layer, trace tool, browser runtime, sandbox, or action registry is already
an execution-control layer.

## Sources Studied

This study used current web/search results from Digg AI GitHub stars and cloned
representative repos into `/tmp/handshake-agentic-repo-study` for local reading.

| Source | Pattern Observed | Handshake Pressure |
|---|---|---|
| [Digg AI GitHub stars](https://digg.com/ai/github/stars) | Current star velocity is concentrated around trace/eval tools, self-improving agents, memory, browser/cloud agents, generated artifacts, and local execution harnesses. | Macro decisions must cover more than single tool calls. |
| [Agent-Native](https://github.com/BuilderIO/agent-native) and [docs](https://www.agent-native.com/docs/what-is-agent-native) | UI, agent, HTTP, MCP, A2A, CLI, extensions, workspace memory, and shared provider connections are peers over shared app state. | Same logical action must bind to the same contract boundary across surfaces. |
| [Raindrop Workshop](https://github.com/raindrop-ai/workshop) | Live token/tool traces, local replay against real agent code, agent-written evals, and MCP trace query tools. | Trace/replay is evidence. It is not production gateway proof. |
| [Hermes Agent](https://github.com/NousResearch/hermes-agent) | Self-improving skills, memory providers, command approval, toolsets, platform adapters, container isolation, API-key migration, cron jobs, and multi-surface messaging. | Memory, skills, command approval, tool allowlists, and isolation are not mutation authority. |
| [mem0](https://github.com/mem0ai/mem0) | Multi-level user/session/agent memory, graph memory, hosted and self-hosted memory, MCP integrations, and agent API-key signup. | Persistent context and key minting need separate authority boundaries. |
| [Browser Use](https://github.com/browser-use/browser-use) | Browser agents, custom tools, persistent browser sessions, cloud sandboxes, profile sync, proxy/captcha handling, CLI surfaces, and production parallelism. | Browser-side and cloud-session authority must be treated as protected surfaces. |
| [LangGraph](https://github.com/langchain-ai/langgraph) | Durable execution, human interrupts, checkpoints, long-running stateful graphs, memory, streaming, and production deployment. | Continuations, checkpoints, retries, and resumed workflows must preserve the original contract boundary. |
| [PrimeIntellect autonomous speedrunning](https://github.com/PrimeIntellect-ai/experiments-autonomous-speedrunning) | Agents generate candidate scripts, launchers, logs, metrics rows, and PR-submitted run artifacts while optimizing toward a benchmark. | Generated artifacts become executable future inputs and need custody/promotion rules. |

## Cross-Source Pattern Map

### 1. Surface Fan-Out Is Default

The modern pattern is not one chat tool calling one API. The same action is
exposed through UI mutations, agent tools, HTTP routes, MCP, A2A, CLI, extensions,
background jobs, and hosted runtime APIs.

Handshake implication:

```text
surface origin is evidence
surface origin is not authority
same action must reduce to same contract boundary
```

### 2. Durable Memory And Skills Are Becoming Agent Infrastructure

Hermes, mem0, and Agent-Native all treat memories, skills, instructions, learned
preferences, and user/session/agent state as first-class future context.

Handshake implication:

```text
memory can inform compilation
memory cannot silently change delegation, policy, or gateway authority
```

### 3. Trace, Eval, Replay, And Debugging Are Productized

Workshop and LangGraph/LangSmith-style systems make trace capture, replay, eval,
debugging, and state visualization central to the developer workflow.

Handshake implication:

```text
replay can reproduce behavior
replay cannot prove production gateway enforcement
```

### 4. Hosted Browser And Sandbox Execution Is Becoming Normal

Browser Use pushes from local browser automation to hosted browser agents with
cloud profiles, proxy/captcha handling, persistent filesystem/memory, custom
tools, CLI, and production-scale parallelism.

Handshake implication:

```text
sandbox or remote browser session is not a gateway
profile/cookie/session access is a protected credential surface
```

### 5. Long-Running Graph Workflows Resume From State

LangGraph and agent-native A2A patterns normalize durable checkpoints, queued
tasks, cancellation, resumption, streaming updates, and multi-step async work.

Handshake implication:

```text
continuation state may resume work
continuation state may not mint fresh authority
```

### 6. Generated Artifacts Become Future Execution Inputs

Autonomous speedrunning and creative-agent repos show agents producing scripts,
configs, launchers, datasets, PRs, model variants, and result records.

Handshake implication:

```text
generated artifact existence is not authorization
promotion from artifact to protected execution is a protected action
```

### 7. Secrets, Keys, Profiles, And Budgets Are Action Surfaces

mem0 agent signup, Browser Use profile sync, Agent-Native vault grants, Hermes
API-key migration, and extension secret proxies all show agents handling
credential and spend-bearing resources.

Handshake implication:

```text
secret onboarding, key minting, token rotation, profile sync, and budget spend
are protected consequences
```

### 8. Concurrency Bugs Are Authority Bugs

Agent-Native's QA notes exposed shared mutable request state, `process.env`
mutation races, and global monkey-patching during concurrent tool calls. These
are not implementation trivia. They can bind the wrong caller, secret, or output
to the wrong action.

Handshake implication:

```text
concurrent protected attempts need immutable per-operation context,
serialization rules, and idempotency
```

## Do Not Capitulate

The ecosystem is converging on useful agent infrastructure:

- agents with memory;
- tools with registries;
- traces with replay;
- UI plus agent parity;
- durable workflow graphs;
- hosted browser/cloud sessions;
- MCP and A2A as connective tissue;
- generated executable artifacts.

Handshake should integrate with these surfaces, but the product claim must stay
narrow:

```text
Only exact contract -> policy -> one-use greenlight -> gateway check before
mutation is Handshake authority.
```

Everything else is compilation evidence, runtime evidence, provenance, adoption
surface, simulation, or proof-gap material.

Smallest next mechanism: use this study only to justify ADR boundaries, then
prove one boundary at a time with red tests before expanding surfaces.
