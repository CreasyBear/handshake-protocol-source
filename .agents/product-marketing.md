# Product Marketing Context

*Last updated: 2026-05-17*

## Product Overview

**One-liner:** Handshake provides receiver-gated action contracts and receipts for coding agents doing production-adjacent work.

**What it does:** Handshake turns a consequential agent action attempt into an exact action contract, evaluates policy against that contract, issues a one-use receiver-bound greenlight or refusal, requires the receiver gate before mutation, and records a receipt or proof gap. It exists so engineering teams can delegate larger agent actions without giving agents ambient authority.

**Product category:** Contracted execution for engineering agents.

**Product type:** Developer infrastructure / protocol-backed SaaS and SDK.

**Business model:** Founder-led paid pilots first; later team and enterprise plans based on receiver-gated action families, receipt retention, policy packs, and integration scope.

## Target Audience

**Target companies:** AI-forward engineering organizations using coding agents near CI, deploy, package, repo, cloud, or database workflows. Best early fit: 20-500 person software companies or platform teams with visible agent usage and one reachable receiver owner.

**Decision-makers:** CTO, VP Engineering, Head of Platform, Head of Developer Productivity, AI Tooling Lead, security-minded engineering leader.

**Primary use case:** Let coding agents execute one guarded production-adjacent action under exact receiver-gated bounds.

**Jobs to be done:**

- Let agents complete larger engineering tasks without babysitting every risky command.
- Prevent missing, replayed, mismatched, isolated, or drifted actions from mutating receivers.
- Reconstruct what the agent attempted, what policy decided, what the receiver checked, and what evidence remains.

**Use cases:**

- Preview deploy from a coding-agent run.
- Protected repo write or release file change.
- Package install or dependency change.
- CI/release mutation.
- Support/billing challenger: one bounded account or billing mutation.

## Personas

| Persona | Cares about | Challenge | Value we promise |
|---|---|---|---|
| Champion: AI Tooling / DevProd Lead | More useful agent workflows, developer throughput, low-friction adoption | Agents are useful but blocked at production-adjacent consequence | One guarded action family that lets agents do more without ambient authority |
| Technical Buyer: Platform / Receiver Owner | Integration boundary, enforceability, idempotency, drift, receipts | Runtime hooks and logs do not control receiver-owned mutation | Receiver gate consumes exact one-use greenlights before mutation |
| Economic Buyer: CTO / VP Engineering | Engineering leverage, risk, focus, budget justification | Coding agents need supervision near deploy/CI/package/cloud work | More autonomous work with refusal and reconstruction |
| Security Influencer | Pre-mutation control, evidence, incident reconstruction | Chat logs and command approvals are weak evidence | Receipts, proof gaps, and receiver refusals tied to exact contracts |
| User: Staff Engineer / Agent Power User | Less approval noise, fewer stalled runs, clear recovery | Raw approvals are hard to interpret and easy to rubber-stamp | Structured refusals and receipts around the real action |

## Problems & Pain Points

**Core problem:** Teams want agents to do more useful engineering work, but they block or babysit them when actions can mutate CI, deploy systems, packages, repos, cloud resources, or databases.

**Why alternatives fall short:**

- Runtime approvals stop local dispatch but do not enforce receiver-owned consequence.
- Logs explain after the fact but do not refuse before mutation.
- Human review screens can drift from the exact action.
- Generic policy gateways often do not bind one exact greenlight to one receiver-gated mutation.

**What it costs them:** Supervision time, stalled background-agent workflows, fewer production-adjacent tasks delegated to agents, weak reconstruction after a run, and security/platform reluctance to expand agent authority.

**Emotional tension:** "I want the agent to keep going, but I do not trust the boundary."

## Competitive Landscape

**Direct:** Runtime-native approvals and agent-tool guardrails. They fall short when enforcement ends at the runtime and the receiver still accepts raw mutation.

**Secondary:** API gateways, MCP gateways, CI policy, cloud IAM, secrets management, audit logs. They solve adjacent control problems but do not model exact agent-originated action contracts with one-use receiver gates and receipts.

**Indirect:** Manual human review, blocked agent capabilities, internal scripts, "just trust senior engineers." These preserve control by reducing autonomy.

## Differentiation

**Key differentiators:**

- Exact action contract as the unit of consequence.
- One-use greenlight bound to receiver, action, resource, parameter digest, and contract digest.
- Receiver gate before mutation.
- Receipts and proof gaps that distinguish policy, gate check, mutation attempt, downstream status, and missing evidence.
- Generated orchestration treated as proposal, not authority.

**How we do it differently:** Handshake splits issuer/runtime proposal from receiver enforcement and makes the receiver consume exact authority before mutation.

**Why that's better:** The control boundary survives runtime bypass, replay, drift, and stale review artifacts.

**Why customers choose us:** They want agents to perform larger work, but only when the receiver enforces exact bounds and the chain is reconstructable.

## Objections

| Objection | Response |
|---|---|
| Agent vendors will build this. | They will build local approvals and logs first. Handshake matters where receiver-owned consequence crosses runtimes and tools. |
| We do not let agents near production. | Start with preview deploy, protected repo write, package install, or CI mutation. If no larger bounded action is desired, this is not the buyer. |
| We already have logs. | Logs after mutation are evidence, not enforcement. Handshake proves receiver refusal before mutation. |
| We need human approval. | Human review can be a policy outcome, but it must bind to the exact contract digest the receiver enforces. |
| This is too much integration. | The first pilot is one runtime, one receiver, one action. If that is too much, the team is too early. |

**Anti-persona:** Teams not using agents for real work, teams only wanting audit dashboards, teams without receiver ownership, teams expecting a runtime vendor to solve all control inside one stack, and teams that do not want agents to take larger bounded actions.

## Switching Dynamics

**Push:** Raw command approvals are noisy, agent runs stall near consequence, and logs are weak reconstruction.

**Pull:** One guarded action family can increase agent autonomy while preserving receiver control.

**Habit:** Teams keep agents read-only or local-only; humans approve raw commands; platform teams rely on existing CI/IAM/audit logs.

**Anxiety:** Integration burden, agent-vendor absorption, fear of slowing developers, concern that receiver enforcement is overkill.

## Customer Language

**How they describe the problem:**

- "What are agents still not allowed to do?"
- "Raw command approvals are too hard to interpret."
- "We want background agents, but not with deploy authority."
- "Can we reconstruct what actually happened?"

**How they describe us:**

- "Receiver-gated action contracts."
- "A way to let agents do one bigger action without ambient authority."
- "Receipts for what was attempted, allowed, refused, and executed."

**Words to use:** action contract, receiver gate, one-use greenlight, refusal, proof gap, receipt, production-adjacent, bounded action, reconstructable chain.

**Words to avoid:** safe, trust layer, approval platform, agent smart contract, circuit breaker platform, governance, compliance, universal agent auth, dashboard.

**Glossary:**

| Term | Meaning |
|---|---|
| Action contract | Exact proposed consequential action with receiver, resource, parameters digest, bounds, and digest. |
| Greenlight | One-use receiver-bound execution authority created by policy for one exact action contract. |
| Receiver gate | Enforcement point that checks the exact greenlight before mutation. |
| Receipt | Reconstructable evidence of proposal, decision, gate check, mutation/refusal, proof gaps, and finality state. |
| Proof gap | First-class record that evidence is missing, unavailable, expired, invalid, or contradictory. |

## Brand Voice

**Tone:** Direct, technical, commercially sharp.

**Style:** Plainspoken, mechanism-first, buyer-aware.

**Personality:** Exacting, pragmatic, skeptical, founder-led, developer-literate.

## Proof Points

**Metrics:** Not yet validated by paid pilots.

**Customers:** None yet.

**Testimonials:** None yet.

**Value themes:**

| Theme | Proof |
|---|---|
| More bounded agent autonomy | Pending design-partner proof |
| Receiver refusal before mutation | Required first demo proof |
| Reconstruction | Receipt timeline from reference receiver run |
| Buyer urgency | Pending 10-15 discovery conversations |

## Goals

**Business goal:** Validate whether engineering teams will pay for receiver-gated action contracts because it lets agents do more valuable work.

**Conversion action:** Paid design-partner pilot for one guarded action family.

**Current metrics:** No paid pilot evidence yet.
