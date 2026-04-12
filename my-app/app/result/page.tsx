'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

const SESSION_KEY = 'adalign_result'

type ResultPayload = {
  type?: string
  adAnalysis?: {
    headline: string
    cta: string
    tone: string
    audience: string
    offer: string
    differentiator: string
  }
  pageAnalysis?: {
    headline: string
    subheadline: string
    cta: string
    valueProp: string
    audience: string
    tone: string
  }
  gapAnalysis?: {
    matchScore: number
    summary: string
    gaps: Array<{
      element: string
      adSays: string
      pageSays: string
      severity: 'high' | 'medium' | 'low'
      reason: string
    }>
  }
  rewriteResult?: {
    changes: Array<{
      element: string
      original: string
      rewritten: string
      reason: string
    }>
    unchanged: string[]
  }
  originalHtml?: string
  modifiedHtml?: string
  warning?: string
}

function scoreClass(score: number) {
  if (score <= 40) return 'text-red-400'
  if (score <= 70) return 'text-yellow-400'
  return 'text-green-400'
}

function formatElementName(value: string) {
  return value.replace(/_/g, ' ')
}

export default function ResultPage() {
  const router = useRouter()
  const [result, setResult] = useState<ResultPayload | null>(null)

  useEffect(() => {
    const stored = sessionStorage.getItem(SESSION_KEY)

    if (!stored) {
      router.replace('/')
      return
    }

    try {
      setResult(JSON.parse(stored) as ResultPayload)
    } catch {
      router.replace('/')
    }
  }, [router])

  const score = result?.gapAnalysis?.matchScore ?? 0

  const iframeStyle = useMemo(
    () => ({
      width: '100%',
      height: '100%',
      border: '0',
      background: '#fff',
    }),
    [],
  )

  if (!result) {
    return (
      <main className="min-h-screen bg-gray-950 px-6 py-10 text-white">
        <div className="mx-auto flex min-h-[60vh] max-w-4xl items-center justify-center rounded-3xl border border-white/10 bg-white/5 text-gray-300">
          Loading result...
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-950 px-6 py-10 text-white lg:px-10">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="flex flex-col gap-4 border-b border-white/10 pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-300">
              Message-match result
            </div>
            <div>
              <h1 className="text-4xl font-black tracking-tight text-white">Personalized landing page</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-400">
                The rewrite keeps the existing page structure and adjusts the copy to better mirror the ad promise.
              </p>
            </div>
          </div>

          <div className={`text-7xl font-black tracking-tight ${scoreClass(score)}`}>
            {score}
            <span className="ml-2 text-2xl text-gray-500">/100</span>
          </div>
        </header>

        {result.warning ? (
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            {result.warning}
          </div>
        ) : null}

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5 md:col-span-2">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-gray-400">Match summary</p>
                <p className="mt-2 text-lg font-semibold text-white">{result.gapAnalysis?.summary}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-gray-950/70 px-4 py-3 text-right">
                <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Score readout</p>
                <p className={`mt-1 text-xl font-bold ${scoreClass(score)}`}>{score <= 40 ? 'Poor' : score <= 70 ? 'Partial' : 'Strong'} match</p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-gray-950/60 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Ad headline</p>
                <p className="mt-2 text-sm leading-6 text-white">{result.adAnalysis?.headline}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-gray-950/60 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Page headline</p>
                <p className="mt-2 text-sm leading-6 text-white">{result.pageAnalysis?.headline}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-gray-950/60 p-4 sm:col-span-2 xl:col-span-1">
                <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Rewrite status</p>
                <p className="mt-2 text-sm leading-6 text-white">{result.warning ? 'Fallback to original HTML' : 'Injected copy safely'}</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm text-gray-400">Unchanged elements</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {result.rewriteResult?.unchanged?.length ? (
                result.rewriteResult.unchanged.map(item => (
                  <span key={item} className="rounded-full border border-white/10 bg-gray-950/70 px-3 py-1 text-xs text-gray-200">
                    {formatElementName(item)}
                  </span>
                ))
              ) : (
                <p className="text-sm text-gray-500">No unchanged elements reported.</p>
              )}
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5">
            <div className="border-b border-white/10 px-5 py-4">
              <p className="text-sm font-medium text-white">Original landing page</p>
              <p className="mt-1 text-xs text-gray-400">The source page before the personalization pass.</p>
            </div>
            <div className="h-[720px] bg-white">
              <iframe title="Original landing page" srcDoc={result.originalHtml || '<div></div>'} style={iframeStyle} sandbox="allow-forms allow-popups allow-same-origin" />
            </div>
          </div>

          <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5">
            <div className="border-b border-white/10 px-5 py-4">
              <p className="text-sm font-medium text-white">Personalized landing page</p>
              <p className="mt-1 text-xs text-gray-400">The same page with message-match edits applied.</p>
            </div>
            <div className="h-[720px] bg-white">
              <iframe title="Personalized landing page" srcDoc={result.modifiedHtml || result.originalHtml || '<div></div>'} style={iframeStyle} sandbox="allow-forms allow-popups allow-same-origin" />
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div>
            <p className="text-sm text-gray-400">Changes</p>
            <h2 className="mt-1 text-2xl font-bold text-white">Before and after</h2>
          </div>

          <div className="grid gap-4">
            {result.rewriteResult?.changes?.length ? result.rewriteResult.changes.map(change => (
              <article key={`${change.element}-${change.original}`} className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">{formatElementName(change.element)}</p>
                    <p className="mt-2 text-lg font-semibold text-white">{change.reason}</p>
                  </div>
                </div>

                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-gray-950/70 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Original</p>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-200">{change.original}</p>
                  </div>
                  <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-cyan-200">Rewritten</p>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-white">{change.rewritten}</p>
                  </div>
                </div>
              </article>
            )) : (
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-gray-400">No copy changes were needed for this run.</div>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}