import { useRef } from 'react'

interface ImageUploadButtonProps {
  image: File | null
  onFileSelect: (file: File | undefined) => void
  onRemove: () => void
  onDrop: (event: React.DragEvent<HTMLDivElement>) => void
}

export function ImageUploadButton({ image, onFileSelect, onRemove, onDrop }: ImageUploadButtonProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  return (
    <div
      onClick={() => fileInputRef.current?.click()}
      onDrop={onDrop}
      onDragOver={e => e.preventDefault()}
      onDragEnter={e => e.preventDefault()}
      className="shrink-0 cursor-pointer group"
    >
      {image ? (
        <div className="flex items-center gap-2 rounded-lg bg-white/10 border border-white/20 px-3 py-2 group-hover:border-white/30 transition-colors">
          <span className="text-xs font-medium text-white">✓ {image.name}</span>
          <button
            onClick={e => {
              e.stopPropagation()
              onRemove()
            }}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ×
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-lg bg-white/5 border border-white/10 px-3 py-2 group-hover:bg-white/10 group-hover:border-white/20 transition-colors">
          <span className="text-sm">🖼️</span>
          <span className="text-xs text-gray-400 group-hover:text-gray-300 transition-colors">Upload ad</span>
        </div>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => onFileSelect(e.target.files?.[0])}
      />
    </div>
  )
}
