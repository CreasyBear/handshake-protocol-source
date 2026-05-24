# ADOPTION First Pass: Customer-Owned Gateway Custody Proof

## Invariant At Stake

A buyer must not be asked to trust a "gateway-protected" claim unless the first-use evidence shows:

- the automated decision system never received the mutation credential;
- the customer/provider gateway held or resolved the credential behind its boundary;
- the exact one-use greenlight was checked immediately before mutation;
- stale, drifted, unsafe, missing, or bypassable custody refused before consequence;
- the surviving packet is redacted but reconstructable.

If the buyer has to infer custody from scattered internal records, this is not adoption-ready. It may be source-true for a maintainer and still unreadable to an operator.

## Source Posture For Adoption

Current source already has adoption-relevant building blocks:

- `GatewayCredentialRef` records opaque gateway-side custody without raw credential material.
- `CredentialResolutionEvidence` can be recorded only after a passed `GatewayCheckAttempt` and binds the exact contract, greenlight, gate attempt, credential ref digest, resolver metadata, request digest, redaction status, and result class.
- `ProtectedPathPosture` requires `gateway_checked` posture to be fresh, scope-bound, probe-backed, and backed by gateway/hosted-monitor-strength source authority.
- Policy and gateway evaluation both consult protected-path posture and credential-ref binding before authority proceeds.
- `GatewayCheckAttempt`, `MutationAttempt`, `Receipt`, `Refusal`, and `ProofGap` already distinguish gateway admission from downstream outcome.
- Redacted projections expose contract, agent transaction envelope, receipt timeline, idempotency recovery, and install health without raw signer, payment payload, bearer token, or provider secret-path material.
- x402 proves one local/reference buyer-side `x402_payment.exact` path with gateway signing only after `VerifiedGatewayCheck`.
- auth.md proves useful lifecycle lessons: credential refs, metadata/revocation drift, gateway-time credential resolution, isolation, and redaction without making Handshake an auth provider.

Current source does not yet give the buyer one custody proof packet that ties install evidence, credential ref, posture/probes, exact contract, policy/greenlight, gateway check, credential resolution, and redacted projection into a single first-use artifact. That is the adoption blocker this plan must remove.

## Adoption Path

1. **Buyer chooses one protected path.**
   Start with one tenant/org, one principal, one runtime, one action class, one gateway, and one resource. For the first wedge, use one buyer-side `x402_payment.exact` per-call path. Do not teach x402 as the protocol and do not teach aggregate payment-budget management.

2. **Customer/operator installs the gateway boundary.**
   The operator declares the gateway authority holder, protected surface, resource namespace, accepted action classes, policy version, enforcement mode, credential custody status, and resolver version. The mutation credential remains behind the customer/provider gateway. Handshake receives only opaque refs, digests, and redacted audit refs.

3. **Developer compiles install records.**
   The install path produces tool capability, action type, gateway registry entry, and operating envelope records. It must also produce or reference the future custody proof packet. Install refusal must be normal when the signer/credential is agent-exposed, bounds are wildcarded, resources are outside envelope, or provider evidence is incomplete.

4. **Gateway records credential ref binding.**
   Register `GatewayCredentialRef` with provider-neutral fields: custody provider class, credential kind, key/credential handle ref, provider registry ref/digest, resolver ref/version, lease or expiry, evidence expectation refs, redaction profile, and explicit `secretMaterialIncluded: false`. The contract later binds the ref ID and digest.

5. **Gateway or hosted monitor runs hostile probes.**
   Required probe kinds: credential custody, raw sibling blocking, MCP direct-call blocking, token passthrough blocking, wrapper drift, and failure-closed behavior. A `gateway_checked` posture should not be accepted from weak fixture-only or caller-reported evidence. If source authority is too weak, adoption should show a refusal, not a yellow success.

6. **Protected-path posture is recorded.**
   Create a fresh `ProtectedPathPosture` scoped to runtime, gateway, action class, resource, and protected surface. It must carry `postureState: "gateway_checked"`, safe credential custody, raw sibling absent/blocked, probe IDs, probe digests, and expiry.

7. **Runtime proposes, but does not authorize.**
   Runtime/MCP/CLI may help the developer propose the exact action. They must not hold signer material, evaluate policy, create greenlights, run gateway checks, mutate, export receipts, or mint certificates.

8. **Policy refuses or greenlights from current custody state.**
   Policy input must include the contract digest, protected-path posture digest/freshness, gateway credential ref binding, isolation snapshot, and idempotency state. Missing, stale, unsafe, drifted, or isolated custody refuses before any greenlight.

9. **Gateway checks immediately before consequence.**
   The gateway verifies the exact contract/greenlight/params/idempotency/posture/policy drift/credential binding. If passed, adapter mutation-side code receives `VerifiedGatewayCheck`. If not passed, no credential resolution and no mutation-side call occur.

10. **Gateway records post-gate custody evidence.**
    Credential resolution evidence is recorded only after a passed gate and must state whether the credential was resolved, used, refused, blocked by isolation, or became a proof gap. Redaction failure is a refusal/proof-gap path, not a best-effort warning.

11. **Buyer reads one redacted custody proof packet.**
    The packet should answer, without exposing secrets: who owned the gateway, what credential ref was expected, what probes passed, what exact contract was greenlit, what the gateway saw, whether the credential was resolved/used after the gate, what downstream evidence exists, and what proof gaps or refusals remain.

## First-Use Checklist

- Pick one action class: first wedge should be `x402_payment.exact`.
- Name the protected resource exactly: endpoint URL, network, payee, token, amount, request posture, selected payment requirement digest, and idempotency material.
- Name the customer/operator gateway authority holder and gateway ID.
- Verify the mutation credential is not available to the agent/runtime, MCP tool, browser path, shell path, environment, sibling wrapper, or direct SDK client.
- Register the gateway registry entry with enforcement mode, policy version, credential custody status, and authority holder.
- Register an opaque `GatewayCredentialRef`; reject any raw private key, bearer token, `PaymentPayload`, `PAYMENT-SIGNATURE`, provider secret path, or access-token-looking value.
- Run all required hostile probes and keep the probe evidence refs redacted.
- Record `ProtectedPathPosture` only after all required probes pass from an accepted source authority.
- Compile one runtime proposal and one exact `ActionContract`; ensure the contract binds the gateway credential ref digest.
- Evaluate policy and confirm either a one-use greenlight or a durable refusal.
- Run the gateway check with gateway-observed parameters, not runtime-trusted parameters.
- Confirm a replay of the same greenlight refuses before mutation.
- Record `CredentialResolutionEvidence` only after the passed gate.
- Read the redacted custody proof packet and verify it does not expose secret paths, signer material, payment payloads, bearer tokens, mutation credentials, raw authorization headers, claim tokens, JWTs, or PII.
- Run negative-path checks for agent-exposed signer, stale credential ref, provider drift, resolver failure, missing custody packet, unsafe custody status, redaction failure, raw sibling path, and weak source authority.

## Missing Docs And Examples

- A buyer/operator "customer-owned gateway custody proof" quickstart is missing. Candidate future path: `examples/customer-owned-gateway-custody-proof/README.md`. It should teach the one-path install, probes, posture, proposal, policy, gateway check, resolution evidence, replay refusal, and redacted packet readback.
- A machine-readable example packet is missing. Candidate future path: `examples/customer-owned-gateway-custody-proof/output/latest.json`. It should include refs/digests, not raw records or secrets.
- A buyer-readable Markdown packet is missing. Candidate future path: `examples/customer-owned-gateway-custody-proof/output/latest.md`. It should be readable by a security/operator buyer without knowing protocol internals.
- `README.md` should eventually expose the smallest custody proof command or walkthrough only after the packet exists. Do not add a hosted/provider custody claim.
- `docs/internal/protocol-definition.md` and `docs/internal/protocol-kernel-architecture.md` should eventually name the custody proof packet or explicitly say it is a redacted projection over existing records. Do not change Tier 1 object meaning.
- `docs/internal/protocol-layman.md` needs the operator explanation: "the gateway had the credential; the agent did not; this exact pass was checked before use."
- x402 walkthrough docs need a custody-proof subsection that keeps local/reference fixture status visible and refuses provider/customer custody claims from fixture keys.
- Support/debug docs are missing for reason-code-to-fix mapping: `gateway_credential_ref_missing`, `gateway_credential_ref_stale`, `gateway_credential_ref_provider_drift`, `gateway_credential_ref_unsafe_custody`, `protected_path_probe_failed`, `protected_path_source_authority_weak`, `protected_path_raw_sibling_tool_present`, `gateway_policy_drift`, `params_mismatch`, `already_consumed`, `redaction_failed`, and downstream proof-gap reasons.
- Provider-specific vault/KMS/wallet setup docs must not be written from repo source alone. They require official source verification before implementation.

## Success Metrics

- A developer can produce the first local/reference custody proof packet from a clean checkout with one documented command or short checklist.
- A buyer can answer five questions from the packet without reading source: Did the agent receive the credential? Who held it? What exact contract was greenlit? Did the gateway check it before mutation? What evidence is missing or redacted?
- Every unsafe custody path produces a named refusal or proof gap before mutation.
- Negative tests cover all required custody failure classes and assert zero credential resolution and zero mutation when pre-gate evidence fails.
- Redacted packet serialization contains no raw credential material under current x402/auth.md secret patterns.
- Support can map every custody failure reason code to an operator action.
- Claim guards fail if docs/examples imply live provider custody, Handshake-held wallets/payment credentials, hosted operation, settlement, aggregate spend enforcement, generic MCP/runtime protection, or broad x402 compatibility.
- The first-use path does not require all-role SDK clients, raw protocol record reads, or direct adapter internals.

## Adoption Blockers And Fixes

| Blocker | Why it blocks adoption | Fix |
| --- | --- | --- |
| Custody evidence is scattered across refs, posture, probes, gate, resolution, receipt, and projections. | Buyers cannot verify custody without protocol expertise. | Add a redacted custody proof packet or projection that assembles the chain and exposes digest-bound refs. |
| The packet primitive is not source-owned yet. | Docs would have to describe an implied artifact. That becomes evidence theatre. | Define packet schema or projection contract before buyer docs. |
| Gateway setup ceremony is long. | Integrators may skip probes/posture or move authority into runtime/MCP for convenience. | Build an activation helper that sequences existing calls while keeping policy, greenlight, gateway check, signer/custody, and mutation authority out of runtime/MCP. |
| x402 local fixture can be mistaken for live custody. | Fixture keys and local sandbox evidence do not prove provider/customer custody. | Keep fixture/local/reference status in packet and claim guards; require official provider verification before live custody docs. |
| Provider-neutral custody fields are incomplete for buyer language. | A buyer needs key handle, lease/version, attestation refs, resolver version, audit refs, and drift status in one place. | Add these to the packet, reusing `GatewayCredentialRef` where possible and adding packet-level fields only where the existing ref is not enough. |
| Source-authority expectations can confuse implementers. | `gateway_checked` posture is accepted only from gateway/hosted-monitor-strength evidence; weaker fixture/caller evidence must refuse. | Document accepted source authorities and add tests that weak source authority refuses with a readable reason. |
| Runtime/MCP x402 posture parity gaps exist in the codebase map. | Proposal surfaces can teach weaker request-body/provider-environment semantics than the direct adapter path. | Use direct adapter/runtime-client path for first custody proof, then add runtime/MCP parity before exposing MCP as the first-use path. |
| Redaction is partly pattern-based. | Unknown provider credential formats can leak or force overbroad omission. | Prefer allowlisted packet fields and add provider-format fuzz tests before live provider custody. |
| Existing demos prove local/reference x402, not customer-owned custody. | The buyer may see "wallet gateway" and infer real customer/provider control. | Add explicit packet fields for `fixture_only`, `local_reference`, `customer_gateway_adapter`, or `provider_gateway` posture and fail claims from fixture-only packets. |
| Support/debug output is not organized around operator fixes. | A refusal is good protocol behavior but bad adoption if the operator cannot repair install state. | Add reason-code remediation table and packet-level `nextOperatorAction` labels. |

## Assumptions

- Tier 1 protocol meaning remains stable: exact contract, policy decision, one-use greenlight, gateway check, receipt/refusal/proof-gap, and isolation semantics do not change.
- Customer-owned gateway custody can be implemented as an additive packet/projection over existing primitives unless architecture proves a new protocol object is necessary.
- x402 remains the first wedge, but the custody mechanism must stay provider-neutral.
- Handshake does not hold wallets, signers, payment credentials, balances, settlement state, or payment-management state.
- Live provider/customer custody claims are blocked until source-owned packet, negative tests, redacted projections, and official provider verification exist.
- `.planning/` remains scratch and should not become repo-facing canon.

## Dependencies

- Existing protocol primitives: `GatewayCredentialRef`, `CredentialResolutionEvidence`, `ProtectedPathPosture`, `BypassProbe`, `ActionContract`, `PolicyDecision`, `Greenlight`, `GatewayCheckAttempt`, `Receipt`, `Refusal`, `ProofGap`, and `IsolationState`.
- Existing x402 adapter path: install proposal, action proposal, wallet gateway, hostile bypass probes, and conformance posture.
- Existing auth.md lessons: credential ref binding, metadata/revocation drift, post-gate credential resolution, lifecycle isolation, and redaction.
- Evidence projection assembly and redaction rules.
- Claim-boundary tests preventing fixture/local evidence from becoming provider/customer custody claims.
- Future official-source verification for any named vault, KMS, wallet provider, x402 provider, Cloudflare, JWKS, npm, MCP Registry, legal, or payment-regulatory details.

## Risks

- **Review theatre:** A pretty custody packet that is not structurally bound to the exact contract, policy input, greenlight, gateway check, and credential ref digest.
- **Evidence theatre:** A packet that cannot distinguish gateway check, credential resolution, mutation attempt, downstream response, refusal, and proof gap.
- **Fixture laundering:** Local fixture signer custody gets presented as customer/provider custody.
- **Runtime authority drift:** Activation convenience moves signer custody or gateway checks into runtime, MCP, CLI, or SDK surfaces.
- **Provider lock-in:** A provider-specific KMS/vault model leaks into protocol fields before official verification.
- **Redaction failure:** Unknown credential formats evade current string/pattern redaction.
- **Stale acceptance:** A custody proof packet remains accepted after provider registry digest, resolver version, lease, posture, or policy drift.
- **Support opacity:** Refusals are correct but not operator-actionable, causing teams to bypass the gateway.
- **x402 overreach:** The first wedge drifts into settlement, seller/facilitator operation, signed offers/receipts, aggregate spend windows, or broad compatibility.

## Validation Gates

- Schema/canonicalization tests for the custody proof packet or projection digest.
- Policy tests refusing missing packet, stale packet, unsafe custody, provider drift, resolver failure, weak source authority, failed probes, and active credential-ref isolation.
- Gateway tests refusing params drift, gateway policy drift, stale credential ref, missing credential ref, unsafe custody, replay, and raw sibling path before credential resolution or mutation.
- Adapter tests proving x402 signing receives only `VerifiedGatewayCheck`, and signing count remains zero on refusal/replay/drift.
- Redaction tests serializing the full packet and asserting absence of private keys, `PAYMENT-SIGNATURE`, `PaymentPayload`, bearer tokens, provider secret paths, raw authorization material, claim tokens, JWTs, and PII.
- Projection tests showing the packet distinguishes gateway admission from downstream outcome and proof gap.
- Claim-boundary tests preventing provider/customer custody claims from fixture keys and preventing Handshake-held wallet/payment-management language.
- Docs/example tests for the buyer-readable packet, including refusal and proof-gap paths, not only success.
- Focused future gates: `npm run quality:claims`, custody/projection protocol tests, x402 adapter/probe tests, auth.md redaction/gateway pressure tests, and architecture import/root export tests if public surfaces change.
- Full future closeout: `npm run check:repo`.

## Cut Lines

- No Handshake-held wallets, private keys, bearer tokens, payment credentials, balances, settlement state, or payment management.
- No provider-specific vault/KMS/wallet architecture without official source verification.
- No live provider/customer custody claim from local fixtures, local sandbox, conformance fixtures, or fixture keys.
- No aggregate x402 spend-window enforcement until a real ledger exists.
- No seller middleware, facilitator operation, settlement finality, signed offers, signed receipts, batch settlement, `upto`, or MCP auto-pay in this slice.
- No broad runtime, MCP, browser, shell, package-manager, cloud, repo, database, or network interception claim.
- No raw protocol record reads as the buyer-facing proof path.
- No all-role SDK or CLI/MCP mutation command in first-use docs.
- No greenlight reuse or multi-mutation authority.
- No "installed" or "protected" label unless current probe-backed posture and custody packet are present.

## Antipatterns

- "The gateway is trusted" without a gate attempt, credential ref digest, and probe-backed posture.
- "Approved plan" as a substitute for exact contract binding.
- "The signer is in a vault" with no resolver version, provider registry digest, lease/freshness, and post-gate resolution evidence.
- "Local fixture gateway-held" described as provider custody.
- "MCP payment tool" that can produce payment payloads or signatures.
- "Support mode" that exposes raw records, secret paths, signer refs, `PaymentPayload`, or bearer material.
- "One greenlight per workflow" instead of one greenlight per exact mutation attempt.
- "Downstream succeeded" inferred from a gateway check or receipt without reconciliation evidence.
- "Unknown" smoothed into success instead of a `ProofGap`.
- Docs that teach x402 as the protocol rather than the first protected-action pack.

## Blocked Checks

- No external official documentation was verified in this first pass. Any named provider, vault, KMS, x402 provider, Cloudflare, JWKS, npm, MCP Registry, legal, or payment-regulatory detail remains blocked on official source verification before implementation.
- Sibling raw outputs, normalized outputs, and the final plan for this run were not read, by instruction.
- No source, test, docs, package, or prior planning artifact was modified.
- No tests were run because this is a planning-only first-pass artifact with a hard write boundary.
- Unlisted example files were not inspected; missing docs/examples above are candidate future paths, not verified current contents.
