interface TweakInputProps {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  loading: boolean
  error: string
}

export function TweakInput({ value, onChange, onSubmit, loading, error }: TweakInputProps) {
  return (
    <div className="space-y-2">

      <div className="flex items-center gap-2 bg-[#111111] rounded-lg border border-white/10 px-3 py-2 absolute w-[36%] bottom-[11px]">
        <span className="text-gray-500 text-sm">→</span>
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !loading && onSubmit()}
          placeholder='e.g. "make headline more urgent"'
          disabled={loading}
          className="flex-1 bg-transparent text-white outline-none placeholder:text-gray-600 text-xs py-1 ml-2"
        />
        <button
          onClick={onSubmit}
          disabled={!value.trim() || loading}
          className={`shrink-0 rounded-full p-1.5 transition-all ${
            !value.trim() || loading
              ? 'text-white/40 cursor-not-allowed'
              : 'text-white hover:bg-white/10'
          }`}
        >
          →
        </button>
      </div>

      {loading && <p className="text-xs text-gray-500">Applying tweak...</p>}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}
