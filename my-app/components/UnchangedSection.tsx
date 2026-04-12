interface UnchangedSectionProps {
  unchanged: string[]
  isOpen: boolean
  onToggle: () => void
}

export function UnchangedSection({ unchanged, isOpen, onToggle }: UnchangedSectionProps) {
  if (!unchanged.length) return null

  return (
    <div className="space-y-2 py-4">
      <button
        onClick={onToggle}
        className="flex items-center gap-2 text-xs text-gray-600 hover:text-gray-400 transition-colors"
      >
        <span>{isOpen ? '▾' : '▸'}</span>
        <span>Show unchanged elements</span>
      </button>

      {isOpen && (
        <div className="space-y-1 pl-4">
          {unchanged.map((item, idx) => (
            <p key={idx} className="text-xs text-gray-700">
              • {item}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}
