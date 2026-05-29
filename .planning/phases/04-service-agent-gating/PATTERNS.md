# Phase 04: Service Agent Gating — Pattern Map

**Mapped:** 2026-05-28  
**Files analyzed:** 28 new/modified (inferred from `04-CONTEXT.md`)  
**Analogs found:** 24 / 28

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `docs/internal/service-workflow-story.md` (agent lane extension) | config | transform | `docs/internal/service-workflow-story.md` | exact |
| `docs/internal/protocol-layman.md` (product vocabulary chain) | config | transform | `docs/internal/protocol-layman.md` | exact |
| `docs/internal/decisions.md` (custody matrix, dual enforcement) | config | transform | `docs/internal/decisions.md` | exact |
| `docs/internal/host-golden-paths-and-trace-guidance.md` (bilateral runbooks) | config | transform | `docs/internal/host-golden-paths-and-trace-guidance.md` | exact |
| `src/http/errors/transition-error-envelope.ts` (`failureClass` / `phase`) | middleware | request-response | `src/http/errors/transition-error-envelope.ts` | exact |
| `src/protocol/foundation/reason-codes.ts` (auth vs execution-control codes) | model | transform | `src/protocol/foundation/reason-codes.ts` | exact |
| `src/protocol/foundation/reason-code-remediation/index.ts` | utility | transform | same file | exact |
| `test/architecture/service-agent-gating-boundary.test.ts` (new) | test | batch | `test/architecture/workflow-admission-boundary.test.ts` | role-match |
| `test/architecture/claim-boundary.test.ts` (dual enforcement claims) | test | batch | same file | exact |
| `test/architecture/host-trusted-binding-parity.test.ts` (extend parity rows) | test | batch | same file | exact |
| `src/adapters/http-transport-profile/` (new hybrid layer) | service | request-response | `src/adapters/auth-md/gateway.ts` + `action-proposal.ts` | role-match |
| `src/adapters/auth-md/*` (HTTP profile prototype docs/tests) | adapter | request-response | `src/adapters/auth-md/gateway.ts` | exact |
| `src/adapters/x402-payment/*` (runnable wedge reference) | adapter | request-response | `src/adapters/x402-payment/wallet-gateway.ts` | exact |
| `src/adapters/package-install/*` (proof-gap stub only) | adapter | request-response | `src/adapters/package-install/gateway.ts` | exact |
| `src/cli/quickstart/agent-gating.ts` or extend `quickstart/x402.ts` | hook | batch | `src/cli/quickstart/x402.ts` | role-match |
| `src/cli/simulate/agent-gating.ts` or extend simulate | hook | request-response | `src/cli/simulate/x402-payment.ts` | exact |
| `src/cli/host/doctor.ts` (attestation framing) | hook | request-response | same file | exact |
| `src/cli/command-manifest.ts` (new commands) | config | transform | same file | exact |
| `src/install/install-proposal/index.ts` | model | CRUD | same file | exact |
| `src/adapters/*/install-proposal.ts` (per-family atomic install) | service | batch | `src/adapters/x402-payment/install-proposal.ts` | exact |
| `src/protocol/navigation/index.ts` (Tier-1 integrator subset) | config | transform | same file | exact |
| `src/surfaces/service-workflow-admission/index.ts` (agent projections) | service | event-driven | same file | exact |
| `src/surfaces/service-agent-acceptance.ts` (new matrix, optional) | service | transform | `src/surfaces/x402-protected-tool-acceptance.ts` | role-match |
| `src/sdk/recipe/` or `cli/quickstart/` recipe sequencer | utility | batch | `src/cli/quickstart/x402.ts` + role clients | partial |
| `src/sdk/surface-clients/*.ts` (Tier-1 recipe consumers) | service | request-response | `src/sdk/surface-clients/` | exact |
| `examples/service-workflow-admission/run.ts` (agent golden path) | hook | batch | same file | exact |
| `examples/agent-gating-x402/` (new runnable spine, optional) | hook | batch | `examples/service-workflow-admission/run.ts` | role-match |
| Conformance-gated service scaffold (new) | test | batch | `test/architecture/workflow-admission-boundary.test.ts` repo walk | partial |

---

## Pattern Assignments

### `docs/internal/service-workflow-story.md` — dual-lane agent extension (config, transform)

**Analog:** `docs/internal/service-workflow-story.md`

**Plain-flow + mapping table pattern** (lines 7–25):

```markdown
## Plain Flow

```text
Agent shows Passport
-> Service returns ServiceWorkflowAdmission
-> Agent carries ServiceWorkflowHandle
-> Agent requests Clearance for one protected action
-> Handshake records Outcome
```

| Plain word               | Meaning                                                                                    | Not allowed to mean                                                                                                   |
| ------------------------ | ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| Passport                 | Evidence package the agent presents.                                                       | Identity, trust, permission, spend approval, signer access, or reusable auth.                                         |
```

**Non-authority flag block** (lines 44–53) — copy verbatim structure for every new projection:

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

**Protected action boundary** (lines 87–104) — use for dual enforcement (admission ≠ gateway):

```text
Every consequential event still needs:

CandidateAction
-> ActionContract
-> PolicyDecision
-> one-use Greenlight or Refusal
-> GatewayCheck before mutation
-> Receipt / Refusal / ReplayRefusal / ProofGap / AuthorityCertificate

If the gateway cannot enforce the exact greenlight before consequence, the path
is advisory, not Handshake.
```

**Phase 04 addition pattern:** Add a parallel **agent lane** section mapping product vocabulary (Standing Bounds → Delegated Mandate → Compile → Work Order → Clearance → Outcome) to schema-native names without renaming exports.

---

### `docs/internal/protocol-layman.md` — product vocabulary (config, transform)

**Analog:** `docs/internal/protocol-layman.md`

**Service workflow surface intro** (lines 32–69):

```markdown
## The Service Workflow Surface

The simple service-facing story is:

```text
Show Passport
-> ServiceWorkflowAdmission
-> ServiceWorkflowHandle
-> Request Clearance
-> Read Outcome
```

That story hides protocol detail from the user. It does not hide authority.
```

**Work order forcing pattern** (lines 104–130):

```markdown
Handshake forces the agent to produce the exact work order:

```text
action: x402_payment.exact
...
```

That exact work order is the action contract.
```

**Gate enforcement prose** (lines 149–163):

```markdown
If the gateway cannot block the change, Handshake can observe or record, but it
cannot protect that path.
```

Copy this section shape when documenting **any-service** agent gating: plain chain first, then explicit “does not mean permission” bullets, then gateway-as-enforcement-point.

---

### `docs/internal/decisions.md` — custody matrix & dual enforcement (config, transform)

**Analog:** `docs/internal/decisions.md`

**Role-scoped client definition** (lines 48–54 area):

```markdown
- `role-scoped protocol transition client`: an SDK or HTTP client that transports a specific kernel transition under custody. It is not a product authority surface and does not make product nouns authoritative.
```

**Production acceptance matrix pattern** (lines 1063–1122):

```text
package install
-> init / doctor
-> install x402-payment
-> local probes
-> register x402 gateway readiness
-> install health
-> host profile generation
-> protected tool proposal
-> policy decision
-> gateway check before signer use
-> redacted readback/support evidence
```

Each `InstallClient` / `PolicyClient` / `GatewayClient` paragraph names **what the client may transport** and a hard **cannot** list. Phase 04 should extend with **configured-by** columns (service operator vs host operator) using the same row structure as `x402ProtectedToolAcceptanceMatrix` fields: `surfaceOwner`, `authorityPosture`, `proofGaps`, `stopCondition`.

---

### `docs/internal/host-golden-paths-and-trace-guidance.md` — bilateral runbooks (config, transform)

**Analog:** `docs/internal/host-golden-paths-and-trace-guidance.md`

**Golden path rule** (lines 7–26):

```text
host tool config
-> Handshake MCP proposal tool
-> exact x402 proposal input
-> local readiness/proposal projection
-> redacted evidence/readback
```

**Non-claims list** (lines 19–26):

```markdown
- no live host config mutation by Handshake;
- no native host behavior certification;
- no host-wide containment;
...
```

**Doctor command posture** (lines 38–42):

```bash
handshake host doctor --host codex
handshake mcp doctor --stdio
handshake state inspect --cwd .
```

Extend with paired **service-operator** setup order (catalog triplet → gateway registry → policy pack) mirroring host sections per host alias.

---

### `src/http/errors/transition-error-envelope.ts` — public failure taxonomy (middleware, request-response)

**Analog:** `src/http/errors/transition-error-envelope.ts`

**Schema extension point** (lines 32–45):

```typescript
export const TransitionErrorEnvelopeSchema = z.strictObject({
  code: z.string(),
  message: z.string(),
  transitionName: z.string().nullable(),
  callerCustodyRole: z.enum(["control_plane", "runtime_evidence", "gateway_custody", "review_custody"]).nullable(),
  retryability: TransitionErrorRetryabilitySchema,
  commitState: TransitionCommitStateSchema,
  requestIdentity: z.string().nullable(),
  proofRef: z.string().nullable(),
  refusalRef: z.string().nullable(),
  docUrl: z.string().url().nullable().optional(),
  remediation: ReasonCodeRemediationSchema.optional(),
  issues: z.array(JsonValueSchema).optional(),
});
```

**Classification + HTTP status** (lines 65–84, 102–131):

```typescript
export function transitionErrorResult(error: unknown, context: TransitionErrorContext = {}): TransitionErrorResult {
  const classification = classifyTransitionError(error);
  const body = TransitionErrorResponseSchema.parse({
    error: {
      code: classification.code,
      ...
      remediation: classification.remediation,
    },
  });
  return { body, status: classification.status };
}

if (error instanceof HandshakeProtocolError) {
  return {
    code: error.code,
    message: error.message,
    status: error.status,
    ...
    remediation: remediationForReasonCode(error.code),
  };
}
```

**Phase 04 pattern:** Add `failureClass` (`auth` | `hosted_admission` | `protected_action_refusal` | `proof_gap` | `replay_refusal` | `stale_admission`) and `phase` to the schema; map in `classifyTransitionError` with **401/403** only for credential/identity, **409** for refusals/replay/stale binding, **422** for proof gaps (D-17–D-19). Wire RFC 9457 `type` URI into `docUrl` or a new optional field alongside existing `remediation.docsUrl`.

---

### `src/protocol/foundation/reason-code-remediation/index.ts` — remediation on failures (utility, transform)

**Analog:** `src/protocol/foundation/reason-code-remediation/index.ts`

**Exact remediation registry** (lines 50–62, 69–82):

```typescript
export const ReasonCodeRemediationSchema = z.strictObject({
  code: z.string().min(1),
  summary: z.string().min(1),
  ownerSurface: ReasonCodeRemediationOwnerSurfaceSchema,
  supportSeverity: ReasonCodeRemediationSupportSeveritySchema,
  safeRetry: ReasonCodeRemediationSafeRetrySchema,
  nextMechanism: ReasonCodeRemediationNextMechanismSchema,
  nextCommand: z.string().min(1).nullable(),
  docsUrl: z.string().url(),
  requiresNewContract: z.boolean(),
  parameterRepair: z.string().min(1).nullable(),
  forbiddenActions: z.array(z.string().min(1)).default([]),
});

const exactRemediations = new Map<string, RemediationInput>([
  [
    "cli_command_unsupported",
    {
      summary: "The CLI command is not part of the active Handshake command manifest.",
      ownerSurface: "cli",
      ...
      forbiddenActions: ["do_not_infer_hidden_cli_mutation_commands"],
    },
  ],
```

**Lookup chain** (lines 367–385):

```typescript
export function remediationForReasonCode(code: string): ReasonCodeRemediation {
  const exact = exactRemediations.get(code);
  if (exact) return parseRemediation(code, exact);
  const registered = protocolReasonCodes.find((entry) => entry.code === code);
  if (registered) return parseRemediation(code, genericProtocolRemediation(registered));
  const prefixed = protocolReasonCodePrefixes.find((entry) => code.startsWith(entry.prefix));
  ...
}
```

Add exact entries for new auth vs execution-control reason codes; set `requiresNewContract: true` and `forbiddenActions` for replay/stale admission cases.

---

### `test/architecture/workflow-admission-boundary.test.ts` — admission non-authority (test, batch)

**Analog:** `test/architecture/workflow-admission-boundary.test.ts`

**Schema boundary assertion** (lines 46–57):

```typescript
it("defines admission and handle as explicit non-authority surfaces", () => {
  const admission = ServiceWorkflowAdmissionSchema.parse(validAdmission());

  expect(admission.authorityBoundary).toEqual(serviceWorkflowNonAuthorityBoundary());
  expect(admission.nextActionRequirement).toBe("fresh_action_contract_required");
  expect(admission.clearanceBoundary).toBe("fresh_action_contract_required_for_each_protected_action");
});
```

**Forbidden authority field rejection** (lines 89–99):

```typescript
for (const authorityField of [
  "policyDecisionRef",
  "greenlightRef",
  "gatewayCheckRef",
  ...
]) {
  expect(ServiceWorkflowContextRefsSchema.safeParse({ ...contextRefs, [authorityField]: "x" }).success).toBe(false);
}
```

**Repo walk — keep nouns out of authority roots** (lines 284–298):

```typescript
it("keeps workflow admission nouns out of authority-bearing source roots", () => {
  const violations: string[] = [];
  for (const root of forbiddenAuthorityRoots) {
    for (const file of walkTs(root)) {
      const text = readFileSync(file, "utf8");
      for (const name of workflowSurfaceNames) {
        if (text.includes(name)) violations.push(`${relative(process.cwd(), file)} mentions ${name}`);
      }
    }
  }
  expect(violations.sort()).toEqual([]);
});
```

**Phase 04 bypass test pattern:** Clone the repo-walk helper (`walkTs`, `forbiddenAuthorityRoots`) to assert every consequential HTTP route in a **conformance scaffold** imports an adapter `run*Gateway` (D-24), not middleware-only auth.

---

### `test/architecture/claim-boundary.test.ts` — doc/export claim matrix (test, batch)

**Analog:** `test/architecture/claim-boundary.test.ts`

**Claim matrix helper** (lines 17–45):

```typescript
type ClaimMatrixEntry = {
  label: string;
  sources: ClaimSource[];
  required?: string[];
  requiredPatterns?: RegExp[];
  forbiddenPatterns?: RegExp[];
};

function expectClaimMatrix(entries: ClaimMatrixEntry[]) {
  for (const entry of entries) {
    for (const source of entry.sources) {
      for (const phrase of entry.required ?? []) {
        expect(normalizedSource).toContain(normalizeRequiredClaim(phrase));
      }
      for (const pattern of entry.forbiddenPatterns ?? []) {
        expect(source.text).not.toMatch(pattern);
      }
    }
  }
}
```

**Export boundary check** (lines 48–91):

```typescript
it("keeps public entrypoints separated by authority boundary", async () => {
  const root = await import("../../src");
  ...
  expect(Object.keys(root)).not.toContain("proposeRuntimeIngressActionContracts");
  expect(adapterSdkExportNames.join(" ")).not.toMatch(
    /GatewayCheck|Greenlight|Mutation|PolicyDecision|ReceiptExport/,
  );
});
```

Add entries requiring dual enforcement language (“admission alone is not Handshake”, “gateway check before mutation”) in agent-facing docs; forbid “ingress equals protection” patterns.

---

### `test/architecture/host-trusted-binding-parity.test.ts` — cross-surface parity (test, batch)

**Analog:** `test/architecture/host-trusted-binding-parity.test.ts`

**Parity row table** (lines 17–59):

```typescript
const parityRows = [
  {
    name: "complete binding",
    input: completeBinding,
    expectedReasonCodes: [] as string[],
  },
  {
    name: "readiness missing",
    input: { ... },
    expectedReasonCodes: ["mcp_trusted_readiness_binding_missing"],
  },
  ...
] as const;
```

**Classifier + MCP agreement** (lines 100–118):

```typescript
for (const row of parityRows) {
  it(`classifier, MCP, and runtime agree for ${row.name}`, async () => {
    const classifier = classifyHostTrustedProposalBinding(row.input);
    expect(sorted(classifier.reasonCodes)).toEqual(sorted(row.expectedReasonCodes));
    const mcpResult = await proposeMcpX402Payment(validProposalInput(), { ...row.input });
    ...
  });
}
```

Use the same row-driven pattern when adding service-side admission vs gateway reason-code parity for agent gating failures.

---

### `src/adapters/auth-md/gateway.ts` — HTTP profile / family adapter gateway (adapter, request-response)

**Analog:** `src/adapters/auth-md/gateway.ts` (also `package-install/gateway.ts` for slimmer variant)

**Outcome union + protocol injection** (lines 75–117, 119–136):

```typescript
export type AuthMdProtectedApiCallGatewayResult =
  | { outcome: "gateway_check_refused"; gatewayCheck: GatewayCheckResult; ... }
  | { outcome: "gateway_check_not_authoritative"; ... }
  | { outcome: "protected_api_call_reconciled"; ... }
  | { outcome: "protected_api_call_proof_gap"; ... }
  | { outcome: "protected_api_call_failed"; ... };

export async function runAuthMdProtectedApiCallGateway(
  input: AuthMdProtectedApiCallGatewayInput,
): Promise<AuthMdProtectedApiCallGatewayResult> {
  const observedParameters = AuthMdProtectedApiCallParametersSchema.parse(input.observedParameters);
  const gatewayCheck = await input.protocol.gatewayCheck({ ... });

  const verifiedGate = verifiedGatewayCheckFromResult(gatewayCheck);
  if (!verifiedGate) {
    const outcome =
      gatewayCheck.gateAttempt.gateDecision === "refused" ? "gateway_check_refused" : "gateway_check_not_authoritative";
    return { outcome, gatewayCheck, ... };
  }
```

**Post-gate mutation + reconcile** (lines 160–195):

```typescript
const apiCallEvidence = AuthMdProtectedApiCallEvidenceSchema.parse(
  await input.surface.executeProtectedApiCall(command),
);
const { reconciliation } = await input.protocol.reconcileSurfaceOperation({
  mutationAttemptId: verifiedGate.mutationAttemptId,
  idempotencyKey: verifiedGate.idempotencyKey,
  observedSurfaceOperationRef: apiCallEvidence.surfaceOperationRef,
  ...
});
return { outcome: outcomeFor(apiCallEvidence.downstreamStatus), gatewayCheck, ... };
```

**HTTP transport profile:** Canonicalize method, path template, allowlisted headers, body digest in parameters schema (see `AuthMdProtectedApiCallParametersSchema` in `action-proposal.ts`); family adapters add semantic fields on top (D-10, D-11).

---

### `src/adapters/x402-payment/wallet-gateway.ts` — runnable wedge gateway (adapter, request-response)

**Analog:** `src/adapters/x402-payment/wallet-gateway.ts`

**Strict observed parameters** (lines 46–81):

```typescript
export const X402PaymentParametersSchema = z.strictObject({
  endpointUrl: z.string().url(),
  ...
  gatewayCredentialRefId: z.string().min(1),
  gatewayCredentialRefDigest: DigestSchema,
  gatewayReadinessRef: z.string().min(1),
  gatewayReadinessDigest: DigestSchema,
  policyVersionRef: z.string().min(1),
  policyVersionDigest: DigestSchema,
});
```

**Command carries verified gate only** (lines 84–91):

```typescript
export type X402PaymentSignatureCommand = {
  verifiedGate: VerifiedGatewayCheck;
  parameters: X402PaymentParameters;
  credentialResolutionEvidence: CredentialResolutionEvidence;
  ...
};
```

Phase 04 runnable golden path should stay on this adapter; do not generalize payment semantics into the HTTP profile layer.

---

### `src/adapters/package-install/gateway.ts` — proof-gap stub gateway (adapter, request-response)

**Analog:** `src/adapters/package-install/gateway.ts`

**Simpler gateway without credential resolution** (lines 100–117):

```typescript
export async function runPackageInstallGateway(
  input: PackageInstallGatewayInput,
): Promise<PackageInstallGatewayResult> {
  const gatewayCheck = await input.protocol.gatewayCheck({ ... });
  const verifiedGate = verifiedGatewayCheckFromResult(gatewayCheck);
  if (!verifiedGate) {
    const outcome =
      gatewayCheck.gateAttempt.gateDecision === "refused" ? "gateway_check_refused" : "gateway_check_not_authoritative";
    return { outcome, gatewayCheck, reconciliation: null, mutationEvidence: null };
  }
```

Use for **non-runnable** recipe stubs (D-14): transition map + schema + explicit proof-gap boundaries only.

---

### `src/adapters/*/adapter-pack.ts` — catalog triplet + bypass plan (service, batch)

**Analog:** `src/adapters/x402-payment/install-proposal.ts` (adapter pack) + `src/adapters/package-install/adapter-pack.ts`

**Adapter pack registration** (x402 lines 43–62):

```typescript
export const x402PaymentExactAdapterPack = ProtectedActionAdapterPackSchema.parse({
  adapterPackId: "adapter_pack_x402_payment_exact",
  actionFamily: "x402_payment.exact",
  protectedSurfaceKind: "x402_payment",
  parameterSchemaRef: "schema:x402-payment-exact-parameters:v1",
  ...
  bypassProbeKinds: requiredGatewayCheckedBypassProbeKinds satisfies BypassProbeKind[],
  hostileFixtureRefs: [ "fixture:x402:raw-private-key-env", ... ],
});
```

**Package-install pack** (`adapter-pack.ts` lines 19–41) shows second family with different `hostileFixtureRefs`.

**Atomic install compile** (install-proposal lines 133–149):

```typescript
export async function compileX402InstallProposal(inputValue: X402InstallProposalInput): Promise<X402InstallProposal> {
  const input = X402InstallProposalInputSchema.parse(inputValue);
  const refusalReasonCodes = refusalReasons(input, endpointDomain);
  ...
}
```

D-07/D-08: Service registers catalog triplet per endpoint family via `InstallProposal` with `compiledRecords` or refuses atomically — copy `compileX402InstallProposal` refusal-first compile pattern for new families.

---

### `src/adapters/auth-md/bypass-probes.ts` — structural bypass enforcement (service, batch)

**Analog:** `src/adapters/auth-md/bypass-probes.ts`

**Posture schema + probe specs** (lines 8–35):

```typescript
export const AuthMdProtectedApiCallBypassPostureSchema = z.strictObject({
  credentialCustodyStatus: z.enum(["gateway_held", "runtime_exposed", "fixture_gateway_held", "unknown"]),
  rawBearerPassthroughStatus: ReachabilityStatusSchema,
  directHttpCallStatus: ReachabilityStatusSchema,
  ...
});

const probeSpecs: AuthMdProbeSpec[] = [
  {
    probeKind: "credential_custody",
    evaluate(posture) {
      if (posture.credentialCustodyStatus === "gateway_held") {
        return { postureLabel: "prevented", evidenceDetails: ["credential_custody_gateway_held"] };
      }
      ...
    },
  },
```

Wire new HTTP-profile bypass probes into `InstallProposal.bypassProbePlan` the same way x402 hostile fixtures attach to adapter packs.

---

### `src/cli/quickstart/x402.ts` — recipe sequencer / golden path (hook, batch)

**Analog:** `src/cli/quickstart/x402.ts`

**Step envelope with explicit non-authority flags** (lines 23–35, 37–71):

```typescript
type QuickstartX402Step = {
  step: QuickstartX402StepId;
  command: string;
  ok: boolean;
  nextAction: CliNextAction;
  reasonCodes: readonly string[];
  evidenceRefs: readonly string[];
  authorityCreated: false;
  greenlightCreated: false;
  gatewayCheckPerformed: false;
  mutationAttempted: false;
  credentialMaterialIncluded: false;
};

type QuickstartX402Result = {
  schemaVersion: typeof QUICKSTART_X402_SCHEMA_VERSION;
  ...
  nonClaims: readonly string[];
};
```

**Orchestration:** Sequential CLI subcommand invocations (`demoX402Command`, `installX402PaymentCommand`, …) with dossier file writes. Phase 04 agent-first spine: catalog register → propose → policy → gateway → readback — keep the same literal `false` authority flags and `nonClaims` array (D-13, D-16).

---

### `src/cli/simulate/x402-payment.ts` — non-authority simulation (hook, request-response)

**Analog:** `src/cli/simulate/x402-payment.ts`

**Simulated runtime client + proposal only** (lines 29–76):

```typescript
export async function simulateX402PaymentCommand(input: { cwd: string; inputValue: unknown }) {
  const simulation = simulatedRuntimeClient();
  const proposal = await proposeMcpX402Payment(input.inputValue, {
    runtimeClient: simulation.client,
    installPosture: simulationInstallPosture(readiness),
    gatewayPosture: simulationGatewayPosture(readiness),
    ...
  });
  return cliOutput({
    command: "simulate x402-payment",
    plane: "operator",
    ok: outcome.outcome === "action_contract_proposed" && readiness.reasonCodes.length === 0,
    warnings: [
      "Simulation is a local readiness and proposal projection only.",
      "No durable protocol record, policy decision, greenlight, gateway check, ...",
    ],
    evidenceKind: "cli_diagnostic",
    ...
  });
}
```

Use for Tier-1 transition rehearsal without bundling “execute” APIs.

---

### `src/cli/host/doctor.ts` — host attestation evidence (hook, request-response)

**Analog:** `src/cli/host/doctor.ts`

**Attestation result shape** (lines 23–42):

```typescript
type HostDoctorResult = {
  schemaVersion: typeof HOST_DOCTOR_SCHEMA_VERSION;
  evidenceKind: "cli_diagnostic";
  ...
  liveHostVerificationStatus: "not_performed";
  localReadinessProofRequired: true;
  hostWideContainmentClaimed: false;
  authorityBoundary: typeof x402ProtectedToolHostProfileAuthorityBoundary;
  proofGaps: readonly string[];
  nextCommands: readonly string[];
  nonClaims: readonly string[];
};
```

Frame doctor output as **attestation evidence** for binding digests (D-23), not parallel identity — mirror `profileDescriptor` + `installGuide` with `configMutationPerformedByDoctor: false`.

---

### `src/cli/command-manifest.ts` — command registration (config, transform)

**Analog:** `src/cli/command-manifest.ts`

**Manifest entry shape** (lines 96–110, 187–211):

```typescript
{
  id: "doctor",
  aliases: ["doctor"],
  status: "active",
  plane: "operator",
  custodyRole: "none",
  ...
  agentSafe: true,
  redactionPosture: "manifest_only",
  nonGoals: sharedNonGoals,
},
{
  id: "quickstart.x402",
  aliases: ["quickstart x402"],
  ...
  agentSafe: false,
  nonGoals: [
    ...sharedNonGoals,
    "live x402 operation",
    "provider custody",
    ...
  ],
},
```

New agent-gating / recipe commands must declare `custodyRole`, `nonGoals`, and `agentSafe` explicitly; add `firstUseExamples` block at file bottom (lines 452+).

---

### `src/sdk/surface-clients/` — role-scoped clients (service, request-response)

**Analog:** `src/sdk/surface-clients/transport.ts`, `install-client.ts`, `policy-client.ts`, `gateway-client.ts`, `runtime-client.ts`, `control-plane-client.ts`

**Role-scoped transport** (transport.ts lines 15–29, 46–65):

```typescript
export type RoleScopedTransportRole = Extract<
  TransitionCallerRole,
  "control_plane" | "gateway_custody" | "review_custody" | "runtime_evidence"
>;

export class RoleScopedTransport {
  private async request<T>(method: "GET" | "POST", path: string, body?: unknown): Promise<T> {
    const headers: Record<string, string> = {
      [HANDSHAKE_PROTOCOL_VERSION_HEADER]: this.options.protocolVersion ?? PROTOCOL_VERSION,
      [HANDSHAKE_REQUEST_IDENTITY_HEADER]: this.nextRequestIdentity(),
      authorization: `Bearer ${this.options.roleCredential}`,
    };
    ...
    if (!response.ok) {
      throw new HandshakeClientError(response.status, await this.errorEnvelopeForResponse(response));
    }
```

**InstallClient — atomic catalog commit** (install-client.ts lines 17–29):

```typescript
export class InstallClient {
  constructor(baseUrl: string, options: InstallClientOptions, fetchImpl?: HandshakeFetch) {
    this.transport = new RoleScopedTransport(baseUrl, { ...options, role: "control_plane" }, fetchImpl);
  }

  async registerInstallProposalCompiledRecords(
    input: InstallProposal,
  ): Promise<InstallClientRegisterCompiledRecordsResult> {
    const proposal = InstallProposalSchema.parse(input);
    return this.transport.post("/v0.2/install-proposals/compiled-records", proposal);
  }
}
```

**PolicyClient — authority boundary on return type** (policy-client.ts lines 8–22):

```typescript
export type PolicyClientEvaluationResult = {
  decision: PolicyDecision;
  greenlight: Greenlight | null;
  authorityCreated: boolean;
  gatewayCheckPerformed: false;
  mutationAttempted: false;
  nextAction: "use_greenlight_at_gateway" | "read_evidence" | "request_review";
  ...
};
```

**GatewayClient — gateway custody only** (gateway-client.ts lines 40–65):

```typescript
export class GatewayClient {
  constructor(baseUrl: string, options: GatewayClientOptions, fetchImpl?: HandshakeFetch) {
    this.transport = new RoleScopedTransport(baseUrl, { ...options, role: "gateway_custody" }, fetchImpl);
  }
  gatewayCheck(input: GatewayCheckInput): Promise<GatewayClientCheckResult> {
    return this.transport.post("/v0.2/gateway-check-attempts", input);
  }
}
```

**ControlPlaneClient — delegated mandate** (control-plane-client.ts lines 11–26):

```typescript
export class ControlPlaneClient {
  registerDelegatedAuthorityRef(input: RegisterDelegatedAuthorityRefInput): Promise<DelegatedAuthorityRef> {
    return this.transport.post("/v0.2/delegated-authority-refs", input);
  }
  transitionDelegatedAuthorityStatus(input: TransitionDelegatedAuthorityStatusInput): Promise<DelegatedAuthorityStatusTransition> {
    return this.transport.post("/v0.2/delegated-authority-status-transitions", input);
  }
}
```

Recipe sequencer (D-16) must compose these clients in order without adding a bundled execute API; parse errors via `HandshakeClientError` + `TransitionErrorEnvelope`.

---

### `src/protocol/navigation/index.ts` — Tier-1 transition subset (config, transform)

**Analog:** `src/protocol/navigation/index.ts`

**Catalog + atomic install entries** (lines 124–146):

```typescript
export const protocolNavigation = [
  catalogEntry("registerToolCapability", "tool_capability"),
  catalogEntry("registerActionType", "action_type"),
  catalogEntry("registerGatewayRegistryEntry", "gateway_registry_entry"),
  catalogEntry("registerOperatingEnvelope", "operating_envelope"),
  {
    transitionId: "registerInstallProposalCompiledRecords",
    kernelMethod: "registerInstallProposalCompiledRecords",
    phase: "install_setup",
    authorityBoundary: "install setup evidence only",
    evidenceObligation:
      "atomically register compiled setup records or refusal without issuing policy, greenlight, gate, credential, mutation, receipt, or certificate authority",
  },
  {
    transitionId: "compileIntent",
    ...
    authorityBoundary: "candidate evidence only",
  },
```

Tag Tier-1 integrator transitions (`compileIntent`, `proposeActionContract`, `evaluatePolicy`, `gatewayCheck`, readback routes) with a `tier: "integrator"` or document subset — do not remove full matrix entries (D-15).

---

### `src/surfaces/service-workflow-admission/index.ts` — agent lane projections (service, event-driven)

**Analog:** `src/surfaces/service-workflow-admission/index.ts`

**Authority boundary schema** (lines 25–54):

```typescript
export const ServiceWorkflowAuthorityBoundarySchema = ProofPacketNonAuthorityBoundarySchema.extend({
  permitsMutation: z.literal(false),
  exportsReceipt: z.literal(false),
  mintsTerminalCertificate: z.literal(false),
  ...
  freshActionContractRequired: z.literal(true),
});

export const serviceWorkflowAuthorityBoundary = {
  createsAuthority: false,
  ...
  freshActionContractRequired: true,
} as const satisfies ServiceWorkflowAuthorityBoundary;
```

**PrincipalAgentLink — scoped evidence** (lines 66–99):

```typescript
export const PrincipalAgentLinkSchema = z.strictObject({
  ...
  allowedUse: z.literal("scoped_evidence_for_envelope_setup_and_readback_only"),
});
```

Extend projections for Standing Bounds / Delegated Mandate **readback only** — map to `OperatingEnvelope` / `DelegatedAuthorityRef` without schema renames (D-01–D-05).

---

### `src/surfaces/x402-protected-tool-acceptance.ts` — production acceptance matrix (service, transform)

**Analog:** `src/surfaces/x402-protected-tool-acceptance.ts`

**Matrix row shape** (lines 15–27, 49–63):

```typescript
export type X402ProtectedToolAcceptanceStep = {
  readonly id: string;
  readonly label: string;
  readonly surfaceOwner: string;
  readonly authorityPosture: X402ProtectedToolAcceptanceAuthorityPosture;
  readonly inputEvidence: readonly string[];
  readonly outputRecord: string;
  readonly requiredNonAuthorityFlags: readonly string[];
  readonly bypassPosture: string;
  readonly proofGaps: readonly string[];
  readonly validationGate: string;
  readonly stopCondition: string;
};

export const x402ProtectedToolAcceptanceMatrix = [
  {
    id: "package_install",
    label: "Install published package",
    surfaceOwner: "package.json, server.json, bin, package surface checks",
    authorityPosture: "distribution_only",
    ...
  },
```

Copy for **service-agent** acceptance rows with **configured-by** (`service_operator` | `host_operator`) in `surfaceOwner` or new field; keep `commonSurfaceNonAuthorityFlags` (lines 29–39).

---

### `examples/service-workflow-admission/run.ts` — runnable dual-lane example (hook, batch)

**Analog:** `examples/service-workflow-admission/run.ts`

**Hosted admission + non-authority boundary** (lines 23–26, 28–76):

```typescript
const authorityBoundary = serviceWorkflowNonAuthorityBoundary();

const hostedVerifier = createHostedCallerVerifierFromAdapter(
  { providerKind: "oauth_oidc", async verify() { return { ... rawIdentityMaterialPersisted: false, ... }; } },
  { allowedProviderKinds: ["clerk", "oauth_oidc"], requireActiveOrganization: true },
);
const hostedCallerIdentity = await hostedVerifier.verify({ ... requiredRole: "runtime_evidence", ... });
```

**Output artifacts:** writes `latest.json` / `latest.md` under example output dir with explicit `authorityBoundary` on every record. Agent golden path example should chain: hosted admission → workflow handle → x402 proposal readback cross-ref (`x402OutputPath` pattern line 22).

---

## Shared Patterns

### Non-authority boundary object

**Source:** `src/surfaces/service-workflow-admission/index.ts` (`serviceWorkflowAuthorityBoundary`)  
**Apply to:** All agent-lane docs, CLI outputs, projections, recipe sequencer steps

```typescript
export const serviceWorkflowAuthorityBoundary = {
  createsAuthority: false,
  createsPolicyDecision: false,
  createsGreenlight: false,
  performsGatewayCheck: false,
  performsMutation: false,
  permitsMutation: false,
  exportsReceipt: false,
  mintsTerminalCertificate: false,
  freshActionContractRequired: true,
} as const;
```

### Gateway-before-mutation adapter spine

**Source:** `src/adapters/auth-md/gateway.ts` (`runAuthMdProtectedApiCallGateway`)  
**Apply to:** All family adapters and HTTP transport profile wrappers

```typescript
const gatewayCheck = await input.protocol.gatewayCheck({ actionContractId, greenlightId, observedParameters, surfaceOperationRef });
const verifiedGate = verifiedGatewayCheckFromResult(gatewayCheck);
if (!verifiedGate) {
  return { outcome: gatewayCheck.gateAttempt.gateDecision === "refused" ? "gateway_check_refused" : "gateway_check_not_authoritative", ... };
}
// only after verifiedGate: surface mutation + reconcileSurfaceOperation
```

### Role-scoped SDK custody

**Source:** `src/sdk/surface-clients/transport.ts`  
**Apply to:** All Tier-1 recipe steps — one credential role per client, no cross-role bundling

```typescript
this.transport = new RoleScopedTransport(baseUrl, { ...options, role: "control_plane" }, fetchImpl);
// PolicyClient / InstallClient / ControlPlaneClient → control_plane
// RuntimeClient → runtime_evidence
// GatewayClient → gateway_custody
```

### Architecture test repo walk

**Source:** `test/architecture/workflow-admission-boundary.test.ts` (`walkTs`, forbidden roots)  
**Apply to:** Bypass enforcement (D-24), claim-boundary doc tests, scaffold conformance

```typescript
for (const root of forbiddenAuthorityRoots) {
  for (const file of walkTs(root)) {
    const text = readFileSync(file, "utf8");
    // assert invariant
  }
}
expect(violations.sort()).toEqual([]);
```

### CLI diagnostic output envelope

**Source:** `src/cli/output.ts` (via quickstart/simulate)  
**Apply to:** doctor, simulate, quickstart, recipe sequencer

```typescript
return cliOutput({
  command: "...",
  plane: "operator",
  ok: boolean,
  reasonCodes: [...],
  evidenceKind: "cli_diagnostic",
  warnings: ["... non-authority ..."],
  result: { authorityCreated: false, greenlightCreated: false, gatewayCheckPerformed: false, ... },
});
```

---

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `src/adapters/http-transport-profile/` (shared REST canonicalizer) | service | transform | No standalone generic HTTP profile module yet; auth-md is closest family prototype (D-10) |
| Conformance-gated **service scaffold** (every route adapter-wrapped) | test | batch | Bypass tests exist per adapter (`bypass-probes.ts`) but no generic service route inventory scaffold |
| `src/sdk/recipe/` unified sequencer | utility | batch | x402 quickstart orchestrates CLI only; no SDK-level multi-client recipe module |
| RFC 9457 Problem Details HTTP mapper | middleware | request-response | `transition-error-envelope` has remediation URLs; no separate `application/problem+json` handler yet |
| Product doc export aliases (`StandingBounds`, `DelegatedMandate`) | config | transform | Explicitly deferred in CONTEXT (schema names unchanged) |

---

## Metadata

**Analog search scope:** `docs/internal/`, `src/adapters/`, `src/cli/`, `src/sdk/surface-clients/`, `src/http/errors/`, `src/protocol/foundation/`, `src/protocol/navigation/`, `src/surfaces/`, `src/install/`, `test/architecture/`, `examples/service-workflow-admission/`  
**Files scanned:** ~45  
**Pattern extraction date:** 2026-05-28
