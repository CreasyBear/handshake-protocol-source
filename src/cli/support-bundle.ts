import { z } from "zod";
import {
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
        input.receiptTimeline ??
        input.installHealth ??
        input.localX402Install ??
        input.localX402ProbeReport,
      ),
    { message: "support bundle requires at least one redacted projection or local posture record" },
  );

const rawMaterialOmissions = [
  "payment_payload_material",
  "payment_signature_header",
  "key_material",
  "account_secret_material",
  "role_token_values",
  "transition_token_values",
  "internal_record_dumps",
  "request_body_dumps",
  "gateway_credential_material",
  "mutation_commands",
  "receipt_exports",
] as const;

export function supportBundleCommand(value: unknown) {
  const input = SupportBundleInputSchema.parse(value);
  const actionRefs = new Set<string>();
  if (input.contractView) actionRefs.add(input.contractView.actionContractRef);
  if (input.receiptTimeline) actionRefs.add(input.receiptTimeline.actionContractRef);
  if (input.installHealth) actionRefs.add(input.installHealth.actionContractRef);

  const reasonCodes = new Set<string>();
  for (const reason of input.installHealth?.reasonCodes ?? []) reasonCodes.add(reason);
  for (const reason of input.localX402Install?.refusalReasonCodes ?? []) reasonCodes.add(reason);
  for (const reason of input.localX402ProbeReport?.reasonCodes ?? []) reasonCodes.add(reason);

  return cliOutput({
    command: "support bundle",
    plane: "evidence",
    custodyRole: "review_custody",
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
      localReadiness: {
        installReadinessAuthority: input.localX402Install?.readinessAuthority ?? null,
        trustedInstallReadiness: input.localX402Install?.trustedInstallReadiness ?? null,
        probeReadinessAuthority: input.localX402ProbeReport?.readinessAuthority ?? null,
        trustedProbeReadiness: input.localX402ProbeReport?.trustedReadiness ?? null,
        nextReadinessAction: input.localX402Install?.nextReadinessAction ?? null,
      },
      reasonCodes: [...reasonCodes].sort(),
      operatorNotes: input.operatorNotes,
      rawMaterialOmitted: rawMaterialOmissions,
      receiptExportCreated: false,
      rawInternalRecordIncluded: false,
      credentialMaterialIncluded: false,
    },
  });
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
