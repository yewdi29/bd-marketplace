/** SSR-safe globe stand-in — no client JS, desktop layout defaults. */
export function GlobePlaceholderStatic() {
  const size = 960
  const left = Math.round(Math.max(0, 0) + 1280 * 0.75 - size / 2)

  return (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        left: `${left}px`,
        top: '-30px',
        width: size,
        height: size,
        zIndex: 1,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          background:
            'radial-gradient(circle at 35% 35%, rgba(255,255,255,0.95) 0%, rgba(232,233,234,0.55) 45%, rgba(232,233,234,0.25) 70%, transparent 100%)',
        }}
      />
    </div>
  )
}
