import Link from 'next/link'

/** Server-rendered logged-out navbar actions. */
export default function NavbarLoggedOutActions() {
  return (
    <div className="flex items-center gap-4">
      <Link
        href="/how-it-works"
        className="hidden sm:block text-sm font-medium transition-colors hover:text-ink text-[#4A4D52]"
      >
        Sell With Us
      </Link>
      <Link
        href="/auth/login"
        prefetch={false}
        className="px-4 py-1.5 text-sm font-bold text-white bg-orange rounded-pill hover:bg-orange-lt transition-colors"
        style={{ boxShadow: '0 4px 16px rgba(255,107,53,0.30)' }}
      >
        Sign In
      </Link>
    </div>
  )
}
