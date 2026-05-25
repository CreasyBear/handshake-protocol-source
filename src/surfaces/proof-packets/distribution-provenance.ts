import { gap, nonAuthorityBoundary, PROOF_PACKET_VERSION, type ProofGap } from "./shared";

export type DistributionProvenanceReadbackInput = {
  readonly generatedAt: string;
  readonly localPackage: {
    readonly name: string;
    readonly version: string;
    readonly mcpName: string;
    readonly serverJsonName: string;
    readonly serverJsonVersion: string;
    readonly exports: readonly string[];
  };
  readonly npmLatest: {
    readonly url: string;
    readonly status: number | null;
    readonly version: string | null;
    readonly tarball: string | null;
    readonly integrity: string | null;
    readonly shasum: string | null;
    readonly signatureCount: number;
    readonly fileCount: number | null;
    readonly exports: readonly string[];
  };
  readonly mcpRegistry: {
    readonly lookupUrl: string;
    readonly lookupStatus: number | null;
    readonly lookupProblemTitle: string | null;
    readonly searchUrl: string;
    readonly searchStatus: number | null;
    readonly searchCount: number | null;
  };
  readonly publishAttempt?: DistributionPublishAttemptReadback;
  readonly evidenceRefs: readonly string[];
  readonly commandRefs: readonly string[];
};

export type DistributionProvenanceReadback = ReturnType<typeof projectDistributionProvenanceReadback>;

export type DistributionPublishAttemptReadback = {
  readonly attempted: boolean;
  readonly commandRef: string;
  readonly status: "not_attempted" | "failed" | "succeeded";
  readonly provenanceRequested: boolean;
  readonly provenanceSupported: boolean | null;
  readonly errorCode: string | null;
  readonly errorMessage: string | null;
  readonly evidenceRef: string | null;
};

export function projectDistributionProvenanceReadback(input: DistributionProvenanceReadbackInput) {
  const localExports = [...input.localPackage.exports].sort();
  const publishedExports = [...input.npmLatest.exports].sort();
  const missingLocalExports = localExports.filter((entry) => !publishedExports.includes(entry));
  const extraPublishedExports = publishedExports.filter((entry) => !localExports.includes(entry));
  const npmLatestMatchesLocalVersion = input.npmLatest.version === input.localPackage.version;
  const currentSurfacePublished =
    input.npmLatest.status === 200 && npmLatestMatchesLocalVersion && missingLocalExports.length === 0;
  const mcpRegistryAccepted = input.mcpRegistry.lookupStatus === 200;
  const mcpRegistryDiscoverable =
    mcpRegistryAccepted && input.mcpRegistry.searchCount !== null && input.mcpRegistry.searchCount > 0;
  const status = currentSurfacePublished && mcpRegistryDiscoverable ? "registry_discoverable" : "blocked";

  return {
    proofKind: "distribution_provenance_readback" as const,
    proofVersion: PROOF_PACKET_VERSION,
    generatedAt: input.generatedAt,
    status,
    scope:
      "Public npm and MCP Registry readback for the current local package surface. Publication and registry discovery are distribution facts only.",
    localPackage: {
      ...input.localPackage,
      exports: localExports,
    },
    npmLatest: {
      ...input.npmLatest,
      exports: publishedExports,
      missingLocalExports,
      extraPublishedExports,
      currentSurfacePublished,
    },
    mcpRegistry: {
      ...input.mcpRegistry,
      accepted: mcpRegistryAccepted,
      discoverable: mcpRegistryDiscoverable,
    },
    publishAttempt: input.publishAttempt ?? null,
    commandRefs: input.commandRefs,
    evidenceRefs: input.evidenceRefs,
    authorityBoundary: {
      ...nonAuthorityBoundary,
      holdsCustody: false as const,
      hostsOperation: false as const,
      certifiesMarketplace: false as const,
      managesSettlement: false as const,
      managesPayment: false as const,
      establishesTrust: false as const,
      enforcesHostWidePolicy: false as const,
    },
    proofGaps: distributionProofGaps({
      npmLatestStatus: input.npmLatest.status,
      npmLatestMatchesLocalVersion,
      missingLocalExports,
      currentSurfacePublished,
      mcpRegistryAccepted,
      mcpRegistryDiscoverable,
      publishAttempt: input.publishAttempt ?? null,
    }),
    nextMechanism: currentSurfacePublished
      ? "Submit and verify MCP Registry publication for the current package version."
      : "Publish a new package version containing the current local export surface, then rerun npm and MCP Registry readback.",
  };
}

function distributionProofGaps(input: {
  readonly npmLatestStatus: number | null;
  readonly npmLatestMatchesLocalVersion: boolean;
  readonly missingLocalExports: readonly string[];
  readonly currentSurfacePublished: boolean;
  readonly mcpRegistryAccepted: boolean;
  readonly mcpRegistryDiscoverable: boolean;
  readonly publishAttempt: DistributionPublishAttemptReadback | null;
}): ProofGap[] {
  const gaps: ProofGap[] = [];
  if (input.npmLatestStatus !== 200) {
    gaps.push(
      gap(
        "npm_latest_readback_failed",
        "Current package distribution cannot be claimed without npm registry readback.",
      ),
    );
  }
  if (input.npmLatestStatus === 200 && !input.npmLatestMatchesLocalVersion) {
    gaps.push(
      gap("npm_latest_version_does_not_match_local", "The local package version is not the public latest version."),
    );
  }
  if (input.missingLocalExports.length > 0) {
    gaps.push(
      gap(
        "npm_latest_missing_current_local_exports",
        `Public npm latest does not include current local exports: ${input.missingLocalExports.join(", ")}.`,
      ),
    );
  }
  if (!input.currentSurfacePublished) {
    gaps.push(
      gap(
        "current_surface_not_publicly_published",
        "Public npm availability does not yet prove the current local product surface.",
      ),
    );
  }
  if (!input.mcpRegistryAccepted) {
    gaps.push(
      gap("mcp_registry_lookup_not_accepted", "MCP Registry direct lookup does not return the Handshake server."),
    );
  }
  if (!input.mcpRegistryDiscoverable) {
    gaps.push(
      gap(
        "mcp_registry_discoverability_not_verified",
        "MCP Registry search/discovery does not prove the Handshake server is discoverable.",
      ),
    );
  }
  if (
    input.publishAttempt?.attempted === true &&
    input.publishAttempt.provenanceRequested &&
    input.publishAttempt.status === "failed" &&
    input.publishAttempt.provenanceSupported === false
  ) {
    gaps.push(
      gap(
        "npm_provenance_generation_unsupported",
        "npm rejected trusted provenance generation in this local provider context; publishing without provenance requires explicit release-risk acceptance.",
      ),
    );
  }
  return gaps;
}
