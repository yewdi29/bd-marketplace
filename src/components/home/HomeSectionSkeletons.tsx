export function CategoryBrowseSkeleton() {
  return (
    <section className="py-16 lg:py-20 border-t border-[#E8E9EA]" aria-hidden>
      <div className="mb-6">
        <div className="h-9 w-56 max-w-full bg-[#F0F0F0] rounded-lg animate-pulse" />
        <div className="mt-4 h-5 w-64 max-w-full bg-[#F0F0F0] rounded-lg animate-pulse" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-[94px] bg-[#F0F0F0] rounded-[16px] animate-pulse" />
        ))}
      </div>
    </section>
  )
}

export function OperatorJournalSkeleton() {
  return (
    <section className="py-16 lg:py-20 border-t border-[#E8E9EA]" aria-hidden>
      <div className="h-7 w-56 bg-[#F0F0F0] rounded-lg animate-pulse mb-6" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="min-h-[340px] bg-[#F0F0F0] rounded-[16px] animate-pulse" />
        ))}
      </div>
    </section>
  )
}

export function HowItWorksSkeleton() {
  return (
    <div className="w-full py-16 lg:py-20" aria-hidden>
      <div className="page-shell text-center mb-12">
        <div className="h-10 w-72 bg-[#F0F0F0] rounded-lg animate-pulse mx-auto" />
        <div className="h-4 w-96 max-w-full bg-[#F0F0F0] rounded-lg animate-pulse mx-auto mt-4" />
      </div>
      <div className="page-shell h-64 bg-[#F0F0F0] rounded-[16px] animate-pulse" />
    </div>
  )
}

export function NewsletterSkeleton() {
  return (
    <section className="py-10 w-full" aria-hidden>
      <div className="w-full bg-white border border-[#E8E9EA] rounded-[20px] px-8 py-12 shadow-card">
        <div className="flex flex-col md:flex-row md:items-center gap-8 md:gap-10 lg:gap-12">
          <div className="md:w-1/2 space-y-3">
            <div className="h-3 w-28 bg-[#F0F0F0] rounded animate-pulse" />
            <div className="h-9 w-full max-w-md bg-[#F0F0F0] rounded-lg animate-pulse" />
            <div className="h-4 w-full max-w-sm bg-[#F0F0F0] rounded-lg animate-pulse" />
          </div>
          <div className="md:w-1/2 flex gap-2">
            <div className="flex-1 h-10 bg-[#F0F0F0] rounded-pill animate-pulse" />
            <div className="w-28 h-10 bg-[#F0F0F0] rounded-pill animate-pulse" />
          </div>
        </div>
      </div>
    </section>
  )
}
