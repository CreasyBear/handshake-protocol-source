# Service Workflow Story

This story is a product projection/readback surface over the existing protocol
authority spine. It makes the first-use path easier to understand, but it does
not create a new authority primitive or a peer product truth lane.

## Plain Flow

```text
Agent shows Passport
-> Service returns ServiceWorkflowAdmission
-> Agent carries ServiceWorkflowHandle
-> Agent requests Clearance for one protected action
-> Handshake records Outcome
```

The plain words map to the protocol this way:

| Plain word               | Meaning                                                                                    | Not allowed to mean                                                                                                   |
| ------------------------ | ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| Passport                 | Evidence package the agent presents.                                                       | Identity, trust, permission, spend approval, signer access, or reusable auth.                                         |
| ServiceWorkflowAdmission | Service-side accepted, refused, stale, or proof-gap mapping of presented evidence.         | Policy decision, greenlight, gateway check, receipt, certificate, or mutation permission.                             |
| ServiceWorkflowHandle    | Non-authority workflow context reference for later proposals and readback.                 | Badge-as-bearer-token, tool permission, retry permission, x402 payment approval, auth.md credential, or gateway pass. |
| Clearance                | Fresh exact protected-action path for one event.                                           | Workflow-level permission.                                                                                            |
| Outcome                  | Receipt, refusal, replay refusal, proof gap, or terminal certificate after the event path. | Downstream business success or future permission.                                                                     |

## Non-Authority IDs

The service workflow surface may carry these correlation and reconstruction
fields:

```text
passportPackageDigest
passportPresentationId
admissionId
serviceWorkflowHandleId
serviceWorkflowHandleDigest
```

These fields identify what was presented, how the service handled it, and which
workflow context the agent is carrying. They do not create authority. Every
surface that exposes them must make the boundary explicit:

```text
createsAuthority: false
createsPolicyDecision: false
createsGreenlight: false
performsGatewayCheck: false
permitsMutation: false
exportsReceipt: false
mintsTerminalCertificate: false
freshActionContractRequired: true
```

The source contract for carrying those five fields is
`ServiceWorkflowContextRefsSchema`. MCP may accept that object as proposal
metadata for one fresh x402 contract. SDK, HTTP, runtime, package-root, and
protocol-public surfaces must not accept that schema as permission or as an
authority shortcut unless a separate package-surface decision and proof gate
are opened.

`PrincipalAgentLink` is also evidence-only. It may help a hosted service record
which principal scoped which agent for a tenant, organization, project, or
workspace. It is not a bearer credential, reusable auth, spend approval, policy
decision, greenlight, gateway check, receipt, or envelope-widening authority.

## Protected Action Boundary

A service can admit standing evidence into a workflow context. That is still
before protected action clearance.

Every consequential event still needs:

```text
CandidateAction
-> ActionContract
-> PolicyDecision
-> one-use Greenlight or Refusal
-> GatewayCheck before mutation
-> Receipt / Refusal / ReplayRefusal / ProofGap / AuthorityCertificate
```

If the gateway cannot enforce the exact greenlight before consequence, the path
is advisory, not Handshake.

## Agent Lane (Parallel Projection)

The **Agent lane** is a product vocabulary chain for agent hosts and integrators.
It maps plain words to schema-native protocol objects. Schema export names stay
unchanged; this section is additive cross-link only — it does not replace the
canonical state path in `protocol-definition.md`.

```text
Standing Bounds
-> Delegated Mandate (when required)
-> Compile
-> Work Order
-> Clearance
-> Outcome
```

| Agent lane term   | Schema-native object                          | Does not mean                                                                 |
| ----------------- | --------------------------------------------- | ----------------------------------------------------------------------------- |
| Standing Bounds   | `OperatingEnvelope`                           | Permission, mutation authority, or a reusable pass for future actions.        |
| Delegated Mandate | `DelegatedAuthorityRef`                       | Greenlight, gateway check, spend approval, or signer access.                  |
| Compile           | `IntentCompilationRecord` / `CandidateAction` | Policy decision, authority, or an executable contract.                        |
| Work Order        | `ActionContract`                              | Ambient permission, plan approval, or a batch of unrelated mutations.           |
| Clearance         | Policy decision + one-use greenlight + gateway check before mutation | Admission alone, workflow handle carry-forward, or ingress middleware theatre. |
| Outcome           | Receipt / refusal / proof gap / replay refusal / terminal certificate | Downstream business success or permission for the next action.                |

Every agent-lane projection that exposes workflow or compilation context must
carry the same non-authority boundary as the service workflow surface:

```text
createsAuthority: false
createsPolicyDecision: false
createsGreenlight: false
performsGatewayCheck: false
permitsMutation: false
exportsReceipt: false
mintsTerminalCertificate: false
freshActionContractRequired: true
```

`OperatingEnvelope` is class-level attempt bounds, not permission (D-01).
`DelegatedAuthorityRef` is episodic mandate evidence, not a greenlight (D-02).
Compile output proposes candidates only (D-03). `ActionContract` is an exact
commitment, not execution authority (D-04). Clearance requires a gateway check
before mutation — admission or handle carry-forward alone is advisory, not
Handshake (D-00).

## Recovery States

| State                | Meaning                                                     | Safe next move                                                 |
| -------------------- | ----------------------------------------------------------- | -------------------------------------------------------------- |
| `accepted`           | The service recognizes the evidence for workflow context.   | Create a fresh protected-action request when action is needed. |
| `refused`            | The service rejects the evidence.                           | Replace evidence or abandon the workflow.                      |
| `stale`              | A digest, expiry, metadata, or readiness reference drifted. | Reload current evidence.                                       |
| `proof_gap`          | The service cannot establish the claim.                     | Gather proof or keep the workflow blocked.                     |
| `quarantined`        | Evidence or posture is unsafe.                              | Stop and isolate future attempts.                              |
| `clearance_required` | The handle exists, but event authority does not.            | Create a fresh exact action contract candidate.                |

Refusal, proof gap, replay refusal, and support-bundle generation are not retry
permission. A new protected action requires a new exact contract.

## Forbidden Shortcuts

- Do not pass a workflow handle to a protected tool as permission.
- Do not put raw credentials, bearer tokens, private keys, x402
  `PaymentPayload`, or `PAYMENT-SIGNATURE` into Passport, Admission, or Handle.
- Do not treat an admission report as a receipt.
- Do not turn an `AuthorityCertificate` into a passport or badge.
- Do not let a rendered review summary substitute for the exact action contract.
- Do not claim hosted operation, provider custody, settlement finality,
  marketplace trust, broad runtime containment, or cross-org trust from this
  surface.
- Do not claim customer gateway custody from local fixture evidence.
  `customer_gateway_evidence` requires official external verification, current
  custody and resolver posture, lease/rotation or equivalent time-bounded
  evidence,   attestation evidence, redaction success, and no raw payment or
  credential material.

## Operator maintenance

For day-two service API changes (mutation manifest, dual-enforcement checks, product-completion gates), use [service-operator-runbook.md](./service-operator-runbook.md). Host-side maintenance stays in [host-operator-runbook.md](./host-operator-runbook.md).
