import type { IsolationScopeRef, IsolationState } from "../../protocol/store/port";

export interface IsolationCache {
  get(scopeRef: IsolationScopeRef): Promise<IsolationState | null>;
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

  async get(scopeRef: IsolationScopeRef): Promise<IsolationState | null> {
    const value = await this.kv.get(isolationCacheKey(scopeRef), "json");
    return value as IsolationState | null;
  }

  async put(state: IsolationState): Promise<void> {
    const options = state.expiresAt
      ? { expirationTtl: Math.max(60, Math.floor((Date.parse(state.expiresAt) - Date.now()) / 1000)) }
      : undefined;
    await this.kv.put(isolationCacheKey(state), JSON.stringify(state), options);
  }
}

export function isolationCacheKey(scopeRef: IsolationScopeRef): string {
  return `isolation:${scopeRef.tenantId}:${scopeRef.organizationId}:${scopeRef.scopeType}:${scopeRef.scopeId}`;
}
