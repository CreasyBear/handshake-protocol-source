import { cliOutput } from "../output";
import { doctorLocalProject, initializeLocalProject, type InitLocalProjectInput } from "./index";

export async function initCommand(input: InitLocalProjectInput) {
  const result = await initializeLocalProject(input);
  return cliOutput({
    command: "init",
    plane: "operator",
    nextAction: "run_doctor",
    redactionProfileRef: "cli-local-project:v1-redacted",
    warnings: ["role credential placeholders were written outside the workspace; credential values were not created"],
    result,
  });
}

export async function doctorCommand(input: { cwd: string }) {
  const result = await doctorLocalProject(input.cwd);
  return cliOutput({
    command: "doctor",
    plane: "operator",
    ok: result.status === "ready",
    reasonCodes: result.reasonCodes,
    nextAction: result.status === "ready" ? "read_result" : "fix_install",
    retryability: result.status === "ready" ? "not_retryable" : "retryable_after_fix",
    redactionProfileRef: "cli-local-project:v1-redacted",
    result,
  });
}
