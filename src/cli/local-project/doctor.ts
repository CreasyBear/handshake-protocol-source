import { cliOutput } from "../output";
import { doctorLocalProject, initializeLocalProject, type InitLocalProjectInput } from "./index";

export async function initCommand(input: InitLocalProjectInput) {
  const result = await initializeLocalProject(input);
  return cliOutput({
    command: "init",
    plane: "operator",
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
    result,
  });
}
