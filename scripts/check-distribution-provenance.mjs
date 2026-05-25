import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";

const repoRoot = process.cwd();
const { projectDistributionProvenanceReadback } = await import(
  pathToFileURL(join(repoRoot, "dist/surfaces/index.mjs")).href
);

const args = process.argv.slice(2);
const proofOutputPath = optionValue(args, "--write-proof");
const npmLatestUrl =
  optionValue(args, "--npm-latest-url") ?? "https://registry.npmjs.org/handshake-protocol-kernel/latest";
const npmLatestFile = optionValue(args, "--npm-latest-file");
const npmLatestStatus = optionalStatus(args, "--npm-latest-status");
const mcpLookupUrl =
  optionValue(args, "--mcp-lookup-url") ??
  "https://registry.modelcontextprotocol.io/v0.1/servers/io.github.CreasyBear%2Fhandshake-protocol-kernel/versions/latest";
const mcpLookupFile = optionValue(args, "--mcp-lookup-file");
const mcpLookupStatus = optionalStatus(args, "--mcp-lookup-status");
const mcpSearchUrl =
  optionValue(args, "--mcp-search-url") ??
  "https://registry.modelcontextprotocol.io/v0.1/servers?limit=10&search=handshake-protocol-kernel";
const mcpSearchFile = optionValue(args, "--mcp-search-file");
const mcpSearchStatus = optionalStatus(args, "--mcp-search-status");
const publishAttemptFile = optionValue(args, "--publish-attempt-file");

const pkg = JSON.parse(readFileSync("package.json", "utf8"));
const serverJson = JSON.parse(readFileSync("server.json", "utf8"));
const proof = await buildDistributionProvenanceProof();

if (proofOutputPath) await writeProof(proofOutputPath, proof);

console.log(
  proofOutputPath
    ? `Distribution provenance is ${proof.status}. Proof written to ${proofOutputPath}.`
    : `Distribution provenance is ${proof.status}.`,
);

function optionValue(inputArgs, flag) {
  const flagIndex = inputArgs.indexOf(flag);
  if (flagIndex === -1) return null;
  const value = inputArgs[flagIndex + 1];
  assert.equal(typeof value, "string", `${flag} requires a value`);
  assert.notEqual(value.length, 0, `${flag} requires a non-empty value`);
  return value;
}

function optionalStatus(inputArgs, flag) {
  const value = optionValue(inputArgs, flag);
  if (value === null) return null;
  const status = Number.parseInt(value, 10);
  assert.equal(Number.isFinite(status), true, `${flag} must be an integer HTTP status`);
  return status;
}

async function buildDistributionProvenanceProof() {
  const npmLatest =
    npmLatestFile !== null
      ? await readEvidenceFile({ url: npmLatestUrl, file: npmLatestFile, status: npmLatestStatus })
      : await fetchEvidence(npmLatestUrl);
  const mcpLookup =
    mcpLookupFile !== null
      ? await readEvidenceFile({ url: mcpLookupUrl, file: mcpLookupFile, status: mcpLookupStatus })
      : await fetchEvidence(mcpLookupUrl);
  const mcpSearch =
    mcpSearchFile !== null
      ? await readEvidenceFile({ url: mcpSearchUrl, file: mcpSearchFile, status: mcpSearchStatus })
      : await fetchEvidence(mcpSearchUrl);
  const localExports = Object.keys(pkg.exports ?? {}).sort();
  const publishedExports = npmLatest.json?.exports ? Object.keys(npmLatest.json.exports).sort() : [];
  const mcpSearchCount = typeof mcpSearch.json?.metadata?.count === "number" ? mcpSearch.json.metadata.count : null;
  const publishAttempt = publishAttemptFile ? readPublishAttempt(publishAttemptFile) : null;

  return projectDistributionProvenanceReadback({
    generatedAt: new Date().toISOString(),
    localPackage: {
      name: pkg.name,
      version: pkg.version,
      mcpName: pkg.mcpName,
      serverJsonName: serverJson.name,
      serverJsonVersion: serverJson.version,
      exports: localExports,
    },
    npmLatest: {
      url: npmLatestUrl,
      status: npmLatest.status,
      version: npmLatest.json?.version ?? null,
      tarball: npmLatest.json?.dist?.tarball ?? null,
      integrity: npmLatest.json?.dist?.integrity ?? null,
      shasum: npmLatest.json?.dist?.shasum ?? null,
      signatureCount: Array.isArray(npmLatest.json?.dist?.signatures) ? npmLatest.json.dist.signatures.length : 0,
      fileCount: npmLatest.json?.dist?.fileCount ?? null,
      exports: publishedExports,
    },
    mcpRegistry: {
      lookupUrl: mcpLookupUrl,
      lookupStatus: mcpLookup.status,
      lookupProblemTitle: mcpLookup.json?.title ?? null,
      searchUrl: mcpSearchUrl,
      searchStatus: mcpSearch.status,
      searchCount: mcpSearchCount,
    },
    ...(publishAttempt ? { publishAttempt } : {}),
    commandRefs: [
      [
        "node scripts/check-distribution-provenance.mjs",
        `--npm-latest-url ${npmLatestUrl}`,
        npmLatestFile ? `--npm-latest-file ${npmLatestFile}` : null,
        npmLatestStatus !== null ? `--npm-latest-status ${npmLatestStatus}` : null,
        `--mcp-lookup-url ${mcpLookupUrl}`,
        mcpLookupFile ? `--mcp-lookup-file ${mcpLookupFile}` : null,
        mcpLookupStatus !== null ? `--mcp-lookup-status ${mcpLookupStatus}` : null,
        `--mcp-search-url ${mcpSearchUrl}`,
        mcpSearchFile ? `--mcp-search-file ${mcpSearchFile}` : null,
        mcpSearchStatus !== null ? `--mcp-search-status ${mcpSearchStatus}` : null,
        publishAttemptFile ? `--publish-attempt-file ${publishAttemptFile}` : null,
        proofOutputPath ? `--write-proof ${proofOutputPath}` : null,
      ]
        .filter(Boolean)
        .join(" "),
    ],
    evidenceRefs: [
      ...evidenceRefsFor({ npmLatest, mcpLookup, mcpSearch }),
      ...(publishAttempt?.evidenceRef ? [publishAttempt.evidenceRef] : []),
    ],
  });
}

function readPublishAttempt(file) {
  const text = readFileSync(file, "utf8");
  const parsed = JSON.parse(text);
  return {
    attempted: parsed.attempted === true,
    commandRef: typeof parsed.commandRef === "string" ? parsed.commandRef : "",
    status: ["not_attempted", "failed", "succeeded"].includes(parsed.status) ? parsed.status : "failed",
    provenanceRequested: parsed.provenanceRequested === true,
    provenanceSupported: typeof parsed.provenanceSupported === "boolean" ? parsed.provenanceSupported : null,
    errorCode: typeof parsed.errorCode === "string" ? parsed.errorCode : null,
    errorMessage: typeof parsed.errorMessage === "string" ? parsed.errorMessage : null,
    evidenceRef: `publish-attempt:sha256:${createHash("sha256").update(text).digest("hex")}`,
  };
}

async function fetchEvidence(url) {
  try {
    const response = await fetch(url, {
      headers: {
        accept: "application/json",
      },
    });
    const text = await response.text();
    return {
      url,
      ok: response.ok,
      status: response.status,
      json: parseJsonOrNull(text),
      textDigest: await sha256(text),
      error: null,
    };
  } catch (error) {
    return fetchEvidenceWithCurl(url, error);
  }
}

async function readEvidenceFile({ url, file, status }) {
  assert.equal(typeof status, "number", `A status is required for response file ${file}`);
  const text = readFileSync(file, "utf8");
  return {
    url,
    ok: status >= 200 && status < 300,
    status,
    json: parseJsonOrNull(text),
    textDigest: await sha256(text),
    error: null,
  };
}

async function fetchEvidenceWithCurl(url, fetchError) {
  const curl = spawnSync("curl", ["--max-time", "10", "-sS", "-L", "-w", "\n%{http_code}", url], {
    encoding: "utf8",
  });
  if (curl.status !== 0) {
    return {
      url,
      ok: false,
      status: null,
      json: null,
      textDigest: null,
      error: `${fetchError instanceof Error ? fetchError.message : String(fetchError)}; curl: ${
        curl.stderr || curl.stdout
      }`,
    };
  }
  const splitAt = curl.stdout.lastIndexOf("\n");
  const body = splitAt === -1 ? curl.stdout : curl.stdout.slice(0, splitAt);
  const statusText = splitAt === -1 ? "" : curl.stdout.slice(splitAt + 1).trim();
  const status = Number.parseInt(statusText, 10);
  return {
    url,
    ok: status >= 200 && status < 300,
    status: Number.isFinite(status) ? status : null,
    json: parseJsonOrNull(body),
    textDigest: await sha256(body),
    error: null,
  };
}

function parseJsonOrNull(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function sha256(text) {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function evidenceRefsFor({ npmLatest, mcpLookup, mcpSearch }) {
  return [
    `npm-latest:${npmLatest.status ?? "network_error"}:${npmLatest.textDigest ?? "no_digest"}`,
    `mcp-registry-lookup:${mcpLookup.status ?? "network_error"}:${mcpLookup.textDigest ?? "no_digest"}`,
    `mcp-registry-search:${mcpSearch.status ?? "network_error"}:${mcpSearch.textDigest ?? "no_digest"}`,
  ];
}

async function writeProof(outputPath, outputProof) {
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(outputProof, null, 2)}\n`);
}
