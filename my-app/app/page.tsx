'use client'

import type { DragEvent } from 'react'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { z } from 'zod'
import { Header, HeroSection, ProgressScreen, InputBar } from '@/components'

const SESSION_KEY = 'adalign_result'
const MAX_FILE_SIZE = 5 * 1024 * 1024
const URL_SCHEMA = z.string().url()

type ProgressStep = 'analyzing_ad' | 'scraping' | 'analyzing_gaps' | 'rewriting'

const STEPS = [
  { key: 'analyzing_ad', label: 'Ad creative analyzed' },
  { key: 'scraping', label: 'Reading landing page...' },
  { key: 'analyzing_gaps', label: 'Finding message gaps' },
  { key: 'rewriting', label: 'Personalizing content' },
] as const

type ProgressStepFromSTEPS = (typeof STEPS)[number]['key']

const PLACEHOLDER_URLS = ['Try: notion.so', 'Try: linear.app', 'Try: vercel.com', 'Try: supabase.com']

export default function InputPage() {
  const router = useRouter()
  const [image, setImage] = useState<File | null>(null)
  const [url, setUrl] = useState('')
  const [instructions, setInstructions] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [currentStep, setCurrentStep] = useState<ProgressStep | null>(null)
  const [completedSteps, setCompletedSteps] = useState<ProgressStep[]>([])
  const [placeholderIndex, setPlaceholderIndex] = useState(0)
  const [urlFocused, setUrlFocused] = useState(false)

  const hasStarted = image !== null || url.length > 0

  // Animated URL placeholder
  useEffect(() => {
    if (urlFocused || url.length > 0) return

    const interval = setInterval(() => {
      setPlaceholderIndex(prev => (prev + 1) % PLACEHOLDER_URLS.length)
    }, 1500)

    return () => clearInterval(interval)
  }, [urlFocused, url])

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

  function removeImage() {
    setImage(null)
  }

  function validateBeforeSubmit(): string {
    if (!image) {
      return 'Upload an ad creative image.'
    }

    if (image.size > MAX_FILE_SIZE) {
      return 'Image must be 5MB or smaller.'
    }

    let validUrl = url.trim()
    if (!validUrl.startsWith('http://') && !validUrl.startsWith('https://')) {
      validUrl = 'https://' + validUrl
    }

    const urlResult = URL_SCHEMA.safeParse(validUrl)
    if (!urlResult.success) {
      return 'Enter a valid landing page URL.'
    }

    return ''
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
    setCurrentStep('analyzing_ad')
    setCompletedSteps([])

    let finalUrl = url.trim()
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      finalUrl = 'https://' + finalUrl
    }

    const formData = new FormData()
    formData.append('image', image as File)
    formData.append('url', finalUrl)
    if (instructions) {
      formData.append('instructions', instructions)
    }

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
          const line = event.split('\n').find(entry => entry.startsWith('data: '))
          if (!line) continue

          const payload = JSON.parse(line.replace('data: ', ''))

          if (payload.type === 'status') {
            setCurrentStep(payload.step)
            setCompletedSteps(prev =>
              prev.includes(payload.step) ? prev : [...prev, payload.step as ProgressStep]
            )
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
      setCurrentStep(null)
      setCompletedSteps([])
    }
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    handleFile(event.dataTransfer.files?.[0])
  }

  // Show progress screen while loading
  if (loading) {
    return <ProgressScreen currentStep={currentStep} completedSteps={completedSteps} steps={STEPS} />
  }

  // Show main page
  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white flex flex-col">
      <Header />
      <HeroSection isVisible={!hasStarted} />
      <InputBar
        image={image}
        url={url}
        instructions={instructions}
        error={error}
        placeholder={!urlFocused && url.length === 0 ? PLACEHOLDER_URLS[placeholderIndex] : ''}
        onImageSelect={handleFile}
        onImageRemove={removeImage}
        onImageDrop={onDrop}
        onUrlChange={setUrl}
        onUrlFocus={() => setUrlFocused(true)}
        onUrlBlur={() => setUrlFocused(false)}
        onInstructionsChange={setInstructions}
        onSubmit={handleSubmit}
      />
    </main>
  )
}