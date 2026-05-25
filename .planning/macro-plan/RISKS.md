# Risks

## RISK-001

- ID: RISK-001
- Severity: Critical
- Risk: `ServiceWorkflowHandle` becomes reusable auth.
- Trigger: SDK, CLI, MCP, runtime, or example code accepts a handle as sufficient evidence for protected mutation.
- Mitigation: Literal false non-authority flags, surface-boundary tests, runtime misuse tests, and fresh action contract requirement.
- Owner: Surface/schema implementer and architecture-test implementer.
- Status: Active gate.

## RISK-002

- ID: RISK-002
- Severity: Critical
- Risk: Admission is mistaken for policy decision or gateway acceptance.
- Trigger: Docs or schema use Admission without showing accepted/refused/stale/proof-gap rows and separate clearance state.
- Mitigation: Use `ServiceWorkflowAdmission`, not standalone `Admission`; require action request and clearance sections in docs and readback.
- Owner: Product/docs implementer.
- Status: Active gate.

## RISK-003

- ID: RISK-003
- Severity: High
- Risk: Passport digest or presentation ID becomes identity, trust, or spend approval.
- Trigger: Passport fields are used in policy/gateway checks as sufficient proof rather than evidence refs.
- Mitigation: Define all passport/admission/handle IDs as correlation and reconstruction only; test they cannot create authority.
- Owner: Protected-action reviewer.
- Status: Active gate.

## RISK-004

- ID: RISK-004
- Severity: High
- Risk: Product simplification becomes metaphor-only documentation.
- Trigger: Story docs land without source schema, fields, tests, examples, and proof gates.
- Mitigation: Pair story with surface contract and architecture tests in Tier 1.
- Owner: Chair.
- Status: Active gate.

## RISK-005

- ID: RISK-005
- Severity: High
- Risk: Tier 2 fixture overclaims x402/auth.md external rails.
- Trigger: Example claims live provider custody, settlement, broad x402 compatibility, auth.md approval, or hosted operation.
- Mitigation: Local/source-owned fixture first; explicit non-claims; x402/auth.md adapter tests when touched.
- Owner: Protected-action fixture implementer.
- Status: Deferred until Tier 2.

## RISK-006

- ID: RISK-006
- Severity: High
- Risk: Multi-host runtime language becomes containment claim.
- Trigger: Codex-local evidence is generalized to Claude Code, Hermes, OpenClaw, generic MCP, browser, A2A, or OpenAPI.
- Mitigation: Runtime posture table and host-specific proof gaps; no native containment claim.
- Owner: Runtime test implementer.
- Status: Active gate.

## RISK-007

- ID: RISK-007
- Severity: Medium
- Risk: Architecture tests rely on string scans and miss semantic authority drift.
- Trigger: Dynamic imports, re-export indirection, or schema aliasing bypasses surface-boundary checks.
- Mitigation: Combine import-boundary tests, schema assertions, explicit non-authority fields, and product output tests.
- Owner: Architecture-test implementer.
- Status: Active gate.

## RISK-008

- ID: RISK-008
- Severity: Medium
- Risk: Canonical docs and README diverge into two first-use stories.
- Trigger: service workflow story lands but README still teaches only x402 install mechanics.
- Mitigation: Canonical docs convergence slice after source surface and tests.
- Owner: Docs implementer.
- Status: Planned.

## RISK-009

- ID: RISK-009
- Severity: High
- Risk: Tier 3 starts before Tier 1/Tier 2 proof gates close.
- Trigger: Hosted-workspace pressure turns local simplification into hosted operation or package-surface expansion.
- Mitigation: Tier 3 lock slice and final repo gate; feed any kernel need back into Tier 1/Tier 2.
- Owner: Release gate owner.
- Status: Active gate.

## RISK-010

- ID: RISK-010
- Severity: Medium
- Risk: The first implementation grows into broad SDK/CLI/MCP redesign.
- Trigger: Developer ergonomics work expands before surface contract proves the model.
- Mitigation: Implementation starts with story, surface schema, and boundary test only; Tier 2 convergence follows after gates.
- Owner: Chair.
- Status: Active gate.
