import { AsyncLocalStorage } from "node:async_hooks";

export type ProtocolIdSource = {
  createId?: (prefix: string) => string;
  nowIso?: () => string;
};

const protocolIdSourceStorage = new AsyncLocalStorage<ProtocolIdSource>();

export function withProtocolIdSource<T>(source: ProtocolIdSource, run: () => T): T {
  return protocolIdSourceStorage.run(source, run);
}

export function createId(prefix: string): string {
  const id = protocolIdSourceStorage.getStore()?.createId?.(prefix);
  if (id) return id;
  return `${prefix}_${crypto.randomUUID()}`;
}

export function nowIso(): string {
  const now = protocolIdSourceStorage.getStore()?.nowIso?.();
  if (now) return now;
  return new Date().toISOString();
}
