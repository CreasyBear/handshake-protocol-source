import { readFile } from "node:fs/promises";
import { renderApsReportCommand } from "./aps-report";
import { verifyCertificateCommand } from "./certificate";
import { cliCommandManifest, cliSchemaOutput } from "./command-manifest";
import { x402PaymentConformanceCommand } from "./conformance";
import { cliOutput } from "./output";

export async function runCliCommand(argv: readonly string[]): Promise<unknown> {
  const [group, subcommand, maybePath, ...rest] = argv;
  if (group === "schema") {
    return cliOutput({
      command: "schema",
      plane: "operator",
      result: {
        name: "handshake",
        commands: cliSchemaOutput(),
      },
    });
  }
  if (group === "evidence" && subcommand === "aps-report" && maybePath) {
    return renderApsReportCommand(await readJsonFile(maybePath));
  }
  if (group === "cert" && subcommand === "verify" && maybePath) {
    const trustBundleFlagIndex = rest.indexOf("--trust-bundle");
    const trustBundlePath = trustBundleFlagIndex >= 0 ? rest[trustBundleFlagIndex + 1] : null;
    if (!trustBundlePath) throw new Error("cert verify requires --trust-bundle <path>.");
    return verifyCertificateCommand({
      certificate: await readJsonFile(maybePath),
      trustMaterial: await readJsonFile(trustBundlePath),
    });
  }
  if (group === "conformance" && subcommand === "x402-payment") {
    return x402PaymentConformanceCommand();
  }
  throw new Error(
    `Unsupported command. Active commands: ${cliCommandManifest.map((command) => command.aliases[0]).join(", ")}.`,
  );
}

async function readJsonFile(path: string): Promise<unknown> {
  return JSON.parse(await readFile(path, "utf8"));
}

if (import.meta.main) {
  try {
    const output = await runCliCommand(process.argv.slice(2));
    process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}
