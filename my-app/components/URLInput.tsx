interface URLInputProps {
  value: string
  onChange: (value: string) => void
  onFocus: () => void
  onBlur: () => void
  placeholder: string
}

export function URLInput({ value, onChange, onFocus, onBlur, placeholder }: URLInputProps) {
  return (
    <div className="flex-1 flex items-center bg-white/5 rounded-lg border border-white/10 focus-within:border-white/20 focus-within:bg-white/8 transition-colors px-3">
      <span className="text-gray-500 text-sm">→</span>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={onFocus}
        onBlur={onBlur}
        placeholder={placeholder}
        className="flex-1 bg-transparent text-white outline-none placeholder:text-gray-600 text-sm py-2 ml-2"
      />
    </div>
  )
}
