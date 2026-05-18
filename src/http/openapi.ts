import { z, type ZodType } from "zod";
import { transitionCallerSecuritySchemeName, type TransitionCallerRole } from "./caller-auth";
import { PROTOCOL_VERSION } from "../protocol/schemas";
import { TransitionErrorResponseSchema } from "./transition-error-envelope";
import { transitionRouteDefinitions } from "./transition-route-registry";

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
      handshakeControlPlaneBearer: bearerSecurityScheme("Control-plane transition token"),
      handshakeRuntimeEvidenceBearer: bearerSecurityScheme("Runtime evidence transition token"),
      handshakeGatewayCustodyBearer: bearerSecurityScheme("Gateway custody transition token"),
      handshakeReviewCustodyBearer: bearerSecurityScheme("Review custody transition token"),
    },
  },
  paths: {
    "/health": {
      get: { summary: "Health check", responses: { "200": jsonResponse("Worker is alive", HealthResponseSchema) } },
    },
    ...Object.fromEntries(transitionRouteDefinitions.map((route) => [route.path, openApiPathFor(route)])),
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
    headerParameter("X-Handshake-Request-Identity", true, "Opaque request correlation identity echoed on accepted transitions."),
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
