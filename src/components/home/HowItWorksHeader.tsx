/** Static How It Works heading — server-rendered, no client JS. */
export default function HowItWorksHeader() {
  return (
    <div className="page-shell text-center mb-12 lg:mb-14">
      <p className="font-mono text-[11px] font-bold text-orange uppercase tracking-[0.12em] mb-3">
        HOW IT WORKS
      </p>
      <h2
        className="font-sans font-bold text-ink"
        style={{ fontSize: 'clamp(28px, 4vw, 40px)', letterSpacing: '-0.03em', lineHeight: 1.1 }}
      >
        List. Review. Match.
      </h2>
      <p className="mt-4 font-sans text-ink-3 text-base max-w-2xl mx-auto leading-relaxed">
        List your equipment, we review it, and real buyers can find it.
      </p>
    </div>
  )
}
