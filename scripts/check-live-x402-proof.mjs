import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";

const repoRoot = process.cwd();
const { projectLiveX402RequirementReadback } = await import(
  pathToFileURL(join(repoRoot, "dist/surfaces/index.mjs")).href
);

const args = process.argv.slice(2);
const headersFile = requiredOption(args, "--headers-file");
const responseStatus = requiredStatus(args, "--status");
const requestUrl = optionValue(args, "--request-url") ?? "https://regimeshift.xyz/api/v1/asset/eth/vrp";
const requestMethod = optionValue(args, "--request-method") ?? "GET";
const selectedPaymentRequirementIndex = optionalInteger(args, "--selected-payment-requirement-index") ?? 0;
const custodyProofFile = optionValue(args, "--custody-proof-file");
const proofOutputPath = optionValue(args, "--write-proof");

const proof = buildLiveX402Proof();

if (proofOutputPath) await writeProof(proofOutputPath, proof);

console.log(
  proofOutputPath
    ? `Live x402 proof is ${proof.status}. Proof written to ${proofOutputPath}.`
    : `Live x402 proof is ${proof.status}.`,
);

function requiredOption(inputArgs, flag) {
  const value = optionValue(inputArgs, flag);
  assert.equal(typeof value, "string", `${flag} is required`);
  return value;
}

function optionValue(inputArgs, flag) {
  const flagIndex = inputArgs.indexOf(flag);
  if (flagIndex === -1) return null;
  const value = inputArgs[flagIndex + 1];
  assert.equal(typeof value, "string", `${flag} requires a value`);
  assert.notEqual(value.length, 0, `${flag} requires a non-empty value`);
  return value;
}

function requiredStatus(inputArgs, flag) {
  const value = requiredOption(inputArgs, flag);
  const status = Number.parseInt(value, 10);
  assert.equal(Number.isFinite(status), true, `${flag} must be an integer HTTP status`);
  return status;
}

function optionalInteger(inputArgs, flag) {
  const value = optionValue(inputArgs, flag);
  if (value === null) return null;
  const parsed = Number.parseInt(value, 10);
  assert.equal(Number.isInteger(parsed), true, `${flag} must be an integer`);
  return parsed;
}

function buildLiveX402Proof() {
  const headersText = readFileSync(headersFile, "utf8");
  const paymentRequiredHeader = lastHeaderValue(headersText, "payment-required");
  assert.equal(typeof paymentRequiredHeader, "string", "Captured headers must include payment-required");
  const custodyProofText = custodyProofFile ? readFileSync(custodyProofFile, "utf8") : null;
  const custodyPresent = custodyProofText !== null;

  return projectLiveX402RequirementReadback({
    generatedAt: new Date().toISOString(),
    commandRefs: [
      [
        "node scripts/check-live-x402-proof.mjs",
        `--headers-file ${headersFile}`,
        `--status ${responseStatus}`,
        `--request-url ${requestUrl}`,
        `--request-method ${requestMethod}`,
        `--selected-payment-requirement-index ${selectedPaymentRequirementIndex}`,
        custodyProofFile ? `--custody-proof-file ${custodyProofFile}` : null,
        proofOutputPath ? `--write-proof ${proofOutputPath}` : null,
      ]
        .filter(Boolean)
        .join(" "),
    ],
    request: {
      method: requestMethod,
      url: requestUrl,
      responseStatus,
      providerEnvironmentPosture: "live",
      headersEvidenceRef: `live-x402-headers:sha256:${sha256Text(headersText)}`,
    },
    paymentRequiredHeader,
    selectedPaymentRequirementIndex,
    customerGatewayCustody: custodyPresent
      ? {
          present: true,
          proofRef: custodyProofFile,
          digest: `sha256:${sha256Text(custodyProofText)}`,
        }
      : {
          present: false,
          proofRef: null,
          digest: null,
        },
  });
}

function lastHeaderValue(headersText, headerName) {
  const headerPrefix = `${headerName.toLowerCase()}:`;
  const values = headersText
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter((line) => line.toLowerCase().startsWith(headerPrefix))
    .map((line) => line.slice(line.indexOf(":") + 1).trim())
    .filter(Boolean);
  return values.at(-1) ?? null;
}

function sha256Text(value) {
  return createHash("sha256").update(value).digest("hex");
}

async function writeProof(outputPath, outputProof) {
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(outputProof, null, 2)}\n`);
}
