import * as THREE from 'three'
import { Line2 } from 'three/addons/lines/Line2.js'
import { LineGeometry } from 'three/addons/lines/LineGeometry.js'
import { LineMaterial } from 'three/addons/lines/LineMaterial.js'
import { createGlobeLabel, HERO_GLOBE_LABEL_ITEMS, pickGlobeLabelIndex } from '@/components/home/heroGlobeLabels'

/** One unique label per concurrent arc (matches HERO_GLOBE_LABEL_ITEMS length). */
const MAX_CONCURRENT_ARCS = HERO_GLOBE_LABEL_ITEMS.length

/** Arc timing — slowed 40% vs Claude Design defaults (duration × 1.4, rates ÷ 1.4). */
const ARC_GROW_SEC = 5.88
const ARC_HOLD_AGE_SEC = 5.88
const ARC_OPACITY_RAMP = 1 / 1.4
const ARC_FADE_RATE = 0.6 / 1.4
const ARC_SPAWN_INTERVAL_SEC = 2.1
/** Screen-space arc thickness (default WebGL lines are ~1px). */
const ARC_LINE_WIDTH_PX = 2

export type ArcPhase = 'grow' | 'hold' | 'fade'

export interface ArcState {
  verts: THREE.Vector3[]
  line: Line2
  geo: LineGeometry
  mat: LineMaterial
  SEG: number
  prog: number
  draw: number
  age: number
  phase: ArcPhase
  el: HTMLDivElement
  labelIndex: number
  R: number
}

export function spawnArc(
  group: THREE.Group,
  landPts: THREE.Vector3[],
  labelRoot: HTMLElement,
  R: number,
  activeArcs: ArcState[],
): ArcState | null {
  if (landPts.length < 2) return null

  const labelIndex = pickGlobeLabelIndex(activeArcs.map(a => a.labelIndex))
  if (labelIndex === null) return null

  const a = landPts[Math.floor(Math.random() * landPts.length)].clone().normalize()
  let b = landPts[Math.floor(Math.random() * landPts.length)].clone().normalize()
  let tries = 0
  while (a.distanceTo(b) < 0.7 && tries++ < 12) {
    b = landPts[Math.floor(Math.random() * landPts.length)].clone().normalize()
  }

  const omega = Math.acos(Math.max(-1, Math.min(1, a.dot(b))))
  const so = Math.sin(omega) || 1e-4
  const SEG = 70
  const verts: THREE.Vector3[] = []
  const h = 0.16 + Math.random() * 0.12

  for (let i = 0; i <= SEG; i++) {
    const t = i / SEG
    const s0 = Math.sin((1 - t) * omega) / so
    const s1 = Math.sin(t * omega) / so
    const v = new THREE.Vector3(a.x * s0 + b.x * s1, a.y * s0 + b.y * s1, a.z * s0 + b.z * s1)
      .normalize()
      .multiplyScalar(R * (1 + h * Math.sin(Math.PI * t)))
    verts.push(v)
  }

  const positions: number[] = []
  for (let i = 0; i <= SEG; i++) {
    positions.push(verts[i].x, verts[i].y, verts[i].z)
  }

  const geo = new LineGeometry()
  geo.setPositions(positions)
  geo.setDrawRange(0, 2)

  const tMid = (verts[Math.floor(SEG / 2)].x / R + 1) * 0.5
  const col = new THREE.Color().setHSL(0.105 + tMid * 0.02, 0.95, 0.55)
  const mat = new LineMaterial({
    color: col.getHex(),
    linewidth: ARC_LINE_WIDTH_PX,
    transparent: true,
    opacity: 0,
    depthTest: false,
    depthWrite: false,
  })
  const line = new Line2(geo, mat)
  line.computeLineDistances()
  group.add(line)

  const el = createGlobeLabel(labelRoot, labelIndex)
  return { verts, line, geo, mat, SEG, prog: 0, draw: 0, age: 0, phase: 'grow', el, labelIndex, R }
}

export function updateArcs(
  arcs: ArcState[],
  group: THREE.Group,
  landPts: THREE.Vector3[],
  labelRoot: HTMLElement,
  R: number,
  dt: number,
  t: number,
  lastSpawn: number,
  camera: THREE.PerspectiveCamera,
  W: number,
  H: number,
  tmp: THREE.Vector3,
): number {
  let spawnAt = lastSpawn
  if (t - spawnAt > ARC_SPAWN_INTERVAL_SEC && arcs.length < MAX_CONCURRENT_ARCS) {
    const arc = spawnArc(group, landPts, labelRoot, R, arcs)
    if (arc) {
      arcs.push(arc)
      spawnAt = t
    }
  }

  group.updateMatrixWorld()

  for (let i = 0; i < arcs.length; i++) {
    arcs[i].mat.resolution.set(W, H)
  }

  for (let i = arcs.length - 1; i >= 0; i--) {
    const A = arcs[i]
    A.age += dt

    if (A.phase === 'grow') {
      A.prog = Math.min(1, A.prog + dt / ARC_GROW_SEC)
      const e = A.prog * A.prog * (3.0 - 2.0 * A.prog)
      A.draw = e
      A.geo.setDrawRange(0, Math.max(1, Math.round(e * A.SEG) + 1))
      A.mat.opacity = Math.min(0.5, A.mat.opacity + dt * ARC_OPACITY_RAMP)
      if (A.prog >= 1) {
        A.phase = 'hold'
        A.draw = 1
      }
    } else if (A.phase === 'hold') {
      if (A.age > ARC_HOLD_AGE_SEC) A.phase = 'fade'
    } else {
      A.mat.opacity = Math.max(0, A.mat.opacity - dt * ARC_FADE_RATE)
      A.el.style.opacity = '0'
      if (A.mat.opacity <= 0) {
        group.remove(A.line)
        A.geo.dispose()
        A.mat.dispose()
        A.el.remove()
        arcs.splice(i, 1)
        continue
      }
    }

    const hf = A.draw * A.SEG
    const i0 = Math.min(A.SEG, Math.floor(hf))
    const i1 = Math.min(A.SEG, i0 + 1)
    const fr = hf - i0
    tmp.copy(A.verts[i0]).lerp(A.verts[i1], fr).applyMatrix4(group.matrixWorld)
    const wn = tmp.clone().normalize()
    const vd = camera.position.clone().sub(tmp).normalize()
    const facing = wn.dot(vd)
    const proj = tmp.clone().project(camera)
    const sx = (proj.x * 0.5 + 0.5) * W
    const sy = (-proj.y * 0.5 + 0.5) * H
    A.el.style.left = `${sx}px`
    A.el.style.top = `${sy}px`
    if (A.phase !== 'fade') {
      A.el.style.opacity = facing > 0.1 && proj.z < 1 ? '1' : '0'
    }
  }

  return spawnAt
}

export function disposeArcs(arcs: ArcState[], group: THREE.Group) {
  for (const A of arcs) {
    group.remove(A.line)
    A.geo.dispose()
    A.mat.dispose()
    A.el.remove()
  }
  arcs.length = 0
}
