import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { z } from "zod";
import { x402PaymentHostileBypassProbeExecutors } from "../../adapters/x402-payment/bypass-probes";
import {
  checkX402PaymentInstallConformance,
  X402PaymentConformancePostureSchema,
  x402FirstWedgeUnsupportedSurfaces,
  type X402PaymentConformancePosture,
} from "../../adapters/x402-payment/conformance";
import {
  compileX402InstallProposal,
  X402InstallProposalInputSchema,
  type X402InstallProposal,
} from "../../adapters/x402-payment/install-proposal";
import { digestCanonical } from "../../protocol/foundation/canonical";
import { DigestSchema, type JsonValue } from "../../protocol/foundation/schema-core";
import {
  CLI_X402_INSTALL_RECORD_SCHEMA_VERSION,
  CLI_X402_PROBE_REPORT_SCHEMA_VERSION,
  LocalX402InstallRecordSchema,
  LocalX402ProbeReportSchema,
  type LocalX402InstallRecord,
  type LocalX402ProbeReport,
} from "./local-state";
import { readLocalProjectConfig, readLocalX402Health, updateLocalProjectConfig } from "../local-project";
import { cliOutput } from "../output";

const X402InstallCommandInputSchema = z.union([
  X402InstallProposalInputSchema,
  z.strictObject({
    installInput: X402InstallProposalInputSchema,
    selectedPaymentRequirementIndex: z.number().int().nonnegative().nullable().default(null),
    selectedPaymentRequirementDigest: DigestSchema.nullable().default(null),
  }),
]);

type NormalizedInstallInput = {
  installInput: z.infer<typeof X402InstallProposalInputSchema>;
  selectedPaymentRequirementIndex: number | null;
  selectedPaymentRequirementDigest: `sha256:${string}` | null;
};

export async function installX402PaymentCommand(input: { cwd: string; inputValue: unknown; recordLocal: boolean }) {
  const normalized = normalizeInstallInput(input.inputValue);
  const proposal = await compileX402InstallProposal(normalized.installInput);
  const record = await buildLocalInstallRecord({
    cwd: input.cwd,
    proposal,
    selectedPaymentRequirementIndex: normalized.selectedPaymentRequirementIndex,
    selectedPaymentRequirementDigest: normalized.selectedPaymentRequirementDigest,
  });
  const recordedRef = input.recordLocal ? await writeLocalInstallRecord(input.cwd, record) : null;

  return cliOutput({
    command: "install x402-payment",
    plane: "operator",
    ok: proposal.status === "ready_to_install",
    warnings: [
      "Compiled local x402 posture only; trusted readiness requires control-plane install registration and gateway posture evidence.",
      "No greenlight, signer use, gateway check, or mutation was performed.",
    ],
    result: {
      ...record,
      localRecordRef: recordedRef,
    },
  });
}

export async function probesX402PaymentCommand(input: { cwd: string; postureValue: unknown; recordLocal: boolean }) {
  const posture = X402PaymentConformancePostureSchema.parse(input.postureValue);
  const report = await buildLocalProbeReport(input.cwd, posture);
  const recordedRef = input.recordLocal ? await writeLocalProbeReport(input.cwd, report) : null;

  return cliOutput({
    command: "probes x402-payment",
    plane: "operator",
    ok: report.passed,
    warnings: [
      "Probe report classifies caller-supplied gateway posture evidence; it is not provider certification, authority, or execution proof.",
    ],
    result: {
      ...report,
      localRecordRef: recordedRef,
    },
  });
}

export async function installHealthCommand(input: { cwd: string }) {
  let install: LocalX402InstallRecord | null = null;
  let probes: LocalX402ProbeReport | null = null;
  const reasonCodes: string[] = [];
  try {
    const config = await readLocalProjectConfig(input.cwd);
    const health = await readLocalX402Health(config);
    install = health.install;
    probes = health.probes;
    reasonCodes.push(...health.reasonCodes);
  } catch {
    reasonCodes.push("cli_project_config_missing");
  }

  return cliOutput({
    command: "install health",
    plane: "operator",
    ok: reasonCodes.length === 0,
    result: {
      healthScope: "pre_contract",
      contractKeyedProjectionStatus: "not_contract_keyed_yet",
      installHealthStatus: reasonCodes.length === 0 ? "local_posture_evidence_present" : "not_ready",
      reasonCodes: [...new Set(reasonCodes)].sort(),
      actionClass: install?.actionClass ?? "x402_payment.exact",
      installProposalRef: install?.installProposalRef ?? null,
      localProbeReportStatus: probes ? `local_classification_${probes.passed ? "passed" : "failed"}` : "missing",
      localProbeExpiresAt: probes?.expiresAt ?? null,
    },
  });
}

export function x402PaymentConformanceCommand(postureValue?: unknown) {
  const posture = postureValue
    ? X402PaymentConformancePostureSchema.parse(postureValue)
    : protectedSpendConformancePosture;
  const result = checkX402PaymentInstallConformance(posture);
  return cliOutput({
    command: "conformance x402-payment",
    plane: "operator",
    ok: result.passed,
    result: {
      profile: "protected-spend",
      adapterPackId: result.adapterPackId,
      passed: result.passed,
      requiredProbeKinds: result.requiredProbeKinds,
      reasonCodes: result.reasonCodes,
    },
  });
}

const protectedSpendConformancePosture = {
  signerCustodyStatus: "gateway_held",
  rawPrivateKeyEnvStatus: "absent",
  directCoreClientSigningStatus: "blocked",
  paidFetchClientStatus: "blocked",
  paidAxiosClientStatus: "absent",
  rawPaymentSignatureHeaderStatus: "blocked",
  siblingX402WrapperStatus: "blocked",
  mcpDirectPaymentStatus: "blocked",
  tokenPassthroughStatus: "blocked",
  wrapperDriftStatus: "absent",
  failureClosedStatus: "passed",
} as const satisfies X402PaymentConformancePosture;

function normalizeInstallInput(value: unknown): NormalizedInstallInput {
  const parsed = X402InstallCommandInputSchema.parse(value);
  if ("installInput" in parsed) {
    return {
      installInput: parsed.installInput,
      selectedPaymentRequirementIndex: parsed.selectedPaymentRequirementIndex,
      selectedPaymentRequirementDigest: parsed.selectedPaymentRequirementDigest as `sha256:${string}` | null,
    };
  }
  return {
    installInput: parsed,
    selectedPaymentRequirementIndex: null,
    selectedPaymentRequirementDigest: null,
  };
}

async function buildLocalInstallRecord(input: {
  cwd: string;
  proposal: X402InstallProposal;
  selectedPaymentRequirementIndex: number | null;
  selectedPaymentRequirementDigest: `sha256:${string}` | null;
}): Promise<LocalX402InstallRecord> {
  const project = await readLocalProjectConfig(input.cwd);
  const compiled = input.proposal.compiledRecords;
  return LocalX402InstallRecordSchema.parse({
    schemaVersion: CLI_X402_INSTALL_RECORD_SCHEMA_VERSION,
    projectId: project.projectId,
    recordedAt: new Date().toISOString(),
    installProposalRef: input.proposal.installProposalId,
    installDigest: input.proposal.installDigest,
    installStatus: input.proposal.status,
    adapterPackId: input.proposal.adapterPackId,
    actionClass: input.proposal.actionFamily,
    protectedSurfaceKind: input.proposal.protectedSurfaceKind,
    resourceRef: input.proposal.resourceRef,
    endpointDomain: input.proposal.endpointDomain,
    paymentRequirementsDigest: input.proposal.endpointEvidence.paymentRequirementsDigest,
    selectedPaymentRequirementIndex: input.selectedPaymentRequirementIndex,
    selectedPaymentRequirementDigest: input.selectedPaymentRequirementDigest,
    perCallAmountBound: input.proposal.spendBounds.maxAtomicAmountPerCall,
    spendWindowEnforcementStatus: input.proposal.spendBounds.spendWindowEnforcementStatus,
    gatewayAuthorityRefDigest: await digestCanonical({
      ref: input.proposal.walletGatewayProfile.authorityHolderRef,
    }),
    paymentCredentialRefDigest: await digestCanonical({
      ref: input.proposal.walletGatewayProfile.signerRef,
    }),
    credentialCustodyStatus: input.proposal.walletGatewayProfile.signerCustodyStatus,
    rawCredentialRefsIncluded: false,
    unsupportedX402Surfaces: x402FirstWedgeUnsupportedSurfaces,
    refusalReasonCodes: input.proposal.refusalReasonCodes,
    compiledRecordsIncluded: false,
    compiledRecordRefs: compiled
      ? {
          toolCapabilityRef: compiled.toolCapability.toolCapabilityId,
          actionTypeRef: compiled.actionType.actionTypeId,
          gatewayRegistryEntryRef: compiled.gatewayRegistryEntry.gatewayRegistryEntryId,
          operatingEnvelopeRef: compiled.operatingEnvelope.envelopeId,
        }
      : null,
    controlPlaneRegistrationRequired: true,
    controlPlaneRegistrationPerformed: false,
    readinessAuthority: "local_compilation",
    trustedInstallReadiness: false,
    nextReadinessAction: "register_control_plane_install",
    authorityCreated: false,
    gatewayCheckPerformed: false,
    mutationAttempted: false,
  });
}

async function buildLocalProbeReport(
  cwd: string,
  posture: X402PaymentConformancePosture,
): Promise<LocalX402ProbeReport> {
  const project = await readLocalProjectConfig(cwd);
  const observedAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  const scope = {
    tenantId: "tenant_cli_local",
    organizationId: "org_cli_local",
    runtimeAdapterId: "runtime_cli_local",
    gatewayId: "gateway_cli_local",
    actionClass: "x402_payment.exact",
    resourceRef: "x402:cli-local",
    protectedSurfaceKind: "x402_payment",
    expiresAt,
  };
  const coverage = await Promise.all(
    x402PaymentHostileBypassProbeExecutors({
      async readConformancePosture() {
        return posture;
      },
    }).map(async (executor) => {
      const result = await executor.execute(scope);
      return {
        probeKind: executor.probeKind,
        probeOutcome: result.probeOutcome,
        sourceAuthority: "local_classification",
        reasonCodes: result.reasonCodes,
        evidenceRefs: result.evidenceRefs,
      };
    }),
  );
  const conformance = checkX402PaymentInstallConformance(posture);
  return LocalX402ProbeReportSchema.parse({
    schemaVersion: CLI_X402_PROBE_REPORT_SCHEMA_VERSION,
    projectId: project.projectId,
    observedAt,
    expiresAt,
    adapterPackId: conformance.adapterPackId,
    actionClass: "x402_payment.exact",
    protectedSurfaceKind: "x402_payment",
    readinessAuthority: "local_classification",
    trustedReadiness: false,
    passed: conformance.passed && coverage.every((probe) => probe.probeOutcome === "passed"),
    reasonCodes: conformance.reasonCodes,
    probeCoverage: coverage,
    postureDigest: await digestCanonical(JSON.parse(JSON.stringify(posture)) as JsonValue),
    authorityCreated: false,
    gatewayCheckPerformed: false,
    mutationAttempted: false,
  });
}

async function writeLocalInstallRecord(cwd: string, record: LocalX402InstallRecord): Promise<string> {
  const project = await readLocalProjectConfig(cwd);
  const ref = join(project.stateRootRef, "projects", project.projectId, "x402", "install.json");
  await writeJson(ref, record);
  await updateLocalProjectConfig(cwd, { x402InstallRef: ref });
  return ref;
}

async function writeLocalProbeReport(cwd: string, report: LocalX402ProbeReport): Promise<string> {
  const project = await readLocalProjectConfig(cwd);
  const ref = join(project.stateRootRef, "projects", project.projectId, "x402", "probes.json");
  await writeJson(ref, report);
  await updateLocalProjectConfig(cwd, { x402ProbeReportRef: ref });
  return ref;
}

async function writeJson(path: string, value: unknown): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 });
}
