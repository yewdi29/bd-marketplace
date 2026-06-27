import landGeoJson from '@/assets/globe/ne_110m_land.json'

export type LandPoly = {
  rings: number[][][]
  bbox: [number, number, number, number]
}

export type SampledPoint = { x: number; y: number; z: number }

type GeoJsonFeature = {
  geometry?: {
    type: string
    coordinates: number[][][] | number[][][][]
  }
}

type GeoJsonCollection = {
  features?: GeoJsonFeature[]
}

export function parseLand(gj: GeoJsonCollection): LandPoly[] {
  const polys: LandPoly[] = []

  const addPoly = (rings: number[][][]) => {
    let minX = 1e9
    let minY = 1e9
    let maxX = -1e9
    let maxY = -1e9
    const outer = rings[0]
    for (const p of outer) {
      if (p[0] < minX) minX = p[0]
      if (p[0] > maxX) maxX = p[0]
      if (p[1] < minY) minY = p[1]
      if (p[1] > maxY) maxY = p[1]
    }
    polys.push({ rings, bbox: [minX, minY, maxX, maxY] })
  }

  for (const f of gj.features ?? []) {
    const g = f.geometry
    if (!g) continue
    if (g.type === 'Polygon') addPoly(g.coordinates as number[][][])
    else if (g.type === 'MultiPolygon') {
      for (const poly of g.coordinates as number[][][][]) addPoly(poly)
    }
  }

  return polys
}

export function loadLandPolys(): LandPoly[] {
  return parseLand(landGeoJson as GeoJsonCollection)
}

function ringContains(ring: number[][], x: number, y: number): boolean {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0]
    const yi = ring[i][1]
    const xj = ring[j][0]
    const yj = ring[j][1]
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

function inLand(lng: number, lat: number, polys: LandPoly[]): boolean {
  for (const poly of polys) {
    const b = poly.bbox
    if (lng < b[0] || lng > b[2] || lat < b[1] || lat > b[3]) continue
    if (ringContains(poly.rings[0], lng, lat)) {
      let hole = false
      for (let k = 1; k < poly.rings.length; k++) {
        if (ringContains(poly.rings[k], lng, lat)) {
          hole = true
          break
        }
      }
      if (!hole) return true
    }
  }
  return false
}

function ll2xyz(lng: number, lat: number, R: number): SampledPoint {
  const phi = ((90 - lat) * Math.PI) / 180
  const theta = ((lng + 180) * Math.PI) / 180
  return {
    x: -R * Math.sin(phi) * Math.cos(theta),
    y: R * Math.cos(phi),
    z: R * Math.sin(phi) * Math.sin(theta),
  }
}

export function samplePoints(polys: LandPoly[], R: number, N: number): SampledPoint[] {
  const out: SampledPoint[] = []
  const GA = Math.PI * (3 - Math.sqrt(5))
  if (!polys.length) return out

  for (let i = 0; i < N; i++) {
    const y = 1 - (i / (N - 1)) * 2
    const r = Math.sqrt(Math.max(0, 1 - y * y))
    const th = i * GA
    const x = Math.cos(th) * r
    const z = Math.sin(th) * r
    const lat = (Math.asin(y) * 180) / Math.PI
    const lng = (Math.atan2(z, x) * 180) / Math.PI
    if (inLand(lng, lat, polys)) {
      const p = ll2xyz(lng, lat, R)
      const j = 0.012 * R
      out.push({
        x: p.x + (Math.random() - 0.5) * j * 2.4,
        y: p.y + (Math.random() - 0.5) * j * 2.4,
        z: p.z + (Math.random() - 0.5) * j * 2.4,
      })
    }
  }

  return out
}
