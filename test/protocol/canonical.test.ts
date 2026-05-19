import { describe, expect, it } from "bun:test";
import {
  canonicalize,
  digestCanonical,
  signCanonicalHmac,
  verifyCanonicalHmac,
} from "../../src/protocol/foundation/canonical";

describe("canonical JSON", () => {
  it("produces stable digests for semantically identical object order", async () => {
    const a = { z: 1, a: { b: true, a: "first" } };
    const b = { a: { a: "first", b: true }, z: 1 };

    expect(canonicalize(a)).toBe(canonicalize(b));
    expect(await digestCanonical(a)).toBe(await digestCanonical(b));
  });

  it("signs and verifies canonical payloads", async () => {
    const payload = { contract: "act_1", paramsDigest: "sha256:" + "a".repeat(64) };
    const signature = await signCanonicalHmac(payload, "secret");

    expect(await verifyCanonicalHmac(payload, "secret", signature)).toBe(true);
    expect(await verifyCanonicalHmac({ ...payload, contract: "act_2" }, "secret", signature)).toBe(false);
  });
});
