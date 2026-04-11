import { NextRequest, NextResponse } from "next/server";
import 'dotenv/config'
import { analyzeAd, analyzePage, gapAnalyze, reWritePage } from '@/app/lib/agents'
import { scraper } from "@/app/lib/scraper";
import { injectChanges, isInjectionSafe } from "@/app/lib/inject";



export async function POST(req:NextRequest){

    const formData = await req.formData()
    const imageFile = formData.get("image") as File

    const url = formData.get('url') as string
    if (!imageFile || !url) {
      return NextResponse.json({ error: 'Image and URL are required' }, { status: 400 })
    }


    const arrayBuffer = await imageFile.arrayBuffer()
    const base64 = Buffer.from(arrayBuffer).toString('base64')
    const mimeType = imageFile.type || 'image/jpeg'


    const encoder = new TextEncoder()
  
    const stream = new ReadableStream({
        async start(controller) {
        
        // Helper — sends a status update to frontend
        function sendStatus(step: string, message: string) {
            const data = JSON.stringify({ type: 'status', step, message })
            controller.enqueue(encoder.encode(`data: ${data}\n\n`))
        }

        // Helper — sends final result to frontend
        function sendResult(result: object) {
            const data = JSON.stringify({ type: 'result', ...result })
            controller.enqueue(encoder.encode(`data: ${data}\n\n`))
            controller.close()
        }

        // Helper — sends error to frontend
        function sendError(message: string) {
            const data = JSON.stringify({ type: 'error', message })
            controller.enqueue(encoder.encode(`data: ${data}\n\n`))
            controller.close()
        }


        


        try{

            let markdown = ''
            let rawHTML = ''


            sendStatus("analyzing_ad","Analyzing add creative...")
            const adAnalysis  = await analyzeAd(base64,mimeType)

            sendStatus("scraping","Reading the landing page")
            try{
                const scraperData = await scraper(url)
                markdown = await Promise.resolve(scraperData?.jinaRes)
                rawHTML = await Promise.resolve(scraperData?.htmlRes)
            
            }catch{
                sendError('Could not access the landing page URL.')
                return

            }


            if (!markdown) {
                sendError('Could not read landing page content.')
            return
            }


            const pageAnalysis = await analyzePage(markdown)


            sendStatus('analyzing_gaps', 'Finding message gaps...')
            const gapAnalysis = await gapAnalyze(adAnalysis, pageAnalysis)


            sendStatus('rewriting', 'Personalizing content...')
            const rewriteResult = await reWritePage(
            adAnalysis,
            pageAnalysis,
            gapAnalysis.gaps
            )


            let modifiedHtml = rawHTML
            let warning: string | undefined


            if (rawHTML) {
                const injected = injectChanges(rawHTML, rewriteResult.changes)
                if (isInjectionSafe(rawHTML, injected)) {
                    modifiedHtml = injected
                } else {
                    warning = 'Page structure too complex for direct injection.'
                }
                }

            sendStatus('done', 'Done!')



            sendResult({
          adAnalysis,
          pageAnalysis,
          gapAnalysis,
          rewriteResult,
          originalHtml: rawHTML,
          modifiedHtml,
          warning
        })







        }





    // return NextResponse.json()


}})

}

