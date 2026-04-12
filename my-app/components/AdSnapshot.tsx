import { AdAnalysis } from '@/types'

interface AdSnapshotProps {
  analysis: AdAnalysis
}

export function AdSnapshot({ analysis }: AdSnapshotProps) {
  return (
    <div className="space-y-3 py-4">
      <p className="text-xs text-gray-600">Ad promised:</p>
      <div className="flex flex-wrap gap-2">
        <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-400">
          {analysis.offer}
        </div>
        <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-400">
          {analysis.tone}
        </div>
        <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-400">
          {analysis.audience}
        </div>
      </div>
    </div>
  )
}
