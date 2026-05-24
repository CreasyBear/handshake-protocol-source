import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import packageJson from "../../package.json";

type PackageExport = {
  types: string;
  bun: string;
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
      bun: "./src/runtime/index.ts",
      import: "./dist/runtime/index.mjs",
      default: "./dist/runtime/index.mjs",
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
    const agents = readFileSync("AGENTS.md", "utf8");
    const readme = readFileSync("README.md", "utf8");
    const decisions = readFileSync("docs/internal/decisions.md", "utf8");
    const protocolArchitecture = readFileSync("docs/internal/protocol-kernel-architecture.md", "utf8");
    const protocolNotes = readFileSync("docs/internal/protocol-notes.md", "utf8");
    const x402Walkthrough = readFileSync("examples/x402-protected-spend/README.md", "utf8");
    const httpLane = readFileSync("src/http/LANE.md", "utf8");
    const runtimeLane = readFileSync("src/runtime/LANE.md", "utf8");
    const conformanceLane = readFileSync("src/conformance/LANE.md", "utf8");
    const adaptersLane = readFileSync("src/adapters/LANE.md", "utf8");
    const canonicalDocs = [agents, readme, decisions, protocolNotes].join("\n--- canonical-doc-boundary ---\n");

    for (const doc of [agents, readme, decisions, protocolNotes]) {
      expect(doc).toContain("protected actions for automated decision making");
    }
    expect(canonicalDocs).not.toMatch(/Handshake is contracted execution infrastructure for engineering agents/i);
    expect(canonicalDocs).not.toMatch(/first (?:credible domain|wedge) (?:remains|is) engineering-agent actions/i);
    expect(canonicalDocs).not.toMatch(/use case: convert generated engineering-agent execution/i);
    expect(readme).toContain("narrow official x402 exact buyer-side proof path");
    expect(readme).toContain("one official buyer-side `exact` per-call path");
    expect(readme).toContain("package-install material adapter pack evidence/report projection");
    expect(readme).toContain("first promoted non-payment adapter pack after x402 exact per-call");
    expect(readme).toContain("package-manager local host-specific bypass manifest/proof-packet/report");
    expect(readme).toContain("host-wide containment");
    expect(readme).toContain("package-manager ecosystem protection");
    expect(readme).toContain("package safety proof");
    expect(readme).toContain("npm audit replacement");
    expect(readme).toContain("Bun provenance verification");
    expect(readme).toContain("external package-material attestation");
    expect(readme).toContain("not broad x402 compatibility");
    expect(readme).toContain("No adapter family defines the protocol");
    expect(readme).toContain("public runtime ingress for local x402 payment and package-install dispatch boundaries");
    expect(readme).toContain("not live provider custody, hosted mutation authority");
    expect(readme).toContain("generic MCP/runtime control");
    expect(readme).toContain("deployment-mode hosted admission config with read-entitlement split");
    expect(readme).toContain("raw-read posture gates, non-secret readiness reporting");
    expect(readme).toContain("production hosted readiness");
    expect(readme).toContain("compliance-grade audit");
    expect(readme).toContain("non-mutating hosted verifier metadata/key-set/JWKS/status/verify routes");
    expect(readme).toContain("remote JWKS trust fetching, live revocation authority");
    expect(readme).toContain("npm run demo:self-hosted");
    expect(readme).toContain("source-owned local MCP stdio proposal/evidence process proof");
    expect(readme).toContain("facilitator operation, seller middleware, unsupported x402 schemes");
    expect(readme).toContain("cross-org AuthorityCertificate trust");
    expect(readme).toContain("aggregate payment-budget management is intentionally outside the current remit");
    expect(readme).not.toMatch(/session\/day\/review spend windows are metadata until a ledger exists/i);
    expect(readme).not.toMatch(/\bx402 compatible\b/i);
    expect(readme).not.toMatch(/package install (?:is|as) (?:the )?first wedge/i);
    expect(canonicalDocs).not.toMatch(/Hosted operation adds policy management/i);
    expect(decisions).toMatch(/read\s+entitlements are separate from transition custody/);
    expect(decisions).toMatch(/it is not hosted mutation authority, production readiness/);
    expect(protocolNotes).toMatch(/read-entitlement split for\s+redacted evidence reads/);
    expect(protocolNotes).toContain("first host-specific bypass harness is a package-manager local fixture");
    expect(protocolNotes).toContain("never proves host-wide containment");
    expect(protocolArchitecture).toMatch(/The current hosted slice is\s+deployment-mode admission/);
    expect(httpLane).toContain("not hosted mutation authority");
    expect(httpLane).toContain("payment management, settlement, provider custody");
    expect(runtimeLane).toContain("It must not issue policy decisions, greenlights, gateway checks, receipts");
    expect(conformanceLane).toContain("does not prove provider-side enforcement");
    expect(adaptersLane).toContain("must not imply generic adapters, hosted operation");
    expect(adaptersLane).toContain("package-install/adapter-pack.ts");
    expect(adaptersLane).toContain("protected-path-probes/host-fixture.ts");
    expect(adaptersLane).toContain("named host/environment/adapter/action/path/raw-sibling routes");
    expect(adaptersLane).toContain("host-wide containment, package-manager ecosystem protection");
    expect(adaptersLane).toContain(
      "Package-install material evidence proves exact evidence/report/proof-gap binding only",
    );
    expect(adaptersLane).toContain("supply-chain safety, npm audit replacement, Bun provenance verification");
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
    expect(x402Walkthrough).toContain("No aggregate payment-budget management");
    expect(x402Walkthrough).not.toMatch(/aggregate x402 spend windows/i);
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

  it("requires MCP docs to stay proposal/evidence only", () => {
    const mcpLane = readFileSync("src/mcp/LANE.md", "utf8");

    expect(mcpLane).toContain("proposal and evidence transport only");
    expect(mcpLane).toContain("local stdio process harness exercised through the official MCP TypeScript SDK");
    expect(mcpLane).toContain("It does not evaluate policy, create greenlights");
    expect(mcpLane).toContain("Gateway custody, control-plane install, signer material");
    expect(mcpLane).toContain("certificate resources as local terminal evidence references only");
    expect(mcpLane).toContain("MCP can propose and display evidence. It cannot authorize");
    expect(mcpLane).toContain("Package bin `handshake-mcp` starts the local stdio MCP server");
    expect(mcpLane).toContain("hosted operation");
    expect(mcpLane).toContain("broad MCP protection");
    expect(mcpLane).toContain(
      "does not claim sibling MCP, terminal, browser, cloud, package-manager, repo, or network paths are protected",
    );
    expect(mcpLane).not.toMatch(/MCP (?:controls|secures|protects) (?:all|every|broad)/i);
    expect(mcpLane).not.toMatch(
      /MCP (?:provides|performs|operates|proves|claims) (?:hosted operation|provider custody|settlement|aggregate spend|spend-window enforcement)/i,
    );
    expect(mcpLane).not.toMatch(/marketplace|certification|clearing house|clearing-house|broad x402 compatibility/i);
    expect(mcpLane).not.toMatch(
      /MCP (?:mints|creates|publishes) (?:authority certificates|cross-org certificate trust)/i,
    );
    expect(mcpLane).not.toMatch(/MCP exports receipts/i);
  });
});
