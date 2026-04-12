type ViewType = 'original' | 'personalized'

interface ViewToggleProps {
  activeView: ViewType
  onViewChange: (view: ViewType) => void
}

export function ViewToggle({ activeView, onViewChange }: ViewToggleProps) {
  return (
    <div className="flex gap-2 p-4 border-b border-white/10">
      <button
        onClick={() => onViewChange('original')}
        className={`flex items-center gap-1 rounded px-3 py-1 text-xs transition-colors ${
          activeView === 'original'
            ? 'bg-white/10 text-white'
            : 'text-gray-600 hover:text-gray-400'
        }`}
      >
        ⬜ Original
      </button>
      <button
        onClick={() => onViewChange('personalized')}
        className={`flex items-center gap-1 rounded px-3 py-1 text-xs transition-colors ${
          activeView === 'personalized'
            ? 'bg-white/10 text-white'
            : 'text-gray-600 hover:text-gray-400'
        }`}
      >
        ✦ Personalized
      </button>
    </div>
  )
}
