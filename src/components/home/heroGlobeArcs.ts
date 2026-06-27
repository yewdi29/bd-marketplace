import * as THREE from 'three'
import { createGlobeLabel } from '@/components/home/heroGlobeLabels'

export type ArcPhase = 'grow' | 'hold' | 'fade'

export interface ArcState {
  verts: THREE.Vector3[]
  line: THREE.Line
  geo: THREE.BufferGeometry
  mat: THREE.LineBasicMaterial
  SEG: number
  prog: number
  draw: number
  age: number
  phase: ArcPhase
  el: HTMLDivElement
  R: number
}

export function spawnArc(
  group: THREE.Group,
  landPts: THREE.Vector3[],
  labelRoot: HTMLElement,
  R: number,
): ArcState | null {
  if (landPts.length < 2) return null

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

  const posArr = new Float32Array((SEG + 1) * 3)
  for (let i = 0; i <= SEG; i++) {
    posArr[i * 3] = verts[i].x
    posArr[i * 3 + 1] = verts[i].y
    posArr[i * 3 + 2] = verts[i].z
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(posArr, 3))
  geo.setDrawRange(0, 1)

  const tMid = (verts[Math.floor(SEG / 2)].x / R + 1) * 0.5
  const col = new THREE.Color().setHSL(0.105 + tMid * 0.02, 0.95, 0.55)
  const mat = new THREE.LineBasicMaterial({ color: col, transparent: true, opacity: 0 })
  const line = new THREE.Line(geo, mat)
  group.add(line)

  const el = createGlobeLabel(labelRoot)
  return { verts, line, geo, mat, SEG, prog: 0, draw: 0, age: 0, phase: 'grow', el, R }
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
  if (t - spawnAt > 1.5 && arcs.length < 5) {
    const arc = spawnArc(group, landPts, labelRoot, R)
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
      A.prog = Math.min(1, A.prog + dt / 4.2)
      const e = A.prog * A.prog * (3.0 - 2.0 * A.prog)
      A.draw = e
      A.geo.setDrawRange(0, Math.max(1, Math.round(e * A.SEG) + 1))
      A.mat.opacity = Math.min(0.5, A.mat.opacity + dt * 1.0)
      if (A.prog >= 1) {
        A.phase = 'hold'
        A.draw = 1
      }
    } else if (A.phase === 'hold') {
      if (A.age > 4.2) A.phase = 'fade'
    } else {
      A.mat.opacity = Math.max(0, A.mat.opacity - dt * 0.6)
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
