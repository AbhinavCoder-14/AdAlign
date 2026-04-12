import { callClaude } from '@/app/lib/claude'
import { injectChanges, isInjectionSafe } from '@/app/lib/inject'
import type { AdAnalysis, PageAnalysis, Gap, RewriteResult } from '@/types'

export const maxDuration = 300

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const {
      adAnalysis,
      pageAnalysis,
      gaps,
      instruction,
      rawHtml,
    }: {
      adAnalysis: AdAnalysis
      pageAnalysis: PageAnalysis
      gaps: Gap[]
      instruction: string
      rawHtml: string
    } = body

    if (!adAnalysis || !pageAnalysis || !gaps || !instruction || !rawHtml) {
      return Response.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Call Agent 4 (rewritePage) with the instruction
    const highAndMediumGaps = gaps.filter(g => g.severity !== 'low')
    
    // Compress data to reduce token usage
    const compressedAdAnalysis = {
      tone: adAnalysis.tone,
      offer: adAnalysis.offer,
      value_prop: (adAnalysis as any).value_prop,
      cta: (adAnalysis as any).cta,
    }
    
    const gapElementNames = new Set(highAndMediumGaps.map(g => g.element))
    const filteredPageAnalysis = Object.fromEntries(
      Object.entries(pageAnalysis).filter(([key]) => gapElementNames.has(key))
    )
    
    const compressedGaps = highAndMediumGaps.map(g => ({
      element: g.element,
      severity: g.severity,
      reason: g.reason,
    })) 

    const rewriteResult = await callClaude<RewriteResult>(`
    Rewrite ONLY the elements listed in the gaps below.
    Do NOT invent changes for elements not in the gaps list.
    
    User instruction: ${instruction}
    
    Ad tone: ${compressedAdAnalysis.tone}
    Core offer: ${compressedAdAnalysis.offer}
    
    Page elements to rewrite:
    ${JSON.stringify(filteredPageAnalysis)}
    
    Gaps (only rewrite these):
    ${JSON.stringify(compressedGaps)}
    
    Rules:
    - Match the ad tone exactly
    - Keep rewrites similar in length
    - Only fix the identified gaps
    - Return exact original text in "original" field
    
    Return ONLY valid JSON:
    {
      "changes": [
        {
          "element": "headline",
          "original": "exact current text",
          "rewritten": "new text",
          "reason": "why changed"
        }
      ],
      "unchanged": ["element - reason"]
    }
  `)

    // Inject changes into HTML
    const modifiedHtml = injectChanges(rawHtml, rewriteResult.changes)

    // Check if injection is safe
    const isSafe = isInjectionSafe(rawHtml, modifiedHtml)

    if (!isSafe) {
      return Response.json(
        {
          success: false,
          error: 'Injection would alter HTML structure too much. Please try a different tweak.',
          data: rewriteResult,
          modifiedHtml: rawHtml, // Return original on safety failure
        },
        { status: 200 }
      )
    }

    return Response.json(
      {
        success: true,
        data: rewriteResult,
        modifiedHtml,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Rewrite error:', error)
    return Response.json(
      {
        success: false,
        error: error?.message || 'Failed to rewrite page',
      },
      { status: 500 }
    )
  }
}
