import { Agent } from "@mastra/core/agent";
import { Memory } from "@mastra/memory";
import { adAnalysisAgentSysPrompt, SURFACE_SIGNALS_PROMPT } from "../../prompt/ad-analyst";

const AdAnalystAgent = (options: {
  provider: string;
  model: string;
  maxSteps?: number;
}) =>
  new Agent({
    id: "ad-analyst",
    name: "Ad Analyst",
    description:"Expert advertising strategist that analyzes ads across visual, semantic, psychological and campaign dimensions.",
    instructions:adAnalysisAgentSysPrompt,
    model: options.model, //getTestModel use unitily function here
});






export const adAnalysisVisionAgent = AdAnalystAgent({
  provider:"anthropic",
  model:"claude-sonnet-4" // vision model
})

export const adAnalysisTextualAgent = AdAnalystAgent({
  provider:"anthropic",
  model:"claude-sonnet-4" // Textual model
})


