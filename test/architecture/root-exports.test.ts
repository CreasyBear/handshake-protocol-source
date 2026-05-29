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
      "AuthorityCertificateIssuerSchema",
      "AuthorityCertificateIssuerStatusSchema",
      "AuthorityCertificateJwkProjectionSchema",
      "AuthorityCertificateJwksProjectionSchema",
      "AuthorityCertificateSchema",
      "AuthorityCertificateSignatureAlgorithmSchema",
      "AuthorityCertificateSignatureEntrySchema",
      "AuthorityCertificateSignerInputSchema",
      "AuthorityCertificateSignerRoleSchema",
      "AuthorityCertificateStatusRecordSchema",
      "AuthorityCertificateStatusSubjectKindSchema",
      "AuthorityCertificateTerminalKindSchema",
      "AuthorityCertificateTerminalSchema",
      "AuthorityCertificateTrustKeySchema",
      "AuthorityCertificateTrustMaterialSchema",
      "AuthorityCertificateVerificationCheckStatusSchema",
      "AuthorityCertificateVerificationFailureCodeSchema",
      "AuthorityCertificateVerificationFailureSchema",
      "AuthorityCertificateVerificationOutcomeSchema",
      "AuthorityCertificateVerificationPolicySchema",
      "AuthorityCertificateVerificationRequestSchema",
      "AuthorityCertificateVerificationResponseSchema",
      "AuthorityCertificateVerifierKeyProjectionSchema",
      "AuthorityCertificateVerifierKeySetProjectionSchema",
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
      "ControlPlaneClient",
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
      "DelegatedAuthorityBindingSchema",
      "DelegatedAuthorityGrantStatusSchema",
      "DelegatedAuthorityKindSchema",
      "DelegatedAuthorityRefSchema",
      "DelegatedAuthorityStatusTransitionSchema",
      "DelegatedAuthorityTerminalGrantStatusSchema",
      "DigestSchema",
      "DownstreamDiagnosticsRedactionPostureSchema",
      "DownstreamOutcomeStatusSchema",
      "DownstreamRetryabilitySchema",
      "EvaluatePolicyInputSchema",
      "EvidenceClient",
      "GateDecisionSchema",
      "GatewayAdmissionStatusSchema",
      "GatewayCheckAttemptSchema",
      "GatewayCheckInputSchema",
      "GatewayClient",
      "GatewayCredentialBindingSchema",
      "GatewayCredentialRefSchema",
      "GatewayCustodyClaimLevelSchema",
      "GatewayCustodyDriftStatusSchema",
      "GatewayCustodyExternalVerificationStatusSchema",
      "GatewayCustodyProofPacketSchema",
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
      "InstallSetupAuthorityBoundarySchema",
      "InstallSetupRecordRefsSchema",
      "InstallSetupRefusedResultSchema",
      "InstallSetupRegisteredResultSchema",
      "InstallSetupResultSchema",
      "IntentCompilationRecordSchema",
      "IsoDateSchema",
      "IsolationStateSchema",
      "JsonValueSchema",
      "MutationAttemptSchema",
      "OperatingEnvelopeSchema",
      "OperationCorrelationIndexSchema",
      "OperationReadbackGreenlightUsePostureSchema",
      "OperationReadbackNextMechanismSchema",
      "OperationReadbackProjectionSchema",
      "OperationReadbackStageSchema",
      "OperationReadbackStatusSchema",
      "OperationReadbackSupportSeveritySchema",
      "OperationSupportContextSchema",
      "PROTOCOL_VERSION",
      "ParticipantIdentityBindingSchema",
      "ParticipantIdentityRoleSchema",
      "PolicyClient",
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
      "RecordGatewayCustodyProofPacketInputSchema",
      "RecoveryRecommendationSchema",
      "RecoveryRecommendationStatusSchema",
      "RecoveryRecommendationStatusTransitionSchema",
      "RecoveryRecommendationTerminalStatusSchema",
      "RecoveryRecommendedPathSchema",
      "RefusalPhaseSchema",
      "RefusalSchema",
      "RegisterDelegatedAuthorityRefInputSchema",
      "RegisterGatewayCredentialRefInputSchema",
      "RegisterInstallProposalCompiledRecordsInputSchema",
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
      "TransitionDelegatedAuthorityStatusInputSchema",
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
      "explainHandshakeError",
      "httpTransitionNavigation",
      "projectAuthorityCertificateJwks",
      "projectAuthorityCertificateVerifierKeySet",
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

  it("keeps adapter authoring helpers on an explicit adapter SDK subpath", async () => {
    const root = await import("../../src");
    const adapterSdk = await import("../../src/adapter-sdk");
    const exportNames = Object.keys(adapterSdk).sort();

    expect(Object.keys(root)).not.toContain("defineProtectedActionAdapterPack");
    expect(Object.keys(root)).not.toContain("projectAdapterSdkInstallProposalReport");
    expect(exportNames).toEqual([
      "AdapterSdkAuthorityBoundarySchema",
      "AdapterSdkBindingStatusSchema",
      "AdapterSdkConformanceExpectationSchema",
      "AdapterSdkDefinitionInputSchema",
      "AdapterSdkDefinitionIssueCodeSchema",
      "AdapterSdkDefinitionReportSchema",
      "AdapterSdkDefinitionSchema",
      "AdapterSdkInstallCompilerContractSchema",
      "AdapterSdkInstallProposalIssueCodeSchema",
      "AdapterSdkInstallProposalReportSchema",
      "AdapterSdkProtectedPathContractSchema",
      "adapterSdkAuthorityBoundary",
      "adapterSdkRequiredNonClaims",
      "assertAdapterSdkInstallProposal",
      "defineAdapterInstallCompiler",
      "defineProtectedActionAdapterPack",
      "projectAdapterSdkDefinitionReport",
      "projectAdapterSdkInstallProposalReport",
    ]);
    expect(exportNames.join(" ")).not.toMatch(/GatewayCheck|Greenlight|Mutation|PolicyDecision|ReceiptExport/);
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
      "experimentalRunX402WalletGateway",
    ]);
    expect(experimental.experimentalRunPackageInstallGateway).toBeFunction();
    expect(exportNames).not.toContain("experimentalRunPreviewDeployGateway");
    expect(exportNames).not.toContain("experimentalRunRepoWriteGateway");
  });

  it("keeps conformance checks on an explicit conformance surface", async () => {
    const root = await import("../../src");
    const conformance = await import("../../src/conformance");
    const exportNames = Object.keys(conformance).sort();

    expect(Object.keys(root)).not.toContain("checkProtectedMutationAdapterConformance");
    expect(exportNames).toEqual([
      "PackageInstallAdapterEvidenceReportSchema",
      "PackageInstallMaterialEvidenceSchema",
      "PackageInstallMaterialEvidenceStatusSchema",
      "X402AuthorityCertificateEvidenceProfileSchema",
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
      "packageInstallMaterialAdapterPack",
      "projectPackageInstallAdapterEvidenceReport",
      "projectPackageInstallMaterialEvidence",
      "projectX402AuthorityCertificateEvidenceProfile",
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

  it("keeps the x402 protected tool on an explicit proposal/profile package surface", async () => {
    const root = await import("../../src");
    const x402Tool = await import("../../src/x402-protected-tool");
    const exportNames = Object.keys(x402Tool).sort();

    expect(Object.keys(root)).not.toContain("prepareProtectedX402ToolDispatch");
    expect(Object.keys(root)).not.toContain("buildProtectedX402ToolHostProfile");
    expect(exportNames).toEqual([
      "CLAUDE_CODE_X402_PROTECTED_TOOL_ACTIVATION_VERSION",
      "CODEX_X402_PROTECTED_TOOL_ACTIVATION_VERSION",
      "ClaudeCodeX402ProtectedToolActivationArtifactSchema",
      "ClaudeCodeX402ProtectedToolActivationInputSchema",
      "CodexX402ProtectedToolActivationArtifactSchema",
      "CodexX402ProtectedToolActivationInputSchema",
      "GENERIC_MCP_X402_PROTECTED_TOOL_ACTIVATION_VERSION",
      "GenericMcpX402ProtectedToolActivationArtifactSchema",
      "GenericMcpX402ProtectedToolActivationInputSchema",
      "HERMES_X402_PROTECTED_TOOL_ACTIVATION_VERSION",
      "HermesX402ProtectedToolActivationArtifactSchema",
      "HermesX402ProtectedToolActivationInputSchema",
      "OPENCLAW_X402_PROTECTED_TOOL_ACTIVATION_VERSION",
      "OpenClawX402ProtectedToolActivationArtifactSchema",
      "OpenClawX402ProtectedToolActivationInputSchema",
      "ProtectedX402ToolFacadeInputSchema",
      "X402ProtectedToolGatewayReadinessSnapshotSchema",
      "X402ProtectedToolHostBypassPostureSchema",
      "X402ProtectedToolHostFamilySchema",
      "X402ProtectedToolHostProfileAuthorityBoundarySchema",
      "X402ProtectedToolHostProfileDescriptorSchema",
      "X402ProtectedToolReadinessAuthorityBoundarySchema",
      "X402ProtectedToolReadinessRawSiblingPostureSchema",
      "X402ProtectedToolReadinessSnapshotSchema",
      "X402_PROTECTED_TOOL_ACCEPTANCE_VERSION",
      "X402_PROTECTED_TOOL_FACADE_VERSION",
      "X402_PROTECTED_TOOL_NAME",
      "X402_PROTECTED_TOOL_PROFILE_VERSION",
      "X402_PROTECTED_TOOL_READINESS_VERSION",
      "buildClaudeCodeX402ProtectedToolActivation",
      "buildCodexX402ProtectedToolActivation",
      "buildGenericMcpX402ProtectedToolActivation",
      "buildHermesX402ProtectedToolActivation",
      "buildOpenClawX402ProtectedToolActivation",
      "buildProtectedX402ToolHostProfile",
      "prepareProtectedX402ToolDispatch",
      "x402ProtectedToolAcceptanceMatrix",
      "x402ProtectedToolForbiddenProductionClaims",
      "x402ProtectedToolHostProfileAuthorityBoundary",
      "x402ProtectedToolReadinessAuthorityBoundary",
      "x402ProtectedToolReleaseBlockers",
    ]);
    expect(exportNames.join(" ")).not.toMatch(
      /PolicyDecision|Greenlight|GatewayCheck|ReceiptExport|AuthorityCertificateMint|PaymentPayload/,
    );
  });

  it("re-exports curated role clients from package root (D-56, adjudication #1)", async () => {
    const root = await import("../../src");
    const roleClients = await import("handshake-protocol-kernel/sdk/role-clients");
    const rootExportNames = Object.keys(root);
    const subpathExportNames = Object.keys(roleClients).sort();

    expect(rootExportNames).toContain("EvidenceClient");
    expect(rootExportNames).toContain("ControlPlaneClient");
    expect(rootExportNames).toContain("GatewayClient");
    expect(rootExportNames).toContain("PolicyClient");
    expect(rootExportNames).toContain("explainHandshakeError");
    expect(rootExportNames).not.toContain("RuntimeClient");
    expect(rootExportNames).not.toContain("InstallClient");
    expect(subpathExportNames).toEqual([
      "ControlPlaneClient",
      "EvidenceClient",
      "GatewayClient",
      "HandshakeClientError",
      "InstallClient",
      "PolicyClient",
      "RuntimeClient",
    ]);
    expect(subpathExportNames).not.toContain("HandshakeClient");
    expect(subpathExportNames.join(" ")).not.toMatch(/ReceiptExport|AuthorityCertificateMint|PaymentPayload/);
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
