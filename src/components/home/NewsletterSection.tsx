import NewsletterFormLazy from '@/components/home/NewsletterFormLazy'

/** Server-rendered newsletter block — form submit is a deferred client island. */
export default function NewsletterSection() {
  return (
    <section className="py-10 w-full">
      <div className="w-full bg-white border border-[#E8E9EA] rounded-[20px] px-8 py-12 shadow-card">
        <div className="flex flex-col md:flex-row md:items-center gap-8 md:gap-10 lg:gap-12">
          <div className="md:w-1/2 min-w-0">
            <p className="font-mono text-[11px] font-bold text-orange uppercase tracking-[0.12em] mb-3">
              STAY INFORMED
            </p>
            <h2
              className="font-sans font-bold text-ink"
              style={{ fontSize: 'clamp(28px, 4vw, 40px)', letterSpacing: '-0.03em', lineHeight: 1.1 }}
            >
              Stay Ahead of the Market.
            </h2>
            <p className="mt-4 font-sans text-ink-3 text-base leading-relaxed">
              Get new listings, market insights, and equipment trends delivered to your inbox.
            </p>
          </div>

          <div className="md:w-1/2 min-w-0 flex items-center">
            <NewsletterFormLazy source="homepage" />
          </div>
        </div>
      </div>
    </section>
  )
}
