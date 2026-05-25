import { z } from "zod";
import {
  AgentTransactionEnvelopeProjectionSchema,
  ContractEvidenceProjectionSchema,
  ProtectedPathInstallHealthProjectionSchema,
  ReceiptTimelineProjectionSchema,
} from "../protocol/evidence-projections/schemas";
import { LocalX402InstallRecordSchema, LocalX402ProbeReportSchema } from "./x402/local-state";
import { cliOutput } from "./output";

const CLI_SUPPORT_BUNDLE_SCHEMA_VERSION = "handshake.cli.support-bundle.v1" as const;

const SupportBundleInputSchema = z
  .strictObject({
    supportCaseRef: z.string().min(1).max(160).nullable().default(null),
    contractView: ContractEvidenceProjectionSchema.optional(),
    agentTransactionEnvelope: AgentTransactionEnvelopeProjectionSchema.optional(),
    receiptTimeline: ReceiptTimelineProjectionSchema.optional(),
    installHealth: ProtectedPathInstallHealthProjectionSchema.optional(),
    localX402Install: LocalX402InstallRecordSchema.optional(),
    localX402ProbeReport: LocalX402ProbeReportSchema.optional(),
    operatorNotes: z.array(z.string().min(1).max(240)).max(12).default([]),
  })
  .refine(
    (input) =>
      Boolean(
        input.contractView ??
        input.agentTransactionEnvelope ??
        input.receiptTimeline ??
        input.installHealth ??
        input.localX402Install ??
        input.localX402ProbeReport,
      ),
    { message: "support bundle requires at least one redacted projection or local posture record" },
  );

const rawMaterialOmissions = [
  "payment_payload_material",
  "payment_payloads",
  "payment_signature_header",
  "payment_signatures",
  "signer_refs",
  "key_material",
  "private_keys",
  "account_secret_material",
  "role_token_values",
  "transition_token_values",
  "reusable_authority_tokens",
  "internal_record_dumps",
  "gateway_check_inputs",
  "request_body_dumps",
  "raw_request_bodies",
  "gateway_credential_material",
  "mutation_commands",
  "receipt_exports",
] as const;

export function supportBundleCommand(value: unknown) {
  const input = SupportBundleInputSchema.parse(value);
  const actionRefs = new Set<string>();
  if (input.contractView) actionRefs.add(input.contractView.actionContractRef);
  if (input.agentTransactionEnvelope) actionRefs.add(input.agentTransactionEnvelope.actionContractRef);
  if (input.receiptTimeline) actionRefs.add(input.receiptTimeline.actionContractRef);
  if (input.installHealth) actionRefs.add(input.installHealth.actionContractRef);

  const reasonCodes = new Set<string>();
  for (const reason of input.agentTransactionEnvelope?.proofGapReasonCodes ?? []) reasonCodes.add(reason);
  for (const reason of input.agentTransactionEnvelope?.refusalReasonCodes ?? []) reasonCodes.add(reason);
  for (const reason of input.agentTransactionEnvelope?.idempotencyReasonCodes ?? []) reasonCodes.add(reason);
  for (const reason of input.installHealth?.reasonCodes ?? []) reasonCodes.add(reason);
  for (const reason of input.localX402Install?.refusalReasonCodes ?? []) reasonCodes.add(reason);
  for (const reason of input.localX402ProbeReport?.reasonCodes ?? []) reasonCodes.add(reason);
  const sortedReasonCodes = [...reasonCodes].sort();
  const proofGapRefs = [
    ...(input.agentTransactionEnvelope?.proofGapRefs ?? []),
    ...(input.receiptTimeline?.proofGapRefs ?? []),
  ].filter(unique);
  const evidenceRefs = [
    ...(input.contractView?.evidenceRefs ?? []),
    ...(input.agentTransactionEnvelope?.evidenceRefs ?? []),
    ...(input.receiptTimeline?.proofGapRefs.map((ref) => `proof_gap:${ref}`) ?? []),
    input.installHealth?.currentPostureRef ? `protected_path_posture:${input.installHealth.currentPostureRef}` : null,
  ].filter((ref): ref is string => ref !== null);

  return cliOutput({
    command: "support bundle",
    plane: "evidence",
    custodyRole: "review_custody",
    reasonCodes: sortedReasonCodes,
    nextAction: reasonCodes.size > 0 || proofGapRefs.length > 0 ? "read_evidence" : "read_result",
    redactionProfileRef: "cli-support-bundle:v1-redacted",
    evidenceRefs,
    proofGapRefs,
    warnings: [
      "Support bundle is assembled from supplied redacted projections and local posture records only.",
      "It is not a receipt export, raw record dump, gateway check, mutation proof, or trusted install readiness signal.",
    ],
    result: {
      schemaVersion: CLI_SUPPORT_BUNDLE_SCHEMA_VERSION,
      supportCaseRef: input.supportCaseRef,
      bundleKind: "redacted_evidence_support_bundle",
      sourceAuthority: "caller_supplied_redacted_inputs",
      actionContractRefs: [...actionRefs].sort(),
      includedItems: {
        contractView: projectionItem(input.contractView, "contract-view:v0.2-redacted"),
        agentTransactionEnvelope: projectionItem(
          input.agentTransactionEnvelope,
          "agent-transaction-envelope:v0.2-redacted",
        ),
        receiptTimeline: projectionItem(input.receiptTimeline, "receipt-timeline:v0.2-redacted"),
        installHealth: projectionItem(input.installHealth, "protected-path-install-health:v0.2-redacted"),
        localX402Install: localItem(input.localX402Install, "local_compilation"),
        localX402ProbeReport: localItem(input.localX402ProbeReport, "local_classification"),
      },
      terminalPosture: input.receiptTimeline
        ? {
            policyDecisionStatus: input.receiptTimeline.policyDecisionStatus,
            gatewayCheckStatus: input.receiptTimeline.gatewayCheckStatus,
            gatewayAdmissionStatus: input.receiptTimeline.gatewayAdmissionStatus,
            mutationAttemptStatus: input.receiptTimeline.mutationAttemptStatus,
            downstreamOutcomeStatus: input.receiptTimeline.downstreamOutcomeStatus,
            finalityStatus: input.receiptTimeline.finalityStatus,
            proofGapRefs: input.receiptTimeline.proofGapRefs,
          }
        : null,
      readbackStages: readbackStages(input),
      localReadiness: {
        installReadinessAuthority: input.localX402Install?.readinessAuthority ?? null,
        trustedInstallReadiness: input.localX402Install?.trustedInstallReadiness ?? null,
        probeReadinessAuthority: input.localX402ProbeReport?.readinessAuthority ?? null,
        trustedProbeReadiness: input.localX402ProbeReport?.trustedReadiness ?? null,
        nextReadinessAction: input.localX402Install?.nextReadinessAction ?? null,
      },
      reasonCodes: sortedReasonCodes,
      reasonCodeRunbook: sortedReasonCodes.map((reasonCode) => ({
        reasonCode,
        nextMechanism: supportRunbookActionFor(reasonCode),
      })),
      operatorNotes: input.operatorNotes,
      rawMaterialOmitted: rawMaterialOmissions,
      receiptExportCreated: false,
      rawInternalRecordIncluded: false,
      credentialMaterialIncluded: false,
    },
  });
}

type SupportRunbookAction =
  | "reload"
  | "recraft"
  | "wait"
  | "stop"
  | "isolate"
  | "read_evidence"
  | "create_new_contract";

function supportRunbookActionFor(reasonCode: string): SupportRunbookAction {
  if (reasonCode.includes("already_consumed") || reasonCode.includes("duplicate_authority")) {
    return "create_new_contract";
  }
  if (reasonCode.includes("isolation") || reasonCode.includes("quarantined") || reasonCode.includes("revoked")) {
    return "isolate";
  }
  if (
    reasonCode.includes("proof_gap") ||
    reasonCode.includes("downstream") ||
    reasonCode.includes("terminal_unknown") ||
    reasonCode.includes("recovery")
  ) {
    return "read_evidence";
  }
  if (reasonCode.includes("stale") || reasonCode.includes("metadata") || reasonCode.includes("digest_mismatch")) {
    return "reload";
  }
  if (reasonCode.includes("offline") || reasonCode.includes("unavailable") || reasonCode.includes("timeout")) {
    return "wait";
  }
  if (
    reasonCode.includes("unsafe") ||
    reasonCode.includes("bypass") ||
    reasonCode.includes("not_blocked") ||
    reasonCode.includes("halt") ||
    reasonCode.includes("raw_")
  ) {
    return "stop";
  }
  return "recraft";
}

function readbackStages(input: z.infer<typeof SupportBundleInputSchema>) {
  const envelope = input.agentTransactionEnvelope;
  return {
    generatedExecutionRefs: [
      input.contractView?.generatedExecutionGraphRef ?? null,
      input.contractView?.generatedExecutionNodeRef ?? null,
    ].filter((ref): ref is string => ref !== null),
    contractRef: input.contractView?.actionContractRef ?? envelope?.actionContractRef ?? null,
    policyDecisionRef: input.receiptTimeline?.policyDecisionRef ?? envelope?.policyDecisionRef ?? null,
    greenlightRef: input.receiptTimeline?.greenlightRef ?? envelope?.greenlightRef ?? null,
    gatewayCheckRef: input.receiptTimeline?.gateAttemptRef ?? envelope?.gateAttemptRef ?? null,
    credentialResolutionEvidenceRefs: envelope?.credentialResolutionEvidenceRefs ?? [],
    signerInvocationEvidenceRefs: envelope?.signerInvocationEvidenceRefs ?? [],
    downstreamEvidenceRefs: envelope?.downstreamEvidenceRefs ?? [],
    replayRefusalRefs:
      envelope?.greenlightConsumptionStatus === "replayed"
        ? envelope.refusalRefs
        : envelope?.refusalReasonCodes.includes("already_consumed")
          ? envelope.refusalRefs
          : [],
    refusalRefs: envelope?.refusalRefs ?? [],
    isolationRefs: envelope?.isolationRefs ?? [],
    proofGapRefs: [...(envelope?.proofGapRefs ?? []), ...(input.receiptTimeline?.proofGapRefs ?? [])].filter(unique),
  };
}

function projectionItem(
  value: { redactionProfileRef: string; omittedFields: readonly string[] } | undefined,
  expected: string,
) {
  return value
    ? {
        present: true,
        redactionProfileRef: value.redactionProfileRef,
        expectedRedactionProfileRef: expected,
        omittedFields: value.omittedFields,
      }
    : {
        present: false,
        redactionProfileRef: null,
        expectedRedactionProfileRef: expected,
        omittedFields: [],
      };
}

function localItem(value: unknown, sourceAuthority: string) {
  return value
    ? {
        present: true,
        sourceAuthority,
      }
    : {
        present: false,
        sourceAuthority,
      };
}

function unique<T>(value: T, index: number, values: readonly T[]): boolean {
  return values.indexOf(value) === index;
}
