import { createHash } from "node:crypto";

export const PROOF_PACKET_VERSION = "proof-packets.v0.1" as const;

export type ProofGap = {
  readonly reasonCode: string;
  readonly nonClaim: string;
};

export type NonAuthorityBoundary = {
  readonly createsAuthority: false;
  readonly createsPolicyDecision: false;
  readonly createsGreenlight: false;
  readonly performsGatewayCheck: false;
  readonly performsMutation: false;
};

export const nonAuthorityBoundary: NonAuthorityBoundary = {
  createsAuthority: false,
  createsPolicyDecision: false,
  createsGreenlight: false,
  performsGatewayCheck: false,
  performsMutation: false,
};

export function gap(reasonCode: string, nonClaim: string): ProofGap {
  return { reasonCode, nonClaim };
}

export function arrayEquals(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((entry, index) => entry === right[index]);
}

export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}

export function stableDigest(value: unknown): `sha256:${string}` {
  return `sha256:${sha256Text(stableStringify(value))}`;
}

function sha256Text(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value) ?? "null";
}
