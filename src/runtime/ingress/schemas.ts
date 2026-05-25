import { z } from "zod";
import { CredentialCustodyStatusSchema } from "../../protocol/areas/catalog-envelope";

const RuntimeIngressIdSchema = z.string().min(1).max(160);
const RuntimeIngressRefSchema = z.string().min(1).max(500);
const RuntimeIngressUrlSchema = z.string().url().max(2_048);
const RuntimeIngressSmallListSchema = <T extends z.ZodTypeAny>(schema: T) => z.array(schema).max(32);
const RuntimeIngressDispatchLimit = 32;

const PackageInstallDispatchParameterFields = {
  package: RuntimeIngressIdSchema,
  versionRange: RuntimeIngressIdSchema,
  packageManager: RuntimeIngressIdSchema.default("bun"),
  registryRef: RuntimeIngressRefSchema.default("registry:npmjs"),
  workspaceRef: RuntimeIngressRefSchema.nullable().default(null),
  manifestRef: RuntimeIngressRefSchema.nullable().default("manifest:package.json"),
  lockfileRef: RuntimeIngressRefSchema.nullable().default("lockfile:bun.lock"),
  installFlags: RuntimeIngressSmallListSchema(RuntimeIngressIdSchema).default([]),
  lifecycleScriptPolicy: z.enum(["blocked", "allowed", "unknown"]).default("blocked"),
  resolvedMaterialDigest: z
    .string()
    .regex(/^sha256:[a-f0-9]{64}$/)
    .nullable()
    .default(null),
  resolvedMaterialEvidenceRefs: RuntimeIngressSmallListSchema(RuntimeIngressRefSchema).default([]),
} as const;

const X402PaymentDispatchParameterFields = {
  endpointUrl: RuntimeIngressUrlSchema,
  payee: RuntimeIngressRefSchema,
  network: RuntimeIngressIdSchema,
  token: RuntimeIngressIdSchema,
  atomicAmount: z
    .string()
    .max(78)
    .regex(/^(?:0|[1-9]\d*)$/),
  x402EvidenceProfile: z.enum(["official_payment_required", "local_digest_profile"]).default("local_digest_profile"),
  paymentRequirementsDigest: z.string().regex(/^sha256:[a-f0-9]{64}$/),
  paymentRequiredEvidenceRef: RuntimeIngressRefSchema.optional(),
  facilitatorRef: RuntimeIngressRefSchema.nullable().default(null),
  intendedHttpMethod: RuntimeIngressIdSchema.nullable().default(null),
  intendedRequestUrl: RuntimeIngressUrlSchema.nullable().default(null),
  intendedRequestBodyPosture: z.enum(["no_body", "digest_bound", "omitted", "unsupported"]).default("no_body"),
  intendedRequestBodyDigest: z
    .string()
    .regex(/^sha256:[a-f0-9]{64}$/)
    .nullable()
    .default(null),
  selectedHeadersDigest: z
    .string()
    .regex(/^sha256:[a-f0-9]{64}$/)
    .nullable()
    .default(null),
  providerEnvironmentPosture: z
    .enum(["local_reference_sandbox", "external_sandbox", "live", "unknown"])
    .default("local_reference_sandbox"),
  providerEnvironmentRef: RuntimeIngressRefSchema.nullable().default(null),
  x402Version: z.number().int().positive().nullable().default(null),
  x402Scheme: RuntimeIngressIdSchema.nullable().default(null),
  asset: RuntimeIngressIdSchema.nullable().default(null),
  payTo: RuntimeIngressRefSchema.nullable().default(null),
  maxTimeoutSeconds: z.number().positive().nullable().default(null),
  selectedPaymentRequirementDigest: z
    .string()
    .regex(/^sha256:[a-f0-9]{64}$/)
    .nullable()
    .default(null),
  selectedPaymentRequirementIndex: z.number().int().nonnegative().nullable().default(null),
  sdkPackageVersions: z.record(RuntimeIngressIdSchema, RuntimeIngressIdSchema).default({}),
  extensionKeys: RuntimeIngressSmallListSchema(RuntimeIngressIdSchema).default([]),
} as const;

const AuthMdProtectedApiCallDispatchParameterFields = {
  protectedResource: RuntimeIngressUrlSchema,
  protectedResourceMetadataDigest: z.string().regex(/^sha256:[a-f0-9]{64}$/),
  authorizationServerMetadataDigest: z.string().regex(/^sha256:[a-f0-9]{64}$/),
  authorizationServer: RuntimeIngressUrlSchema,
  targetHttpMethod: RuntimeIngressIdSchema,
  endpointUrl: RuntimeIngressUrlSchema,
  pathTemplate: RuntimeIngressRefSchema,
  requestBodyDigest: z
    .string()
    .regex(/^sha256:[a-f0-9]{64}$/)
    .nullable()
    .default(null),
  selectedHeadersDigest: z.string().regex(/^sha256:[a-f0-9]{64}$/),
  requiredScopes: RuntimeIngressSmallListSchema(RuntimeIngressIdSchema).min(1),
  gatewayCredentialRefId: RuntimeIngressIdSchema,
  gatewayCredentialRefDigest: z.string().regex(/^sha256:[a-f0-9]{64}$/),
  providerRegistryRef: RuntimeIngressRefSchema,
  providerRegistryDigest: z
    .string()
    .regex(/^sha256:[a-f0-9]{64}$/)
    .nullable()
    .default(null),
  requiredCredentialCustodyStatus: CredentialCustodyStatusSchema.default("gateway_held"),
  operationId: RuntimeIngressIdSchema,
  idempotencyMaterialRef: RuntimeIngressRefSchema.nullable().default(null),
  metadataCachePosture: z.enum(["fresh", "stale", "unknown"]).default("fresh"),
  gatewayCredentialRefPosture: z.enum(["fresh", "stale", "revoked", "expired", "unknown"]).default("fresh"),
  rawAuthorizationHeaderObserved: z.boolean().default(false),
  dynamicEndpointConstructionObserved: z.boolean().default(false),
  dynamicHostConstructionObserved: z.boolean().default(false),
  retryAuthorityReuseDetected: z.boolean().default(false),
} as const;

const RuntimeIngressDispatchCommonFields = {
  dispatchRef: RuntimeIngressRefSchema,
  generatedCodeOrSpecRef: RuntimeIngressRefSchema.nullable().default(null),
  dynamicToolConstructionDetected: z.boolean().default(false),
  lateBoundParameterRefs: RuntimeIngressSmallListSchema(RuntimeIngressRefSchema).default([]),
  retryOfDispatchRef: RuntimeIngressRefSchema.nullable().default(null),
  branchRef: RuntimeIngressRefSchema.nullable().default(null),
  loopIteration: z.number().int().nonnegative().nullable().default(null),
  evidenceRefs: RuntimeIngressSmallListSchema(RuntimeIngressRefSchema).default([]),
} as const;

export const RuntimeIngressObservedDispatchSchema = z.discriminatedUnion("dispatchKind", [
  z.strictObject({
    dispatchKind: z.literal("wrapped_package_install"),
    ...RuntimeIngressDispatchCommonFields,
    ...PackageInstallDispatchParameterFields,
  }),
  z.strictObject({
    dispatchKind: z.literal("raw_sibling_package_install"),
    ...RuntimeIngressDispatchCommonFields,
    rawCommandRef: RuntimeIngressRefSchema,
    rawCommandSummary: RuntimeIngressSmallListSchema(RuntimeIngressRefSchema).default([
      "package-manager command outside gateway",
    ]),
    ...PackageInstallDispatchParameterFields,
  }),
  z.strictObject({
    dispatchKind: z.literal("ambiguous_package_install"),
    ...RuntimeIngressDispatchCommonFields,
    ambiguousReasonCodes: RuntimeIngressSmallListSchema(RuntimeIngressIdSchema).default([
      "runtime_ingress_ambiguous_dispatch",
    ]),
    ...PackageInstallDispatchParameterFields,
  }),
  z.strictObject({
    dispatchKind: z.literal("wrapped_x402_payment"),
    ...RuntimeIngressDispatchCommonFields,
    ...X402PaymentDispatchParameterFields,
  }),
  z.strictObject({
    dispatchKind: z.literal("raw_sibling_x402_payment"),
    ...RuntimeIngressDispatchCommonFields,
    rawCommandRef: RuntimeIngressRefSchema,
    rawCommandSummary: RuntimeIngressSmallListSchema(RuntimeIngressRefSchema).default([
      "x402 payment command outside gateway",
    ]),
    ...X402PaymentDispatchParameterFields,
  }),
  z.strictObject({
    dispatchKind: z.literal("ambiguous_x402_payment"),
    ...RuntimeIngressDispatchCommonFields,
    ambiguousReasonCodes: RuntimeIngressSmallListSchema(RuntimeIngressIdSchema).default([
      "runtime_ingress_ambiguous_dispatch",
    ]),
    ...X402PaymentDispatchParameterFields,
  }),
  z.strictObject({
    dispatchKind: z.literal("wrapped_auth_md_protected_api_call"),
    ...RuntimeIngressDispatchCommonFields,
    ...AuthMdProtectedApiCallDispatchParameterFields,
  }),
  z.strictObject({
    dispatchKind: z.literal("raw_sibling_auth_md_protected_api_call"),
    ...RuntimeIngressDispatchCommonFields,
    rawCommandRef: RuntimeIngressRefSchema,
    rawCommandSummary: RuntimeIngressSmallListSchema(RuntimeIngressRefSchema).default([
      "auth.md protected API call outside gateway",
    ]),
    ...AuthMdProtectedApiCallDispatchParameterFields,
  }),
  z.strictObject({
    dispatchKind: z.literal("ambiguous_auth_md_protected_api_call"),
    ...RuntimeIngressDispatchCommonFields,
    ambiguousReasonCodes: RuntimeIngressSmallListSchema(RuntimeIngressIdSchema).default([
      "runtime_ingress_ambiguous_dispatch",
    ]),
    ...AuthMdProtectedApiCallDispatchParameterFields,
  }),
]);
export type RuntimeIngressObservedDispatch = z.input<typeof RuntimeIngressObservedDispatchSchema>;

export const RuntimeIngressDispatchBlockSchema = z
  .strictObject({
    principalIntentRef: RuntimeIngressRefSchema,
    generatedCodeOrSpecRef: RuntimeIngressRefSchema,
    dispatchBoundaryRef: RuntimeIngressRefSchema,
    executionBlockRef: RuntimeIngressRefSchema.nullable().default(null),
    graphNonce: z.string().min(8).nullable().default(null),
    truncationStatus: z.enum(["complete", "truncated", "over_limit", "unknown"]).default("complete"),
    unobservedRegionRefs: RuntimeIngressSmallListSchema(RuntimeIngressRefSchema).default([]),
    evidenceRefs: RuntimeIngressSmallListSchema(RuntimeIngressRefSchema).default([]),
    dispatches: z.array(RuntimeIngressObservedDispatchSchema).min(1).max(RuntimeIngressDispatchLimit),
  })
  .superRefine((block, context) => {
    const seenDispatchRefs = new Set<string>();
    block.dispatches.forEach((dispatch, index) => {
      if (seenDispatchRefs.has(dispatch.dispatchRef)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Runtime ingress dispatchRef must be unique within a dispatch block.",
          path: ["dispatches", index, "dispatchRef"],
        });
      }
      seenDispatchRefs.add(dispatch.dispatchRef);
    });
  });
export type RuntimeIngressDispatchBlock = z.input<typeof RuntimeIngressDispatchBlockSchema>;

export type ParsedRuntimeIngressDispatchBlock = z.infer<typeof RuntimeIngressDispatchBlockSchema>;
export type ParsedRuntimeIngressObservedDispatch = ParsedRuntimeIngressDispatchBlock["dispatches"][number];
export type RuntimeIngressDispatchBlockRefs = Pick<
  ParsedRuntimeIngressDispatchBlock,
  "principalIntentRef" | "generatedCodeOrSpecRef"
>;
export type ParsedPackageInstallDispatch = Extract<
  ParsedRuntimeIngressObservedDispatch,
  { dispatchKind: "wrapped_package_install" | "raw_sibling_package_install" | "ambiguous_package_install" }
>;
export type ParsedX402PaymentDispatch = Extract<
  ParsedRuntimeIngressObservedDispatch,
  { dispatchKind: "wrapped_x402_payment" | "raw_sibling_x402_payment" | "ambiguous_x402_payment" }
>;
export type ParsedAuthMdProtectedApiCallDispatch = Extract<
  ParsedRuntimeIngressObservedDispatch,
  {
    dispatchKind:
      | "wrapped_auth_md_protected_api_call"
      | "raw_sibling_auth_md_protected_api_call"
      | "ambiguous_auth_md_protected_api_call";
  }
>;
