import { createWorkflow } from "@mastra/core/workflows";
import {z} from "zod"

import fs from "fs"


import {
  CampaignBriefSchema,
  SemanticAnalysisSchema,
} from "./workflows/schema/ad-analysis";
import { surfaceAnalysisStep } from "./workflows/step-01/surface-analysis";
import { SemanticAnalysisStep } from "./workflows/step-01/semantic-analysis";
import { psychologicalAnalysisStep } from "./workflows/step-01/psychological-analysis";
import { campaignBriefStep } from "./workflows/step-01/campaign-brief";

export const adAnalysisWorkflow = createWorkflow({
  id: "ad-analysis-workflow",

  inputSchema: z.object({
    image: z.any(),
  }),

  outputSchema: CampaignBriefSchema,
})
  .then(surfaceAnalysisStep)
  .then(SemanticAnalysisStep)
  .then(psychologicalAnalysisStep)
  .then(campaignBriefStep);




const imageBuffer = fs.readFileSync("./agent/public/image.png")

const run = await adAnalysisWorkflow.createRun();

const result = await run.start({
  inputData: {
    image: imageBuffer,
  },
});

console.log(result);