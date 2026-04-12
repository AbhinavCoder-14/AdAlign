import type { ConversionScore } from '@/types'

interface MatchScoreProps {
  score: number
  summary: string
  conversionScore?: ConversionScore
}

function ProgressBar({ value }: { value: number }) {
  const filledBlocks = Math.round(value / 10)
  const emptyBlocks = 10 - filledBlocks
  return (
    <span className="text-gray-400">
      {'█'.repeat(filledBlocks)}{'░'.repeat(emptyBlocks)}  {value}
    </span>
  )
}

export function MatchScore({ score, summary, conversionScore }: MatchScoreProps) {
  const getColor = () => {
    if (score <= 40) return 'text-red-400'
    if (score <= 70) return 'text-yellow-400'
    return 'text-green-400'
  }

  return (
    <div className="space-y-6 py-6">
      <div>
        <div className={`text-7xl font-black ${getColor()}`}>{score}</div>
        <p className="text-xs text-gray-500">/ 100 Message Match</p>
        <p className="text-sm text-gray-400 mt-2">{summary}</p>
      </div>

      {conversionScore && (
        <div className="space-y-3 border-t border-white/5 pt-4">
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-400 w-32">Message match</span>
            <ProgressBar value={conversionScore.messageMatch} />
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-400 w-32">Specificity</span>
            <ProgressBar value={conversionScore.specificity} />
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-400 w-32">Clarity</span>
            <ProgressBar value={conversionScore.clarity} />
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-400 w-32">Trust alignment</span>
            <ProgressBar value={conversionScore.trustAlignment} />
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-400 w-32">Urgency</span>
            <ProgressBar value={conversionScore.urgency} />
          </div>
        </div>
      )}
    </div>
  )
}
