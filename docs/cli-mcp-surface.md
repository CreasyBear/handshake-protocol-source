# CLI And MCP Surface

Status: Canonical public alpha
Version: v0.2.1
Audience: Agent-runtime builders, MCP/tool adapter owners, platform engineering, gateway owners
Implementation status: Product surface architecture; implementation remains target work
Canonical owner: Product owner
Last reviewed: 2026-05-18

## Invariant At Stake

Handshake's developer product must be gateway-plural.

The CLI and MCP server are the adoption surface for protected action proposals. They are not the authority boundary and must not hold standing gateway mutation authority by default.

If the product becomes "the GitHub App repo-write tool," the first wedge has swallowed the protocol.

## Product Shape

The next product-shaped mechanism is:

```text
Handshake CLI/MCP protected action surface
  -> Handshake protocol/control plane
  -> gateway adapter registry
  -> first adapter: GitHub App-backed repo_write_gateway
```

GitHub is the first gateway adapter because protected repo-write-to-PR is a credible engineering-agent wedge. The reusable product is the CLI/MCP surface that turns consequential agent actions into exact protocol contracts.

## CLI Responsibilities

The CLI is for setup, local operation, inspection, and conformance.

Target commands:

```text
handshake init
handshake dev
handshake mcp start
handshake gateways install github
handshake gateways status
handshake policies apply
handshake contracts show <action_contract_id>
handshake receipts show <receipt_id>
handshake conformance run
handshake doctor
```

First slice phases:

| Phase | Purpose | Commands |
|---|---|---|
| Local protocol surface | Configure and inspect the existing protocol/control-plane API | `handshake init`, `handshake dev`, `handshake contracts show`, `handshake receipts show`, `handshake doctor` |
| MCP proposal surface | Expose protected agent proposal tools without gateway credentials | `handshake mcp start`, `handshake mcp inspect` |
| First action shortcut | Make the generic proposal surface usable for the first engineering-agent wedge | `handshake.repo.propose_write_to_pr` |
| Gateway install posture | Make credential-owning adapter state visible | `handshake gateways install github`, `handshake gateways status`, `handshake gateways doctor github` |

The CLI may:

- start a local or configured MCP server;
- configure control-plane endpoint and durable-store posture;
- register tool capabilities, action types, gateway entries, and policy packs;
- check gateway installation state;
- render Contract Viewer and Receipt Timeline output;
- run black-box conformance checks against public protocol and gateway interfaces;
- show raw-bypass posture and missing gateway capabilities.

The CLI must not:

- silently mutate gateways;
- create GitHub branches, commits, or pull requests directly in the CLI path;
- turn conformance scenarios into production APIs;
- issue greenlights outside the protocol/control plane;
- imply control when the agent still has raw mutation credentials;
- collapse gateway check, downstream execution, and receipt into one success state.

## MCP Responsibilities

The MCP server is for agent-facing protected tools.

Generic tools:

```text
handshake.contract.propose
handshake.contract.show
handshake.receipt.show
handshake.refusal.explain
handshake.proof_gap.show
handshake.gateway.status
```

Action-family tools may be provided as ergonomic shortcuts:

```text
handshake.repo.propose_write_to_pr
handshake.package.propose_install
handshake.deploy.propose_preview
handshake.ci.propose_workflow_change
```

The `propose` verb is load-bearing. It means the tool proposes an exact action candidate or returns structured refusal state. It does not mean the tool mutates the gateway.

Every action-family tool must reduce to the same protocol loop:

```text
intent compilation
  -> exact action contract
  -> policy decision
  -> one-use greenlight or refusal/review/halt/quarantine
  -> gateway check
  -> mutation, refusal, proof gap, or reconciliation
  -> receipt
```

The MCP server may:

- expose protected proposal tools to agents;
- validate tool inputs against action catalog schemas;
- include principal intent refs, generated code/spec refs, and runtime context;
- return structured contract, refusal, proof-gap, gateway-not-installed, or receipt references;
- make raw-bypass posture visible to the agent and operator.

The MCP server must not:

- hold provider write tokens for guarded gateways by default;
- issue greenlights;
- call gateway checks as a runtime-side shortcut;
- execute gateway mutations;
- treat MCP transport authorization as gateway-side mutation authorization;
- expose raw sibling mutation tools for the same guarded gateway/resource.

## First Action Shortcut Contract

`handshake.repo.propose_write_to_pr` is the first action-family shortcut behind the generic proposal surface.

Inputs:

- principal intent reference;
- generated code or spec reference;
- provider;
- owner;
- repository;
- base ref;
- target branch namespace or proposed target ref;
- file path;
- expected old blob SHA or explicit absent marker;
- content or content digest plus content retrieval reference;
- content byte length;
- sequence number;
- required prior action contract IDs.

Outputs:

- action contract proposed;
- compilation refused;
- gateway not installed;
- raw bypass possible;
- proof gap;
- receipt reference only when gateway evidence exists.

The first implementation may stop at action-contract proposal. Policy evaluation, greenlight issuance, gateway execution, and reconciliation may remain explicit later steps until the GitHub App-backed gateway adapter exists. This avoids pretending that proposal is execution.

## First Gateway Adapter

The first gateway adapter is:

```text
GitHub App-backed repo_write_gateway
```

It is used by:

```text
handshake.repo.propose_write_to_pr
```

The adapter owns the GitHub installation token and checks the exact one-use greenlight before creating a generated branch, committing exact content, or opening a pull request.

The GitHub App adapter is one component behind the CLI/MCP surface. It is not the product boundary.

The CLI does not use the GitHub App token to mutate. The gateway adapter uses it only after a passed gateway check.

## Install Posture

A valid protected repo-write-to-PR pilot requires two installation halves:

Runtime/tool owner:

- installs or enables Handshake MCP;
- exposes protected proposal tools;
- removes raw GitHub write credentials from the guarded agent path;
- removes raw GitHub mutation sibling tools for guarded repos where feasible;
- accepts structured refusals and proof gaps.

Gateway/credential owner:

- installs the GitHub App-backed `repo_write_gateway`;
- grants least-privilege repository permissions;
- configures allowed repositories, base refs, generated branch namespace, path bounds, and workflow-file policy;
- verifies exact greenlights before every mutation credential use.

If either half is missing, the UI and receipts must show that Handshake is not enforcing the full path.

## Product Surfaces

The first visible surfaces are:

- Contract Viewer;
- Receipt Timeline;
- Install Health;
- structured refusal/proof-gap detail.

Install Health is allowed only as posture evidence:

- CLI configured;
- MCP server reachable;
- control plane durable store available;
- gateway adapter installed;
- credential custody known;
- raw-bypass posture known;
- action catalog installed;
- gateway registry entry installed;
- receipt and proof-gap capability available.

It must not become an org dashboard before gateway-checked activation.

## Conformance Boundary

`handshake conformance run` validates implementations. It is not the production integration contract.

Conformance must call public protocol and gateway interfaces and must include:

- happy path;
- policy refusal;
- gateway refusal;
- replay refusal;
- parameter mismatch refusal;
- proof gap;
- downstream reconciliation;
- raw-bypass posture.

Passing conformance is evidence. It is not authority.

## Smallest Next Mechanism

Define the first CLI/MCP product slice:

```text
handshake init
handshake mcp start
handshake gateways install github
handshake.repo.propose_write_to_pr
handshake contracts show
handshake receipts show
handshake doctor
```

Then implement it against the existing protocol surfaces and the first GitHub App-backed gateway adapter plan.
