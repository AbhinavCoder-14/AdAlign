import { NextRequest, NextResponse } from 'next/server'
import 'dotenv/config'

import { analyzeAd, analyzePage, gapAnalyze, reWritePage } from '@/app/lib/agents'
import { scraper } from '@/app/lib/scraper'
import { injectChanges, isInjectionSafe } from '@/app/lib/inject'

export const maxDuration = 60

type StatusStep = 'analyzing_ad' | 'scraping' | 'analyzing_gaps' | 'rewriting' | 'done'

function createSseHeaders() {
  return {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  }
}

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const imageFile = formData.get('image') as File | null
  const url = String(formData.get('url') || '')

  if (!imageFile || !url) {
    return NextResponse.json({ error: 'Image and URL are required.' }, { status: 400 })
  }

  const arrayBuffer = await imageFile.arrayBuffer()
  const base64 = Buffer.from(arrayBuffer).toString('base64')
  const mimeType = imageFile.type || 'image/jpeg'
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const send = (payload: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`))
      }

      const sendStatus = (step: StatusStep, message: string) => {
        send({ type: 'status', step, message })
      }

      const sendResult = (result: object) => {
        send({ type: 'result', ...result })
        controller.close()
      }

      const sendError = (message: string) => {
        send({ type: 'error', message })
        controller.close()
      }

      try {
        sendStatus('analyzing_ad', 'Analyzing ad creative...')
        const adAnalysis = await analyzeAd(base64, mimeType)

        sendStatus('scraping', 'Reading landing page...')
        let scraped
        try {
          scraped = await scraper(url)
        } catch {
          sendError('Could not scrape the landing page URL. Check that the URL is reachable and responds with HTML.')
          return
        }

        const markdown = scraped.jinaRes
        const rawHtml = scraped.htmlRes

        if (!markdown) {
          sendError('Jina could not read the landing page content.')
          return
        }

        const pageAnalysis = await analyzePage(markdown)

        sendStatus('analyzing_gaps', 'Finding message gaps...')
        const gapAnalysis = await gapAnalyze(adAnalysis, pageAnalysis)

        sendStatus('rewriting', 'Personalizing content...')
        const rewriteResult = await reWritePage(adAnalysis, pageAnalysis, gapAnalysis.gaps)

        let modifiedHtml = rawHtml
        let warning: string | undefined

        if (rawHtml) {
          const injected = injectChanges(rawHtml, rewriteResult.changes)
          if (isInjectionSafe(rawHtml, injected)) {
            modifiedHtml = injected
          } else {
            warning = 'Injection was unsafe, so the original HTML was preserved.'
          }
        } else {
          warning = 'The landing page HTML could not be fetched, so only analysis results are available.'
        }

        sendStatus('done', 'Done!')
        sendResult({
          adAnalysis,
          pageAnalysis,
          gapAnalysis,
          rewriteResult,
          originalHtml: rawHtml,
          modifiedHtml,
          warning,
        })
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unexpected server error.'
        sendError(message)
      }
    },
  })

  return new Response(stream, {
    status: 200,
    headers: createSseHeaders(),
  })
}