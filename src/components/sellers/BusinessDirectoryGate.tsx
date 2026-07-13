import Link from 'next/link'

interface BusinessDirectoryGateProps {
  signedIn: boolean
}

const PLACEHOLDER_CARDS = Array.from({ length: 6 }, (_, i) => i)

export default function BusinessDirectoryGate({ signedIn }: BusinessDirectoryGateProps) {
  return (
    <div className="bg-bg min-h-screen pb-20">
      <div className="page-shell py-8">
        <div className="mb-8">
          <p
            className="font-mono uppercase text-ink-3 mb-2"
            style={{ fontSize: '11px', letterSpacing: '0.08em' }}
          >
            Black Diamond Marketplace
          </p>
          <h1
            className="font-sans font-bold text-ink mb-2"
            style={{ fontSize: '28px', letterSpacing: '-0.02em' }}
          >
            Business Directory
          </h1>
        </div>

        <div className="relative">
          {/* Decorative blurred preview — placeholder cards only, no real seller data */}
          <div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pointer-events-none select-none"
            style={{ filter: 'blur(6px)', opacity: 0.45 }}
            aria-hidden
          >
            {PLACEHOLDER_CARDS.map(i => (
              <div
                key={i}
                className="bg-white border border-[#E8E9EA] rounded-[16px] p-5"
                style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}
              >
                <div className="flex items-center gap-4 mb-4">
                  <div
                    className="shrink-0 rounded-[12px] bg-[#F0F1F2]"
                    style={{ width: 64, height: 64 }}
                  />
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 rounded bg-[#F0F1F2] w-3/4" />
                    <div className="h-3 rounded bg-[#F0F1F2] w-1/2" />
                  </div>
                </div>
                <div className="pt-3 border-t border-[#F0F1F2]">
                  <div className="h-3 rounded bg-[#F0F1F2] w-1/3" />
                </div>
              </div>
            ))}
          </div>

          <div
            className="absolute inset-0 flex items-center justify-center px-4"
            style={{ paddingTop: '24px', paddingBottom: '24px' }}
          >
            <div
              className="w-full max-w-[480px] bg-white border border-[#E8E9EA] rounded-[20px] text-center"
              style={{ boxShadow: '0 8px 28px rgba(0,0,0,0.10)', padding: '40px 32px' }}
            >
              <div
                className="w-11 h-11 flex items-center justify-center rounded-[10px] mx-auto mb-5"
                style={{ background: '#FFF2ED' }}
              >
                <svg
                  className="w-5 h-5 text-orange"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>

              <h2
                className="font-sans font-bold text-ink mb-3"
                style={{ fontSize: '22px', letterSpacing: '-0.02em', lineHeight: 1.2 }}
              >
                The business directory is available to Black Diamond members
              </h2>
              <p
                className="font-sans text-ink-2 mb-8"
                style={{ fontSize: '15px', lineHeight: 1.7 }}
              >
                Browse verified equipment sellers — dealers, rental companies, and rig operators —
                with BD Verified badges, active listing counts, and direct company profiles.
              </p>

              <div className="flex flex-col items-stretch gap-3 w-full max-w-[280px] mx-auto">
                <Link
                  href="/dashboard/upgrade"
                  className="inline-flex items-center justify-center px-8 py-3 text-sm font-bold text-white bg-orange rounded-pill hover:bg-orange-lt transition-colors shadow-orange-glow w-full"
                >
                  View membership plans
                </Link>
                {!signedIn && (
                  <Link
                    href="/auth/signup"
                    className="inline-flex items-center justify-center px-8 py-3 text-sm font-bold text-ink-2 border border-[#D4D5D7] rounded-pill hover:border-orange hover:text-orange transition-colors w-full"
                  >
                    Create an account
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
