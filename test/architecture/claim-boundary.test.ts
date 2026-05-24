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
type ClaimSource = { name: string; text: string };
type ClaimMatrixEntry = {
  label: string;
  sources: ClaimSource[];
  required?: string[];
  requiredPatterns?: RegExp[];
  forbiddenPatterns?: RegExp[];
};

function expectClaimMatrix(entries: ClaimMatrixEntry[]) {
  for (const entry of entries) {
    for (const source of entry.sources) {
      for (const phrase of entry.required ?? []) {
        expect(source.text, `${entry.label} must be stated in ${source.name}`).toContain(phrase);
      }
      for (const pattern of entry.requiredPatterns ?? []) {
        expect(source.text, `${entry.label} must match ${pattern} in ${source.name}`).toMatch(pattern);
      }
      for (const pattern of entry.forbiddenPatterns ?? []) {
        expect(source.text, `${entry.label} must not match ${pattern} in ${source.name}`).not.toMatch(pattern);
      }
    }
  }
}

describe("claim boundary", () => {
  it("keeps public entrypoints separated by authority boundary", async () => {
    const root = await import("../../src");
    const runtime = await import("../../src/runtime");
    const conformance = await import("../../src/conformance");
    const experimental = await import("../../src/experimental");
    const runtimeExportNames = Object.keys(runtime).sort();

    expect(pkg.exports["./runtime"]).toEqual({
      types: "./dist/runtime/index.d.ts",
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
    const canonicalSources = [
      { name: "AGENTS.md", text: agents },
      { name: "README.md", text: readme },
      { name: "docs/internal/decisions.md", text: decisions },
      { name: "docs/internal/protocol-notes.md", text: protocolNotes },
    ];

    expectClaimMatrix([
      {
        label: "category boundary",
        sources: canonicalSources,
        required: ["protected actions for automated decision making"],
        forbiddenPatterns: [
          /Handshake is contracted execution infrastructure for engineering agents/i,
          /first (?:credible domain|wedge) (?:remains|is) engineering-agent actions/i,
          /use case: convert generated engineering-agent execution/i,
        ],
      },
      {
        label: "README local proof claims",
        sources: [{ name: "README.md", text: readme }],
        required: [
          "narrow official x402 exact buyer-side proof path",
          "one official buyer-side `exact` per-call path",
          "package-install material adapter pack evidence/report projection",
          "first promoted non-payment adapter pack after x402 exact per-call",
          "package-manager local host-specific bypass manifest/proof-packet/report",
          "public runtime ingress for local x402 payment and package-install dispatch boundaries",
          "source-owned local MCP stdio proposal/evidence process proof",
          "npm run demo:self-hosted",
        ],
        forbiddenPatterns: [/session\/day\/review spend windows are metadata until a ledger exists/i],
      },
      {
        label: "README non-claims",
        sources: [{ name: "README.md", text: readme }],
        required: [
          "No adapter family defines the protocol",
          "not broad x402 compatibility",
          "not live provider custody, hosted mutation authority",
          "production hosted readiness",
          "generic MCP/runtime control",
          "host-wide containment",
          "package-manager ecosystem protection",
          "package safety proof",
          "npm audit replacement",
          "Bun provenance verification",
          "external package-material attestation",
          "cross-org AuthorityCertificate trust",
          "remote JWKS trust fetching, live revocation authority",
          "facilitator operation, seller middleware, unsupported x402 schemes",
          "compliance-grade audit",
          "aggregate payment-budget management is intentionally outside the current remit",
        ],
        forbiddenPatterns: [/\bx402 compatible\b/i, /package install (?:is|as) (?:the )?first wedge/i],
      },
      {
        label: "README root teaching boundary",
        sources: [{ name: "README.md", text: readme }],
        required: [
          'import { EvidenceClient, RuntimeClient } from "handshake-protocol-kernel/sdk/role-clients";',
          "Use this subpath for runtime proposal and redacted evidence readback.",
          "package root still exposes the lower-level",
          "first-slice activation should",
        ],
      },
      {
        label: "hosted admission non-claim",
        sources: [
          { name: "docs/internal/decisions.md", text: decisions },
          { name: "docs/internal/protocol-notes.md", text: protocolNotes },
          { name: "docs/internal/protocol-kernel-architecture.md", text: protocolArchitecture },
          { name: "src/http/LANE.md", text: httpLane },
        ],
        requiredPatterns: [
          /read\s+entitlements are separate from transition custody|read-entitlement split for\s+redacted evidence reads|The current hosted slice is\s+deployment-mode admission|not hosted mutation authority/,
        ],
        forbiddenPatterns: [/Hosted operation adds policy management/i],
      },
      {
        label: "lane authority boundaries",
        sources: [
          { name: "src/runtime/LANE.md", text: runtimeLane },
          { name: "src/conformance/LANE.md", text: conformanceLane },
          { name: "src/adapters/LANE.md", text: adaptersLane },
        ],
        requiredPatterns: [
          /It must not issue policy decisions, greenlights, gateway checks, receipts|does not prove provider-side enforcement|must not imply generic adapters, hosted operation/,
        ],
      },
      {
        label: "package-install host harness boundary",
        sources: [{ name: "docs/internal/protocol-notes.md", text: protocolNotes }],
        required: [
          "first host-specific bypass harness is a package-manager local fixture",
          "never proves host-wide containment",
        ],
      },
      {
        label: "package-install adapter pack boundary",
        sources: [{ name: "src/adapters/LANE.md", text: adaptersLane }],
        required: [
          "package-install/adapter-pack.ts",
          "protected-path-probes/host-fixture.ts",
          "named host/environment/adapter/action/path/raw-sibling routes",
          "host-wide containment, package-manager ecosystem protection",
          "Package-install material evidence proves exact evidence/report/proof-gap binding only",
          "supply-chain safety, npm audit replacement, Bun provenance verification",
        ],
      },
      {
        label: "x402 walkthrough boundary",
        sources: [{ name: "examples/x402-protected-spend/README.md", text: x402Walkthrough }],
        required: [
          "one official buyer-side `x402_payment.exact` protected spend attempt",
          "Do not write raw protocol records",
          "The local/reference wallet gateway is the mutation credential holder",
          "official x402 signer and `PaymentPayload` creation stay outside the agent/runtime",
          "Official SDK parity",
          "VerifiedGatewayCheck",
          "Replay refusal",
          "Proof gap projection",
          "No aggregate payment-budget management",
          "Do not classify `upto` as `x402_payment.exact`",
          "Do not classify batch settlement as `x402_payment.exact`",
          "signed offers",
          "seller middleware",
          "facilitator operation",
          "facilitator verify evidence as settlement finality",
        ],
        forbiddenPatterns: [
          /aggregate x402 spend windows/i,
          /x402Client|privateKeyToAccount|SIGNING_PRIVATE_KEY|provider custody claim|hosted dashboard|cross-org certificate trust/i,
        ],
      },
    ]);
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
