import { readFile } from "node:fs/promises";
import { renderApsReportCommand } from "./aps-report";
import { verifyCertificateCommand } from "./certificate";
import { cliCommandManifest, cliSchemaOutput } from "./command-manifest";
import type { CliCommandPlane } from "./command-manifest";
import { doctorCommand, initCommand } from "./local-project/doctor";
import {
  evidenceContractViewCommand,
  evidenceReceiptTimelineCommand,
  installHealthProjectionCommand,
} from "./projection-evidence";
import { cliOutput } from "./output";
import { supportBundleCommand } from "./support-bundle";
import {
  installHealthCommand,
  installX402PaymentCommand,
  probesX402PaymentCommand,
  x402PaymentConformanceCommand,
} from "./x402";

type CliCommandErrorCode =
  | "cli_command_unsupported"
  | "cli_required_argument_missing"
  | "cli_input_json_invalid"
  | "cli_input_schema_invalid"
  | "cli_command_failed";

export async function runCliCommand(argv: readonly string[]): Promise<unknown> {
  const [group, subcommand, maybePath, ...rest] = argv;
  if (group === "schema") {
    return cliOutput({
      command: "schema",
      plane: "operator",
      nextAction: "read_result",
      redactionProfileRef: "cli-command-manifest:v1-redacted",
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
  if (group === "support" && subcommand === "bundle" && maybePath) {
    return supportBundleCommand(await readJsonFile(maybePath));
  }
  if (group === "cert" && subcommand === "verify" && maybePath) {
    const trustBundleFlagIndex = rest.indexOf("--trust-bundle");
    const trustBundlePath = trustBundleFlagIndex >= 0 ? rest[trustBundleFlagIndex + 1] : null;
    if (!trustBundlePath) {
      return cliCommandErrorOutput({
        argv,
        errorCode: "cli_required_argument_missing",
        message: "cert verify requires --trust-bundle <path>.",
        nextAction: "fix_arguments",
      });
    }
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
  return cliCommandErrorOutput({
    argv,
    errorCode: "cli_command_unsupported",
    message: "Unsupported command.",
    nextAction: "run_schema",
  });
}

export function cliCommandErrorOutput(input: {
  argv: readonly string[];
  errorCode: CliCommandErrorCode;
  message: string;
  nextAction: "run_schema" | "fix_arguments" | "fix_input_json" | "fix_input_schema";
}) {
  return cliOutput({
    command: commandLabel(input.argv),
    plane: commandPlane(input.argv),
    ok: false,
    reasonCodes: [input.errorCode],
    nextAction: input.nextAction,
    retryability: "retryable_after_fix",
    commitState: "not_started",
    redactionProfileRef: "cli-error:v1-redacted",
    warnings: ["Command failed before any authority, gateway check, signer use, or protected mutation."],
    result: {
      errorCode: input.errorCode,
      message: input.message,
      activeCommands: cliCommandManifest.map((command) => command.aliases[0]),
      nextAction: input.nextAction,
    },
  });
}

function cliCommandExceptionOutput(argv: readonly string[], error: unknown) {
  return cliCommandErrorOutput({
    argv,
    ...safeCliCommandError(error),
  });
}

async function readJsonFile(path: string): Promise<unknown> {
  return JSON.parse(await readFile(path, "utf8"));
}

function optionValue(argv: readonly string[], flag: string): string | null {
  const index = argv.indexOf(flag);
  if (index < 0) return null;
  return argv[index + 1] ?? null;
}

function commandLabel(argv: readonly string[]): string {
  const explicitAlias = findCommand(argv)?.aliases[0];
  if (explicitAlias) return explicitAlias;
  return (
    argv
      .filter((part) => !part.startsWith("--"))
      .slice(0, 2)
      .join(" ") || "unknown"
  );
}

function commandPlane(argv: readonly string[]): CliCommandPlane {
  return findCommand(argv)?.plane ?? "operator";
}

function findCommand(argv: readonly string[]) {
  return cliCommandManifest.find((command) =>
    command.aliases.some((alias) => argv.slice(0, alias.split(" ").length).join(" ") === alias),
  );
}

function safeCliCommandError(error: unknown): {
  errorCode: CliCommandErrorCode;
  message: string;
  nextAction: "fix_input_json" | "fix_input_schema" | "fix_arguments";
} {
  if (error instanceof SyntaxError) {
    return {
      errorCode: "cli_input_json_invalid",
      message: "Input JSON could not be parsed.",
      nextAction: "fix_input_json",
    };
  }
  if (error instanceof Error && error.name === "ZodError") {
    return {
      errorCode: "cli_input_schema_invalid",
      message: "Input JSON did not match the command schema.",
      nextAction: "fix_input_schema",
    };
  }
  return {
    errorCode: "cli_command_failed",
    message: error instanceof Error && error.message ? error.message : "Command failed.",
    nextAction: "fix_arguments",
  };
}

if (import.meta.main) {
  try {
    const output = await runCliCommand(process.argv.slice(2));
    process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
  } catch (error) {
    process.stderr.write(`${JSON.stringify(cliCommandExceptionOutput(process.argv.slice(2), error), null, 2)}\n`);
    process.exitCode = 1;
  }
}
