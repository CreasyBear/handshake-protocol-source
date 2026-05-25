import { chmod, lstat, mkdir, readFile, realpath, stat, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";
import { z } from "zod";
import { digestCanonical } from "../../protocol/foundation/canonical";
import {
  LocalX402GatewayReadinessRecordSchema,
  LocalX402InstallRecordSchema,
  LocalX402ProbeReportSchema,
} from "../x402/local-state";

export const CLI_LOCAL_PROJECT_SCHEMA_VERSION = "handshake.cli.local-project.v1" as const;

export const cliRoleNames = ["control_plane", "runtime_evidence", "gateway_custody", "review_custody"] as const;
export type CliRoleName = (typeof cliRoleNames)[number];

const LocalProjectConfigSchema = z.strictObject({
  schemaVersion: z.literal(CLI_LOCAL_PROJECT_SCHEMA_VERSION),
  projectId: z.string().min(1),
  workspaceRef: z.string().min(1),
  stateRootRef: z.string().min(1),
  trustBundleRef: z.string().min(1).nullable(),
  roleCredentialProfileRef: z.string().min(1).nullable(),
  x402InstallRef: z.string().min(1).optional(),
  x402ProbeReportRef: z.string().min(1).optional(),
  x402GatewayReadinessRef: z.string().min(1).optional(),
});

export type LocalProjectConfig = z.infer<typeof LocalProjectConfigSchema>;

const LocalRoleCredentialProfileSchema = z.strictObject({
  schemaVersion: z.literal("handshake.cli.role-credential-profile.v1"),
  projectId: z.string().min(1),
  roleCredentialRefs: z.record(z.enum(cliRoleNames), z.string().min(1)),
  credentialValuesCreatedByCli: z.literal(false),
});

type LocalRoleCredentialProfile = z.infer<typeof LocalRoleCredentialProfileSchema>;

export type InitLocalProjectInput = {
  cwd: string;
  stateRoot?: string;
  projectId?: string;
};

export type InitLocalProjectResult = {
  projectId: string;
  configRef: string;
  workspaceRef: string;
  stateRootRef: string;
  roleCredentialValuesCreatedByCli: false;
  roleCredentialProvisioningRequired: readonly CliRoleName[];
  trustBundleRef: string;
  secretMaterialPrinted: false;
};

export type DoctorReasonCode =
  | "cli_gateway_custody_proof_stale"
  | "cli_gateway_custody_proof_unverified"
  | "cli_gateway_posture_probe_failed"
  | "cli_gateway_posture_stale"
  | "cli_gateway_readiness_stale"
  | "cli_install_not_configured"
  | "cli_install_not_ready"
  | "cli_selected_payment_requirement_missing"
  | "cli_gateway_posture_unknown"
  | "cli_project_config_missing"
  | "cli_role_credential_profile_missing"
  | "cli_role_token_refs_not_distinct"
  | "cli_state_root_inside_workspace"
  | "cli_token_ref_inside_workspace"
  | "cli_token_ref_missing"
  | "cli_token_ref_permissions_unsafe"
  | "cli_token_ref_symlink"
  | "cli_trust_bundle_missing";

export type DoctorResult = {
  status: "ready" | "not_ready";
  reasonCodes: DoctorReasonCode[];
  projectId: string | null;
  configRef: string;
  workspaceRef: string;
  stateRootRef: string | null;
  roleCredentialPosture: RoleCredentialPosture[];
  trustBundleRef: string | null;
  x402InstallRef: string | null;
  x402ProbeReportRef: string | null;
  x402GatewayReadinessRef: string | null;
  checkedRoles: readonly CliRoleName[];
};

export type RoleCredentialPosture = {
  role: CliRoleName;
  refDigest: `sha256:${string}` | null;
  configured: boolean;
  present: boolean;
  storagePosture: "missing" | "safe_external_file" | "inside_workspace" | "symlink" | "unsafe_permissions";
};

export type LocalX402Health = {
  install: z.infer<typeof LocalX402InstallRecordSchema> | null;
  probes: z.infer<typeof LocalX402ProbeReportSchema> | null;
  gatewayReadiness: z.infer<typeof LocalX402GatewayReadinessRecordSchema> | null;
  reasonCodes: DoctorReasonCode[];
};

export async function initializeLocalProject(input: InitLocalProjectInput): Promise<InitLocalProjectResult> {
  const workspaceRef = resolve(input.cwd);
  const projectId = input.projectId ?? `local-${crypto.randomUUID()}`;
  const stateRootRef = resolve(input.stateRoot ?? defaultStateRoot());
  const projectStateRef = join(stateRootRef, "projects", projectId);
  const tokenRootRef = join(projectStateRef, "tokens");
  const trustBundleRef = join(projectStateRef, "trust-bundle.json");
  const roleCredentialProfileRef = join(projectStateRef, "role-credential-profile.json");
  const roleCredentialRefs = Object.fromEntries(
    cliRoleNames.map((role) => [role, join(tokenRootRef, `${role}.token`)]),
  ) as Record<CliRoleName, string>;

  await mkdir(projectStateRef, { recursive: true });
  await writeFile(
    roleCredentialProfileRef,
    `${JSON.stringify(
      LocalRoleCredentialProfileSchema.parse({
        schemaVersion: "handshake.cli.role-credential-profile.v1",
        projectId,
        roleCredentialRefs,
        credentialValuesCreatedByCli: false,
      }),
      null,
      2,
    )}\n`,
    { mode: 0o600 },
  );
  await chmod(roleCredentialProfileRef, 0o600);
  await writeFile(trustBundleRef, `${JSON.stringify({ keys: [], allowDevHmac: false }, null, 2)}\n`, { mode: 0o600 });
  await chmod(trustBundleRef, 0o600);

  const configRef = localProjectConfigRef(workspaceRef);
  await mkdir(dirname(configRef), { recursive: true });
  const config: LocalProjectConfig = {
    schemaVersion: CLI_LOCAL_PROJECT_SCHEMA_VERSION,
    projectId,
    workspaceRef,
    stateRootRef,
    trustBundleRef,
    roleCredentialProfileRef,
  };
  await writeFile(configRef, `${JSON.stringify(config, null, 2)}\n`, { mode: 0o600 });

  return {
    projectId,
    configRef,
    workspaceRef,
    stateRootRef,
    roleCredentialValuesCreatedByCli: false,
    roleCredentialProvisioningRequired: cliRoleNames,
    trustBundleRef,
    secretMaterialPrinted: false,
  };
}

export async function doctorLocalProject(cwd: string): Promise<DoctorResult> {
  const workspaceRef = resolve(cwd);
  const configRef = localProjectConfigRef(workspaceRef);
  const reasonCodes = new Set<DoctorReasonCode>();
  let config: LocalProjectConfig | null = null;

  try {
    config = LocalProjectConfigSchema.parse(JSON.parse(await readFile(configRef, "utf8")));
  } catch {
    reasonCodes.add("cli_project_config_missing");
  }

  if (!config) {
    return {
      status: "not_ready",
      reasonCodes: [...reasonCodes].sort(),
      projectId: null,
      configRef,
      workspaceRef,
      stateRootRef: null,
      roleCredentialPosture: [],
      trustBundleRef: null,
      x402InstallRef: null,
      x402ProbeReportRef: null,
      x402GatewayReadinessRef: null,
      checkedRoles: cliRoleNames,
    };
  }

  if (await pathIsInside(config.stateRootRef, workspaceRef)) reasonCodes.add("cli_state_root_inside_workspace");

  const roleCredentialPosture = await checkRoleCredentialPosture(config, workspaceRef, reasonCodes);

  if (!config.trustBundleRef) {
    reasonCodes.add("cli_trust_bundle_missing");
  } else {
    try {
      await stat(config.trustBundleRef);
    } catch {
      reasonCodes.add("cli_trust_bundle_missing");
    }
  }

  const x402Health = await readLocalX402Health(config);
  for (const reason of x402Health.reasonCodes) reasonCodes.add(reason);

  return {
    status: reasonCodes.size === 0 ? "ready" : "not_ready",
    reasonCodes: [...reasonCodes].sort(),
    projectId: config.projectId,
    configRef,
    workspaceRef,
    stateRootRef: config.stateRootRef,
    roleCredentialPosture,
    trustBundleRef: config.trustBundleRef,
    x402InstallRef: config.x402InstallRef ?? null,
    x402ProbeReportRef: config.x402ProbeReportRef ?? null,
    x402GatewayReadinessRef: config.x402GatewayReadinessRef ?? null,
    checkedRoles: cliRoleNames,
  };
}

export function localProjectConfigRef(cwd: string): string {
  return join(resolve(cwd), ".handshake", "project.json");
}

export async function readLocalProjectConfig(cwd: string): Promise<LocalProjectConfig> {
  return LocalProjectConfigSchema.parse(JSON.parse(await readFile(localProjectConfigRef(cwd), "utf8")));
}

export async function updateLocalProjectConfig(
  cwd: string,
  updates: Partial<Pick<LocalProjectConfig, "x402InstallRef" | "x402ProbeReportRef" | "x402GatewayReadinessRef">>,
): Promise<LocalProjectConfig> {
  const config = { ...(await readLocalProjectConfig(cwd)), ...updates };
  const configRef = localProjectConfigRef(cwd);
  await writeFile(configRef, `${JSON.stringify(LocalProjectConfigSchema.parse(config), null, 2)}\n`, { mode: 0o600 });
  await chmod(configRef, 0o600);
  return config;
}

export async function readLocalX402Health(
  config: LocalProjectConfig,
  now = Date.now(),
  options: { requireTrustedGatewayReadiness?: boolean; readTrustedGatewayReadiness?: boolean } = {},
): Promise<LocalX402Health> {
  const requireTrustedGatewayReadiness = options.requireTrustedGatewayReadiness ?? true;
  const readTrustedGatewayReadiness = options.readTrustedGatewayReadiness ?? true;
  const reasonCodes = new Set<DoctorReasonCode>();
  const install = await readLocalX402Install(config, reasonCodes);
  const probes = await readLocalX402Probes(config, reasonCodes, now);
  const gatewayReadiness = readTrustedGatewayReadiness
    ? await readLocalX402GatewayReadiness(config, install, probes, reasonCodes, now, {
        reportMissing: requireTrustedGatewayReadiness,
      })
    : null;
  return {
    install,
    probes,
    gatewayReadiness,
    reasonCodes: [...reasonCodes].sort(),
  };
}

function defaultStateRoot(): string {
  return join(process.env.XDG_STATE_HOME ?? join(homedir(), ".local", "state"), "handshake");
}

async function checkRoleCredentialPosture(
  config: LocalProjectConfig,
  workspaceRef: string,
  reasonCodes: Set<DoctorReasonCode>,
): Promise<RoleCredentialPosture[]> {
  const profile = await readRoleCredentialProfile(config, reasonCodes);
  if (!profile) {
    return cliRoleNames.map((role) => ({
      role,
      refDigest: null,
      configured: false,
      present: false,
      storagePosture: "missing",
    }));
  }

  const refs = Object.values(profile.roleCredentialRefs);
  if (new Set(refs).size !== cliRoleNames.length) reasonCodes.add("cli_role_token_refs_not_distinct");

  const postures: RoleCredentialPosture[] = [];
  for (const role of cliRoleNames) {
    const tokenRef = profile.roleCredentialRefs[role];
    const refDigest = await digestCanonical({ role, tokenRef });
    if (await pathIsInside(tokenRef, workspaceRef)) {
      reasonCodes.add("cli_token_ref_inside_workspace");
      postures.push({ role, refDigest, configured: true, present: true, storagePosture: "inside_workspace" });
      continue;
    }
    try {
      const tokenStat = await lstat(tokenRef);
      if (tokenStat.isSymbolicLink()) {
        reasonCodes.add("cli_token_ref_symlink");
        postures.push({ role, refDigest, configured: true, present: true, storagePosture: "symlink" });
        continue;
      }
      if ((tokenStat.mode & 0o077) !== 0) {
        reasonCodes.add("cli_token_ref_permissions_unsafe");
        postures.push({ role, refDigest, configured: true, present: true, storagePosture: "unsafe_permissions" });
        continue;
      }
      postures.push({ role, refDigest, configured: true, present: true, storagePosture: "safe_external_file" });
    } catch {
      reasonCodes.add("cli_token_ref_missing");
      postures.push({ role, refDigest, configured: true, present: false, storagePosture: "missing" });
    }
  }
  return postures;
}

async function readRoleCredentialProfile(
  config: LocalProjectConfig,
  reasonCodes: Set<DoctorReasonCode>,
): Promise<LocalRoleCredentialProfile | null> {
  if (!config.roleCredentialProfileRef) {
    reasonCodes.add("cli_role_credential_profile_missing");
    return null;
  }
  try {
    return LocalRoleCredentialProfileSchema.parse(JSON.parse(await readFile(config.roleCredentialProfileRef, "utf8")));
  } catch {
    reasonCodes.add("cli_role_credential_profile_missing");
    return null;
  }
}

async function pathIsInside(candidate: string, parent: string): Promise<boolean> {
  const resolvedParent = await realPathOrResolve(parent);
  const resolvedCandidate = await realPathOrResolve(candidate);
  const rel = relative(resolvedParent, resolvedCandidate);
  return rel === "" || (!rel.startsWith("..") && !isAbsolute(rel));
}

async function realPathOrResolve(path: string): Promise<string> {
  try {
    return await realpath(path);
  } catch {
    return resolve(path);
  }
}

async function readLocalX402Install(
  config: LocalProjectConfig,
  reasonCodes: Set<DoctorReasonCode>,
): Promise<z.infer<typeof LocalX402InstallRecordSchema> | null> {
  if (!config.x402InstallRef) {
    reasonCodes.add("cli_install_not_configured");
    return null;
  }

  try {
    const record = LocalX402InstallRecordSchema.parse(JSON.parse(await readFile(config.x402InstallRef, "utf8")));
    if (record.installStatus !== "ready_to_install") reasonCodes.add("cli_install_not_ready");
    if (record.selectedPaymentRequirementDigest === null) {
      reasonCodes.add("cli_selected_payment_requirement_missing");
    }
    return record;
  } catch {
    reasonCodes.add("cli_install_not_configured");
    return null;
  }
}

async function readLocalX402Probes(
  config: LocalProjectConfig,
  reasonCodes: Set<DoctorReasonCode>,
  now: number,
): Promise<z.infer<typeof LocalX402ProbeReportSchema> | null> {
  if (!config.x402ProbeReportRef) {
    reasonCodes.add("cli_gateway_posture_unknown");
    return null;
  }

  try {
    const report = LocalX402ProbeReportSchema.parse(JSON.parse(await readFile(config.x402ProbeReportRef, "utf8")));
    if (!report.passed) reasonCodes.add("cli_gateway_posture_probe_failed");
    if (Date.parse(report.expiresAt) <= now) reasonCodes.add("cli_gateway_posture_stale");
    return report;
  } catch {
    reasonCodes.add("cli_gateway_posture_unknown");
    return null;
  }
}

async function readLocalX402GatewayReadiness(
  config: LocalProjectConfig,
  install: z.infer<typeof LocalX402InstallRecordSchema> | null,
  probes: z.infer<typeof LocalX402ProbeReportSchema> | null,
  reasonCodes: Set<DoctorReasonCode>,
  now: number,
  options: { reportMissing: boolean },
): Promise<z.infer<typeof LocalX402GatewayReadinessRecordSchema> | null> {
  if (!config.x402GatewayReadinessRef) {
    if (options.reportMissing) reasonCodes.add("cli_gateway_posture_unknown");
    return null;
  }

  try {
    const record = LocalX402GatewayReadinessRecordSchema.parse(
      JSON.parse(await readFile(config.x402GatewayReadinessRef, "utf8")),
    );
    if (record.projectId !== config.projectId) reasonCodes.add("cli_gateway_posture_unknown");
    if (!install || !probes) return record;
    if (record.installDigest !== install.installDigest) reasonCodes.add("cli_gateway_posture_unknown");
    if (record.installProposalRef !== install.installProposalRef) reasonCodes.add("cli_gateway_posture_unknown");
    if (record.paymentRequirementsDigest !== install.paymentRequirementsDigest) {
      reasonCodes.add("cli_gateway_posture_unknown");
    }
    if (record.selectedPaymentRequirementDigest !== install.selectedPaymentRequirementDigest) {
      reasonCodes.add("cli_gateway_posture_unknown");
    }
    if (record.probePostureDigest !== probes.postureDigest) reasonCodes.add("cli_gateway_posture_unknown");
    validateProtectedReadinessSnapshotBinding(config, record, install, probes, reasonCodes);
    if (Date.parse(record.expiresAt) <= now) reasonCodes.add("cli_gateway_readiness_stale");
    if (Date.parse(record.gatewayCustodyProofExpiresAt) <= now) {
      reasonCodes.add("cli_gateway_custody_proof_stale");
    }
    return record;
  } catch {
    reasonCodes.add("cli_gateway_posture_unknown");
    return null;
  }
}

function validateProtectedReadinessSnapshotBinding(
  config: LocalProjectConfig,
  record: z.infer<typeof LocalX402GatewayReadinessRecordSchema>,
  install: z.infer<typeof LocalX402InstallRecordSchema>,
  probes: z.infer<typeof LocalX402ProbeReportSchema>,
  reasonCodes: Set<DoctorReasonCode>,
): void {
  const readiness = record.protectedToolReadiness;
  const expectedPairs: Array<[unknown, unknown]> = [
    [readiness.readinessStatus, "trusted_gateway_ready"],
    [readiness.readinessScope, "pre_contract"],
    [readiness.readinessProofLevel, "control_plane_registration"],
    [readiness.trustedReadiness, true],
    [readiness.requiredNextMechanism, "ready_for_runtime_facade"],
    [readiness.gatewayReadinessRef, config.x402GatewayReadinessRef ?? null],
    [readiness.readinessExpiresAt, record.expiresAt],
    [readiness.installDigest, record.installDigest],
    [readiness.installDigest, install.installDigest],
    [readiness.probePostureDigest, record.probePostureDigest],
    [readiness.probePostureDigest, probes.postureDigest],
    [readiness.paymentRequirementsDigest, record.paymentRequirementsDigest],
    [readiness.paymentRequirementsDigest, install.paymentRequirementsDigest],
    [readiness.selectedPaymentRequirementDigest, record.selectedPaymentRequirementDigest],
    [readiness.selectedPaymentRequirementDigest, install.selectedPaymentRequirementDigest],
    [readiness.gatewayId, record.gatewayId],
    [readiness.gatewayRegistrationRef, record.gatewayRegistrationRef],
    [readiness.gatewayCredentialRefDigest, record.gatewayCredentialRefDigest],
    [readiness.gatewayCredentialCustodyStatus, record.gatewayCredentialCustodyStatus],
    [readiness.gatewayCustodyProofPacketRef, record.gatewayCustodyProofPacketRef],
    [readiness.gatewayCustodyProofPacketDigest, record.gatewayCustodyProofPacketDigest],
    [readiness.gatewayCustodyClaimLevel, record.gatewayCustodyClaimLevel],
    [readiness.gatewayCustodyExternalVerificationStatus, record.gatewayCustodyExternalVerificationStatus],
    [readiness.gatewayCustodyProofExpiresAt, record.gatewayCustodyProofExpiresAt],
    [readiness.gatewayPosture, record.gatewayPosture],
    [readiness.policyVersionRef, record.policyVersionRef],
    [readiness.policyVersionDigest, record.policyVersionDigest],
    [readiness.gatewayRegistryEntryRef, record.gatewayRegistryEntryRef],
    [readiness.operatingEnvelopeRef, record.operatingEnvelopeRef],
    [readiness.rawCredentialRefsIncluded, false],
  ];
  if (expectedPairs.some(([actual, expected]) => actual !== expected)) {
    reasonCodes.add("cli_gateway_posture_unknown");
  }
}
