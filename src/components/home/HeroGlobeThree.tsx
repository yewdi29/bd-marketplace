'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'
import * as THREE from 'three'
import { computeHeroGlobeLayout } from '@/lib/heroGlobeLayout'
import { type ArcState, disposeArcs, updateArcs } from '@/components/home/heroGlobeArcs'
import { loadLandPolys, samplePoints } from '@/components/home/heroGlobeLand'
import {
  HERO_GLOBE_FRAGMENT_SHADER,
  HERO_GLOBE_VERTEX_SHADER,
} from '@/components/home/heroGlobeShaders'

const GLOBE_RADIUS = 2.0
const SAMPLE_COUNT = 46000

interface HeroGlobeThreeProps {
  active: boolean
}

export default function HeroGlobeThree({ active }: HeroGlobeThreeProps) {
  const mountRef = useRef<HTMLDivElement>(null)
  const labelRef = useRef<HTMLDivElement>(null)
  const activeRef = useRef(active)
  const reducedMotionRef = useRef(false)

  const [layout, setLayout] = useState(() =>
    typeof window !== 'undefined'
      ? computeHeroGlobeLayout(window.innerWidth, window.innerHeight)
      : computeHeroGlobeLayout(1280, 800),
  )

  useEffect(() => {
    activeRef.current = active
  }, [active])

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => {
      reducedMotionRef.current = mq.matches
    }
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  useEffect(() => {
    const onResize = () => {
      setLayout(computeHeroGlobeLayout(window.innerWidth, window.innerHeight))
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    const mount = mountRef.current
    const labelRoot = labelRef.current
    if (!mount || !labelRoot) return

    let cancelled = false
    let raf = 0
    let renderer: THREE.WebGLRenderer | null = null
    let cleanupHover: (() => void) | null = null
    let resizeObserver: ResizeObserver | null = null

    const polys = loadLandPolys()
    const dots = samplePoints(polys, GLOBE_RADIUS, SAMPLE_COUNT)

    const initScene = () => {
      if (cancelled) return

      const W = mount.clientWidth
      const H = mount.clientHeight
      if (W <= 0 || H <= 0) return

      const scene = new THREE.Scene()
      const camera = new THREE.PerspectiveCamera(34, W / H, 0.1, 100)
      camera.position.set(0, 0.45, 9.2)
      camera.lookAt(0, 0, 0)

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      renderer.setSize(W, H)
      renderer.setClearColor(0x000000, 0)
      mount.appendChild(renderer.domElement)

      const group = new THREE.Group()
      group.rotation.x = 0.32
      scene.add(group)

      const positions = new Float32Array(dots.length * 3)
      const rand = new Float32Array(dots.length)
      for (let i = 0; i < dots.length; i++) {
        positions[i * 3] = dots[i].x
        positions[i * 3 + 1] = dots[i].y
        positions[i * 3 + 2] = dots[i].z
        rand[i] = Math.random()
      }

      const geo = new THREE.BufferGeometry()
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
      geo.setAttribute('aRand', new THREE.BufferAttribute(rand, 1))

      const mat = new THREE.ShaderMaterial({
        uniforms: {
          uSize: { value: 8.5 * renderer.getPixelRatio() },
          uHover: { value: new THREE.Vector3(999, 999, 999) },
          uHoverActive: { value: 0 },
          uHoverRadius: { value: 0.42 },
          uHoverPush: { value: 0.06 },
        },
        transparent: true,
        depthWrite: false,
        depthTest: false,
        vertexShader: HERO_GLOBE_VERTEX_SHADER,
        fragmentShader: HERO_GLOBE_FRAGMENT_SHADER,
      })

      group.add(new THREE.Points(geo, mat))

      const raycaster = new THREE.Raycaster()
      const hoverSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), GLOBE_RADIUS)
      const hitPt = new THREE.Vector3()
      const invM = new THREE.Matrix4()
      const hover = { ndc: new THREE.Vector2(), has: false, want: false, active: 0 }

      const dom = renderer.domElement
      dom.style.touchAction = 'none'
      dom.style.cursor = 'default'

      const onMove = (e: MouseEvent | TouchEvent) => {
        const r = dom.getBoundingClientRect()
        const cx = 'touches' in e ? e.touches[0].clientX : e.clientX
        const cy = 'touches' in e ? e.touches[0].clientY : e.clientY
        hover.ndc.x = ((cx - r.left) / r.width) * 2 - 1
        hover.ndc.y = -((cy - r.top) / r.height) * 2 + 1
        hover.has = true
        hover.want = true
      }
      const onLeave = () => {
        hover.want = false
      }

      dom.addEventListener('mousemove', onMove)
      dom.addEventListener('mouseleave', onLeave)
      dom.addEventListener('touchmove', onMove, { passive: true })
      dom.addEventListener('touchend', onLeave)

      cleanupHover = () => {
        dom.removeEventListener('mousemove', onMove)
        dom.removeEventListener('mouseleave', onLeave)
        dom.removeEventListener('touchmove', onMove)
        dom.removeEventListener('touchend', onLeave)
      }

      const landPts = dots.map(d => new THREE.Vector3(d.x, d.y, d.z))
      const arcs: ArcState[] = []
      let lastSpawn = 0
      const tmp = new THREE.Vector3()

      const resize = () => {
        if (!renderer) return
        const w = mount.clientWidth
        const h = mount.clientHeight
        if (w <= 0 || h <= 0) return
        camera.aspect = w / h
        camera.updateProjectionMatrix()
        renderer.setSize(w, h)
        mat.uniforms.uSize.value = 8.5 * renderer.getPixelRatio()
      }

      resizeObserver = new ResizeObserver(resize)
      resizeObserver.observe(mount)

      const clock = new THREE.Clock()

      const loop = () => {
        if (cancelled) return

        const shouldAnimate = activeRef.current && !reducedMotionRef.current
        const dt = shouldAnimate ? Math.min(clock.getDelta(), 0.05) : 0
        const t = clock.elapsedTime
        const w = mount.clientWidth
        const h = mount.clientHeight

        if (shouldAnimate) {
          group.rotation.y += dt * 0.085
          lastSpawn = updateArcs(
            arcs,
            group,
            landPts,
            labelRoot,
            GLOBE_RADIUS,
            dt,
            t,
            lastSpawn,
            camera,
            w,
            h,
            tmp,
          )
        }

        hover.active += ((hover.want ? 1 : 0) - hover.active) * Math.min(1, dt * 7 || 0)
        mat.uniforms.uHoverActive.value = hover.active
        if (hover.has && hover.active > 0.001) {
          raycaster.setFromCamera(hover.ndc, camera)
          if (raycaster.ray.intersectSphere(hoverSphere, hitPt)) {
            invM.copy(group.matrixWorld).invert()
            hitPt.applyMatrix4(invM)
            mat.uniforms.uHover.value.copy(hitPt)
          }
        }

        if (renderer && w > 0 && h > 0) {
          renderer.render(scene, camera)
        }

        raf = requestAnimationFrame(loop)
      }

      loop()

      return () => {
        cleanupHover?.()
        resizeObserver?.disconnect()
        disposeArcs(arcs, group)
        labelRoot.replaceChildren()
        geo.dispose()
        mat.dispose()
        renderer?.dispose()
        try {
          renderer?.forceContextLoss()
        } catch {
          /* ignore */
        }
        if (renderer?.domElement.parentNode === mount) {
          mount.removeChild(renderer.domElement)
        }
      }
    }

    let cleanupScene: (() => void) | undefined

    const tryInit = () => {
      if (cancelled || cleanupScene) return
      if (mount.clientWidth <= 0 || mount.clientHeight <= 0) return
      cleanupScene = initScene()
    }

    tryInit()
    if (!cleanupScene) {
      resizeObserver = new ResizeObserver(tryInit)
      resizeObserver.observe(mount)
    }

    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
      resizeObserver?.disconnect()
      cleanupScene?.()
    }
  }, [])

  const outerStyle: CSSProperties = {
    position: 'absolute',
    left: `${layout.left}px`,
    top: `${layout.top}px`,
    width: layout.size,
    height: layout.size,
    zIndex: 1,
    pointerEvents: 'auto',
  }

  return (
    <div style={outerStyle}>
      <div ref={mountRef} className="absolute inset-0" aria-hidden />
      <div ref={labelRef} className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden />
    </div>
  )
}
