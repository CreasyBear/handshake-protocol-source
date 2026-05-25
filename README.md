# Handshake Protocol Kernel

Handshake is protected action infrastructure for automated decision making. This
package is the installable protocol kernel, CLI, SDK, and local MCP
proposal/evidence server for reducing one consequential automated action to an
exact contract before mutation. Vague intent and generated code are not
authority. A protected path requires an
exact action contract, policy decision, one-use greenlight or refusal, gateway
check before mutation, and receipt, refusal, replay refusal, proof gap, or
optional terminal AuthorityCertificate. Certificate is terminal evidence, not
permission.

Category: protected actions for automated decision making; certificate is terminal evidence, not permission.

Core terms: a `cleared protected-action event` is one terminal event with
reconstructable evidence; the `protocol kernel` is the only authority state
machine and schema set; a `product surface` is a projection/readback surface
such as CLI, MCP, docs, demo, or service readback that exposes
proposal/evidence without creating authority. Role-scoped protocol transition
clients, such as SDK policy or gateway clients, transport specific kernel
transitions under custody; they are not product authority surfaces. Public npm availability
does not create authority. MCP Registry discoverability remains a proof gap
until registry acceptance and lookup are verified.

First-use product projection/readback surfaces should teach the service workflow as:

```text
Show Passport
-> ServiceWorkflowAdmission
-> ServiceWorkflowHandle
-> Request Clearance for one protected action
-> Read Outcome
```

`Passport` means a presented evidence package, not identity or reusable auth.
`ServiceWorkflowAdmission` means service-side accepted/refused/stale/proof-gap
mapping, not policy. `ServiceWorkflowHandle` means correlation and readback
context only, not permission. Each protected action still requires a fresh exact
action contract, policy decision, one-use greenlight or refusal, and gateway
check before mutation.

Package: `handshake-protocol-kernel@0.2.7`. MCP name:
`io.github.CreasyBear/handshake-protocol-kernel`. Runtime: Node.js `>=20`.
License: Apache-2.0. Published package repository form: package artifact repository, not source mirror.
The published package repo contains package artifacts and trusted-publish
metadata only; it must not contain source, tests, scripts, examples, docs,
planning scratch, local artifacts, `node_modules`, or credential material.

`npm install handshake-protocol-kernel`. For one-shot checks:
`npm exec --package handshake-protocol-kernel -- handshake schema` and
`npm exec --package handshake-protocol-kernel -- handshake conformance
x402-payment`. Binaries: `handshake` is the operator CLI; `handshake-mcp` is the
local stdio MCP proposal/evidence server; `handshake-protocol-kernel` aliases
the MCP server for package-name execution.

Installed x402 first-use ladder:

```bash
handshake init --cwd .
handshake doctor --cwd .
handshake install x402-payment ./install.x402-payment.json --record-local
handshake probes x402-payment ./x402-posture.json --record-local
handshake register x402-gateway-readiness ./x402-gateway-readiness.json --record-local
handshake install health --cwd .
handshake-mcp
```

In service-workflow terms, these CLI commands prepare local/readiness evidence
before any fresh `ServiceWorkflowAdmission`, `ServiceWorkflowHandle`, or
Request Clearance; they do not create admission, handle, clearance, or outcome
authority.

These commands do not create policy decisions, greenlights, gateway checks,
payment material, mutations, receipts, or certificates. They establish local
proposal readiness only.

MCP: `server.json` declares the npm/stdio server. Host args:
`["-y", "handshake-protocol-kernel"]`. The server exposes
`handshake.actions.x402_payment.propose` plus read-only metadata, challenge,
health, contract, receipt timeline, idempotency, and certificate-reference
resources. MCP is proposal/evidence only; it does not evaluate policy, create
greenlights, perform gateway checks, invoke signers, mutate, export receipts,
provide hosted operation, or claim broad MCP protection.

```ts
import { HandshakeClient, verifiedGatewayCheckFromResult } from "handshake-protocol-kernel";
import {
  ControlPlaneClient,
  EvidenceClient,
  GatewayClient,
  InstallClient,
  PolicyClient,
  RuntimeClient,
} from "handshake-protocol-kernel/sdk/role-clients";
```

Use this subpath for install setup, delegated-authority lifecycle management,
exact policy evaluation, runtime proposal, gateway-custody transition transport,
and redacted evidence readback. The package root still exposes the lower-level
`HandshakeClient`, but first-slice activation should teach role-scoped clients
first. `InstallClient` performs one server-side setup commit, not hosted
installation authority. `PolicyClient.evaluatePolicy()` evaluates one exact
action contract through the protocol authority spine; it is not a product
surface, cannot perform the gateway check, and cannot mutate.

Use `adapter-sdk` for third-party protected-action adapter packs and
install-proposal shape review. It is definition-only: not an install client, not
a gateway client, not a policy evaluator, not certification, and not a mutation
runner.

Current wedge: the first official wedge is a narrow official x402 exact buyer-side proof path:
one official buyer-side `exact` per-call path for `x402_payment.exact`. Gateway
payment material stays behind `VerifiedGatewayCheck`; consumed greenlights
produce replay refusal; unknown downstream finality is a proof gap.

Source-owned coverage also includes package-install material adapter pack
evidence/report projection, the first promoted non-payment adapter pack after
x402 exact per-call, a package-manager local host-specific bypass
manifest/proof-packet/report, public runtime ingress for local x402 payment and
package-install dispatch boundaries, and source-owned local MCP stdio
proposal/evidence process proof. The source-owned demos and schemas drive
sample readback: `npm run demo:self-hosted` writes
`examples/self-hosted-activation/output/latest.md` and is not hosted operation;
it uses real local MCP stdio proposal/evidence proof;
`npm run demo:aps` writes `examples/x402-protected-spend/output/latest.md` and
is not hosted operation, not broad x402 compatibility; `npm run demo:adapter-sdk`
writes `examples/external-adapter-sdk/output/latest.md` and is not policy evaluation,
not gateway check, not mutation;
`npm run demo:service-workflow-admission` writes
`examples/service-workflow-admission/output/latest.md` and is admission readback
plus handle context only, not clearance or authority.

Hosted admission lock: this service workflow simplification is not a
hosted-operation go-ahead. Hosted product work may consume projection/readback
surfaces only after the pre-hosted service workflow gates have source-owned
proof or explicit proof-gap posture. If hosted work needs hosted operation,
provider custody,
settlement/finality, marketplace or certification, cross-org trust, aggregate
spend enforcement, hosted org auth, retention/search, or new kernel exports,
route it to a separate hosted workspace or a new pre-hosted kernel task. Do not
expand protocol kernel exports for hosted needs without fresh proof gates.

No adapter family defines the protocol. This package is not broad x402
compatibility, not live provider custody, hosted mutation authority, production
hosted readiness, generic MCP/runtime control, host-wide containment,
package-manager ecosystem protection, package safety proof, npm audit
replacement, Bun provenance verification, external package-material attestation,
cross-org AuthorityCertificate trust, remote JWKS trust fetching, live
revocation authority, facilitator operation, seller middleware, unsupported x402
schemes, marketplace certification, or compliance-grade audit. Aggregate
payment-budget management is intentionally outside the current remit.

Trusted Publishing: MCP Registry discoverability is now the remaining
distribution launch blocker.
`0.2.7` npm availability is verified by registry readback, npm signature
metadata, GitHub Actions provenance publication, and clean installed-artifact
smoke. Public npm availability still does not create authority.

Trusted Publishing workflow input: `expected_version = 0.2.7`. Release proof
states: `ready_to_publish` means package shape and local gates passed;
`actually_published` means npm publish and installed-artifact readback passed
for the exact version; `registry_discoverable` means MCP Registry acceptance and
lookup have been verified. MCP Registry discoverability is separate from npm publication.

Reason-code runbook: stale metadata or readiness -> reload evidence. Unsafe
input, amount overrun, dynamic argument, changed observed parameters, or
consumed greenlight replay -> create new contract. Raw sibling path reachable ->
stop and record bypass proof. Credential or delegated authority isolated -> keep
future attempts blocked. Downstream finality unknown -> proof gap, not success.
