import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import packageJson from "../../package.json";

type PackageExport = {
  types: string;
  import: string;
  default: string;
};

type PackageJson = {
  exports: Record<string, PackageExport | string>;
};

const pkg = packageJson as PackageJson;

describe("claim boundary", () => {
  it("keeps public entrypoints separated by authority boundary", async () => {
    const root = await import("../../src");
    const runtime = await import("../../src/runtime");
    const conformance = await import("../../src/conformance");
    const experimental = await import("../../src/experimental");
    const runtimeExportNames = Object.keys(runtime).sort();

    expect(pkg.exports["./runtime"]).toEqual({
      types: "./dist/runtime/index.d.ts",
      import: "./src/runtime/index.ts",
      default: "./src/runtime/index.ts",
    });
    expect(Object.keys(root)).not.toContain("proposeRuntimeIngressActionContracts");
    expect(Object.keys(root)).toContain("ProtectedActionRequestSchema");
    expect(Object.keys(root)).toContain("ProtectedActionChallengeSchema");
    expect(Object.keys(root)).not.toContain("projectProtectedActionMetadata");
    expect(Object.keys(root)).not.toContain("projectProtectedActionChallengeFromRefusal");
    expect(Object.keys(root)).not.toContain("experimentalRunPackageInstallGateway");
    expect(Object.keys(root)).not.toContain("checkProtectedMutationAdapterConformance");
    expect(runtimeExportNames).toEqual([
      "RuntimeIngressDispatchBlockSchema",
      "RuntimeIngressObservedDispatchSchema",
      "proposeRuntimeIngressActionContracts",
      "runtimeIngressDispatchNodeId",
    ]);
    expect(runtimeExportNames.join(" ")).not.toMatch(/Gateway|Greenlight|Mutation|Policy|Receipt/);
    expect(Object.keys(conformance)).toContain("checkProtectedMutationAdapterConformance");
    expect(
      Object.keys(experimental).every((name) => name.startsWith("experimental") || name.startsWith("Experimental")),
    ).toBe(true);
  });

  it("requires docs to state local runtime ingress without provider or hosted claims", () => {
    const readme = readFileSync("README.md", "utf8");
    const x402Walkthrough = readFileSync("examples/x402-protected-spend/README.md", "utf8");
    const runtimeLane = readFileSync("src/runtime/LANE.md", "utf8");
    const conformanceLane = readFileSync("src/conformance/LANE.md", "utf8");
    const adaptersLane = readFileSync("src/adapters/LANE.md", "utf8");

    expect(readme).toContain("narrow official x402 exact buyer-side proof path");
    expect(readme).toContain("one official buyer-side `exact` per-call path");
    expect(readme).toContain("package install remains a regression fixture");
    expect(readme).toContain("external package-material attestation");
    expect(readme).toContain("not broad x402 compatibility");
    expect(readme).toContain("No adapter family defines the protocol");
    expect(readme).toContain("public runtime ingress for local x402 payment and package-install dispatch boundaries");
    expect(readme).toContain("not live provider custody, hosted operation, generic MCP/runtime control");
    expect(readme).toContain("facilitator operation, seller middleware, unsupported x402 schemes");
    expect(readme).toContain("cross-org AuthorityCertificate trust, live JWKS/revocation, hosted verifier operation");
    expect(readme).toContain("session/day/review spend windows are metadata until a ledger exists");
    expect(readme).not.toMatch(/\bx402 compatible\b/i);
    expect(readme).not.toMatch(/package install (?:is|as) (?:the )?first wedge/i);
    expect(runtimeLane).toContain("It must not issue policy decisions, greenlights, gateway checks, receipts");
    expect(conformanceLane).toContain("does not prove provider-side enforcement");
    expect(adaptersLane).toContain("must not imply generic adapters, hosted operation");
    expect(x402Walkthrough).toContain("one official buyer-side `x402_payment.exact` protected spend attempt");
    expect(x402Walkthrough).toContain("Do not write raw protocol records");
    expect(x402Walkthrough).toContain("The local/reference wallet gateway is the mutation credential holder");
    expect(x402Walkthrough).toContain(
      "official x402 signer and `PaymentPayload` creation stay outside the agent/runtime",
    );
    expect(x402Walkthrough).toContain("Official SDK parity");
    expect(x402Walkthrough).toContain("VerifiedGatewayCheck");
    expect(x402Walkthrough).toContain("Replay refusal");
    expect(x402Walkthrough).toContain("Proof gap projection");
    expect(x402Walkthrough).toContain("Do not classify `upto` as `x402_payment.exact`");
    expect(x402Walkthrough).toContain("Do not classify batch settlement as `x402_payment.exact`");
    expect(x402Walkthrough).toContain("signed offers");
    expect(x402Walkthrough).toContain("seller middleware");
    expect(x402Walkthrough).toContain("facilitator operation");
    expect(x402Walkthrough).toContain("facilitator verify evidence as settlement finality");
    expect(x402Walkthrough).not.toMatch(
      /x402Client|privateKeyToAccount|SIGNING_PRIVATE_KEY|provider custody claim|hosted dashboard|cross-org certificate trust/i,
    );
  });
});
