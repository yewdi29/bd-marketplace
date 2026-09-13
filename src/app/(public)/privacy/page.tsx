import type { Metadata } from 'next'
import Link from 'next/link'
import { canonicalUrl } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How Black Diamond Marketplace collects, uses, and protects your information.',
  alternates: { canonical: canonicalUrl('/privacy') },
}

const LAST_UPDATED = 'June 2026'

export default function PrivacyPage() {
  return (
    <div className="mx-auto" style={{ maxWidth: '760px', padding: '64px 32px' }}>
      {/* Header */}
      <p className="font-mono text-[11px] font-bold text-orange uppercase tracking-[0.12em] mb-3">
        Legal
      </p>
      <h1
        className="font-sans text-ink mb-3"
        style={{ fontSize: '36px', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.1 }}
      >
        Privacy Policy
      </h1>
      <p className="font-sans text-ink-3 mb-10" style={{ fontSize: '13px' }}>
        Last updated: {LAST_UPDATED}
      </p>

      <div className="font-sans text-ink-2 space-y-8" style={{ fontSize: '15px', lineHeight: 1.8 }}>

        <section>
          <h2 className="font-sans text-ink mb-3" style={{ fontSize: '19px', fontWeight: 700, letterSpacing: '-0.01em' }}>
            1. Introduction
          </h2>
          <p>
            Black Diamond Marketplace is committed to protecting your privacy. This policy explains how we collect, use, and protect your information when you use our platform at blackdiamondmarketplace.com.
          </p>
        </section>

        <section>
          <h2 className="font-sans text-ink mb-3" style={{ fontSize: '19px', fontWeight: 700, letterSpacing: '-0.01em' }}>
            2. Information We Collect
          </h2>
          <p className="mb-4">We collect the following information when you use Black Diamond Marketplace:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Account information:</strong> full name, email address, company name, phone number, city, state, and country when you create an account</li>
            <li><strong>Listing information:</strong> equipment details, photos, pricing, and specifications that sellers submit when creating listings</li>
            <li><strong>Lead information:</strong> contact details submitted by buyers through listing inquiry forms including name, email, phone, and company</li>
            <li><strong>Usage data:</strong> pages visited, search queries, filter selections, and interactions with the platform collected via Google Analytics</li>
            <li><strong>Payment information:</strong> billing and subscription details processed securely by Stripe. Black Diamond Marketplace does not store, access, or retain any credit card numbers or payment credentials</li>
          </ul>
        </section>

        <section>
          <h2 className="font-sans text-ink mb-3" style={{ fontSize: '19px', fontWeight: 700, letterSpacing: '-0.01em' }}>
            3. How We Use Your Information
          </h2>
          <p className="mb-4">We use the information we collect to:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Operate and maintain the Black Diamond Marketplace platform</li>
            <li>Connect buyers and sellers through listing inquiry forms</li>
            <li>Send transactional emails via Resend including account confirmation, email verification, and inquiry notifications</li>
            <li>Process subscription payments and manage billing via Stripe</li>
            <li>Analyze platform usage through Google Analytics to improve search, discovery, and overall user experience</li>
            <li>Enforce our Terms of Service and listing quality standards</li>
          </ul>
        </section>

        <section>
          <h2 className="font-sans text-ink mb-3" style={{ fontSize: '19px', fontWeight: 700, letterSpacing: '-0.01em' }}>
            4. Third Party Services
          </h2>
          <p className="mb-4">Black Diamond Marketplace uses the following third party services which have their own privacy policies:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Stripe:</strong> payment processing and subscription management. Visit stripe.com/privacy for their policy.</li>
            <li><strong>Resend:</strong> transactional email delivery for account and inquiry notifications</li>
            <li><strong>Google Analytics:</strong> usage analytics and platform performance measurement. Visit policies.google.com/privacy for their policy.</li>
            <li><strong>Supabase:</strong> secure database infrastructure and file storage for listing photos and company logos</li>
          </ul>
        </section>

        <section>
          <h2 className="font-sans text-ink mb-3" style={{ fontSize: '19px', fontWeight: 700, letterSpacing: '-0.01em' }}>
            5. International Users and GDPR
          </h2>
          <p className="mb-4">
            Black Diamond Marketplace serves users globally. If you are located in the European Economic Area (EEA) or United Kingdom, your data is processed in accordance with the General Data Protection Regulation (GDPR). You have the following rights regarding your personal data:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>The right to access the personal data we hold about you</li>
            <li>The right to correct inaccurate personal data</li>
            <li>The right to request deletion of your personal data</li>
            <li>The right to restrict or object to processing of your personal data</li>
            <li>The right to data portability</li>
          </ul>
          <p className="mt-4">
            To exercise any of these rights contact us at{' '}
            <a href="mailto:contact@blackdiamondmkt.com" className="text-orange hover:text-orange-lt transition-colors">
              contact@blackdiamondmkt.com
            </a>
          </p>
        </section>

        <section>
          <h2 className="font-sans text-ink mb-3" style={{ fontSize: '19px', fontWeight: 700, letterSpacing: '-0.01em' }}>
            6. Data Retention
          </h2>
          <p>
            We retain account data for as long as your account remains active. Listing data is retained for the duration of your membership plus 12 months. Lead inquiry data is retained for 24 months. You may request deletion of your personal data at any time by contacting{' '}
            <a href="mailto:contact@blackdiamondmkt.com" className="text-orange hover:text-orange-lt transition-colors">
              contact@blackdiamondmkt.com
            </a>. We will respond to deletion requests within 30 days.
          </p>
        </section>

        <section>
          <h2 className="font-sans text-ink mb-3" style={{ fontSize: '19px', fontWeight: 700, letterSpacing: '-0.01em' }}>
            7. Cookies
          </h2>
          <p className="mb-4">Black Diamond Marketplace uses the following cookies:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Essential cookies:</strong> required for authentication, session management, and core platform functionality. Cannot be disabled.</li>
            <li><strong>Analytics cookies:</strong> used by Google Analytics to measure platform usage and improve the user experience. You may disable these by adjusting your browser settings or using Google&rsquo;s opt-out tools.</li>
          </ul>
          <p className="mt-4">Continued use of the platform constitutes acceptance of our use of essential cookies.</p>
        </section>

        <section>
          <h2 className="font-sans text-ink mb-3" style={{ fontSize: '19px', fontWeight: 700, letterSpacing: '-0.01em' }}>
            8. Data Security
          </h2>
          <p>
            We implement industry-standard security measures to protect your personal data including encrypted data transmission via HTTPS, secure database access controls, and row-level security policies on all user data. However no system is completely secure and we cannot guarantee absolute security of your information.
          </p>
        </section>

        <section>
          <h2 className="font-sans text-ink mb-3" style={{ fontSize: '19px', fontWeight: 700, letterSpacing: '-0.01em' }}>
            9. Children&rsquo;s Privacy
          </h2>
          <p>
            Black Diamond Marketplace is intended for business professionals in the oil and gas industry. We do not knowingly collect personal information from anyone under the age of 18. If you believe a minor has provided us with personal information please contact us immediately.
          </p>
        </section>

        <section>
          <h2 className="font-sans text-ink mb-3" style={{ fontSize: '19px', fontWeight: 700, letterSpacing: '-0.01em' }}>
            10. Changes to This Policy
          </h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify registered users of significant changes via email. Continued use of the platform after changes are posted constitutes acceptance of the updated policy.
          </p>
        </section>

        <section>
          <h2 className="font-sans text-ink mb-3" style={{ fontSize: '19px', fontWeight: 700, letterSpacing: '-0.01em' }}>
            11. Contact
          </h2>
          <p>For privacy questions, data requests, or concerns contact us at:</p>
          <div
            className="mt-4 bg-bg border border-[#E8E9EA] rounded-[10px] px-5 py-4 font-sans text-ink-2"
            style={{ fontSize: '14px', lineHeight: 1.7 }}
          >
            <a href="mailto:contact@blackdiamondmkt.com" className="text-orange hover:text-orange-lt transition-colors">
              contact@blackdiamondmkt.com
            </a>
            <br />
            Black Diamond Marketplace — Odessa, Texas
          </div>
        </section>

      </div>

      {/* Footer nav */}
      <div className="mt-12 pt-8 border-t border-[#E8E9EA] flex items-center gap-6">
        <Link href="/terms" className="text-sm font-sans text-ink-3 hover:text-ink transition-colors">
          Terms of Service
        </Link>
        <Link href="/contact" className="text-sm font-sans text-ink-3 hover:text-ink transition-colors">
          Contact Us
        </Link>
      </div>
    </div>
  )
}
