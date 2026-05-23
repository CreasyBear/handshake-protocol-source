import { readFile } from "node:fs/promises";
import { renderApsReportCommand } from "./aps-report";
import { verifyCertificateCommand } from "./certificate";
import { cliCommandManifest, cliSchemaOutput } from "./command-manifest";
import { doctorCommand, initCommand } from "./local-project/doctor";
import {
  evidenceContractViewCommand,
  evidenceReceiptTimelineCommand,
  installHealthProjectionCommand,
} from "./projection-evidence";
import { cliOutput } from "./output";
import {
  installHealthCommand,
  installX402PaymentCommand,
  probesX402PaymentCommand,
  x402PaymentConformanceCommand,
} from "./x402";

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
  if (group === "init") {
    const stateRoot = optionValue(argv, "--state-root");
    const projectId = optionValue(argv, "--project-id");
    return initCommand({
      cwd: optionValue(argv, "--cwd") ?? process.cwd(),
      ...(stateRoot ? { stateRoot } : {}),
      ...(projectId ? { projectId } : {}),
    });
  }
  if (group === "doctor") {
    return doctorCommand({ cwd: optionValue(argv, "--cwd") ?? process.cwd() });
  }
  if (group === "evidence" && subcommand === "aps-report" && maybePath) {
    return renderApsReportCommand(await readJsonFile(maybePath));
  }
  if (group === "evidence" && subcommand === "contract-view" && maybePath) {
    return evidenceContractViewCommand(await readJsonFile(maybePath));
  }
  if (group === "evidence" && subcommand === "receipt-timeline" && maybePath) {
    return evidenceReceiptTimelineCommand(await readJsonFile(maybePath));
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
    const posturePath = optionValue(argv, "--posture");
    return x402PaymentConformanceCommand(posturePath ? await readJsonFile(posturePath) : undefined);
  }
  if (group === "install" && subcommand === "x402-payment" && maybePath) {
    return installX402PaymentCommand({
      cwd: optionValue(argv, "--cwd") ?? process.cwd(),
      inputValue: await readJsonFile(maybePath),
      recordLocal: argv.includes("--record-local"),
    });
  }
  if (group === "install" && subcommand === "health") {
    if (maybePath && !maybePath.startsWith("--")) return installHealthProjectionCommand(await readJsonFile(maybePath));
    return installHealthCommand({ cwd: optionValue(argv, "--cwd") ?? process.cwd() });
  }
  if (group === "probes" && subcommand === "x402-payment" && maybePath) {
    return probesX402PaymentCommand({
      cwd: optionValue(argv, "--cwd") ?? process.cwd(),
      postureValue: await readJsonFile(maybePath),
      recordLocal: argv.includes("--record-local"),
    });
  }
  throw new Error(
    `Unsupported command. Active commands: ${cliCommandManifest.map((command) => command.aliases[0]).join(", ")}.`,
  );
}

async function readJsonFile(path: string): Promise<unknown> {
  return JSON.parse(await readFile(path, "utf8"));
}

function optionValue(argv: readonly string[], flag: string): string | null {
  const index = argv.indexOf(flag);
  if (index < 0) return null;
  return argv[index + 1] ?? null;
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
