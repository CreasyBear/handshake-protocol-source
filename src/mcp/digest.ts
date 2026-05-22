export type McpJsonValue = null | boolean | number | string | McpJsonValue[] | { [key: string]: McpJsonValue };

export function canonicalizeMcp(value: McpJsonValue): string {
  if (value === null) return "null";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error("Cannot canonicalize non-finite MCP value.");
    return JSON.stringify(value);
  }
  if (typeof value === "string") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map((item) => canonicalizeMcp(item)).join(",")}]`;

  return `{${Object.keys(value)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonicalizeMcp(value[key] as McpJsonValue)}`)
    .join(",")}}`;
}

export async function digestMcp(value: McpJsonValue): Promise<`sha256:${string}`> {
  const bytes = new TextEncoder().encode(canonicalizeMcp(value));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return `sha256:${Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")}`;
}
