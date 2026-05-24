import { z } from "zod";
import { IsoDateSchema } from "../protocol/public/schemas";

export const ActivationGateVerdictSchema = z.enum(["PASS", "PASS_WITH_PROOF_GAPS", "BLOCKED", "CUT"]);
export type ActivationGateVerdict = z.infer<typeof ActivationGateVerdictSchema>;

export const ActivationGatePrioritySchema = z.enum(["P0", "P1", "P2"]);
export type ActivationGatePriority = z.infer<typeof ActivationGatePrioritySchema>;

export const ActivationGateStatusSchema = z.enum(["passed", "failed", "blocked", "not_run", "proof_gap", "cut"]);
export type ActivationGateStatus = z.infer<typeof ActivationGateStatusSchema>;

export const ActivationGateProofGapPolicySchema = z.enum(["block_until_resolved", "allow_narrowed_pass"]);
export type ActivationGateProofGapPolicy = z.infer<typeof ActivationGateProofGapPolicySchema>;

const NonEmptyStringSchema = z.string().min(1);

export const ActivationGateAuthorityBoundarySchema = z.strictObject({
  createsAuthority: z.literal(false),
  createsPolicyDecision: z.literal(false),
  createsGreenlight: z.literal(false),
  performsGatewayCheck: z.literal(false),
  performsMutation: z.literal(false),
  resolvesCredential: z.literal(false),
  invokesSigner: z.literal(false),
  createsPaymentPayload: z.literal(false),
  exportsReceipt: z.literal(false),
  mintsAuthorityCertificate: z.literal(false),
  hostsOperation: z.literal(false),
  establishesProviderCustody: z.literal(false),
  managesSettlement: z.literal(false),
  enforcesAggregateSpend: z.literal(false),
  certifiesMarketplace: z.literal(false),
  establishesCrossOrgTrust: z.literal(false),
  enforcesHostWideContainment: z.literal(false),
});
export type ActivationGateAuthorityBoundary = z.infer<typeof ActivationGateAuthorityBoundarySchema>;

export const activationGateAuthorityBoundary = ActivationGateAuthorityBoundarySchema.parse({
  createsAuthority: false,
  createsPolicyDecision: false,
  createsGreenlight: false,
  performsGatewayCheck: false,
  performsMutation: false,
  resolvesCredential: false,
  invokesSigner: false,
  createsPaymentPayload: false,
  exportsReceipt: false,
  mintsAuthorityCertificate: false,
  hostsOperation: false,
  establishesProviderCustody: false,
  managesSettlement: false,
  enforcesAggregateSpend: false,
  certifiesMarketplace: false,
  establishesCrossOrgTrust: false,
  enforcesHostWideContainment: false,
});

export const ActivationGateProofGapSchema = z.strictObject({
  reasonCode: NonEmptyStringSchema,
  affectedRef: NonEmptyStringSchema,
  owner: NonEmptyStringSchema,
  nonClaim: NonEmptyStringSchema,
  nextStageImplication: NonEmptyStringSchema,
  blocksNextStage: z.boolean(),
  evidenceRefs: z.array(NonEmptyStringSchema),
});
export type ActivationGateProofGap = z.infer<typeof ActivationGateProofGapSchema>;

export const ActivationGateExternalCheckSchema = z.strictObject({
  checkId: NonEmptyStringSchema,
  status: z.enum(["verified", "blocked", "cut", "proof_gap"]),
  owner: NonEmptyStringSchema,
  evidenceRefs: z.array(NonEmptyStringSchema),
  nonClaim: NonEmptyStringSchema,
});
export type ActivationGateExternalCheck = z.infer<typeof ActivationGateExternalCheckSchema>;

export const ActivationGateSuccessCriterionSchema = z.strictObject({
  criterionId: NonEmptyStringSchema,
  title: NonEmptyStringSchema,
  requirement: NonEmptyStringSchema,
  requiredForTenStar: z.boolean(),
  satisfied: z.boolean(),
  evidenceRefs: z.array(NonEmptyStringSchema),
  commandRefs: z.array(NonEmptyStringSchema),
  antiPatternRefs: z.array(NonEmptyStringSchema),
});
export type ActivationGateSuccessCriterion = z.infer<typeof ActivationGateSuccessCriterionSchema>;

export const ActivationGateAntiPatternSchema = z.strictObject({
  antiPatternId: NonEmptyStringSchema,
  pattern: NonEmptyStringSchema,
  failureMode: NonEmptyStringSchema,
  present: z.boolean(),
  blockedByRefs: z.array(NonEmptyStringSchema),
  evidenceRefs: z.array(NonEmptyStringSchema),
});
export type ActivationGateAntiPattern = z.infer<typeof ActivationGateAntiPatternSchema>;

export const ActivationGateResultSchema = z.strictObject({
  gateId: NonEmptyStringSchema,
  title: NonEmptyStringSchema,
  priority: ActivationGatePrioritySchema,
  status: ActivationGateStatusSchema,
  requiredForNextStage: z.boolean(),
  positiveProofEvidenceRefs: z.array(NonEmptyStringSchema),
  forbiddenAuthorityEvidenceRefs: z.array(NonEmptyStringSchema),
  commandRefs: z.array(NonEmptyStringSchema),
  artifactRefs: z.array(NonEmptyStringSchema),
  proofGaps: z.array(ActivationGateProofGapSchema),
  cutLines: z.array(NonEmptyStringSchema),
  verdictEffect: z.enum(["unblocks", "blocks", "carries_proof_gap", "cuts_scope"]),
});
export type ActivationGateResult = z.infer<typeof ActivationGateResultSchema>;

export const ActivationGateReportInputSchema = z.strictObject({
  reportId: NonEmptyStringSchema,
  generatedAt: IsoDateSchema,
  scope: NonEmptyStringSchema,
  proofGapPolicy: ActivationGateProofGapPolicySchema,
  gates: z.array(ActivationGateResultSchema).min(1),
  externalChecks: z.array(ActivationGateExternalCheckSchema),
  successCriteria: z.array(ActivationGateSuccessCriterionSchema).min(1),
  antiPatterns: z.array(ActivationGateAntiPatternSchema).min(1),
  allowedNextStageClaims: z.array(NonEmptyStringSchema),
  forbiddenNextStageClaims: z.array(NonEmptyStringSchema),
  userOwnedDecisions: z.array(NonEmptyStringSchema),
});
export type ActivationGateReportInput = z.infer<typeof ActivationGateReportInputSchema>;

export const ActivationGateReportSchema = ActivationGateReportInputSchema.extend({
  reportKind: z.literal("activation_gate_report"),
  verdict: ActivationGateVerdictSchema,
  nextStageUnblocked: z.boolean(),
  blockingGateIds: z.array(NonEmptyStringSchema),
  cutGateIds: z.array(NonEmptyStringSchema),
  carriedProofGaps: z.array(ActivationGateProofGapSchema),
  unsatisfiedCriterionIds: z.array(NonEmptyStringSchema),
  triggeredAntiPatternIds: z.array(NonEmptyStringSchema),
  authorityBoundary: ActivationGateAuthorityBoundarySchema,
});
export type ActivationGateReport = z.infer<typeof ActivationGateReportSchema>;

export function projectActivationGateReport(inputValue: ActivationGateReportInput): ActivationGateReport {
  const input = ActivationGateReportInputSchema.parse(inputValue);
  const requiredGates = input.gates.filter((gate) => gate.requiredForNextStage || gate.priority !== "P2");
  const cutGateIds = requiredGates
    .filter((gate) => gate.status === "cut")
    .map((gate) => gate.gateId)
    .sort();
  const carriedProofGaps = input.gates.flatMap((gate) => gate.proofGaps).filter((gap) => !gap.blocksNextStage);
  const blockingGateIds = blockingGates(requiredGates, input.proofGapPolicy);
  const unsatisfiedCriterionIds = unsatisfiedCriteria(input.successCriteria);
  const triggeredAntiPatternIds = triggeredAntiPatterns(input.antiPatterns);
  const verdict = verdictFor({
    requiredGates,
    blockingGateIds,
    carriedProofGaps,
    cutGateIds,
    unsatisfiedCriterionIds,
    triggeredAntiPatternIds,
    proofGapPolicy: input.proofGapPolicy,
  });

  return ActivationGateReportSchema.parse({
    ...input,
    reportKind: "activation_gate_report",
    verdict,
    nextStageUnblocked: verdict === "PASS" || verdict === "PASS_WITH_PROOF_GAPS",
    blockingGateIds,
    cutGateIds,
    carriedProofGaps: carriedProofGaps.sort((left, right) => left.reasonCode.localeCompare(right.reasonCode)),
    unsatisfiedCriterionIds,
    triggeredAntiPatternIds,
    authorityBoundary: activationGateAuthorityBoundary,
  });
}

function blockingGates(gates: ActivationGateResult[], proofGapPolicy: ActivationGateProofGapPolicy): string[] {
  const blocked = new Set<string>();
  for (const gate of gates) {
    if (["failed", "blocked", "not_run"].includes(gate.status)) blocked.add(gate.gateId);
    if (gate.status === "passed" && !hasRequiredEvidence(gate)) blocked.add(gate.gateId);
    if (gate.proofGaps.some((gap) => gap.blocksNextStage)) blocked.add(gate.gateId);
    if (proofGapPolicy === "block_until_resolved" && gate.proofGaps.length > 0) blocked.add(gate.gateId);
  }
  return [...blocked].sort();
}

function hasRequiredEvidence(gate: ActivationGateResult): boolean {
  return (
    gate.positiveProofEvidenceRefs.length > 0 &&
    gate.forbiddenAuthorityEvidenceRefs.length > 0 &&
    gate.commandRefs.length > 0
  );
}

function unsatisfiedCriteria(criteria: ActivationGateSuccessCriterion[]): string[] {
  return criteria
    .filter(
      (criterion) =>
        criterion.requiredForTenStar &&
        (!criterion.satisfied || criterion.evidenceRefs.length === 0 || criterion.commandRefs.length === 0),
    )
    .map((criterion) => criterion.criterionId)
    .sort();
}

function triggeredAntiPatterns(antiPatterns: ActivationGateAntiPattern[]): string[] {
  return antiPatterns
    .filter((antiPattern) => antiPattern.present)
    .map((antiPattern) => antiPattern.antiPatternId)
    .sort();
}

function verdictFor(input: {
  requiredGates: ActivationGateResult[];
  blockingGateIds: string[];
  carriedProofGaps: ActivationGateProofGap[];
  cutGateIds: string[];
  unsatisfiedCriterionIds: string[];
  triggeredAntiPatternIds: string[];
  proofGapPolicy: ActivationGateProofGapPolicy;
}): ActivationGateVerdict {
  if (input.unsatisfiedCriterionIds.length > 0 || input.triggeredAntiPatternIds.length > 0) return "BLOCKED";
  if (input.blockingGateIds.length > 0) return "BLOCKED";
  if (input.requiredGates.every((gate) => gate.status === "cut")) return "CUT";
  if (input.carriedProofGaps.length > 0 || input.cutGateIds.length > 0) {
    return input.proofGapPolicy === "allow_narrowed_pass" ? "PASS_WITH_PROOF_GAPS" : "BLOCKED";
  }
  return "PASS";
}
