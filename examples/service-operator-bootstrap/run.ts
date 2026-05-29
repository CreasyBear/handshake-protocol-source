import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import {
  defaultX402BootstrapInstallInput,
  runServiceBootstrap,
} from "../../src/cli/service-operator/bootstrap";

const outputDir = new URL("./output/", import.meta.url);
const outputJsonPath = new URL("./output/latest.json", import.meta.url);
const goldenPathDoc = "docs/internal/service-operator-golden-path.md";

console.log("# Service Operator Bootstrap (x402 family only)\n");
console.log(`Golden path: ${goldenPathDoc}`);
console.log("Scope: atomic catalog triplet via InstallClient — no authority.\n");

const installInput = defaultX402BootstrapInstallInput();
const result = await runServiceBootstrap({ installInput });

const summary = {
  schemaVersion: "handshake.demo.service-operator-bootstrap.v1",
  generatedAt: new Date().toISOString(),
  authorityBoundary: {
    authorityCreated: false,
    greenlightCreated: false,
    gatewayCheckPerformed: false,
    mutationAttempted: false,
  },
  docs: { goldenPath: goldenPathDoc },
  install: {
    outcome: result.outcome,
    actionFamily: result.actionFamily,
    installProposalId: result.installProposalId,
    installDigest: result.installDigest,
    reasonCodes: result.reasonCodes,
    recordRefs: result.recordRefs,
    policyPackRef: result.policyPackRef,
    policyPackVersion: result.policyPackVersion,
  },
  commands: {
    example: "bun run examples/service-operator-bootstrap/run.ts",
    cli: "handshake service bootstrap",
  },
};

await mkdir(outputDir, { recursive: true });
await writeFile(outputJsonPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");

console.log(JSON.stringify(summary, null, 2));
console.log(`\nWrote: ${fileURLToPath(outputJsonPath)}`);

if (result.outcome !== "compiled_records_registered") {
  process.exitCode = 1;
}
