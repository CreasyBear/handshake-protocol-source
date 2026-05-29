import { z } from "zod";
import { HandshakeProtocolError } from "../protocol/foundation/errors";
import type { TransitionCallerRole } from "./roles";
import type { TransitionCallerIdentity } from "./hosted-caller-identity";

export const HostedDeploymentModeSchema = z.enum(["local-dev", "test", "preview", "production"]);
export type HostedDeploymentMode = z.infer<typeof HostedDeploymentModeSchema>;

export const HostedVerifierStrategySchema = z.enum([
  "local_test_verifier",
  "clerk_session",
  "oauth_oidc_jwks",
  "cloudflare_access_jwt",
  "pinned_jwks",
  "custom_server_verifier",
]);
export type HostedVerifierStrategy = z.infer<typeof HostedVerifierStrategySchema>;

export const HostedReadRoleSchema = z.enum(["viewer", "auditor", "operator", "rawEvidenceReader"]);
export type HostedReadRole = z.infer<typeof HostedReadRoleSchema>;

export const HostedScopeSchema = z.enum([
  "evidence:redacted:read",
  "evidence:raw:request",
  "evidence:raw:read",
  "evidence:export:create",
  "evidence:retention:admin",
  "hosted:readiness:read",
]);
export type HostedScope = z.infer<typeof HostedScopeSchema>;

export const HostedTenantSourceSchema = z.enum(["verifier_claims", "route_scope_match", "static_test_scope"]);
export type HostedTenantSource = z.infer<typeof HostedTenantSourceSchema>;

export const HostedRawReadPostureSchema = z.enum(["unavailable", "disabled", "gated", "allowed"]);
export type HostedRawReadPosture = z.infer<typeof HostedRawReadPostureSchema>;

export const HostedReadinessStateSchema = z.enum([
  "active",
  "configured_but_unverified",
  "missing",
  "disabled",
  "read_only",
  "not_promoted",
]);
export type HostedReadinessState = z.infer<typeof HostedReadinessStateSchema>;

export const HostedRolePolicySchema = z.strictObject({
  admittedTransitionRoles: z
    .array(z.enum(["control_plane", "runtime_evidence", "gateway_custody", "review_custody"]))
    .min(1),
});
export type HostedRolePolicy = z.infer<typeof HostedRolePolicySchema>;

export const HostedReadEntitlementSchema = z.strictObject({
  allowedRoles: z.array(HostedReadRoleSchema).min(1),
  requiredScopes: z.array(HostedScopeSchema).min(1),
});
export type HostedReadEntitlement = z.infer<typeof HostedReadEntitlementSchema>;

export const HostedStorageBindingPostureSchema = z.strictObject({
  bindingName: z.string().min(1).max(200),
  required: z.boolean(),
  authority: z.enum(["structured_evidence", "non_authoritative_cache"]),
});
export type HostedStorageBindingPosture = z.infer<typeof HostedStorageBindingPostureSchema>;

export const HostedAdmissionConfigSchema = z
  .strictObject({
    deploymentMode: HostedDeploymentModeSchema,
    verifierStrategy: HostedVerifierStrategySchema,
    maxIdentityAgeSeconds: z.number().int().positive().max(86_400),
    rolePolicy: HostedRolePolicySchema,
    readPolicy: z.strictObject({
      redactedEvidence: HostedReadEntitlementSchema,
      rawEvidence: HostedReadEntitlementSchema,
      readiness: HostedReadEntitlementSchema,
    }),
    tenantSource: HostedTenantSourceSchema,
    storage: z.strictObject({
      d1: HostedStorageBindingPostureSchema,
      kv: HostedStorageBindingPostureSchema,
    }),
    secretNames: z.array(z.string().min(1).max(200)),
    publicVarNames: z.array(z.string().min(1).max(200)),
    rawReadPosture: HostedRawReadPostureSchema,
    redactionProfileRefs: z.array(z.string().min(1).max(200)).min(1),
    retentionPosture: z.enum(["not_configured", "declared_non_certified", "disabled"]),
    exportPosture: z.enum(["disabled", "redacted_only", "not_configured"]),
    readinessExpectations: z.array(z.string().min(1).max(500)).min(1),
  })
  .superRefine((config, ctx) => {
    if (!config.readPolicy.redactedEvidence.requiredScopes.includes("evidence:redacted:read")) {
      ctx.addIssue({
        code: "custom",
        path: ["readPolicy", "redactedEvidence", "requiredScopes"],
        message: "Redacted evidence reads must require evidence:redacted:read.",
      });
    }
    if (!config.readPolicy.rawEvidence.requiredScopes.includes("evidence:raw:read")) {
      ctx.addIssue({
        code: "custom",
        path: ["readPolicy", "rawEvidence", "requiredScopes"],
        message: "Raw evidence reads must require evidence:raw:read.",
      });
    }
    if (!config.readPolicy.rawEvidence.requiredScopes.includes("evidence:raw:request")) {
      ctx.addIssue({
        code: "custom",
        path: ["readPolicy", "rawEvidence", "requiredScopes"],
        message: "Raw evidence reads must require evidence:raw:request.",
      });
    }
    if (!config.readPolicy.rawEvidence.allowedRoles.includes("rawEvidenceReader")) {
      ctx.addIssue({
        code: "custom",
        path: ["readPolicy", "rawEvidence", "allowedRoles"],
        message: "Raw evidence reads must require rawEvidenceReader role.",
      });
    }
    if (!config.readPolicy.readiness.requiredScopes.includes("hosted:readiness:read")) {
      ctx.addIssue({
        code: "custom",
        path: ["readPolicy", "readiness", "requiredScopes"],
        message: "Hosted readiness reads must require hosted:readiness:read.",
      });
    }
    if (config.storage.d1.authority !== "structured_evidence") {
      ctx.addIssue({
        code: "custom",
        path: ["storage", "d1", "authority"],
        message: "Hosted protocol records must declare D1 as structured evidence authority.",
      });
    }
    if (config.storage.kv.authority !== "non_authoritative_cache") {
      ctx.addIssue({
        code: "custom",
        path: ["storage", "kv", "authority"],
        message: "KV must be declared non-authoritative for hosted evidence.",
      });
    }
    if (
      (config.deploymentMode === "preview" || config.deploymentMode === "production") &&
      config.secretNames.length === 0
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["secretNames"],
        message: "Promoted hosted modes must declare required secret names.",
      });
    }
  });

export type HostedAdmissionConfig = z.infer<typeof HostedAdmissionConfigSchema>;
export type HostedAdmissionConfigInput = z.input<typeof HostedAdmissionConfigSchema>;

export const HostedReadinessReportSchema = z.strictObject({
  configured: z.boolean(),
  deploymentMode: HostedDeploymentModeSchema.nullable(),
  readinessState: HostedReadinessStateSchema,
  authorityClass: z.literal("hosted_admission_and_redacted_evidence_read_only"),
  hostedMutationAuthorityCreated: z.literal(false),
  paymentManagementCreated: z.literal(false),
  settlementAuthorityCreated: z.literal(false),
  providerCustodyCreated: z.literal(false),
  verifier: z.strictObject({
    strategy: HostedVerifierStrategySchema.nullable(),
    serverVerifierConfigured: z.boolean(),
    maxIdentityAgeSeconds: z.number().int().positive().nullable(),
  }),
  roles: z.strictObject({
    admittedTransitionRoles: z.array(
      z.enum(["control_plane", "runtime_evidence", "gateway_custody", "review_custody"]),
    ),
    redactedEvidenceRoles: z.array(HostedReadRoleSchema),
    rawEvidenceRoles: z.array(HostedReadRoleSchema),
    readinessRoles: z.array(HostedReadRoleSchema),
    redactedEvidenceScopes: z.array(HostedScopeSchema),
    rawEvidenceScopes: z.array(HostedScopeSchema),
    readinessScopes: z.array(HostedScopeSchema),
  }),
  tenantSource: HostedTenantSourceSchema.nullable(),
  storage: z.strictObject({
    d1: z.strictObject({
      bindingName: z.string().nullable(),
      required: z.boolean(),
      present: z.boolean(),
      authority: z.enum(["structured_evidence", "missing"]),
      environmentPosture: z.enum(["local_or_injected", "remote_required", "unknown"]),
      schema: z.strictObject({
        checked: z.boolean(),
        status: z.enum(["present", "missing", "not_checked", "error"]),
        requiredTableRefs: z.array(z.string()),
        missingTableRefs: z.array(z.string()),
      }),
    }),
    kv: z.strictObject({
      bindingName: z.string().nullable(),
      required: z.boolean(),
      present: z.boolean(),
      authority: z.literal("non_authoritative_cache"),
    }),
  }),
  secrets: z.array(
    z.strictObject({
      name: z.string(),
      present: z.boolean(),
    }),
  ),
  publicVars: z.array(
    z.strictObject({
      name: z.string(),
      present: z.boolean(),
    }),
  ),
  rawReadPosture: HostedRawReadPostureSchema.nullable(),
  redactionProfileRefs: z.array(z.string()),
  retentionPosture: z.enum(["not_configured", "declared_non_certified", "disabled"]).nullable(),
  exportPosture: z.enum(["disabled", "redacted_only", "not_configured"]).nullable(),
  readinessExpectations: z.array(z.string()),
  unsupportedCapabilities: z.array(z.string()),
});
export type HostedReadinessReport = z.infer<typeof HostedReadinessReportSchema>;

export function requireHostedAdmissionConfig(config: HostedAdmissionConfigInput | undefined): HostedAdmissionConfig {
  if (!config) {
    throw new HandshakeProtocolError(
      "hosted_admission_config_not_configured",
      "Hosted admission requires explicit deployment-mode authority, storage, read, raw-read, and secret-name posture.",
      503,
      { retryability: "terminal", commitState: "not_started" },
    );
  }
  const parsed = HostedAdmissionConfigSchema.safeParse(config);
  if (!parsed.success) {
    throw new HandshakeProtocolError(
      "hosted_admission_config_invalid",
      "Hosted admission config did not satisfy the deployment-mode authority schema.",
      503,
      { retryability: "terminal", commitState: "not_started" },
    );
  }
  return parsed.data;
}

export function parseOptionalHostedAdmissionConfig(
  config: HostedAdmissionConfigInput | undefined,
): HostedAdmissionConfig | null {
  if (!config) return null;
  return requireHostedAdmissionConfig(config);
}

export function assertHostedTransitionRolesConfigured(
  config: HostedAdmissionConfig,
  requiredRoles: readonly TransitionCallerRole[],
): void {
  const missingRoles = requiredRoles.filter((role) => !config.rolePolicy.admittedTransitionRoles.includes(role));
  if (missingRoles.length > 0) {
    throw new HandshakeProtocolError(
      "hosted_transition_role_not_admitted",
      `Hosted deployment config does not admit ${missingRoles.join(" or ")} transition custody.`,
      403,
      { retryability: "terminal", commitState: "not_started" },
    );
  }
}

export function assertHostedRedactedEvidenceEntitlement(
  identity: TransitionCallerIdentity,
  config: HostedAdmissionConfig,
): void {
  assertHostedReadEntitlement(identity, config.readPolicy.redactedEvidence, "hosted_read_entitlement_forbidden");
}

export function assertHostedReadinessEntitlement(
  identity: TransitionCallerIdentity,
  config: HostedAdmissionConfig,
): void {
  assertHostedReadEntitlement(identity, config.readPolicy.readiness, "hosted_readiness_entitlement_forbidden");
}

export function assertHostedRawEvidenceEntitlement(
  identity: TransitionCallerIdentity,
  config: HostedAdmissionConfig,
  headers: Headers,
  now: string,
): void {
  if (config.rawReadPosture === "unavailable" || config.rawReadPosture === "disabled") {
    throw new HandshakeProtocolError(
      "hosted_raw_read_unavailable",
      `Hosted raw evidence reads are ${config.rawReadPosture}.`,
      403,
      { retryability: "terminal", commitState: "not_started" },
    );
  }
  assertHostedReadEntitlement(identity, config.readPolicy.rawEvidence, "hosted_raw_read_entitlement_forbidden");
  const purpose = headers.get("x-handshake-raw-read-purpose")?.trim();
  const expiresAt = headers.get("x-handshake-raw-read-expires-at")?.trim();
  if (!purpose || !expiresAt) {
    throw new HandshakeProtocolError(
      "hosted_raw_read_purpose_required",
      "Hosted raw evidence reads require explicit purpose and expiry headers.",
      403,
      { retryability: "terminal", commitState: "not_started" },
    );
  }
  const nowMs = Date.parse(now);
  const expiresAtMs = Date.parse(expiresAt);
  if (
    !Number.isFinite(nowMs) ||
    !Number.isFinite(expiresAtMs) ||
    expiresAtMs <= nowMs ||
    expiresAtMs > nowMs + 3_600_000
  ) {
    throw new HandshakeProtocolError(
      "hosted_raw_read_window_invalid",
      "Hosted raw evidence read expiry must be parseable, future, and bounded to one hour.",
      403,
      { retryability: "terminal", commitState: "not_started" },
    );
  }
}

function assertHostedReadEntitlement(
  identity: TransitionCallerIdentity,
  entitlement: z.infer<typeof HostedReadEntitlementSchema>,
  code: string,
): void {
  const roleAllowed = identity.hostedRoles.some((role) => entitlement.allowedRoles.includes(role));
  const scopesAllowed = entitlement.requiredScopes.every((scope) => identity.hostedScopes.includes(scope));
  if (!roleAllowed || !scopesAllowed) {
    throw new HandshakeProtocolError(
      code,
      "Hosted caller identity does not satisfy the configured read role/scope entitlement.",
      403,
      { retryability: "terminal", commitState: "not_started" },
    );
  }
}
