import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import assert from "node:assert/strict";
import { Client, StdioClientTransport } from "@modelcontextprotocol/client";

const pkg = JSON.parse(readFileSync("package.json", "utf8"));
const serverJson = JSON.parse(readFileSync("server.json", "utf8"));

assert.notEqual(pkg.private, true, "package.json must not be private when publish readiness is claimed");
assert.equal(pkg.mcpName, serverJson.name, "package.json mcpName must match server.json name");
assert.equal(serverJson.version, pkg.version, "server.json version must match package.json version");
assert.equal(serverJson.packages?.[0]?.registryType, "npm");
assert.equal(serverJson.packages?.[0]?.identifier, pkg.name);
assert.equal(serverJson.packages?.[0]?.version, pkg.version);
assert.equal(serverJson.packages?.[0]?.transport?.type, "stdio");

const requiredPublishedFiles = [
  "bin/handshake",
  "bin/handshake-mcp",
  "dist/index.mjs",
  "dist/cli/index.mjs",
  "dist/mcp/index.mjs",
  "dist/bin/handshake.mjs",
  "dist/bin/handshake-mcp.mjs",
];

for (const file of requiredPublishedFiles) {
  assert.equal(existsSync(file), true, `${file} must exist after npm run build`);
}

for (const file of ["bin/handshake", "bin/handshake-mcp"]) {
  assert.match(readFileSync(file, "utf8"), /^#!\/usr\/bin\/env node\n/u, `${file} must be a Node executable`);
}

const cli = spawnSync(process.execPath, ["bin/handshake", "schema"], { encoding: "utf8" });
if (cli.status !== 0) {
  process.stderr.write(cli.stderr);
  process.stderr.write(cli.stdout);
  process.exit(cli.status ?? 1);
}

const cliOutput = JSON.parse(cli.stdout);
assert.equal(cliOutput.command, "schema");
assert.equal(cliOutput.authorityCreated, false);
assert.equal(cliOutput.greenlightCreated, false);
assert.equal(cliOutput.gatewayCheckPerformed, false);
assert.equal(cliOutput.mutationAttempted, false);
assert.equal(cliOutput.rawInternalRecordIncluded, false);
assert.equal(cliOutput.credentialMaterialIncluded, false);
assert.ok(cliOutput.nonClaims.includes("broad MCP/CLI/browser/shell/network control"));

await checkMcpStdioBin();

async function checkMcpStdioBin() {
  const client = new Client({ name: "handshake-package-entrypoint-smoke", version: pkg.version });
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: ["bin/handshake-mcp"],
    cwd: process.cwd(),
    stderr: "pipe",
  });
  const stderr = collectText(transport.stderr);

  try {
    await withTimeout(client.connect(transport), 8_000, "connect");
    const tools = await withTimeout(client.listTools(), 8_000, "tools/list");
    assert.deepEqual(tools.tools.map((tool) => tool.name).sort(), ["handshake.actions.x402_payment.propose"]);

    const metadataRead = await readJsonResource(client, "handshake://metadata/actions/x402_payment.exact");
    assert.equal(metadataRead.readOnly, true);
    assert.equal(metadataRead.authorityCreated, false);
    assert.equal(metadataRead.gatewayCheckPerformed, false);

    const proposal = await withTimeout(
      client.callTool({
        name: "handshake.actions.x402_payment.propose",
        arguments: await referenceProposalInput(metadataRead.payload.metadataDigest),
      }),
      8_000,
      "tools/call",
    );
    assert.equal(proposal.isError ?? false, false);
    assert.equal(proposal.structuredContent?.outcome, "action_contract_proposed");
    assert.equal(proposal.structuredContent?.authorityCreated, false);
    assert.equal(proposal.structuredContent?.greenlightCreated, false);
    assert.equal(proposal.structuredContent?.gatewayCheckPerformed, false);
    assert.equal(proposal.structuredContent?.mutationAttempted, false);
  } finally {
    await client.close().catch(() => undefined);
    await transport.close().catch(() => undefined);
  }

  const leaked = stderr();
  assert.equal(leaked.includes("PaymentPayload"), false);
  assert.equal(leaked.includes("PAYMENT-SIGNATURE"), false);
}

async function readJsonResource(client, uri) {
  const result = await withTimeout(client.readResource({ uri }), 8_000, `resources/read ${uri}`);
  const first = result.contents[0];
  assert.equal(typeof first?.text, "string", `${uri} must return JSON text`);
  return JSON.parse(first.text);
}

async function referenceProposalInput(metadataDigest) {
  return {
    requestId: "req_mcp_x402_1",
    tenantId: "ten_demo",
    organizationId: "org_demo",
    principalId: "principal_demo",
    agentId: "agent_demo",
    principalIntentRef: "intent:demo",
    generatedCodeOrSpecRef: "code:demo",
    runtimeAdapterRef: "adapter:mcp",
    runId: "run_demo",
    dispatchBoundaryRef: "dispatch-boundary:demo",
    dispatchRef: "dispatch:mcp:1",
    metadataRef: "handshake://metadata/actions/x402_payment.exact",
    metadataDigest,
    toolCatalogRef: "catalog:tools:x402",
    toolCatalogDigest: digestMcp({ catalog: "tools", actionClass: "x402_payment.exact" }),
    actionCatalogRef: "catalog:actions:x402",
    gatewayRegistryRef: "registry:x402",
    gatewayRegistryDigest: digestMcp({ registry: "x402", entry: "reference" }),
    operatingEnvelopeId: "env_demo",
    toolCapabilityId: "tool_x402_payment",
    actionTypeId: "atype_x402_payment",
    gatewayRegistryEntryId: "gwy_entry_x402",
    gatewayId: "gateway_x402",
    contractExpiresAt: "2026-05-22T12:00:00.000Z",
    idempotencyKey: "idem:x402:demo",
    endpointUrl: "https://seller.example/protected",
    intendedHttpMethod: "GET",
    intendedRequestUrl: "https://seller.example/protected",
    intendedRequestBodyDigest: null,
    selectedHeadersDigest: digestMcp({ headers: "selected" }),
    payee: "0x0000000000000000000000000000000000000001",
    payTo: "0x0000000000000000000000000000000000000001",
    network: "base-sepolia",
    token: "USDC",
    asset: "USDC",
    atomicAmount: "1000",
    x402EvidenceProfile: "official_payment_required",
    x402Version: 2,
    x402Scheme: "exact",
    maxTimeoutSeconds: 60,
    paymentRequirementsDigest: digestMcp({ paymentRequirements: "reference" }),
    paymentRequiredEvidenceRef: "evidence:x402-payment-required:reference",
    selectedPaymentRequirementIndex: 1,
    selectedPaymentRequirementDigest: digestMcp({ selectedPaymentRequirementIndex: 1 }),
    sdkPackageVersions: { "@x402/core": "2.12.0" },
  };
}

function digestMcp(value) {
  return `sha256:${createHash("sha256").update(canonicalizeMcp(value)).digest("hex")}`;
}

function canonicalizeMcp(value) {
  if (value === null) return "null";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error("Cannot canonicalize non-finite MCP value.");
    return JSON.stringify(value);
  }
  if (typeof value === "string") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map((item) => canonicalizeMcp(item)).join(",")}]`;
  return `{${Object.keys(value)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonicalizeMcp(value[key])}`)
    .join(",")}}`;
}

function withTimeout(operation, timeoutMs, phase) {
  let timeoutId;
  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(`Published MCP bin timed out during ${phase}`)), timeoutMs);
  });
  return Promise.race([operation, timeout]).finally(() => {
    if (timeoutId) clearTimeout(timeoutId);
  });
}

function collectText(stream) {
  const chunks = [];
  stream?.on?.("data", (chunk) => chunks.push(String(chunk)));
  return () => chunks.join("");
}
