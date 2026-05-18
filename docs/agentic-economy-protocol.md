# Agentic Economy Protocol

Status: Canonical public alpha  
Version: v0.2.0  
Audience: Agent-runtime builders, receiver owners, platform engineering, security engineering  
Implementation status: North-star doctrine; v0.2 implementation proves only the receiver-gated consequential action loop  
Canonical owner: Product owner  
Last reviewed: 2026-05-17

## Invariant At Stake

The agentic economy will fail operationally if autonomous systems can create consequence from vague intent, runtime affordance, or generated code without an exact receiver-gated contract.

Handshake exists to make autonomous consequence contractible.

## Doctrine

Agents will increasingly act through generated code, tool dispatch, MCP servers, deployment surfaces, package managers, cloud APIs, scheduled jobs, browser tools, and agent-to-agent delegation.

The hard problem is not whether an agent has an identity or a tool list. The hard problem is whether a consequential action attempt is reduced to an exact, inspectable, policy-evaluated, receiver-bound contract before mutation.

Handshake v0.2 takes the narrowest credible path:

- The runtime is where action attempts originate.
- The contract is the unit of control.
- The policy decision is made against the exact contract.
- The greenlight is one-use attempt authority.
- The receiver gate is the enforcement boundary.
- The receipt records what was checked, what happened, and what evidence is missing.

## What This Enables Later

The broader protocol can eventually support cross-runtime agent work, agent-to-agent delegation, payment rails, receiver networks, and organization-level governance. Those are downstream applications of the same primitive.

v0.2 earns that ambition by proving one exact consequential action cannot mutate without a matching receiver-gated greenlight.

## What v0.2 Claims

v0.2 claims:

- A consequential action can be represented as an exact `ActionContract`.
- A policy evaluator can decide against that exact contract and current isolation state.
- A greenlight can bind to one exact receiver, resource, parameter digest, and contract digest.
- A receiver gate can refuse missing, expired, mismatched, replayed, or isolated greenlights before mutation.
- A receipt can distinguish policy decision, gate check, greenlight consumption, mutation attempt, downstream status, and proof gap.

## What v0.2 Does Not Claim

v0.2 does not claim that installing a runtime plugin is enough. It does not claim that a review screen is authority. It does not claim that a trace is execution proof. It does not claim that the system understands every kind of autonomous work.

v0.2 is intentionally narrow because the primitive has to survive adversarial generated code, retries, stale policy, receiver drift, missing evidence, and replay attempts.

Smallest next product shipment: one end-to-end action contract that reaches a receiver gate and produces a receipt.
