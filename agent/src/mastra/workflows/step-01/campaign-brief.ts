import { createStep } from "@mastra/core/workflows";

import { z } from "zod";

import { WorkflowStateSchema } from "../schema/workflow-state-Schema";

import { CampaignBriefSchema } from "../schema/ad-analysis";

import { CAMPAIGN_BRIEF_PROMPT } from "../../../prompt/ad-analyst";

import { adAnalysisTextualAgent } from "../../agents/adAnalyzer";

export const campaignBriefStep = createStep({
  id: "campaign-brief",

  stateSchema: WorkflowStateSchema,

  inputSchema: z.object({}),

  outputSchema: CampaignBriefSchema,

  execute: async ({ state, setState }) => {
    const surface = state.surfaceAnalysis;

    const semantic = state.semanticAnalysis;

    const psychological = state.psychologicalAnalysis;

    if (!surface) {
      throw new Error("Surface analysis missing");
    }

    if (!semantic) {
      throw new Error("Semantic analysis missing");
    }

    if (!psychological) {
      throw new Error("Psychological analysis missing");
    }

    const result = await adAnalysisTextualAgent.generate(`
${CAMPAIGN_BRIEF_PROMPT}

SURFACE ANALYSIS:
${JSON.stringify(surface, null, 2)}

SEMANTIC ANALYSIS:
${JSON.stringify(semantic, null, 2)}

PSYCHOLOGICAL ANALYSIS:
${JSON.stringify(psychological, null, 2)}
`);

    await setState({
      campaignBrief: result.object,
    });

    return result.object;
  },
});