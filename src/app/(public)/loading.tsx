export default function PublicLoading() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <div
        className="h-8 w-8 rounded-full border-2 border-[#E8E9EA] border-t-orange animate-spin"
        aria-label="Loading"
      />
    </div>
  )
}
