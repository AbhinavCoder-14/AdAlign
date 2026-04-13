import { reWritePage } from '@/app/lib/agents'
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

    const rewriteResult: RewriteResult = await reWritePage(adAnalysis, pageAnalysis, gaps, instruction)

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
