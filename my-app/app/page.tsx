'use client'

import type { DragEvent } from 'react'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { z } from 'zod'

const SESSION_KEY = 'adalign_result'
const MAX_FILE_SIZE = 5 * 1024 * 1024
const URL_SCHEMA = z.string().url()

const STEPS = [
  { key: 'analyzing_ad', label: 'Analyzing ad creative...' },
  { key: 'scraping', label: 'Reading landing page...' },
  { key: 'analyzing_gaps', label: 'Finding message gaps...' },
  { key: 'rewriting', label: 'Personalizing content...' },
  { key: 'done', label: 'Done!' },
] as const

type ProgressStep = (typeof STEPS)[number]['key']

export default function InputPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [url, setUrl] = useState('')
  const [image, setImage] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [progressStep, setProgressStep] = useState<ProgressStep | null>(null)
  const [progressMessage, setProgressMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!image) {
      setPreviewUrl('')
      return
    }

    const objectUrl = URL.createObjectURL(image)
    setPreviewUrl(objectUrl)

    return () => URL.revokeObjectURL(objectUrl)
  }, [image])

  function validateBeforeSubmit() {
    if (!image) {
      return 'Upload an ad creative image before continuing.'
    }

    if (image.size > MAX_FILE_SIZE) {
      return 'Image must be 5MB or smaller.'
    }

    const urlResult = URL_SCHEMA.safeParse(url)
    if (!urlResult.success) {
      return 'Enter a valid landing page URL.'
    }

    return ''
  }

  function handleFile(file: File | undefined) {
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file.')
      return
    }

    if (file.size > MAX_FILE_SIZE) {
      setError('Image must be 5MB or smaller.')
      return
    }

    setError('')
    setImage(file)
  }

  async function handleSubmit() {
    if (loading) return

    const validationError = validateBeforeSubmit()
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)
    setError('')
    setProgressStep('analyzing_ad')
    setProgressMessage('Analyzing ad creative...')

    const formData = new FormData()
    formData.append('image', image as File)
    formData.append('url', url.trim())

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      })

      if (!res.body) {
        throw new Error('The server did not return a streaming response.')
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })

        const events = buffer.split('\n\n')
        buffer = events.pop() || ''

        for (const event of events) {
          const line = event
            .split('\n')
            .find(entry => entry.startsWith('data: '))
          if (!line) continue

          const payload = JSON.parse(line.replace('data: ', ''))

          if (payload.type === 'status') {
            setProgressStep(payload.step)
            setProgressMessage(payload.message)
          }

          if (payload.type === 'error') {
            setError(payload.message)
            setLoading(false)
            return
          }

          if (payload.type === 'result') {
            sessionStorage.setItem(SESSION_KEY, JSON.stringify(payload))
            router.push('/result')
            return
          }
        }
      }

      if (!res.ok) {
        throw new Error('Unable to generate the personalized page.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
      setLoading(false)
      setProgressStep(null)
      setProgressMessage('')
    }
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setDragActive(false)
    handleFile(event.dataTransfer.files?.[0])
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center px-6 py-12 lg:px-10">
        <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <section className="space-y-8">
            <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-gray-200 backdrop-blur">
              <span className="h-2.5 w-2.5 rounded-full bg-cyan-400" />
              Message-match MVP
            </div>

            <div className="space-y-4">
              <h1 className="max-w-xl text-5xl font-black tracking-tight text-white sm:text-6xl">
                Turn an ad promise into the landing page experience.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-gray-300">
                Upload an ad creative and a landing page URL. AdAlign reads the promise in the ad,
                finds the mismatch on the page, and returns a personalized version of the existing page.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {[
                ['Ad-first analysis', 'Vision model extracts the promise, tone, and offer.'],
                ['Gap detection', 'Compares the page against the ad instead of rewriting blindly.'],
                ['Safer injection', 'Only exact text replacements are applied to the HTML.'],
              ].map(([title, description]) => (
                <div key={title} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm font-semibold text-white">{title}</p>
                  <p className="mt-2 text-sm leading-6 text-gray-400">{description}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-cyan-950/20 backdrop-blur-xl sm:p-8">
            <div className="space-y-6">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-white">Start a personalization run</h2>
                <p className="text-sm leading-6 text-gray-400">
                  The demo validates the input, streams progress, and opens the result view when the rewrite is ready.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Ad creative</label>
                <div
                  className={`group rounded-2xl border border-dashed p-6 transition-colors ${dragActive ? 'border-cyan-400 bg-cyan-400/10' : 'border-white/15 bg-gray-950/60 hover:border-white/25'}`}
                  onClick={() => fileInputRef.current?.click()}
                  onDragEnter={event => {
                    event.preventDefault()
                    setDragActive(true)
                  }}
                  onDragOver={event => {
                    event.preventDefault()
                    setDragActive(true)
                  }}
                  onDragLeave={() => setDragActive(false)}
                  onDrop={onDrop}
                >
                  {previewUrl ? (
                    <div className="space-y-4">
                      <img
                        src={previewUrl}
                        alt="Ad preview"
                        className="max-h-56 w-full rounded-2xl object-contain"
                      />
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-white">{image?.name}</p>
                          <p className="text-xs text-gray-400">{Math.round((image?.size || 0) / 1024)} KB</p>
                        </div>
                        <button
                          type="button"
                          onClick={event => {
                            event.stopPropagation()
                            setImage(null)
                          }}
                          className="rounded-full border border-white/10 px-3 py-1 text-xs text-gray-200 transition-colors hover:border-white/25 hover:text-white"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-2xl">
                        ⬆
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">Drop your ad image here</p>
                        <p className="mt-1 text-sm text-gray-400">or click to upload a JPG, PNG, or WEBP file.</p>
                      </div>
                      <p className="text-xs text-gray-500">Max file size: 5MB</p>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={event => handleFile(event.target.files?.[0])}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="landing-url" className="text-sm font-medium text-gray-300">
                  Landing page URL
                </label>
                <input
                  id="landing-url"
                  type="url"
                  value={url}
                  onChange={event => setUrl(event.target.value)}
                  placeholder="https://example.com/landing"
                  className="w-full rounded-2xl border border-white/10 bg-gray-950/70 px-4 py-3 text-white outline-none transition-colors placeholder:text-gray-600 focus:border-cyan-400"
                />
              </div>

              {error ? <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div> : null}

              {loading ? (
                <div className="space-y-3 rounded-2xl border border-white/10 bg-gray-950/60 p-4">
                  {STEPS.map((step, index) => {
                    const activeIndex = progressStep ? STEPS.findIndex(item => item.key === progressStep) : -1
                    const isActive = step.key === progressStep
                    const isDone = activeIndex > index

                    return (
                      <div
                        key={step.key}
                        className={`flex items-center gap-3 text-sm transition-colors ${isActive ? 'text-white' : isDone ? 'text-gray-500' : 'text-gray-700'}`}
                      >
                        <span className="w-4 text-center text-base">{isActive ? '⚡' : isDone ? '✓' : '○'}</span>
                        <span className={isActive ? 'font-medium' : ''}>{step.label}</span>
                      </div>
                    )
                  })}

                  <div className="pt-2 text-sm text-gray-400">{progressMessage || 'Waiting for the model pipeline...'}</div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="inline-flex w-full items-center justify-center rounded-2xl bg-white px-4 py-3.5 font-semibold text-gray-950 transition-transform hover:-translate-y-0.5 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={loading || !image || !url}
                >
                  Personalize page
                </button>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}