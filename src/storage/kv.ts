import type { IsolationState } from "../protocol/schemas";

export interface IsolationCache {
  get(scopeId: string): Promise<IsolationState | null>;
  put(state: IsolationState): Promise<void>;
}

export class NoopIsolationCache implements IsolationCache {
  async get(): Promise<IsolationState | null> {
    return null;
  }

  async put(): Promise<void> {
    return;
  }
}

export class KvIsolationCache implements IsolationCache {
  constructor(private readonly kv: KVNamespace) {}

  async get(scopeId: string): Promise<IsolationState | null> {
    const value = await this.kv.get(`isolation:${scopeId}`, "json");
    return value as IsolationState | null;
  }

  async put(state: IsolationState): Promise<void> {
    const options = state.expiresAt
      ? { expirationTtl: Math.max(60, Math.floor((Date.parse(state.expiresAt) - Date.now()) / 1000)) }
      : undefined;
    await this.kv.put(`isolation:${state.scopeId}`, JSON.stringify(state), options);
  }
}
