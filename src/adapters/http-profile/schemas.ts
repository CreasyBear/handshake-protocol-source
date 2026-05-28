import { z } from "zod";
import { DigestSchema } from "../../protocol/foundation/schema-core";

export const HttpProtectedMutationProfileSchema = z.strictObject({
  targetHttpMethod: z.string().min(1),
  endpointUrl: z.string().url(),
  pathTemplate: z.string().min(1),
  requestBodyDigest: DigestSchema.nullable().default(null),
  selectedHeadersDigest: DigestSchema,
  dynamicEndpointConstructionObserved: z.boolean().default(false),
  dynamicHostConstructionObserved: z.boolean().default(false),
  retryAuthorityReuseDetected: z.boolean().default(false),
});

export type HttpProtectedMutationProfile = z.infer<typeof HttpProtectedMutationProfileSchema>;
