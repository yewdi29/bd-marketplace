'use client'

import { geoBounds, geoContains, geoNaturalEarth1 } from 'd3'
import { useEffect, useRef, useState } from 'react'
import { feature } from 'topojson-client'
import type { Feature, FeatureCollection } from 'geojson'
import type { Topology } from 'topojson-specification'
import {
  geoRippleProgress,
  HIW_DOT_GRAY,
  HIW_DOT_RADIUS,
  HIW_GRID_STEP,
  HIW_MAP_PADDING,
  HIW_MAP_VIEW_BBOX,
  lerpHiwDotColor,
  WORLD_ATLAS_URL,
  type HiWLandDot,
} from '@/components/home/hiwGeoMapConstants'

type Phase = string

function featureIntersectsBbox(
  f: Feature,
  [west, south, east, north]: [number, number, number, number],
): boolean {
  const [[fw, fs], [fe, fn]] = geoBounds(f)
  return fw <= east && fe >= west && fs <= north && fn >= south
}

function filterToViewRegion(land: FeatureCollection): FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: land.features.filter(f => featureIntersectsBbox(f, HIW_MAP_VIEW_BBOX)),
  }
}

function buildLandDots(
  width: number,
  height: number,
  land: FeatureCollection,
): { dots: HiWLandDot[]; maxDist: number } {
  const regional = filterToViewRegion(land)
  const projection = geoNaturalEarth1().fitExtent(
    [
      [HIW_MAP_PADDING, HIW_MAP_PADDING],
      [width - HIW_MAP_PADDING, height - HIW_MAP_PADDING],
    ],
    regional,
  )

  const cx = width / 2
  const cy = height / 2
  const dots: HiWLandDot[] = []
  let maxDist = 0

  const invert = projection.invert?.bind(projection)
  if (!invert) return { dots: [], maxDist: 0 }

  for (let y = 0; y < height; y += HIW_GRID_STEP) {
    for (let x = 0; x < width; x += HIW_GRID_STEP) {
      const inverted = invert([x, y])
      if (!inverted) continue
      const [lng, lat] = inverted
      if (!geoContains(regional, [lng, lat])) continue
      const dist = Math.hypot(x - cx, y - cy)
      if (dist > maxDist) maxDist = dist
      dots.push({ x, y, dist })
    }
  }

  return { dots, maxDist }
}

export function GeoDotWorldMapCanvas({
  phase,
  loopId,
}: {
  phase: Phase
  loopId: number
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const landRef = useRef<FeatureCollection | null>(null)
  const dotsRef = useRef<HiWLandDot[]>([])
  const maxDistRef = useRef(0)
  const rippleStartRef = useRef<number | null>(null)
  const rafRef = useRef<number>(0)
  const sizeRef = useRef({ width: 0, height: 0 })
  const builtSizeRef = useRef({ width: 0, height: 0 })
  const [landReady, setLandReady] = useState(false)

  useEffect(() => {
    let cancelled = false

    fetch(WORLD_ATLAS_URL, { cache: 'force-cache' })
      .then(res => {
        if (!res.ok) throw new Error('Failed to load world atlas')
        return res.json() as Promise<Topology>
      })
      .then(data => {
        if (cancelled) return
        landRef.current = feature(
          data,
          data.objects.countries,
        ) as FeatureCollection
        setLandReady(true)
      })
      .catch(() => {
        if (!cancelled) setLandReady(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (phase === 'idle') {
      rippleStartRef.current = null
    }
  }, [phase])

  useEffect(() => {
    if (phase === 's2_live') {
      rippleStartRef.current = performance.now()
    }
  }, [phase, loopId])

  useEffect(() => {
    const container = containerRef.current
    const canvas = canvasRef.current
    if (!container || !canvas) return

    const syncDots = () => {
      const land = landRef.current
      const { width, height } = sizeRef.current
      if (!land || width <= 0 || height <= 0) return
      if (
        builtSizeRef.current.width === width &&
        builtSizeRef.current.height === height
      ) {
        return
      }
      const { dots, maxDist } = buildLandDots(width, height, land)
      dotsRef.current = dots
      maxDistRef.current = maxDist
      builtSizeRef.current = { width, height }
    }

    const resize = () => {
      const rect = container.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      sizeRef.current = { width: rect.width, height: rect.height }
      canvas.width = Math.max(1, Math.floor(rect.width * dpr))
      canvas.height = Math.max(1, Math.floor(rect.height * dpr))
      canvas.style.width = `${rect.width}px`
      canvas.style.height = `${rect.height}px`
      syncDots()
    }

    const draw = () => {
      const { width, height } = sizeRef.current
      const ctx = canvas.getContext('2d')
      if (!ctx || width <= 0 || height <= 0) return

      const dpr = window.devicePixelRatio || 1
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, width, height)

      const elapsed =
        rippleStartRef.current != null ? performance.now() - rippleStartRef.current : -1
      const maxDist = maxDistRef.current

      for (const dot of dotsRef.current) {
        const progress =
          elapsed >= 0 ? geoRippleProgress(elapsed, dot.dist, maxDist) : 0
        ctx.fillStyle =
          elapsed >= 0 && progress > 0 ? lerpHiwDotColor(progress) : HIW_DOT_GRAY
        ctx.beginPath()
        ctx.arc(dot.x, dot.y, HIW_DOT_RADIUS, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    const tick = () => {
      draw()
      rafRef.current = requestAnimationFrame(tick)
    }

    resize()
    tick()

    const ro = new ResizeObserver(() => {
      resize()
    })
    ro.observe(container)

    return () => {
      cancelAnimationFrame(rafRef.current)
      ro.disconnect()
    }
  }, [landReady, loopId])

  return (
    <div ref={containerRef} className="absolute inset-0" aria-hidden>
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  )
}
