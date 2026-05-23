import { z } from "zod";
import type { CreateIsolationInput, IsolationState } from "../../protocol/areas/isolation-breaker";
import { BuildAuthMdRevocationEvidenceInputSchema, authMdEvidenceRef, buildAuthMdRevocationEvidence } from "./profiles";
import type { AuthMdRevocationEvidence, AuthMdRevocationEventKind } from "./profiles";

export const ApplyAuthMdCredentialLifecycleIsolationInputSchema = BuildAuthMdRevocationEvidenceInputSchema.extend({
  tenantId: z.string().min(1),
  organizationId: z.string().min(1),
  isolationExpiresAt: z.string().datetime({ offset: true }).nullable().default(null),
});
export type ApplyAuthMdCredentialLifecycleIsolationInput = z.input<
  typeof ApplyAuthMdCredentialLifecycleIsolationInputSchema
>;

export type AuthMdCredentialLifecycleIsolationProtocol = {
  createIsolationState(input: CreateIsolationInput): Promise<IsolationState>;
};

export type AuthMdCredentialLifecycleIsolationResult = {
  revocationEvidence: AuthMdRevocationEvidence;
  revocationEvidenceRef: string;
  isolationState: IsolationState;
  authorityCreated: false;
  futurePolicyAndGatewayUseAllowed: false;
};

export async function applyAuthMdCredentialLifecycleIsolation(
  protocol: AuthMdCredentialLifecycleIsolationProtocol,
  inputValue: ApplyAuthMdCredentialLifecycleIsolationInput,
): Promise<AuthMdCredentialLifecycleIsolationResult> {
  const input = ApplyAuthMdCredentialLifecycleIsolationInputSchema.parse(inputValue);
  const { tenantId, organizationId, isolationExpiresAt, ...revocationEvidenceInput } = input;
  const revocationEvidence = await buildAuthMdRevocationEvidence(revocationEvidenceInput);
  const revocationEvidenceRef = authMdEvidenceRef("revocation", revocationEvidence.revocationEvidenceDigest);
  const isolationState = await protocol.createIsolationState({
    tenantId,
    organizationId,
    scopeType: "credential_ref",
    scopeId: input.gatewayCredentialRefId,
    state: authMdIsolationStateForRevocationEvent(input.revocationEventKind),
    reasonCode: input.revocationReasonCode,
    reasonSummary: authMdIsolationReasonSummary(input.revocationEventKind),
    sourceDecisionRef: revocationEvidenceRef,
    observedStreamOffsets: [],
    expiresAt: isolationExpiresAt,
  });

  return {
    revocationEvidence,
    revocationEvidenceRef,
    isolationState,
    authorityCreated: false,
    futurePolicyAndGatewayUseAllowed: false,
  };
}

export function authMdIsolationStateForRevocationEvent(
  eventKind: AuthMdRevocationEventKind,
): CreateIsolationInput["state"] {
  if (eventKind === "logout_jwt" || eventKind === "explicit_revocation" || eventKind === "credential_expired") {
    return "revoked";
  }
  if (eventKind === "ambiguous") return "state_suspect";
  return "quarantined";
}

function authMdIsolationReasonSummary(eventKind: AuthMdRevocationEventKind): string {
  if (eventKind === "logout_jwt") return "auth.md logout JWT revoked the gateway credential ref.";
  if (eventKind === "explicit_revocation") return "auth.md explicit revocation blocked the gateway credential ref.";
  if (eventKind === "credential_expired") return "auth.md credential expiry blocked the gateway credential ref.";
  if (eventKind === "downstream_401") return "auth.md downstream 401 quarantined the gateway credential ref.";
  if (eventKind === "metadata_drift") return "auth.md metadata drift quarantined the gateway credential ref.";
  return "auth.md lifecycle evidence is ambiguous; gateway credential ref is state-suspect until reconciled.";
}
