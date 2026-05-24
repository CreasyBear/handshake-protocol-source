import { describe, expect, it } from "bun:test";

describe("root package exports", () => {
  it("keeps the package root curated to stable public surfaces", async () => {
    const root = await import("../../src");
    const exportNames = Object.keys(root).sort();

    expect(exportNames).toEqual([
      "ActionAttemptAuthorityEffectSchema",
      "ActionAttemptLifecycleEntrySchema",
      "ActionAttemptLifecyclePhaseSchema",
      "ActionAttemptLifecycleStateSchema",
      "ActionAttemptTerminalOutcomeSchema",
      "ActionContractSchema",
      "ActionTypeSchema",
      "AgentTransactionEnvelopeProjectionSchema",
      "AuthorityCertificateArtifactKindSchema",
      "AuthorityCertificateArtifactSchema",
      "AuthorityCertificateConsumerBindingSchema",
      "AuthorityCertificateSchema",
      "AuthorityCertificateSignatureAlgorithmSchema",
      "AuthorityCertificateSignatureEntrySchema",
      "AuthorityCertificateSignerInputSchema",
      "AuthorityCertificateSignerRoleSchema",
      "AuthorityCertificateTerminalKindSchema",
      "AuthorityCertificateTerminalSchema",
      "AuthorityCertificateTrustKeySchema",
      "AuthorityCertificateTrustMaterialSchema",
      "AuthorityCertificateVerificationFailureCodeSchema",
      "AuthorityCertificateVerificationFailureSchema",
      "AuthorityCertificateVerificationPolicySchema",
      "AuthorityCertificateVersionSchema",
      "BreakerDecisionSchema",
      "BreakerIsolationDecisionSchema",
      "BypassProbeKindSchema",
      "BypassProbeOutcomeSchema",
      "BypassProbeSchema",
      "CandidateActionSchema",
      "CandidateActionStatusSchema",
      "ClearingEvidenceRefsSchema",
      "CommandRiskClassifierPostureSchema",
      "CompileIntentInputSchema",
      "ContractEvidenceProjectionSchema",
      "ContractStreamEventSchema",
      "CreateAuthorityCertificateInputSchema",
      "CreateBreakerDecisionInputSchema",
      "CreateBypassProbeInputSchema",
      "CreateGeneratedExecutionGraphInputSchema",
      "CreateIsolationInputSchema",
      "CreateProtectedPathPostureInputSchema",
      "CreateReceiptExportInputSchema",
      "CreateRecoveryRecommendationInputSchema",
      "CreateReviewArtifactInputSchema",
      "CreateReviewDecisionInputSchema",
      "CreateRuntimeExecutionInputSchema",
      "CreateToolCallDraftInputSchema",
      "CredentialCustodyStatusSchema",
      "CredentialResolutionEvidenceSchema",
      "CredentialResolutionRedactionStatusSchema",
      "CredentialResolutionResultClassSchema",
      "DigestSchema",
      "DownstreamDiagnosticsRedactionPostureSchema",
      "DownstreamOutcomeStatusSchema",
      "DownstreamRetryabilitySchema",
      "EvaluatePolicyInputSchema",
      "GateDecisionSchema",
      "GatewayAdmissionStatusSchema",
      "GatewayCheckAttemptSchema",
      "GatewayCheckInputSchema",
      "GatewayCredentialBindingSchema",
      "GatewayCredentialRefSchema",
      "GatewayEnforcementModeSchema",
      "GatewayRegistryEntrySchema",
      "GeneratedExecutionCoverageStatusSchema",
      "GeneratedExecutionGraphEdgeSchema",
      "GeneratedExecutionGraphSchema",
      "GeneratedExecutionNodeClassificationSchema",
      "GeneratedExecutionNodeInputSchema",
      "GeneratedExecutionNodeKindSchema",
      "GeneratedExecutionNodeSchema",
      "GeneratedGraphEvidenceProjectionSchema",
      "GeneratedGraphNodeProjectionRefSchema",
      "GraphEvidenceIssuerContextSchema",
      "GraphIssuerAuthoritySchema",
      "GraphRedactionStatusSchema",
      "GraphTruncationStatusSchema",
      "GreenlightSchema",
      "HANDSHAKE_ORIGINATING_IDENTITY_HEADER",
      "HANDSHAKE_PROTOCOL_VERSION_HEADER",
      "HANDSHAKE_REQUEST_IDENTITY_HEADER",
      "HandshakeClient",
      "HandshakeClientError",
      "HandshakeProtocolError",
      "IdSchema",
      "IdempotencyLedgerEntrySchema",
      "IdempotencyLedgerStateSchema",
      "IdempotencyRecoveryDispositionSchema",
      "IdempotencyRecoveryProjectionSchema",
      "IntentCompilationRecordSchema",
      "IsoDateSchema",
      "IsolationStateSchema",
      "JsonValueSchema",
      "MutationAttemptSchema",
      "OperatingEnvelopeSchema",
      "PROTOCOL_VERSION",
      "ParticipantIdentityBindingSchema",
      "ParticipantIdentityRoleSchema",
      "PolicyDecisionSchema",
      "PolicyDecisionValueSchema",
      "PostureSourceAuthoritySchema",
      "ProofGapSchema",
      "ProposeActionContractInputSchema",
      "ProtectedActionChallengeSchema",
      "ProtectedActionEvidenceProjectionSchema",
      "ProtectedActionMetadataSchema",
      "ProtectedActionRequestSchema",
      "ProtectedPathBypassProbeCoverageSchema",
      "ProtectedPathInstallHealthProjectionSchema",
      "ProtectedPathInstallHealthStatusSchema",
      "ProtectedPathPostureSchema",
      "ProtectedPathStateSchema",
      "ProtectedSurfaceOperationClaimSchema",
      "ProtectedSurfaceOperationClaimStateSchema",
      "ProtocolBaseSchema",
      "ProtocolObjectTypeSchema",
      "ProtocolRecordSchema",
      "RawSiblingToolStatusSchema",
      "ReasonCodeSchema",
      "ReceiptExportSchema",
      "ReceiptSchema",
      "ReceiptStreamReferenceSchema",
      "ReceiptTimelineEventProjectionSchema",
      "ReceiptTimelineFailureEvidenceProjectionSchema",
      "ReceiptTimelineProjectionSchema",
      "ReconcileSurfaceOperationInputSchema",
      "RecordCredentialResolutionEvidenceInputSchema",
      "RecoveryRecommendationSchema",
      "RecoveryRecommendationStatusSchema",
      "RecoveryRecommendationStatusTransitionSchema",
      "RecoveryRecommendationTerminalStatusSchema",
      "RecoveryRecommendedPathSchema",
      "RefusalPhaseSchema",
      "RefusalSchema",
      "RegisterGatewayCredentialRefInputSchema",
      "RequiredProtectedPathStateSchema",
      "ResolveRecoveryTerminalConflictInputSchema",
      "ResourceRefSchema",
      "ReviewArtifactRecordSchema",
      "ReviewDecisionSchema",
      "ReviewHiddenActionPostureSchema",
      "ReviewSecondaryActionPostureSchema",
      "RuntimeAccessPostureSchema",
      "RuntimeExecutionRecordSchema",
      "RuntimeExecutionShapeSchema",
      "RuntimePostureSchema",
      "SignaturePostureSchema",
      "SignatureSchema",
      "StreamWatermarkSchema",
      "SurfaceOperationReconciliationSchema",
      "ToolCallDraftSchema",
      "ToolCallDraftStateSchema",
      "ToolCapabilitySchema",
      "TransitionCommitStateSchema",
      "TransitionErrorEnvelopeSchema",
      "TransitionErrorResponseSchema",
      "TransitionErrorRetryabilitySchema",
      "TransitionRecoveryRecommendationStatusInputSchema",
      "TransitionRequestContextSchema",
      "TransitionToolCallDraftInputSchema",
      "authorityCertificateSigningInputDigest",
      "authorizeTransitionCaller",
      "buildAuthorityCertificateSigningInput",
      "createApp",
      "evidenceReadNavigation",
      "httpTransitionNavigation",
      "protocolNavigation",
      "requiredGatewayCheckedBypassProbeKinds",
      "transitionCallerSecuritySchemeName",
      "verifiedGatewayCheckFromResult",
      "verifyAuthorityCertificate",
    ]);

    expect(exportNames).not.toContain("HandshakeKernel");
    expect(exportNames).not.toContain("ProtocolRecorder");
    expect(exportNames).not.toContain("InMemoryProtocolStore");
    expect(exportNames).not.toContain("D1ProtocolStore");
    expect(exportNames).not.toContain("buildEventChain");
    expect(exportNames).not.toContain("experimentalRunPackageInstallGateway");
  });

  it("supports public import smoke for SDK, app, schemas, inputs, and verified gate helpers", async () => {
    const root = await import("../../src");

    expect(root.createApp).toBeFunction();
    expect(root.HandshakeClient).toBeFunction();
    expect(root.ActionContractSchema).toBeDefined();
    expect(root.GatewayCheckInputSchema).toBeDefined();
    expect(root.ProtectedActionRequestSchema).toBeDefined();
    expect(root.RefusalSchema).toBeDefined();
    expect(root.verifiedGatewayCheckFromResult).toBeFunction();
    expect(root.verifyAuthorityCertificate).toBeFunction();
  });

  it("keeps reference gateway fixtures on an explicit experimental surface", async () => {
    const experimental = await import("../../src/experimental");
    const exportNames = Object.keys(experimental).sort();

    expect(exportNames).toEqual([
      "ExperimentalAuthMdAgentAuthMetadataSchema",
      "ExperimentalAuthMdAuthorizationServerMetadataSchema",
      "ExperimentalAuthMdAuthorizationServerMetadataWireSchema",
      "ExperimentalAuthMdClaimEvidenceSchema",
      "ExperimentalAuthMdDiscoveryEvidenceSchema",
      "ExperimentalAuthMdIdentityAssertionEvidenceSchema",
      "ExperimentalAuthMdProtectedApiCallAttemptSchema",
      "ExperimentalAuthMdProtectedApiCallBypassPostureSchema",
      "ExperimentalAuthMdProtectedApiCallEvidenceSchema",
      "ExperimentalAuthMdProtectedApiCallParametersSchema",
      "ExperimentalAuthMdProtectedApiCallRuntimeConfigSchema",
      "ExperimentalAuthMdProtectedResourceMetadataSchema",
      "ExperimentalAuthMdProtectedResourceMetadataWireSchema",
      "ExperimentalAuthMdRegistrationEvidenceSchema",
      "ExperimentalAuthMdRevocationEvidenceSchema",
      "ExperimentalPackageInstallParametersSchema",
      "ExperimentalPreviewDeployParametersSchema",
      "ExperimentalRepoWriteParametersSchema",
      "ExperimentalX402PaymentParametersSchema",
      "experimentalApplyAuthMdCredentialLifecycleIsolation",
      "experimentalAuthMdIsolationStateForRevocationEvent",
      "experimentalAuthMdProtectedApiCallBypassProbeExecutors",
      "experimentalAuthMdProtectedApiCallProfile",
      "experimentalAuthMdProtectedApiCallRefusalReasonCodes",
      "experimentalAuthMdRegisteredCredentialProfile",
      "experimentalBuildAuthMdClaimEvidence",
      "experimentalBuildAuthMdDiscoveryEvidence",
      "experimentalBuildAuthMdGatewayCredentialIntake",
      "experimentalBuildAuthMdIdentityAssertionEvidence",
      "experimentalBuildAuthMdRevocationEvidence",
      "experimentalFixtureGatewayCheckedBypassProbeExecutors",
      "experimentalProposeAuthMdProtectedApiCallActionContract",
      "experimentalRunAuthMdProtectedApiCallGateway",
      "experimentalRunBypassProbeExecutors",
      "experimentalRunPackageInstallGateway",
      "experimentalRunPreviewDeployGateway",
      "experimentalRunRepoWriteGateway",
      "experimentalRunX402WalletGateway",
    ]);
    expect(experimental.experimentalRunPackageInstallGateway).toBeFunction();
  });

  it("keeps conformance checks on an explicit conformance surface", async () => {
    const root = await import("../../src");
    const conformance = await import("../../src/conformance");
    const exportNames = Object.keys(conformance).sort();

    expect(Object.keys(root)).not.toContain("checkProtectedMutationAdapterConformance");
    expect(exportNames).toEqual([
      "X402FirstWedgeEvidenceLabelSchema",
      "X402FirstWedgeSurfaceSchema",
      "X402FirstWedgeUnsupportedSurfaceSchema",
      "X402PaymentConformancePostureSchema",
      "assertProtectedMutationAdapterConformance",
      "assertX402PaymentInstallConformance",
      "checkProtectedMutationAdapterConformance",
      "checkX402PaymentInstallConformance",
      "classifyX402FirstWedgeEvidenceLabel",
      "classifyX402FirstWedgeSurface",
    ]);
    expect(conformance.checkProtectedMutationAdapterConformance).toBeFunction();
  });

  it("keeps runtime ingress on an explicit observer/compiler surface", async () => {
    const root = await import("../../src");
    const runtime = await import("../../src/runtime");
    const exportNames = Object.keys(runtime).sort();

    expect(Object.keys(root)).not.toContain("proposeRuntimeIngressActionContracts");
    expect(exportNames).toEqual([
      "RuntimeIngressDispatchBlockSchema",
      "RuntimeIngressObservedDispatchSchema",
      "proposeRuntimeIngressActionContracts",
      "runtimeIngressDispatchNodeId",
    ]);
    expect(exportNames.join(" ")).not.toMatch(/GatewayCheck|Greenlight|Mutation|PolicyDecision|Receipt/);
    expect(runtime.proposeRuntimeIngressActionContracts).toBeFunction();
  });

  it("keeps role-scoped SDK clients on an explicit non-root package surface", async () => {
    const root = await import("../../src");
    const roleClients = await import("handshake-protocol-kernel/sdk/role-clients");
    const exportNames = Object.keys(roleClients).sort();

    expect(Object.keys(root)).not.toContain("RuntimeClient");
    expect(Object.keys(root)).not.toContain("EvidenceClient");
    expect(exportNames).toEqual(["EvidenceClient", "HandshakeClientError", "RuntimeClient"]);
    expect(exportNames).not.toContain("HandshakeClient");
    expect(exportNames.join(" ")).not.toMatch(/Policy|Greenlight|Gateway|ReceiptExport|AuthorityCertificateMint/);
  });

  it("keeps CLI and MCP on explicit non-root package surfaces", async () => {
    const root = await import("../../src");
    const cli = await import("handshake-protocol-kernel/cli");
    const mcp = await import("handshake-protocol-kernel/mcp");
    const cliExportNames = Object.keys(cli).sort();
    const mcpExportNames = Object.keys(mcp).sort();

    expect(Object.keys(root)).not.toContain("runCliCommand");
    expect(Object.keys(root)).not.toContain("proposeMcpX402Payment");
    expect(cliExportNames).toContain("runCliCommand");
    expect(cliExportNames).toContain("cliCommandManifest");
    expect(mcpExportNames).toContain("mcpCatalogSnapshot");
    expect(mcpExportNames).toContain("proposeMcpX402Payment");
    expect([...cliExportNames, ...mcpExportNames].join(" ")).not.toMatch(
      /PolicyDecision|Greenlight|GatewayCheck|ReceiptExport|AuthorityCertificateMint|PaymentPayload/,
    );
  });
});
