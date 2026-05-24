# ADOPTION Perspective

## Invariant At Stake

First-use paths must teach the same authority boundary the kernel enforces: runtime, MCP, CLI, demos, support bundles, and docs may propose or display evidence only. They must not imply policy authority, signer custody, gateway checks, mutation execution, receipt export, hosted operation, provider custody, broad host interception, aggregate spend enforcement, or x402 settlement finality.

## Adoption Path

1. Fix the mechanism before updating the walkthroughs.
   - Runtime x402 ingress must forward `intendedRequestBodyPosture`, `providerEnvironmentPosture`, and `providerEnvironmentRef` into the x402 attempt and action-contract parameters instead of defaulting them away.
   - MCP x402 proposal input must expose the same request-body and provider-environment posture fields, bind them into parameters and idempotency derivation, and refuse unsupported/live/unknown posture as a structured non-authority outcome.
   - Demo and docs changes should land only after the focused runtime/MCP tests fail without the source changes and pass with them.

2. Make the first local success path a narrow activation sequence, not an authority shortcut.
   - The first-use guide should preserve this order: `compileX402InstallProposal()` -> catalog/envelope registration -> hostile bypass probes -> `createProtectedPathPosture()` -> runtime proposal -> policy evaluation -> `runX402WalletGateway()` -> redacted evidence projection -> optional terminal certificate after receipt/refusal/proof-gap/replay.
   - Add a source-owned activation helper or example-local sequencer only if it reduces ceremony without moving policy, greenlight, signer custody, gateway check, mutation, receipt export, or certificate minting into runtime/MCP/CLI.
   - The helper output must include the same non-authority flags used by runtime/MCP/CLI outputs.

3. Keep MCP and CLI as model/operator evidence surfaces.
   - MCP should remain exactly one proposal tool plus read-only resources. It should never become `pay`, `approve`, `gatewayCheck`, `sign`, `receiptExport`, or `certMint`.
   - CLI should remain schema/init/doctor/evidence/cert-verify/support/install-health/conformance posture. `support.bundle` can gather debug context, but it must not read raw internal records, spawn mutation commands, include credential material, or claim authority.
   - Package docs should teach `handshake` as operator evidence/readiness CLI and `handshake-mcp` as local stdio proposal/evidence server.

4. Treat demo outputs as adoption contracts.
   - `examples/x402-protected-spend/output/latest.json` should keep named phases and include request-body posture, provider-environment posture/ref, gateway check vs downstream status, signed retry as local fixture evidence, replay refusal, non-claims, and missing proof objects.
   - `examples/mcp-reference-transcript/output/latest.json` should include posture-parity cases: local no-body success, digest-bound success, omitted/unsupported body refusal, live/unknown/external provider-environment refusal, stale metadata, gateway offline, raw sibling input, replay refusal, and proof gap.
   - The demo reports should show `x402_paid_http_call.exact` only as buyer-readable proof-object language, not as an action catalog entry until source, policy, runtime, and gateway all support that action class.

5. Make packaging a first-use validation step.
   - `npm run pack:check` must remain mandatory before publication or registry claims because package consumers use `dist/**` and `bin/**`, not dirty TypeScript source.
   - `scripts/check-package-surface.mjs` and `scripts/check-published-entrypoints.mjs` should prove no `.planning/`, tests, workspace junk, raw credentials, `PaymentPayload`, or `PAYMENT-SIGNATURE` leaks into the package or MCP stdio smoke.
   - The package docs must keep npm/MCP Registry publication as metadata readiness only until owner credentials actually publish the package and registry namespace.

## First-Use Checklist

1. Install and run the full local gate:
   - `bun install --frozen-lockfile`
   - `npm run check:repo`

2. Generate the local x402 protected-spend evidence packet:
   - `npm run demo:aps`
   - Inspect `examples/x402-protected-spend/output/latest.md` and `latest.json` for phases `0_sandbox_payment_required_challenge` through `7_replay_refusal`.
   - Confirm runtime records no policy/greenlight/gateway/mutation/receipt/certificate before policy, and the signer is invoked only after `VerifiedGatewayCheck`.

3. Generate the MCP proposal/evidence transcript:
   - `npm run demo:mcp-transcript`
   - Confirm MCP outputs carry non-authority flags and posture-parity refusals without creating gateway or mutation records.

4. Smoke the packaged surfaces:
   - `npm run build`
   - `node bin/handshake schema`
   - `node bin/handshake-mcp`
   - `npm run pack:check`

5. Produce a sanitized support bundle once the bundle mechanism is strengthened:
   - Include package version, `server.json`/`package.json#mcpName` sync, command manifest, non-authority flags, focused test results, demo output digests, install-health refs, MCP transcript case list, and redaction summary.
   - Exclude raw protocol records, stream events, idempotency internals, raw signer refs, `PaymentPayload`, `PAYMENT-SIGNATURE`, private keys, registry credentials, Worker tokens, and `.planning/` scratch.

## Missing Docs And Examples

- README quickstart should separate three paths: local kernel proof, package/bin smoke, and MCP proposal/evidence transcript. It should not compress them into "install Handshake and pay safely."
- `examples/x402-protected-spend/README.md` needs a posture matrix:
  - `no_body` with null digest: allowed for local/reference exact path.
  - `digest_bound` with body digest: allowed only when bound through runtime/MCP and gateway parameters.
  - `omitted` or `unsupported`: refusal before contract proposal.
  - `local_reference_sandbox`: first-slice provider environment.
  - `external_sandbox`, `live`, or `unknown`: refusal until a separate provider/firewall/custody mechanism exists.
- MCP reference transcript needs explicit request-posture and provider-posture examples, not only metadata/install/gateway/idempotency cases.
- CLI support bundle needs an example JSON fixture and a product test proving every field is diagnostic, redacted, and non-authority.
- Package docs need a short "dirty source is not packaged truth" note: `dist/**` is current only after `npm run build`/`pack:check`.
- Spend-window metadata needs one adoption-visible warning in README and demo output: session/day/review bounds are metadata until a reservation ledger exists.
- `.planning` scratch drift needs to stay out of package docs and package files; implementation plans can read `.planning/codebase/CONCERNS.md`, but users must learn canon from README, QUALITY, STRUCTURE, and `docs/internal/*`.

## Success Metrics

- A new developer can get from clean checkout to `examples/x402-protected-spend/output/latest.json` in one documented path without touching raw protocol records or all-role SDK clients.
- Runtime x402 posture parity has regression tests proving unsupported body posture and live/unknown/external provider environment refuse without an action contract.
- MCP x402 posture parity has schema, proposal, transcript, and package-entrypoint tests proving the same posture fields are either bound into the proposed contract or refused before authority-shaped output.
- Every first-use output includes `authorityCreated: false`, `greenlightCreated: false`, `gatewayCheckPerformed: false`, `mutationAttempted: false`, `credentialMaterialIncluded: false`, `receiptExportCreated: false`, and `authorityCertificateMinted: false` unless the output is a kernel/gateway evidence object that actually created that object.
- Demo and support outputs include non-claims and missing proof objects for hosted operation, provider custody, aggregate spend enforcement, broad host interception, payment settlement finality, and cross-org certificate trust.
- `npm run pack:check` proves package files and bundled entrypoints match the source boundary; no `.planning/`, tests, deleted doc trees, or workspace junk enter the package.
- `npm run quality:claims` fails if docs or examples teach false authority, broad x402 compatibility, provider custody, hosted operation, MCP auto-pay, facilitator/seller middleware, or spend-window enforcement.

## Adoption Blockers And Fixes

1. Runtime x402 posture defaults hide unsafe request/provider posture.
   - Blocker: runtime dispatch schemas accept posture fields, but current x402 runtime tests do not prove those fields reach the direct adapter refusal boundary.
   - Fix: update runtime x402 dispatch-to-attempt conversion to pass `intendedRequestBodyPosture`, `providerEnvironmentPosture`, and `providerEnvironmentRef`; add tests in `test/runtime/runtime-ingress.test.ts` for unsupported/omitted body and live/unknown/external provider environments producing no `action_contract`.

2. MCP cannot express the same x402 request/provider posture as direct adapter/runtime paths.
   - Blocker: `McpX402PaymentProposalInputSchema`, `x402Parameters()`, and `deriveMcpX402IdempotencyKey()` omit request-body posture and provider-environment posture/ref.
   - Fix: add those fields, include them in parameter and idempotency binding, and add MCP proposal/transcript/package smoke cases proving refusal or exact binding. MCP should return structured non-authority outcomes with reason codes instead of letting models infer that missing posture defaults are safe.

3. Local sandbox signed retry can be misread as seller middleware or settlement.
   - Blocker: the sandbox emits official-shaped challenge/retry evidence and can look like real downstream x402 operation to first-time users.
   - Fix: make local/reference boundary first-class in demo JSON, support bundle, conformance output, and claim tests. Preserve `authorityCreated: false`, `signedRetryIsAuthority: false`, `downstream fixture only`, and `not settlement finality` in every report.

4. Activation ceremony is easy to skip.
   - Blocker: first-use requires install compilation, record registration, probes, protected-path posture, runtime proposal, policy, gateway, projections, and optional certificate. Users will skip probes or push authority into runtime/MCP unless the sequence is one obvious path.
   - Fix: add an activation sequencer or generated checklist that returns refs for each step and refuses to continue when probes/posture are missing. Keep mutation authority in gateway code only.

5. Support bundles are valuable but dangerous.
   - Blocker: a support bundle can become a raw audit dump or leak authority-shaped material.
   - Fix: define a support-bundle schema with allowlisted fields only, add product tests for redaction/non-authority flags, and bind the command manifest so the bundle reads projections and generated artifacts, not raw records.

6. Package readiness can drift from dirty source.
   - Blocker: first-use docs mention publishable CLI/MCP surfaces while `dist/**` can lag changed source until build/pack checks run.
   - Fix: keep `pack:check` in `check:repo`, add a package smoke section to README, and require demo/support output to report package version plus bundle smoke status as evidence, not publication proof.

7. Spend-window language invites false adoption expectations.
   - Blocker: per-session/day/review fields look like budget enforcement even though only per-call x402 amount is enforced.
   - Fix: keep session/day/review values out of action-contract bounds and demo authority claims; report them as `not_enforced_local_metadata` until a reservation ledger exists.

## Validation Gates

- Runtime posture gate:
  - `npm run test -- test/runtime/runtime-ingress.test.ts`
  - Required additions: x402 unsupported/omitted body refusal, live/unknown/external provider-environment refusal, digest-bound binding, and no policy/greenlight/gateway/mutation records.

- MCP posture gate:
  - `npm run test -- test/mcp/mcp-schema-contract.test.ts test/mcp/mcp-x402-proposal.test.ts test/mcp/mcp-reference-transcript.test.ts test/mcp/mcp-stdio-process.test.ts`
  - Required additions: posture fields in schema, idempotency changes when posture changes, structured refusal cases, and stdio smoke with no signer/payment material leakage.

- x402 adapter/sandbox gate:
  - `npm run test -- test/adapters/x402-payment-action-proposal.test.ts test/adapters/x402-wallet-gateway.test.ts test/integration/x402-d1-http.test.ts`
  - Required assertions: direct adapter and runtime/MCP surfaces agree on request/provider posture; sandbox signed retry stays local/reference and post-gate only.

- Product/demo gate:
  - `npm run demo:aps`
  - `npm run demo:mcp-transcript`
  - `npm run test -- test/product/x402-protected-spend-demo-report.test.ts test/product/self-hosted-activation.test.ts`
  - Required assertions: demo reports include posture fields, non-claims, missing proof objects, support-bundle refs when implemented, and no all-role SDK adoption.

- CLI/support/package gate:
  - `npm run test -- test/architecture/cli-command-posture.test.ts test/architecture/mcp-surface-posture.test.ts test/architecture/package-surface.test.ts test/architecture/surface-boundary-posture.test.ts`
  - `npm run pack:check`
  - Required assertions: command manifest stays non-authority, support bundle is allowlisted/redacted, package files exclude scratch, and bundled bins run from `dist/**`.

- Claim/canon gate:
  - `npm run quality:claims`
  - `npm run quality:architecture`
  - Required assertions: no hosted/provider/broad-host/aggregate-spend/facilitator/seller/middleware/cross-org trust claims; `.planning` remains scratch and out of package surface.

- Full closeout gate:
  - `npm run check:repo`

## Blocked Checks

- Full validation was not run for this first-pass adoption perspective; implementation has not been changed yet.
- Actual npm publication and MCP Registry namespace publication cannot be validated from source because owner-held registry credentials are external.
- Live provider/customer custody, real vault rotation/revocation, live facilitator/seller middleware, hosted verifier/JWKS/revocation, broad browser/shell/network/MCP host interception, and aggregate spend reservation cannot be checked until those mechanisms exist.
- Sibling raw outputs, normalized outputs, and `.planning/macro/PLAN.md` were intentionally not read, so this perspective does not depend on other macro-planning drafts.
