import type { StoredProtocolRecord } from "./port";

export function actionContractIdsForRecord(record: StoredProtocolRecord): string[] {
  const payload = asRecord(record.payload);
  if (!payload) return [];

  const ids = new Set<string>();
  addString(ids, payload.actionContractId);
  addString(ids, payload.sourceActionContractId);

  const terminal = asRecord(payload.terminal);
  if (terminal) addString(ids, terminal.actionContractId);

  for (const ref of arrayOfStrings(payload.affectedObjectRefs)) {
    addActionContractRef(ids, ref);
  }

  return [...ids];
}

export function recordMatchesActionContract(record: StoredProtocolRecord, actionContractId: string): boolean {
  return actionContractIdsForRecord(record).includes(actionContractId);
}

function addActionContractRef(ids: Set<string>, ref: string): void {
  if (ref === "") return;
  ids.add(ref.startsWith("action_contract:") ? ref.slice("action_contract:".length) : ref);
}

function addString(ids: Set<string>, value: unknown): void {
  if (typeof value === "string" && value.length > 0) ids.add(value);
}

function arrayOfStrings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === "string") : [];
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}
