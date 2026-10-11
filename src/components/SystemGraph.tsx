import { useEffect, useMemo, useRef } from 'react'
import {
  animate,
  useAnimationFrame,
  useInView,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from 'motion/react'

/*
 * Three stacked planes rendered in 3D:
 *   bottom — your business systems
 *   middle — the AI layer (brand blue)
 *   top    — your product
 * Signals travel upward through the layers. The stack turns slowly, leans
 * toward the cursor on springs, and assembles itself on first paint.
 *
 * Everything is projected by hand each frame and written straight to SVG
 * attributes through refs, so React never re-renders while it animates.
 */

type Vec3 = [number, number, number]
type Layer = 0 | 1 | 2
type GraphNode = { layer: Layer; p: Vec3; core?: boolean }
type Edge = { a: number; b: number }

const LAYER_Y = [-1.15, 0, 1.15]
const HALF = 1.05 // half-size of each plane
const VIEW = 560
const CX = VIEW / 2
const CY = VIEW / 2 + 10
const CAMERA = 6.2
const FOCAL = 830
const PULSES = 6

function seeded(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function buildGraph() {
  const rand = seeded(11)
  const jitter = (amount: number) => (rand() - 0.5) * amount
  const nodes: GraphNode[] = []

  // Systems: a loose 4×4 field
  for (let i = 0; i < 4; i++)
    for (let j = 0; j < 4; j++)
      nodes.push({ layer: 0, p: [-0.72 + i * 0.48 + jitter(0.2), LAYER_Y[0], -0.72 + j * 0.48 + jitter(0.2)] })

  // AI: a ring around a core
  nodes.push({ layer: 1, p: [0, LAYER_Y[1], 0], core: true })
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * Math.PI * 2 + 0.3
    const r = 0.56 + jitter(0.08)
    nodes.push({ layer: 1, p: [Math.cos(a) * r, LAYER_Y[1], Math.sin(a) * r] })
  }

  // Product: a 3×3 interface grid
  for (let i = 0; i < 3; i++)
    for (let j = 0; j < 3; j++)
      nodes.push({ layer: 2, p: [-0.6 + i * 0.6 + jitter(0.14), LAYER_Y[2], -0.6 + j * 0.6 + jitter(0.14)] })

  const dist = (a: GraphNode, b: GraphNode) => Math.hypot(a.p[0] - b.p[0], a.p[2] - b.p[2])
  const nearest = (from: number, layer: Layer, count: number) =>
    nodes
      .map((n, i) => ({ i, d: n.layer === layer && i !== from ? dist(nodes[from], n) : Infinity }))
      .sort((x, y) => x.d - y.d)
      .slice(0, count)
      .filter((x) => x.d < Infinity)
      .map((x) => x.i)

  const seen = new Set<string>()
  const intra: Edge[][] = [[], [], []]
  const inter: Edge[][] = [[], []]
  const link = (list: Edge[], a: number, b: number) => {
    const key = a < b ? `${a}-${b}` : `${b}-${a}`
    if (seen.has(key)) return
    seen.add(key)
    list.push({ a, b })
  }

  nodes.forEach((n, i) => {
    if (n.layer === 1) {
      if (n.core) {
        nodes.forEach((m, j) => m.layer === 1 && j !== i && link(intra[1], i, j))
      } else {
        nearest(i, 1, 2).forEach((j) => !nodes[j].core && link(intra[1], i, j))
        nearest(i, 0, 3).forEach((j) => link(inter[0], j, i))
        nearest(i, 2, 2).forEach((j) => link(inter[1], i, j))
      }
    } else {
      nearest(i, n.layer, 2).forEach((j) => link(intra[n.layer], i, j))
    }
  })
  // The core reaches straight up into the product
  const coreIndex = nodes.findIndex((n) => n.core)
  nearest(coreIndex, 2, 1).forEach((j) => link(inter[1], coreIndex, j))

  // Upward routes for signals: system → AI → product
  const routes: [number, number, number][] = []
  inter[0].forEach(({ a: s, b: ai }) =>
    inter[1].filter((e) => e.a === ai).forEach(({ b: p }) => routes.push([s, ai, p])),
  )

  return { nodes, intra, inter, routes }
}

type Projected = { x: number; y: number; s: number; z: number }

function project(p: Vec3, yaw: number, pitch: number, spread: number): Projected {
  const [x, y0, z] = p
  const y = y0 * spread
  const cy = Math.cos(yaw), sy = Math.sin(yaw)
  const x1 = x * cy - z * sy
  const z1 = x * sy + z * cy
  const cp = Math.cos(pitch), sp = Math.sin(pitch)
  const y2 = y * cp - z1 * sp
  const z2 = y * sp + z1 * cp
  const scale = FOCAL / (CAMERA - z2)
  return { x: CX + x1 * scale, y: CY - y2 * scale, s: scale / (FOCAL / CAMERA), z: z2 }
}

const f = (n: number) => n.toFixed(1)

export function SystemGraph() {
  const graph = useMemo(buildGraph, [])
  const wrapRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const planeRefs = useRef<(SVGPathElement | null)[]>([])
  const gridRefs = useRef<(SVGPathElement | null)[]>([])
  const nodeRefs = useRef<(SVGGElement | null)[]>([])
  const intraRefs = useRef<(SVGLineElement | null)[][]>([[], [], []])
  const interRefs = useRef<(SVGLineElement | null)[][]>([[], []])
  const pulseRefs = useRef<(SVGGElement | null)[]>([])
  const coreRingRef = useRef<SVGCircleElement>(null)

  const reduce = useReducedMotion()
  const inView = useInView(wrapRef, { margin: '120px' })

  const pointerX = useMotionValue(0)
  const pointerY = useMotionValue(0)
  const tiltX = useSpring(pointerX, { stiffness: 50, damping: 16, mass: 1 })
  const tiltY = useSpring(pointerY, { stiffness: 50, damping: 16, mass: 1 })
  const intro = useMotionValue(reduce ? 1 : 0)

  const pulses = useRef(
    Array.from({ length: PULSES }, (_, i) => ({ route: 0, t: 0, speed: 0.3, wait: 0.6 + i * 0.55 })),
  )

  useEffect(() => {
    if (reduce) {
      intro.set(1)
      return
    }
    const controls = animate(intro, 1, { type: 'spring', duration: 1.8, bounce: 0.22, delay: 0.25 })
    return () => controls.stop()
  }, [reduce, intro])

  useEffect(() => {
    if (reduce) return
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return
      const rect = wrapRef.current?.getBoundingClientRect()
      if (!rect) return
      const nx = (e.clientX - (rect.left + rect.width / 2)) / (window.innerWidth / 2)
      const ny = (e.clientY - (rect.top + rect.height / 2)) / (window.innerHeight / 2)
      pointerX.set(Math.max(-1, Math.min(1, nx)))
      pointerY.set(Math.max(-1, Math.min(1, ny)))
    }
    const onLeave = () => {
      pointerX.set(0)
      pointerY.set(0)
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    document.documentElement.addEventListener('pointerleave', onLeave)
    return () => {
      window.removeEventListener('pointermove', onMove)
      document.documentElement.removeEventListener('pointerleave', onLeave)
    }
  }, [reduce, pointerX, pointerY])

  useAnimationFrame((time, delta) => {
    if (!inView && time > 100) return
    const seconds = time / 1000
    const k = intro.get()
    const spread = 0.35 + 0.65 * k
    const yaw = (reduce ? 0.62 : 0.62 + seconds * 0.07 - (1 - k) * 0.9) + tiltX.get() * 0.38
    const pitch = 0.5 + tiltY.get() * 0.14 + (1 - k) * 0.25
    const { nodes, intra, inter, routes } = graph

    if (svgRef.current) svgRef.current.style.opacity = String(Math.min(1, k * 1.4))

    const pts = nodes.map((n) => project(n.p, yaw, pitch, spread))

    // Planes and their inner grid lines
    for (let L = 0; L < 3; L++) {
      const y = LAYER_Y[L]
      const corners = ([[-HALF, -HALF], [HALF, -HALF], [HALF, HALF], [-HALF, HALF]] as const).map(([x, z]) =>
        project([x, y, z], yaw, pitch, spread),
      )
      planeRefs.current[L]?.setAttribute(
        'd',
        `M${corners.map((c) => `${f(c.x)} ${f(c.y)}`).join('L')}Z`,
      )
      let grid = ''
      for (const g of [-0.5, 0, 0.5]) {
        const a = project([g * HALF * 2 * 0.5, y, -HALF], yaw, pitch, spread)
        const b = project([g * HALF * 2 * 0.5, y, HALF], yaw, pitch, spread)
        const c = project([-HALF, y, g * HALF * 2 * 0.5], yaw, pitch, spread)
        const d = project([HALF, y, g * HALF * 2 * 0.5], yaw, pitch, spread)
        grid += `M${f(a.x)} ${f(a.y)}L${f(b.x)} ${f(b.y)}M${f(c.x)} ${f(c.y)}L${f(d.x)} ${f(d.y)}`
      }
      gridRefs.current[L]?.setAttribute('d', grid)
    }

    const placeLine = (el: SVGLineElement | null, a: Projected, b: Projected) => {
      if (!el) return
      el.setAttribute('x1', f(a.x))
      el.setAttribute('y1', f(a.y))
      el.setAttribute('x2', f(b.x))
      el.setAttribute('y2', f(b.y))
    }
    intra.forEach((edges, L) => edges.forEach((e, i) => placeLine(intraRefs.current[L][i], pts[e.a], pts[e.b])))
    inter.forEach((edges, L) => edges.forEach((e, i) => placeLine(interRefs.current[L][i], pts[e.a], pts[e.b])))

    pts.forEach((p, i) => {
      const el = nodeRefs.current[i]
      if (!el) return
      el.setAttribute('transform', `translate(${f(p.x)} ${f(p.y)}) scale(${p.s.toFixed(3)})`)
      el.setAttribute('opacity', (0.55 + Math.max(-0.45, Math.min(0.45, p.z * 0.4))).toFixed(2))
    })

    if (coreRingRef.current && !reduce) {
      const breath = 1 + Math.sin(seconds * 1.6) * 0.12
      coreRingRef.current.setAttribute('r', (17 * breath).toFixed(1))
      coreRingRef.current.setAttribute('opacity', (0.32 - Math.sin(seconds * 1.6) * 0.12).toFixed(2))
    }

    // Signals
    const dt = Math.min(delta, 50) / 1000
    pulses.current.forEach((pulse, i) => {
      const el = pulseRefs.current[i]
      if (!el) return
      if (reduce || routes.length === 0 || k < 0.9) {
        el.setAttribute('opacity', '0')
        return
      }
      if (pulse.wait > 0) {
        pulse.wait -= dt
        el.setAttribute('opacity', '0')
        if (pulse.wait <= 0) {
          pulse.route = Math.floor(Math.random() * routes.length)
          pulse.t = 0
          pulse.speed = 0.28 + Math.random() * 0.16
        }
        return
      }
      pulse.t += dt * pulse.speed
      if (pulse.t >= 1) {
        pulse.wait = 0.4 + Math.random() * 1.6
        el.setAttribute('opacity', '0')
        return
      }
      const [s, a, p] = routes[pulse.route]
      const u = pulse.t * 2
      const from = u < 1 ? nodes[s].p : nodes[a].p
      const to = u < 1 ? nodes[a].p : nodes[p].p
      const local = u < 1 ? u : u - 1
      const eased = local < 0.5 ? 4 * local ** 3 : 1 - (-2 * local + 2) ** 3 / 2
      const pos: Vec3 = [
        from[0] + (to[0] - from[0]) * eased,
        from[1] + (to[1] - from[1]) * eased,
        from[2] + (to[2] - from[2]) * eased,
      ]
      const q = project(pos, yaw, pitch, spread)
      el.setAttribute('transform', `translate(${f(q.x)} ${f(q.y)}) scale(${q.s.toFixed(3)})`)
      el.setAttribute('opacity', Math.sin(Math.PI * pulse.t).toFixed(2))
    })
  })

  const { nodes, intra, inter } = graph
  const byLayer = (L: Layer) => nodes.map((n, i) => ({ n, i })).filter(({ n }) => n.layer === L)

  return (
    <div className="system-graph" ref={wrapRef}>
      <svg ref={svgRef} viewBox={`0 0 ${VIEW} ${VIEW}`} fill="none" style={{ opacity: 0 }}>
        <defs>
          <radialGradient id="sg-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0" stopColor="#2b4683" stopOpacity=".18" />
            <stop offset="1" stopColor="#2b4683" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="sg-pulse" cx="50%" cy="50%" r="50%">
            <stop offset="0" stopColor="#5b7fd6" stopOpacity=".55" />
            <stop offset="1" stopColor="#5b7fd6" stopOpacity="0" />
          </radialGradient>
        </defs>
        <ellipse cx={CX} cy={CY} rx="250" ry="210" fill="url(#sg-glow)" />

        {([0, 1, 2] as Layer[]).map((L) => (
          <g key={L}>
            <path ref={(el) => { planeRefs.current[L] = el }} className={`sg-plane sg-plane--${L}`} />
            <path ref={(el) => { gridRefs.current[L] = el }} className={`sg-grid sg-grid--${L}`} />
            {intra[L].map((_, i) => (
              <line key={i} ref={(el) => { intraRefs.current[L][i] = el }} className={`sg-edge sg-edge--${L}`} />
            ))}
            {byLayer(L).map(({ n, i }) => (
              <g key={i} ref={(el) => { nodeRefs.current[i] = el }}>
                {L === 0 && <rect x="-3.5" y="-3.5" width="7" height="7" rx="1.5" className="sg-node sg-node--system" />}
                {L === 1 && n.core && (
                  <>
                    <circle ref={coreRingRef} r="17" className="sg-core-ring" />
                    <circle r="9" className="sg-node sg-node--core" />
                  </>
                )}
                {L === 1 && !n.core && <circle r="5" className="sg-node sg-node--ai" />}
                {L === 2 && <circle r="4.5" className="sg-node sg-node--product" />}
              </g>
            ))}
            {L < 2 &&
              inter[L].map((_, i) => (
                <line key={`x${i}`} ref={(el) => { interRefs.current[L][i] = el }} className="sg-link" />
              ))}
          </g>
        ))}

        {Array.from({ length: PULSES }, (_, i) => (
          <g key={i} ref={(el) => { pulseRefs.current[i] = el }} opacity="0">
            <circle r="14" fill="url(#sg-pulse)" />
            <circle r="3.4" className="sg-pulse" />
          </g>
        ))}
      </svg>
    </div>
  )
}
