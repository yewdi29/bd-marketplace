import Link from 'next/link'
import type { Metadata } from 'next'
import { Cpu, ShieldCheck, Wrench, Clock } from 'lucide-react'

export const metadata: Metadata = {
  title: 'About',
  description: 'Black Diamond Marketplace was built for the people who keep the oil and gas industry running — not for the platforms that stay behind.',
}

const DIFFERENTIATORS = [
  {
    icon: Cpu,
    title: 'AI-Powered Listings',
    body: 'Every listing on Black Diamond is processed through our AI engine — extracting specs, flagging inconsistencies, and generating descriptions that give buyers the information they actually need.',
  },
  {
    icon: ShieldCheck,
    title: 'Verified Sellers',
    body: 'Every seller on our platform goes through a verification process. You know who you’re dealing with before you ever pick up the phone.',
  },
  {
    icon: Wrench,
    title: 'Built for Heavy Equipment',
    body: 'We didn’t adapt a generic marketplace and force it to fit. Black Diamond was built from the ground up for the heavy equipment and industrial sector — with the categories, terminology, and workflows that operators and procurement managers actually use.',
  },
  {
    icon: Clock,
    title: 'Always On the Market',
    body: 'The equipment market doesn’t wait. Black Diamond runs 24/7 so buyers can search and sellers can list at any hour, from any location. New inventory surfaces in real time so you never miss the right piece of equipment at the right price.',
  },
]

export default function AboutPage() {
  return (
    <div className="bg-bg">

      {/* ── 1. Hero ── */}
      <section style={{ background: '#1A1D20' }}>
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10 text-center" style={{ paddingTop: '120px', paddingBottom: '120px' }}>
          <h1
            className="font-sans font-extrabold text-white mb-5 mx-auto max-w-[820px]"
            style={{ fontSize: '36px', lineHeight: '1.15', letterSpacing: '-0.03em' }}
          >
            Heavy Equipment Moves the World. Finding It Shouldn&apos;t Slow You{' '}
            <span className="relative inline-block">
              Down
              <span
                className="absolute left-0 right-0"
                style={{ bottom: '-6px', height: '4px', background: '#FF6B35', borderRadius: '2px' }}
              />
            </span>
            ?
          </h1>
          <p
            className="font-sans mx-auto max-w-[640px]"
            style={{ fontSize: '16px', lineHeight: '1.7', color: '#9CA3AF' }}
          >
            Black Diamond Marketplace was built for the people who keep the oil and gas industry
            running — not for the platforms that stay behind.
          </p>
        </div>
      </section>

      {/* ── 2. The Story ── */}
      <section className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10 py-16 md:py-20" style={{ background: '#F7F8F9' }}>
        <div className="mx-auto" style={{ maxWidth: '720px' }}>
          <p
            className="font-sans text-ink-2 text-left"
            style={{ fontSize: '15px', lineHeight: '1.8' }}
          >
            Black Diamond didn&apos;t start in a boardroom. It started in the field. Growing up
            around Black Diamond Drilling in the Permian Basin, we saw firsthand how hard it was
            for serious operators to find, evaluate, and acquire heavy equipment without wading
            through outdated listings, unreliable sellers, and platforms that stay behind.
          </p>

          <p
            className="font-sans font-bold text-center"
            style={{ fontSize: '28px', color: '#FF6B35', margin: '40px 0', lineHeight: '1.4' }}
          >
            The tools existed. The innovation didn&apos;t.
          </p>

          <p
            className="font-sans text-ink-2 text-left"
            style={{ fontSize: '15px', lineHeight: '1.8' }}
          >
            So we built it ourselves. Black Diamond
            Marketplace is the result of years of industry experience combined with a new
            generation of AI-driven technology — designed specifically for the people who move
            iron for a living.
          </p>
        </div>
      </section>

      {/* ── 3. Photo Section ── */}
      <section className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10 bg-white" style={{ paddingTop: '80px', paddingBottom: '80px' }}>
        <p
          className="font-mono text-center mb-6"
          style={{ fontSize: '11px', letterSpacing: '0.08em', color: '#9CA3AF', textTransform: 'uppercase' }}
        >
          Our Story in Pictures
        </p>

        {/* PHOTO PLACEHOLDER — replace with <Image> when assets are ready */}
        <div
          className="w-full flex items-center justify-center mb-4"
          style={{
            aspectRatio: '1200 / 400',
            background: '#F7F8F9',
            border: '1.5px dashed #D4D5D7',
            borderRadius: '16px',
          }}
        >
          <span className="font-sans text-sm text-ink-3">Photo coming soon</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* PHOTO PLACEHOLDER — replace with <Image> when assets are ready */}
          <div
            className="w-full flex items-center justify-center"
            style={{
              aspectRatio: '580 / 360',
              background: '#F7F8F9',
              border: '1.5px dashed #D4D5D7',
              borderRadius: '16px',
            }}
          >
            <span className="font-sans text-sm text-ink-3">Photo coming soon</span>
          </div>

          {/* PHOTO PLACEHOLDER — replace with <Image> when assets are ready */}
          <div
            className="w-full flex items-center justify-center"
            style={{
              aspectRatio: '580 / 360',
              background: '#F7F8F9',
              border: '1.5px dashed #D4D5D7',
              borderRadius: '16px',
            }}
          >
            <span className="font-sans text-sm text-ink-3">Photo coming soon</span>
          </div>
        </div>
      </section>

      {/* ── 4. Mission ── */}
      <section style={{ background: '#1A1D20' }}>
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10 py-16 md:py-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-start">
            <div>
              <div style={{ width: '40px', height: '2px', background: '#FF6B35', marginBottom: '20px' }} />
              <h2
                className="font-sans font-bold text-white"
                style={{ fontSize: '28px', lineHeight: '1.2', letterSpacing: '-0.02em' }}
              >
                Built for the Industry. Built for the World.
              </h2>
            </div>
            <p
              className="font-sans"
              style={{ fontSize: '15px', lineHeight: '1.8', color: '#D1D5DB' }}
            >
              Our mission is simple — remove the friction between serious buyers and serious
              sellers. Whether you&apos;re sourcing equipment locally in West Texas or acquiring
              assets from across the globe, Black Diamond Marketplace connects you to verified
              listings, transparent pricing, and real opportunities — all in one place. Local
              roots. Global reach.
            </p>
          </div>
        </div>
      </section>

      {/* ── 5. Why We're Different ── */}
      <section className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10 py-16 md:py-20 bg-white">
        <h2
          className="font-sans font-bold text-ink text-center mb-10"
          style={{ fontSize: '28px', letterSpacing: '-0.02em' }}
        >
          Why We&apos;re Different
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {DIFFERENTIATORS.map(item => {
            const Icon = item.icon
            return (
              <div
                key={item.title}
                className="bg-white rounded-[16px]"
                style={{
                  border: '1px solid #E5E7EB',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
                  padding: '32px',
                }}
              >
                <Icon size={28} color="#FF6B35" className="mb-4" />
                <h3 className="font-sans font-bold text-ink mb-2" style={{ fontSize: '17px' }}>
                  {item.title}
                </h3>
                <p className="font-sans text-sm" style={{ lineHeight: '1.7', color: '#6B7280' }}>
                  {item.body}
                </p>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── 6. CTA Section ── */}
      <section style={{ background: '#1A1D20' }}>
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10 py-16 md:py-20 text-center">
          <div className="mx-auto mb-5" style={{ width: '40px', height: '2px', background: '#FF6B35' }} />
          <h2
            className="font-sans font-bold text-white mb-8"
            style={{ fontSize: '28px', letterSpacing: '-0.02em' }}
          >
            Thank You for Your Trust and Your Business.
          </h2>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link
              href="/auth/signup"
              className="px-6 py-2.5 text-sm font-bold text-white bg-orange rounded-pill hover:bg-orange-lt transition-colors shadow-orange-glow"
            >
              List Equipment
            </Link>
            <Link
              href="/search"
              className="px-6 py-2.5 text-sm font-bold text-white bg-transparent border border-white rounded-pill hover:bg-white hover:text-ink transition-colors"
            >
              Browse Equipment
            </Link>
          </div>
        </div>
      </section>

    </div>
  )
}
