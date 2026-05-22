import { z } from "zod";
import { cliOutput } from "./output";

const ApsReportSchema = z
  .strictObject({
    schemaVersion: z.string(),
    proofObject: z
      .strictObject({
        name: z.string(),
        proofBoundary: z.string(),
      })
      .passthrough(),
    protectedAction: z
      .strictObject({
        actionClass: z.string(),
        x402EvidenceProfile: z.string().optional(),
        selectedPaymentRequirementIndex: z.number().int().nonnegative().nullable().optional(),
        selectedPaymentRequirementDigest: z.string().nullable().optional(),
      })
      .passthrough(),
    authorityPath: z.record(z.string(), z.unknown()).default({}),
    evidencePosture: z.record(z.string(), z.unknown()).default({}),
    terminalPosture: z.record(z.string(), z.unknown()).default({}),
    nonClaims: z.array(z.string()).default([]),
    missingProofObjects: z.array(z.record(z.string(), z.unknown())).default([]),
  })
  .passthrough();

const ApsDemoOutputSchema = z
  .strictObject({
    schemaVersion: z.string(),
    report: ApsReportSchema,
    phases: z
      .array(
        z
          .strictObject({
            phase: z.string(),
            verdict: z.string(),
          })
          .passthrough(),
      )
      .default([]),
  })
  .passthrough();

export function renderApsReportCommand(reportValue: unknown) {
  const parsed = ApsDemoOutputSchema.parse(reportValue);
  const phaseSummary = parsed.phases.map((phase) => ({ phase: phase.phase, verdict: phase.verdict }));
  return cliOutput({
    command: "evidence aps-report",
    plane: "evidence",
    custodyRole: "review_custody",
    nonClaims: parsed.report.nonClaims,
    result: {
      schemaVersion: parsed.report.schemaVersion,
      proofBoundary: parsed.report.proofObject.proofBoundary,
      protectedAction: parsed.report.protectedAction,
      authorityPath: parsed.report.authorityPath,
      evidencePosture: parsed.report.evidencePosture,
      terminalPosture: parsed.report.terminalPosture,
      phases: phaseSummary,
      missingProofObjects: parsed.report.missingProofObjects,
    },
  });
}
