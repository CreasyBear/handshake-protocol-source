# SDK Lane

## Authority owner

Typed client invocation over public Handshake HTTP transition and diagnostic evidence routes.

## Current proof claim

Client ergonomics for invoking the reference HTTP surface. The SDK does not prove hosted operation, policy authority, gateway authority, or execution proof.

## Use cases

Let callers invoke public transition routes, route role-scoped tokens, parse typed success/error responses, and read redacted diagnostic evidence projections.

Service workflow admission and handle records may guide request construction
and readback. They are not SDK credentials, role tokens, policy decisions,
greenlights, gateway checks, retries, or mutation permissions.

## Constraints and assumptions

The client is outside the authority boundary. It may submit evidence or requests, but server-side protocol and gateway checks decide whether consequence can proceed.

## Core components

`client.ts`, `surface-clients/`, typed client options, role-scoped transport, transition methods, error parsing, and diagnostic evidence reads.

## Failure and scale posture

Scale by mirroring stable HTTP routes without creating a second protocol model. Client failures remain typed request/response failures and must not be interpreted as execution proof.

## Future package target

`packages/client`

## Allowed imports

Public protocol schemas and inputs, HTTP role/custody types, transition error envelope types, and SDK-local client helpers.

## Forbidden imports

Protocol primitive internals, storage implementations, Hono app internals, runtime wrappers, reference gateways, mutation credentials, and provider-specific hosted auth.

## Guarding tests

`test/http/http.test.ts`, `test/sdk/role-clients.test.ts`, `test/architecture/surface-boundary-posture.test.ts`, `test/architecture/root-exports.test.ts`, and `test/architecture/import-posture.test.ts`.

## Public surface

Root exports remain `HandshakeClient`, `HandshakeClientError`, client options,
fetch adapter types, transition methods including the gateway-custody route for
registering opaque `GatewayCredentialRef` records, and redacted diagnostic
evidence projection reads. Registering a credential ref records custody
metadata only; it does not expose or resolve the mutation credential.

Role-scoped activation clients are exposed through the explicit
`handshake-protocol-kernel/sdk/role-clients` package subpath. That subpath may
export `InstallClient`, `ControlPlaneClient`, `RuntimeClient`, `GatewayClient`,
`PolicyClient`, `EvidenceClient`, `HandshakeClientError`, and safe transport types only. It must
not export `HandshakeClient`, role-token maps, fallback transition-token
options, receipt-export methods, certificate minting, raw record reads, signer
material, or mutation commands. Policy authority is exposed only through
`PolicyClient.evaluatePolicy()`, not through runtime, evidence, install,
gateway, CLI, MCP, profile, package, or support surfaces.

## Extraction trigger

Extract only after the HTTP route surface is stable, SDK exports are curated, client tests cover role-specific headers and typed errors, and extraction does not create a separate authority model.

## Scope boundary

This lane sends requests and parses responses. It must not infer authority from responses, issue greenlights, perform gateway checks, mutate protected surfaces, or treat evidence reads as execution proof.

## Role-client adoption closeout

First-slice activation code should use `InstallClient`, `RuntimeClient`,
`GatewayClient`, `ControlPlaneClient`, `PolicyClient`, and `EvidenceClient` from
`handshake-protocol-kernel/sdk/role-clients`, not the low-level
`HandshakeClient` token-map transport. `HandshakeClient` remains useful for
protocol tests and internal HTTP route parity, but it teaches the wrong shape
for agent-facing activation because it can carry multiple role tokens.

`InstallClient` may register compiled `InstallProposal` catalog,
gateway-registry, and operating-envelope records through `control_plane`
custody using one server-side setup commit. Ready proposals atomically register
compiled setup records; refused proposals record refusal evidence. It is setup
evidence, not hosted installation authority. It does not compile install
proposals, evaluate policy, issue greenlights, perform gateway checks, register
credential refs, resolve credentials, use signers, run probes, mutate protected
surfaces, export receipts, mint certificates, or read raw records.

`RuntimeClient` may create runtime execution evidence, submit a runtime ingress
dispatch block, create tool-call drafts, compile intent, and propose
action-contracts through `runtime_evidence` custody. Those methods produce
proposal records or compiler refusals only. They do not evaluate policy,
greenlight, gateway-check, mutate, export receipts, mint certificates, recover,
install, isolate, or sign.

If a caller starts from a `ServiceWorkflowHandle`, `RuntimeClient` still must
produce a fresh exact action-contract proposal. The handle can contribute
context and evidence refs only; it cannot satisfy policy, gateway, signer, or
receipt requirements.

`ControlPlaneClient` may register delegated authority refs and record terminal
delegated authority status transitions through `control_plane` custody. Those
methods manage delegated attempt-authority evidence and authority-ref isolation
only. They do not evaluate policy, issue greenlights, perform gateway checks,
resolve gateway credentials, use signers, mutate protected surfaces, export
receipts, or mint certificates.

`PolicyClient` may evaluate exact action-contract policy through
`control_plane` custody. It is the narrow policy-authority surface: it may
create one policy decision and optional one-use greenlight or refusal, but it
does not perform gateway checks, resolve gateway credentials, use signers,
mutate protected surfaces, read evidence, manage delegated authority, install
setup records, export receipts, or mint certificates.

`GatewayClient` may register gateway credential refs, record gateway custody
proof packets, create bypass probes, record protected-path posture, perform
gateway checks, record post-gate credential-resolution evidence, and reconcile
downstream protected-surface operation state through `gateway_custody`. It is
gateway transport only. It does not expose signer helpers, payment payload
creation, policy evaluation, delegated-authority management, receipt export,
certificate minting, raw record reads, or mutation commands.

`EvidenceClient` may read redacted projections and verify a supplied terminal
`AuthorityCertificate` against explicit pinned local trust material. It does
not mint certificates, export receipts, read raw internal records, or collapse
gateway admission, downstream finality, replay, and proof gaps into a single
success boolean.

Challenge and support posture:

- return structured protocol errors or surface outcomes; do not retry protected
  work automatically from the SDK;
- send support only redacted evidence refs, projection payloads, request
  identities, reason codes, and local trust verification results;
- never request or include `PaymentPayload`, `PAYMENT-SIGNATURE`, private keys,
  signer refs, raw store records, role-token maps, or gateway credentials;
- keep new role clients off the subpath until their custody role, route family,
  non-authority posture, and package-surface tests are explicit.
