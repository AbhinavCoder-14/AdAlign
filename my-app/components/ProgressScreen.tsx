type ProgressStep = 'analyzing_ad' | 'scraping' | 'analyzing_gaps' | 'rewriting'

interface ProgressScreenProps {
  currentStep: ProgressStep | null
  completedSteps: readonly ProgressStep[]
  steps: readonly { readonly key: ProgressStep; readonly label: string }[]
}

export function ProgressScreen({ currentStep, completedSteps, steps }: ProgressScreenProps) {
  const completedCount = steps.filter(step => completedSteps.includes(step.key)).length
  const progressPercent = Math.round((completedCount / Math.max(steps.length, 1)) * 100)

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-3xl items-center justify-center px-6 py-12">
        <section className="w-full max-w-xl rounded-2xl border border-white/10 bg-white/3 p-6 shadow-[0_20px_80px_rgba(0,0,0,0.45)] backdrop-blur-sm sm:p-8">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-gray-400">AdAlign</p>
              <h1 className="mt-2 text-xl font-medium text-white sm:text-2xl">Processing your request</h1>
              <p className="mt-2 text-sm text-gray-400">Please wait while we analyze and personalize your page.</p>
            </div>
            <div className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-xs text-gray-300">
              {progressPercent}%
            </div>
          </div>

          <div className="mb-8 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-white/80 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="space-y-4">
            {steps.map((step, index) => {
              const isActive = currentStep === step.key
              const isCompleted = completedSteps.includes(step.key)

              return (
                <div key={step.key} className="flex items-start gap-3">
                  <div className="relative mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center">
                    {index < steps.length - 1 && (
                      <span className="absolute top-6 h-6 w-px bg-white/10" aria-hidden="true" />
                    )}
                    {isActive ? (
                      <span className="relative inline-flex h-3 w-3">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/40" />
                        <span className="relative inline-flex h-3 w-3 rounded-full bg-white" />
                      </span>
                    ) : isCompleted ? (
                      <span className="text-xs text-gray-300">✓</span>
                    ) : (
                      <span className="h-2.5 w-2.5 rounded-full border border-white/20" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <p
                      className={`text-base ${
                      isActive
                        ? 'font-semibold text-white'
                        : isCompleted
                            ? 'text-gray-300'
                            : 'text-gray-500'
                    }`}
                    >
                      {step.label}
                    </p>
                    <p className="mt-0.5 text-xs uppercase tracking-wide text-gray-500">
                      {isActive ? 'In progress' : isCompleted ? 'Completed' : 'Pending'}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>

          <p className="mt-8 text-xs text-gray-500">Do not close this tab until processing is complete.</p>
        </section>
      </div>
    </main>
  )
}
