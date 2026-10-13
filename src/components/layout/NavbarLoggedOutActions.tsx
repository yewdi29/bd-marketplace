import Link from 'next/link'

/** Server-rendered logged-out navbar actions. */
export default function NavbarLoggedOutActions() {
  return (
    <div className="flex items-center gap-4">
      <Link
        href="/auth/login"
        prefetch={false}
        className="btn-press text-sm font-medium transition-colors hover:text-ink text-ink-2"
      >
        Sign In
      </Link>
      <Link
        href="/auth/signup"
        className="btn-press hidden sm:inline-flex items-center px-4 py-1.5 text-sm font-bold text-white bg-orange rounded-pill hover:bg-orange-lt transition-colors"
        style={{ boxShadow: '0 4px 16px rgba(255,107,53,0.30)' }}
      >
        Sell With Us
      </Link>
    </div>
  )
}
