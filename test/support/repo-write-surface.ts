import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import type {
  RepoWriteMutationCommand,
  RepoWriteMutationEvidence,
  RepoWriteMutationSurface,
} from "../../src/adapters/repo-write/gateway";

export class FileRepoWriteSurface implements RepoWriteMutationSurface {
  mutationCount = 0;

  constructor(private readonly repositoryRoot: string) {}

  async readFile(filePath: string): Promise<string | null> {
    try {
      return await readFile(this.safePath(filePath), "utf8");
    } catch (error) {
      if (isMissingFile(error)) return null;
      throw error;
    }
  }

  async applyRepoWrite(command: RepoWriteMutationCommand): Promise<RepoWriteMutationEvidence> {
    const targetPath = this.safePath(command.filePath);
    await mkdir(dirname(targetPath), { recursive: true });
    await writeFile(targetPath, command.content);
    this.mutationCount += 1;
    return {
      evidenceRef: `evidence:repo-file:${command.verifiedGate.surfaceOperationRef}:${this.mutationCount}`,
      surfaceOperationRef: command.verifiedGate.surfaceOperationRef,
      repositoryRef: command.repositoryRef,
      filePath: command.filePath,
      contentDigest: command.contentDigest,
      contentByteLength: command.contentByteLength,
    };
  }

  private safePath(filePath: string): string {
    const root = resolve(this.repositoryRoot);
    const target = resolve(join(root, filePath));
    if (target !== root && !target.startsWith(`${root}/`)) {
      throw new Error("Repo write target escaped repository root.");
    }
    return target;
  }
}

function isMissingFile(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT";
}
