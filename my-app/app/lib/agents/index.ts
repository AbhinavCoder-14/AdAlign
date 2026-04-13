import { callClaude, callClaudeVision, callGemini, callOpenRouter } from '../claude'
import { AdAnalysis, PageAnalysis, GapAnalysis, RewriteResult } from '@/types'

const PAGE_ANALYSIS_MODEL = process.env.OPENROUTER_PAGE_MODEL || 'deepseek/deepseek-r1'



export async function analyzeAd(base64:string,mimeType:string):Promise<AdAnalysis> {

    const response = await callClaudeVision<AdAnalysis>(base64,mimeType,`
Analyze this ad creative and extract ONLY valid JSON.

Return:
{
  "headline": "main headline or hook in the ad",
  "cta": "call to action text",
  "tone": "urgent | friendly | professional | casual",
  "audience": "who this ad is targeting",
  "offer": "core offer or promise",
  "differentiator": "what makes this offer unique",
  "urgencySignals": "time pressure or urgency words",
  "specificClaim": "specific number, proof, or measurable claim",
  "emotionalTrigger": "fear | aspiration | curiosity | relief | status",
  "impliedPain": "the problem the ad assumes the user has",
  "trustSignals": "logos, numbers, guarantees, proof, or credibility cues"
}
`)
    return response
}

export async function analyzePage(markdown:string): Promise<PageAnalysis> {

    const response = await callOpenRouter<PageAnalysis>(`
Analyze this landing page comprehensively.
Extract exact text for any headline and CTA you find.

Content:
${markdown.slice(0, 10000)}

Return ONLY valid JSON with no explanation:
{
  "headline": "exact hero headline from page",
  "subheadline": "exact subheadline/tagline text",
  "cta": "exact primary CTA button text",
  "valueProp": "core value proposition in 1 sentence",
  "audience": "who this product is for",
  "tone": "urgent | friendly | professional | casual",
  "whatTheyDo": "clear explanation of what the company/product does (2-3 sentences)",
  "keyFeatures": ["list of", "main features", "or capabilities"],
  "painPointsAddressed": ["problem 1 it solves", "problem 2"],
  "keyBenefits": ["benefit/outcome 1", "benefit/outcome 2", "transformation 3"],
  "uniqueValue": "what makes them different from competitors",
  "trustSignals": "logos, testimonials, stats, guarantees mentioned",
  "targetCustomerProfile": "detailed description of ideal customer",
  "pricingModel": "pricing structure if mentioned (free trial, subscription, one-time purchase, etc)",
  "callouts": ["highlighted features", "important stats", "guarantees"]
}
`, undefined, PAGE_ANALYSIS_MODEL)

    return response
    
}


export async function gapAnalyze(adAnalysis:AdAnalysis,pageAnalysis:PageAnalysis):Promise<GapAnalysis> {

    const response = await callClaude<GapAnalysis>(`
    You are a strict CRO analyst.

    AD CREATIVE:
    ${JSON.stringify(adAnalysis, null, 2)}

    LANDING PAGE:
    ${JSON.stringify(pageAnalysis, null, 2)}

    Score the page against the ad. Be strict, not generous.

    Score these 0-100:
    - messageMatch: how directly the page repeats the ad promise
    - specificity: how specific the page is versus the ad
    - clarity: how clear the primary CTA and value prop are
    - trustAlignment: how well proof/trust signals match the ad
    - urgency: how well the page preserves urgency from the ad

    Flag gaps only when the page weakens the ad promise.
    Use these gap types when relevant: headline, subheadline, cta, valueProp, tone, trustSignals, urgency, keyBenefits, specificity, painAlignment, ctaFriction.

    Return ONLY valid JSON:
    {
      "matchScore": <0-100>,
      "summary": "one sentence on overall message match and conversion readiness",
      "conversionScore": {
        "messageMatch": <0-100>,
        "specificity": <0-100>,
        "clarity": <0-100>,
        "trustAlignment": <0-100>,
        "urgency": <0-100>
      },
      "gaps": [
        {
          "element": "headline | subheadline | cta | valueProp | tone | trustSignals | urgency | keyBenefits | specificity | painAlignment | ctaFriction",
          "adSays": "what the ad communicates",
          "pageSays": "what the page currently says",
          "severity": "high | medium | low",
          "reason": "why this gap hurts conversion"
        }
      ]
    }
  `)





    return response
    
}


function getOptionalString(obj: unknown, key: string, fallback = 'Not provided') {
  const value = (obj as Record<string, unknown>)?.[key]
  return typeof value === 'string' && value.trim().length > 0 ? value : fallback
}

function getOptionalStringArray(obj: unknown, key: string, fallback: string[]) {
  const value = (obj as Record<string, unknown>)?.[key]
  if (!Array.isArray(value)) return fallback

  const normalized = value.filter(item => typeof item === 'string').map(item => (item as string).trim()).filter(Boolean)
  return normalized.length > 0 ? normalized : fallback
}

export async function reWritePage(
  adAnalysis: AdAnalysis,
  pageAnalysis: PageAnalysis,
  gaps: GapAnalysis['gaps'],
  userInstruction = '',
):Promise<RewriteResult> {


    const highAndMediumGaps = gaps.filter(g => g.severity !== 'low' )

    const whatTheyDo = getOptionalString(pageAnalysis, 'whatTheyDo', pageAnalysis.valueProp)
    const keyFeatures = getOptionalStringArray(pageAnalysis, 'keyFeatures', [pageAnalysis.valueProp])
    const keyBenefits = getOptionalStringArray(pageAnalysis, 'keyBenefits', [pageAnalysis.valueProp])
    const targetCustomerProfile = getOptionalString(pageAnalysis, 'targetCustomerProfile', pageAnalysis.audience)
    const uniqueValue = getOptionalString(pageAnalysis, 'uniqueValue', pageAnalysis.valueProp)

    const specificClaim = getOptionalString(adAnalysis, 'specificClaim', adAnalysis.offer)
    const emotionalTrigger = getOptionalString(adAnalysis, 'emotionalTrigger', adAnalysis.tone)
    const impliedPain = getOptionalString(adAnalysis, 'impliedPain', 'Low conversion due to weak message match')
    const urgencySignals = getOptionalString(adAnalysis, 'urgencySignals', adAnalysis.cta)
    const trustSignals = getOptionalString(adAnalysis, 'trustSignals', adAnalysis.differentiator)
    const clientDirection = userInstruction?.trim() || 'No extra instruction provided.'

    const systemPrompt = `You are a senior CRO copywriter.
Rewrite only approved elements while preserving structure and factual integrity.
Do not invent product claims, guarantees, numbers, or legal statements.
Do not rewrite any element not listed in the provided gaps.
Always return valid JSON only.`

    return callGemini<RewriteResult>(`
PRODUCT CONTEXT:
- What They Do: ${whatTheyDo}
- Key Features: ${keyFeatures.join(', ')}
- Main Benefits: ${keyBenefits.join(', ')}
- Target Customer: ${targetCustomerProfile}
- Unique Value: ${uniqueValue}

AD EXPECTATIONS TO MATCH:
- Headline Promise: ${adAnalysis.headline}
- Core Offer: ${adAnalysis.offer}
- Specific Claim: ${specificClaim}
- Emotional Trigger: ${emotionalTrigger}
- Implied Customer Pain: ${impliedPain}
- Urgency Signals: ${urgencySignals}
- Trust Signals to Showcase: ${trustSignals}
- Client Direction: ${clientDirection}

CURRENT PAGE:
${JSON.stringify(pageAnalysis, null, 2)}

GAPS TO FIX (rewrite ONLY these):
${JSON.stringify(highAndMediumGaps, null, 2)}

## YOUR REWRITING RULES:

RULE 1 - SPECIFICITY OVER VAGUENESS
Never write vague claims like "grow your business" or "better results"
Always be specific: "get 3x more leads in 30 days" or "save 12 hours per week"
Use the specific claim from the ad if one exists: "${specificClaim}"

RULE 2 - MATCH THE EMOTIONAL TRIGGER
The ad uses this emotional approach: ${emotionalTrigger}
If the ad creates URGENCY, your page should too.
If the ad uses ASPIRATION, mirror that energy.
If the ad uses FEAR, acknowledge the pain before solving it.
Match the energy. Do not soften urgent messaging.

RULE 3 - REFLECT THE IMPLIED PAIN
The ad assumes the user feels: "${impliedPain}"
Your rewrites must acknowledge this pain point first, then show the solution.

RULE 4 - URGENCY MUST CARRY THROUGH
If the ad has urgency signals ("${urgencySignals}"), the page must reflect that.
Passive language kills urgency.
Bad: "You can try it anytime"
Good: "Start today and see results in 30 days"
Every CTA must reflect the same urgency as the ad.

RULE 5 - ONE JOB PER ELEMENT
Headline: State the transformation or outcome promised by the ad.
Subheadline: Explain who it is for and why it works.
CTA: Tell them exactly what happens when they click.
Supporting copy: Remove objections and add proof.

RULE 6 - NEVER BE CLEVER, ALWAYS BE CLEAR
Clarity beats creativity for conversions.
Avoid puns, complex metaphors, or jargon.
Use direct customer language.

Return ONLY valid JSON:
{
  "changes": [
    {
      "element": "element name",
      "original": "exact current text from page",
      "rewritten": "new personalized text matching ad promise and following the 6 rules",
      "reason": "specific reason explaining the gap and how this rewrite fixes it"
    }
  ],
  "unchanged": ["element name - reason not changed"]
}
`, systemPrompt)
}



