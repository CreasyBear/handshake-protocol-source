import type { CredentialCustodyStatus } from "../catalog-envelope";

export function credentialCustodyCanSatisfyGatewayChecked(credentialCustodyStatus: CredentialCustodyStatus): boolean {
  return ["gateway_held", "fixture_gateway_held", "gateway_resolved_from_vault", "provider_gateway_held"].includes(
    credentialCustodyStatus,
  );
}
