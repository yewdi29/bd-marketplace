'use client'

import { forwardRef, useEffect, useImperativeHandle, useRef, type RefObject } from 'react'
import { useGlowBorder, type GlowBorderOptions } from '@/hooks/useGlowBorder'

export interface GlowBorderHandle {
  focus: () => void
  blur: () => void
}

interface GlowBorderCanvasProps {
  containerRef: RefObject<HTMLElement>
  options?: GlowBorderOptions
  onReady?: (handle: GlowBorderHandle) => void
}

/** Canvas glow layer — mount lazily (dynamic import) so useGlowBorder stays off the critical path. */
const GlowBorderCanvas = forwardRef<GlowBorderHandle, GlowBorderCanvasProps>(
  function GlowBorderCanvas({ containerRef, options, onReady }, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const { onFocus, onBlur } = useGlowBorder(canvasRef, containerRef, options)

    useImperativeHandle(ref, () => ({ focus: onFocus, blur: onBlur }), [onFocus, onBlur])

    useEffect(() => {
      onReady?.({ focus: onFocus, blur: onBlur })
    }, [onFocus, onBlur, onReady])

    return (
      <canvas
        ref={canvasRef}
        style={{ position: 'absolute', zIndex: 0, pointerEvents: 'none' }}
      />
    )
  },
)

export default GlowBorderCanvas
