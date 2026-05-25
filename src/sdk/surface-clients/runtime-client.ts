import type {
  ActionContract,
  IntentCompilationRecord,
  RuntimeExecutionRecord,
  ToolCallDraft,
} from "../../protocol/public/schemas";
import type {
  CompileIntentInput,
  CreateRuntimeExecutionInput,
  CreateToolCallDraftInput,
  ProposeActionContractInput,
  TransitionToolCallDraftInput,
} from "../../protocol/public/inputs";
import type { RuntimeIngressProposalInput, RuntimeIngressResult } from "../../runtime";
import type { HandshakeFetch } from "../client";
import { RoleScopedTransport, type RoleScopedClientOptions } from "./transport";

export type RuntimeClientOptions = RoleScopedClientOptions;

export class RuntimeClient {
  private readonly transport: RoleScopedTransport;

  constructor(baseUrl: string, options: RuntimeClientOptions, fetchImpl?: HandshakeFetch) {
    this.transport = new RoleScopedTransport(baseUrl, { ...options, role: "runtime_evidence" }, fetchImpl);
  }

  createRuntimeExecution(input: CreateRuntimeExecutionInput): Promise<RuntimeExecutionRecord> {
    return this.transport.post("/v0.2/runtime-executions", input);
  }

  proposeRuntimeIngressActionContracts(input: RuntimeIngressProposalInput): Promise<RuntimeIngressResult> {
    return this.transport.post("/v0.2/runtime-ingress/action-contracts", input);
  }

  createToolCallDraft(input: CreateToolCallDraftInput): Promise<ToolCallDraft> {
    return this.transport.post("/v0.2/tool-call-drafts", input);
  }

  transitionToolCallDraft(input: TransitionToolCallDraftInput): Promise<ToolCallDraft> {
    return this.transport.post("/v0.2/tool-call-draft-transitions", input);
  }

  compileIntent(input: CompileIntentInput): Promise<IntentCompilationRecord> {
    return this.transport.post("/v0.2/intent-compilations", input);
  }

  proposeActionContract(input: ProposeActionContractInput): Promise<ActionContract> {
    return this.transport.post("/v0.2/action-contracts", input);
  }
}
