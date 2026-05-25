import { z } from "zod";
import { InstallProposalCompiledKernelRecordsSchema } from "../../../install";
import { IdSchema, DigestSchema } from "../../foundation/schema-core";
import { RefusalSchema } from "../refusal/schemas";

export const InstallSetupAuthorityBoundarySchema = z.strictObject({
  authorityCreated: z.literal(false),
  authorityCertificateMinted: z.literal(false),
  credentialMaterialIncluded: z.literal(false),
  gatewayCheckPerformed: z.literal(false),
  greenlightCreated: z.literal(false),
  mutationAttempted: z.literal(false),
  mutationCommandIncluded: z.literal(false),
  rawInternalRecordIncluded: z.literal(false),
  receiptExportCreated: z.literal(false),
});
export type InstallSetupAuthorityBoundary = z.infer<typeof InstallSetupAuthorityBoundarySchema>;

export const InstallSetupRecordRefsSchema = z.strictObject({
  toolCapabilityId: IdSchema,
  actionTypeId: IdSchema,
  gatewayRegistryEntryId: IdSchema,
  operatingEnvelopeId: IdSchema,
});
export type InstallSetupRecordRefs = z.infer<typeof InstallSetupRecordRefsSchema>;

const InstallSetupResultBaseSchema = InstallSetupAuthorityBoundarySchema.extend({
  installProposalId: IdSchema,
  installDigest: DigestSchema,
  adapterPackId: IdSchema,
  adapterPackVersion: z.string().min(1),
  actionFamily: z.string().min(1),
  protectedSurfaceKind: z.string().min(1),
});

export const InstallSetupRegisteredResultSchema = InstallSetupResultBaseSchema.extend({
  outcome: z.literal("compiled_records_registered"),
  commitAtomicity: z.literal("server_store_commit"),
  records: InstallProposalCompiledKernelRecordsSchema,
  recordRefs: InstallSetupRecordRefsSchema,
  refusal: z.null(),
});
export type InstallSetupRegisteredResult = z.infer<typeof InstallSetupRegisteredResultSchema>;

export const InstallSetupRefusedResultSchema = InstallSetupResultBaseSchema.extend({
  outcome: z.literal("install_proposal_refused"),
  commitAtomicity: z.literal("server_store_commit"),
  reasonCodes: z.array(z.string().min(1)),
  records: z.null(),
  recordRefs: z.null(),
  refusal: RefusalSchema,
});
export type InstallSetupRefusedResult = z.infer<typeof InstallSetupRefusedResultSchema>;

export const InstallSetupResultSchema = z.discriminatedUnion("outcome", [
  InstallSetupRegisteredResultSchema,
  InstallSetupRefusedResultSchema,
]);
export type InstallSetupResult = z.infer<typeof InstallSetupResultSchema>;
