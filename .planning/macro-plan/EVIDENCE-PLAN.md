# Evidence Plan

## Current Evidence

The plan is grounded in canonical docs, the current macro map, and current
codebase maps. Canon proves the authority chain and product-surface boundary.
The macro map proves lens convergence around non-authority product
simplification. The codebase maps identify source placement, tests, and proof
gaps. Tier 1 source implementation now owns the service workflow story,
non-authority admission/handle schemas, and boundary tests. Tier 2 source
implementation now owns active CLI/MCP/SDK posture alignment, the runnable local
service workflow admission example, and generated-agent/runtime misuse gates.

Current structural validation result:

```text
Macro plan output is valid.
```

Sidecar review result: all five assigned audit reports exist under `.planning/macro-plan/runs/20260525T095940Z-tier1-tier2-product-simplification/audits/`. The reports recommend preserving protected-action, runtime, product, and evidence gates. The chair reconciliation narrows implementation readiness to the first Tier 1 story/schema/test slice and keeps protected-action fixtures, host containment claims, external rails, public-surface convergence, and Tier 3 blocked until source proof exists.

## Verification Commands

Macro-plan validation:

```bash
/Users/joelchan/.codex/skills/gsd-macro-plan/scripts/validate_macro_plan_output.py .planning/macro-plan
```

Observed output:

```text
Macro plan output is valid.
```

Tier 1 documentation and surface verification:

```bash
npm run quality:claims
npm run quality:architecture
npm run check:types
git diff --check
```

Protocol simplification focused verification:

```bash
npm run test -- test/protocol/kernel-compilation-contract.test.ts test/protocol/kernel-policy-gateway.test.ts test/protocol/evidence-projections.test.ts test/runtime/runtime-ingress.test.ts
```

Tier 2 example and integration verification will use a new focused product test plus existing x402/auth.md gateway tests when those surfaces are touched.

T2-03 generated-agent/runtime misuse verification:

```bash
npm run test -- test/product/service-workflow-admission.test.ts
npm run test -- test/runtime/runtime-ingress.test.ts
```

Full closeout:

```bash
npm run format:check
npm run check:repo
```

## Replay And Refusal Cases

Required cases:

- handle reused after refusal;
- handle reused after proof gap;
- handle reused after consumed greenlight replay;
- changed payment amount or endpoint after admission;
- dynamic tool construction from handle;
- raw x402 payload supplied through admission;
- raw bearer/API token supplied through handle;
- gateway policy drift between admission and action request;
- credential-ref or authority-ref isolation before protected action;
- stale passport evidence or expired admission.

Each case must stop before signer use, mutation, receipt export, or certificate minting unless a fresh exact contract clears through policy and gateway.

## Review Prompts

Use these review prompts before promoting implementation:

- Does any simplified noun imply permission?
- Can the user approve admission while the later action contract differs?
- Can an agent pass the handle directly into a protected tool?
- Can generated code mutate through a sibling route after admission?
- Does the readback distinguish admission, policy, gateway, downstream, receipt, refusal, replay, and proof gap?
- Does every public claim match the current source proof ledger?
- Does Tier 3 remain blocked?

## Fixtures Or Examples

Planned fixture sequence:

1. Local service workflow admission fixture emits JSON and Markdown.
2. Negative fixture attempts to use handle as authority and is refused.
3. Later x402 fixture uses handle as context to create one fresh `x402_payment.exact` action request.
4. Output separates admission readback from protected-action terminal evidence.

Existing examples to mirror:

- `examples/self-hosted-activation/`
- `examples/x402-protected-spend/`
- `examples/external-adapter-sdk/`
- `examples/x402-protected-tool-profiles/`
- `examples/mcp-reference-transcript/`

## Readback And Redaction Checks

Readback must omit:

- raw credentials;
- provider secret paths;
- private keys;
- bearer/API tokens;
- raw x402 `PaymentPayload`;
- `PAYMENT-SIGNATURE`;
- raw internal protocol records unless route admission explicitly allows a safe internal read;
- mutation commands hidden inside handle fields.

Readback must include:

- explicit non-authority flags;
- accepted/refused/stale/proof-gap claim rows;
- digest/ref fields for reconstruction;
- fresh action contract requirement;
- proof gaps and next safe recovery moves.

## Browser Or Visual Evidence

No browser or visual evidence is required for the first Tier 1 implementation because this is source/docs/schema/test work. If a review renderer or UI is introduced later, visual QA must verify that admission, handle, clearance, receipt, refusal, and proof-gap states are visibly separate and not summarized as one approval badge.

## Runtime Proof Artifacts

Runtime artifacts to collect during Tier 2:

- runtime ingress negative cases for dynamic/stale handle-context refusal;
- runtime ingress loop/retry cases proving handle evidence does not become
  aggregate spend authority;
- MCP proposal/readback output;
- host profile posture rows;
- raw sibling bypass inventory;
- generated-execution graph evidence for loop/retry/dynamic-tool cases;
- proof-gap readback for unverified hosts.

## Evidence Not Yet Available

- user comprehension evidence for Passport/Admission/Badge naming;
- live external x402 provider/facilitator behavior;
- provider-grade auth.md credential custody;
- browser/A2A/OpenAPI gateway-owned protected path evidence;
- native containment for non-Codex hosts;
- hosted operation, provider custody, retention, org auth, or Tier 3 cloud evidence;
- market willingness to pay for passport validation as a standalone product.
