# A1 / Handshake Composability

Last updated: 2026-05-29.

**Invariant:** Delegation evidence ≠ greenlight. A1 verification produces fingerprints and reason codes only. Handshake alone issues one-use greenlights and enforces `gatewayCheck` before any mutation for any `ActionContract.actionType`.

**Action-type agnostic rule:** Use generic placeholders throughout — `ActionContract.actionType`, `gatewayRegistry[actionType]`, `policyPack[origin][actionType]`. `x402_payment.exact` is one proof profile, not the product boundary.

**Decision:** See **D-72** in `docs/internal/decisions.md` (OPP-09 evidence-only integration posture).

---

## Two trust domains

Objects must not cross trust domains without an explicit, tested mapping. A1 `SignedChain` produces fingerprints, never permission.

```text
┌──────────────────────────── DELEGATION (A1 evidence layer) ────────────────────────────┐
│  SignedChain (wire format)                                                            │
│    → offline Ed25519 verify (no HTTP clearance)                                       │
│    → DelegationEvidenceRecord                                                         │
│         • chainFingerprint, certFingerprint, principalPk, terminalDelegatePk          │
│         • verificationReasonCodes (invalid / expired / mismatch / …)                  │
│         • NO Greenlight, NO GatewayCheck, NO mutationAuthorityCreated flags            │
└───────────────────────────────────────────────────────────────────────────────────────┘
                                        │
                          explicit mapping only (delegationEvidenceRef)
                                        ▼
┌──────────────────────────── MUTATION (Handshake kernel) ───────────────────────────────┐
│  CandidateAction (+ optional delegationEvidenceRef)                                   │
│    → proposeActionContract → ActionContract (any actionType in catalog)               │
│    → evaluatePolicy(policyPack[origin][actionType])                                   │
│         • requireDelegationEvidence: missing/invalid/misaligned → REFUSAL             │
│         • valid evidence → continue (still may refuse on contract/isolation/posture)  │
│    → issueGreenlight (maxUses: 1, contract-bound)                                     │
│    → gatewayCheck(gatewayRegistry[actionType]) — NO A1 calls at gate                 │
│    → mutation OR refusal OR proof gap                                                  │
│    → Receipt / Refusal / ProofGap / optional AuthorityCertificate                     │
└───────────────────────────────────────────────────────────────────────────────────────┘
```

### Generic data flow

```text
Agent/runtime presents SignedChain (optional)
  → A1EvidenceVerifier.verify() → DelegationEvidenceRecord (evidence only)
  → intent compile → CandidateAction + delegationEvidenceRef
  → ActionContract for ActionContract.actionType
  → evaluatePolicy → greenlight | refusal | review | halt | quarantine
  → gatewayCheck → VerifiedGatewayCheck | refusal | proof gap
  → downstream mutation attempt (adapter) OR terminal refusal
  → Receipt with separable status layers (below)
```

Golden composition invariants (CI-enforced before A1-1 feature code):

- `validA1Verify && !greenlight` → mutation MUST NOT occur
- `greenlight && !gatewayCheck` → mutation MUST NOT occur
- `validA1Verify alone` → MUST NOT set `mutationAuthorityCreated`

---

## BORROW (reference only — not implemented in A1-0)

Port or sidecar-verify in A1-1+; do not product-depend on A1 gateway HTTP:

1. **SignedChain wire format** — A1 `wire/schema.json` as normative input
2. **Offline Ed25519 verification** — domain strings pinned; bit-identical to A1 conformance vectors
3. **Chain fingerprint / cert fingerprint** — audit-stable digests for receipts
4. **Multi-hop provenance** — depth, principal public key, terminal delegate public key
5. **Capability narrowing model** — O(1) bitmask pre-check (defer until scale forces)
6. **Verification outcome taxonomy** — structured reason codes (invalid, expired, mismatch, …)
7. **Conformance vectors** — CI gate against A1 test fixtures

Planned module path: `src/integrations/a1-evidence/` (A1-1; absent in A1-0).

---

## KILL (anti-import — architecture tests enforce)

Reject on contact. Each item maps to `test/architecture/a1-integration-*.test.ts`:

| ID | Refuse |
|----|--------|
| KILL-01 | `VerifiedToken` / HMAC fast-path as greenlight substitute |
| KILL-02 | A1 `/v1/authorize` success = Handshake clearance |
| KILL-03 | Passport / presentation digest as policy, greenlight, or gateway input |
| KILL-04 | Advisory A1 middleware documented or wired as Handshake enforcement |
| KILL-05 | Studio static check as operator clearance |
| KILL-06 | MCP tools named authorize / mint / renew without kernel transitions |
| KILL-07 | ZK or guest wedge labels without proof-gap framing |
| KILL-08 | Merged terminal receipt without `delegationProvenance` / `gatewayCheckStatus` / `downstreamOutcomeStatus` separation |
| KILL-09 | A1 cert nonce mapped to Handshake greenlight consumption ledger |
| KILL-10 | Milestone copy that widens the action catalog or claims A1 enables all action types |

---

## Receipt: three separable status layers

Terminal evidence must never collapse delegation proof, gateway enforcement, and downstream rail outcome into one undifferentiated status.

| Layer | Owner | Example fields | Must not imply |
|-------|-------|------------------|----------------|
| `delegationProvenance` | A1 evidence layer (A1-2+) | chainFingerprint, verifyDigest, reasonCodes | greenlight, gateway pass, payment success |
| `gatewayCheckStatus` | Handshake kernel | passed / refused / proof_gap on exact contract | delegation validity alone, downstream success |
| `downstreamOutcomeStatus` | Downstream rail / adapter | succeeded / failed / unknown on protected surface | gateway check, delegation proof |

Auditors must reconstruct which layer failed six months later without re-running live systems.

---

## Wedge discipline (KILL-10)

A1 strengthens delegation provenance for protected actions; it is not an excuse to skip Handshake wedge discipline or broaden the action catalog in milestone copy. Integration work stays action-type agnostic in architecture and tests; the first runnable golden path may still sequence on one proof profile without redefining the boundary.

---

## Adversarial questions (META-PROMPT)

**1. Agent bypasses the evidence module and calls the gateway directly.**  
The gateway adapter enforces `VerifiedGatewayCheck` bound to the exact `ActionContract` digest. Without a one-use greenlight consumed at `gatewayCheck`, mutation refuses. A1 evidence is not consulted at the gate; bypass skips provenance policy only if the policy pack does not require delegation evidence — it never creates a second mutation path.

**2. Verify returns valid for capability X but contract is action Y.**  
Policy evaluation refuses at `evaluatePolicy` when evidence capability class does not align with `ActionContract.actionType` and exact params. Valid delegation evidence is necessary when required, never sufficient. Wrong action type never receives greenlight.

**3. Greenlight replayed — does A1 evidence create a second mutation path?**  
No. Greenlight consumption is ledgered in Handshake; replay refuses before gateway check. A1 chain fingerprints do not substitute for greenlight consumption (KILL-09). Evidence replay does not mint ambient authority.

**4. MCP tool renamed to sound like authorize — does CI catch it?**  
Yes. `a1-integration-kill-enforcement.test.ts` forbids tool names matching authorize/mint/renew patterns in `src/mcp/catalog.ts` and `server.json`. MCP remains proposal/evidence only (`authorityCreated: false`).

**5. Six months later — delegation vs gateway vs payment success?**  
Receipt export keeps `delegationProvenance`, `gatewayCheckStatus`, and `downstreamOutcomeStatus` as separate fields (KILL-08). Terminal certificates bind to Handshake events, not A1 HTTP clearance.

**6. Same design if actionType is repo.write instead of x402_payment.exact?**  
Yes. Policy packs key on `policyPack[origin][actionType]`; gateway binding uses `gatewayRegistry[actionType]`. Delegation evidence attaches to `CandidateAction`; no x402-only kernel fork.

**7. Verify sidecar down — what is recorded?**  
Proof gap when offline verify is required but unavailable. Missing evidence is proof gap, not smoothed success. Policy may refuse or quarantine; it must not treat HTTP authorize as substitute clearance (KILL-02).
