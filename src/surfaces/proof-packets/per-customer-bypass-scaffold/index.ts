/**
 * Phase-04 D-25 deferred lane — per-customer service-workflow-admission bypass scaffold (D-54).
 * Dogfood shape only; never marks product completion for un-onboarded integrators.
 */

import { serviceWorkflowAuthorityBoundary } from "../../service-workflow-admission/index";
import { gap, nonAuthorityBoundary, PROOF_PACKET_VERSION } from "../shared";

export type PerCustomerBypassScaffoldInput = {
  readonly generatedAt: string;
  readonly commandRefs: readonly string[];
  readonly customerOnboardingRef: string | null;
  readonly firstPartyDogfoodCustomerId: string | null;
};

export type PerCustomerBypassScaffoldReadback = ReturnType<typeof projectPerCustomerBypassScaffoldReadback>;

const firstPartyDogfoodAllowlist = new Set(["handshake-internal-dogfood"]);

export function projectPerCustomerBypassScaffoldReadback(input: PerCustomerBypassScaffoldInput) {
  const proofGaps =
    input.customerOnboardingRef === null
      ? [gap("customer_onboarding_ref_absent", "Per-customer bypass evidence is absent for this customer.")]
      : [];
  const dogfoodReady =
    input.firstPartyDogfoodCustomerId !== null &&
    firstPartyDogfoodAllowlist.has(input.firstPartyDogfoodCustomerId) &&
    input.customerOnboardingRef !== null;
  const status = dogfoodReady ? ("observed_scaffold_only" as const) : ("blocked" as const);

  return {
    proofKind: "per_customer_bypass_scaffold" as const,
    proofVersion: PROOF_PACKET_VERSION,
    generatedAt: input.generatedAt,
    status,
    customerOnboardingRef: input.customerOnboardingRef,
    proofGaps,
    commandRefs: input.commandRefs,
    authorityBoundary: {
      ...nonAuthorityBoundary,
      ...serviceWorkflowAuthorityBoundary,
    },
    nextMechanism:
      status === "observed_scaffold_only"
        ? "Capture named first-party dogfood bypass packet before claiming per-customer containment."
        : "Provide customer onboarding ref for per-customer bypass scaffold; integrators stay incomplete.",
  };
}
