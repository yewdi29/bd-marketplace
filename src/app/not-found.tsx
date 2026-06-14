import Link from 'next/link'

export default function NotFound() {
  return (
    <div
      className="flex flex-col items-center justify-center"
      style={{ minHeight: '100vh', background: '#F7F8F9', padding: '32px' }}
    >
      {/* Logo mark */}
      <div
        className="flex items-center justify-center mb-6"
        style={{
          width: 64,
          height: 64,
          borderRadius: '16px',
          background: '#1A1D20',
        }}
      >
        <svg viewBox="0 0 32 32" width="32" height="32" fill="none">
          <path d="M16 3L4.5 12 16 29.5 27.5 12 16 3z" fill="white" />
        </svg>
      </div>

      {/* Stack: faded 404 behind headline */}
      <div className="relative flex items-center justify-center mb-8" style={{ minHeight: '160px' }}>
        {/* Faded 404 background text */}
        <span
          className="select-none pointer-events-none absolute inset-0 flex items-center justify-center font-mono"
          style={{
            fontSize: 'clamp(80px, 18vw, 140px)',
            fontWeight: 500,
            color: '#E8E9EA',
            lineHeight: 1,
            userSelect: 'none',
          }}
          aria-hidden="true"
        >
          404
        </span>

        {/* Overlay content */}
        <div className="relative z-10 text-center px-4">
          <h1
            className="font-sans text-ink"
            style={{ fontSize: '28px', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.2 }}
          >
            This rig has moved.
            <span className="inline-block ml-0.5" style={{ animation: 'blink 1.1s step-end infinite' }}>
              _
            </span>
          </h1>
          <p
            className="font-sans text-ink-3 mx-auto mt-3"
            style={{ fontSize: '14px', lineHeight: 1.7, maxWidth: '400px' }}
          >
            The page you&rsquo;re looking for doesn&rsquo;t exist or has been relocated.
            Let&rsquo;s get you back on location.
          </p>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex items-center gap-3 flex-wrap justify-center mb-6">
        <Link
          href="/listings"
          className="font-sans font-bold text-sm text-white bg-orange rounded-pill px-8 py-3 shadow-orange-glow hover:bg-orange-lt transition-all duration-200"
        >
          Browse Equipment
        </Link>
        <Link
          href="/"
          className="font-sans font-bold text-sm text-ink bg-white rounded-pill px-8 py-3 border border-[#D4D5D7] hover:border-orange hover:text-orange transition-all duration-200"
        >
          Go Home
        </Link>
      </div>

      {/* Small note */}
      <Link
        href="/listings"
        className="font-sans text-ink-3 hover:text-ink text-sm transition-colors"
        style={{ fontSize: '13px' }}
      >
        Lost? Try searching for what you need.
      </Link>

      {/* Blink keyframe */}
      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  )
}
