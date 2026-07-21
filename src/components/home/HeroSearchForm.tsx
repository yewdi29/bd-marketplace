'use client'

import dynamic from 'next/dynamic'
import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { GlowBorderHandle } from '@/components/ui/GlowBorderCanvas'

const GlowBorderCanvas = dynamic(() => import('@/components/ui/GlowBorderCanvas'), {
  ssr: false,
})

const CATEGORIES = [
  { label: 'Drill Pipe',          slug: 'drill_pipe' },
  { label: 'Drilling Rigs',       slug: 'rig' },
  { label: 'Blowout Preventers',  slug: 'blowout_preventer' },
  { label: 'Pumping Units',       slug: 'pumping_unit' },
  { label: 'Wellheads',           slug: 'wellhead' },
  { label: 'Compressors',         slug: 'compressor' },
  { label: 'Mud Pumps',           slug: 'mud_pump' },
  { label: 'Tanks & Vessels',     slug: 'tank' },
]

export default function HeroSearchForm() {
  const [q, setQ]           = useState('')
  const [category, setCat]  = useState('')
  const [focused, setFocused] = useState(false)
  const router = useRouter()

  const containerRef = useRef<HTMLFormElement>(null)
  const glowHandleRef = useRef<GlowBorderHandle | null>(null)
  const [glowMounted, setGlowMounted] = useState(false)
  const pendingGlowFocusRef = useRef(false)

  function armGlow(focus: boolean) {
    if (!glowMounted) {
      if (focus) pendingGlowFocusRef.current = true
      setGlowMounted(true)
      return
    }
    if (focus) glowHandleRef.current?.focus()
    else glowHandleRef.current?.blur()
  }

  function handleGlowReady(handle: GlowBorderHandle) {
    glowHandleRef.current = handle
    if (pendingGlowFocusRef.current) {
      pendingGlowFocusRef.current = false
      handle.focus()
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const params = new URLSearchParams()
    if (q.trim())  params.set('q', q.trim())
    if (category)  params.set('category', category)
    router.push(`/listings${params.toString() ? `?${params.toString()}` : ''}`)
  }

  // Border goes transparent on focus — canvas takes over visually
  const pillStyle: React.CSSProperties = {
    border: `1.5px solid ${focused ? 'transparent' : '#D4D5D7'}`,
    transition: 'border-color 0.15s',
  }

  return (
    <div className="mt-8 max-w-xl mx-auto">
      {/* Outer wrapper — canvas is positioned relative to this */}
      <div className="relative">

        {glowMounted && (
          <GlowBorderCanvas
            containerRef={containerRef}
            options={{ burstSpeed: 1.5, settleSpeed: 0.15, arcLen: 78, glowIntensity: 1.4 }}
            onReady={handleGlowReady}
          />
        )}

        {/* Pill form — z-index 1 */}
        <form
          ref={containerRef}
          onSubmit={handleSubmit}
          onPointerDown={() => armGlow(false)}
          className="relative flex items-center bg-white rounded-pill px-2 py-2"
          style={{ ...pillStyle, zIndex: 1, boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}
        >
          <select
            value={category}
            onChange={e => setCat(e.target.value)}
            className="bg-transparent border-none text-sm font-sans font-medium text-ink px-3 focus:outline-none cursor-pointer shrink-0"
          >
            <option value="">All Equipment</option>
            {CATEGORIES.map(c => (
              <option key={c.slug} value={c.slug}>{c.label}</option>
            ))}
          </select>

          <div className="w-px h-5 bg-[#E8E9EA] mx-1 shrink-0" />

          <input
            type="text"
            value={q}
            onChange={e => setQ(e.target.value)}
            onFocus={() => { setFocused(true); armGlow(true) }}
            onBlur={() => { setFocused(false); armGlow(false) }}
            placeholder="Search equipment..."
            className="flex-1 bg-transparent text-sm font-sans text-ink placeholder:text-ink-3 focus:outline-none px-3 min-w-0"
          />

          <button
            type="submit"
            className="shrink-0 px-6 py-2 text-sm font-bold text-white bg-orange rounded-pill hover:bg-orange-lt transition-colors shadow-orange-glow"
          >
            Search
          </button>
        </form>
      </div>
    </div>
  )
}
