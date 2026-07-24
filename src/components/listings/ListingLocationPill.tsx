import { countryFlagClass } from '@/lib/listingUtils'
import ListingCardFlagStyles from '@/components/listings/ListingCardFlagStyles'

interface ListingLocationPillProps {
  locationCity?: string | null
  locationState?: string | null
  countryName?: string | null
  countryIsoCode?: string | null
}

/** Location chip with optional country flag — matches listing card styling. */
export default function ListingLocationPill({
  locationCity,
  locationState,
  countryName,
  countryIsoCode,
}: ListingLocationPillProps) {
  const locationParts = [locationCity, locationState, countryName].filter(Boolean)
  const locationText = locationParts.length > 0 ? locationParts.join(', ') : null
  const flagClass = countryFlagClass(countryIsoCode)

  if (!locationText) return null

  return (
    <>
      {flagClass && <ListingCardFlagStyles />}
      <span
        className="inline-flex items-center font-sans"
        style={{
          background: '#F7F8F9',
          border: '1px solid #E8E9EA',
          color: '#4A4D52',
          fontSize: '11px',
          borderRadius: '100px',
          padding: '3px 10px',
          gap: flagClass ? '7px' : undefined,
        }}
      >
        {flagClass && (
          <span
            className="inline-flex shrink-0 overflow-hidden border border-[#E8E9EA]"
            style={{ width: 17, height: 17, borderRadius: '50%' }}
            aria-hidden="true"
          >
            <span
              className={flagClass}
              style={{ width: 17, height: 17, objectFit: 'cover', backgroundSize: 'cover' }}
            />
          </span>
        )}
        {locationText}
      </span>
    </>
  )
}
