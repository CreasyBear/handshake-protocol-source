import { describe, expect, it } from "bun:test";
import type { EvidenceBindingDigestInput } from "../../../src/integrations/a1-evidence/primitives/binding-digest.js";
import { computeEvidenceBindingDigest } from "../../../src/integrations/a1-evidence/primitives/binding-digest.js";

describe("evidence binding digest golden (A1-1)", () => {
  it("different actionContractDigest → different evidenceBindingDigest (same chain fp)", async () => {
    const sharedBase: Omit<EvidenceBindingDigestInput, "actionContractDigest"> = {
      a1ChainFingerprint: Uint8Array.from({ length: 32 }, (_, i) => i),
      a1VerifierVersion: "handshake-delegation-1.0.0-zip215",
      a1VerifyOutcomeDigest: Uint8Array.from({ length: 32 }, (_, i) => i + 1),
      candidateDigest: Uint8Array.from({ length: 32 }, (_, i) => i + 2),
      actionTypeId: "repo.write",
      paramsDigest: Uint8Array.from({ length: 32 }, (_, i) => i + 3),
      principalId: "principal-1",
      agentId: "agent-1",
      presentedAtUnix: 1_700_000_000,
    };

    const digestA = computeEvidenceBindingDigest({
      ...sharedBase,
      actionContractDigest: Uint8Array.from({ length: 32 }, () => 0xaa),
    });
    const digestB = computeEvidenceBindingDigest({
      ...sharedBase,
      actionContractDigest: Uint8Array.from({ length: 32 }, () => 0xbb),
    });

    expect(digestA).toHaveLength(32);
    expect(digestB).toHaveLength(32);
    expect(Buffer.from(digestA).toString("hex")).not.toBe(Buffer.from(digestB).toString("hex"));
  });

  it("identical inputs → identical evidenceBindingDigest", async () => {
    const input: EvidenceBindingDigestInput = {
      a1ChainFingerprint: Uint8Array.from({ length: 32 }, (_, i) => i),
      a1VerifierVersion: "handshake-delegation-1.0.0-zip215",
      a1VerifyOutcomeDigest: Uint8Array.from({ length: 32 }, (_, i) => i + 10),
      candidateDigest: Uint8Array.from({ length: 32 }, (_, i) => i + 20),
      actionContractDigest: Uint8Array.from({ length: 32 }, (_, i) => i + 30),
      actionTypeId: "deploy.preview",
      paramsDigest: Uint8Array.from({ length: 32 }, (_, i) => i + 40),
      principalId: "principal-stable",
      agentId: "agent-stable",
      presentedAtUnix: 1_700_000_100,
    };

    const first = computeEvidenceBindingDigest(input);
    const second = computeEvidenceBindingDigest(input);
    expect(Buffer.from(first).toString("hex")).toBe(Buffer.from(second).toString("hex"));
  });
});
