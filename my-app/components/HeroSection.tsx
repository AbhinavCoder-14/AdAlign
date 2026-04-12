interface HeroSectionProps {
  isVisible: boolean
}

export function HeroSection({ isVisible }: HeroSectionProps) {
  return (
    <section
      className={`flex-1 flex flex-col items-center justify-center px-6 transition-all duration-500 ${
        isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      <div className="max-w-2xl space-y-8 text-center mt-3.5">
        {/* Headline */}
        <div className="space-y-4">
          <h1 className="text-5xl font-black tracking-tight leading-tight text-white">
            Your Ads Are Specific.
            <br />
            Why Is Your Landing Page Generic?
          </h1>

          {/* Subtext */}
          <p className="text-base text-gray-400 leading-7 max-w-xl mx-auto">
            What you say in an ad matters. AdAlign reads the promise in your ad, finds the
            mismatch on your page, and returns a personalized version that converts.
          </p>
        </div>

        {/* Feature badges */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          {['Ad-first analysis', 'Gap detection', 'Safe injection'].map(badge => (
            <div
              key={badge}
              className="rounded-full border border-white/10 px-3 py-1 text-xs text-gray-400"
            >
              ✦ {badge}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
