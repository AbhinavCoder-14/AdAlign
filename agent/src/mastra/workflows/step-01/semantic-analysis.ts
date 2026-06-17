import { createStep } from "@mastra/core/workflows";
import { create } from "domain";


import { z } from "zod";
import { SemanticAnalysisSchema, SurfaceAnalysisSchema } from "../schema/ad-analysis";
import { SEMANTIC_EXTRACTION_PROMPT } from "../../../prompt/ad-analyst";
import { adAnalysisTextualAgent } from "../../agents/adAnalyzer";


const AdAnalysisStateSchema = z.object({
  surfaceAnalysis:
    SurfaceAnalysisSchema.optional(),

  semanticAnalysis:
    SemanticAnalysisSchema.optional(),
});

export const SemanticAnalysisStep = createStep({
    id:"Semantic-analysis",
    inputSchema:{},
    stateSchema:AdAnalysisStateSchema,
    outputSchema:SemanticAnalysisSchema,

    execute: async ({
        state,setState
    }) => {
        const surfaceAnalysisData = state.surfaceAnalysis;

        if (!surfaceAnalysisData){
            throw new Error("Surface analysis is missing.")
        }

        const prompt = `
        ${SEMANTIC_EXTRACTION_PROMPT}

        Surface ANALYSIS:

        ${JSON.stringify(
            surfaceAnalysisData,
            null,
            2
            )}


        `;

        const result = await adAnalysisTextualAgent.generate(
            prompt,    
            {
            output:SemanticAnalysisSchema,
            }
        )

        await setState({
            semanticAnalysis:result.object,
        })

        return result.object

        // memory problem is still there

    }
    
    
})


