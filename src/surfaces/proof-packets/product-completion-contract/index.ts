/** Single source for pack:check and `scripts/check-product-completion.mjs` parity (D-14, D-53). */

export type ProductCompletionGateId =
  | "codex_local_host_activation"
  | "public_distribution_and_registry"
  | "customer_gateway_live_x402_paid_proof"
  | "auth_md_x402_admission_packet"
  | "dual_enforcement_posture"
  | "per_customer_bypass_scaffold";

export const PRODUCT_COMPLETION_READBACK_KIND = "product_completion_readback" as const;

export const PRODUCT_COMPLETION_STATUSES = ["completed", "closed_with_hard_blocks", "incomplete"] as const;

export type ProductCompletionStatus = (typeof PRODUCT_COMPLETION_STATUSES)[number];

/**
 * Phase-04 dual-enforcement posture (04-01, deferred 04-11) plus closeout gates.
 * `dual_enforcement_posture` stays incomplete until structural architecture evidence
 * backs it — not doc-only posture (adjudication risk #1).
 */
export const PRODUCT_COMPLETION_GATE_IDS = [
  "codex_local_host_activation",
  "public_distribution_and_registry",
  "customer_gateway_live_x402_paid_proof",
  "auth_md_x402_admission_packet",
  "dual_enforcement_posture",
  "per_customer_bypass_scaffold",
] as const satisfies readonly ProductCompletionGateId[];

export const PRODUCT_COMPLETION_PACK_CHECK_EXPECT_STATUS = "incomplete" as const;

export function assertProductCompletionGateIds(
  gateIds: readonly string[],
): asserts gateIds is readonly ProductCompletionGateId[] {
  const expected = new Set(PRODUCT_COMPLETION_GATE_IDS);
  for (const gateId of gateIds) {
    if (!expected.has(gateId as ProductCompletionGateId)) {
      throw new Error(`Unexpected product completion gate id: ${gateId}`);
    }
  }
  if (gateIds.length !== PRODUCT_COMPLETION_GATE_IDS.length) {
    throw new Error(
      `Product completion gate count mismatch: expected ${PRODUCT_COMPLETION_GATE_IDS.length}, got ${gateIds.length}`,
    );
  }
}
