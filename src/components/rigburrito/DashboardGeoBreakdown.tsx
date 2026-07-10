'use client'

import { useState } from 'react'
import { useFlagIconsCss } from '@/hooks/useFlagIconsCss'
import { useIsBelowLg } from '@/hooks/useIsBelowLg'
import { countryFlagClass } from '@/lib/listingUtils'
import WorldChoroplethMap, { type GeoCountryRow } from './WorldChoroplethMap'

interface DashboardGeoBreakdownProps {
  locations: GeoCountryRow[]
  title?: string
}

export default function DashboardGeoBreakdown({ locations, title = 'User Locations' }: DashboardGeoBreakdownProps) {
  useFlagIconsCss()
  const isBelowLg = useIsBelowLg()
  const [highlighted, setHighlighted] = useState<string | null>(null)

  return (
    <div className="rigburrito-detail-region">
      <div className="rigburrito-detail-region-header">
        <h2 className="rigburrito-section-title">{title}</h2>
      </div>
      <div className={`rigburrito-geo-breakdown ${isBelowLg ? 'rigburrito-geo-breakdown--stacked' : ''}`}>
        <div className="rigburrito-geo-table-wrap">
          <table className="rigburrito-table rigburrito-table--data">
            <thead>
              <tr>
                <th>Country</th>
                <th className="text-right">Users</th>
              </tr>
            </thead>
            <tbody>
              {locations.map(row => {
                const flagClass = countryFlagClass(row.iso_code)
                const isActive =
                  highlighted !== null &&
                  (row.country === highlighted ||
                    highlighted.toLowerCase().includes(row.country.toLowerCase()) ||
                    row.country.toLowerCase().includes(highlighted.toLowerCase()))

                return (
                  <tr
                    key={row.country}
                    className={`rigburrito-table-row--clickable ${isActive ? 'rigburrito-geo-row--active' : ''}`}
                    onMouseEnter={() => setHighlighted(row.country)}
                    onMouseLeave={() => setHighlighted(null)}
                    onClick={() => setHighlighted(isActive ? null : row.country)}
                  >
                    <td className="font-medium">
                      <span className="inline-flex items-center gap-2">
                        {flagClass ? (
                          <span
                            className="inline-flex shrink-0 overflow-hidden"
                            style={{ width: 16, height: 16, borderRadius: '50%', border: '1px solid #F0F1F3' }}
                            aria-hidden
                          >
                            <span className={flagClass} style={{ width: 16, height: 16, backgroundSize: 'cover' }} />
                          </span>
                        ) : null}
                        {row.country}
                      </span>
                    </td>
                    <td className="rigburrito-mono text-right">{row.count}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="rigburrito-geo-map-wrap">
          <WorldChoroplethMap
            locations={locations}
            highlightedCountry={highlighted}
            onHighlight={setHighlighted}
          />
        </div>
      </div>
    </div>
  )
}
