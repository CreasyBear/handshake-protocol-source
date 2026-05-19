import type { ZodType } from "zod";
import { GeneratedGraphEvidenceProjectionSchema } from "../../protocol/public/schemas";
import type { TransitionCallerRole } from "../admission/caller-auth";

export type EvidenceReadRouteId = "getGeneratedGraphEvidenceProjection";

export type EvidenceReadRouteDefinition = {
  routeId: EvidenceReadRouteId;
  honoPath: `/v0.2/${string}`;
  openApiPath: `/v0.2/${string}`;
  role: TransitionCallerRole;
  summary: string;
  responseDescription: string;
  responseSchema: ZodType;
  pathParameters: readonly EvidenceReadPathParameter[];
};

export type EvidenceReadPathParameter = {
  name: string;
  description: string;
};

export const evidenceReadRouteDefinitions = [
  {
    routeId: "getGeneratedGraphEvidenceProjection",
    honoPath: "/v0.2/evidence/generated-execution-graphs/:generatedExecutionGraphId",
    openApiPath: "/v0.2/evidence/generated-execution-graphs/{generatedExecutionGraphId}",
    role: "control_plane",
    summary: "Read redacted generated execution graph evidence for diagnostics only",
    responseDescription:
      "Generated execution graph evidence projection. Inspection evidence only; not authority and not execution proof.",
    responseSchema: GeneratedGraphEvidenceProjectionSchema,
    pathParameters: [
      {
        name: "generatedExecutionGraphId",
        description: "Generated execution graph identifier.",
      },
    ],
  },
] as const satisfies readonly EvidenceReadRouteDefinition[];
