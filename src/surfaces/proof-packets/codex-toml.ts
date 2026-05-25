import { escapeRegExp } from "./shared";

export type CodexMcpServerRecord = {
  readonly name: string;
  readonly command: string | null;
  readonly args: readonly string[] | null;
  readonly startupTimeoutSec: number | null;
  readonly envKeys: readonly string[];
};

type TomlSection = {
  readonly name: string;
  readonly kind: "mcp_server" | "mcp_server_env" | "other";
  readonly body: readonly string[];
};

export function parseCodexMcpServerNames(configText: string): string[] {
  return parseCodexMcpServerRecords(configText).map((server) => server.name);
}

export function parseCodexMcpServerRecords(configText: string): CodexMcpServerRecord[] {
  const sections = parseTomlSections(configText);
  return sections
    .filter((section) => section.kind === "mcp_server")
    .map((section) => ({
      name: section.name,
      command: parseTomlStringField(section.body, "command"),
      args: parseTomlStringArrayField(section.body, "args"),
      startupTimeoutSec: parseTomlNumberField(section.body, "startup_timeout_sec"),
      envKeys: parseCodexMcpServerEnvKeys(sections, section.name),
    }))
    .sort((left, right) => left.name.localeCompare(right.name));
}

export function buildCodexMcpServerTomlBlock(input: {
  readonly name: string;
  readonly command: string;
  readonly args: readonly string[];
  readonly startupTimeoutSec?: number;
}): string {
  const startupTimeoutSec = input.startupTimeoutSec ?? 120;
  return [
    `[mcp_servers.${input.name}]`,
    `command = ${tomlString(input.command)}`,
    `args = [${input.args.map(tomlString).join(", ")}]`,
    `startup_timeout_sec = ${startupTimeoutSec}`,
    "",
  ].join("\n");
}

export function upsertCodexMcpServerToml(input: {
  readonly existingToml: string;
  readonly serverName: string;
  readonly serverBlockToml: string;
}) {
  const newline = input.existingToml.includes("\r\n") ? "\r\n" : "\n";
  const sourceLines = input.existingToml.split(/\r?\n/u);
  const retainedLines: string[] = [];
  let skippingTargetSection = false;

  for (const line of sourceLines) {
    const header = parseTomlHeader(line);
    if (header) {
      skippingTargetSection = isCodexMcpServerHeader(header, input.serverName);
    }
    if (!skippingTargetSection) retainedLines.push(line);
  }

  const insertIndex = lastMcpSectionEndIndex(retainedLines);
  const blockLines = input.serverBlockToml.trimEnd().split(/\r?\n/u);
  const before = retainedLines.slice(0, insertIndex);
  const after = retainedLines.slice(insertIndex);
  const nextLines = [...trimTrailingBlankLines(before), "", ...blockLines, "", ...trimLeadingBlankLines(after)];
  const nextToml = `${nextLines.join(newline).replace(/\n{4,}/gu, `${newline}${newline}${newline}`)}${newline}`;

  return {
    changed: nextToml !== input.existingToml,
    toml: nextToml,
  };
}

function parseTomlSections(configText: string): TomlSection[] {
  const sections: TomlSection[] = [];
  let current: { name: string; kind: TomlSection["kind"]; body: string[] } | null = null;
  for (const line of configText.split(/\r?\n/u)) {
    const header = parseTomlHeader(line);
    if (header) {
      if (current) sections.push(current);
      current = {
        name: header.name,
        kind: header.kind,
        body: [],
      };
      continue;
    }
    if (current) current.body.push(line);
  }
  if (current) sections.push(current);
  return sections;
}

function parseTomlHeader(line: string): { readonly name: string; readonly kind: TomlSection["kind"] } | null {
  const trimmed = line.trim();
  const mcpServer = /^\[mcp_servers\.([^\].\n]+)\]$/u.exec(trimmed);
  if (mcpServer?.[1]) return { name: mcpServer[1], kind: "mcp_server" };
  const mcpServerEnv = /^\[mcp_servers\.([^\].\n]+)\.env\]$/u.exec(trimmed);
  if (mcpServerEnv?.[1]) return { name: mcpServerEnv[1], kind: "mcp_server_env" };
  if (/^\[.+\]$/u.test(trimmed)) return { name: trimmed, kind: "other" };
  return null;
}

function parseCodexMcpServerEnvKeys(sections: readonly TomlSection[], serverName: string): string[] {
  return sections
    .filter((section) => section.kind === "mcp_server_env" && section.name === serverName)
    .flatMap((section) =>
      section.body.flatMap((line) => {
        const match = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=/u.exec(line);
        return match?.[1] ? [match[1]] : [];
      }),
    )
    .sort();
}

function parseTomlStringField(lines: readonly string[], key: string): string | null {
  const pattern = new RegExp(`^\\s*${escapeRegExp(key)}\\s*=\\s*(".*")\\s*$`, "u");
  for (const line of lines) {
    const match = pattern.exec(line);
    if (!match?.[1]) continue;
    try {
      const value = JSON.parse(match[1]);
      return typeof value === "string" ? value : null;
    } catch {
      return null;
    }
  }
  return null;
}

function parseTomlStringArrayField(lines: readonly string[], key: string): string[] | null {
  const pattern = new RegExp(`^\\s*${escapeRegExp(key)}\\s*=\\s*(\\[.*\\])\\s*$`, "u");
  for (const line of lines) {
    const match = pattern.exec(line);
    if (!match?.[1]) continue;
    try {
      const value = JSON.parse(match[1]);
      return Array.isArray(value) && value.every((entry) => typeof entry === "string") ? value : null;
    } catch {
      return null;
    }
  }
  return null;
}

function parseTomlNumberField(lines: readonly string[], key: string): number | null {
  const pattern = new RegExp(`^\\s*${escapeRegExp(key)}\\s*=\\s*([0-9]+)\\s*$`, "u");
  for (const line of lines) {
    const match = pattern.exec(line);
    if (!match?.[1]) continue;
    const value = Number.parseInt(match[1], 10);
    return Number.isFinite(value) ? value : null;
  }
  return null;
}

function lastMcpSectionEndIndex(lines: readonly string[]): number {
  let lastMcpHeaderIndex = -1;
  lines.forEach((line, index) => {
    const header = parseTomlHeader(line);
    if (header?.kind === "mcp_server" || header?.kind === "mcp_server_env") lastMcpHeaderIndex = index;
  });
  if (lastMcpHeaderIndex === -1) {
    const firstSectionIndex = lines.findIndex((line) => parseTomlHeader(line) !== null);
    return firstSectionIndex === -1 ? lines.length : firstSectionIndex;
  }
  let index = lastMcpHeaderIndex + 1;
  while (index < lines.length && !parseTomlHeader(lines[index] ?? "")) index += 1;
  return index;
}

function isCodexMcpServerHeader(
  header: { readonly name: string; readonly kind: TomlSection["kind"] },
  serverName: string,
) {
  return (header.kind === "mcp_server" || header.kind === "mcp_server_env") && header.name === serverName;
}

function trimTrailingBlankLines(lines: readonly string[]): string[] {
  const output = [...lines];
  while (output.length > 0 && output.at(-1)?.trim() === "") output.pop();
  return output;
}

function trimLeadingBlankLines(lines: readonly string[]): string[] {
  const output = [...lines];
  while (output.length > 0 && output[0]?.trim() === "") output.shift();
  return output;
}

function tomlString(value: string): string {
  return JSON.stringify(value);
}
