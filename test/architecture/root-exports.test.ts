import { describe, expect, it } from "bun:test";

describe("root package exports", () => {
  it("keeps the package root curated to stable public surfaces", async () => {
    const root = await import("../../src");
    const exportNames = Object.keys(root).sort();

    expect(exportNames).toEqual([
      "ActionContractSchema",
      "ActionTypeSchema",
      "BreakerDecisionSchema",
      "BreakerIsolationDecisionSchema",
      "CandidateActionSchema",
      "CandidateActionStatusSchema",
      "CommandRiskClassifierPostureSchema",
      "CompileIntentInputSchema",
      "ContractStreamEventSchema",
      "CreateBreakerDecisionInputSchema",
      "CreateGeneratedExecutionGraphInputSchema",
      "CreateIsolationInputSchema",
      "CreateProtectedPathPostureInputSchema",
      "CreateReceiptExportInputSchema",
      "CreateRecoveryRecommendationInputSchema",
      "CreateReviewArtifactInputSchema",
      "CreateReviewDecisionInputSchema",
      "CreateRuntimeExecutionInputSchema",
      "CredentialCustodyStatusSchema",
      "DigestSchema",
      "EvaluatePolicyInputSchema",
      "GateDecisionSchema",
      "GatewayCheckAttemptSchema",
      "GatewayCheckInputSchema",
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
      "IntentCompilationRecordSchema",
      "IsoDateSchema",
      "IsolationStateSchema",
      "JsonValueSchema",
      "MutationAttemptSchema",
      "OperatingEnvelopeSchema",
      "PROTOCOL_VERSION",
      "PolicyDecisionSchema",
      "PolicyDecisionValueSchema",
      "PostureSourceAuthoritySchema",
      "ProofGapSchema",
      "ProposeActionContractInputSchema",
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
      "ReconcileSurfaceOperationInputSchema",
      "RecoveryRecommendationSchema",
      "RecoveryRecommendationStatusSchema",
      "RecoveryRecommendationStatusTransitionSchema",
      "RecoveryRecommendationTerminalStatusSchema",
      "RecoveryRecommendedPathSchema",
      "RefusalPhaseSchema",
      "RefusalSchema",
      "RequiredProtectedPathStateSchema",
      "ResolveRecoveryTerminalConflictInputSchema",
      "ResourceRefSchema",
      "ReviewArtifactRecordSchema",
      "ReviewDecisionSchema",
      "RuntimeAccessPostureSchema",
      "RuntimeExecutionRecordSchema",
      "RuntimeExecutionShapeSchema",
      "RuntimePostureSchema",
      "SignatureSchema",
      "StreamWatermarkSchema",
      "SurfaceOperationReconciliationSchema",
      "ToolCapabilitySchema",
      "TransitionCommitStateSchema",
      "TransitionErrorEnvelopeSchema",
      "TransitionErrorResponseSchema",
      "TransitionErrorRetryabilitySchema",
      "TransitionRecoveryRecommendationStatusInputSchema",
      "TransitionRequestContextSchema",
      "authorizeTransitionCaller",
      "createApp",
      "evidenceReadNavigation",
      "httpTransitionNavigation",
      "protocolNavigation",
      "transitionCallerSecuritySchemeName",
      "verifiedGatewayCheckFromResult",
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
    expect(root.RefusalSchema).toBeDefined();
    expect(root.verifiedGatewayCheckFromResult).toBeFunction();
  });

  it("keeps reference gateway fixtures on an explicit experimental surface", async () => {
    const experimental = await import("../../src/experimental");
    const exportNames = Object.keys(experimental).sort();

    expect(exportNames).toEqual([
      "ExperimentalPackageInstallParametersSchema",
      "ExperimentalPreviewDeployParametersSchema",
      "ExperimentalRepoWriteParametersSchema",
      "experimentalRunPackageInstallGateway",
      "experimentalRunPreviewDeployGateway",
      "experimentalRunRepoWriteGateway",
    ]);
    expect(experimental.experimentalRunPackageInstallGateway).toBeFunction();
  });

  it("keeps conformance checks on an explicit conformance surface", async () => {
    const root = await import("../../src");
    const conformance = await import("../../src/conformance");
    const exportNames = Object.keys(conformance).sort();

    expect(Object.keys(root)).not.toContain("checkProtectedMutationAdapterConformance");
    expect(exportNames).toEqual([
      "assertProtectedMutationAdapterConformance",
      "checkProtectedMutationAdapterConformance",
    ]);
    expect(conformance.checkProtectedMutationAdapterConformance).toBeFunction();
  });
});
