interface ErrorMessageProps {
  message: string | null
}

export function ErrorMessage({ message }: ErrorMessageProps) {
  if (!message) return null

  return <p className="text-xs text-red-400 px-2">{message}</p>
}
