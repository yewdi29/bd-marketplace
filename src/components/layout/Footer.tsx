import Link from 'next/link'
import NewsletterForm from '@/components/NewsletterForm'

export default function Footer() {
  return (
    <footer className="bg-white border-t border-[#E8E9EA] mt-auto">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-10 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">

          {/* Brand + newsletter */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-7 h-7 bg-ink flex items-center justify-center shrink-0" style={{ borderRadius: '7px' }}>
                <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="none">
                  <path d="M8 1.5L2.5 6 8 14.5 13.5 6 8 1.5z" fill="white" />
                </svg>
              </div>
              <span className="font-sans font-bold text-sm tracking-tight text-ink">BLACK DIAMOND</span>
            </div>
            <p className="text-sm font-sans text-ink-3 max-w-xs leading-relaxed mb-6">
              The premier marketplace for heavy oil &amp; gas equipment. Connecting serious buyers with verified sellers nationwide.
            </p>
            <p className="text-xs font-sans font-semibold text-ink mb-2">Stay updated</p>
            <NewsletterForm source="footer" />
          </div>

          {/* Marketplace links */}
          <div>
            <h3 className="text-xs font-sans font-semibold text-ink uppercase tracking-wider mb-4">Marketplace</h3>
            <ul className="space-y-2.5">
              {[
                { label: 'Browse Listings', href: '/listings' },
                { label: 'Business Directory', href: '/sellers' },
                { label: 'List Equipment', href: '/auth/signup' },
                { label: 'Knowledge Base', href: '/knowledge-base' },
              ].map(link => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm font-sans text-ink-3 hover:text-ink transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company links */}
          <div>
            <h3 className="text-xs font-sans font-semibold text-ink uppercase tracking-wider mb-4">Company</h3>
            <ul className="space-y-2.5">
              {[
                { label: 'About', href: '/about' },
                { label: 'Contact', href: '/contact' },
                { label: 'Privacy Policy', href: '/privacy' },
                { label: 'Terms of Service', href: '/terms' },
              ].map(link => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm font-sans text-ink-3 hover:text-ink transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-8 border-t border-[#E8E9EA] flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs font-sans text-ink-3">
            &copy; {new Date().getFullYear()} Black Diamond Marketplace. All rights reserved.
          </p>
          <p className="text-xs font-sans text-ink-3">
            Oil &amp; Gas Heavy Equipment Exchange
          </p>
        </div>
      </div>
    </footer>
  )
}
