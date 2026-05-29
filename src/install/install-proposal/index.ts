import { z } from "zod";
import {
  ActionTypeSchema,
  GatewayRegistryEntrySchema,
  OperatingEnvelopeSchema,
  ToolCapabilitySchema,
  type ActionType,
  type GatewayRegistryEntry,
  type OperatingEnvelope,
  type ToolCapability,
} from "../../protocol/areas/catalog-envelope";
import { BypassProbeKindSchema } from "../../protocol/areas/bypass-probe";
import { HandshakeProtocolError } from "../../protocol/foundation/errors";
import { DigestSchema, IdSchema, IsoDateSchema, PROTOCOL_VERSION } from "../../protocol/foundation/schema-core";

export const InstallProposalBypassProbePlanItemSchema = z.strictObject({
  probeKind: BypassProbeKindSchema,
  requiredSourceAuthority: z.enum(["runtime_probe", "gateway_probe", "conformance_fixture"]),
  mustPassBeforeGatewayCheckedPosture: z.literal(true),
});
export type InstallProposalBypassProbePlanItem = z.infer<typeof InstallProposalBypassProbePlanItemSchema>;

export const InstallProposalCompiledKernelRecordsSchema = z.strictObject({
  toolCapability: ToolCapabilitySchema,
  actionType: ActionTypeSchema,
  gatewayRegistryEntry: GatewayRegistryEntrySchema.nullable(),
  operatingEnvelope: OperatingEnvelopeSchema,
});
export type InstallProposalCompiledKernelRecords = {
  toolCapability: ToolCapability;
  actionType: ActionType;
  gatewayRegistryEntry: GatewayRegistryEntry | null;
  operatingEnvelope: OperatingEnvelope;
};

export function requireInstallProposalGatewayRegistryEntry(
  gatewayRegistryEntry: GatewayRegistryEntry | null,
): GatewayRegistryEntry {
  if (gatewayRegistryEntry === null) {
    throw new HandshakeProtocolError(
      "install_orphan_catalog_missing_gateway",
      "Install proposal compiled records require gateway registry entry.",
      422,
    );
  }
  return gatewayRegistryEntry;
}

export const InstallProposalSchema = z.strictObject({
  installProposalId: IdSchema,
  schemaVersion: z.literal(PROTOCOL_VERSION),
  tenantId: IdSchema,
  organizationId: IdSchema,
  createdAt: IsoDateSchema,
  adapterPackId: IdSchema,
  adapterPackVersion: z.string().min(1),
  actionFamily: z.string().min(1),
  protectedSurfaceKind: z.string().min(1),
  resourceRef: z.string().min(1),
  status: z.enum(["ready_to_install", "refused"]),
  humanSummary: z.string().min(1),
  refusalReasonCodes: z.array(z.string().min(2)),
  compiledRecords: InstallProposalCompiledKernelRecordsSchema.nullable(),
  policyPackRef: z.string().min(1),
  policyPackVersion: z.string().min(1),
  bypassProbePlan: z.array(InstallProposalBypassProbePlanItemSchema),
  receiptExpectationRefs: z.array(z.string().min(1)),
  installDigest: DigestSchema,
});
export type InstallProposal = z.infer<typeof InstallProposalSchema>;
