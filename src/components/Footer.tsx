import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="border-t border-surface-border bg-surface mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <span className="font-display text-2xl tracking-widest text-gold">BLACK DIAMOND</span>
            <p className="mt-3 text-sm font-body text-gray-500 max-w-xs leading-relaxed">
              The premier marketplace for heavy oil &amp; gas equipment. Connecting serious buyers with verified sellers nationwide.
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="font-display text-sm tracking-widest text-gray-400 mb-4">MARKETPLACE</h3>
            <ul className="space-y-2">
              {[
                { label: 'Browse Listings', href: '/listings' },
                { label: 'Post Equipment', href: '/listings/new' },
                { label: 'Knowledge Base', href: '/knowledge-base' },
              ].map(link => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm font-body text-gray-500 hover:text-gold transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-display text-sm tracking-widest text-gray-400 mb-4">COMPANY</h3>
            <ul className="space-y-2">
              {[
                { label: 'About', href: '/about' },
                { label: 'Contact', href: '/contact' },
                { label: 'Privacy Policy', href: '/privacy' },
                { label: 'Terms of Service', href: '/terms' },
              ].map(link => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm font-body text-gray-500 hover:text-gold transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-8 border-t border-surface-border flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs font-body text-gray-600">
            &copy; {new Date().getFullYear()} Black Diamond Marketplace. All rights reserved.
          </p>
          <p className="text-xs font-body text-gray-700">
            Oil &amp; Gas Heavy Equipment Exchange
          </p>
        </div>
      </div>
    </footer>
  )
}
