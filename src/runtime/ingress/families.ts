import type { CompileIntentInput } from "../../protocol/areas/intent-compilation";
import {
  buildAuthMdProtectedApiCallCompileIntentInput,
  buildAuthMdProtectedApiCallCompileIntentInputForRuntimeRefusal,
  authMdProtectedApiCallRefusalReasonCodes,
  type AuthMdProtectedApiCallAttempt,
  type AuthMdProtectedApiCallRuntimeConfig,
} from "../../adapters/auth-md/action-proposal";
import {
  buildX402PaymentCompileIntentInput,
  buildX402PaymentCompileIntentInputForRuntimeRefusal,
  type X402PaymentAttempt,
  type X402PaymentRuntimeConfig,
} from "../../adapters/x402-payment/action-proposal";
import {
  buildPackageInstallCompileIntentInput,
  type PackageInstallRuntimeConfig,
  type PackageInstallToolCall,
} from "../package-install/action-proposal";
import { runtimeIngressFamilyIdForDispatchKind, runtimeIngressGrammarVersionForFamilySet } from "./registry";
import { runtimeIngressDispatchNodeId } from "./node-ids";
import type {
  ParsedAuthMdProtectedApiCallDispatch,
  ParsedPackageInstallDispatch,
  ParsedRuntimeIngressDispatchBlock,
  ParsedRuntimeIngressObservedDispatch,
  ParsedX402PaymentDispatch,
  RuntimeIngressDispatchBlockRefs,
} from "./schemas";

export type RuntimeIngressFamilyConfig =
  | PackageInstallRuntimeConfig
  | X402PaymentRuntimeConfig
  | AuthMdProtectedApiCallRuntimeConfig;

export type RuntimeIngressConfig = {
  packageInstall?: PackageInstallRuntimeConfig;
  x402Payment?: X402PaymentRuntimeConfig;
  authMdProtectedApiCall?: AuthMdProtectedApiCallRuntimeConfig;
};

type RuntimeIngressGraphRefs = {
  runtimeExecutionId: string;
  generatedExecutionGraphId: string;
};

export async function buildCompileIntentInputForDispatch(
  config: RuntimeIngressConfig,
  block: ParsedRuntimeIngressDispatchBlock,
  dispatch: ParsedRuntimeIngressObservedDispatch,
  sequenceNumber: number,
  graphRefs: RuntimeIngressGraphRefs,
  requiredPriorActionContractIds: string[] = [],
): Promise<CompileIntentInput> {
  if (isPackageInstallDispatch(dispatch)) {
    return buildPackageInstallCompileIntentInput(
      requirePackageInstallConfig(config),
      packageInstallToolCallForDispatch(block, dispatch, sequenceNumber, graphRefs, requiredPriorActionContractIds),
    );
  }
  if (isAuthMdProtectedApiCallDispatch(dispatch)) {
    const attempt = authMdProtectedApiCallAttemptForDispatch(
      block,
      dispatch,
      sequenceNumber,
      graphRefs,
      requiredPriorActionContractIds,
    );
    const buildAuthMdCompileInput =
      authMdProtectedApiCallRefusalReasonCodes(attempt).length > 0
        ? buildAuthMdProtectedApiCallCompileIntentInputForRuntimeRefusal
        : buildAuthMdProtectedApiCallCompileIntentInput;
    return buildAuthMdCompileInput(requireAuthMdProtectedApiCallConfig(config), attempt);
  }
  const attempt = x402PaymentAttemptForDispatch(
    block,
    dispatch,
    sequenceNumber,
    graphRefs,
    requiredPriorActionContractIds,
  );
  const buildX402CompileInput =
    x402DispatchRefusalReasonCodes(dispatch).length > 0
      ? buildX402PaymentCompileIntentInputForRuntimeRefusal
      : buildX402PaymentCompileIntentInput;
  return buildX402CompileInput(requireX402PaymentConfig(config), attempt);
}

export function dispatchGeneratedCodeOrSpecRef(
  block: RuntimeIngressDispatchBlockRefs,
  dispatch: ParsedRuntimeIngressObservedDispatch,
  sequenceNumber: number,
): string {
  return dispatch.generatedCodeOrSpecRef ?? `${block.generatedCodeOrSpecRef}#dispatch-${sequenceNumber}`;
}

export function dispatchSpecificRefusalReasonCodes(dispatch: ParsedRuntimeIngressObservedDispatch): string[] {
  if (isAuthMdProtectedApiCallDispatch(dispatch)) {
    return authMdProtectedApiCallRefusalReasonCodes(
      authMdProtectedApiCallAttemptForDispatch(
        {
          principalIntentRef: "runtime-ingress:preflight",
          generatedCodeOrSpecRef: dispatch.generatedCodeOrSpecRef ?? "runtime-ingress:preflight",
        },
        dispatch,
        1,
        {
          runtimeExecutionId: "runtime_execution_preflight",
          generatedExecutionGraphId: "generated_execution_graph_preflight",
        },
      ),
    );
  }
  if (isX402PaymentDispatch(dispatch)) return x402DispatchRefusalReasonCodes(dispatch);
  return [];
}

export function runtimeIngressEvidenceRefs(block: ParsedRuntimeIngressDispatchBlock): string[] {
  return unique(
    [
      block.dispatchBoundaryRef,
      ...block.evidenceRefs,
      ...block.dispatches.flatMap((dispatch) => [
        ...dispatch.evidenceRefs,
        isX402PaymentDispatch(dispatch) ? dispatch.paymentRequiredEvidenceRef : null,
        isAuthMdProtectedApiCallDispatch(dispatch)
          ? `evidence:auth-md-discovery:${dispatch.protectedResourceMetadataDigest.slice(
              "sha256:".length,
              "sha256:".length + 16,
            )}`
          : null,
        isAuthMdProtectedApiCallDispatch(dispatch)
          ? `evidence:auth-md-authorization-server:${dispatch.authorizationServerMetadataDigest.slice(
              "sha256:".length,
              "sha256:".length + 16,
            )}`
          : null,
      ]),
    ].filter((value): value is string => Boolean(value)),
  );
}

export function runtimeConfigForDispatch(
  config: RuntimeIngressConfig,
  dispatch: ParsedRuntimeIngressObservedDispatch,
): RuntimeIngressFamilyConfig {
  switch (runtimeIngressFamilyIdForDispatchKind(dispatch.dispatchKind)) {
    case "package_install":
      return requirePackageInstallConfig(config);
    case "x402_payment":
      return requireX402PaymentConfig(config);
    case "auth_md_protected_api_call":
      return requireAuthMdProtectedApiCallConfig(config);
    default:
      throw new Error(`Runtime ingress dispatch family is not registered: ${dispatch.dispatchKind}`);
  }
}

export function signingSecretForDispatch(
  config: RuntimeIngressConfig,
  dispatch: ParsedRuntimeIngressObservedDispatch,
): string | undefined {
  return runtimeConfigForDispatch(config, dispatch).signingSecret;
}

export function supportedGrammarVersionForBlock(block: ParsedRuntimeIngressDispatchBlock): string {
  return runtimeIngressGrammarVersionForFamilySet(
    new Set(
      block.dispatches.map((dispatch) => {
        const familyId = runtimeIngressFamilyIdForDispatchKind(dispatch.dispatchKind);
        if (!familyId) throw new Error(`Runtime ingress dispatch family is not registered: ${dispatch.dispatchKind}`);
        return familyId;
      }),
    ),
  );
}

export function isRawSiblingDispatch(
  dispatch: ParsedRuntimeIngressObservedDispatch,
): dispatch is Extract<ParsedRuntimeIngressObservedDispatch, { rawCommandRef: string; rawCommandSummary: string[] }> {
  return dispatch.dispatchKind.startsWith("raw_sibling_");
}

export function isAmbiguousDispatch(
  dispatch: ParsedRuntimeIngressObservedDispatch,
): dispatch is Extract<ParsedRuntimeIngressObservedDispatch, { ambiguousReasonCodes: string[] }> {
  return dispatch.dispatchKind.startsWith("ambiguous_");
}

function packageInstallToolCallForDispatch(
  block: RuntimeIngressDispatchBlockRefs,
  dispatch: ParsedPackageInstallDispatch,
  sequenceNumber: number,
  graphRefs: RuntimeIngressGraphRefs,
  requiredPriorActionContractIds: string[] = [],
): PackageInstallToolCall {
  return {
    principalIntentRef: block.principalIntentRef,
    generatedCodeOrSpecRef: dispatchGeneratedCodeOrSpecRef(block, dispatch, sequenceNumber),
    runtimeExecutionId: graphRefs.runtimeExecutionId,
    generatedExecutionGraphId: graphRefs.generatedExecutionGraphId,
    generatedExecutionNodeId: runtimeIngressDispatchNodeId(sequenceNumber),
    package: dispatch.package,
    versionRange: dispatch.versionRange,
    packageManager: dispatch.packageManager,
    registryRef: dispatch.registryRef,
    workspaceRef: dispatch.workspaceRef,
    manifestRef: dispatch.manifestRef,
    lockfileRef: dispatch.lockfileRef,
    installFlags: dispatch.installFlags,
    lifecycleScriptPolicy: dispatch.lifecycleScriptPolicy,
    resolvedMaterialDigest: dispatch.resolvedMaterialDigest,
    resolvedMaterialEvidenceRefs: dispatch.resolvedMaterialEvidenceRefs,
    sequenceNumber,
    requiredPriorActionContractIds,
  };
}

function x402PaymentAttemptForDispatch(
  block: RuntimeIngressDispatchBlockRefs,
  dispatch: ParsedX402PaymentDispatch,
  sequenceNumber: number,
  graphRefs: RuntimeIngressGraphRefs,
  requiredPriorActionContractIds: string[] = [],
): X402PaymentAttempt {
  return {
    principalIntentRef: block.principalIntentRef,
    generatedCodeOrSpecRef: dispatchGeneratedCodeOrSpecRef(block, dispatch, sequenceNumber),
    runtimeExecutionId: graphRefs.runtimeExecutionId,
    generatedExecutionGraphId: graphRefs.generatedExecutionGraphId,
    generatedExecutionNodeId: runtimeIngressDispatchNodeId(sequenceNumber),
    endpointUrl: dispatch.endpointUrl,
    payee: dispatch.payee,
    network: dispatch.network,
    token: dispatch.token,
    atomicAmount: dispatch.atomicAmount,
    x402EvidenceProfile: dispatch.x402EvidenceProfile,
    paymentRequirementsDigest: dispatch.paymentRequirementsDigest,
    paymentRequiredEvidenceRef: dispatch.paymentRequiredEvidenceRef,
    facilitatorRef: dispatch.facilitatorRef,
    intendedHttpMethod: dispatch.intendedHttpMethod,
    intendedRequestUrl: dispatch.intendedRequestUrl,
    intendedRequestBodyPosture: dispatch.intendedRequestBodyPosture,
    intendedRequestBodyDigest: dispatch.intendedRequestBodyDigest,
    selectedHeadersDigest: dispatch.selectedHeadersDigest,
    providerEnvironmentPosture: dispatch.providerEnvironmentPosture,
    providerEnvironmentRef: dispatch.providerEnvironmentRef,
    x402Version: dispatch.x402Version,
    x402Scheme: dispatch.x402Scheme,
    asset: dispatch.asset,
    payTo: dispatch.payTo,
    maxTimeoutSeconds: dispatch.maxTimeoutSeconds,
    selectedPaymentRequirementIndex: dispatch.selectedPaymentRequirementIndex,
    selectedPaymentRequirementDigest: dispatch.selectedPaymentRequirementDigest,
    sdkPackageVersions: dispatch.sdkPackageVersions,
    extensionKeys: dispatch.extensionKeys,
    sequenceNumber,
    requiredPriorActionContractIds,
  };
}

function authMdProtectedApiCallAttemptForDispatch(
  block: RuntimeIngressDispatchBlockRefs,
  dispatch: ParsedAuthMdProtectedApiCallDispatch,
  sequenceNumber: number,
  graphRefs: RuntimeIngressGraphRefs,
  requiredPriorActionContractIds: string[] = [],
): AuthMdProtectedApiCallAttempt {
  return {
    principalIntentRef: block.principalIntentRef,
    generatedCodeOrSpecRef: dispatchGeneratedCodeOrSpecRef(block, dispatch, sequenceNumber),
    runtimeExecutionId: graphRefs.runtimeExecutionId,
    generatedExecutionGraphId: graphRefs.generatedExecutionGraphId,
    generatedExecutionNodeId: runtimeIngressDispatchNodeId(sequenceNumber),
    protectedResource: dispatch.protectedResource,
    protectedResourceMetadataDigest: dispatch.protectedResourceMetadataDigest,
    authorizationServerMetadataDigest: dispatch.authorizationServerMetadataDigest,
    authorizationServer: dispatch.authorizationServer,
    targetHttpMethod: dispatch.targetHttpMethod,
    endpointUrl: dispatch.endpointUrl,
    pathTemplate: dispatch.pathTemplate,
    requestBodyDigest: dispatch.requestBodyDigest,
    selectedHeadersDigest: dispatch.selectedHeadersDigest,
    requiredScopes: dispatch.requiredScopes,
    gatewayCredentialRefId: dispatch.gatewayCredentialRefId,
    gatewayCredentialRefDigest: dispatch.gatewayCredentialRefDigest,
    providerRegistryRef: dispatch.providerRegistryRef,
    providerRegistryDigest: dispatch.providerRegistryDigest,
    requiredCredentialCustodyStatus: dispatch.requiredCredentialCustodyStatus,
    operationId: dispatch.operationId,
    idempotencyMaterialRef: dispatch.idempotencyMaterialRef,
    metadataCachePosture: dispatch.metadataCachePosture,
    gatewayCredentialRefPosture: dispatch.gatewayCredentialRefPosture,
    rawAuthorizationHeaderObserved: dispatch.rawAuthorizationHeaderObserved,
    dynamicEndpointConstructionObserved: dispatch.dynamicEndpointConstructionObserved,
    dynamicHostConstructionObserved: dispatch.dynamicHostConstructionObserved,
    retryAuthorityReuseDetected: dispatch.retryAuthorityReuseDetected,
    evidenceRefs: dispatch.evidenceRefs,
    sequenceNumber,
    requiredPriorActionContractIds,
  };
}

function x402DispatchRefusalReasonCodes(dispatch: ParsedX402PaymentDispatch): string[] {
  const reasonCodes: string[] = [];
  if (dispatch.intendedRequestBodyPosture === "digest_bound" && dispatch.intendedRequestBodyDigest === null) {
    reasonCodes.push("x402_request_body_digest_missing");
  }
  if (["omitted", "unsupported"].includes(dispatch.intendedRequestBodyPosture)) {
    reasonCodes.push("x402_request_body_posture_unsupported");
  }
  if (dispatch.intendedRequestBodyPosture === "no_body" && dispatch.intendedRequestBodyDigest !== null) {
    reasonCodes.push("x402_request_body_posture_mismatch");
  }
  if (dispatch.providerEnvironmentPosture !== "local_reference_sandbox") {
    reasonCodes.push("x402_provider_environment_not_sandboxed");
  }
  return unique(reasonCodes);
}

function requirePackageInstallConfig(config: RuntimeIngressConfig): PackageInstallRuntimeConfig {
  if (!config.packageInstall)
    throw new Error("Runtime ingress package-install dispatch requires packageInstall config.");
  return config.packageInstall;
}

function requireX402PaymentConfig(config: RuntimeIngressConfig): X402PaymentRuntimeConfig {
  if (!config.x402Payment) throw new Error("Runtime ingress x402 payment dispatch requires x402Payment config.");
  return config.x402Payment;
}

function requireAuthMdProtectedApiCallConfig(config: RuntimeIngressConfig): AuthMdProtectedApiCallRuntimeConfig {
  if (!config.authMdProtectedApiCall) {
    throw new Error("Runtime ingress auth.md protected API call dispatch requires authMdProtectedApiCall config.");
  }
  return config.authMdProtectedApiCall;
}

function isPackageInstallDispatch(
  dispatch: ParsedRuntimeIngressObservedDispatch,
): dispatch is ParsedPackageInstallDispatch {
  return runtimeIngressFamilyIdForDispatchKind(dispatch.dispatchKind) === "package_install";
}

function isX402PaymentDispatch(dispatch: ParsedRuntimeIngressObservedDispatch): dispatch is ParsedX402PaymentDispatch {
  return runtimeIngressFamilyIdForDispatchKind(dispatch.dispatchKind) === "x402_payment";
}

function isAuthMdProtectedApiCallDispatch(
  dispatch: ParsedRuntimeIngressObservedDispatch,
): dispatch is ParsedAuthMdProtectedApiCallDispatch {
  return runtimeIngressFamilyIdForDispatchKind(dispatch.dispatchKind) === "auth_md_protected_api_call";
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}
