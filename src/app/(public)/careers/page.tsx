import type { Metadata } from 'next'
import { canonicalUrl } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Careers',
  description:
    'Black Diamond Marketplace is modernizing how oil and gas, construction, and mining companies buy, sell, and finance heavy equipment. Learn about future roles and how to get on our radar.',
  alternates: { canonical: canonicalUrl('/careers') },
}

const CAREERS_MAILTO = `mailto:careers@blackdiamondmkt.com?subject=${encodeURIComponent(
  'Interested in future roles at Black Diamond',
)}`

const WORK_CULTURE = [
  {
    title: 'Real industry, real problems',
    body: 'Not another generic SaaS product. We\u2019re building for the Permian Basin equipment trade \u2014 oil and gas, construction, and mining \u2014 where the stakes and the margins are real.',
  },
  {
    title: 'Small team, real ownership',
    body: 'Every hire touches core product. No layers of process between an idea and it shipping.',
  },
  {
    title: 'Systems over hustle',
    body: 'Our AI agent layer handles the repetitive work so people can focus on judgment calls, not busywork.',
  },
]

export default function CareersPage() {
  return (
    <div className="bg-bg">
      {/* ── Hero ── */}
      <section
        className="text-center"
        style={{ background: '#1A1D20', padding: '64px 32px' }}
      >
        <p className="font-mono text-[11px] font-bold text-orange uppercase tracking-[0.12em] mb-4">
          CAREERS
        </p>
        <h1
          className="font-sans text-white mx-auto"
          style={{
            fontSize: '44px',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            lineHeight: 1.05,
            maxWidth: '820px',
          }}
        >
          Build the infrastructure heavy equipment runs on
        </h1>
        <p
          className="font-sans text-white mx-auto mt-5"
          style={{ opacity: 0.7, maxWidth: '720px', fontSize: '17px', lineHeight: 1.7 }}
        >
          Black Diamond is a small team modernizing how oil and gas, construction, and mining
          companies buy, sell, and finance heavy equipment. We&rsquo;re not actively hiring right
          now, but we&rsquo;re always keeping an eye out for people who understand this industry
          and want to help build the systems behind it.
        </p>
      </section>

      {/* ── Open positions ── */}
      {/* Future: replace or extend this block with a dynamic job listings section when hiring opens. */}
      <section className="mx-auto page-shell py-16 md:py-20" style={{ maxWidth: '720px' }}>
        <h2
          className="font-sans text-ink mb-4"
          style={{ fontSize: '32px', fontWeight: 700, letterSpacing: '-0.02em' }}
        >
          Open positions
        </h2>
        <p
          className="font-sans text-ink-2 mb-8"
          style={{ fontSize: '16px', lineHeight: 1.7 }}
        >
          There are no open roles at Black Diamond right now. We&rsquo;re a lean, deliberately
          small team in an early build phase &mdash; when that changes, we&rsquo;ll list roles
          here first.
        </p>
        <a
          href={CAREERS_MAILTO}
          className="inline-flex items-center justify-center px-8 py-3 text-sm font-bold text-white bg-orange rounded-pill hover:bg-orange-lt transition-colors shadow-orange-glow"
        >
          Get on our radar
        </a>
      </section>

      {/* ── What working here would mean ── */}
      <section style={{ background: '#F7F8F9', padding: '64px 32px' }}>
        <div className="mx-auto" style={{ maxWidth: '1100px' }}>
          <h2
            className="font-sans text-ink text-center mb-10"
            style={{ fontSize: '32px', fontWeight: 700, letterSpacing: '-0.02em' }}
          >
            What working here would mean
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {WORK_CULTURE.map(item => (
              <div
                key={item.title}
                className="bg-white border border-[#E8E9EA] shadow-card"
                style={{ borderRadius: '16px', padding: '24px' }}
              >
                <h3
                  className="font-sans text-ink mb-2"
                  style={{ fontSize: '17px', fontWeight: 700 }}
                >
                  {item.title}
                </h3>
                <p className="font-sans text-ink-2" style={{ fontSize: '14px', lineHeight: 1.7 }}>
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
