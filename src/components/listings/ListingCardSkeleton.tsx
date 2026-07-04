/** Matches ListingCard thumbnail + content padding for loading states. */
export default function ListingCardSkeleton() {
  return (
    <div className="bg-white rounded-[12px] overflow-hidden border border-[#E8E9EA] animate-pulse shadow-card">
      <div className="bg-[#F0F0F0]" style={{ paddingBottom: '60%', borderRadius: '12px 12px 0 0' }} />
      <div className="space-y-2.5" style={{ padding: '17px' }}>
        <div className="h-3 bg-[#F0F0F0] rounded-full w-24" />
        <div className="h-4 bg-[#F0F0F0] rounded-full w-full" />
        <div className="h-4 bg-[#F0F0F0] rounded-full w-3/4" />
        <div className="h-4 bg-[#F0F0F0] rounded-full w-20" />
      </div>
    </div>
  )
}
