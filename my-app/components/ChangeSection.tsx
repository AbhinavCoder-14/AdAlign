import { Change } from '@/types'

interface ChangeSectionProps {
  changes: Change[]
}

function getSeverityBadge(reason: string): string {
  // Infer severity from reason or default to medium
  if (reason.toLowerCase().includes('headline')) return 'high'
  if (reason.toLowerCase().includes('cta')) return 'high'
  return 'medium'
}

export function ChangeSection({ changes }: ChangeSectionProps) {
  if (!changes.length) return null

  return (
    <div className="space-y-6 py-6">
      <h3 className="text-sm font-semibold text-white">What changed</h3>

      {changes.map((change, idx) => (
        <div key={idx} className="space-y-3 border-b border-white/5 pb-6 last:border-0">
          <div className="flex items-center gap-2">
            <p className="text-xs font-medium text-white uppercase">{change.element}</p>
            <span className="rounded text-xs bg-white/10 px-2 py-0.5 text-gray-300">
              {getSeverityBadge(change.reason)}
            </span>
          </div>

          <p className="text-xs text-gray-600">{change.reason}</p>

          <div className="space-y-2">
            <div className="border-l-2 border-red-500 pl-3 text-xs text-gray-400">
              {change.original}
            </div>
            <div className="border-l-2 border-green-500 pl-3 text-xs text-gray-300">
              {change.rewritten}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
