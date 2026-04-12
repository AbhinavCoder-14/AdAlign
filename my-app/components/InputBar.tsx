import type { DragEvent } from 'react'
import { ImageUploadButton } from './ImageUploadButton'
import { URLInput } from './URLInput'
import { SendButton } from './SendButton'
import { InstructionsInput } from './InstructionsInput'
import { ErrorMessage } from './ErrorMessage'

interface InputBarProps {
  image: File | null
  url: string
  instructions: string
  error: string
  placeholder: string
  onImageSelect: (file: File | undefined) => void
  onImageRemove: () => void
  onImageDrop: (event: DragEvent<HTMLDivElement>) => void
  onUrlChange: (value: string) => void
  onUrlFocus: () => void
  onUrlBlur: () => void
  onInstructionsChange: (value: string) => void
  onSubmit: () => void
}

export function InputBar({
  image,
  url,
  instructions,
  error,
  placeholder,
  onImageSelect,
  onImageRemove,
  onImageDrop,
  onUrlChange,
  onUrlFocus,
  onUrlBlur,
  onInstructionsChange,
  onSubmit,
}: InputBarProps) {
  const isDisabled = !image || !url

  return (
    <div className="border-t border-white/10 bg-[#0a0a0a] p-4">
      <div className="mx-auto max-w-2xl">
        {/* Main Input Container */}
        <div className="bg-[#111111] rounded-2xl border border-white/10 p-4 shadow-2xl space-y-4">
          {/* Row 1: Image + URL + Send */}
          <div className="flex items-center gap-3">
            <ImageUploadButton
              image={image}
              onFileSelect={onImageSelect}
              onRemove={onImageRemove}
              onDrop={onImageDrop}
            />

            <URLInput
              value={url}
              onChange={onUrlChange}
              onFocus={onUrlFocus}
              onBlur={onUrlBlur}
              placeholder={placeholder}
            />

            <SendButton disabled={isDisabled} onClick={onSubmit} />
          </div>

          {/* Row 2: Instructions - Integrated better */}
          <InstructionsInput value={instructions} onChange={onInstructionsChange} />

          {/* Error message */}
          <ErrorMessage message={error} />
        </div>
      </div>
    </div>
  )
}
