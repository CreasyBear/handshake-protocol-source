import { z } from "zod";
import { x402Client, x402HTTPClient } from "@x402/core/client";
import {
  isPaymentRequiredV2,
  validatePaymentPayload,
  validatePaymentRequired,
  type PaymentRequiredV2,
  type PaymentRequirementsV2,
} from "@x402/core/schemas";
import type {
  Network as OfficialX402Network,
  PaymentRequired as OfficialPaymentRequired,
  PaymentRequirements as OfficialPaymentRequirements,
} from "@x402/core/types";
import { ExactEvmScheme } from "@x402/evm/exact/client";
import type { ClientEvmSigner } from "@x402/evm";
import { digestX402SelectedPaymentRequirement } from "./upstream-evidence";
import { digestCanonical } from "../../protocol/foundation/canonical";
import { DigestSchema } from "../../protocol/foundation/schema-core";
import {
  verifiedGatewayCheckFromResult,
  type GatewayCheckInput,
  type GatewayCheckResult,
  type VerifiedGatewayCheck,
} from "../../protocol/areas/gateway-gate";
import type {
  CredentialResolutionEvidence,
  RecordCredentialResolutionEvidenceInput,
} from "../../protocol/areas/credential-custody";
import type {
  ReconcileSurfaceOperationInput,
  SurfaceOperationReconciliation,
  SurfaceOperationReconciliationResult,
} from "../../protocol/areas/operation-lifecycle";

const AtomicAmountSchema = z.string().regex(/^(?:0|[1-9]\d*)$/);
const PaymentIdentifierSchema = z
  .string()
  .min(16)
  .max(128)
  .regex(/^[a-zA-Z0-9_-]+$/);
const X402EvidenceProfileSchema = z.enum(["official_payment_required", "local_digest_profile"]);
const X402RequestBodyPostureSchema = z.enum(["no_body", "digest_bound", "omitted", "unsupported"]);
const X402ProviderEnvironmentPostureSchema = z.enum(["local_reference_sandbox", "external_sandbox", "live", "unknown"]);

export const X402PaymentParametersSchema = z.strictObject({
  endpointUrl: z.string().url(),
  endpointDomain: z.string().min(1),
  intendedHttpMethod: z.string().min(1).nullable().default(null),
  intendedRequestUrl: z.string().url().nullable().default(null),
  intendedRequestBodyPosture: X402RequestBodyPostureSchema.default("no_body"),
  intendedRequestBodyDigest: DigestSchema.nullable().default(null),
  selectedHeadersDigest: DigestSchema.nullable().default(null),
  providerEnvironmentPosture: X402ProviderEnvironmentPostureSchema.default("local_reference_sandbox"),
  providerEnvironmentRef: z.string().min(1).nullable().default(null),
  x402Version: z.number().int().positive().nullable().default(null),
  x402Scheme: z.string().min(1).nullable().default(null),
  payee: z.string().min(1),
  payTo: z.string().min(1).nullable().default(null),
  network: z.string().min(1),
  token: z.string().min(1),
  asset: z.string().min(1).nullable().default(null),
  atomicAmount: AtomicAmountSchema,
  x402EvidenceProfile: X402EvidenceProfileSchema.default("local_digest_profile"),
  paymentRequirementsDigest: DigestSchema,
  selectedPaymentRequirementIndex: z.number().int().nonnegative().nullable().default(null),
  selectedPaymentRequirementDigest: DigestSchema.nullable().default(null),
  maxTimeoutSeconds: z.number().positive().nullable().default(null),
  paymentIdentifierPosture: z.enum(["not_advertised", "advertised_absent", "bound"]).default("not_advertised"),
  paymentIdentifierRef: z.string().min(1).nullable().default(null),
  paymentIdentifierDigest: DigestSchema.nullable().default(null),
  facilitatorRef: z.string().min(1).nullable().default(null),
  sdkPackageVersions: z.record(z.string(), z.string().min(1)).default({}),
  extensionKeys: z.array(z.string().min(1)).default([]),
  gatewayCredentialRefId: z.string().min(1),
  gatewayCredentialRefDigest: DigestSchema,
  gatewayReadinessRef: z.string().min(1),
  gatewayReadinessDigest: DigestSchema,
  policyVersionRef: z.string().min(1),
  policyVersionDigest: DigestSchema,
});
export type X402PaymentParameters = z.infer<typeof X402PaymentParametersSchema>;

export type X402PaymentSignatureCommand = {
  verifiedGate: VerifiedGatewayCheck;
  parameters: X402PaymentParameters;
  credentialResolutionEvidence: CredentialResolutionEvidence;
  credentialUseRef: string;
  providerRequestRef: string;
  providerOperationRef: string;
};

export type X402LocalReferenceSandboxEvidenceBoundary = {
  boundaryKind: "x402_local_reference_sandbox";
  evidenceProfile: "local_reference_downstream_fixture";
  providerEnvironmentPosture: "local_reference_sandbox";
  fixtureScope: "local_reference_only";
  signedRetryPosture: "not_observed" | "post_gateway_check_observation_only";
  authorityCreated: false;
  paymentFinalityClaimed: false;
  settlementFinalityClaimed: false;
  facilitatorOperationClaimed: false;
  sellerMiddlewareClaimed: false;
  providerCustodyClaimed: false;
  liveProviderOperationClaimed: false;
};

export type X402PaymentSignatureEvidence = {
  evidenceRef: string;
  surfaceOperationRef: string;
  paymentSignatureHeaderName: "PAYMENT-SIGNATURE";
  paymentSignatureHeaderRef: string;
  paymentSignatureDigest: `sha256:${string}`;
  paymentPayloadShape: "official_x402_payment_payload_v2" | "local_fixture_payment_signature";
  paymentPayloadRef?: string;
  paymentPayloadDigest?: `sha256:${string}`;
  paymentIdentifierRef?: string;
  paymentIdentifierDigest?: `sha256:${string}`;
  credentialMaterialPosture: "gateway_held_redacted" | "local_fixture";
  downstreamPaymentStatus: "succeeded" | "unknown";
  paymentResponseEvidenceRef: string | null;
  providerRequestRef: string | null;
  providerOperationRef: string | null;
  additionalEvidenceRefs?: string[];
  localReferenceSandboxBoundary?: X402LocalReferenceSandboxEvidenceBoundary;
};

export interface X402WalletSigningSurface {
  signPayment(command: X402PaymentSignatureCommand): Promise<X402PaymentSignatureEvidence>;
}

/**
 * D-64 Mechanism A — gateway-held credential custody (structural, not label-only).
 *
 * The x402 signer must never mint a payment signature unless the command carries a
 * genuine {@link VerifiedGatewayCheck} AND gateway-resolved, redacted credential
 * resolution evidence bound to that same gate attempt. This makes
 * `credentialMaterialPosture: "gateway_held_redacted"` an enforced invariant rather
 * than a label: a caller-only path holding a raw `gatewayCredentialRefId` cannot
 * reach `signPayment` because it cannot produce gate-bound `used_by_gateway`
 * resolution evidence. Throws on any custody violation.
 */
export function assertGatewayHeldSigningCommand(command: X402PaymentSignatureCommand): void {
  const refuse = (reasonCode: string, detail: string): never => {
    throw new Error(`x402 gateway-held custody refused signing (${reasonCode}): ${detail}`);
  };

  const gate = command.verifiedGate;
  if (gate.gatewayCheckStatus !== "passed") {
    refuse("gateway_check_not_authoritative", "verified gate status is not passed.");
  }
  const requiredGateIds: ReadonlyArray<[keyof VerifiedGatewayCheck, string]> = [
    ["gateAttemptId", gate.gateAttemptId],
    ["mutationAttemptId", gate.mutationAttemptId],
    ["surfaceOperationRef", gate.surfaceOperationRef],
    ["actionContractId", gate.actionContractId],
    ["greenlightId", gate.greenlightId],
    ["gatewayId", gate.gatewayId],
    ["idempotencyKey", gate.idempotencyKey],
  ];
  for (const [field, value] of requiredGateIds) {
    if (!value) refuse("gateway_check_not_authoritative", `verified gate ${String(field)} is empty.`);
  }

  const evidence = command.credentialResolutionEvidence;
  if (!evidence) {
    refuse("credential_resolution_evidence_missing", "no gateway credential resolution evidence present.");
  }
  if (evidence.credentialMaterialIncluded !== false) {
    refuse("credential_material_not_redacted", "resolution evidence must not include credential material.");
  }
  if (evidence.resultClass !== "used_by_gateway") {
    refuse("credential_not_used_by_gateway", `resolution evidence resultClass is ${evidence.resultClass}.`);
  }
  if (evidence.redactionStatus !== "redacted") {
    refuse("credential_resolution_not_redacted", `resolution evidence redactionStatus is ${evidence.redactionStatus}.`);
  }
  if (evidence.gateAttemptId !== gate.gateAttemptId) {
    refuse("credential_resolution_gate_unbound", "resolution evidence is not bound to the verified gate attempt.");
  }
  if (evidence.actionContractId !== gate.actionContractId) {
    refuse("credential_resolution_contract_unbound", "resolution evidence is not bound to the gate action contract.");
  }
  if (evidence.greenlightId !== gate.greenlightId) {
    refuse("credential_resolution_greenlight_unbound", "resolution evidence is not bound to the gate greenlight.");
  }
}

export type CreateOfficialExactX402SigningSurfaceInput = {
  signer: ClientEvmSigner;
  paymentRequired: unknown;
  selectedPaymentRequirementIndex: number;
  selectedPaymentRequirementDigest: `sha256:${string}`;
  paymentIdentifier?: string | null;
  downstreamPaymentStatus?: "succeeded" | "unknown";
  paymentResponseEvidenceRef?: string | null;
  providerRequestRef?: string | null;
  providerOperationRef?: string | null;
};

export type X402WalletGatewayProtocol = {
  gatewayCheck(input: GatewayCheckInput): Promise<GatewayCheckResult>;
  recordCredentialResolutionEvidence(
    input: RecordCredentialResolutionEvidenceInput,
  ): Promise<CredentialResolutionEvidence>;
  reconcileSurfaceOperation(input: ReconcileSurfaceOperationInput): Promise<SurfaceOperationReconciliationResult>;
};

export type X402WalletGatewayInput = {
  protocol: X402WalletGatewayProtocol;
  surface: X402WalletSigningSurface;
  actionContractId: string;
  greenlightId: string;
  observedParameters: X402PaymentParameters;
  surfaceOperationRef?: string;
};

export type X402WalletGatewayResult =
  | {
      outcome: "gateway_check_refused";
      gatewayCheck: GatewayCheckResult;
      credentialResolutionEvidence: null;
      reconciliation: null;
      signatureEvidence: null;
    }
  | {
      outcome: "gateway_check_not_authoritative";
      gatewayCheck: GatewayCheckResult;
      credentialResolutionEvidence: null;
      reconciliation: null;
      signatureEvidence: null;
    }
  | {
      outcome: "payment_signature_reconciled";
      gatewayCheck: GatewayCheckResult;
      credentialResolutionEvidence: CredentialResolutionEvidence;
      reconciliation: SurfaceOperationReconciliation;
      signatureEvidence: X402PaymentSignatureEvidence;
    }
  | {
      outcome: "payment_signature_proof_gap";
      gatewayCheck: GatewayCheckResult;
      credentialResolutionEvidence: CredentialResolutionEvidence;
      reconciliation: SurfaceOperationReconciliation;
      signatureEvidence: X402PaymentSignatureEvidence;
    }
  | {
      outcome: "payment_signature_failed";
      gatewayCheck: GatewayCheckResult;
      credentialResolutionEvidence: CredentialResolutionEvidence | null;
      reconciliation: SurfaceOperationReconciliation;
      signatureEvidence: null;
    };

export async function runX402WalletGateway(input: X402WalletGatewayInput): Promise<X402WalletGatewayResult> {
  const observedParameters = X402PaymentParametersSchema.parse(input.observedParameters);
  const surfaceOperationRef = input.surfaceOperationRef ?? `surface-op:x402:${input.actionContractId}`;
  const gatewayCheck = await input.protocol.gatewayCheck({
    actionContractId: input.actionContractId,
    greenlightId: input.greenlightId,
    observedParameters,
    surfaceOperationRef,
  });

  const verifiedGate = verifiedGatewayCheckFromResult(gatewayCheck);
  if (!verifiedGate) {
    const outcome =
      gatewayCheck.gateAttempt.gateDecision === "refused" ? "gateway_check_refused" : "gateway_check_not_authoritative";
    return { outcome, gatewayCheck, credentialResolutionEvidence: null, reconciliation: null, signatureEvidence: null };
  }

  let credentialResolutionEvidence: CredentialResolutionEvidence | null = null;
  try {
    const providerRefs = providerRefsForGate(verifiedGate);
    credentialResolutionEvidence = await input.protocol.recordCredentialResolutionEvidence({
      actionContractId: input.actionContractId,
      greenlightId: input.greenlightId,
      gateAttemptId: verifiedGate.gateAttemptId,
      gatewayCredentialRefId: observedParameters.gatewayCredentialRefId,
      gatewayCredentialRefDigest: observedParameters.gatewayCredentialRefDigest,
      requestDigest: await credentialResolutionRequestDigest(verifiedGate, observedParameters),
      resultClass: "used_by_gateway",
      resultReasonCode: "gate_passed",
      redactionStatus: "redacted",
      providerRequestRef: providerRefs.providerRequestRef,
      providerOperationRef: providerRefs.providerOperationRef,
      evidenceRefs: [
        `gateway_credential_ref:${observedParameters.gatewayCredentialRefId}`,
        `digest:${observedParameters.gatewayCredentialRefDigest}`,
        `digest:${observedParameters.gatewayReadinessDigest}`,
        `digest:${observedParameters.policyVersionDigest}`,
      ],
    });
    const signingCommand: X402PaymentSignatureCommand = {
      verifiedGate,
      parameters: observedParameters,
      credentialResolutionEvidence,
      credentialUseRef: `gateway-credential-use:x402:${verifiedGate.gateAttemptId}`,
      ...providerRefs,
    };
    assertGatewayHeldSigningCommand(signingCommand);
    const signatureEvidence = await input.surface.signPayment(signingCommand);
    const evidenceRefs = [
      signatureEvidence.evidenceRef,
      signatureEvidence.paymentSignatureHeaderRef,
      `digest:${signatureEvidence.paymentSignatureDigest}`,
      `credential_resolution_evidence:${credentialResolutionEvidence.credentialResolutionEvidenceId}`,
      signatureEvidence.paymentPayloadRef ?? null,
      signatureEvidence.paymentPayloadDigest ? `digest:${signatureEvidence.paymentPayloadDigest}` : null,
      signatureEvidence.paymentIdentifierRef ?? null,
      signatureEvidence.paymentIdentifierDigest ? `digest:${signatureEvidence.paymentIdentifierDigest}` : null,
      signatureEvidence.paymentResponseEvidenceRef,
      ...(signatureEvidence.additionalEvidenceRefs ?? []),
    ].filter((value): value is string => value !== null);
    const { reconciliation } = await input.protocol.reconcileSurfaceOperation({
      mutationAttemptId: verifiedGate.mutationAttemptId,
      idempotencyKey: verifiedGate.idempotencyKey,
      observedSurfaceOperationRef: signatureEvidence.surfaceOperationRef,
      observedDownstreamStatus: signatureEvidence.downstreamPaymentStatus,
      downstreamRetryability: signatureEvidence.downstreamPaymentStatus === "succeeded" ? "non_retryable" : "unknown",
      providerRequestRef: signatureEvidence.providerRequestRef,
      providerOperationRef: signatureEvidence.providerOperationRef,
      diagnosticsRedactionPosture: "redacted",
      evidenceRefs,
      resolvedProofGapIds: [],
    });
    const outcome =
      signatureEvidence.downstreamPaymentStatus === "succeeded"
        ? "payment_signature_reconciled"
        : "payment_signature_proof_gap";
    return { outcome, gatewayCheck, credentialResolutionEvidence, reconciliation, signatureEvidence };
  } catch {
    const { reconciliation } = await input.protocol.reconcileSurfaceOperation({
      mutationAttemptId: verifiedGate.mutationAttemptId,
      idempotencyKey: verifiedGate.idempotencyKey,
      observedSurfaceOperationRef: surfaceOperationRef,
      observedDownstreamStatus: "failed",
      downstreamRetryability: "unknown",
      providerRequestRef: null,
      providerOperationRef: surfaceOperationRef,
      redactedDiagnosticsDigest: await digestCanonical({ adapter: "x402-wallet-gateway", surfaceOperationRef }),
      diagnosticsRedactionPosture: "digest_only",
      evidenceRefs: [
        `evidence:x402-payment-signature-failed:${surfaceOperationRef}`,
        ...(credentialResolutionEvidence
          ? [`credential_resolution_evidence:${credentialResolutionEvidence.credentialResolutionEvidenceId}`]
          : []),
      ],
      resolvedProofGapIds: [],
    });
    return {
      outcome: "payment_signature_failed",
      gatewayCheck,
      credentialResolutionEvidence,
      reconciliation,
      signatureEvidence: null,
    };
  }
}

export function createOfficialExactX402SigningSurface(
  input: CreateOfficialExactX402SigningSurfaceInput,
): X402WalletSigningSurface {
  const paymentRequired = validateOfficialPaymentRequired(input.paymentRequired);
  const paymentIdentifier = input.paymentIdentifier ? PaymentIdentifierSchema.parse(input.paymentIdentifier) : null;
  if (paymentIdentifier && !paymentRequiredAdvertisesPaymentIdentifier(paymentRequired)) {
    throw new Error("Official x402 payment identifier cannot be bound when the server did not advertise support.");
  }
  const paymentRequiredForClient = toOfficialClientPaymentRequired(
    paymentIdentifier ? bindPaymentIdentifier(paymentRequired, paymentIdentifier) : paymentRequired,
  );

  return {
    async signPayment(command: X402PaymentSignatureCommand): Promise<X402PaymentSignatureEvidence> {
      assertGatewayHeldSigningCommand(command);
      const paymentIdentifierDigest = await verifyPaymentIdentifierBinding({
        parameters: command.parameters,
        paymentIdentifier,
      });
      const selectedRequirement = await verifyOfficialExactSigningInput({
        paymentRequired,
        parameters: command.parameters,
        selectedPaymentRequirementIndex: input.selectedPaymentRequirementIndex,
        selectedPaymentRequirementDigest: input.selectedPaymentRequirementDigest,
      });
      const client = new x402Client((_x402Version, requirements) => {
        const selected = requirements[input.selectedPaymentRequirementIndex];
        if (!selected) {
          throw new Error("Official x402 payment requirements drifted before gateway signing.");
        }
        if (!paymentRequirementMatches(selected, selectedRequirement)) {
          throw new Error("Official x402 selected payment requirement drifted before gateway signing.");
        }
        return selected;
      }).register(command.parameters.network as OfficialX402Network, new ExactEvmScheme(input.signer));
      const httpClient = new x402HTTPClient(client);
      const paymentPayload = await client.createPaymentPayload(paymentRequiredForClient);
      validatePaymentPayload(paymentPayload);
      const paymentHeaders = httpClient.encodePaymentSignatureHeader(paymentPayload);
      const paymentSignature = paymentHeaders["PAYMENT-SIGNATURE"];
      if (!paymentSignature) {
        throw new Error("Official x402 SDK did not create a PAYMENT-SIGNATURE header for the gateway retry.");
      }
      const paymentPayloadDigest = await digestCanonical(toJsonValue(paymentPayload));
      const paymentSignatureDigest = await digestCanonical({ headerName: "PAYMENT-SIGNATURE", paymentSignature });

      return {
        evidenceRef: `evidence:x402-official-payment-signature:${command.verifiedGate.gateAttemptId}`,
        surfaceOperationRef: command.verifiedGate.surfaceOperationRef,
        paymentSignatureHeaderName: "PAYMENT-SIGNATURE",
        paymentSignatureHeaderRef: `credential:x402-payment-signature:${command.verifiedGate.gateAttemptId}`,
        paymentSignatureDigest,
        paymentPayloadShape: "official_x402_payment_payload_v2",
        paymentPayloadRef: `credential:x402-payment-payload:${command.verifiedGate.gateAttemptId}`,
        paymentPayloadDigest,
        ...(paymentIdentifier
          ? {
              paymentIdentifierRef: `payment-identifier:x402:${command.verifiedGate.gateAttemptId}`,
              paymentIdentifierDigest: requirePaymentIdentifierDigest(paymentIdentifierDigest),
            }
          : {}),
        credentialMaterialPosture: "gateway_held_redacted",
        downstreamPaymentStatus: input.downstreamPaymentStatus ?? "unknown",
        paymentResponseEvidenceRef: input.paymentResponseEvidenceRef ?? null,
        providerRequestRef: input.providerRequestRef ?? `provider-request:x402:${command.verifiedGate.gateAttemptId}`,
        providerOperationRef:
          input.providerOperationRef ?? `provider-operation:x402:${command.verifiedGate.gateAttemptId}`,
      };
    },
  };
}

function validateOfficialPaymentRequired(value: unknown): PaymentRequiredV2 {
  const paymentRequired = validatePaymentRequired(value);
  if (!isPaymentRequiredV2(paymentRequired)) {
    throw new Error("Official x402 gateway signing only supports V2 PaymentRequired evidence in the first wedge.");
  }
  return paymentRequired;
}

async function verifyPaymentIdentifierBinding(input: {
  parameters: X402PaymentParameters;
  paymentIdentifier: string | null;
}): Promise<`sha256:${string}` | null> {
  const { parameters, paymentIdentifier } = input;
  if (!paymentIdentifier) {
    if (parameters.paymentIdentifierPosture === "bound") {
      throw new Error("Official x402 gateway signing refused missing bound payment identifier material.");
    }
    return null;
  }
  const paymentIdentifierDigest = await digestCanonical({
    paymentIdentifier,
    paymentIdentifierExtension: "payment-identifier",
  });
  if (parameters.paymentIdentifierPosture !== "bound") {
    throw new Error("Official x402 gateway signing refused unbound payment identifier posture.");
  }
  if (parameters.paymentIdentifierDigest !== paymentIdentifierDigest) {
    throw new Error("Official x402 gateway signing refused payment identifier digest drift.");
  }
  return paymentIdentifierDigest;
}

function toOfficialClientPaymentRequired(paymentRequired: PaymentRequiredV2): OfficialPaymentRequired {
  return toJsonValue(paymentRequired) as OfficialPaymentRequired;
}

function bindPaymentIdentifier(paymentRequired: PaymentRequiredV2, paymentIdentifier: string): PaymentRequiredV2 {
  const clone = toJsonValue(paymentRequired) as PaymentRequiredV2;
  const existing = clone.extensions?.["payment-identifier"];
  clone.extensions = {
    ...(clone.extensions ?? {}),
    "payment-identifier": {
      ...(isPlainObject(existing) ? existing : {}),
      paymentId: paymentIdentifier,
    },
  };
  return clone;
}

function paymentRequiredAdvertisesPaymentIdentifier(paymentRequired: PaymentRequiredV2): boolean {
  return Object.hasOwn(paymentRequired.extensions ?? {}, "payment-identifier");
}

function requirePaymentIdentifierDigest(paymentIdentifierDigest: `sha256:${string}` | null): `sha256:${string}` {
  if (!paymentIdentifierDigest) throw new Error("Expected payment identifier digest for bound payment identifier.");
  return paymentIdentifierDigest;
}

async function verifyOfficialExactSigningInput(input: {
  paymentRequired: PaymentRequiredV2;
  parameters: X402PaymentParameters;
  selectedPaymentRequirementIndex: number;
  selectedPaymentRequirementDigest: `sha256:${string}`;
}): Promise<PaymentRequirementsV2> {
  const { paymentRequired, parameters, selectedPaymentRequirementIndex, selectedPaymentRequirementDigest } = input;
  if (parameters.x402EvidenceProfile !== "official_payment_required") {
    throw new Error("Official x402 gateway signing refused non-official payment evidence.");
  }
  assertRequestBodyPosture(parameters);
  assertSandboxProviderEnvironment(parameters);
  if (parameters.x402Version !== paymentRequired.x402Version) {
    throw new Error("Official x402 gateway signing refused x402 version drift.");
  }
  if (parameters.x402Scheme !== "exact") {
    throw new Error("Official x402 gateway signing refused a non-exact payment scheme.");
  }
  if (parameters.endpointUrl !== paymentRequired.resource.url) {
    throw new Error("Official x402 gateway signing refused endpoint drift.");
  }
  if (parameters.intendedRequestUrl && parameters.intendedRequestUrl !== paymentRequired.resource.url) {
    throw new Error("Official x402 gateway signing refused intended request drift.");
  }
  if (parameters.selectedPaymentRequirementDigest !== selectedPaymentRequirementDigest) {
    throw new Error("Official x402 gateway signing refused selected requirement digest drift.");
  }
  if (parameters.selectedPaymentRequirementIndex !== selectedPaymentRequirementIndex) {
    throw new Error("Official x402 gateway signing refused selected requirement index drift.");
  }
  const selectedRequirement = paymentRequired.accepts[selectedPaymentRequirementIndex];
  if (!selectedRequirement) {
    throw new Error("Official x402 gateway signing refused missing selected payment requirement.");
  }
  if (selectedRequirement.scheme !== "exact") {
    throw new Error("Official x402 gateway signing refused a non-exact selected payment requirement.");
  }
  const expectedSelectedPaymentRequirementDigest = await digestX402SelectedPaymentRequirement({
    paymentRequired,
    selectedPaymentRequirementIndex,
    selectedPaymentRequirement: selectedRequirement,
  });
  if (selectedPaymentRequirementDigest !== expectedSelectedPaymentRequirementDigest) {
    throw new Error("Official x402 gateway signing refused selected payment requirement digest mismatch.");
  }
  const expectedPaymentRequirementsDigest = await digestCanonical({
    paymentRequired: toJsonValue(paymentRequired),
    selectedPaymentRequirementIndex,
    selectedPaymentRequirementDigest,
  });
  if (parameters.paymentRequirementsDigest !== expectedPaymentRequirementsDigest) {
    throw new Error("Official x402 gateway signing refused PaymentRequired digest drift.");
  }
  if (!paymentRequirementMatchesObservedParameters(selectedRequirement, parameters)) {
    throw new Error("Official x402 gateway signing refused observed payment requirement drift.");
  }
  return selectedRequirement;
}

function assertRequestBodyPosture(parameters: X402PaymentParameters): void {
  if (parameters.intendedRequestBodyPosture === "digest_bound" && parameters.intendedRequestBodyDigest === null) {
    throw new Error("Official x402 gateway signing refused missing request body digest.");
  }
  if (["omitted", "unsupported"].includes(parameters.intendedRequestBodyPosture)) {
    throw new Error("Official x402 gateway signing refused ambiguous request body posture.");
  }
  if (parameters.intendedRequestBodyPosture === "no_body" && parameters.intendedRequestBodyDigest !== null) {
    throw new Error("Official x402 gateway signing refused request body posture mismatch.");
  }
}

function assertSandboxProviderEnvironment(parameters: X402PaymentParameters): void {
  if (parameters.providerEnvironmentPosture !== "local_reference_sandbox") {
    throw new Error("Official x402 gateway signing refused non-reference provider environment posture.");
  }
}

async function credentialResolutionRequestDigest(
  verifiedGate: VerifiedGatewayCheck,
  parameters: X402PaymentParameters,
): Promise<`sha256:${string}`> {
  return digestCanonical({
    profile: "x402_credential_resolution_request.v0",
    actionContractId: verifiedGate.actionContractId,
    gateAttemptId: verifiedGate.gateAttemptId,
    gatewayCredentialRefDigest: parameters.gatewayCredentialRefDigest,
    endpointUrl: parameters.endpointUrl,
    intendedHttpMethod: parameters.intendedHttpMethod,
    intendedRequestUrl: parameters.intendedRequestUrl,
    intendedRequestBodyPosture: parameters.intendedRequestBodyPosture,
    intendedRequestBodyDigest: parameters.intendedRequestBodyDigest,
    selectedHeadersDigest: parameters.selectedHeadersDigest,
    paymentRequirementsDigest: parameters.paymentRequirementsDigest,
    selectedPaymentRequirementIndex: parameters.selectedPaymentRequirementIndex,
    selectedPaymentRequirementDigest: parameters.selectedPaymentRequirementDigest,
    paymentIdentifierDigest: parameters.paymentIdentifierDigest,
    gatewayReadinessDigest: parameters.gatewayReadinessDigest,
    policyVersionDigest: parameters.policyVersionDigest,
  });
}

function providerRefsForGate(verifiedGate: VerifiedGatewayCheck): {
  providerRequestRef: string;
  providerOperationRef: string;
} {
  return {
    providerRequestRef: `provider-request:x402:${verifiedGate.gateAttemptId}`,
    providerOperationRef: `provider-operation:x402:${verifiedGate.gateAttemptId}`,
  };
}

function paymentRequirementMatchesObservedParameters(
  requirement: PaymentRequirementsV2,
  parameters: X402PaymentParameters,
): boolean {
  return (
    requirement.scheme === "exact" &&
    requirement.scheme === parameters.x402Scheme &&
    requirement.network === parameters.network &&
    requirement.asset === parameters.asset &&
    requirement.asset === parameters.token &&
    requirement.amount === parameters.atomicAmount &&
    requirement.payTo === parameters.payTo &&
    requirement.payTo === parameters.payee &&
    requirement.maxTimeoutSeconds === parameters.maxTimeoutSeconds
  );
}

function paymentRequirementMatches(
  left: PaymentRequirementsV2 | OfficialPaymentRequirements,
  right: PaymentRequirementsV2,
): boolean {
  return (
    left.scheme === right.scheme &&
    left.network === right.network &&
    left.asset === right.asset &&
    left.amount === right.amount &&
    left.payTo === right.payTo &&
    left.maxTimeoutSeconds === right.maxTimeoutSeconds
  );
}

function toJsonValue(value: unknown) {
  return JSON.parse(JSON.stringify(value));
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
