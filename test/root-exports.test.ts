import { describe, expect, it } from "bun:test";

describe("root package exports", () => {
  it("keeps the package root curated to public and explicitly experimental surfaces", async () => {
    const root = await import("../src/index");
    const exportNames = Object.keys(root).sort();

    expect(exportNames).toEqual([
      "ActionContractSchema",
      "ActionTypeSchema",
      "BreakerDecisionSchema",
      "BreakerIsolationDecisionSchema",
      "CandidateActionSchema",
      "CandidateActionStatusSchema",
      "CompileIntentInputSchema",
      "ContractStreamEventSchema",
      "CreateBreakerDecisionInputSchema",
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
      "ExperimentalPackageInstallParametersSchema",
      "ExperimentalPreviewDeployParametersSchema",
      "ExperimentalRepoWriteParametersSchema",
      "GateDecisionSchema",
      "GatewayCheckAttemptSchema",
      "GatewayCheckInputSchema",
      "GatewayEnforcementModeSchema",
      "GatewayRegistryEntrySchema",
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
      "experimentalRunPackageInstallGateway",
      "experimentalRunPreviewDeployGateway",
      "experimentalRunRepoWriteGateway",
      "transitionCallerSecuritySchemeName",
      "verifiedGatewayCheckFromResult",
    ]);

    expect(exportNames).not.toContain("HandshakeKernel");
    expect(exportNames).not.toContain("ProtocolRecorder");
    expect(exportNames).not.toContain("InMemoryProtocolStore");
    expect(exportNames).not.toContain("D1ProtocolStore");
    expect(exportNames).not.toContain("buildEventChain");
  });

  it("supports public import smoke for SDK, app, schemas, inputs, and verified gate helpers", async () => {
    const root = await import("../src/index");

    expect(root.createApp).toBeFunction();
    expect(root.HandshakeClient).toBeFunction();
    expect(root.ActionContractSchema).toBeDefined();
    expect(root.GatewayCheckInputSchema).toBeDefined();
    expect(root.verifiedGatewayCheckFromResult).toBeFunction();
    expect(root.experimentalRunPackageInstallGateway).toBeFunction();
  });
});
