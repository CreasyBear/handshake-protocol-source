import { describe, expect, it } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { defaultX402BootstrapInstallInput, runServiceBootstrap } from "../../src/cli/service-operator/bootstrap";
import {
  ServiceWorkflowAdmissionSchema,
  serviceWorkflowNonAuthorityBoundary,
} from "../../src/surfaces/service-workflow-admission";
import { InMemoryProtocolStore } from "../../src/storage/memory";

const goldenPathPath = "docs/internal/service-operator-golden-path.md";
const admissionOutputPath = "examples/service-workflow-admission/output/latest.json";

describe("service operator golden path integration", () => {
  it("documents Step 3 fork, Branch A, proof-gap list, and failureClass table", () => {
    const text = readFileSync(goldenPathPath, "utf8");
    expect(text).toMatch(/Step 3/i);
    expect(text).toMatch(/Branch A/i);
    expect(text).toMatch(/Proof-gap list/i);
    expect(text).toMatch(/failureClass/);
  });

  it("runs bootstrap registration and idempotent re-run on shared store", async () => {
    const store = new InMemoryProtocolStore();
    const installInput = defaultX402BootstrapInstallInput();
    const first = await runServiceBootstrap({ installInput, store });
    const second = await runServiceBootstrap({ installInput, store });

    expect(first.outcome).toBe("compiled_records_registered");
    expect(second.outcome).toBe("compiled_records_registered");
    expect(await store.listRecordsByType("gateway_registry_entry")).toHaveLength(1);
    expect(first.authorityBoundary).toMatchObject({
      authorityCreated: false,
      greenlightCreated: false,
      gatewayCheckPerformed: false,
      mutationAttempted: false,
    });
  });

  it("treats service workflow admission as non-authority when demo output is present", () => {
    if (!existsSync(admissionOutputPath)) {
      return;
    }
    const output = JSON.parse(readFileSync(admissionOutputPath, "utf8")) as {
      admissionPacket: unknown;
    };
    const admission = ServiceWorkflowAdmissionSchema.parse(output.admissionPacket);
    expect(admission.authorityBoundary).toEqual(serviceWorkflowNonAuthorityBoundary());
    expect(admission.nextActionRequirement).toBe("fresh_action_contract_required");
  });
});
