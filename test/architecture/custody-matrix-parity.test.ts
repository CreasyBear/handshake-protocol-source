import { describe, expect, it } from "bun:test";
import { existsSync, readFileSync } from "node:fs";

describe("custody matrix parity", () => {
  it("documents configuredBy columns in decisions production acceptance matrix", () => {
    const decisions = readFileSync("docs/internal/decisions.md", "utf8");
    expect(decisions).toMatch(/configuredBy/i);
    expect(decisions).toMatch(/service_operator|host_operator|shared/);
    expect(decisions).toMatch(/gateway registry entry/i);
    expect(decisions).toMatch(/trusted binding digests/i);
  });

  it("orders service registry before host attestation in golden paths", () => {
    const service = readFileSync("docs/internal/service-operator-golden-path.md", "utf8");
    const host = readFileSync("docs/internal/host-golden-paths-and-trace-guidance.md", "utf8");

    expect(service).toMatch(/Bilateral|registry.*before|Host lane runs after/i);
    expect(host).toMatch(/does not substitute|gateway registry/i);
    expect(host).not.toMatch(/host owns gateway registry/i);
    expect(host).not.toMatch(/host configures gateway registry/i);
  });

  it("ships paired operator runbooks after phase 05 A4 (D-53)", () => {
    expect(existsSync("docs/internal/service-operator-runbook.md")).toBe(true);
    expect(existsSync("docs/internal/host-operator-runbook.md")).toBe(true);
    const serviceRunbook = readFileSync("docs/internal/service-operator-runbook.md", "utf8");
    expect(serviceRunbook).toMatch(/mutation-route-manifest|dual.enforcement/i);
  });

  it("frames host doctor output with attestation evidence fields", () => {
    const hostDoctor = readFileSync("src/cli/host/doctor.ts", "utf8");
    expect(hostDoctor).toMatch(/attestationEvidence|attestationDigest|bindingDigestInputs/);
    expect(hostDoctor).toMatch(/nonClaims/);
    expect(hostDoctor).toMatch(/configMutationPerformedByDoctor|No ServiceWorkflowAdmission/);
  });
});
