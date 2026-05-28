import { z } from "zod";
import { HttpProtectedMutationProfileSchema, type HttpProtectedMutationProfile } from "./schemas";

export function canonicalizeHttpProfile(input: HttpProtectedMutationProfile): HttpProtectedMutationProfile {
  const parsed = HttpProtectedMutationProfileSchema.parse(input);
  if (parsed.dynamicEndpointConstructionObserved || parsed.dynamicHostConstructionObserved) {
    throw new z.ZodError([
      {
        code: "custom",
        message: "dynamic endpoint or host construction is not allowed on protected HTTP profiles",
        path: ["dynamicEndpointConstructionObserved"],
      },
    ]);
  }
  return {
    ...parsed,
    targetHttpMethod: parsed.targetHttpMethod.trim().toUpperCase(),
    pathTemplate: parsed.pathTemplate.trim(),
  };
}
