# Plain-English Protocol Guide

Last plain-language protocol audit: 2026-05-21.

This document translates `docs/internal/protocol-definition.md` and
`docs/internal/protocol-kernel-architecture.md` into plain language. If this
guide conflicts with the protocol definition, the protocol definition wins.

## The Simple Idea

Handshake exists because automated systems and agents will do real work through tools.

Some of that work changes things that matter: packages, repos, deploys, cloud
settings, CI, databases, and other protected systems.

Handshake says:

> Before an agent changes a protected system, turn the attempted change into an
> exact work order, check that exact work order, make the real gate check the
> pass before anything changes, and keep a record of what happened.

For a builder-buyer, the product outcome is a cleared protected-action event: a
specific terminal Handshake event with reconstructable evidence that a service
can accept, refuse, or treat as a proof gap.

The protocol kernel is the source-owned machinery that records the exact work
order, decision, pass, gate check, receipt/refusal/proof gap, and optional
certificate. A product surface is the CLI, MCP, SDK, docs, demo, or
service-facing readback that exposes proposal and evidence without creating
authority.

## The Work Order

A vague request is not enough.

This is vague:

```text
Upgrade staging.
Fix the build.
Install the package.
Ship the preview.
```

Handshake forces the agent to produce the exact work order:

```text
action: x402_payment.exact
endpoint: https://api.example.test/report
payee: 0x1234...abcd
network: base-sepolia
token: USDC
amount: 2500 atomic units
expected side effect: wallet payment signature for one paid request
gateway: x402-wallet-gateway
```

That exact work order is the action contract.

## The Pass

If policy allows the exact work order, Handshake may issue a one-use pass.

The pass is not general permission. It is not:

- "the agent is trusted";
- "the tool is safe";
- "the whole plan is approved";
- "future retries are allowed";
- "nearby actions are allowed."

It means only:

> This one exact work order may be checked by this one gateway before this one
> mutation attempt.

## The Gate

The gateway is the part that can actually block the protected system from
changing.

For package install, the gateway controls the manifest edit.

For deploy, the gateway controls the deploy call.

For repo write, the gateway controls the write path.

For cloud config, the gateway controls the cloud mutation credential.

If the gateway cannot block the change, Handshake can observe or record, but it
cannot protect that path.

## The Credential

Some protected actions need a credential: a wallet signer, deploy token, cloud
key, database credential, or future vault-backed secret.

Handshake does not give that credential to the agent. The action contract can
carry an opaque credential reference that says, in effect:

```text
this gateway may use this gateway-held credential reference
for this protected action shape
against this resource
if policy and the gateway check both pass
```

That reference is not the secret. It is not permission. It is evidence that the
gateway knows which credential posture it is expected to hold.

If the ref is missing, stale, unsafe, scope-mismatched, isolated, or points at a
changed provider registry entry, Handshake refuses before protected mutation.
If the gateway resolves or uses the credential after a passed gateway check, it
records redacted credential-resolution evidence. Raw secret material and
provider secret paths must not appear in protocol records or projections.

## The Record

After the check, Handshake records what happened:

- the work order;
- the policy decision;
- the one-use pass, if one was issued;
- the gateway check;
- whether mutation was attempted;
- whether downstream result is known;
- whether there was a refusal;
- whether evidence is missing or ambiguous.

That record is a receipt.

A receipt proves the Handshake chain. It does not prove the action was useful,
safe, profitable, or successful everywhere downstream.

## The Certificate

After a receipt, durable refusal, proof gap, or replay refusal exists, Handshake
can emit an `AuthorityCertificate`.

The certificate is terminal evidence, not permission. It is not identity,
settlement, hosted trust, reusable auth, or a pass for another action.

A service can use a certificate during an event by verifying pinned trust
material and checking:

- the terminal kind;
- the action class;
- the resource;
- required signer roles;
- gateway admission;
- certificate and key status.

The service then decides `accept`, `refuse`, or `proof_gap` for its own flow.

## What This Repo Proves Today

This repo proves the local kernel mechanics: exact work orders, one-use passes,
gateway checks, refusals, proof gaps, idempotency duplicate handling, local D1
reconstruction, x402 payment runtime ingress, local payment gateway fixture
coverage, package-install parameter binding, provider-neutral credential refs
and redacted resolution evidence, auth.md protected API call provenance/custody
evidence, and representation shapes that cannot create permission.

It does not prove a live hosted service, a real external payment provider
gateway, live vault-provider custody, generic MCP/runtime control, x402
aggregate payment-budget management, or independent package-material verification.
It does include local AuthorityCertificate minting and offline pinned-key
verification and non-mutating hosted verifier projections over configured local
trust material, but not cross-org trust, live key revocation authority,
marketplace certification, or provider custody.

Local/source-owned surfaces are validated. Public npm
`handshake-protocol-kernel@0.2.7` is verified by trusted-publish workflow,
registry readback, npm signature metadata, provenance publication, and clean
installed-artifact smoke; public npm availability does not create authority. MCP
Registry discoverability remains a proof gap.

## The Whole Flow

```mermaid
flowchart LR
  A["Person gives vague intent"] --> B["Agent generates a plan or code"]
  B --> C["Handshake extracts exact attempted action"]
  C --> D["Exact work order"]
  D --> E["Policy checks the exact work order"]
  E --> F{"Allowed?"}
  F -->|"no"| G["Refusal recorded"]
  F -->|"needs review"| H["Review tied to exact work order"]
  H --> E
  F -->|"yes"| I["One-use pass"]
  I --> J["Gateway checks pass before mutation"]
  J --> K{"Gate result"}
  K -->|"refuse"| G
  K -->|"pass"| L["Mutation attempt"]
  K -->|"missing evidence"| M["Proof gap recorded"]
  L --> N["Receipt recorded"]
  N -->|"uncertain downstream result"| M
```

## Gateway Policy In Plain English

Gateway policy is the rulebook for one protected gate.

It is set before the agent acts, by the owner of the protected system.

Self-hosted example:

```text
In this repo, the package-install gateway may edit only this manifest,
only through the package_install action shape,
only when package name, version, manifest path, package manager,
params digest, and idempotency key match the one-use pass.
```

Hosted example:

```text
An org admin sets the policy in Handshake Cloud.
Handshake Cloud versions and distributes the policy.
The gateway still checks it before mutation.
```

The agent can read the policy. The agent cannot define the policy for the
action it wants to perform.

## Deny Events

A denial is not noise. It is part of the protocol.

Examples:

- the agent's proposed action is too vague;
- the action is not in the action catalog;
- the resource is outside the allowed envelope;
- policy refuses;
- review rejects;
- the pass expired;
- the pass was already used;
- gateway parameters drifted;
- gateway policy changed incompatibly;
- isolation is active;
- downstream evidence is missing.

The right outcome is a refusal or proof gap, not a hidden retry.

## Conflict Resolution

Handshake resolves conflict by narrowing authority.

If two rules disagree, do not mutate.

If the gateway policy changed incompatibly, do not mutate.

If evidence is missing, say evidence is missing.

If recovery needs another action, create a new work order. Do not reuse the old
pass.

## Is It Two-Sided?

At the core event, no.

The event is one protected mutation attempt:

```text
one exact work order
one decision
one-use pass
one gateway check
one receipt, refusal, or proof gap
```

There are two boundaries:

- the agent/action boundary, where vague intent becomes an exact work order;
- the gateway boundary, where the protected system can actually block the
  mutation.

That does not make the core protocol a marketplace or negotiation protocol.

## Bilateral Ecosystem In Plain English

Bilateral ecosystem use can emerge when agents negotiate obligations for
different principals.

But each side still authorizes only its own protected surface.

Example:

```text
Agent A offers: deploy a preview.
Agent B offers: run an evaluation against the preview.
```

That should become:

```text
Agreement:
  A obligation -> A action contract -> A policy -> A gateway -> A receipt
  B obligation -> B action contract -> B policy -> B gateway -> B receipt
```

A cannot authorize B's system. B cannot authorize A's system.

The bilateral object is the agreement. The enforcement object is still each
side's own action contract and gateway check.

## Translation Table

| Plain phrase             | Protocol phrase                                 |
| ------------------------ | ----------------------------------------------- |
| The person asks for work | Principal intent                                |
| The agent makes a plan   | Runtime execution and generated execution graph |
| The proposed change      | Candidate action                                |
| The exact work order     | Action contract                                 |
| The rule check           | Policy decision                                 |
| The one-use pass         | Greenlight                                      |
| The real gate            | Gateway check                                   |
| Gateway-held credential  | Gateway credential ref                          |
| Credential use evidence  | Credential resolution evidence                  |
| The change attempt       | Mutation attempt                                |
| The record               | Receipt                                         |
| The no                   | Refusal                                         |
| The missing evidence     | Proof gap                                       |
| The emergency stop       | Isolation state                                 |
