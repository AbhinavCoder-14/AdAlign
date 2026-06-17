import { createStep } from "@mastra/core/workflows";

import { z } from "zod";

import { WorkflowStateSchema } from "../schema/workflow-state-Schema";

import { PsychologicalAnalysisSchema } from "../schema/ad-analysis";

import { PSYCHOLOGICAL_INTENT_PROMPT } from "../../../prompt/ad-analyst";

import { adAnalysisTextualAgent } from "../../agents/adAnalyzer";

export const psychologicalAnalysisStep = createStep({
  id: "psychological-analysis",

  stateSchema: WorkflowStateSchema,

  inputSchema: z.object({}),

  outputSchema: PsychologicalAnalysisSchema,

  execute: async ({ state, setState }) => {
    const surface = state.surfaceAnalysis;

    const semantic = state.semanticAnalysis;

    if (!surface) {
      throw new Error("Surface analysis missing");
    }

    if (!semantic) {
      throw new Error("Semantic analysis missing");
    }

    const result = await adAnalysisTextualAgent.generate(`
        ${PSYCHOLOGICAL_INTENT_PROMPT}

        SURFACE ANALYSIS:
        ${JSON.stringify(surface, null, 2)}

        SEMANTIC ANALYSIS:
        ${JSON.stringify(semantic, null, 2)}
`);

    await setState({
      psychologicalAnalysis: result.object,
    });

    return result.object;
  },
});
