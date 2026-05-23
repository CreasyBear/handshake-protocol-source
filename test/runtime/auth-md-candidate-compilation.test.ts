import { describe, expect, it } from "bun:test";
import { authMdProtectedResourceRef } from "../../src/adapters/auth-md";
import { proposeRuntimeIngressActionContracts, runtimeIngressDispatchNodeId } from "../../src/runtime";
import {
  authMdProtectedResource,
  authMdRawCredential,
  authMdRuntimeConfig,
  authMdRuntimeDispatch,
  expectNoRuntimeAuthorityRecords,
  installedAuthMdKernel,
  recordCount,
} from "../support/auth-md-flow";

describe("auth.md runtime candidate compilation", () => {
  it("compiles a catalog-matching auth.md service mutation into a CandidateAction without authority", async () => {
    const fixture = await installedAuthMdKernel();

    const result = await proposeRuntimeIngressActionContracts(
      fixture.kernel,
      { authMdProtectedApiCall: authMdRuntimeConfig(fixture) },
      {
        principalIntentRef: "intent:deploy preview through auth.md credential",
        generatedCodeOrSpecRef: "runtime:auth-md-dispatch-block",
        dispatchBoundaryRef: "dispatch-boundary:auth-md-wrapper",
        dispatches: [authMdRuntimeDispatch(fixture, "dispatch:auth-md:1")],
      },
    );

    expect(result.outcome).toBe("action_contracts_proposed");
    expect(result.responsePosture).toMatchObject({
      authorityCreated: false,
      greenlightCreated: false,
      gatewayCheckPerformed: false,
      mutationAttempted: false,
      nextAction: "read_evidence",
      reasonCodes: [],
      graphCoverageStatus: "fully_covered_no_unsupported_nodes",
    });
    expect(result.generatedExecutionGraph.supportedGrammarVersion).toBe(
      "runtime-dispatch-auth-md-protected-api-call-0.1",
    );
    expect(result.generatedExecutionGraph.nodes[0]?.nodeId).toBe(runtimeIngressDispatchNodeId(1));
    const proposal = result.proposals[0];
    if (!proposal || proposal.outcome !== "action_contract_proposed") throw new Error("expected contract proposal");
    expect(proposal.intentCompilation.candidateAction.candidateStatus).toBe("contractable");
    expect(proposal.actionContract.actionClass).toBe("auth_md_protected_api_call.exact");
    expect(proposal.actionContract.resourceRef).toBe(authMdProtectedResourceRef(authMdProtectedResource));
    expect(proposal.actionContract.parameters).toMatchObject({
      profile: "auth_md_protected_api_call.exact.v0",
      targetHttpMethod: "POST",
      endpointUrl: `${authMdProtectedResource}/deployments`,
      pathTemplate: "/deployments",
      requiredScopes: ["deploy.preview"],
      metadataCachePosture: "fresh",
      gatewayCredentialRefPosture: "fresh",
      idempotencyMaterialRefPresent: true,
      rawAuthorizationHeaderObserved: false,
      dynamicEndpointConstructionObserved: false,
      dynamicHostConstructionObserved: false,
      retryAuthorityReuseDetected: false,
    });
    expect(proposal.actionContract.gatewayCredentialRefs[0]).toMatchObject({
      gatewayCredentialRefId: fixture.credentialRef.gatewayCredentialRefId,
      gatewayCredentialRefDigest: fixture.credentialRef.gatewayCredentialRefDigest,
      requiredCredentialCustodyStatus: "gateway_held",
    });
    expect(result.responsePosture.evidenceRefs).toEqual(
      expect.arrayContaining([
        `evidence:auth-md-discovery:${fixture.discovery.protectedResourceMetadataDigest.slice(
          "sha256:".length,
          "sha256:".length + 16,
        )}`,
        `evidence:auth-md-authorization-server:${fixture.discovery.authorizationServerMetadataDigest.slice(
          "sha256:".length,
          "sha256:".length + 16,
        )}`,
      ]),
    );
    expect(JSON.stringify(result)).not.toContain(authMdRawCredential);
    expect(await recordCount(fixture.store, "action_contract")).toBe(1);
    await expectNoRuntimeAuthorityRecords(fixture.store);
  });

  it("refuses unsafe generated auth.md shapes before policy, greenlight, gateway, or credential resolution", async () => {
    const fixture = await installedAuthMdKernel();

    const result = await proposeRuntimeIngressActionContracts(
      fixture.kernel,
      { authMdProtectedApiCall: authMdRuntimeConfig(fixture) },
      {
        principalIntentRef: "intent:deploy through unsafe auth.md generated client",
        generatedCodeOrSpecRef: "runtime:auth-md-dispatch-block-unsafe",
        dispatchBoundaryRef: "dispatch-boundary:auth-md-unsafe",
        dispatches: [
          authMdRuntimeDispatch(fixture, "dispatch:auth-md:unsafe", {
            dynamicToolConstructionDetected: true,
            lateBoundParameterRefs: ["expr:auth-md-host", "expr:bearer-header"],
            requiredScopes: ["*"],
            rawAuthorizationHeaderObserved: true,
            dynamicHostConstructionObserved: true,
            metadataCachePosture: "stale",
            gatewayCredentialRefPosture: "revoked",
            idempotencyMaterialRef: null,
            retryAuthorityReuseDetected: true,
          }),
        ],
      },
    );

    expect(result.outcome).toBe("one_or_more_dispatches_refused");
    expect(result.responsePosture).toMatchObject({
      authorityCreated: false,
      gatewayCheckPerformed: false,
      mutationAttempted: false,
      actionContractRefs: [],
      graphCoverageStatus: "unsupported_or_ambiguous",
    });
    expect(result.runtimeExecution.refusalReasonCodes).toEqual(
      expect.arrayContaining([
        "auth_md_dynamic_host_refused",
        "auth_md_idempotency_material_missing",
        "auth_md_raw_authorization_header_refused",
        "auth_md_retry_authority_reuse_refused",
        "auth_md_stale_credential_ref_refused",
        "auth_md_stale_metadata_refused",
        "auth_md_wildcard_scope_refused",
      ]),
    );
    expect(result.generatedExecutionGraph.terminalReasonCodes).toEqual(
      expect.arrayContaining(["auth_md_wildcard_scope_refused", "generated_execution_node_ambiguous"]),
    );
    const proposal = result.proposals[0];
    if (!proposal || proposal.outcome !== "intent_compilation_refused") throw new Error("expected refusal");
    expect(proposal.refusalReasonCodes).toEqual(
      expect.arrayContaining([
        "runtime_dynamic_tool_construction_detected",
        "runtime_unobserved_regions_present",
        "runtime_auth_md_wildcard_scope_refused",
        "runtime_auth_md_stale_metadata_refused",
        "runtime_auth_md_stale_credential_ref_refused",
        "runtime_auth_md_idempotency_material_missing",
        "runtime_auth_md_retry_authority_reuse_refused",
        "generated_execution_graph_not_contractable",
        "generated_execution_node_not_contractable",
      ]),
    );
    expect(proposal.intentCompilation.candidateAction.candidateStatus).toBe("rejected");
    expect(await recordCount(fixture.store, "action_contract")).toBe(0);
    expect(await recordCount(fixture.store, "refusal")).toBe(1);
    await expectNoRuntimeAuthorityRecords(fixture.store);
  });

  it("records raw auth.md sibling API calls as bypass evidence instead of a gateway posture", async () => {
    const fixture = await installedAuthMdKernel();

    const result = await proposeRuntimeIngressActionContracts(
      fixture.kernel,
      { authMdProtectedApiCall: authMdRuntimeConfig(fixture) },
      {
        principalIntentRef: "intent:call auth.md protected service outside gateway",
        generatedCodeOrSpecRef: "runtime:auth-md-dispatch-block-raw",
        dispatchBoundaryRef: "dispatch-boundary:auth-md-raw",
        dispatches: [
          authMdRuntimeDispatch(fixture, "dispatch:auth-md:raw", {
            dispatchKind: "raw_sibling_auth_md_protected_api_call",
            rawCommandRef: "mcp:authmd.directApiCall",
            rawCommandSummary: ["mcp.invoke", "authmd.directApiCall", "POST", `${authMdProtectedResource}/deployments`],
          }),
        ],
      },
    );

    expect(result.outcome).toBe("one_or_more_dispatches_refused");
    expect(result.responsePosture.nextAction).toBe("stop");
    expect(result.generatedExecutionGraph.coverageStatus).toBe("contains_bypass_risk");
    expect(result.generatedExecutionGraph.terminalReasonCodes).toContain("runtime_ingress_raw_sibling_bypass");
    expect(result.generatedExecutionGraph.nodes[0]?.commandRiskBypassRefs).toContain("mcp:authmd.directApiCall");
    const proposal = result.proposals[0];
    if (!proposal || proposal.outcome !== "intent_compilation_refused") throw new Error("expected refusal");
    expect(proposal.refusalReasonCodes).toContain("generated_execution_graph_not_contractable");
    expect(await recordCount(fixture.store, "action_contract")).toBe(0);
    await expectNoRuntimeAuthorityRecords(fixture.store);
  });

  it("turns missing auth.md graph coverage into refusal rather than best-effort authority", async () => {
    const fixture = await installedAuthMdKernel();

    const result = await proposeRuntimeIngressActionContracts(
      fixture.kernel,
      { authMdProtectedApiCall: authMdRuntimeConfig(fixture) },
      {
        principalIntentRef: "intent:deploy from partial auth.md graph",
        generatedCodeOrSpecRef: "runtime:auth-md-dispatch-block-partial",
        dispatchBoundaryRef: "dispatch-boundary:auth-md-partial",
        truncationStatus: "truncated",
        dispatches: [authMdRuntimeDispatch(fixture, "dispatch:auth-md:partial")],
      },
    );

    expect(result.outcome).toBe("one_or_more_dispatches_refused");
    expect(result.generatedExecutionGraph.coverageStatus).toBe("contains_coverage_gap");
    expect(result.generatedExecutionGraph.terminalReasonCodes).toContain("generated_execution_graph_truncated");
    const proposal = result.proposals[0];
    if (!proposal || proposal.outcome !== "intent_compilation_refused") throw new Error("expected refusal");
    expect(proposal.refusalReasonCodes).toContain("generated_execution_graph_not_contractable");
    expect(await recordCount(fixture.store, "action_contract")).toBe(0);
    await expectNoRuntimeAuthorityRecords(fixture.store);
  });
});
