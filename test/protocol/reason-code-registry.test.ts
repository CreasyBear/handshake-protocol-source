import { describe, expect, it } from "bun:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { httpTransitionErrorCodes, isRegisteredHttpTransitionErrorCode } from "../../src/http/errors/codes";
import {
  isRegisteredProtocolReasonCode,
  protocolReasonCodePrefixes,
  protocolReasonCodes,
} from "../../src/protocol/foundation/reason-codes";
import { ReasonCodeSchema } from "../../src/protocol/foundation/schema-core";

describe("reason-code registry", () => {
  it("keeps code registry entries unique and minimally operational", () => {
    expect(uniqueValues(httpTransitionErrorCodes.map((entry) => entry.code))).toEqual([]);
    expect(uniqueValues(protocolReasonCodes.map((entry) => entry.code))).toEqual([]);
    expect(uniqueValues(protocolReasonCodePrefixes.map((entry) => entry.prefix))).toEqual([]);

    for (const entry of httpTransitionErrorCodes) {
      expect(entry.phase.length).toBeGreaterThan(0);
      expect(["retryable", "terminal", "recoverable", "review_required", "ambiguous"]).toContain(entry.retryability);
      expect(["not_started", "not_committed", "committed", "unknown", "not_applicable"]).toContain(entry.commitState);
      expect(typeof entry.publicSafe).toBe("boolean");
    }

    for (const entry of protocolReasonCodes) {
      expect(entry.phase.length).toBeGreaterThan(0);
      expect(entry.kind.length).toBeGreaterThan(0);
      expect(typeof entry.publicSafe).toBe("boolean");
    }
  });

  it("registers stable source-emitted transition error codes", () => {
    const sourceCodes = sourceStringLiterals(/HandshakeProtocolError\(\s*"([a-z0-9_]+)"/g);
    const missing = sourceCodes.filter(
      (code) => !isRegisteredHttpTransitionErrorCode(code) && !isRegisteredProtocolReasonCode(code),
    );

    expect(missing).toEqual([]);
  });

  it("registers stable source-emitted protocol reason codes but keeps operator reasons open", () => {
    const sourceCodes = [
      ...sourceStringLiterals(
        /(?:reasonCode|decisionReasonCode|gateDecisionReasonCode|proofGapReasonCode):\s*"([a-z0-9_]+)"/g,
      ),
      ...sourceStringLiterals(/(?:terminalReasonCodes|reasonCodes)\.push\("([a-z0-9_]+)"\)/g),
      ...sourceStringLiterals(/return\s+\["([a-z0-9_]+)"\]/g),
    ];
    const missing = sourceCodes.filter((code) => !isRegisteredProtocolReasonCode(code));

    expect(missing).toEqual([]);
    expect(ReasonCodeSchema.safeParse("operator_supplied_future_reason").success).toBe(true);
    expect(isRegisteredProtocolReasonCode("prior_action_missing")).toBe(true);
    expect(isRegisteredProtocolReasonCode("current_isolation_revoked")).toBe(true);
  });
});

function sourceStringLiterals(pattern: RegExp): string[] {
  const matches = new Set<string>();
  for (const file of walkTs("src")) {
    const text = readFileSync(file, "utf8");
    for (const match of text.matchAll(pattern)) {
      const code = match[1];
      if (code) matches.add(code);
    }
  }
  return [...matches].sort();
}

function uniqueValues(values: readonly string[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) duplicates.add(value);
    seen.add(value);
  }
  return [...duplicates].sort();
}

function walkTs(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      files.push(...walkTs(full));
      continue;
    }
    if (entry.endsWith(".ts")) files.push(relative(process.cwd(), full));
  }
  return files;
}
