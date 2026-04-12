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

    const rewriteResult = await callClaude<RewriteResult>(`
    You are an expert conversion copywriter.
    Rewrite ONLY the elements listed in the gaps below.
    Do NOT invent changes for elements not in the gaps list.
    
    Additional user instruction: ${instruction}
    Prioritize this instruction above all else.
    
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
