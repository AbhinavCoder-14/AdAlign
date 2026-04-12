type ProgressStep = 'analyzing_ad' | 'scraping' | 'analyzing_gaps' | 'rewriting'

interface ProgressScreenProps {
  currentStep: ProgressStep | null
  completedSteps: readonly ProgressStep[]
  steps: readonly { readonly key: ProgressStep; readonly label: string }[]
}

export function ProgressScreen({ currentStep, completedSteps, steps }: ProgressScreenProps) {
  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="flex min-h-screen flex-col items-center justify-center px-6">
        <div className="space-y-12 text-center">
          {/* Header */}
          <div className="space-y-2">
            <p className="text-sm text-gray-400">⚡ AdAlign</p>
          </div>

          {/* Progress Steps */}
          <div className="space-y-8">
            {steps.map((step) => {
              const isCompleted = completedSteps.includes(step.key)
              const isActive = currentStep === step.key

              return (
                <div key={step.key} className="flex items-center justify-center gap-3">
                  <div className="flex w-16 justify-end">
                    {isCompleted ? (
                      <span className="text-base text-gray-500">✓</span>
                    ) : isActive ? (
                      <span className="inline-block h-2 w-2 rounded-full bg-white animate-pulse" />
                    ) : (
                      <span className="text-base text-gray-700">○</span>
                    )}
                  </div>
                  <span
                    className={`text-lg ${
                      isActive
                        ? 'font-semibold text-white'
                        : isCompleted
                          ? 'text-gray-500'
                          : 'text-gray-700'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </main>
  )
}
