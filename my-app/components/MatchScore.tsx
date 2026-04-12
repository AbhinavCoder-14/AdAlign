interface MatchScoreProps {
  score: number
  summary: string
}

export function MatchScore({ score, summary }: MatchScoreProps) {
  const getColor = () => {
    if (score <= 40) return 'text-red-400'
    if (score <= 70) return 'text-yellow-400'
    return 'text-green-400'
  }

  return (
    <div className="space-y-4 py-6">
      <div className={`text-7xl font-black ${getColor()}`}>{score}</div>
      <p className="text-xs text-gray-500">/ 100 Message Match</p>
      <p className="text-sm text-gray-400">{summary}</p>
    </div>
  )
}
