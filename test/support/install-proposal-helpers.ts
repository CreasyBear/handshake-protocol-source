import type { X402InstallProposal } from "../../src/adapters/x402-payment/install-proposal";
import {
  requireInstallProposalGatewayRegistryEntry,
  type InstallProposalCompiledKernelRecords,
} from "../../src/install/install-proposal";
import type { GatewayRegistryEntry } from "../../src/protocol/public/schemas";

/** Local sandbox x402 attempts must bind selected requirement index for exact policy evaluation. */
export const localX402SelectedPaymentRequirementIndex = 0;
export const localX402SelectedPaymentRequirementDigest = `sha256:${"b".repeat(64)}` as const;

export function localX402PaymentAttemptBindings() {
  return {
    selectedPaymentRequirementIndex: localX402SelectedPaymentRequirementIndex,
    selectedPaymentRequirementDigest: localX402SelectedPaymentRequirementDigest,
  } as const;
}

export function requireX402CompiledRecords(proposal: X402InstallProposal): InstallProposalCompiledKernelRecords {
  if (!proposal.compiledRecords) {
    throw new Error("expected installable x402 proposal compiled records");
  }
  return proposal.compiledRecords;
}

export function requireX402GatewayRegistryEntry(records: InstallProposalCompiledKernelRecords): GatewayRegistryEntry {
  return requireInstallProposalGatewayRegistryEntry(records.gatewayRegistryEntry);
}
