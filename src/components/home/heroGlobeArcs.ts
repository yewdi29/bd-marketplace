import * as THREE from 'three'
import { createGlobeLabel, pickGlobeLabelIndex } from '@/components/home/heroGlobeLabels'
import {
  HERO_GLOBE_ARC_FRAGMENT_SHADER,
  HERO_GLOBE_ARC_LINE_OFFSETS,
  HERO_GLOBE_ARC_VERTEX_SHADER,
} from '@/components/home/heroGlobeShaders'

const MAX_CONCURRENT_ARCS = 5
const ARC_GROW_SEC = 4.2
const ARC_HOLD_AGE_SEC = 4.2
const ARC_OPACITY_RAMP = 1.0
const ARC_MAX_OPACITY = 0.6
const ARC_FADE_RATE = 0.6
const ARC_SPAWN_INTERVAL_SEC = 1.5
const ARC_SEGMENTS = 70

export type ArcPhase = 'grow' | 'hold' | 'fade'

export interface ArcState {
  verts: THREE.Vector3[]
  lines: THREE.Line[]
  geo: THREE.BufferGeometry
  mats: THREE.ShaderMaterial[]
  SEG: number
  prog: number
  draw: number
  age: number
  phase: ArcPhase
  el: HTMLDivElement
  labelIndex: number
  R: number
}

function createArcMaterials(col: THREE.Color): THREE.ShaderMaterial[] {
  return HERO_GLOBE_ARC_LINE_OFFSETS.map(([x, y]) =>
    new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: col.clone() },
        uOpacity: { value: 0 },
        uPxOffset: { value: new THREE.Vector2(x, y) },
        uResolution: { value: new THREE.Vector2(1, 1) },
      },
      transparent: true,
      depthWrite: false,
      vertexShader: HERO_GLOBE_ARC_VERTEX_SHADER,
      fragmentShader: HERO_GLOBE_ARC_FRAGMENT_SHADER,
    }),
  )
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
  const verts: THREE.Vector3[] = []
  const h = 0.16 + Math.random() * 0.12

  for (let i = 0; i <= ARC_SEGMENTS; i++) {
    const t = i / ARC_SEGMENTS
    const s0 = Math.sin((1 - t) * omega) / so
    const s1 = Math.sin(t * omega) / so
    const v = new THREE.Vector3(a.x * s0 + b.x * s1, a.y * s0 + b.y * s1, a.z * s0 + b.z * s1)
      .normalize()
      .multiplyScalar(R * (1 + h * Math.sin(Math.PI * t)))
    verts.push(v)
  }

  const posArr = new Float32Array((ARC_SEGMENTS + 1) * 3)
  const radArr = new Float32Array((ARC_SEGMENTS + 1) * 3)
  for (let i = 0; i <= ARC_SEGMENTS; i++) {
    const radial = verts[i].clone().normalize()
    const o = i * 3
    posArr[o] = verts[i].x
    posArr[o + 1] = verts[i].y
    posArr[o + 2] = verts[i].z
    radArr[o] = radial.x
    radArr[o + 1] = radial.y
    radArr[o + 2] = radial.z
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(posArr, 3))
  geo.setAttribute('aRadial', new THREE.BufferAttribute(radArr, 3))
  geo.setDrawRange(0, 1)

  const tMid = (verts[Math.floor(ARC_SEGMENTS / 2)].x / R + 1) * 0.5
  const col = new THREE.Color().setHSL(0.05 + tMid * 0.05, 0.85, 0.68)
  const mats = createArcMaterials(col)
  const lines = mats.map(m => new THREE.Line(geo, m))
  lines.forEach(line => group.add(line))

  const el = createGlobeLabel(labelRoot, labelIndex)
  return {
    verts,
    lines,
    geo,
    mats,
    SEG: ARC_SEGMENTS,
    prog: 0,
    draw: 0,
    age: 0,
    phase: 'grow',
    el,
    labelIndex,
    R,
  }
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

  for (let i = arcs.length - 1; i >= 0; i--) {
    const A = arcs[i]
    A.age += dt

    if (A.phase === 'grow') {
      A.prog = Math.min(1, A.prog + dt / ARC_GROW_SEC)
      const e = A.prog * A.prog * (3.0 - 2.0 * A.prog)
      A.draw = e
      A.geo.setDrawRange(0, Math.max(1, Math.round(e * A.SEG) + 1))
      const opG = Math.min(ARC_MAX_OPACITY, A.mats[0].uniforms.uOpacity.value + dt * ARC_OPACITY_RAMP)
      A.mats.forEach(m => {
        m.uniforms.uOpacity.value = opG
        m.uniforms.uResolution.value.set(W, H)
      })
      if (A.prog >= 1) {
        A.phase = 'hold'
        A.draw = 1
      }
    } else if (A.phase === 'hold') {
      A.mats.forEach(m => m.uniforms.uResolution.value.set(W, H))
      if (A.age > ARC_HOLD_AGE_SEC) A.phase = 'fade'
    } else {
      const opF = Math.max(0, A.mats[0].uniforms.uOpacity.value - dt * ARC_FADE_RATE)
      A.mats.forEach(m => {
        m.uniforms.uOpacity.value = opF
        m.uniforms.uResolution.value.set(W, H)
      })
      A.el.style.opacity = '0'
      if (opF <= 0) {
        A.lines.forEach(line => group.remove(line))
        A.geo.dispose()
        A.mats.forEach(m => m.dispose())
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
    A.lines.forEach(line => group.remove(line))
    A.geo.dispose()
    A.mats.forEach(m => m.dispose())
    A.el.remove()
  }
  arcs.length = 0
}
