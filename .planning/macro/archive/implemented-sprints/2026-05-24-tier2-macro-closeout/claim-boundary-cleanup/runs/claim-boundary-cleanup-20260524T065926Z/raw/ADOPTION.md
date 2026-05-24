# ADOPTION First-Pass Plan: Claim Boundary Cleanup

## Invariant at stake

Adoption material must not turn a local proof lane into a product claim. A new user, maintainer, buyer, auditor, or future agent must understand that Handshake is protected actions for automated decision making, currently proven through a narrow x402 exact per-call protected-action wedge. Engineering-agent workflows are an adoption context, not the category boundary.

If the docs teach "engineering agents" as the product category, the compiler overreaches the principal. If the x402 walkthrough teaches spend budgeting, settlement, hosted trust, seller/facilitator operation, or broad runtime control, the adoption surface is advisory theatre.

## Source posture used

Allowed packet read: `.planning/macro/active/claim-boundary-cleanup/runs/claim-boundary-cleanup-20260524T065926Z/input.md`.

Allowed source files read for this pass included the canonical docs, current macro register, codebase maps, claim-boundary tests, x402 product report test, x402 walkthrough/readme, self-hosted activation readme, and source lane manifests named by the input packet.

No sibling raw outputs, normalized outputs, or final `PLAN.md` were read.

## Adoption path

1. Establish the category vocabulary first.
   - Candidate paths: `README.md`, `AGENTS.md`, `docs/internal/decisions.md`, `docs/internal/protocol-notes.md`, `docs/internal/protocol-layman.md`.
   - Replace top-level "contracted execution infrastructure for engineering agents" posture with "protected actions for automated decision making" or "protocol kernel for protected action control" where the statement defines the product category.
   - Preserve engineering-agent examples only where they are explicitly framed as the current adoption context or one generated-execution source.
   - Do not change the Tier 1 primitive: exact action contract -> policy decision -> one-use greenlight -> gateway check -> receipt/refusal/proof gap.

2. Make x402 the first wedge, not the protocol definition.
   - Candidate paths: `README.md`, `docs/internal/decisions.md`, `docs/internal/protocol-definition.md`, `docs/internal/protocol-kernel-architecture.md`, `examples/x402-protected-spend/README.md`, `examples/x402-protected-spend/run.ts`.
   - Teach the first-use path as one installed protected action pack: one official buyer-side `x402_payment.exact` per-call attempt.
   - Keep `x402_paid_http_call.exact` as buyer-readable report language only unless the action catalog, compiler, policy, and gateway all expose that action class.
   - Keep "No adapter family defines the protocol" visible near the first x402 walkthrough.

3. Reframe aggregate spend as intentionally outside current remit.
   - Candidate paths: `README.md`, `examples/x402-protected-spend/run.ts`, `test/architecture/claim-boundary.test.ts`, `test/product/x402-protected-spend-demo-report.test.ts`.
   - Replace "spend reservation ledger required before claim" and "until a ledger exists" style language with "aggregate payment-budget management is intentionally out of current remit" where the source is describing product scope.
   - Keep `not_enforced_local_metadata` only where it labels local metadata and cannot be read as a planned spend-window feature.
   - The adoption message should be: Handshake authorizes one exact x402 protected action attempt; it does not manage budgets, reservations, or payment programs.

4. Turn the first-use path into a claim-boundary walkthrough.
   - Candidate paths: `README.md`, `examples/x402-protected-spend/README.md`, `examples/self-hosted-activation/README.md`.
   - The first-use path should ask the user to run `npm run demo:aps`, inspect `examples/x402-protected-spend/output/latest.md`, and verify these boundaries:
     - 402 challenge evidence exists before authority.
     - Runtime proposal creates no policy, greenlight, gateway check, mutation, receipt, or certificate.
     - Policy greenlights one exact contract.
     - Gateway check precedes signing.
     - Signed retry is downstream fixture evidence, not authority.
     - Replay refuses before signer reuse.
     - Proof gaps remain proof gaps.
     - Terminal certificate is local pinned terminal evidence only.

5. Keep support and debugging redacted from first use.
   - Candidate paths: `README.md`, `src/sdk/LANE.md`, `examples/x402-protected-spend/README.md`.
   - First-use docs should tell users to share only redacted report refs, reason codes, request identities, projection payloads, and local certificate verification results.
   - They must not share `PaymentPayload`, `PAYMENT-SIGNATURE`, private keys, signer refs, raw store records, role-token maps, or gateway credentials.

6. Preserve role-scoped activation ergonomics.
   - Candidate paths: `README.md`, `examples/x402-protected-spend/run.ts`, `src/sdk/LANE.md`, `test/product/x402-protected-spend-demo-report.test.ts`.
   - Keep first-slice activation on `RuntimeClient` and `EvidenceClient` from `handshake-protocol-kernel/sdk/role-clients`.
   - Keep all-role `HandshakeClient` out of product walkthroughs because it teaches a mixed-custody shape.

## First-use checklist

For the future implementation slice, first-use docs should let a user complete this exact path:

1. Read the top-level category: Handshake protects actions for automated decision making through installed gateway-checked paths.
2. Confirm the local setup command: `bun install --frozen-lockfile`.
3. Run the repo gate: `npm run check:repo`.
4. Run the x402 first wedge: `npm run demo:aps`.
5. Open `examples/x402-protected-spend/output/latest.md`.
6. Confirm the report shows the exact action class `x402_payment.exact`, not a generic payment manager.
7. Confirm the report's non-claims include no hosted operation, no provider/customer custody, no aggregate payment-budget management, no settlement finality, no seller/facilitator operation, no broad x402 compatibility, no broad MCP/CLI/browser/shell/network control, no cross-org certificate trust, no marketplace/certification, and no clearing-house readiness.
8. Confirm the gateway/signing section says signer invocation happens only after `VerifiedGatewayCheck`.
9. Confirm replay refusal does not reuse the signer.
10. Confirm support/debugging instructions use redacted refs and reason codes only.

## Missing docs and examples

- Missing category correction in top-level canonical language.
  - Current issue: `README.md`, `AGENTS.md`, and `docs/internal/decisions.md` still contain category-level engineering-agent language.
  - Fix: top-level category should become protected actions for automated decision making; engineering-agent execution remains a current adoption context and generated-execution source.

- Missing wedge ladder.
  - Fix: add a compact ladder in `README.md` and `docs/internal/decisions.md`:
    - category: protected actions for automated decision making;
    - protocol primitive: exact contract, policy, one-use greenlight, gateway check, receipt/refusal/proof gap;
    - first wedge: x402 exact per-call protected action;
    - current adoption context: automated engineering/runtime workflows;
    - local proof boundary: local/reference only, no hosted/provider/cross-org claims.

- Missing "how to read the APS report" guide.
  - Fix: in `examples/x402-protected-spend/README.md`, explain each report section as adoption evidence: challenge before authority, proposal not permission, gateway check, signed retry evidence, replay refusal, proof gap, terminal certificate, non-claims.

- Missing aggregate payment-budget cut-line language.
  - Current issue: source/test language still treats "spend reservation ledger" as a missing proof object for future aggregate spend enforcement.
  - Fix: replace with "aggregate payment-budget management intentionally out of current remit" in docs/report fields where the claim boundary is product scope rather than local metadata.

- Missing support/debuggability playbook.
  - Fix: add a short support section to the x402 walkthrough and/or README that says exactly which redacted artifacts can be shared and which credential/payment fields must never be requested.

- Missing claim guard for engineering-agent category drift.
  - Fix: strengthen `test/architecture/claim-boundary.test.ts` so top-level category statements cannot define Handshake as only engineering-agent infrastructure while still allowing engineering-agent workflows as example/adoption context.

- Missing claim guard for report proof-object label.
  - Fix: strengthen `test/product/x402-protected-spend-demo-report.test.ts` so `x402_paid_http_call.exact` remains classified as buyer-readable report language, not the action catalog class.

## Success metrics

- A buyer can state the product category after reading the first screen of `README.md`: protected actions for automated decision making, not generic agent governance and not only engineering agents.
- A developer can run `npm run demo:aps` and identify the exact contract, policy decision, gateway check, signed retry evidence, replay refusal, proof gap posture, and terminal evidence boundary without reading source internals.
- `npm run quality:claims` fails if canonical docs imply payment management, settlement, seller/facilitator operation, hosted trust, broad x402 compatibility, broad runtime/MCP/CLI/browser/shell/network/package-manager control, marketplace/certification, clearing-house readiness, or cross-org certificate trust.
- `test/product/x402-protected-spend-demo-report.test.ts` fails if the report describes aggregate payment-budget management as a near-term missing implementation rather than an intentional current non-remit.
- First-use examples import `RuntimeClient` and `EvidenceClient` from `handshake-protocol-kernel/sdk/role-clients` and do not import `HandshakeClient`.
- Search over canonical docs and walkthroughs finds engineering-agent language only as an adoption context, generated-execution example, or first-wedge operating environment, not as the protocol category.
- Search over x402 walkthrough/report output finds `not_enforced_local_metadata` only next to clearly local metadata, never as enforced spend control.

## Adoption blockers and fixes

| Blocker | Adoption failure | Fix |
| --- | --- | --- |
| Engineering-agent language defines the category | Buyers and future implementers think Handshake is a coding-agent tool, not protected actions for automated decision making | Rewrite category claims in canonical docs; add claim guard that allows engineering-agent examples only with context qualifiers |
| x402 first wedge reads like payment management | Users expect budgets, settlement, facilitator/seller roles, or provider custody | Make aggregate payment-budget management an explicit non-remit; keep per-call x402 exact as the only current spend authority |
| "Spend reservation ledger" reads like pending roadmap | Future work drifts into payment-program features just to satisfy an old claim | Replace product-scope occurrences with intentional non-remit language; leave ledger only as local metadata language if needed |
| Report proof object differs from action class | Users think `x402_paid_http_call.exact` is gateway-bound authority | Label it as buyer-readable only and guard action class remains `x402_payment.exact` |
| Self-hosted activation packet composes many surfaces | Users infer MCP/CLI/runtime are mutation or authority surfaces | Put proposal/evidence-only disclaimers directly next to activation commands and artifacts |
| Role-scoped SDK path is easy to bypass | Examples drift back to all-role client ergonomics | Keep product walkthroughs on role clients and assert the example source does not import `HandshakeClient` |
| Support path is underdocumented | Debugging requests may solicit payment signatures, raw records, or credentials | Add a support payload allowlist and forbidden field list to first-use docs |
| Package/registry/readiness language can overclaim availability | Users infer public distribution or endorsement from local metadata | Keep publication/registry claims deferred unless externally verified and owner-held credentials prove publication |

## Assumptions

- The user correction overrides stale category wording in current source: Handshake is protected actions for automated decision making.
- x402 remains the first wedge unless later source evidence proves a narrower implementation sequence.
- Tier 1 protocol/kernel meaning remains stable.
- This slice is claim cleanup only. It should not add custody, hosted operation, payment-budget management, settlement, provider integration, or runtime interception.
- Claim-boundary tests are the right enforcement surface for adoption language.
- `.planning/` remains scratch and must not become canonical repo truth.

## Dependencies

- Canonical docs: `README.md`, `AGENTS.md`, `docs/internal/decisions.md`, `docs/internal/protocol-definition.md`, `docs/internal/protocol-kernel-architecture.md`, `docs/internal/protocol-layman.md`, `docs/internal/protocol-notes.md`.
- Adoption examples: `examples/x402-protected-spend/README.md`, `examples/x402-protected-spend/run.ts`, `examples/self-hosted-activation/README.md`.
- Guard tests: `test/architecture/claim-boundary.test.ts`, `test/product/x402-protected-spend-demo-report.test.ts`.
- Lane boundaries: `src/runtime/LANE.md`, `src/mcp/LANE.md`, `src/sdk/LANE.md`, `src/adapters/LANE.md`, `src/conformance/LANE.md`.
- Validation commands named by allowed docs: `npm run quality:claims`, `npm run test -- test/architecture/claim-boundary.test.ts test/product/x402-protected-spend-demo-report.test.ts`, `npm run check:repo`.

## Risks

- Overcorrection risk: replacing engineering-agent category language with "automated decision making" could sound like broad governance unless every occurrence is tied back to installed protected paths.
- Wedge confusion risk: x402 can prove the spine without defining the protocol; docs must keep this hierarchy explicit.
- Payment-regulatory risk: "budget", "reservation", "settlement", "facilitator", "seller", and "clearing house" language can imply payment-management scope. Use non-claim language, not roadmap language.
- Support risk: a user debugging a failed local run may expose credential material unless the docs state a redacted support payload.
- MCP/CLI risk: local proposal/evidence surfaces can look like control surfaces if the first-use path puts them before the x402 authority chain.
- Claim-test brittleness risk: naive regex bans can block valid "engineering-agent adoption context" text. Guards should distinguish category statements from examples.
- External availability risk: publication, MCP Registry, JWKS, provider custody, and x402 legal/payment claims require external verification and are outside this cleanup slice.

## Validation gates

Planning gates for the future implementation slice:

1. Category language gate.
   - Search canonical docs and examples for category-level "engineering agents" wording.
   - Pass only if engineering-agent references are context/examples, not product boundary.

2. x402 wedge gate.
   - `test/architecture/claim-boundary.test.ts` must keep "No adapter family defines the protocol" and one official buyer-side exact per-call boundary.
   - It must reject broad x402 compatibility, facilitator/seller/settlement, hosted trust, and broad runtime claims.

3. Aggregate payment-budget gate.
   - `test/product/x402-protected-spend-demo-report.test.ts` must assert aggregate payment-budget management is outside current remit.
   - It must not require a "spend reservation ledger" as a future claim prerequisite unless clearly labeled local metadata and not product scope.

4. First-use output gate.
   - `npm run demo:aps` must produce `examples/x402-protected-spend/output/latest.md` and `.json` with non-claims and missing-proof posture that cannot be read as authority.

5. Role-client gate.
   - Product walkthroughs must use `RuntimeClient` and `EvidenceClient` and must not import `HandshakeClient`.

6. Support redaction gate.
   - Docs must contain a support payload allowlist and forbidden credential/payment fields.

7. Closeout gate.
   - Run:
     - `npm run quality:claims`
     - `npm run test -- test/architecture/claim-boundary.test.ts test/product/x402-protected-spend-demo-report.test.ts`
     - `npm run check:repo`

## Cut lines

- No hosted operation.
- No payment management.
- No aggregate payment-budget management.
- No settlement or downstream business-success claims.
- No facilitator operation.
- No seller middleware.
- No provider/customer custody claim from local fixtures.
- No broad x402 compatibility.
- No broad MCP, CLI, browser, shell, package-manager, network, cloud, repo, or database control.
- No marketplace, certification, clearing-house, or cross-org trust claim.
- No public package or MCP Registry availability claim without external verification and owner-held publication evidence.
- No review UI, approval, or rendered report as authority unless structurally bound to the exact action contract and enforced at gateway time.
- No mutation, signer access, receipt export, or certificate minting through SDK/MCP/CLI first-use surfaces.

## Blocked checks

- Did not run validation commands; this is a planning-only first-pass output.
- Did not verify `package.json` scripts directly because `package.json` was not in the allowed source boundary. Commands were taken from allowed docs.
- Did not externally verify x402, npm, MCP Registry, JWKS, Cloudflare, or legal/payment-regulatory language; the input packet says not to browse by default for this slice.
- Did not inspect source files outside the input packet allowlist, including implementation files referenced by allowed docs.
- Did not inspect sibling raw outputs, normalized outputs, or final `PLAN.md`.
