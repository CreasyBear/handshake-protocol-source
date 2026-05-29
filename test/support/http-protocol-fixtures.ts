import type { HostedAdmissionConfigInput } from "../../src/http/admission/hosted-admission-config";
import type { HostedCallerVerifier, TransitionCallerIdentity } from "../../src/http/admission/hosted-caller-identity";
import { HandshakeProtocolError } from "../../src/protocol/foundation/errors";
import type { GeneratedExecutionGraph } from "../../src/protocol/public/schemas";
import type { InMemoryProtocolStore } from "../../src/storage/memory";
import { futureIso, makeKernelFixture, registerFixtureObjects } from "./fixtures";

export const DIGEST_A = "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
export const DIGEST_B = "sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
export const DIGEST_C = "sha256:cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc";
export const DIGEST_D = "sha256:dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd";
export const DIGEST_E = "sha256:eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";

export function runtimeExecutionBody(fixture: ReturnType<typeof makeKernelFixture>) {
  return {
    tenantId: "tenant_demo",
    organizationId: "org_demo",
    principalIntentRef: "intent:http ambiguous commit",
    principalId: "principal_demo",
    agentId: "agent_demo",
    runId: "run_http_ambiguous",
    runtimeAdapterId: "runtime_codex",
    executionShape: "single_tool_call",
    runtimePosture: "protected_capability",
    executionBlockRef: "code:http-ambiguous",
    executionBlockDigest: DIGEST_A,
    generatedCodeOrSpecRefs: [],
    allowedToolCapabilityIds: [fixture.tool.toolCapabilityId],
    observedToolCallRefs: [],
    observedConsequentialCallCount: 1,
    loopDetected: false,
    retryDetected: false,
    branchDetected: false,
    dynamicToolConstructionDetected: false,
    unobservedRegionRefs: [],
    accessPosture: "isolated",
    uncertaintyMarkers: [],
    refusalReasonCodes: [],
    evidenceRefs: [],
  };
}

export function hostedIdentity(overrides: Partial<TransitionCallerIdentity> = {}): TransitionCallerIdentity {
  return {
    callerIdentityRef: "ref:hosted-caller-demo",
    callerSubjectDigest: DIGEST_B,
    tenantId: "tenant_demo",
    organizationId: "org_demo",
    projectId: "project_demo",
    workspaceId: null,
    custodyRoles: ["runtime_evidence"],
    hostedRoles: ["auditor"],
    hostedScopes: ["evidence:redacted:read", "hosted:readiness:read"],
    authProviderRef: "provider:test",
    authSessionDigest: DIGEST_C,
    serviceCredentialDigest: null,
    issuedAt: new Date(Date.now() - 60_000).toISOString(),
    expiresAt: futureIso(),
    revocationEpochRef: "revocation-epoch:test",
    claimsDigest: DIGEST_D,
    ...overrides,
  };
}

export function hostedAdmissionConfig(overrides: Partial<HostedAdmissionConfigInput> = {}): HostedAdmissionConfigInput {
  return {
    deploymentMode: "test",
    verifierStrategy: "local_test_verifier",
    maxIdentityAgeSeconds: 300,
    rolePolicy: {
      admittedTransitionRoles: ["control_plane", "runtime_evidence", "gateway_custody", "review_custody"],
    },
    readPolicy: {
      redactedEvidence: {
        allowedRoles: ["viewer", "auditor", "operator"],
        requiredScopes: ["evidence:redacted:read"],
      },
      rawEvidence: {
        allowedRoles: ["rawEvidenceReader"],
        requiredScopes: ["evidence:raw:request", "evidence:raw:read"],
      },
      readiness: {
        allowedRoles: ["operator", "auditor"],
        requiredScopes: ["hosted:readiness:read"],
      },
    },
    tenantSource: "verifier_claims",
    storage: {
      d1: { bindingName: "DB", required: false, authority: "structured_evidence" },
      kv: { bindingName: "CACHE", required: false, authority: "non_authoritative_cache" },
    },
    secretNames: ["HANDSHAKE_HOSTED_TEST_SECRET"],
    publicVarNames: ["HANDSHAKE_HOSTED_MODE"],
    rawReadPosture: "unavailable",
    redactionProfileRefs: ["hosted-redacted-evidence:v0.2"],
    retentionPosture: "declared_non_certified",
    exportPosture: "disabled",
    readinessExpectations: [
      "test mode requires explicit hostedAdmissionConfig; D1/KV presence is reported, not inferred",
    ],
    ...overrides,
  };
}

export function staticHostedVerifier(identity: TransitionCallerIdentity): HostedCallerVerifier {
  return {
    async verify() {
      return identity;
    },
  };
}

export function headerHostedVerifier(): HostedCallerVerifier {
  return {
    async verify({ headers }) {
      if (headers.get("x-hosted-test-subject") !== "caller_demo") {
        throw new HandshakeProtocolError(
          "hosted_caller_auth_required",
          "Hosted caller verifier did not receive server-side caller proof.",
          401,
          { retryability: "terminal", commitState: "not_started" },
        );
      }
      return hostedIdentity();
    },
  };
}

export async function createGeneratedGraphEvidenceFixture(): Promise<{
  graph: GeneratedExecutionGraph;
  store: InMemoryProtocolStore;
}> {
  const fixture = makeKernelFixture();
  const store = fixture.store as InMemoryProtocolStore;
  await registerFixtureObjects(fixture);
  const runtimeExecution = await fixture.kernel.createRuntimeExecution({
    ...runtimeExecutionBody(fixture),
    principalIntentRef: "intent:graph projection",
    executionShape: "codemode_block",
    runtimePosture: "protected_capability",
    executionBlockRef: "code:graph-projection",
    executionBlockDigest: DIGEST_A,
    generatedCodeOrSpecRefs: ["code:graph-projection"],
    accessPosture: "isolated",
    loopDetected: true,
    branchDetected: true,
  });
  const graph = await fixture.kernel.createGeneratedExecutionGraph(
    {
      runtimeExecutionId: runtimeExecution.runtimeExecutionId,
      graphNonce: "nonce_graph_projection",
      parserVersion: "parser:test",
      supportedGrammarVersion: "codemode-actions:test",
      catalogSnapshotDigest: DIGEST_C,
      gatewayRegistrySnapshotDigest: DIGEST_D,
      registryBindingSetDigest: DIGEST_E,
      entryNodeIds: ["node_install"],
      nodes: [
        {
          nodeId: "node_install",
          nodeKind: "codemode_action",
          classification: "candidate_action_eligible",
          actionClass: fixture.actionType.actionClass,
          toolCapabilityId: fixture.tool.toolCapabilityId,
          actionTypeId: fixture.actionType.actionTypeId,
          gatewayRegistryEntryId: fixture.gateway.gatewayRegistryEntryId,
          resourceRef: "npm:hono",
          paramsDigest: DIGEST_A,
          nodeGatewayBindingDigest: DIGEST_B,
          sourceSpanDigest: DIGEST_C,
          redactedArgvSummary: ["bun", "add", "hono"],
          argvDigest: DIGEST_D,
          argvRedactionStatus: "redacted",
          stdinDigest: null,
          stdinRedactionStatus: "redacted",
          envAllowlistDigest: DIGEST_E,
          rawSecretMaterialDetected: false,
          commandRiskClassifierRefs: [],
          commandRiskClassifierPosture: "absent",
          commandRiskRuleRefs: [],
          commandRiskBypassRefs: [],
          unsupportedReasonCodes: [],
        },
      ],
    },
    {
      tenantId: runtimeExecution.tenantId,
      organizationId: runtimeExecution.organizationId,
      principalIntentRef: runtimeExecution.principalIntentRef,
      principalId: runtimeExecution.principalId,
      agentId: runtimeExecution.agentId,
      runId: runtimeExecution.runId,
      runtimeAdapterId: runtimeExecution.runtimeAdapterId,
      graphIssuerRef: "runtime:codex",
      graphIssuerAuthority: "kernel_fixture",
      graphIssuedAt: new Date().toISOString(),
    },
  );
  return { graph, store };
}
