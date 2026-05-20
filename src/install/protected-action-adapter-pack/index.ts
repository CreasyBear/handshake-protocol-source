import { z } from "zod";
import { BypassProbeKindSchema } from "../../protocol/areas/bypass-probe";

export const ProtectedActionAdapterPackSchema = z.strictObject({
  adapterPackId: z.string().min(3),
  adapterPackVersion: z.string().min(1),
  actionFamily: z.string().min(1),
  protectedSurfaceKind: z.string().min(1),
  parameterSchemaRef: z.string().min(1),
  endpointEvidenceSchemaRef: z.string().min(1),
  installCompilerRef: z.string().min(1),
  policyRulePackRef: z.string().min(1),
  gatewayObservedParameterValidatorRef: z.string().min(1),
  receiptEvidenceMapperRef: z.string().min(1),
  bypassProbeKinds: z.array(BypassProbeKindSchema),
  hostileFixtureRefs: z.array(z.string().min(1)),
});
export type ProtectedActionAdapterPack = z.infer<typeof ProtectedActionAdapterPackSchema>;
