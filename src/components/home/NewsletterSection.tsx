import NewsletterFormLazy from '@/components/home/NewsletterFormLazy'

/** Server-rendered newsletter block — form submit is a deferred client island. */
export default function NewsletterSection() {
  return (
    <section className="py-10 border-t border-[#E8E9EA]">
      <div className="bg-white rounded-[20px] px-8 py-12 text-center shadow-card">
        <h2
          className="font-sans font-bold text-2xl text-ink"
          style={{ letterSpacing: '-0.02em' }}
        >
          Stay Ahead of the Market.
        </h2>
        <p className="mt-3 text-[15px] font-sans text-ink-3 max-w-md mx-auto leading-relaxed">
          Get new listings, market insights, and equipment trends delivered to your inbox.
        </p>
        <div className="mt-6 max-w-sm mx-auto">
          <NewsletterFormLazy source="homepage" />
        </div>
      </div>
    </section>
  )
}
