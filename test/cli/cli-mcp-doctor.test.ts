import { describe, expect, it } from "bun:test";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { mcpDoctorCommand } from "../../src/cli/mcp/doctor";
import { localProjectConfigRef } from "../../src/cli/local-project";

describe("MCP doctor attestation framing", () => {
  it("mirrors host doctor attestation fields with explicit nonClaims and no config mutation", async () => {
    const workspace = await mkdtemp(join(tmpdir(), "handshake-mcp-doctor-"));
    await mkdir(join(workspace, ".handshake"), { recursive: true });
    await writeFile(
      localProjectConfigRef(workspace),
      `${JSON.stringify(
        {
          projectId: "proj_mcp_doctor",
          stateRootRef: join(workspace, "state"),
          trustBundleRef: join(workspace, "trust.json"),
        },
        null,
        2,
      )}\n`,
    );

    const output = await mcpDoctorCommand({ cwd: workspace });

    expect(output.command).toBe("mcp doctor");
    expect(output.nonClaims?.length).toBeGreaterThan(0);
    expect(output.warnings?.some((w) => w.includes("attestation evidence"))).toBe(true);

    const result = output.result as Record<string, unknown>;
    expect(result.evidenceKind).toBe("cli_diagnostic");
    expect(result.liveHostVerificationStatus).toBe("not_performed");
    expect(result.configMutationPerformedByDoctor).toBe(false);
    expect(result.attestationEvidence).toBeDefined();
    expect(result.attestationDigest).toMatch(/^sha256:/);
  });
});
