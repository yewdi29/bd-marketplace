/** Shared homepage hero CTA sizing — stacked + 48px tap target below 730px only. */
export const HERO_CTA_BASE =
  'inline-flex items-center justify-center max-[729px]:w-full max-[729px]:min-h-12 max-[729px]:px-6 max-[729px]:py-3 max-[729px]:text-sm min-[730px]:px-[18px] min-[730px]:py-2 min-[730px]:text-[13px] rounded-pill font-bold no-underline whitespace-nowrap font-sans transition-all duration-200'

export const HERO_CTA_OUTLINE =
  `${HERO_CTA_BASE} bg-white text-ink border border-[#E8E9EA] hover:text-orange hover:border-orange`

export const HERO_CTA_PRIMARY =
  `${HERO_CTA_BASE} bg-orange text-white hover:bg-orange-lt`

export const HERO_CTA_ROW =
  'flex flex-row items-center justify-center gap-3 min-[1000px]:justify-start max-[729px]:flex-col max-[729px]:items-stretch max-[729px]:w-full'
