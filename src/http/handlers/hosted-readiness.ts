import type { Context } from "hono";
import { authorizeTransitionCaller } from "../admission/caller-auth";
import { authorizeHostedReadinessAdmission } from "../admission";
import {
  HostedReadinessReportSchema,
  parseOptionalHostedAdmissionConfig,
  type HostedAdmissionConfig,
  type HostedReadinessReport,
  type HostedReadinessState,
} from "../admission/hosted-admission-config";
import type { AppOptions, WorkerBindings } from "../app-options";
import type { ProtocolStore } from "../../protocol/store/port";
import { transitionErrorResult, type TransitionErrorContext } from "../errors/transition-error-envelope";

const REQUIRED_D1_TABLE_REFS = [
  "protocol_records",
  "stream_events",
  "idempotency_ledger_current",
  "protected_path_posture_current",
] as const;

export async function handleHostedReadiness(
  c: Context<{ Bindings: WorkerBindings }>,
  options: AppOptions,
  fallbackStore: ProtocolStore | null,
): Promise<Response> {
  const errorContext: TransitionErrorContext = {
    transitionName: "getHostedReadiness",
    callerCustodyRole: options.authMode === "hosted" ? "review_custody" : "control_plane",
    requestIdentity: null,
  };
  try {
    if (options.authMode === "hosted") {
      const admission = await authorizeHostedReadinessAdmission(c, options);
      if (admission.failure) return admission.failure;
    } else {
      const authFailure = authorizeTransitionCaller(c, options.callerAuthTokens, "control_plane", errorContext);
      if (authFailure) return authFailure;
    }
    return c.json(await buildHostedReadinessReport(c.env, options, fallbackStore));
  } catch (error) {
    const result = transitionErrorResult(error, errorContext);
    return c.json(result.body, result.status as 400);
  }
}

export function buildHostedReadinessReport(
  env: WorkerBindings | undefined,
  options: AppOptions,
  fallbackStore: ProtocolStore | null,
): Promise<HostedReadinessReport> {
  return buildHostedReadinessReportAsync(env, options, fallbackStore);
}

async function buildHostedReadinessReportAsync(
  env: WorkerBindings | undefined,
  options: AppOptions,
  fallbackStore: ProtocolStore | null,
): Promise<HostedReadinessReport> {
  const config = parseOptionalHostedAdmissionConfig(options.hostedAdmissionConfig);
  if (!config) return missingReadinessReport(Boolean(options.hostedCallerVerifier));

  const d1Binding = env?.[config.storage.d1.bindingName];
  const d1Present = Boolean(d1Binding);
  const d1Schema = await inspectD1Schema(d1Binding);
  const kvPresent = Boolean(env?.[config.storage.kv.bindingName]);
  const state = readinessStateFor(config, d1Present, kvPresent, fallbackStore);
  const report: HostedReadinessReport = {
    configured: true,
    deploymentMode: config.deploymentMode,
    readinessState: state,
    authorityClass: "hosted_admission_and_redacted_evidence_read_only",
    hostedMutationAuthorityCreated: false,
    paymentManagementCreated: false,
    settlementAuthorityCreated: false,
    providerCustodyCreated: false,
    verifier: {
      strategy: config.verifierStrategy,
      serverVerifierConfigured: Boolean(options.hostedCallerVerifier),
      maxIdentityAgeSeconds: config.maxIdentityAgeSeconds,
    },
    roles: {
      admittedTransitionRoles: [...config.rolePolicy.admittedTransitionRoles],
      redactedEvidenceRoles: [...config.readPolicy.redactedEvidence.allowedRoles],
      rawEvidenceRoles: [...config.readPolicy.rawEvidence.allowedRoles],
      readinessRoles: [...config.readPolicy.readiness.allowedRoles],
      redactedEvidenceScopes: [...config.readPolicy.redactedEvidence.requiredScopes],
      rawEvidenceScopes: [...config.readPolicy.rawEvidence.requiredScopes],
      readinessScopes: [...config.readPolicy.readiness.requiredScopes],
    },
    tenantSource: config.tenantSource,
    storage: {
      d1: {
        bindingName: config.storage.d1.bindingName,
        required: config.storage.d1.required,
        present: d1Present,
        authority: d1Present || fallbackStore ? "structured_evidence" : "missing",
        environmentPosture:
          config.deploymentMode === "preview" || config.deploymentMode === "production"
            ? "remote_required"
            : "local_or_injected",
        schema: d1Schema,
      },
      kv: {
        bindingName: config.storage.kv.bindingName,
        required: config.storage.kv.required,
        present: kvPresent,
        authority: "non_authoritative_cache",
      },
    },
    secrets: config.secretNames.map((name) => ({ name, present: Boolean(env?.[name]) })),
    publicVars: config.publicVarNames.map((name) => ({ name, present: Boolean(env?.[name]) })),
    rawReadPosture: config.rawReadPosture,
    redactionProfileRefs: [...config.redactionProfileRefs],
    retentionPosture: config.retentionPosture,
    exportPosture: config.exportPosture,
    readinessExpectations: [...config.readinessExpectations],
    unsupportedCapabilities: unsupportedCapabilitiesFor(config, d1Present, kvPresent, fallbackStore),
  };
  return HostedReadinessReportSchema.parse(report);
}

function missingReadinessReport(serverVerifierConfigured: boolean): HostedReadinessReport {
  return {
    configured: false,
    deploymentMode: null,
    readinessState: "missing",
    authorityClass: "hosted_admission_and_redacted_evidence_read_only",
    hostedMutationAuthorityCreated: false,
    paymentManagementCreated: false,
    settlementAuthorityCreated: false,
    providerCustodyCreated: false,
    verifier: {
      strategy: null,
      serverVerifierConfigured,
      maxIdentityAgeSeconds: null,
    },
    roles: {
      admittedTransitionRoles: [],
      redactedEvidenceRoles: [],
      rawEvidenceRoles: [],
      readinessRoles: [],
      redactedEvidenceScopes: [],
      rawEvidenceScopes: [],
      readinessScopes: [],
    },
    tenantSource: null,
    storage: {
      d1: {
        bindingName: null,
        required: false,
        present: false,
        authority: "missing",
        environmentPosture: "unknown",
        schema: {
          checked: false,
          status: "not_checked",
          requiredTableRefs: [...REQUIRED_D1_TABLE_REFS],
          missingTableRefs: [...REQUIRED_D1_TABLE_REFS],
        },
      },
      kv: {
        bindingName: null,
        required: false,
        present: false,
        authority: "non_authoritative_cache",
      },
    },
    secrets: [],
    publicVars: [],
    rawReadPosture: null,
    redactionProfileRefs: [],
    retentionPosture: null,
    exportPosture: null,
    readinessExpectations: [],
    unsupportedCapabilities: ["hosted_admission_config_missing", "hosted_mutation_authority_not_provided"],
  };
}

function readinessStateFor(
  config: HostedAdmissionConfig,
  d1Present: boolean,
  kvPresent: boolean,
  fallbackStore: ProtocolStore | null,
): HostedReadinessState {
  if (
    !d1Present &&
    config.storage.d1.required &&
    (config.deploymentMode === "preview" || config.deploymentMode === "production")
  ) {
    return "missing";
  }
  if (!kvPresent && config.storage.kv.required) return "configured_but_unverified";
  if (config.deploymentMode === "production") return "configured_but_unverified";
  if (!d1Present && fallbackStore) return "configured_but_unverified";
  if (config.exportPosture === "disabled" && config.rawReadPosture !== "allowed") return "read_only";
  return "active";
}

function unsupportedCapabilitiesFor(
  config: HostedAdmissionConfig,
  d1Present: boolean,
  kvPresent: boolean,
  fallbackStore: ProtocolStore | null,
): string[] {
  const unsupported = [
    "hosted_mutation_authority_not_provided",
    "payment_management_not_provided",
    "settlement_not_provided",
    "provider_custody_not_provided",
    "compliance_certification_not_provided",
    "project_scoped_records_not_promoted",
  ];
  if (!d1Present && fallbackStore) unsupported.push("injected_store_not_production_d1_proof");
  if (!d1Present && config.storage.d1.required) unsupported.push("d1_binding_missing");
  if (!kvPresent && config.storage.kv.required) unsupported.push("kv_binding_missing");
  if (config.rawReadPosture !== "allowed") unsupported.push(`raw_evidence_${config.rawReadPosture}`);
  return unsupported;
}

async function inspectD1Schema(value: unknown): Promise<HostedReadinessReport["storage"]["d1"]["schema"]> {
  if (!isD1Database(value)) {
    return {
      checked: false,
      status: "not_checked",
      requiredTableRefs: [...REQUIRED_D1_TABLE_REFS],
      missingTableRefs: [...REQUIRED_D1_TABLE_REFS],
    };
  }
  try {
    const placeholders = REQUIRED_D1_TABLE_REFS.map(() => "?").join(", ");
    const result = await value
      .prepare(`SELECT name FROM sqlite_master WHERE type = 'table' AND name IN (${placeholders})`)
      .bind(...REQUIRED_D1_TABLE_REFS)
      .all<{ name: string }>();
    const present = new Set(result.results.map((row) => row.name));
    const missing = REQUIRED_D1_TABLE_REFS.filter((tableRef) => !present.has(tableRef));
    return {
      checked: true,
      status: missing.length === 0 ? "present" : "missing",
      requiredTableRefs: [...REQUIRED_D1_TABLE_REFS],
      missingTableRefs: missing,
    };
  } catch {
    return {
      checked: true,
      status: "error",
      requiredTableRefs: [...REQUIRED_D1_TABLE_REFS],
      missingTableRefs: [...REQUIRED_D1_TABLE_REFS],
    };
  }
}

function isD1Database(value: unknown): value is D1Database {
  return Boolean(value && typeof (value as { prepare?: unknown }).prepare === "function");
}
