# Codebase Concerns

**Analysis Date:** 2026-05-23

## Scope

This mapper focuses on pre-hosted Tier 2 telemetry and response-contract hardening for active source surfaces. Canon was checked first in `AGENTS.md`, `README.md`, `QUALITY.md`, `STRUCTURE.md`, `docs/internal/decisions.md`, `docs/internal/protocol-notes.md`, `docs/internal/protocol-definition.md`, and `docs/internal/protocol-kernel-architecture.md`.

`.planning/` is scratch and is not treated as repo truth. Concerns below are grounded in live source and tests only.

**Active surfaces inspected:**
- HTTP transition and evidence responses: `src/http/routes/transition-response-schemas.ts`, `src/http/handlers/evidence-read.ts`, `src/http/errors/transition-error-envelope.ts`
- SDK and role-scoped error transport: `src/sdk/client.ts`, `src/sdk/surface-clients/transport.ts`
- MCP proposal and resource outputs: `src/mcp/x402-proposal.ts`, `src/mcp/output.ts`, `src/mcp/resources.ts`
- Runtime ingress proposal output: `src/runtime/ingress/index.ts`
- Evidence projections and certificates: `src/protocol/evidence-projections/projections.ts`, `src/protocol/evidence-projections/schemas.ts`, `src/protocol/areas/authority-certificate/transitions.ts`
- CLI output contracts: `src/cli/output.ts`, `src/cli/projection-evidence.ts`, `src/cli/support-bundle.ts`, `src/cli/local-project/index.ts`
- Active gateway adapters: `src/adapters/x402-payment/wallet-gateway.ts`, `src/adapters/package-install/gateway.ts`

## Priority Index

| Priority | Concern | Active fix candidate |
|----------|---------|----------------------|
| P0 | Agent transaction envelope and AuthorityCertificate omit existing custody, recovery, and isolation evidence | Yes |
| P0 | Policy refusal response hides durable refusal evidence from immediate caller | Yes |
| P0 | MCP committed transition errors can be reported as `not_started` | Yes |
| P1 | Retry telemetry labels ordinary reconciliations as `paid_retry_attempted` | Yes |
| P1 | CLI envelope lacks a standard operator response contract | Yes |
| P2 | Runtime ingress returns raw proposal records without a surface outcome wrapper | Yes |

## Tech Debt

### Active-Goal Fix Candidate: Agent Transaction Envelope Omits Custody, Recovery, and Isolation Records

- Issue: `getAgentTransactionEnvelopeProjection` assembles the envelope without loading scoped credential-resolution evidence, recovery recommendations, recovery status transitions, active isolation states, or idempotency ledger posture, even though the projection schema supports these references.
- Files: `src/http/handlers/evidence-read.ts`, `src/protocol/evidence-projections/schemas.ts`, `src/protocol/evidence-projections/projections.ts`, `src/protocol/areas/recovery/schemas.ts`, `src/protocol/areas/isolation-breaker/schemas.ts`
- Expected symptom: `GET /v1/evidence/agent-transactions/:actionContractId` can return empty `credentialResolutionEvidenceRefs`, `recoveryRefs`, and `isolationRefs` for an action whose protocol records contain credential custody, recovery, or isolation evidence.
- Invariant risk: A support engineer or security reviewer cannot reconstruct custody posture, isolation state, or next safe action from the standard transaction envelope. Missing evidence is smoothed into empty arrays instead of surfaced as unavailable, omitted, or proof-gap-adjacent posture.
- Suggested smallest mechanism: Extract a source-owned `agentTransactionEnvelopeInput` assembler that loads scoped `credential_resolution_evidence`, recovery recommendation/status, isolation state, and idempotency ledger records before projection. Use the same assembler from HTTP evidence reads and certificate generation. Keep credential material redacted; expose only refs, digests, custody roles, reason codes, and redaction posture.
- Test target: Add an HTTP evidence-read test that records credential resolution evidence, a recovery recommendation, and an isolation state for a contract, then asserts `credentialResolutionEvidenceRefs`, `gatewayCredentialEvidenceRefs`, `recoveryRefs`, and `isolationRefs` are present in the projection.

### Active-Goal Fix Candidate: AuthorityCertificate Uses a Partial Evidence Assembly

- Issue: `buildAuthorityCertificate` calls `projectAgentTransactionEnvelope` with contract, policy, greenlight, gate, mutation, receipt, proof gaps, and refusals, but not credential resolution evidence, recovery posture, isolation posture, or idempotency ledger posture.
- Files: `src/protocol/areas/authority-certificate/transitions.ts`, `src/protocol/evidence-projections/projections.ts`, `src/protocol/evidence-projections/schemas.ts`, `test/protocol/authority-certificate.test.ts`
- Expected symptom: An AuthorityCertificate can present a complete-looking terminal envelope while omitting custody-resolution evidence and recovery/isolation records that affect whether future mutation is safe.
- Invariant risk: The certificate becomes evidence theatre for custody and recovery. It proves a terminal object exists, but not whether the operator can reconstruct the authority path, credential custody holder, exact next safe action, or isolation block that should govern future attempts.
- Suggested smallest mechanism: Reuse the same envelope assembler as HTTP evidence reads, and include credential-resolution, recovery, isolation, and idempotency artifacts in `artifacts`. Add explicit `omittedEvidenceReasonCodes` if any supported evidence class is intentionally unavailable.
- Test target: Extend `test/protocol/authority-certificate.test.ts` with a terminal receipt that also has credential-resolution evidence and a recovery recommendation, then assert the certificate envelope and artifacts include those refs.

### Active-Goal Fix Candidate: Policy Refusal Response Hides the Durable Refusal Ref

- Issue: `PolicyEvaluationResponseSchema` returns only `{ decision, greenlight }`. The policy record layer creates and stores a durable `Refusal` for non-greenlight decisions, but the immediate HTTP/SDK response does not return `refusal`, `refusalRef`, `refusalReasonCode`, or an explicit `authorityCreated: false` field.
- Files: `src/http/routes/transition-response-schemas.ts`, `src/protocol/areas/policy-greenlight/transitions.ts`, `src/protocol/areas/policy-greenlight/policy-record/index.ts`, `test/protocol/kernel-policy-gateway.test.ts`, `test/http/d1-http.test.ts`
- Expected symptom: A caller receiving `greenlight: null` must perform a separate evidence read or infer refusal state from `decision` to know whether a refusal was durably recorded. Model agents and support tooling lack an immediate refusal object to cite.
- Invariant risk: Refusal is not first-class at the response boundary. A caller can mistake a recorded refusal for an incomplete evaluation, retry with altered parameters, or fail to reconstruct why authority was not created.
- Suggested smallest mechanism: Extend the policy evaluation result with nullable `refusal` or `refusalRef`, `refusalReasonCode`, and `authorityCreated: false` for non-greenlight decisions. Prefer returning the durable refusal ref produced by `commitPolicyEvaluation` rather than reconstructing it later.
- Test target: Update the duplicate-idempotency HTTP test in `test/http/d1-http.test.ts` and kernel policy test in `test/protocol/kernel-policy-gateway.test.ts` to assert refusal refs are returned immediately.

### Active-Goal Fix Candidate: MCP Errors Can Downgrade Committed Protocol State to `not_started`

- Issue: `errorCommitState()` in `src/mcp/x402-proposal.ts` maps only `"accepted"` to `"protocol_recorded"`. Real transition error envelopes use `TransitionCommitState` values from `src/protocol/foundation/errors.ts`, including `"committed"`, `"not_committed"`, and `"unknown"`. A committed protocol error therefore falls through to `"not_started"`.
- Files: `src/mcp/x402-proposal.ts`, `src/http/errors/transition-error-envelope.ts`, `src/protocol/foundation/errors.ts`, `test/mcp/mcp-x402-proposal.test.ts`, `src/mcp/reference-transcript-fixtures.ts`
- Expected symptom: A model-facing MCP tool result can say `commitState: "not_started"` after the protocol has durably recorded a refusal, proof gap, or other error evidence.
- Invariant risk: The model agent receives unsafe retry posture. It may recraft or retry when the only safe next action is to read evidence and preserve the recorded refusal/proof gap chain.
- Suggested smallest mechanism: Map `"committed"` to `"protocol_recorded"` and handle `"not_committed"` explicitly. Propagate `proofRef` and `refusalRef` from `TransitionErrorEnvelope` into MCP surface outcomes when present.
- Test target: Add MCP tests with a `HandshakeClientError`-shaped envelope carrying `commitState: "committed"` and `refusalRef`, then assert `commitState: "protocol_recorded"` and `nextAction: "read_evidence"`.

### Active-Goal Fix Candidate: Retry Telemetry Has a False-Positive Label

- Issue: `surfaceOperationEvidenceLabels()` adds `paid_retry_attempted` whenever a mutation attempt and latest reconciliation exist. The condition does not prove any retry occurred.
- Files: `src/protocol/evidence-projections/projections.ts`, `src/protocol/evidence-projections/schemas.ts`, `test/protocol/evidence-projections.test.ts`
- Expected symptom: A normal downstream reconciliation can be displayed as a paid retry attempt. Current tests assert `paid_retry_attempted` in a redaction/reconciliation case.
- Invariant risk: Retry posture is falsified. Operators and support engineers cannot tell ordinary downstream reconciliation from a replay, duplicate idempotency attempt, retry loop, or paid retry.
- Suggested smallest mechanism: Replace the label with a neutral reconciliation label such as `downstream_reconciliation_recorded`. Add retry labels only from explicit retry evidence: runtime `retryDetected`, `retryOfDispatchRef`, idempotency replay/refusal, recovery transition, or a dedicated retry record.
- Test target: Update `test/protocol/evidence-projections.test.ts` so ordinary reconciliation does not assert a retry label, then add a separate explicit retry fixture when a source-owned retry signal exists.

### Active-Goal Fix Candidate: CLI Envelope Is Not a Standard Operator Response Contract

- Issue: `CliOutputEnvelope` standardizes authority false flags, but it does not standardize top-level `reasonCodes`, `nextAction`, `retryability`, `commitState`, `redactionProfileRef`, `evidenceRefs`, or `proofGapRefs`. Commands place these fields inconsistently inside `result`, if at all.
- Files: `src/cli/output.ts`, `src/cli/projection-evidence.ts`, `src/cli/support-bundle.ts`, `src/cli/local-project/index.ts`
- Expected symptom: Operators, support engineers, and scripts must parse command-specific result shapes to know whether evidence is redacted, whether a retry is safe, what reason code applies, and what the next safe action is.
- Invariant risk: The CLI remains non-authoritative, but its response shape still invites free-form interpretation. A human can treat a diagnostic or projection command as actionable without a standardized safe-next-action contract.
- Suggested smallest mechanism: Add optional top-level telemetry fields to `CliOutputEnvelope` and require active CLI commands to set them. Start with `reasonCodes`, `nextAction`, `retryability`, `commitState`, `evidenceRefs`, `proofGapRefs`, and `redactionProfileRef`. Keep `mayAuthorize`, `mayMutate`, `gatewayChecked`, and `greenlightIssued` false by default.
- Test target: Add CLI output tests for `support.bundle`, local project doctor, and evidence projection commands that assert the top-level response contract is present and conservative.

### Active-Goal Fix Candidate: Runtime Ingress Output Lacks a Surface Outcome Wrapper

- Issue: `proposeRuntimeIngressActionContracts()` returns `outcome`, runtime execution records, generated execution graph records, and per-proposal results. It does not return a standard response wrapper with authority flags, aggregate reason codes, retryability, next safe action, redaction posture, or evidence refs.
- Files: `src/runtime/ingress/index.ts`, `src/runtime/ingress/classifier.ts`, `test/runtime/runtime-ingress.test.ts`
- Expected symptom: A runtime adapter or model-facing caller must infer whether to stop, recraft, read evidence, or proceed to policy evaluation from raw proposal records and per-dispatch refusal codes.
- Invariant risk: Tool availability and action proposal can be confused with authorization. Unsupported, raw, dynamic, ambiguous, or retrying dispatches do not have a uniform non-authority response contract.
- Suggested smallest mechanism: Add a `RuntimeIngressOutcome` projector or wrapper with `schemaVersion`, `mayAuthorize: false`, `mayMutate: false`, `gatewayChecked: false`, `greenlightIssued: false`, aggregate `reasonCodes`, `nextAction`, `retryability`, `redactionProfileRef`, and evidence refs to generated graph/proposal records.
- Test target: Extend runtime ingress tests so raw-tool, sibling-tool, dynamic-dispatch, and retry-detected cases assert conservative wrapper fields.

## Known Bugs

**Committed MCP error state downgrade:**
- Symptoms: A committed transition error can be represented as `commitState: "not_started"` in MCP output.
- Files: `src/mcp/x402-proposal.ts`, `src/http/errors/transition-error-envelope.ts`, `src/protocol/foundation/errors.ts`
- Trigger: A `HandshakeClientError` or compatible thrown error carries `commitState: "committed"` through MCP proposal error handling.
- Workaround: Read durable evidence directly through evidence resources or HTTP projections before retrying. Do not trust MCP `not_started` in this path until the mapping is corrected.

**False retry evidence label:**
- Symptoms: Ordinary reconciliation is labeled `paid_retry_attempted`.
- Files: `src/protocol/evidence-projections/projections.ts`, `test/protocol/evidence-projections.test.ts`
- Trigger: Any projection input with both `mutationAttempt` and latest reconciliation.
- Workaround: Treat `paid_retry_attempted` as a reconciliation label only. Do not use it as proof of retry posture until a dedicated retry signal exists.

## Security Considerations

### Active-Goal Security Risk: Evidence Gaps at Response Boundaries

- Risk: Durable evidence can exist in protocol storage while active response surfaces omit the refs operators need to reconstruct authority posture.
- Files: `src/http/handlers/evidence-read.ts`, `src/protocol/areas/authority-certificate/transitions.ts`, `src/http/routes/transition-response-schemas.ts`
- Current mitigation: Projection schemas include fields for credential, recovery, isolation, proof-gap, refusal, and authority-certificate refs in `src/protocol/evidence-projections/schemas.ts`. Gateway adapters return distinct non-authoritative/proof-gap/failure outcomes in `src/adapters/x402-payment/wallet-gateway.ts` and `src/adapters/package-install/gateway.ts`.
- Recommendations: Treat missing supported evidence classes as explicit response posture, not silent empty arrays. Add `omittedEvidenceReasonCodes` or load the scoped evidence before projection.

### Deferred Hosted/Non-Goal Capture: Hosted Audit and Retention Are Not Active Proof

- Risk: Hosted operators will eventually need admission audit, search, retention, and cross-tenant evidence boundaries.
- Files: `src/http/admission/*`, `src/http/handlers/evidence-read.ts`, `docs/internal/protocol-kernel-architecture.md`
- Current mitigation: Canon states the repo is a local TypeScript protocol kernel, not hosted operation, and that hosted enforcement requires real deployment boundary and credential custody.
- Recommendations: Do not report hosted audit/search/retention gaps as current Tier 2 bugs. Capture them when the hosted boundary, customer/provider identity, and credential authority holder exist in source.

## Performance Bottlenecks

**Not detected for this focus.**
- Files: `src/http/handlers/evidence-read.ts`, `src/protocol/evidence-projections/projections.ts`, `src/runtime/ingress/index.ts`
- Rationale: The inspected concerns are response completeness, evidence binding, and operator reconstruction posture. No active slow path was validated in this pass.

## Fragile Areas

**Evidence assembly is duplicated across response surfaces:**
- Files: `src/http/handlers/evidence-read.ts`, `src/protocol/areas/authority-certificate/transitions.ts`, `src/protocol/evidence-projections/projections.ts`
- Why fragile: HTTP evidence reads and AuthorityCertificate construction assemble similar transaction context independently, so new evidence classes can appear in projection schemas without being loaded by all response paths.
- Safe modification: Centralize transaction-envelope assembly before adding more projection fields.
- Test coverage: Add paired HTTP and certificate tests for every new evidence class loaded into `AgentTransactionEnvelopeProjection`.

**Reason-code and next-action posture is command-specific:**
- Files: `src/cli/output.ts`, `src/mcp/x402-proposal.ts`, `src/runtime/ingress/index.ts`, `src/surfaces/outcome.ts`
- Why fragile: MCP has `SurfaceOutcome`, CLI has `CliOutputEnvelope`, and runtime ingress has raw proposal output. The three response families do not share a minimal non-authority response contract.
- Safe modification: Define a small shared response posture type for non-authoritative surfaces, then adapt MCP, CLI, and runtime ingress to it without changing durable protocol records.
- Test coverage: Add fixture tests that compare required conservative fields across MCP, CLI, and runtime ingress outputs.

## Scaling Limits

### Deferred Hosted/Non-Goal Capture: Aggregate Spend and Review Windows

- Current capacity: The active x402 path is local and per-call. It enforces `trustedMaxAtomicAmountPerCall` and emits per-call contract/greenlight/gateway/receipt evidence.
- Limit: Session/day/org-level spend windows and review thresholds are metadata until a source-owned ledger exists.
- Files: `src/mcp/x402-proposal.ts`, `src/protocol/areas/idempotency-ledger/*`, `docs/internal/protocol-definition.md`
- Scaling path: Add an aggregate spend ledger only when the active wedge requires it. Do not imply aggregate budget enforcement from per-call x402 evidence.

### Deferred Hosted/Non-Goal Capture: Provider Custody and Multi-Tenant Gateway Operation

- Current capacity: Gateway credential refs and credential-resolution evidence exist as local protocol records and redacted projections.
- Limit: Provider-hosted custody, tenant isolation, gateway key rotation, and live provider audit are not active proof in this repo.
- Files: `src/protocol/areas/credential-custody/*`, `src/protocol/evidence-projections/projections.ts`, `docs/internal/decisions.md`
- Scaling path: Introduce hosted custody only with an explicit gateway authority holder, deployment boundary, rotation posture, and customer-visible evidence refs.

## Dependencies at Risk

**Not detected for this focus.**
- Files: `package.json`
- Risk: No package-level dependency risk was validated in this telemetry/response-contract pass.
- Migration plan: Not applicable.

## Missing Critical Features

### Deferred Hosted/Non-Goal Capture: Durable Pre-Contract Evidence Projection

- Problem: MCP resources expose metadata, challenge, pre-contract health, and AuthorityCertificate reference resources, but these are resource/read views rather than durable pre-contract evidence projections.
- Blocks: Future hosted support flows may need a canonical pre-contract projection that shows catalog, challenge, custody posture, redaction, and safe next action before a contract exists.
- Files: `src/mcp/resources.ts`, `test/mcp/mcp-resource-redaction.test.ts`, `src/mcp/x402-proposal.ts`
- Why deferred: Current tests correctly assert resource reads are read-only and non-authoritative. Turning these into durable evidence is a product expansion, not a current active-surface defect.

### Deferred Hosted/Non-Goal Capture: Broad Tool/Process Interception

- Problem: Current active proof covers declared local protocol paths, x402 proposal/signing, package-install gateway fixtures, and runtime ingress detection. It does not intercept arbitrary MCP hosts, shell processes, browser tools, package managers, or network calls.
- Blocks: Hosted or general agent-runtime claims.
- Files: `src/runtime/ingress/index.ts`, `src/adapters/x402-payment/wallet-gateway.ts`, `src/adapters/package-install/gateway.ts`, `docs/internal/protocol-kernel-architecture.md`
- Why deferred: Canon narrows Tier 2 to local protocol kernel and pre-hosted surfaces. Broad interception becomes active only when a runtime adapter or gateway boundary claims to enforce it.

## Test Coverage Gaps

**HTTP and certificate projection completeness:**
- What's not tested: End-to-end readback that credential-resolution evidence, recovery recommendations, isolation states, and idempotency posture appear in HTTP transaction envelopes and AuthorityCertificate envelopes.
- Files: `src/http/handlers/evidence-read.ts`, `src/protocol/areas/authority-certificate/transitions.ts`, `test/http/d1-http.test.ts`, `test/protocol/authority-certificate.test.ts`
- Risk: New evidence classes can exist in storage and direct projection tests while active response surfaces silently omit them.
- Priority: High

**Policy refusal response contract:**
- What's not tested: Immediate policy evaluation responses returning refusal refs and non-authority posture.
- Files: `src/http/routes/transition-response-schemas.ts`, `src/protocol/areas/policy-greenlight/transitions.ts`, `test/http/d1-http.test.ts`, `test/protocol/kernel-policy-gateway.test.ts`
- Risk: Refusal remains durable but not visible at the response boundary where model agents decide whether to retry.
- Priority: High

**MCP committed error mapping:**
- What's not tested: MCP proposal error handling for real `TransitionErrorEnvelope` commit states, especially `"committed"`.
- Files: `src/mcp/x402-proposal.ts`, `test/mcp/mcp-x402-proposal.test.ts`, `src/mcp/reference-transcript-fixtures.ts`
- Risk: Surface outcome can lie about whether protocol evidence exists.
- Priority: High

**Retry posture evidence:**
- What's not tested: Separation between downstream reconciliation, idempotency replay, runtime retry detection, and paid retry attempts.
- Files: `src/protocol/evidence-projections/projections.ts`, `test/protocol/evidence-projections.test.ts`, `src/runtime/ingress/index.ts`
- Risk: Operators and model agents cannot reconstruct whether repeated mutation was attempted.
- Priority: Medium

**CLI and runtime ingress response posture:**
- What's not tested: Standard conservative fields across CLI and runtime ingress outputs.
- Files: `src/cli/output.ts`, `src/runtime/ingress/index.ts`, `test/runtime/runtime-ingress.test.ts`
- Risk: Non-authoritative diagnostics and proposal outputs remain command-specific and easy to misread.
- Priority: Medium

## Stale/Non-Issues

**Runtime ingress `gatewayCredentialRefs` digest binding:**
- Status: Not an active concern.
- Files: `src/runtime/ingress/index.ts`
- Evidence: Runtime ingress includes `gatewayCredentialRefs` in protected action parameter digest material and tool-call draft creation/finalization.
- Reason: The older drift pattern where runtime ingress failed to bind gateway credential refs is not present in the inspected source.

**Gateway adapters distinguish gateway refusal, downstream failure, and proof gap:**
- Status: Not an active response-contract concern for this focus.
- Files: `src/adapters/x402-payment/wallet-gateway.ts`, `src/adapters/package-install/gateway.ts`
- Evidence: Both adapters check the gateway before mutation and return distinct refused, not-authoritative, reconciled, failed, and proof-gap outcomes.
- Reason: The active blind spots are in projections and response envelopes around those records, not in the inspected adapter outcome unions.

**Raw credential projection redaction:**
- Status: Not an active concern.
- Files: `src/protocol/evidence-projections/projections.ts`, `test/protocol/evidence-projections.test.ts`, `test/protocol/credential-custody.test.ts`
- Evidence: Projection redaction strips credential-looking raw refs and tests assert redacted credential evidence projections.
- Reason: Redaction exists at the projection layer. The active issue is that some response assemblers do not load credential-resolution evidence into the projection.

**MCP resource reads are read-only and non-authoritative:**
- Status: Not an active concern.
- Files: `src/mcp/resources.ts`, `test/mcp/mcp-resource-redaction.test.ts`
- Evidence: Resource read outputs set `readOnly: true`, `mayAuthorize: false`, `mayMutate: false`, `gatewayChecked: false`, and tests reject action-running URIs.
- Reason: These resources can still need future durable pre-contract projections, but they do not currently claim authority.

---

*Concerns audit: 2026-05-23*
