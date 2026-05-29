import { readFile } from "node:fs/promises";
import { join } from "node:path";
import {
  OperationReadbackProjectionSchema,
  type OperationReadbackProjection,
} from "../../protocol/evidence-projections/schemas";
import { EvidenceClient } from "../../sdk/surface-clients/evidence-client";
import { cliOutput } from "../output";

const DEFAULT_BASE_URL = "http://127.0.0.1:8787";

export type EvidenceFetchCommandInput = {
  contractId: string;
  baseUrl?: string;
  cwd?: string;
  roleCredential?: string;
};

export function evidenceOperationReadbackCliView(projection: OperationReadbackProjection) {
  return {
    schemaVersion: "handshake.cli.operation-readback-view.v1" as const,
    viewBoundary: "redacted_cli_projection_view" as const,
    title: `Operation ${projection.actionContractRef}`,
    status: projection.operationStatus,
    stage: projection.latestAuthoritativeStage,
    nextMechanism: projection.nextMechanism,
    stageOrder: [
      "action_contract",
      "policy_decision",
      "greenlight",
      "gateway_check",
      "mutation_attempt",
      "receipt",
    ] as const,
  };
}

export function evidenceOperationReadbackCommand(value: unknown) {
  const projection = OperationReadbackProjectionSchema.parse(value);
  const view = evidenceOperationReadbackCliView(projection);
  return cliOutput({
    command: "evidence operation-readback",
    plane: "evidence",
    custodyRole: "review_custody",
    nextAction: "read_evidence",
    redactionProfileRef: projection.redactionProfileRef,
    evidenceRefs: projection.evidenceRefs,
    result: { projection, view },
  });
}

export async function evidenceFetchCommand(input: EvidenceFetchCommandInput) {
  const projection = await resolveOperationReadbackProjection(input);
  return evidenceOperationReadbackCommand(projection);
}

async function resolveOperationReadbackProjection(
  input: EvidenceFetchCommandInput,
): Promise<OperationReadbackProjection> {
  if (input.cwd) {
    const offlinePath = join(input.cwd, ".handshake", "evidence", "operations", `${input.contractId}.readback.json`);
    const raw = await readFile(offlinePath, "utf8");
    return OperationReadbackProjectionSchema.parse(JSON.parse(raw));
  }

  const baseUrl = input.baseUrl ?? process.env.HANDSHAKE_BASE_URL ?? DEFAULT_BASE_URL;
  const roleCredential = input.roleCredential ?? process.env.HANDSHAKE_REVIEW_CUSTODY_TOKEN ?? "review-custody-dev";
  const client = new EvidenceClient(baseUrl, { roleCredential, readRole: "review_custody" });
  return client.getOperationReadbackProjection(input.contractId);
}
