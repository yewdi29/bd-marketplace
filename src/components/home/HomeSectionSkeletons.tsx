export function CategoryBrowseSkeleton() {
  return (
    <section className="py-10 border-t border-[#E8E9EA]" aria-hidden>
      <div className="h-7 w-44 bg-[#F0F0F0] rounded-lg animate-pulse mb-6" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-32 bg-[#F0F0F0] rounded-[16px] animate-pulse" />
        ))}
      </div>
    </section>
  )
}

export function OperatorJournalSkeleton() {
  return (
    <section className="py-10 border-t border-[#E8E9EA]" aria-hidden>
      <div className="h-7 w-56 bg-[#F0F0F0] rounded-lg animate-pulse mb-6" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-48 bg-[#F0F0F0] rounded-[16px] animate-pulse" />
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
    <section className="py-10 border-t border-[#E8E9EA]" aria-hidden>
      <div className="bg-white rounded-[20px] px-8 py-12 text-center shadow-card">
        <div className="h-8 w-64 bg-[#F0F0F0] rounded-lg animate-pulse mx-auto" />
        <div className="h-4 w-80 max-w-full bg-[#F0F0F0] rounded-lg animate-pulse mx-auto mt-3" />
        <div className="mt-6 max-w-sm mx-auto flex gap-2">
          <div className="flex-1 h-10 bg-[#F0F0F0] rounded-pill animate-pulse" />
          <div className="w-24 h-10 bg-[#F0F0F0] rounded-pill animate-pulse" />
        </div>
      </div>
    </section>
  )
}
