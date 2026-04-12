interface SendButtonProps {
  disabled: boolean
  onClick: () => void
}

export function SendButton({ disabled, onClick }: SendButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`shrink-0 rounded-full p-2.5 transition-all font-semibold ${
        disabled
          ? 'bg-white/20 text-white/40 cursor-not-allowed'
          : 'bg-white text-black hover:bg-gray-100 hover:shadow-lg'
      }`}
    >
      →
    </button>
  )
}
