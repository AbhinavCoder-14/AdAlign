'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  MatchScore,
  AdSnapshot,
  ChangeSection,
  UnchangedSection,
  TweakInput,
  ViewToggle,
} from '@/components'
import type { AnalyzeResponse } from '@/types'

const SESSION_KEY = 'adalign_result'

type ViewType = 'original' | 'personalized'

export default function ResultPage() {
  const router = useRouter()
  const [data, setData] = useState<AnalyzeResponse | null>(null)
  const [activeView, setActiveView] = useState<ViewType>('personalized')
  const [currentModifiedHtml, setCurrentModifiedHtml] = useState('')
  const [currentChanges, setCurrentChanges] = useState<any[]>([])
  const [tweakInput, setTweakInput] = useState('')
  const [tweaking, setTweaking] = useState(false)
  const [tweakError, setTweakError] = useState('')
  const [showUnchanged, setShowUnchanged] = useState(false)

  // Load data from sessionStorage on mount
  useEffect(() => {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (!raw) {
      router.push('/')
      return
    }

    try {
      const parsed = JSON.parse(raw) as AnalyzeResponse
      setData(parsed)
      setCurrentModifiedHtml(parsed.modifiedHtml)
      setCurrentChanges(parsed.rewriteResult.changes)
    } catch {
      router.push('/')
    }
  }, [router])

  async function handleTweak() {
    if (!tweakInput.trim() || tweaking || !data) return

    setTweaking(true)
    setTweakError('')

    try {
      const res = await fetch('/api/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adAnalysis: data.adAnalysis,
          pageAnalysis: data.pageAnalysis,
          gaps: data.gapAnalysis.gaps,
          instruction: tweakInput,
          rawHtml: data.originalHtml,
        }),
      })

      const result = await res.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to apply tweak')
      }

      setCurrentModifiedHtml(result.modifiedHtml)
      setCurrentChanges(result.data.changes || [])
      setActiveView('personalized')
      setTweakInput('')
    } catch (err: any) {
      setTweakError(err.message || 'Failed to apply tweak')
    } finally {
      setTweaking(false)
    }
  }

  if (!data) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0a0a0a]">
        <p className="text-gray-400">Loading...</p>
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#0a0a0a]">
      {/* Left Pane - Scrollable Content */}
      <div className="w-2/5 overflow-y-auto border-r border-white/10 bg-[#0a0a0a]">
        <div className="sticky top-0 border-b border-white/10 bg-[#0a0a0a] px-6 py-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-600">AdAlign</p>
            <button
              onClick={() => router.push('/')}
              className="text-xs text-gray-500 hover:text-gray-400 transition-colors"
            >
              ← New analysis
            </button>
          </div>
        </div>

        <div className="space-y-8 px-6 py-8">
          {/* Match Score */}
          <MatchScore score={data.gapAnalysis.matchScore} summary={data.gapAnalysis.summary} />

          {/* Ad Snapshot */}
          <AdSnapshot analysis={data.adAnalysis} />

          <div className="border-t border-white/10" />

          {/* Changes */}
          <ChangeSection changes={currentChanges} />

          {/* Unchanged Items */}
          <UnchangedSection
            unchanged={data.rewriteResult.unchanged}
            isOpen={showUnchanged}
            onToggle={() => setShowUnchanged(!showUnchanged)}
          />

          {/* Warning Banner */}
          {data.warning && (
            <div className="rounded border border-yellow-700/40 bg-yellow-900/20 px-3 py-2">
              <p className="text-xs text-yellow-400"> {data.warning}</p>
            </div>
          )}

          <div className="border-t border-white/10" />

          {/* Tweak Input */}
          <TweakInput
            value={tweakInput}
            onChange={setTweakInput}
            onSubmit={handleTweak}
            loading={tweaking}
            error={tweakError}
          />
        </div>
      </div>

      {/* Right Pane - Fixed Iframe */}
      <div className="w-3/5 flex flex-col overflow-y-auto bg-[#111111]">
        <ViewToggle activeView={activeView} onViewChange={setActiveView} />
        <iframe
          srcDoc={activeView === 'original' ? data.originalHtml : currentModifiedHtml}
          className="flex-1 border-0"
          sandbox="allow-same-origin"
          title={activeView === 'original' ? 'Original page' : 'Personalized page'}
        />
      </div>
    </div>
  )
}