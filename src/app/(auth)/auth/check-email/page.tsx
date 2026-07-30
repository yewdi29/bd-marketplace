import Link from 'next/link'
import BrandLogo from '@/components/ui/BrandLogo'

export default function CheckEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-bg">
      <div className="w-full max-w-md text-center">

        {/* Logo */}
        <Link href="/" className="inline-flex mb-8">
          <BrandLogo priority />
        </Link>

        {/* Card */}
        <div className="bg-white rounded-[20px] p-10" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>

          {/* Email icon */}
          <div className="w-14 h-14 bg-orange/10 rounded-full flex items-center justify-center mx-auto mb-5">
            <svg className="w-7 h-7 text-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
          </div>

          <h1 className="font-sans font-extrabold text-[26px] text-ink mb-3" style={{ letterSpacing: '-0.02em' }}>
            Check your inbox
          </h1>
          <p className="text-[15px] font-sans text-ink-2 leading-relaxed mb-2">
            We sent you a confirmation email. Click the link inside to activate your account.
          </p>
          <p className="text-sm font-sans text-ink-3 mb-8">
            Didn&apos;t receive it? Check your spam folder.
          </p>

          <Link
            href="/auth/login"
            className="block w-full py-3 text-sm font-bold text-white bg-orange rounded-pill hover:bg-orange-lt transition-colors"
            style={{ boxShadow: '0 4px 16px rgba(255,107,53,0.30)' }}
          >
            Go to Sign In
          </Link>
        </div>

        <p className="mt-6 text-sm font-sans text-ink-3">
          Wrong email?{' '}
          <Link href="/auth/signup" className="font-semibold text-orange hover:text-orange-lt transition-colors">
            Sign up again
          </Link>
        </p>
      </div>
    </div>
  )
}
