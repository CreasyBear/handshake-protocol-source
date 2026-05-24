import { z, type ZodType } from "zod";
import { transitionCallerSecuritySchemeName, type TransitionCallerRole } from "../admission/caller-auth";
import { HostedReadinessReportSchema } from "../admission/hosted-admission-config";
import { PROTOCOL_VERSION } from "../../protocol/public/schemas";
import { TransitionErrorResponseSchema } from "../errors/transition-error-envelope";
import { evidenceReadRouteDefinitions } from "../routes/evidence-read-route-registry";
import { transitionRouteDefinitions } from "../routes/transition-route-registry";

const HealthResponseSchema = z.strictObject({
  ok: z.boolean(),
  protocol: z.literal("handshake"),
  version: z.literal(PROTOCOL_VERSION),
});

const errorResponse = jsonResponse("Protocol transition error", TransitionErrorResponseSchema);

export const openApiDocument = {
  openapi: "3.1.0",
  info: {
    title: "Handshake Protocol Kernel",
    version: PROTOCOL_VERSION,
    description:
      "Contracted execution protocol for reducing agent-generated actions to exact policy-evaluated gateway-checked contracts.",
  },
  components: {
    securitySchemes: {
      handshakeControlPlaneBearer: bearerSecurityScheme(
        "Deployment-mode control-plane custody. Local bearer tokens are fixture custody, not production org auth.",
      ),
      handshakeRuntimeEvidenceBearer: bearerSecurityScheme(
        "Deployment-mode runtime-evidence custody. Local bearer tokens are fixture custody, not production org auth.",
      ),
      handshakeGatewayCustodyBearer: bearerSecurityScheme(
        "Deployment-mode gateway custody. Local bearer tokens are fixture custody, not production org auth.",
      ),
      handshakeReviewCustodyBearer: bearerSecurityScheme(
        "Deployment-mode review custody. Local bearer tokens are fixture custody, not production org auth.",
      ),
    },
  },
  paths: {
    "/health": {
      get: { summary: "Health check", responses: { "200": jsonResponse("Worker is alive", HealthResponseSchema) } },
    },
    "/v0.2/hosted/readiness": {
      get: {
        summary: "Read hosted admission and redacted evidence readiness posture",
        description:
          "Readiness posture only; not hosted mutation authority, payment management, settlement, provider custody, or compliance certification.",
        security: transitionSecurity("control_plane"),
        responses: {
          "200": jsonResponse("Hosted readiness posture report", HostedReadinessReportSchema),
          "401": errorResponse,
          "403": errorResponse,
          "500": errorResponse,
          "503": errorResponse,
        },
      },
    },
    ...Object.fromEntries(transitionRouteDefinitions.map((route) => [route.path, openApiPathFor(route)])),
    ...Object.fromEntries(
      evidenceReadRouteDefinitions.map((route) => [route.openApiPath, openApiEvidenceReadPathFor(route)]),
    ),
  },
};

function openApiPathFor(route: (typeof transitionRouteDefinitions)[number]) {
  return {
    post: {
      summary: route.summary,
      security: transitionSecurity(route.role),
      parameters: transitionHeaderParameters(),
      requestBody: jsonRequest(route.requestSchema),
      responses: {
        "201": jsonResponse(route.responseDescription, route.responseSchema),
        "400": errorResponse,
        "401": errorResponse,
        "403": errorResponse,
        "404": errorResponse,
        "409": errorResponse,
        "412": errorResponse,
        "500": errorResponse,
        "503": errorResponse,
      },
    },
  };
}

function openApiEvidenceReadPathFor(route: (typeof evidenceReadRouteDefinitions)[number]) {
  return {
    get: {
      summary: route.summary,
      description: route.responseDescription,
      security: route.roles.map((role) => ({ [transitionCallerSecuritySchemeName(role)]: [] })),
      parameters: route.pathParameters.map((parameter) => pathParameter(parameter.name, parameter.description)),
      responses: {
        "200": jsonResponse(route.responseDescription, route.responseSchema),
        "401": errorResponse,
        "403": errorResponse,
        "404": errorResponse,
        "500": errorResponse,
        "503": errorResponse,
      },
    },
  };
}

function jsonRequest(schema: ZodType) {
  return {
    required: true,
    content: {
      "application/json": {
        schema: schemaToJson(schema),
      },
    },
  };
}

function jsonResponse(description: string, schema: ZodType) {
  return {
    description,
    content: {
      "application/json": {
        schema: schemaToJson(schema),
      },
    },
  };
}

function transitionSecurity(role: TransitionCallerRole) {
  return [{ [transitionCallerSecuritySchemeName(role)]: [] }];
}

function transitionHeaderParameters() {
  return [
    headerParameter("X-Handshake-Protocol-Version", true, "Protocol version expected by the caller."),
    headerParameter(
      "X-Handshake-Request-Identity",
      true,
      "Opaque request correlation identity echoed on accepted transitions.",
    ),
    headerParameter(
      "X-Handshake-Originating-Identity",
      false,
      "Optional originating identity accepted only as sha256 digest or opaque ref evidence.",
    ),
  ];
}

function headerParameter(name: string, required: boolean, description: string) {
  return {
    name,
    in: "header",
    required,
    description,
    schema: { type: "string" },
  };
}

function pathParameter(name: string, description: string) {
  return {
    name,
    in: "path",
    required: true,
    description,
    schema: { type: "string" },
  };
}

function bearerSecurityScheme(description: string) {
  return {
    type: "http",
    scheme: "bearer",
    description,
  };
}

function schemaToJson(schema: ZodType) {
  return z.toJSONSchema(schema, { target: "draft-2020-12", unrepresentable: "any", reused: "ref" });
}
