import { createStep } from "@mastra/core/workflows";
import { z } from "zod";
import { CampaignBriefSchema, PsychologicalAnalysisSchema, SemanticAnalysisSchema, SurfaceAnalysisSchema } from "../schema/ad-analysis";
import { adAnalysisVisionAgent } from "../../agents/adAnalyzer";
import { SURFACE_SIGNALS_PROMPT } from "../../../prompt/ad-analyst";
import { WorkflowStateSchema } from "../schema/workflow-state-Schema";




export const surfaceAnalysisStep  = createStep({
    id:"surface-analysis",
    inputSchema: z.object({
        imageUrl:z.string()
    }),
    stateSchema:WorkflowStateSchema,
    outputSchema:CampaignBriefSchema,
    execute: async ({
        inputData,state,setState
    }) => {

        console.log("Starting...");
        const result = adAnalysisVisionAgent.generate(
            [
            {
                role:"user",
                content:[
                    {
                        type:"text",
                        text:SURFACE_SIGNALS_PROMPT,
                    },
                    {
                        type:"image",
                        image:inputData.imageUrl
                    },
            
                ],
            },
        ],
        {
            output: SurfaceAnalysisSchema,
        },  
    );

    await setState({
        surfaceAnalysis:(await result).object
    })

    return {};

    }


})





