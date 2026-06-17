import { z } from "zod";

import { SurfaceAnalysisSchema } from "./ad-analysis";
import { SemanticAnalysisSchema } from "./ad-analysis"; 
import { PsychologicalAnalysisSchema } from "./ad-analysis"; 
import { CampaignBriefSchema } from "./ad-analysis"; 

export const WorkflowStateSchema = z.object({
  surfaceAnalysis: SurfaceAnalysisSchema.optional(),

  semanticAnalysis: SemanticAnalysisSchema.optional(),

  psychologicalAnalysis:
    PsychologicalAnalysisSchema.optional(),

  campaignBrief:
    CampaignBriefSchema.optional(),
});