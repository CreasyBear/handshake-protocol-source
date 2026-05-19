import type { Context } from "hono";
import { HandshakeProtocolError } from "../../protocol/foundation/errors";
import { projectGeneratedGraphEvidence } from "../../protocol/areas/generated-execution-graph";
import type { GeneratedExecutionGraph } from "../../protocol/public/schemas";
import type { ProtocolStore } from "../../protocol/store/port";
import { authorizeEvidenceReadAdmission } from "../admission";
import type { AppOptions, WorkerBindings } from "../app-options";
import type { EvidenceReadRouteDefinition } from "../routes/evidence-read-route-registry";
import { transitionErrorResult, type TransitionErrorContext } from "../errors/transition-error-envelope";
import { storeFor } from "../store/resolution";

export async function handleEvidenceRead(
  c: Context<{ Bindings: WorkerBindings }>,
  options: AppOptions,
  fallbackStore: ProtocolStore | null,
  route: EvidenceReadRouteDefinition,
): Promise<Response> {
  const errorContext: TransitionErrorContext = {
    transitionName: route.routeId,
    callerCustodyRole: route.role,
    requestIdentity: null,
  };
  try {
    const admission = await authorizeEvidenceReadAdmission(c, options, route, errorContext);
    if (admission.failure) return admission.failure;
    const graphId = c.req.param("generatedExecutionGraphId");
    if (!graphId) return recordNotFound(c, errorContext);
    const graphRecord = await storeFor(c, fallbackStore).getRecord<GeneratedExecutionGraph>(
      "generated_execution_graph",
      graphId,
    );
    if (!graphRecord) return recordNotFound(c, errorContext);
    if (
      admission.hostedIdentity &&
      (graphRecord.tenantId !== admission.hostedIdentity.tenantId ||
        graphRecord.organizationId !== admission.hostedIdentity.organizationId)
    ) {
      return recordNotFound(c, errorContext);
    }
    return c.json(projectGeneratedGraphEvidence(graphRecord.payload));
  } catch (error) {
    const result = transitionErrorResult(error, errorContext);
    return c.json(result.body, result.status as 400);
  }
}

function recordNotFound(c: Context, context: TransitionErrorContext): Response {
  const result = transitionErrorResult(
    new HandshakeProtocolError("record_not_found", "Protocol evidence record was not found.", 404, {
      retryability: "terminal",
      commitState: "not_applicable",
    }),
    context,
  );
  return c.json(result.body, result.status as 404);
}
