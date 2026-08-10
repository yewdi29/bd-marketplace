'use client'

/**
 * ASCII dozer “build” loader — ported from Dozer ASCII Loader (standalone).
 * Progress 0–100 locks the dozer from bottom row upward; gray field flickers
 * until locked. No Design Canvas / CompositionStage dependency.
 */

import { useEffect, useMemo, useRef, useState } from 'react'

const ART = [
  '                                                       :%@-',
  '                                                      .%@%:',
  '                                                      :@@=',
  '                                                      :@@-',
  '                             .=******=::              :@@-',
  '                         .=*#@@@@@@@@@@@%%%***=::.    :@@-',
  '                     :=+#@@@@@@@@@%**#%@@@@@@@@@@@*.  -@@=',
  '                 .-=#@@@@@@@@@@@@@-    .::==+*#%@@@+  +@@@:',
  '              :=*@@@@@@@*+#@@@@@@@:             =@@+  +@@@:',
  '            =#@@@@#+*@@@-#@@@@@@@%.             -@@+  +@@@:',
  '           :@@@@*-*%@@@@-#@@@@@@@*              -@@+  +@@@:',
  '           :@@@@+*@@@@@@-#@@@@@@@*              -@@+  +@@@:',
  '           :@@@@+*@@@@@@-#@@@@@@@*              -@@+  +@@@:',
  '           :@@@@+*@@@@@@-#@@@@@@@*              -@@+  +@@@:',
  '           :@@@@+*@@@@@@-#@@@@@@@*              =@@%==#@@@-',
  '           :@@@@%%@@@@@@-#@@@@@@@%.       :=+**%@@@@@@@@@@@%%%#***+:',
  '           :@@@@@@@@@@@@-#@@@@@@@@+===**%%@@@@@@@@@*==********%%%@@@-',
  '           :@@@@@@@@@@@@-#@@@@@@@@@@@@@@@@@@@@@@@@*   .          :%@+',
  '           :@@@@@@@@@@@@+#@@@@@@@@@@@@@@--%@@@@@@@*  :@%%%%#***+. *@+',
  '           :@@@@@@@@@@@@+#@@@@@@@@@@@@@@= -@@@@@@@*   -=====***+. *@+',
  '           :@@@@@@@@@@@@@@@@@@@@@@@@@@@@%: =@@@@@@*   *%%%%%%%%#: *@*',
  '           :@@@@@@@@@@@@@@@@@@@@@@@@@@@@@*  *@@@@@*   :=========. #@@-',
  '            =%@@@@@@@@@@@@@@@@@@@@@@@@@@@@= :%@@@@*   *%%%%%***+ .%@@@=',
  '              #@@@@@@@@@@@@@@@@@@@@@@@@@@@%: -@@@@*   .-:::::::. .%@@@@*.',
  '              #@@@@@@@@@@@@@@@@@@@@@@@@@@@@%. :@@@*               #@@@@@*',
  '           -*#@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@%#*@@@@**************#@@@@@@@%*******************=',
  '       :=*%@@@@@@%%#*#%@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@*',
  '   .-*#@@@@@%#*+-      .:*@@@@@@@@#:-===================***********+==+****************+=*@@@-',
  ' .*@@@@@%*=:    .::    *%=-%@@@@@@-:@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@%+=@@#',
  '.#@@*=-.   :-   +@@-   =@@::@@@@@* .#****************+======================-==:::::::.  +@@*',
  '*@@=:*+.   #@*  +@@-    #@* *@@@@*                                                       *@@=',
  '@@# .+@#.  #@*  +@@-    *@* +@@@@*                                                       #@@-',
  '%@%. -@%=+=%@#  +@@=    *@* +@@@@*                                                       #@%.',
  '=@@*:*@@@%%@@@%%@@@*=: :@@- #@@@@%:                                                      #@#',
  ' =@@@@%%@- :==#%@@@@@@%@@@=*@@@@@@-                                                      #@#',
  '  -#@@@@@%+-    :=+*%@@@@@@@@@@@@@=                                                      #@@:',
  '    :+*@@@@@%*=:     -=+%%@@@@@@@@*                                                      +@@=',
  '       :=*@@@@@@#=:       :-=*@@@@%.                                                     *@@*',
  '          :=#@@@@@@%*=        #@@@@-                                               ::::  =@@%.',
  '             .-*@@@@@@%#+.    #@@@@*                    .::::=========*****#%%%%%%%@@@@* :@@@-',
  '                .+*%@@@@@@*+-.+@@@@@: :+=+*******%%%%%%%@@@@@@@@@@@@@@@@%%%%%******===-. .%@@*',
  '                    -*%@@@@@@%%@@@@@= *@@@@@@@@@@@@@%%%%%*****+====-:::.    .::::===******@@@%',
  '                       -*%@@@@@@@@@@%::***+=====::::     :::::-====+**#%%%%%@@@@@@@@@@@@@%%#**',
  '                         .=*@@@@@@@@@*:::::=====+**#%%%%%@@@@@@@@@@@@@@%%%%%***====-::::.',
  '                            .-*%@@@@@@@@@@@@@@@@@@@@@@%%%%#**+====-::::',
  '                                -*%@@%%%%#****===::::.',
].map((l) => l.padEnd(94, ' '))

const ART_ROWS = ART.length
const ART_COLS = 94
const COLS = 130
const ROWS = 58
const OX = Math.round((COLS - ART_COLS) / 2)
const OY = Math.round((ROWS - ART_ROWS) / 2)
const CELL = { size: 15, line: 15, adv: 9 }
export const DOZER_STAGE_W = COLS * CELL.adv // 702
export const DOZER_STAGE_H = ROWS * CELL.line // 522

const POOL = '@%#*+=:-.'
const FLICKER_HZ = 9
const BAND = 1 / ART_ROWS
const MONO = "var(--mono), 'Andale Mono', ui-monospace, monospace"

function hash(a: number, b: number, c: number): number {
  let x = (a * 374761393 + b * 668265263 + c * 1274126177) >>> 0
  x = ((x ^ (x >>> 13)) * 1274126177) >>> 0
  return (x ^ (x >>> 16)) >>> 0
}

const rnd = (a: number, b: number, c: number) => hash(a, b, c) / 4294967296

function threshold(c: number, r: number): number {
  const fromBottom = ART_ROWS - 1 - r
  return Math.min(0.999, fromBottom * BAND + rnd(c, r, 5) * BAND * 0.9)
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n))
}

function buildFrame(T: number, p: number): { field: string; locked: string } {
  const tick = Math.floor(T * FLICKER_HZ)
  const field: string[] = []
  const locked: string[] = []
  for (let r = 0; r < ROWS; r++) {
    let fr = ''
    let lr = ''
    for (let c = 0; c < COLS; c++) {
      const ar = r - OY
      const ac = c - OX
      const t = ar >= 0 && ar < ART_ROWS && ac >= 0 && ac < ART_COLS ? ART[ar][ac] : ' '
      if (t !== ' ' && p >= threshold(ac, ar)) {
        lr += t
        fr += ' '
        continue
      }
      lr += ' '
      const h = hash(c, r, tick)
      fr += (h & 3) === 0 ? POOL[(h >>> 5) % POOL.length] : ' '
    }
    field.push(fr.replace(/\s+$/, ''))
    locked.push(lr.replace(/\s+$/, ''))
  }
  return { field: field.join('\n'), locked: locked.join('\n') }
}

type LayerProps = {
  text: string
  color: string
  opacity: number
  weight: number
}

function Layer({ text, color, opacity, weight }: LayerProps) {
  return (
    <pre
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        margin: 0,
        fontFamily: MONO,
        fontSize: CELL.size,
        lineHeight: `${CELL.line}px`,
        letterSpacing: 0,
        color,
        opacity,
        fontWeight: weight,
        whiteSpace: 'pre',
        pointerEvents: 'none',
      }}
    >
      {text}
    </pre>
  )
}

export type DozerAsciiLoaderProps = {
  /** 0–100 lock progress */
  progress: number
  showField?: boolean
  ink?: string
  gray?: string
  bg?: string
  className?: string
  /** Accessible label */
  label?: string
}

export default function DozerAsciiLoader({
  progress,
  showField = false,
  ink = '#FF6B35',
  gray = '#c9c4bd',
  bg = '#FFFFFF',
  className,
  label = 'Generating listing',
}: DozerAsciiLoaderProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0.5)
  const [time, setTime] = useState(0)

  useEffect(() => {
    let id = 0
    let lastTick = -1
    const start = performance.now()
    const loop = (now: number) => {
      const t = (now - start) / 1000
      const tick = Math.floor(t * FLICKER_HZ)
      // Flicker pool only advances at FLICKER_HZ — skip redundant React renders.
      if (tick !== lastTick) {
        lastTick = tick
        setTime(t)
      }
      id = requestAnimationFrame(loop)
    }
    id = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(id)
  }, [])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) return
      const { width, height } = entry.contentRect
      if (width < 1 || height < 1) return
      setScale(Math.min(width / DOZER_STAGE_W, height / DOZER_STAGE_H))
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const p = clamp01(progress / 100)
  const frame = useMemo(() => buildFrame(time, p), [time, p])
  const fieldFade = 1 - 0.55 * p
  const pctLabel = `${String(Math.round(p * 100)).padStart(3, ' ')}%`

  return (
    <div
      ref={containerRef}
      className={className}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(p * 100)}
      aria-label={label}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        minHeight: 220,
        background: bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: DOZER_STAGE_W * scale,
          height: DOZER_STAGE_H * scale,
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: DOZER_STAGE_W,
            height: DOZER_STAGE_H,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
          }}
        >
          <div style={{ position: 'relative', width: DOZER_STAGE_W, height: DOZER_STAGE_H }}>
            {showField ? (
              <Layer text={frame.field} color={gray} opacity={fieldFade} weight={400} />
            ) : null}
            <Layer text={frame.locked} color={ink} opacity={1} weight={400} />
            <div
              style={{
                position: 'absolute',
                left: (OX + ART_COLS) * CELL.adv,
                top: OY * CELL.line,
                transform: 'translate(-100%, -140%)',
                fontFamily: MONO,
                fontSize: CELL.size,
                lineHeight: `${CELL.line}px`,
                letterSpacing: '0.12em',
                fontWeight: 500,
                color: ink,
                whiteSpace: 'pre',
              }}
            >
              {pctLabel}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
