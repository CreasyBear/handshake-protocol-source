import { z } from "zod";
import { IsoDateSchema } from "../protocol/public/schemas";

export const PackageReleaseStateSchema = z.enum([
  "blocked_by_proof_gap",
  "ready_to_publish",
  "actually_published",
  "registry_discoverable",
]);
export type PackageReleaseState = z.infer<typeof PackageReleaseStateSchema>;

export const PackageReleaseAuthorityBoundarySchema = z.strictObject({
  createsAuthority: z.literal(false),
  createsPolicyDecision: z.literal(false),
  createsGreenlight: z.literal(false),
  performsGatewayCheck: z.literal(false),
  performsMutation: z.literal(false),
  holdsCustody: z.literal(false),
  hostsOperation: z.literal(false),
  certifiesMarketplace: z.literal(false),
  managesSettlement: z.literal(false),
  managesPayment: z.literal(false),
  establishesTrust: z.literal(false),
  enforcesHostWidePolicy: z.literal(false),
});
export type PackageReleaseAuthorityBoundary = z.infer<typeof PackageReleaseAuthorityBoundarySchema>;

export const packageReleaseAuthorityBoundary = PackageReleaseAuthorityBoundarySchema.parse({
  createsAuthority: false,
  createsPolicyDecision: false,
  createsGreenlight: false,
  performsGatewayCheck: false,
  performsMutation: false,
  holdsCustody: false,
  hostsOperation: false,
  certifiesMarketplace: false,
  managesSettlement: false,
  managesPayment: false,
  establishesTrust: false,
  enforcesHostWidePolicy: false,
});

const NonEmptyStringSchema = z.string().min(1);

export const PackageReleaseProofGapSchema = z.strictObject({
  reasonCode: NonEmptyStringSchema,
  evidenceRefs: z.array(NonEmptyStringSchema),
});
export type PackageReleaseProofGap = z.infer<typeof PackageReleaseProofGapSchema>;

export const PackageShapeProofSchema = z.strictObject({
  packDryRunChecked: z.boolean(),
  requiredFilesPresent: z.boolean(),
  forbiddenPathsAbsent: z.boolean(),
  packageSurfaceAllowlisted: z.boolean(),
  sourceTreeExcluded: z.boolean(),
  repoInternalDocsExcluded: z.boolean(),
  licenseFilesPresent: z.boolean(),
  exportsReviewed: z.boolean(),
  binShebangsChecked: z.boolean(),
  cliSmokePassed: z.boolean(),
  mcpStdioSmokePassed: z.boolean(),
  metadataSynchronized: z.boolean(),
  authorityBoundaryChecked: z.boolean(),
  evidenceRefs: z.array(NonEmptyStringSchema),
});
export type PackageShapeProof = z.infer<typeof PackageShapeProofSchema>;

export const AccountNamespaceProofSchema = z.strictObject({
  npmPackageName: NonEmptyStringSchema,
  packageVersion: NonEmptyStringSchema,
  npmNamespaceOwnership: z.enum(["verified", "not_verified", "proof_gap"]),
  mcpNamespaceOwnership: z.enum(["verified", "not_verified", "proof_gap"]),
  twoFactorPosture: z.enum(["verified", "not_verified", "proof_gap"]),
  publishTokenPosture: z.enum(["trusted_publishing_preferred", "long_lived_token_risk", "proof_gap"]),
  evidenceRefs: z.array(NonEmptyStringSchema),
});
export type AccountNamespaceProof = z.infer<typeof AccountNamespaceProofSchema>;

export const PublishOperationProofSchema = z.strictObject({
  npmPublished: z.boolean(),
  packageName: NonEmptyStringSchema,
  packageVersion: NonEmptyStringSchema,
  publishedAt: IsoDateSchema.nullable(),
  publishEvidenceRefs: z.array(NonEmptyStringSchema),
});
export type PublishOperationProof = z.infer<typeof PublishOperationProofSchema>;

export const ProvenanceProofSchema = z.strictObject({
  posture: z.enum(["trusted_publishing_configured", "long_lived_token_risk_accepted", "not_requested", "proof_gap"]),
  provenanceAttestationPublished: z.boolean(),
  evidenceRefs: z.array(NonEmptyStringSchema),
});
export type ProvenanceProof = z.infer<typeof ProvenanceProofSchema>;

export const RegistryDiscoverabilityProofSchema = z.strictObject({
  mcpRegistryAccepted: z.boolean(),
  discoverabilityChecked: z.boolean(),
  registryEvidenceRefs: z.array(NonEmptyStringSchema),
});
export type RegistryDiscoverabilityProof = z.infer<typeof RegistryDiscoverabilityProofSchema>;

export const RuntimeSmokeProofSchema = z.strictObject({
  localPackSmokePassed: z.boolean(),
  cleanInstallSmokePassed: z.boolean(),
  installedBinsSmokePassed: z.boolean(),
  installedExportsSmokePassed: z.boolean(),
  proposalEvidenceReadOnlySmokePassed: z.boolean(),
  evidenceRefs: z.array(NonEmptyStringSchema),
});
export type RuntimeSmokeProof = z.infer<typeof RuntimeSmokeProofSchema>;

export const PackageReleaseProofInputSchema = z.strictObject({
  packageName: NonEmptyStringSchema,
  packageVersion: NonEmptyStringSchema,
  mcpName: NonEmptyStringSchema,
  packageShapeProof: PackageShapeProofSchema,
  accountNamespaceProof: AccountNamespaceProofSchema,
  publishOperationProof: PublishOperationProofSchema,
  provenanceProof: ProvenanceProofSchema,
  registryDiscoverabilityProof: RegistryDiscoverabilityProofSchema,
  runtimeSmokeProof: RuntimeSmokeProofSchema,
  proofGaps: z.array(PackageReleaseProofGapSchema),
});
export type PackageReleaseProofInput = z.infer<typeof PackageReleaseProofInputSchema>;

export const PackageReleaseProofSchema = PackageReleaseProofInputSchema.extend({
  proofKind: z.literal("package_release_proof"),
  releaseState: PackageReleaseStateSchema,
  readyToPublish: z.boolean(),
  actuallyPublished: z.boolean(),
  registryDiscoverable: z.boolean(),
  authorityBoundary: PackageReleaseAuthorityBoundarySchema,
});
export type PackageReleaseProof = z.infer<typeof PackageReleaseProofSchema>;

export function projectPackageReleaseProof(inputValue: PackageReleaseProofInput): PackageReleaseProof {
  const input = PackageReleaseProofInputSchema.parse(inputValue);
  const prePublishProofGaps = [...input.proofGaps, ...derivedPrePublishProofGaps(input)];
  const proofGaps = [...prePublishProofGaps, ...derivedPostPublishProofGaps(input)];
  const readyToPublish = prePublishProofGaps.length === 0 && localReadinessPassed(input);
  const actuallyPublished =
    readyToPublish &&
    input.publishOperationProof.npmPublished &&
    input.runtimeSmokeProof.cleanInstallSmokePassed &&
    input.runtimeSmokeProof.installedBinsSmokePassed &&
    input.runtimeSmokeProof.installedExportsSmokePassed;
  const registryDiscoverable =
    actuallyPublished &&
    input.registryDiscoverabilityProof.mcpRegistryAccepted &&
    input.registryDiscoverabilityProof.discoverabilityChecked;

  return PackageReleaseProofSchema.parse({
    ...input,
    proofKind: "package_release_proof",
    releaseState: releaseStateFor({ readyToPublish, actuallyPublished, registryDiscoverable }),
    readyToPublish,
    actuallyPublished,
    registryDiscoverable,
    proofGaps: dedupeProofGaps(proofGaps),
    authorityBoundary: packageReleaseAuthorityBoundary,
  });
}

function localReadinessPassed(input: PackageReleaseProofInput): boolean {
  return (
    Object.entries(input.packageShapeProof)
      .filter(([key]) => key !== "evidenceRefs")
      .every(([, value]) => value === true) &&
    input.accountNamespaceProof.npmNamespaceOwnership === "verified" &&
    input.accountNamespaceProof.mcpNamespaceOwnership === "verified" &&
    input.accountNamespaceProof.twoFactorPosture === "verified" &&
    input.accountNamespaceProof.publishTokenPosture !== "proof_gap" &&
    input.provenanceProof.posture !== "proof_gap" &&
    input.runtimeSmokeProof.localPackSmokePassed &&
    input.runtimeSmokeProof.proposalEvidenceReadOnlySmokePassed
  );
}

function releaseStateFor(input: {
  readyToPublish: boolean;
  actuallyPublished: boolean;
  registryDiscoverable: boolean;
}): PackageReleaseState {
  if (input.registryDiscoverable) return "registry_discoverable";
  if (input.actuallyPublished) return "actually_published";
  if (input.readyToPublish) return "ready_to_publish";
  return "blocked_by_proof_gap";
}

function derivedPrePublishProofGaps(input: PackageReleaseProofInput): PackageReleaseProofGap[] {
  const proofGaps: PackageReleaseProofGap[] = [];
  if (!localShapePassed(input.packageShapeProof)) {
    proofGaps.push(gap("package_shape_preflight_incomplete", input.packageShapeProof.evidenceRefs));
  }
  if (input.accountNamespaceProof.npmNamespaceOwnership !== "verified") {
    proofGaps.push(gap("npm_namespace_ownership_unverified", input.accountNamespaceProof.evidenceRefs));
  }
  if (input.accountNamespaceProof.mcpNamespaceOwnership !== "verified") {
    proofGaps.push(gap("mcp_namespace_ownership_unverified", input.accountNamespaceProof.evidenceRefs));
  }
  if (input.accountNamespaceProof.twoFactorPosture !== "verified") {
    proofGaps.push(gap("npm_two_factor_posture_unverified", input.accountNamespaceProof.evidenceRefs));
  }
  if (input.accountNamespaceProof.publishTokenPosture === "proof_gap") {
    proofGaps.push(gap("npm_publish_token_posture_unknown", input.accountNamespaceProof.evidenceRefs));
  }
  if (input.provenanceProof.posture === "proof_gap") {
    proofGaps.push(gap("npm_provenance_posture_unknown", input.provenanceProof.evidenceRefs));
  }
  return proofGaps;
}

function derivedPostPublishProofGaps(input: PackageReleaseProofInput): PackageReleaseProofGap[] {
  const proofGaps: PackageReleaseProofGap[] = [];
  if (!input.publishOperationProof.npmPublished) {
    proofGaps.push(gap("npm_publish_operation_not_performed", input.publishOperationProof.publishEvidenceRefs));
  }
  if (!input.runtimeSmokeProof.cleanInstallSmokePassed) {
    proofGaps.push(gap("post_publish_clean_install_not_verified", input.runtimeSmokeProof.evidenceRefs));
  }
  if (!input.registryDiscoverabilityProof.mcpRegistryAccepted) {
    proofGaps.push(
      gap("mcp_registry_submission_not_accepted", input.registryDiscoverabilityProof.registryEvidenceRefs),
    );
  }
  if (!input.registryDiscoverabilityProof.discoverabilityChecked) {
    proofGaps.push(
      gap("mcp_registry_discoverability_not_verified", input.registryDiscoverabilityProof.registryEvidenceRefs),
    );
  }
  return proofGaps;
}

function localShapePassed(proof: PackageShapeProof): boolean {
  return Object.entries(proof)
    .filter(([key]) => key !== "evidenceRefs")
    .every(([, value]) => value === true);
}

function gap(reasonCode: string, evidenceRefs: string[]): PackageReleaseProofGap {
  return PackageReleaseProofGapSchema.parse({ reasonCode, evidenceRefs });
}

function dedupeProofGaps(proofGaps: PackageReleaseProofGap[]): PackageReleaseProofGap[] {
  const byReasonCode = new Map<string, PackageReleaseProofGap>();
  for (const proofGap of proofGaps) byReasonCode.set(proofGap.reasonCode, proofGap);
  return [...byReasonCode.values()].sort((left, right) => left.reasonCode.localeCompare(right.reasonCode));
}
