import type { z } from "zod";
import { InstallProposalSchema } from "../../../install";

export const RegisterInstallProposalCompiledRecordsInputSchema = InstallProposalSchema;
export type RegisterInstallProposalCompiledRecordsInput = z.input<
  typeof RegisterInstallProposalCompiledRecordsInputSchema
>;
