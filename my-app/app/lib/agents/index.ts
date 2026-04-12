import { callClaude, callClaudeVision } from '../claude'
import { AdAnalysis, PageAnalysis, GapAnalysis, RewriteResult } from '@/types'



export async function analyzeAd(base64:string,mimeType:string):Promise<AdAnalysis> {



    const response = await callClaudeVision<AdAnalysis>(base64,mimeType,`
      
      Analyze this ad creative and extract the following.
      Return ONLY valid JSON, no explanation, no markdown:
      {
        "headline": "main headline or hook in the ad",
        "cta": "call to action text",
        "audience": "who this ad is targeting",
        "offer": "the core offer or promise",
        "differentiator": "what makes this offer unique",
        "urgencySignals": "any time pressure in the ad — 'today', 'free trial', 'limited'",
        "specificClaim": "any specific number or proof — '3x faster', '98% of Fortune 500'",
        "emotionalTrigger": "fear | aspiration | curiosity | relief | status",
        "impliedPain": "what problem the ad assumes the user has",
        "trustSignals": "logos, numbers, guarantees visible in the ad"
        "tone": "urgent | friendly | professional | casual",
      }
  `)
    return response
    
}

export async function analyzePage(markdown:string): Promise<PageAnalysis> {

    const response = await callClaude<PageAnalysis>(`
    Analyze this landing page comprehensively. Extract EXACT text for headlines and CTAs.
    
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
  `)

    return response
    
}


export async function gapAnalyze(adAnalysis:AdAnalysis,pageAnalysis:PageAnalysis):Promise<GapAnalysis> {

    const response = await callClaude<GapAnalysis>(`
    You are a direct response copywriter and CRO (Conversion Rate Optimization) expert.
    
    AD CREATIVE (what user is expecting):
    ${JSON.stringify(adAnalysis, null, 2)}
    
    LANDING PAGE (current reality):
    ${JSON.stringify(pageAnalysis, null, 2)}
    
    SCORING CRITERIA — be strict, not generous:

    SPECIFICITY (0-100):
      100 = page makes claims as specific as the ad
            e.g. ad says "3x faster", page says "3x faster"
      50  = page is somewhat specific but vaguer than the ad
      0   = ad has specific claims, page is completely generic
      Score based on: do the numbers, timeframes, and 
      outcomes in the ad appear on the page?

    URGENCY (0-100):
      100 = page creates same urgency as the ad
            e.g. ad says "free trial", page CTA says "start free"
      50  = some urgency signals present but weaker than ad
      0   = ad is urgent, page feels passive ("learn more")
      Score based on: do the urgency signals from the ad 
      (free, today, limited, fast) appear in page CTA and hero?

    MESSAGE MATCH (0-100):
      100 = page headline directly reflects the ad's core promise
      50  = page and ad are in the same category but different angle
      0   = page talks about completely different things than the ad
      Score based on: if someone clicked the ad and landed here,
      would they feel they are in the right place?

    CLARITY (0-100):
      100 = one clear CTA, one clear value proposition above fold
      50  = CTA exists but competes with other actions
      0   = multiple CTAs, unclear what to do next
      Score based on: how many CTAs are visible, 
      how clear is the primary action

    TRUST ALIGNMENT (0-100):
      100 = page shows same type of social proof the ad implies
            e.g. ad shows enterprise logos, page shows enterprise logos
      50  = page has some proof but different type than ad implies
      0   = ad implies credibility the page doesn't support at all
      Score based on: does the page's social proof match 
      the audience and claims made in the ad?

    OVERALL (0-100):
      Weighted average:
      - Message match: 30% weight (most important)
      - Specificity:   25% weight
      - Clarity:       20% weight
      - Trust:         15% weight
      - Urgency:       10% weight
    
    ## CORE MESSAGE MATCHING:
    - Does the page immediately communicate what the ad promised?
    - Do key benefits match the ad's urgency and emotional triggers?
    - Does the target audience on page align with ad's implied customer?
    - Is the tone consistent between ad and page?
    
    ## CONVERSION GAPS TO FLAG:
    
    1. SPECIFICITY GAP
       Does the page make claims as specific as the ad?
       Example gap: Ad says "3x more leads in 30 days" but page says "grow your business"
       
    2. URGENCY GAP
       Does the page create any reason to act NOW?
       Check if: Ad has urgency signals (${adAnalysis.urgencySignals}) but page lacks them
       
    3. PAIN ALIGNMENT GAP
       Does the page speak to the same pain the ad assumes?
       Ad assumes user feels: "${adAnalysis.impliedPain}"
       Check if page addresses this same pain or talks about something different
       
    4. TRUST GAP
       Are trust signals visible above the fold?
       Check if: Ad shows trust signals (${adAnalysis.trustSignals}) but page doesn't reflect them early
       
    5. CTA FRICTION GAP
       Does the CTA match the ad's promise?
       Example gap: Ad emphasizes "free" but page CTA says "contact sales"
       Ad CTA: "${adAnalysis.cta}" vs Page CTA: "${pageAnalysis.cta}"
    
    Return ONLY valid JSON:
    {
      "matchScore": <0-100 integer - same as messageMatch>,
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
          "reason": "why this gap hurts conversion (reference the specific gap type if applicable)"
        }
      ]
    }
  `)

    return response
    
}


export async function reWritePage(adAnalysis: AdAnalysis, pageAnalysis: PageAnalysis, gaps: GapAnalysis['gaps'],USER_INSTRUCTION:string):Promise<RewriteResult> {

    const highAndMediumGaps = gaps.filter(g => g.severity !== 'low' )

    return callClaude<RewriteResult>(`
    You are a direct response copywriter with expertise in conversion rate optimization.
    
    PRODUCT CONTEXT:
    - What They Do: ${pageAnalysis.whatTheyDo}
    - Key Features: ${pageAnalysis.keyFeatures.join(', ')}
    - Main Benefits: ${pageAnalysis.keyBenefits.join(', ')}
    - Target Customer: ${pageAnalysis.targetCustomerProfile}
    - Unique Value: ${pageAnalysis.uniqueValue}
    
    AD EXPECTATIONS TO MATCH:
    - Headline Promise: ${adAnalysis.headline}
    - Core Offer: ${adAnalysis.offer}
    - Specific Claim: ${adAnalysis.specificClaim}
    - Emotional Trigger: ${adAnalysis.emotionalTrigger}
    - Implied Customer Pain: ${adAnalysis.impliedPain}
    - Urgency Signals: ${adAnalysis.urgencySignals}
    - Trust Signals to Showcase: ${adAnalysis.trustSignals}
    - Client Direction: ${USER_INSTRUCTION}
    
    CURRENT PAGE:
    ${JSON.stringify(pageAnalysis, null, 2)}
    
    GAPS TO FIX (rewrite ONLY these):
    ${JSON.stringify(highAndMediumGaps, null, 2)}
    
    ## YOUR REWRITING RULES:
    
    RULE 1 — SPECIFICITY OVER VAGUENESS
    Never write vague claims like "grow your business" or "better results"
    Always be specific: "get 3x more leads in 30 days" or "save 12 hours per week"
    Use the specific claim from the ad if one exists: "${adAnalysis.specificClaim}"
    
    RULE 2 — MATCH THE EMOTIONAL TRIGGER
    The ad uses this emotional approach: ${adAnalysis.emotionalTrigger}
    If the ad creates URGENCY → your page should too
    If the ad uses ASPIRATION → mirror that energy
    If the ad uses FEAR → acknowledge the pain before solving it
    Match the energy. Don't soften urgent messaging.
    
    RULE 3 — REFLECT THE IMPLIED PAIN
    The ad assumes the user feels: "${adAnalysis.impliedPain}"
    Your rewrites must acknowledge this pain point first, then show the solution.
    Open with empathy: "You're tired of [pain]..." then deliver the relief.
    
    RULE 4 — URGENCY MUST CARRY THROUGH
    If the ad has urgency signals ("${adAnalysis.urgencySignals}"), the page MUST reflect that.
    Passive language kills urgency.
    Bad: "You can try it anytime"
    Good: "Start today and see results in 30 days"
    Every CTA must reflect the same urgency as the ad.
    
    RULE 5 — ONE JOB PER ELEMENT
    Headline: State the transformation or outcome promised by the ad
    Subheadline: Explain who it's for and why it works
    CTA: Tell them exactly what happens when they click (no guessing)
    Supporting copy: Remove objections and add proof
    
    RULE 6 — NEVER BE CLEVER, ALWAYS BE CLEAR
    Clarity beats creativity for conversions.
    If you must choose between a clever line and a clear line — always pick clear.
    Avoid puns, complex metaphors, or industry jargon.
    Use simple, direct language your customer uses.
    
    Return ONLY valid JSON:
    {
      "changes": [
        {
          "element": "element name",
          "original": "exact current text from page",
          "rewritten": "new personalized text matching ad promise and following the 6 rules",
          "reason": "specific reason explaining the gap and how this rewrite fixes it"
        }  
        ]
    }
`)}

