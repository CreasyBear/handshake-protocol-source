## Audit Scope

Focus: evidence.

Assigned slice: T2-01 MCP surfaces only.

Question audited: whether the simplified service workflow can improve MCP descriptions/resources while preserving the invariant that MCP is proposal/evidence only and `ServiceWorkflowHandle` cannot become permission.

No source, docs, or tests were edited.

## Source Boundary

Required sources read:

- `AGENTS.md`
- `.planning/macro-plan/AGENT-HANDOFF.md`
- `.planning/macro-plan/TASKS.jsonl`
- `README.md`
- `src/mcp/catalog.ts`
- `src/mcp/resources.ts`
- `src/mcp/x402-proposal.ts`
- `src/mcp/output.ts`
- `test/architecture/mcp-surface-posture.test.ts`

Additional read-only sources used to resolve the current boundary:

- `src/surfaces/boundary-manifest.ts`
- `src/surfaces/service-workflow-admission/index.ts`
- `test/architecture/workflow-admission-boundary.test.ts`
- `test/mcp/mcp-schema-contract.test.ts`
- `test/mcp/mcp-resource-redaction.test.ts`
- `test/mcp/mcp-x402-proposal.test.ts`
- `package.json`
- `QUALITY.md`

## Files Read

- `AGENTS.md`
- `.planning/macro-plan/AGENT-HANDOFF.md`
- `.planning/macro-plan/TASKS.jsonl`
- `README.md`
- `src/mcp/catalog.ts`
- `src/mcp/resources.ts`
- `src/mcp/x402-proposal.ts`
- `src/mcp/output.ts`
- `src/surfaces/boundary-manifest.ts`
- `src/surfaces/service-workflow-admission/index.ts`
- `test/architecture/mcp-surface-posture.test.ts`
- `test/architecture/workflow-admission-boundary.test.ts`
- `test/mcp/mcp-schema-contract.test.ts`
- `test/mcp/mcp-resource-redaction.test.ts`
- `test/mcp/mcp-x402-proposal.test.ts`
- `package.json`
- `QUALITY.md`

## Invariant At Stake

MCP can expose proposal and evidence/readback. MCP must not evaluate policy, create a greenlight, perform a gateway check, invoke a signer, mutate, export a receipt, mint a terminal certificate, or let a service workflow handle function as permission.

The dangerous failure is not current MCP mutation. The dangerous failure is adding the simplified service workflow in a way that makes `ServiceWorkflowHandle`, passport IDs, admission IDs, or handle digests look like clearance.

## Pass Conditions

- MCP keeps exactly proposal/evidence/readback posture.
- `handshake.actions.x402_payment.propose` remains one fresh x402 action-contract proposal, not policy or gateway authority.
- MCP resources remain read-only and set false non-authority flags.
- Service workflow alignment is descriptive or evidentiary only.
- Any service workflow reference, if later added, is correlation/readback context only and cannot satisfy `delegatedAuthorityBinding`, `operatingEnvelopeId`, `gatewayRegistryEntryId`, trusted readiness, policy version, idempotency authority, greenlight, gateway check, signer, payment material, mutation, receipt export, or certificate minting.
- Tests fail if MCP imports authority paths, names credential material, outputs authority fields, or accepts mutation-shaped proposal input.

## Failures

Current authority posture: no failure found. Focused MCP/workflow tests pass.

Concrete T2-01 alignment gap:

- `README.md` teaches `Show Passport -> ServiceWorkflowAdmission -> ServiceWorkflowHandle -> Request Clearance -> Read Outcome`, and states handle is correlation/readback only.
- `src/mcp/catalog.ts` exposes the one x402 proposal tool and read-only resource templates, but the tool description only says it proposes one exact x402 protected action and does not authorize or execute. It does not teach the service workflow model or the handle boundary.
- `src/mcp/resources.ts` metadata payload for `handshake://metadata/actions/{actionClass}` only returns action class, proposal tool, and non-authority flags. It does not expose the service workflow boundary or the "fresh action contract required" rule.
- `src/mcp/resources.ts` challenge payloads are generic `recraft_request` records. They do not distinguish stale service workflow evidence, handle-as-permission misuse, or fresh-clearance-required remediation.

Planning/test conflict:

- T2-01 asks to align MCP descriptions with the service workflow model.
- `test/architecture/workflow-admission-boundary.test.ts` currently treats `src/mcp` as a forbidden authority root for the service workflow nouns and IDs. That is good against handle-as-permission drift, but it also blocks naive MCP description/resource alignment if exact names are added to `src/mcp/catalog.ts` or `src/mcp/resources.ts`.
- Therefore T2-01 needs a narrow test rule, not a broad weakening: allow descriptive/read-only MCP metadata only if false non-authority flags and fresh-contract language are present; continue forbidding proposal input fields and authority-path use.

## Proof Gaps

- No MCP-specific test currently proves the simplified service workflow is visible to MCP users as proposal/evidence-only. Current tests prove MCP stays non-authority, not that it teaches the simplified flow.
- No MCP-specific negative test distinguishes safe service workflow metadata from unsafe handle-as-permission input.
- `McpX402PaymentProposalInputSchema` has `correlationRef`, but no typed service workflow context posture. That is safer than accepting a handle as permission, but it means any future handle correlation would be opaque unless bounded by explicit metadata/resource tests.
- No MCP resource family exists for read-only service workflow admission or handle readback. Adding one could help reconstruction, but only if it is read-only evidence and cannot be used as a bearer permission URI.

## Required Changes

For T2-01, keep the change descriptive and evidentiary:

1. Update MCP tool/resource descriptions to say the tool proposes fresh clearance for one protected action after any service workflow context; it does not authorize, execute, or treat workflow handles as permission.
2. Prefer read-only metadata over handle-bearing proposal input. A safe direction is a metadata resource such as `handshake://metadata/service-workflow` or added fields in `handshake://metadata/actions/{actionClass}` that state:
   - passport/admission/handle are evidence or context only;
   - fresh action contract is required for every protected action;
   - MCP creates no policy decision, greenlight, gateway check, mutation, receipt export, or certificate.
3. If actual service workflow readback resources are added, keep them under evidence/readback, include the service workflow non-authority boundary flags, and never return credential material, payment material, receipt exports, raw internal records, greenlights, gateway check inputs, or mutation commands.
4. Do not add MCP policy tools, gateway tools, signer tools, mutation tools, or service-workflow-handle permission tools.
5. Do not let `ServiceWorkflowHandle` populate `delegatedAuthorityBinding`, trusted readiness, policy version, gateway registry, operating envelope, idempotency authority, or proposal bounds.
6. Tighten tests by splitting "MCP may describe/read service workflow context" from "MCP may use service workflow context as authority." The latter must remain forbidden.

## Status Recommendation

Current MCP posture passes as proposal/evidence only.

T2-01 should proceed only as a narrow descriptive/resource alignment. It should not add handle-bearing permission semantics or new authority-shaped MCP tools.

Smallest acceptable move: make MCP catalog/metadata teach "service workflow context is not clearance; fresh action contract required" and add tests proving the wording/resource remains non-authority.

## Commands Or Tools Used

- `sed -n '1,220p' /Users/joelchan/.codex/skills/handshake-grounding/SKILL.md`
- `rg -n "T2-01|MCP|x402-proposal|mcp-surface|proposal/evidence|proposal evidence|x402" /Users/joelchan/.codex/memories/MEMORY.md`
- `pwd`
- `git status --short --branch`
- `nl -ba AGENTS.md | sed -n '1,260p'`
- `nl -ba .planning/macro-plan/AGENT-HANDOFF.md | sed -n '1,260p'`
- `nl -ba .planning/macro-plan/TASKS.jsonl | sed -n '1,220p'`
- `nl -ba README.md | sed -n '1,260p'`
- `nl -ba src/mcp/catalog.ts | sed -n '1,260p'`
- `nl -ba src/mcp/resources.ts | sed -n '1,320p'`
- `nl -ba src/mcp/x402-proposal.ts | sed -n '1,920p'`
- `nl -ba src/mcp/output.ts | sed -n '1,320p'`
- `nl -ba test/architecture/mcp-surface-posture.test.ts | sed -n '1,360p'`
- `rg --files src/mcp test/mcp test/architecture | sort`
- `nl -ba src/surfaces/boundary-manifest.ts | sed -n '586,660p'`
- `nl -ba src/surfaces/service-workflow-admission/index.ts | sed -n '1,180p'`
- `nl -ba test/mcp/mcp-schema-contract.test.ts | sed -n '1,260p'`
- `nl -ba test/mcp/mcp-resource-redaction.test.ts | sed -n '1,260p'`
- `nl -ba test/mcp/mcp-x402-proposal.test.ts | sed -n '1,760p'`
- `nl -ba test/architecture/workflow-admission-boundary.test.ts | sed -n '1,320p'`
- `nl -ba package.json | sed -n '84,112p'`
- `nl -ba QUALITY.md | sed -n '120,150p'`
- `npm run test -- test/architecture/mcp-surface-posture.test.ts test/mcp/mcp-schema-contract.test.ts test/mcp/mcp-resource-redaction.test.ts test/mcp/mcp-x402-proposal.test.ts test/architecture/workflow-admission-boundary.test.ts`
