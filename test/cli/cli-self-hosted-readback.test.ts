import { describe, expect, it } from "bun:test";
import { fileURLToPath } from "node:url";
import { runCliCommand } from "../../src/cli/main";

const repoRoot = fileURLToPath(new URL("../..", import.meta.url));
const outputPath = `${repoRoot}/examples/self-hosted-activation/output/latest.json`;

describe("CLI self-hosted activation readbacks", () => {
  it("reads self-hosted packet artifacts as evidence without becoming an authority surface", async () => {
    await runSelfHostedDemo();
    const packet = await Bun.file(outputPath).json();
    const artifacts = packet.artifacts;
    const commands = [
      ["schema"],
      ["evidence", "aps-report", `${repoRoot}/${artifacts.apsReport}`],
      ["evidence", "contract-view", `${repoRoot}/${artifacts.contractView}`],
      ["evidence", "receipt-timeline", `${repoRoot}/${artifacts.receiptTimeline}`],
      ["install", "health", `${repoRoot}/${artifacts.installHealth}`],
      [
        "cert",
        "verify",
        `${repoRoot}/${artifacts.certificate}`,
        "--trust-bundle",
        `${repoRoot}/${artifacts.trustBundle}`,
      ],
      ["support", "bundle", `${repoRoot}/${artifacts.supportBundleInput}`],
    ] as const;

    for (const argv of commands) {
      const result = (await runCliCommand(argv)) as {
        ok: boolean;
        authorityCreated: boolean;
        greenlightCreated: boolean;
        gatewayCheckPerformed: boolean;
        mutationAttempted: boolean;
        credentialMaterialIncluded: boolean;
        rawInternalRecordIncluded: boolean;
        receiptExportCreated: boolean;
        command: string;
      };
      expect(result.ok).toBe(true);
      expect(result.authorityCreated).toBe(false);
      expect(result.greenlightCreated).toBe(false);
      expect(result.gatewayCheckPerformed).toBe(false);
      expect(result.mutationAttempted).toBe(false);
      expect(result.credentialMaterialIncluded).toBe(false);
      expect(result.rawInternalRecordIncluded).toBe(false);
      expect(result.receiptExportCreated).toBe(false);
      expect(result.command.length).toBeGreaterThan(0);
    }
  });

  it("returns typed non-authority errors for malformed packet fixtures", async () => {
    const badPath = `${repoRoot}/examples/self-hosted-activation/output/malformed.json`;
    await Bun.write(badPath, "{not-json");
    const proc = Bun.spawn([process.execPath, "run", "./src/cli/main.ts", "evidence", "aps-report", badPath], {
      cwd: repoRoot,
      stdout: "pipe",
      stderr: "pipe",
    });
    const stdoutPromise = proc.stdout ? new Response(proc.stdout).text() : Promise.resolve("");
    const stderrPromise = proc.stderr ? new Response(proc.stderr).text() : Promise.resolve("");
    const exitCode = await proc.exited;
    const stdout = await stdoutPromise;
    const stderr = await stderrPromise;
    const result = JSON.parse(stderr || stdout) as {
      ok: boolean;
      reasonCodes: readonly string[];
      authorityCreated: boolean;
      gatewayCheckPerformed: boolean;
      mutationAttempted: boolean;
    };

    expect(exitCode).toBe(1);
    expect(result.ok).toBe(false);
    expect(result.reasonCodes).toContain("cli_input_json_invalid");
    expect(result.authorityCreated).toBe(false);
    expect(result.gatewayCheckPerformed).toBe(false);
    expect(result.mutationAttempted).toBe(false);
  });
});

async function runSelfHostedDemo(): Promise<void> {
  const proc = Bun.spawn([process.execPath, "run", "./examples/self-hosted-activation/run.ts"], {
    cwd: repoRoot,
    stdout: "pipe",
    stderr: "pipe",
  });
  const stderrPromise = proc.stderr ? new Response(proc.stderr).text() : Promise.resolve("");
  const exitCode = await proc.exited;
  const stderr = await stderrPromise;
  expect(stderr).toBe("");
  expect(exitCode).toBe(0);
}
