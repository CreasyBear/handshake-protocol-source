import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { z } from "zod";
import type {
  PackageInstallMutationCommand,
  PackageInstallMutationEvidence,
  PackageInstallMutationSurface,
} from "../../src/adapters/package-install/gateway";

const PackageManifestSchema = z.strictObject({
  dependencies: z.record(z.string(), z.string()).default({}),
});
export type PackageManifest = z.infer<typeof PackageManifestSchema>;

export class FilePackageManifestSurface implements PackageInstallMutationSurface {
  mutationCount = 0;

  constructor(private readonly manifestPath: string) {}

  async readManifest(): Promise<PackageManifest> {
    try {
      const text = await readFile(this.manifestPath, "utf8");
      return PackageManifestSchema.parse(JSON.parse(text));
    } catch (error) {
      if (isMissingFile(error)) return { dependencies: {} };
      throw error;
    }
  }

  async writeManifest(manifest: PackageManifest): Promise<void> {
    await mkdir(dirname(this.manifestPath), { recursive: true });
    await writeFile(this.manifestPath, `${JSON.stringify(PackageManifestSchema.parse(manifest), null, 2)}\n`);
  }

  async applyPackageInstall(command: PackageInstallMutationCommand): Promise<PackageInstallMutationEvidence> {
    const manifest = await this.readManifest();
    const dependencies = { ...manifest.dependencies, [command.packageName]: command.versionRange };
    await this.writeManifest({ dependencies });
    this.mutationCount += 1;
    return {
      evidenceRef: `evidence:package-manifest:${command.verifiedGate.surfaceOperationRef}:${this.mutationCount}`,
      surfaceOperationRef: command.verifiedGate.surfaceOperationRef,
      packageName: command.packageName,
      versionRange: command.versionRange,
    };
  }
}

function isMissingFile(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT";
}
