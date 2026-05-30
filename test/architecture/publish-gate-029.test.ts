import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";

const publishGateDocPath = "docs/internal/publish-gate-029.md";

describe("publish gate 0.2.9 matrix", () => {
  it("documents primary, secondary, adjunct, and proof-gap personas", () => {
    const text = readFileSync(publishGateDocPath, "utf8");

    expect(text).toContain("Buyer integrator (x402 wedge)");
    expect(text).toContain("**Primary publish gate**");
    expect(text).toContain("Agent host (MCP stdio)");
    expect(text).toContain("**Secondary co-gate**");
    expect(text).toContain("Runtime ingress (D-76a/b)");
    expect(text).toContain("**Adjunct milestone proof**");
    expect(text).toContain("Service operator (HTTP kernel)");
    expect(text).toContain("**Proof gap at publish**");
    expect(text).toContain("MCP Registry discoverability");
    expect(text).toContain("Hosted operation");
  });

  it("forbids authority theatre in publish claims", () => {
    const text = readFileSync(publishGateDocPath, "utf8");

    expect(text).toContain("npm publish and MCP metadata do not create authority");
    expect(text).toContain("Verify is evidence-only");
    expect(text).toContain("Ingress does not issue greenlight");
    expect(text).toContain("npm publish ≠ registry acceptance");
  });

  it("records D-71 unpublish posture for admission surfaces", () => {
    const text = readFileSync(publishGateDocPath, "utf8");

    expect(text).toContain("surfaces.hosted_admission");
    expect(text).toContain("surfaces.service_workflow_admission");
    expect(text).toContain("not** published npm subpaths");
  });

  it("records deferred backlog with D-76d reopen criteria", () => {
    const text = readFileSync(publishGateDocPath, "utf8");

    expect(text).toContain("A1-ACCEPT-01");
    expect(text).toContain("A1-ACCEPT-03");
    expect(text).toContain("D-76d");
    expect(text).toContain("N≥2 external harness integrations");
    expect(text).toContain("IntentCompilationRecord");
  });
});
