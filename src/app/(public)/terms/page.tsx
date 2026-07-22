import type { Metadata } from 'next'
import Link from 'next/link'
import {
  ENTERPRISE_TERMS_SECTION_ID,
  ENTERPRISE_TERMS_VERSION,
} from '@/lib/organizations/enterpriseTerms'

export const metadata: Metadata = {
  title: 'Terms of Service — Black Diamond Marketplace',
  description: 'The terms and conditions governing your use of Black Diamond Marketplace.',
}

const LAST_UPDATED = 'July 2026'

export default function TermsPage() {
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
        Terms of Service
      </h1>
      <p className="font-sans text-ink-3 mb-10" style={{ fontSize: '13px' }}>
        Last updated: {LAST_UPDATED}
      </p>

      <div className="font-sans text-ink-2 space-y-8" style={{ fontSize: '15px', lineHeight: 1.8 }}>

        <section>
          <h2 className="font-sans text-ink mb-3" style={{ fontSize: '19px', fontWeight: 700, letterSpacing: '-0.01em' }}>
            1. Acceptance of Terms
          </h2>
          <p>
            By accessing or using Black Diamond Marketplace at blackdiamondmarketplace.com you agree to be bound by these Terms of Service. If you do not agree to these terms you may not use the platform. These terms apply to all visitors, buyers, sellers, and registered users of the platform.
          </p>
        </section>

        <section>
          <h2 className="font-sans text-ink mb-3" style={{ fontSize: '19px', fontWeight: 700, letterSpacing: '-0.01em' }}>
            2. Platform Description
          </h2>
          <p>
            Black Diamond Marketplace is both a listing platform and a sales facilitator that connects buyers and sellers of heavy oil and gas equipment. We provide the technology and infrastructure for sellers to list equipment and for buyers to discover and inquire about that equipment. Black Diamond Marketplace does not take ownership, possession, or title to any equipment listed on the platform at any time.
          </p>
        </section>

        <section>
          <h2 className="font-sans text-ink mb-3" style={{ fontSize: '19px', fontWeight: 700, letterSpacing: '-0.01em' }}>
            3. Account Registration
          </h2>
          <p>
            To list equipment or save listings you must create an account. You agree to provide accurate and complete information during registration and to keep your account information current. You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account. You must be at least 18 years of age and have legal authority to enter into binding agreements to create an account.
          </p>
        </section>

        <section>
          <h2 className="font-sans text-ink mb-3" style={{ fontSize: '19px', fontWeight: 700, letterSpacing: '-0.01em' }}>
            4. Seller Responsibilities
          </h2>
          <p className="mb-4">As a seller on Black Diamond Marketplace you agree to:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Provide accurate, complete, and truthful information in all listings including equipment descriptions, specifications, condition, photos, and pricing</li>
            <li>Have legal authority and clear title to sell any equipment you list</li>
            <li>Respond to buyer inquiries in a timely and professional manner</li>
            <li>Update or remove listings when equipment is no longer available for sale</li>
            <li>Comply with all applicable local, state, federal, and international laws related to the sale of equipment</li>
          </ul>
          <p className="mt-4">
            Misrepresentation of equipment condition, specifications, or ownership is grounds for immediate listing removal and permanent account suspension.
          </p>
        </section>

        <section>
          <h2 className="font-sans text-ink mb-3" style={{ fontSize: '19px', fontWeight: 700, letterSpacing: '-0.01em' }}>
            5. Buyer Responsibilities
          </h2>
          <p className="mb-4">As a buyer on Black Diamond Marketplace you agree to:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Perform your own due diligence and independent inspection of all equipment prior to purchase</li>
            <li>Verify the accuracy of listing information directly with the seller</li>
            <li>Conduct all transactions in good faith and in compliance with applicable laws</li>
          </ul>
          <p className="mt-4">
            Black Diamond Marketplace does not inspect, verify, certify, or guarantee the condition, accuracy, or fitness for purpose of any equipment listed on the platform. All purchases are transactions directly between buyer and seller.
          </p>
        </section>

        <section>
          <h2 className="font-sans text-ink mb-3" style={{ fontSize: '19px', fontWeight: 700, letterSpacing: '-0.01em' }}>
            6. No Guarantees
          </h2>
          <p className="mb-4">Black Diamond Marketplace makes no guarantees of any kind including:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>That any listing will result in a sale</li>
            <li>That listing information provided by sellers is accurate or complete</li>
            <li>That any specific financial outcome will result from using the platform</li>
            <li>That the platform will be available without interruption or error</li>
          </ul>
          <p className="mt-4">
            All equipment is listed and sold as-is between buyer and seller. Black Diamond Marketplace is not a party to any transaction between buyers and sellers.
          </p>
          <p className="mt-4">
            Black Diamond Marketplace may display a membership status indicator (for example,
            &ldquo;Verified Member&rdquo;) on buyer inquiries, reflecting the buyer&rsquo;s current
            paid membership tier at the time of inquiry. This indicator confirms membership status
            only — it is not a verification of the buyer&rsquo;s identity, intent,
            creditworthiness, or legitimacy as a purchaser, and does not constitute a guarantee of
            any kind. Similarly, any automated risk warnings shown alongside an inquiry (for example,
            flagging language patterns commonly associated with fraudulent transactions) are provided
            as an informational aid only. Black Diamond Marketplace does not guarantee the
            detection of fraudulent inquiries, and sellers are solely responsible for exercising
            their own judgment and due diligence before proceeding with any transaction.
          </p>
          <p className="mt-4 text-ink-3 text-xs">
            [Draft — inquiry verification and risk-indicator disclaimers subject to attorney review.]
          </p>
        </section>

        <section>
          <h2 className="font-sans text-ink mb-3" style={{ fontSize: '19px', fontWeight: 700, letterSpacing: '-0.01em' }}>
            7. Listing Standards and Removal
          </h2>
          <p className="mb-4">
            Black Diamond Marketplace is committed to maintaining a high-quality marketplace. We reserve the right to remove any listing that:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Contains inaccurate, misleading, or fraudulent information</li>
            <li>Does not meet our listing quality standards</li>
            <li>Violates these Terms of Service or any applicable law</li>
            <li>Is deemed inappropriate at our sole discretion</li>
          </ul>
          <p className="mt-4">
            We will make reasonable efforts to notify sellers of listing removals. Repeated violations may result in permanent account suspension. Black Diamond Marketplace&rsquo;s decisions regarding listing removal are final.
          </p>
        </section>

        <section>
          <h2 className="font-sans text-ink mb-3" style={{ fontSize: '19px', fontWeight: 700, letterSpacing: '-0.01em' }}>
            8. Commission and Brokerage Services
          </h2>
          <p>
            Black Diamond Marketplace operates primarily on a subscription membership model. In cases where a seller explicitly and voluntarily authorizes Black Diamond Marketplace to assist with a specific transaction, commission-based brokerage services may be offered. All commission terms will be agreed upon in writing prior to the commencement of any brokerage assistance. Black Diamond Marketplace will never charge a commission without explicit written seller authorization.
          </p>
        </section>

        <section>
          <h2 className="font-sans text-ink mb-3" style={{ fontSize: '19px', fontWeight: 700, letterSpacing: '-0.01em' }}>
            9. Subscription Memberships
          </h2>
          <p className="mb-4">Paid membership subscriptions are offered on monthly and annual billing cycles. By subscribing you agree to the following:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Subscriptions automatically renew at the end of each billing period unless cancelled</li>
            <li>You may cancel your subscription at any time through your account settings</li>
            <li>Cancellation takes effect at the end of the current billing period — you retain access through the period you have paid for</li>
            <li>Refunds are not provided for partial subscription periods or unused listing capacity</li>
            <li>If your plan is downgraded or cancelled and your active listing count exceeds your new plan&apos;s limit, we unpublish the excess listings automatically, keeping your most recently created listings active. Unpublished listings remain saved as drafts and may be republished when you have available slots</li>
            <li>Payment methods: Starter accepts card only (monthly and annual). Pro and Max accept card on monthly billing; annual billing accepts card or ACH bank debit</li>
            <li>Black Diamond Marketplace reserves the right to modify subscription pricing with 30 days notice to existing subscribers</li>
          </ul>
        </section>

        <section id={ENTERPRISE_TERMS_SECTION_ID}>
          <h2 className="font-sans text-ink mb-3" style={{ fontSize: '19px', fontWeight: 700, letterSpacing: '-0.01em' }}>
            10. Enterprise Organizations
          </h2>
          <p className="text-xs font-mono text-ink-3 mb-4">Enterprise terms version {ENTERPRISE_TERMS_VERSION}</p>
          <p className="mb-4">
            Enterprise organization accounts are sales-assisted and governed by this Section 10 in
            addition to the Terms of Service above. Organization Owners (and Managers explicitly
            granted billing access) are authorized billing contacts for the organization and must
            agree to these terms before completing Enterprise billing checkout.
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Enterprise monthly billing accepts card only; annual billing accepts card or ACH bank debit</li>
            <li>
              Subscriptions include a base seat allocation with per-seat pricing for additional
              members. Seat additions and removals may generate immediate prorated invoices through
              Stripe
            </li>
            <li>
              Primary ownership transfer requires the incoming Owner&apos;s explicit acceptance via a
              secure link — transfer is not effective until accepted
            </li>
            <li>
              First-time Enterprise annual subscribers may request a full refund within 30 days of
              the initial annual subscription charge by contacting{' '}
              <a href="mailto:support@blackdiamondmkt.com" className="text-orange hover:text-orange-lt transition-colors">
                support@blackdiamondmkt.com
              </a>
              . This window applies only to the first annual payment and does not extend to seat
              additions, plan changes, or renewal charges
            </li>
          </ul>
          <p className="mt-4 text-ink-3 text-xs">
            Additional Enterprise-specific provisions (scope of service, acceptable use, data
            handling, support, termination, and limitation of liability) are subject to legal
            review and will be incorporated into this section as they are finalized.
          </p>
        </section>

        <section>
          <h2 className="font-sans text-ink mb-3" style={{ fontSize: '19px', fontWeight: 700, letterSpacing: '-0.01em' }}>
            11. Intellectual Property
          </h2>
          <p>
            All platform content, design, technology, branding, and functionality including the Black Diamond Marketplace name, logo, and software are the property of Black Diamond Marketplace and are protected by applicable intellectual property laws. Sellers retain ownership of their listing content but grant Black Diamond Marketplace a non-exclusive, royalty-free license to display, reproduce, and distribute that content on the platform and in marketing materials for the purpose of operating the marketplace.
          </p>
        </section>

        <section>
          <h2 className="font-sans text-ink mb-3" style={{ fontSize: '19px', fontWeight: 700, letterSpacing: '-0.01em' }}>
            12. Limitation of Liability
          </h2>
          <p className="mb-4">
            To the maximum extent permitted by applicable law Black Diamond Marketplace shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Transactions between buyers and sellers</li>
            <li>Inaccurate listing information provided by sellers</li>
            <li>Equipment condition disputes between buyers and sellers</li>
            <li>Any outcome resulting from use or inability to use the platform</li>
          </ul>
          <p className="mt-4">
            Our total cumulative liability to any user for any claim arising from use of the platform shall not exceed the total subscription fees paid by that user in the three months immediately preceding the claim.
          </p>
        </section>

        <section>
          <h2 className="font-sans text-ink mb-3" style={{ fontSize: '19px', fontWeight: 700, letterSpacing: '-0.01em' }}>
            13. Indemnification
          </h2>
          <p>
            You agree to indemnify and hold harmless Black Diamond Marketplace and its officers, employees, and agents from any claims, damages, losses, or expenses including reasonable legal fees arising from your use of the platform, your listings, your transactions, or your violation of these terms.
          </p>
        </section>

        <section>
          <h2 className="font-sans text-ink mb-3" style={{ fontSize: '19px', fontWeight: 700, letterSpacing: '-0.01em' }}>
            14. Governing Law and Dispute Resolution
          </h2>
          <p>
            These Terms of Service are governed by the laws of the State of Texas without regard to conflict of law principles. Any dispute arising from these terms or use of the platform shall be resolved exclusively in the state or federal courts located in Ector County, Texas. You consent to the personal jurisdiction of such courts.
          </p>
        </section>

        <section>
          <h2 className="font-sans text-ink mb-3" style={{ fontSize: '19px', fontWeight: 700, letterSpacing: '-0.01em' }}>
            15. Changes to Terms
          </h2>
          <p>
            Black Diamond Marketplace reserves the right to modify these Terms of Service at any time. We will notify registered users of material changes via email at least 14 days before they take effect. Continued use of the platform after updated terms take effect constitutes acceptance of the revised terms.
          </p>
        </section>

        <section>
          <h2 className="font-sans text-ink mb-3" style={{ fontSize: '19px', fontWeight: 700, letterSpacing: '-0.01em' }}>
            16. Contact
          </h2>
          <p>For questions about these Terms of Service contact us at:</p>
          <div
            className="mt-4 bg-bg border border-[#E8E9EA] rounded-[10px] px-5 py-4 font-sans text-ink-2"
            style={{ fontSize: '14px', lineHeight: 1.7 }}
          >
            <a href="mailto:legal@blackdiamondmarketplace.com" className="text-orange hover:text-orange-lt transition-colors">
              legal@blackdiamondmarketplace.com
            </a>
            <br />
            Black Diamond Marketplace — Odessa, Texas
          </div>
        </section>

      </div>

      {/* Footer nav */}
      <div className="mt-12 pt-8 border-t border-[#E8E9EA] flex items-center gap-6">
        <Link href="/privacy" className="text-sm font-sans text-ink-3 hover:text-ink transition-colors">
          Privacy Policy
        </Link>
        <Link href="/contact" className="text-sm font-sans text-ink-3 hover:text-ink transition-colors">
          Contact Us
        </Link>
      </div>
    </div>
  )
}
