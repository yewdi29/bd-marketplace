'use client'

import { useFlagIconsCss } from '@/hooks/useFlagIconsCss'
import { countryFlagClass } from '@/lib/listingUtils'

export interface UserLocationRow {
  country: string
  iso_code: string | null
  count: number
}

interface UserLocationsCardProps {
  locations: UserLocationRow[]
}

export default function UserLocationsCard({ locations }: UserLocationsCardProps) {
  useFlagIconsCss()

  return (
    <div className="rigburrito-card" style={{ padding: 20 }}>
      <p className="rigburrito-card-label" style={{ marginBottom: 12 }}>User Locations</p>
      {locations.length === 0 ? (
        <p className="rigburrito-caption">No location data yet.</p>
      ) : (
        <table className="w-full" style={{ borderCollapse: 'collapse' }}>
          <tbody>
            {locations.map(row => {
              const flagClass = countryFlagClass(row.iso_code)
              return (
                <tr key={row.country}>
                  <td style={{ padding: '6px 0', width: 28 }}>
                    {flagClass ? (
                      <span
                        className="inline-flex shrink-0 overflow-hidden"
                        style={{ width: 16, height: 16, borderRadius: '50%', border: '1px solid #F0F1F3' }}
                        aria-hidden="true"
                      >
                        <span className={flagClass} style={{ width: 16, height: 16, backgroundSize: 'cover' }} />
                      </span>
                    ) : (
                      <span
                        style={{
                          display: 'inline-block',
                          width: 16,
                          height: 16,
                          borderRadius: '50%',
                          background: '#F0F1F3',
                          border: '1px solid #E5E7EB',
                        }}
                        aria-hidden="true"
                      />
                    )}
                  </td>
                  <td className="rigburrito-body" style={{ padding: '6px 8px', fontSize: 14 }}>
                    {row.country}
                  </td>
                  <td
                    className="rigburrito-mono text-right"
                    style={{ padding: '6px 0', fontSize: 14, color: '#0F1117' }}
                  >
                    {row.count}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </div>
  )
}
