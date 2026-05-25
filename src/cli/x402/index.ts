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
import {
  X402_PROTECTED_TOOL_READINESS_VERSION,
  X402ProtectedToolReadinessSnapshotSchema,
  x402ProtectedToolReadinessAuthorityBoundary,
  type X402ProtectedToolReadinessRawSiblingPosture,
  type X402ProtectedToolReadinessSnapshot,
} from "../../adapters/x402-payment/protected-tool-readiness";
import { digestCanonical } from "../../protocol/foundation/canonical";
import { DigestSchema, type JsonValue } from "../../protocol/foundation/schema-core";
import {
  CLI_X402_GATEWAY_READINESS_SCHEMA_VERSION,
  CLI_X402_INSTALL_RECORD_SCHEMA_VERSION,
  CLI_X402_PROBE_REPORT_SCHEMA_VERSION,
  LocalX402GatewayReadinessRecordSchema,
  LocalX402InstallRecordSchema,
  LocalX402ProbeReportSchema,
  LocalX402ReadinessReportSchema,
  type LocalX402GatewayReadinessRecord,
  type LocalX402InstallRecord,
  type LocalX402ProbeReport,
  type LocalX402ReadinessReport,
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

const X402GatewayReadinessRegistrationInputSchema = z.strictObject({
  gatewayId: z.string().min(1).max(160),
  gatewayRegistrationRef: z.string().min(1).max(500),
  gatewayCredentialRefDigest: DigestSchema,
  gatewayCredentialCustodyStatus: z.enum(["gateway_held", "fixture_gateway_held"]),
  gatewayCustodyProofPacketRef: z.string().min(1).max(500),
  gatewayCustodyProofPacketDigest: DigestSchema,
  gatewayCustodyClaimLevel: z.enum(["local_fixture", "customer_gateway_evidence", "provider_gateway_evidence"]),
  gatewayCustodyExternalVerificationStatus: z.enum([
    "not_required",
    "required_before_live_claim",
    "verified_by_official_source",
  ]),
  gatewayCustodyProofExpiresAt: z.string().datetime({ offset: true }),
  gatewayPosture: z.enum(["online", "offline", "unknown"]),
  policyVersionRef: z.string().min(1).max(500),
  policyVersionDigest: DigestSchema,
  expiresAt: z.string().datetime({ offset: true }),
  evidenceRefs: z.array(z.string().min(1).max(500)).max(32).default([]),
});

type NormalizedInstallInput = {
  installInput: z.infer<typeof X402InstallProposalInputSchema>;
  selectedPaymentRequirementIndex: number | null;
  selectedPaymentRequirementDigest: `sha256:${string}` | null;
};

type X402GatewayReadinessRegistrationInput = z.infer<typeof X402GatewayReadinessRegistrationInputSchema>;

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
    reasonCodes: record.refusalReasonCodes,
    nextAction: record.nextReadinessAction,
    retryability: proposal.status === "ready_to_install" ? "not_retryable" : "retryable_after_fix",
    redactionProfileRef: "cli-x402-install:v1-redacted",
    evidenceRefs: [recordedRef].filter((ref): ref is string => typeof ref === "string"),
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
    reasonCodes: report.reasonCodes,
    nextAction: report.passed ? "read_result" : "fix_install",
    retryability: report.passed ? "not_retryable" : "retryable_after_fix",
    redactionProfileRef: "cli-x402-probes:v1-redacted",
    evidenceRefs: [recordedRef].filter((ref): ref is string => typeof ref === "string"),
    warnings: [
      "Probe report classifies caller-supplied gateway posture evidence; it is not provider certification, authority, or execution proof.",
    ],
    result: {
      ...report,
      localRecordRef: recordedRef,
    },
  });
}

export async function registerX402GatewayReadinessCommand(input: {
  cwd: string;
  inputValue: unknown;
  recordLocal: boolean;
}) {
  const registration = X402GatewayReadinessRegistrationInputSchema.parse(input.inputValue);
  const outcome = await buildLocalGatewayReadinessRecord(input.cwd, registration);
  const recordedRef =
    outcome.record && input.recordLocal ? await writeLocalGatewayReadinessRecord(input.cwd, outcome.record) : null;

  return cliOutput({
    command: "register x402-gateway-readiness",
    plane: "operator",
    ok: outcome.record !== null,
    reasonCodes: outcome.reasonCodes,
    nextAction: outcome.record ? "read_result" : outcome.nextAction,
    retryability: outcome.record ? "not_retryable" : "retryable_after_fix",
    redactionProfileRef: "cli-x402-gateway-readiness:v1-redacted",
    evidenceRefs: [recordedRef, ...(outcome.record?.evidenceRefs ?? [])].filter(
      (ref): ref is string => typeof ref === "string",
    ),
    warnings: [
      "Trusted readiness binds pre-contract install, probe, gateway, policy, and credential posture only.",
      "No greenlight, signer use, gateway check, payment payload, or mutation was performed.",
    ],
    result: outcome.record
      ? { ...outcome.record, localRecordRef: recordedRef }
      : {
          readinessScope: "pre_contract",
          actionClass: "x402_payment.exact",
          protectedSurfaceKind: "x402_payment",
          readinessAuthority: "control_plane_registration",
          trustedReadiness: false,
          reasonCodes: outcome.reasonCodes,
          authorityCreated: false,
          greenlightCreated: false,
          gatewayCheckPerformed: false,
          mutationAttempted: false,
        },
  });
}

export async function installHealthCommand(input: { cwd: string }) {
  let install: LocalX402InstallRecord | null = null;
  let probes: LocalX402ProbeReport | null = null;
  let gatewayReadiness: LocalX402GatewayReadinessRecord | null = null;
  const reasonCodes: string[] = [];
  let projectConfigPresent = true;
  try {
    const config = await readLocalProjectConfig(input.cwd);
    const health = await readLocalX402Health(config);
    install = health.install;
    probes = health.probes;
    gatewayReadiness = health.gatewayReadiness;
    reasonCodes.push(...health.reasonCodes);
  } catch {
    projectConfigPresent = false;
    reasonCodes.push("cli_project_config_missing");
  }
  const readinessReport = buildLocalReadinessReport({
    projectConfigPresent,
    install,
    probes,
    gatewayReadiness,
    reasonCodes: [...new Set(reasonCodes)].sort(),
  });

  return cliOutput({
    command: "install health",
    plane: "operator",
    ok: reasonCodes.length === 0,
    reasonCodes: [...new Set(reasonCodes)].sort(),
    nextAction: reasonCodes.length === 0 ? "read_result" : "fix_install",
    retryability: reasonCodes.length === 0 ? "not_retryable" : "retryable_after_fix",
    redactionProfileRef: "cli-install-health:v1-redacted",
    result: {
      healthScope: "pre_contract",
      contractKeyedProjectionStatus: "not_contract_keyed_yet",
      installHealthStatus: readinessReport.trustedReadiness
        ? "trusted_gateway_ready"
        : reasonCodes.length === 0
          ? "local_posture_evidence_present"
          : "not_ready",
      reasonCodes: [...new Set(reasonCodes)].sort(),
      actionClass: install?.actionClass ?? "x402_payment.exact",
      installProposalRef: install?.installProposalRef ?? null,
      localProbeReportStatus: probes ? `local_classification_${probes.passed ? "passed" : "failed"}` : "missing",
      localProbeExpiresAt: probes?.expiresAt ?? null,
      gatewayReadinessRef: gatewayReadiness?.protectedToolReadiness.gatewayReadinessRef ?? null,
      readinessReport,
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
    reasonCodes: result.reasonCodes,
    nextAction: result.passed ? "read_result" : "fix_install",
    retryability: result.passed ? "not_retryable" : "retryable_after_fix",
    redactionProfileRef: "cli-x402-conformance:v1-redacted",
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

async function buildLocalGatewayReadinessRecord(
  cwd: string,
  registration: X402GatewayReadinessRegistrationInput,
): Promise<{
  record: LocalX402GatewayReadinessRecord | null;
  reasonCodes: string[];
  nextAction: "fix_install" | "register_control_plane_install";
}> {
  const config = await readLocalProjectConfig(cwd);
  const health = await readLocalX402Health(config, Date.now(), {
    requireTrustedGatewayReadiness: false,
    readTrustedGatewayReadiness: false,
  });
  const reasonCodes = new Set<string>();
  for (const reason of health.reasonCodes) reasonCodes.add(reason);
  if (!health.install) reasonCodes.add("cli_install_not_configured");
  if (health.install?.installStatus !== "ready_to_install") reasonCodes.add("cli_install_not_ready");
  if (!health.probes) reasonCodes.add("cli_gateway_posture_unknown");
  if (health.probes && !health.probes.passed) reasonCodes.add("cli_gateway_posture_probe_failed");
  if (registration.gatewayPosture !== "online") reasonCodes.add("cli_gateway_posture_unknown");
  if (!["gateway_held", "fixture_gateway_held"].includes(registration.gatewayCredentialCustodyStatus)) {
    reasonCodes.add("cli_install_not_ready");
  }
  if (!health.install?.selectedPaymentRequirementDigest) {
    reasonCodes.add("cli_selected_payment_requirement_missing");
  }
  if (
    registration.gatewayCredentialCustodyStatus === "gateway_held" &&
    (registration.gatewayCustodyClaimLevel === "local_fixture" ||
      registration.gatewayCustodyExternalVerificationStatus !== "verified_by_official_source")
  ) {
    reasonCodes.add("cli_gateway_custody_proof_unverified");
  }
  if (
    registration.gatewayCredentialCustodyStatus === "fixture_gateway_held" &&
    (registration.gatewayCustodyClaimLevel !== "local_fixture" ||
      registration.gatewayCustodyExternalVerificationStatus !== "not_required")
  ) {
    reasonCodes.add("cli_gateway_custody_proof_unverified");
  }
  if (Date.parse(registration.gatewayCustodyProofExpiresAt) < Date.parse(registration.expiresAt)) {
    reasonCodes.add("cli_gateway_custody_proof_stale");
  }
  if (!health.install?.compiledRecordRefs) reasonCodes.add("cli_install_not_ready");

  const sortedReasonCodes = [...reasonCodes].sort();
  if (
    sortedReasonCodes.length > 0 ||
    !health.install ||
    !health.probes ||
    !config.x402ProbeReportRef ||
    !health.install.compiledRecordRefs ||
    !health.install.selectedPaymentRequirementDigest
  ) {
    return {
      record: null,
      reasonCodes: sortedReasonCodes,
      nextAction: "fix_install",
    };
  }

  const recordedAt = new Date().toISOString();
  const gatewayReadinessRef = localGatewayReadinessRecordRef(config);
  const rawSiblingProofRefs = rawSiblingProofRefsForProbes(health.probes);
  const installWithSelectedPaymentRequirement = {
    ...health.install,
    selectedPaymentRequirementDigest: health.install.selectedPaymentRequirementDigest,
  } as LocalX402InstallRecord & { selectedPaymentRequirementDigest: string };
  const protectedToolReadiness = await buildProtectedToolReadinessSnapshot({
    projectId: config.projectId,
    gatewayReadinessRef,
    install: installWithSelectedPaymentRequirement,
    probes: health.probes,
    probeReportRef: config.x402ProbeReportRef,
    rawSiblingProofRefs,
    registration,
    gatewayRegistryEntryRef: health.install.compiledRecordRefs.gatewayRegistryEntryRef,
    operatingEnvelopeRef: health.install.compiledRecordRefs.operatingEnvelopeRef,
  });

  return {
    record: LocalX402GatewayReadinessRecordSchema.parse({
      schemaVersion: CLI_X402_GATEWAY_READINESS_SCHEMA_VERSION,
      projectId: config.projectId,
      recordedAt,
      expiresAt: registration.expiresAt,
      readinessScope: "pre_contract",
      adapterPackId: health.install.adapterPackId,
      actionClass: "x402_payment.exact",
      protectedSurfaceKind: "x402_payment",
      readinessAuthority: "control_plane_registration",
      trustedReadiness: true,
      installProposalRef: health.install.installProposalRef,
      installDigest: health.install.installDigest,
      probeReportRef: config.x402ProbeReportRef,
      probePostureDigest: health.probes.postureDigest,
      paymentRequirementsDigest: health.install.paymentRequirementsDigest,
      selectedPaymentRequirementDigest: installWithSelectedPaymentRequirement.selectedPaymentRequirementDigest,
      protectedToolReadiness,
      gatewayId: registration.gatewayId,
      gatewayRegistrationRef: registration.gatewayRegistrationRef,
      gatewayCredentialRefDigest: registration.gatewayCredentialRefDigest,
      gatewayCredentialCustodyStatus: registration.gatewayCredentialCustodyStatus,
      gatewayCustodyProofPacketRef: registration.gatewayCustodyProofPacketRef,
      gatewayCustodyProofPacketDigest: registration.gatewayCustodyProofPacketDigest,
      gatewayCustodyClaimLevel: registration.gatewayCustodyClaimLevel,
      gatewayCustodyExternalVerificationStatus: registration.gatewayCustodyExternalVerificationStatus,
      gatewayCustodyProofExpiresAt: registration.gatewayCustodyProofExpiresAt,
      gatewayPosture: "online",
      policyVersionRef: registration.policyVersionRef,
      policyVersionDigest: registration.policyVersionDigest,
      gatewayRegistryEntryRef: health.install.compiledRecordRefs.gatewayRegistryEntryRef,
      operatingEnvelopeRef: health.install.compiledRecordRefs.operatingEnvelopeRef,
      evidenceRefs: registration.evidenceRefs,
      rawCredentialRefsIncluded: false,
      controlPlaneRegistrationPerformed: true,
      authorityCreated: false,
      greenlightCreated: false,
      gatewayCheckPerformed: false,
      mutationAttempted: false,
    }),
    reasonCodes: [],
    nextAction: "register_control_plane_install",
  };
}

function buildLocalReadinessReport(input: {
  projectConfigPresent: boolean;
  install: LocalX402InstallRecord | null;
  probes: LocalX402ProbeReport | null;
  gatewayReadiness: LocalX402GatewayReadinessRecord | null;
  reasonCodes: string[];
}): LocalX402ReadinessReport {
  const proofGapPostures = localReadinessProofGapPostures(input);
  const trustedReady = input.gatewayReadiness !== null && input.reasonCodes.length === 0;
  const readinessStatus = trustedReady
    ? "trusted_gateway_ready"
    : input.install?.installStatus === "ready_to_install" &&
        input.probes?.passed === true &&
        !input.reasonCodes.includes("cli_gateway_posture_stale")
      ? "local_posture_evidence_present"
      : "not_ready";

  return LocalX402ReadinessReportSchema.parse({
    schemaVersion: "handshake.cli.x402-readiness.v1",
    readinessScope: "pre_contract",
    actionClass: "x402_payment.exact",
    protectedSurfaceKind: "x402_payment",
    readinessAuthority: "local_cli",
    readinessStatus,
    proofLevel: trustedReady
      ? "control_plane_registration"
      : input.probes
        ? "local_classification"
        : input.install
          ? "local_compilation"
          : "none",
    trustedReadiness: trustedReady,
    requiredNextMechanism: localReadinessNextMechanism(input),
    gatewayReadinessRef: input.gatewayReadiness?.protectedToolReadiness.gatewayReadinessRef ?? null,
    gatewayId: input.gatewayReadiness?.gatewayId ?? null,
    gatewayCustodyProofPacketRef: input.gatewayReadiness?.gatewayCustodyProofPacketRef ?? null,
    policyVersionRef: input.gatewayReadiness?.policyVersionRef ?? null,
    protectedToolReadiness: input.gatewayReadiness?.protectedToolReadiness ?? null,
    checks: {
      projectConfig: input.projectConfigPresent ? "present" : "missing",
      installCompilation: input.install?.installStatus ?? "missing",
      controlPlaneRegistration: input.gatewayReadiness
        ? "registered"
        : input.install
          ? "required_not_performed"
          : "missing",
      signerCustody: input.install?.credentialCustodyStatus ?? "missing",
      custodyProof: localCustodyProofPosture(input),
      gatewayPosture: localGatewayPosture(input),
      policyVersion: input.gatewayReadiness ? "registered" : input.install ? "local_metadata_only" : "unknown",
      probeFreshness: localProbeFreshness(input),
    },
    proofGapPostures,
    proofGapReasonCodes: input.reasonCodes,
    nonClaims: [
      "local posture evidence is not trusted gateway readiness",
      "control-plane install registration has not been performed",
      "no greenlight, gateway check, signer use, or mutation was performed",
      "aggregate spend-window enforcement remains unsupported",
    ],
    authorityCreated: false,
    gatewayCheckPerformed: false,
    mutationAttempted: false,
  });
}

function localReadinessProofGapPostures(input: {
  projectConfigPresent: boolean;
  install: LocalX402InstallRecord | null;
  probes: LocalX402ProbeReport | null;
  gatewayReadiness: LocalX402GatewayReadinessRecord | null;
  reasonCodes: string[];
}): LocalX402ReadinessReport["proofGapPostures"] {
  const postures = new Set<LocalX402ReadinessReport["proofGapPostures"][number]>();
  if (!input.projectConfigPresent) postures.add("project_config_missing");
  if (!input.install) {
    postures.add("install_missing");
  } else if (input.install.installStatus !== "ready_to_install") {
    postures.add("install_refused");
  }
  if (!input.probes) {
    postures.add("probe_missing");
  } else {
    if (!input.probes.passed) postures.add("probe_failed");
    if (input.reasonCodes.includes("cli_gateway_posture_stale")) postures.add("probe_stale");
  }
  if (input.install && !input.gatewayReadiness) {
    postures.add("control_plane_registration_missing");
  }
  if (!input.gatewayReadiness) postures.add("trusted_gateway_posture_missing");
  if (input.gatewayReadiness && input.reasonCodes.includes("cli_gateway_posture_unknown")) {
    postures.add("trusted_gateway_posture_invalid");
  }
  if (input.gatewayReadiness && input.reasonCodes.includes("cli_gateway_readiness_stale")) {
    postures.add("trusted_gateway_posture_stale");
  }
  if (!input.gatewayReadiness) {
    postures.add("custody_proof_missing");
  }
  if (input.reasonCodes.includes("cli_gateway_custody_proof_unverified")) {
    postures.add("custody_proof_unverified");
  }
  if (input.reasonCodes.includes("cli_gateway_custody_proof_stale")) {
    postures.add("custody_proof_stale");
  }
  return [...postures].sort();
}

function localReadinessNextMechanism(input: {
  projectConfigPresent: boolean;
  install: LocalX402InstallRecord | null;
  probes: LocalX402ProbeReport | null;
  gatewayReadiness: LocalX402GatewayReadinessRecord | null;
  reasonCodes: string[];
}): LocalX402ReadinessReport["requiredNextMechanism"] {
  if (!input.projectConfigPresent) return "initialize_project";
  if (!input.install || input.install.installStatus !== "ready_to_install") return "compile_install";
  if (!input.probes || !input.probes.passed || input.reasonCodes.includes("cli_gateway_posture_stale")) {
    return "record_probe_report";
  }
  if (input.gatewayReadiness && input.reasonCodes.length === 0) return "ready_for_runtime_facade";
  return "register_control_plane_install";
}

function localGatewayPosture(input: {
  probes: LocalX402ProbeReport | null;
  gatewayReadiness: LocalX402GatewayReadinessRecord | null;
  reasonCodes: string[];
}): LocalX402ReadinessReport["checks"]["gatewayPosture"] {
  if (input.gatewayReadiness && input.reasonCodes.includes("cli_gateway_posture_unknown")) return "unknown";
  if (input.gatewayReadiness && !input.reasonCodes.includes("cli_gateway_readiness_stale")) return "registered_online";
  if (!input.probes) return "unknown";
  if (
    input.reasonCodes.includes("cli_gateway_posture_stale") ||
    input.reasonCodes.includes("cli_gateway_readiness_stale")
  ) {
    return "stale";
  }
  return input.probes.passed ? "local_classification_passed" : "local_classification_failed";
}

function localCustodyProofPosture(input: {
  gatewayReadiness: LocalX402GatewayReadinessRecord | null;
  reasonCodes: string[];
}): LocalX402ReadinessReport["checks"]["custodyProof"] {
  if (input.reasonCodes.includes("cli_gateway_custody_proof_stale")) return "stale";
  if (input.reasonCodes.includes("cli_gateway_custody_proof_unverified")) return "unverified";
  return input.gatewayReadiness ? "registered" : "missing";
}

function localProbeFreshness(input: {
  probes: LocalX402ProbeReport | null;
  reasonCodes: string[];
}): LocalX402ReadinessReport["checks"]["probeFreshness"] {
  if (!input.probes) return "missing";
  return input.reasonCodes.includes("cli_gateway_posture_stale") ? "stale" : "fresh";
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

async function writeLocalGatewayReadinessRecord(cwd: string, record: LocalX402GatewayReadinessRecord): Promise<string> {
  const project = await readLocalProjectConfig(cwd);
  const ref = localGatewayReadinessRecordRef(project);
  await writeJson(ref, record);
  await updateLocalProjectConfig(cwd, { x402GatewayReadinessRef: ref });
  return ref;
}

function localGatewayReadinessRecordRef(project: { stateRootRef: string; projectId: string }): string {
  return join(project.stateRootRef, "projects", project.projectId, "x402", "gateway-readiness.json");
}

async function buildProtectedToolReadinessSnapshot(input: {
  projectId: string;
  gatewayReadinessRef: string;
  install: LocalX402InstallRecord & { selectedPaymentRequirementDigest: string };
  probes: LocalX402ProbeReport;
  probeReportRef: string;
  rawSiblingProofRefs: string[];
  registration: X402GatewayReadinessRegistrationInput;
  gatewayRegistryEntryRef: string;
  operatingEnvelopeRef: string;
}): Promise<X402ProtectedToolReadinessSnapshot> {
  const gatewayReadinessDigest = await digestCanonical({
    projectId: input.projectId,
    gatewayReadinessRef: input.gatewayReadinessRef,
    installProposalRef: input.install.installProposalRef,
    installDigest: input.install.installDigest,
    probeReportRef: input.probeReportRef,
    probePostureDigest: input.probes.postureDigest,
    paymentRequirementsDigest: input.install.paymentRequirementsDigest,
    selectedPaymentRequirementDigest: input.install.selectedPaymentRequirementDigest,
    gatewayId: input.registration.gatewayId,
    gatewayRegistrationRef: input.registration.gatewayRegistrationRef,
    gatewayCredentialRefDigest: input.registration.gatewayCredentialRefDigest,
    gatewayCredentialCustodyStatus: input.registration.gatewayCredentialCustodyStatus,
    gatewayCustodyProofPacketDigest: input.registration.gatewayCustodyProofPacketDigest,
    gatewayCustodyClaimLevel: input.registration.gatewayCustodyClaimLevel,
    gatewayCustodyExternalVerificationStatus: input.registration.gatewayCustodyExternalVerificationStatus,
    gatewayCustodyProofExpiresAt: input.registration.gatewayCustodyProofExpiresAt,
    policyVersionRef: input.registration.policyVersionRef,
    policyVersionDigest: input.registration.policyVersionDigest,
    gatewayRegistryEntryRef: input.gatewayRegistryEntryRef,
    operatingEnvelopeRef: input.operatingEnvelopeRef,
    expiresAt: input.registration.expiresAt,
    readinessScope: "pre_contract",
  });

  return X402ProtectedToolReadinessSnapshotSchema.parse({
    schemaVersion: X402_PROTECTED_TOOL_READINESS_VERSION,
    readinessStatus: "trusted_gateway_ready",
    readinessScope: "pre_contract",
    readinessProofLevel: "control_plane_registration",
    trustedReadiness: true,
    requiredNextMechanism: "ready_for_runtime_facade",
    gatewayReadinessRef: input.gatewayReadinessRef,
    gatewayReadinessDigest,
    readinessExpiresAt: input.registration.expiresAt,
    installDigest: input.install.installDigest,
    probePostureDigest: input.probes.postureDigest,
    paymentRequirementsDigest: input.install.paymentRequirementsDigest,
    selectedPaymentRequirementDigest: input.install.selectedPaymentRequirementDigest,
    gatewayId: input.registration.gatewayId,
    gatewayRegistrationRef: input.registration.gatewayRegistrationRef,
    gatewayCredentialRefDigest: input.registration.gatewayCredentialRefDigest,
    gatewayCredentialCustodyStatus: input.registration.gatewayCredentialCustodyStatus,
    gatewayCustodyProofPacketRef: input.registration.gatewayCustodyProofPacketRef,
    gatewayCustodyProofPacketDigest: input.registration.gatewayCustodyProofPacketDigest,
    gatewayCustodyClaimLevel: input.registration.gatewayCustodyClaimLevel,
    gatewayCustodyExternalVerificationStatus: input.registration.gatewayCustodyExternalVerificationStatus,
    gatewayCustodyProofExpiresAt: input.registration.gatewayCustodyProofExpiresAt,
    gatewayPosture: "online",
    policyVersionRef: input.registration.policyVersionRef,
    policyVersionDigest: input.registration.policyVersionDigest,
    gatewayRegistryEntryRef: input.gatewayRegistryEntryRef,
    operatingEnvelopeRef: input.operatingEnvelopeRef,
    rawCredentialRefsIncluded: false,
    rawSiblingPosture: rawSiblingPostureForProbes(input.probes),
    rawSiblingProofRefs: input.rawSiblingProofRefs,
    authorityBoundary: x402ProtectedToolReadinessAuthorityBoundary,
    proofGapReasonCodes: [],
    evidenceRefs: uniqueBounded(
      [
        input.gatewayReadinessRef,
        input.probeReportRef,
        input.install.installProposalRef,
        input.registration.gatewayRegistrationRef,
        input.registration.gatewayCustodyProofPacketRef,
        input.registration.policyVersionRef,
        ...input.registration.evidenceRefs,
        ...input.rawSiblingProofRefs,
      ],
      32,
    ),
  });
}

function rawSiblingPostureForProbes(probes: LocalX402ProbeReport): X402ProtectedToolReadinessRawSiblingPosture {
  return probes.probeCoverage.some(
    (probe) => probe.probeKind === "raw_sibling_blocking" && probe.probeOutcome === "passed",
  )
    ? "named_not_controlled"
    : "unknown";
}

function rawSiblingProofRefsForProbes(probes: LocalX402ProbeReport): string[] {
  const rawSiblingProbeKinds = new Set([
    "raw_sibling_blocking",
    "mcp_direct_call_blocking",
    "token_passthrough_blocking",
    "wrapper_drift",
  ]);
  return uniqueBounded(
    probes.probeCoverage.flatMap((probe) => (rawSiblingProbeKinds.has(probe.probeKind) ? probe.evidenceRefs : [])),
    32,
  );
}

function uniqueBounded(values: string[], max: number): string[] {
  return [...new Set(values)].slice(0, max);
}

async function writeJson(path: string, value: unknown): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 });
}
