import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { Database, type SQLQueryBindings } from "bun:sqlite";
import { createApp, type WorkerBindings } from "../../src/http/app";
import type { HandshakeFetch } from "../../src/sdk/client";

type QueryBinding = string | number | boolean | null;

export type D1HttpHarness = {
  db: D1Database;
  fetch: HandshakeFetch;
  post<T>(path: string, body: unknown): Promise<T>;
  get<T>(path: string): Promise<T>;
  query<T>(sql: string, ...bindings: QueryBinding[]): Promise<T[]>;
  dispose(): Promise<void>;
};

export async function createD1HttpHarness(): Promise<D1HttpHarness> {
  const localDb = new LocalD1Database();
  const db = localDb as unknown as D1Database;
  const migrationSql = await readFile(join(process.cwd(), "migrations", "0001_protocol_kernel.sql"), "utf8");
  await db.exec(migrationSql);
  const app = createApp();
  const env = { DB: db } satisfies WorkerBindings;

  return {
    db,
    async fetch(input, init) {
      return app.request(requestPath(input), init, env);
    },
    post<T>(path: string, body: unknown): Promise<T> {
      return requestJson<T>(app.request(path, jsonRequest(body), env));
    },
    get<T>(path: string): Promise<T> {
      return requestJson<T>(app.request(path, undefined, env));
    },
    async query<T>(sql: string, ...bindings: QueryBinding[]): Promise<T[]> {
      const result = await db.prepare(sql).bind(...bindings).all<T>();
      return result.results;
    },
    async dispose(): Promise<void> {
      localDb.dispose();
    },
  };
}

function requestPath(input: Parameters<typeof fetch>[0]): string {
  const rawUrl = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
  const url = new URL(rawUrl, "http://handshake.test");
  return `${url.pathname}${url.search}`;
}

class LocalD1Database {
  private readonly sqlite = new Database(":memory:");

  prepare(sql: string): D1PreparedStatement {
    return new LocalD1PreparedStatement(this.sqlite, sql) as unknown as D1PreparedStatement;
  }

  async exec(sql: string): Promise<D1ExecResult> {
    this.sqlite.exec(sql);
    return { count: 0, duration: 0 };
  }

  async batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]> {
    const runBatch = this.sqlite.transaction((batchStatements: D1PreparedStatement[]) =>
      batchStatements.map((statement) =>
        (statement as unknown as LocalD1PreparedStatement).runSync<T>(),
      ),
    );
    return runBatch(statements);
  }

  dispose(): void {
    this.sqlite.close();
  }
}

class LocalD1PreparedStatement {
  private readonly bindings: SQLQueryBindings[];

  constructor(
    private readonly db: Database,
    private readonly sql: string,
    bindings: SQLQueryBindings[] = [],
  ) {
    this.bindings = bindings;
  }

  bind(...bindings: SQLQueryBindings[]): D1PreparedStatement {
    return new LocalD1PreparedStatement(this.db, this.sql, bindings) as unknown as D1PreparedStatement;
  }

  async run<T = unknown>(): Promise<D1Result<T>> {
    return this.runSync<T>();
  }

  async all<T = unknown>(): Promise<D1Result<T>> {
    const results = this.db.query(this.sql).all(...this.bindings) as T[];
    return this.result(results);
  }

  async first<T = unknown>(): Promise<T | null> {
    return (this.db.query(this.sql).get(...this.bindings) as T | null) ?? null;
  }

  runSync<T = unknown>(): D1Result<T> {
    this.db.query(this.sql).run(...this.bindings);
    return this.result<T>([]);
  }

  private result<T>(results: T[]): D1Result<T> {
    return {
      results,
      success: true,
      meta: {
        duration: 0,
        served_by: "local-bun-sqlite",
        served_by_primary: true,
        changes: 0,
        last_row_id: 0,
        changed_db: true,
        size_after: 0,
        rows_read: results.length,
        rows_written: 0,
      },
    } as unknown as D1Result<T>;
  }
}

function jsonRequest(body: unknown): RequestInit {
  return {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  };
}

async function requestJson<T>(responseOrPromise: Response | Promise<Response>): Promise<T> {
  const response = await responseOrPromise;
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${text}`);
  }
  return text.length > 0 ? (JSON.parse(text) as T) : (undefined as T);
}
