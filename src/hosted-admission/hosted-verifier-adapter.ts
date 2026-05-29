import { z } from "zod";
import { HandshakeProtocolError } from "../protocol/foundation/errors";
import {
  HostedIdentityEvidenceInputSchema,
  HostedIdentityProviderKindSchema,
  transitionCallerIdentityFromHostedEvidence,
  type HostedCallerVerifier,
  type HostedCallerVerifierInput,
  type HostedIdentityProviderKind,
  type TransitionCallerIdentity,
} from "./hosted-caller-identity";

export const HostedProviderVerificationPostureSchema = z.enum([
  "provider_sdk_verified",
  "provider_jwks_verified",
  "provider_webhook_verified",
  "service_credential_verified",
  "fixture_verified",
  "custom_verified",
]);
export type HostedProviderVerificationPosture = z.infer<typeof HostedProviderVerificationPostureSchema>;

export const HostedProviderMembershipPostureSchema = z.enum(["current", "missing", "revoked", "stale", "unknown"]);
export type HostedProviderMembershipPosture = z.infer<typeof HostedProviderMembershipPostureSchema>;

export const HostedVerifierAdapterClaimsSchema = HostedIdentityEvidenceInputSchema.extend({
  providerVerificationPosture: HostedProviderVerificationPostureSchema,
  verificationEvidenceRefs: z.array(z.string().min(1).max(500)).min(1),
  revocationEpochEvidenceRefs: z.array(z.string().min(1).max(500)).min(1),
  activeOrganizationId: z.string().min(1).max(200).nullable().default(null),
  requestedOrganizationId: z.string().min(1).max(200).nullable().default(null),
  membershipPosture: HostedProviderMembershipPostureSchema.default("current"),
  rawIdentityMaterialPersisted: z.literal(false),
  identityProviderLockInCreated: z.literal(false),
});
export type HostedVerifierAdapterClaims = z.infer<typeof HostedVerifierAdapterClaimsSchema>;
export type HostedVerifierAdapterClaimsInput = z.input<typeof HostedVerifierAdapterClaimsSchema>;

export type HostedVerifierAdapter = {
  readonly providerKind: HostedIdentityProviderKind;
  verify(input: HostedCallerVerifierInput): Promise<HostedVerifierAdapterClaimsInput>;
};

export type HostedVerifierAdapterOptions = {
  readonly allowedProviderKinds?: readonly HostedIdentityProviderKind[];
  readonly requireActiveOrganization?: boolean;
};

export function createHostedCallerVerifierFromAdapter(
  adapter: HostedVerifierAdapter,
  options: HostedVerifierAdapterOptions = {},
): HostedCallerVerifier {
  return {
    async verify(input) {
      const claims = HostedVerifierAdapterClaimsSchema.parse(await adapter.verify(input));
      assertAdapterProviderMatches(adapter.providerKind, claims.providerKind);
      assertProviderAllowed(claims, options.allowedProviderKinds);
      assertActiveOrganization(claims, options.requireActiveOrganization ?? false);
      assertMembershipCurrent(claims);
      const identityEvidence = HostedIdentityEvidenceInputSchema.strip().parse({
        ...claims,
        evidenceRefs: [
          ...claims.evidenceRefs,
          ...claims.verificationEvidenceRefs,
          ...claims.revocationEpochEvidenceRefs,
        ],
      });
      return transitionCallerIdentityFromHostedEvidence(identityEvidence);
    },
  };
}

function assertAdapterProviderMatches(
  adapterProviderKind: HostedIdentityProviderKind,
  claimsProviderKind: HostedIdentityProviderKind,
): void {
  if (adapterProviderKind !== claimsProviderKind) {
    throw new HandshakeProtocolError(
      "hosted_caller_provider_forbidden",
      "Hosted caller verifier adapter returned claims for a different identity provider kind.",
      403,
      { retryability: "terminal", commitState: "not_started" },
    );
  }
}

export function isHostedIdentityProviderKind(value: string): value is HostedIdentityProviderKind {
  return HostedIdentityProviderKindSchema.safeParse(value).success;
}

function assertProviderAllowed(
  claims: HostedVerifierAdapterClaims,
  allowedProviderKinds: readonly HostedIdentityProviderKind[] | undefined,
): void {
  if (adapterProviderMismatch(claims.providerKind, allowedProviderKinds)) {
    throw new HandshakeProtocolError(
      "hosted_caller_provider_forbidden",
      "Hosted caller verifier returned an identity provider that is not admitted by this deployment.",
      403,
      { retryability: "terminal", commitState: "not_started" },
    );
  }
}

function adapterProviderMismatch(
  providerKind: HostedIdentityProviderKind,
  allowedProviderKinds: readonly HostedIdentityProviderKind[] | undefined,
): boolean {
  return Boolean(allowedProviderKinds && !allowedProviderKinds.includes(providerKind));
}

function assertActiveOrganization(claims: HostedVerifierAdapterClaims, requireActiveOrganization: boolean): void {
  if (requireActiveOrganization && !claims.activeOrganizationId) {
    throw new HandshakeProtocolError(
      "hosted_caller_active_org_required",
      "Hosted caller verifier did not produce active organization evidence.",
      403,
      { retryability: "terminal", commitState: "not_started" },
    );
  }
  if (
    claims.activeOrganizationId &&
    claims.requestedOrganizationId &&
    claims.activeOrganizationId !== claims.requestedOrganizationId
  ) {
    throw new HandshakeProtocolError(
      "hosted_caller_active_org_mismatch",
      "Hosted caller active organization does not match the requested hosted organization scope.",
      403,
      { retryability: "terminal", commitState: "not_started" },
    );
  }
}

function assertMembershipCurrent(claims: HostedVerifierAdapterClaims): void {
  if (claims.membershipPosture !== "current") {
    throw new HandshakeProtocolError(
      "hosted_caller_membership_not_current",
      "Hosted caller membership evidence is missing, stale, revoked, or unknown.",
      403,
      { retryability: "terminal", commitState: "not_started" },
    );
  }
}

export type HostedVerifierAdapterResult = Promise<TransitionCallerIdentity>;
