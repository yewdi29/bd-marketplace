'use client'

import { useMemo, useState } from 'react'
import { geoNaturalEarth1, geoPath } from 'd3-geo'
import { feature } from 'topojson-client'
import type { GeometryCollection } from 'topojson-specification'
import type { Feature, FeatureCollection } from 'geojson'
import countries110m from 'world-atlas/countries-110m.json' assert { type: 'json' }
import {
  bucketCountsByQuantile,
  fillForStep,
  strokeForStep,
  type OrangeScaleStep,
} from '@/lib/rigburrito/orangeScale'

export interface GeoCountryRow {
  country: string
  iso_code: string | null
  count: number
}

interface WorldChoroplethMapProps {
  locations: GeoCountryRow[]
  highlightedCountry: string | null
  onHighlight: (country: string | null) => void
}

const WIDTH = 760
const HEIGHT = 360

function normalizeName(name: string): string {
  return name.trim().toLowerCase()
}

export default function WorldChoroplethMap({
  locations,
  highlightedCountry,
  onHighlight,
}: WorldChoroplethMapProps) {
  const { features, nameToStep, pathFor } = useMemo(() => {
    const topology = countries110m as unknown as {
      objects: { countries: GeometryCollection }
    }
    const collection = feature(
      topology as unknown as Parameters<typeof feature>[0],
      topology.objects.countries,
    ) as unknown as FeatureCollection

    const projection = geoNaturalEarth1().fitExtent(
      [[0, 0], [WIDTH, HEIGHT]],
      collection,
    )
    const pathGenerator = geoPath(projection)

    const counts = locations.map(l => l.count)
    const bucketMap = bucketCountsByQuantile(counts)
    const nameToStepMap = new Map<string, OrangeScaleStep>()

    for (const row of locations) {
      nameToStepMap.set(normalizeName(row.country), bucketMap.get(row.count) ?? 0)
    }

    const pathCache = new Map<string, string>()
    for (const f of collection.features) {
      const name = String(f.properties?.name ?? '')
      const d = pathGenerator(f)
      if (d) pathCache.set(name, d)
    }

    return {
      features: collection.features,
      nameToStep: nameToStepMap,
      pathFor: (f: Feature) => pathCache.get(String(f.properties?.name ?? '')) ?? pathGenerator(f) ?? '',
    }
  }, [locations])

  const [hovered, setHovered] = useState<string | null>(null)
  const active = highlightedCountry ?? hovered

  function matchStep(geoName: string): OrangeScaleStep {
    const normalized = normalizeName(geoName)
    if (nameToStep.has(normalized)) return nameToStep.get(normalized)!

    for (const row of locations) {
      const rowNorm = normalizeName(row.country)
      if (normalized.includes(rowNorm) || rowNorm.includes(normalized)) {
        return nameToStep.get(rowNorm) ?? 0
      }
    }
    return 0
  }

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className="rigburrito-world-map"
      role="img"
      aria-label="World map of user locations"
    >
      {features.map(f => {
        const name = String(f.properties?.name ?? '')
        const step = matchStep(name)
        const highlighted = active !== null && (
          normalizeName(name) === normalizeName(active) ||
          normalizeName(active).includes(normalizeName(name)) ||
          normalizeName(name).includes(normalizeName(active))
        )
        const d = pathFor(f)
        if (!d) return null

        return (
          <path
            key={String(f.id ?? name)}
            d={d}
            fill={fillForStep(step)}
            stroke={strokeForStep(step, highlighted)}
            strokeWidth={highlighted ? 2 : step === 0 ? 0.5 : 0}
            vectorEffect="non-scaling-stroke"
            onMouseEnter={() => setHovered(name)}
            onMouseLeave={() => setHovered(null)}
            onClick={() => onHighlight(highlightedCountry === name ? null : name)}
            style={{ cursor: 'pointer' }}
          />
        )
      })}
    </svg>
  )
}
