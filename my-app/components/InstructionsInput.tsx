interface InstructionsInputProps {
  value: string
  onChange: (value: string) => void
}

export function InstructionsInput({ value, onChange }: InstructionsInputProps) {
  return (
    <div className="pt-2 border-t border-white/5">
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder='Add instructions (optional)... e.g. "focus on enterprise audience"'
        className="w-full bg-transparent text-white outline-none placeholder:text-gray-600 text-xs py-2"
      />
    </div>
  )
}
