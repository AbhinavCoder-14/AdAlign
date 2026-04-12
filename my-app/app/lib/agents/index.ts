import { callClaude, callClaudeVision } from '../claude'
import { AdAnalysis, PageAnalysis, GapAnalysis, RewriteResult } from '@/types'



export async function analyzeAd(base64:string,mimeType:string):Promise<AdAnalysis> {



    const response = await callClaudeVision<AdAnalysis>(base64,mimeType,`Analyze this ad creative and extract the following.
    Return ONLY valid JSON, no explanation, no markdown:
    {
      "headline": "main headline or hook in the ad",
      "cta": "call to action text",
      "tone": "urgent | friendly | professional | casual",
      "audience": "who this ad is targeting",
      "offer": "the core offer or promise",
      "differentiator": "what makes this offer unique"
    }
  `)
    return response
    
}

export async function analyzePage(markdown:string): Promise<PageAnalysis> {

    const response = await callClaude<PageAnalysis>(`
    Analyze this landing page content and extract key elements.
    Use EXACT text from the page for headline, subheadline, and cta fields.
    
    Content:
    ${markdown.slice(0, 8000)}
    
    Return ONLY valid JSON:
    {
      "headline": "exact hero headline text",
      "subheadline": "exact subheadline text",
      "cta": "exact CTA button text",
      "valueProp": "main value proposition summarized",
      "audience": "inferred target audience",
      "tone": "urgent | friendly | professional | casual"
    }
  `)




    return response
    
}


export async function gapAnalyze(adAnalysis:AdAnalysis,pageAnalysis:PageAnalysis):Promise<GapAnalysis> {

    const response = await callClaude<GapAnalysis>(`
    You are a CRO (Conversion Rate Optimization) expert.
    
    AD CREATIVE:
    ${JSON.stringify(adAnalysis, null, 2)}
    
    LANDING PAGE:
    ${JSON.stringify(pageAnalysis, null, 2)}
    
    Analyze the message match. High score = page perfectly reflects the ad's promise.
    
    Return ONLY valid JSON:
    {
      "matchScore": <0-100 integer>,
      "summary": "one sentence on overall match quality",
      "gaps": [
        {
          "element": "headline | subheadline | cta | valueProp | tone",
          "adSays": "what the ad communicates for this element",
          "pageSays": "what the page currently says",
          "severity": "high | medium | low",
          "reason": "why this gap hurts conversion"
        }
      ]
    }
  `)





    return response
    
}


export async function reWritePage(adAnalysis: AdAnalysis, pageAnalysis: PageAnalysis, gaps: GapAnalysis['gaps']):Promise<RewriteResult> {


    const highAndMediumGaps = gaps.filter(g => g.severity !== 'low' )


      return callClaude<RewriteResult>(`
    You are an expert conversion copywriter.
    Rewrite ONLY the elements listed in the gaps below.
    Do NOT invent changes for elements not in the gaps list.
    
    AD:
    ${JSON.stringify(adAnalysis, null, 2)}
    
    CURRENT PAGE ELEMENTS (use EXACT text as "original"):
    ${JSON.stringify(pageAnalysis, null, 2)}
    
    GAPS TO FIX (only these):
    ${JSON.stringify(highAndMediumGaps, null, 2)}
    
    Rules:
    - "original" must be EXACT current text from the page
    - Match ad tone: ${adAnalysis.tone}
    - Reflect the core offer: ${adAnalysis.offer}
    - Keep rewrites similar in length to originals
    - Only fix elements with identified gaps
    
    Return ONLY valid JSON:
    {
      "changes": [
        {
          "element": "headline",
          "original": "exact current text",
          "rewritten": "new personalized text",
          "reason": "specific reason tied to the gap"
        }
      ],
      "unchanged": ["element name - reason not changed"]
    }
  `)
}



