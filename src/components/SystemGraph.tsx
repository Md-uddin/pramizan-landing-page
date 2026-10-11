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
 * Three stacked planes rendered in 3D, each with its own character:
 *   bottom — your systems: a dotted data floor with data pillars rising from it
 *   middle — the AI layer: a ring of nodes around a breathing core
 *   top    — your product: an interface wireframe (bar, sidebar, cards)
 * Signals travel upward from a pillar, through the AI layer, into a card,
 * which lights up as the signal lands. The stack turns slowly, leans toward
 * the cursor on springs, and assembles itself on first paint.
 *
 * Everything is projected by hand each frame and written straight to SVG
 * attributes through refs, so React never re-renders while it animates.
 */

type Vec3 = [number, number, number]
type Layer = 0 | 1 | 2
type GraphNode = { layer: Layer; p: Vec3; base?: Vec3; core?: boolean; tile?: number }
type Edge = { a: number; b: number }
type Tile = { x0: number; z0: number; x1: number; z1: number; lines: number }

const LAYER_Y = [-1.15, 0, 1.15]
const HALF = 1.05 // half-size of each plane
const VIEW = 560
const CX = VIEW / 2
const CY = VIEW / 2 + 10
const CAMERA = 6.2
const FOCAL = 830
const PULSES = 6
const FLOOR_DOTS = 10

// Product interface layout, in plane coordinates (x across, z deep)
const TILES: Tile[] = [
  { x0: -0.9, z0: -0.9, x1: 0.9, z1: -0.68, lines: 0 },  // top bar
  { x0: -0.9, z0: -0.55, x1: -0.42, z1: 0.9, lines: 4 }, // sidebar
  { x0: -0.3, z0: -0.55, x1: 0.26, z1: 0.08, lines: 2 }, // card
  { x0: 0.36, z0: -0.55, x1: 0.9, z1: 0.08, lines: 2 },  // card
  { x0: -0.3, z0: 0.2, x1: 0.9, z1: 0.9, lines: 3 },     // wide card
]

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

  // Systems: data pillars of varied height on a loose 4×4 field
  for (let i = 0; i < 4; i++)
    for (let j = 0; j < 4; j++) {
      const x = -0.72 + i * 0.48 + jitter(0.2)
      const z = -0.72 + j * 0.48 + jitter(0.2)
      const h = 0.08 + rand() * 0.42
      nodes.push({ layer: 0, base: [x, LAYER_Y[0], z], p: [x, LAYER_Y[0] + h, z] })
    }

  // AI: a ring around a core
  nodes.push({ layer: 1, p: [0, LAYER_Y[1], 0], core: true })
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * Math.PI * 2 + 0.3
    const r = 0.56 + jitter(0.08)
    nodes.push({ layer: 1, p: [Math.cos(a) * r, LAYER_Y[1], Math.sin(a) * r] })
  }

  // Product: one anchor at the centre of each interface tile (not the top bar)
  TILES.forEach((t, i) => {
    if (i === 0) return
    nodes.push({ layer: 2, tile: i, p: [(t.x0 + t.x1) / 2, LAYER_Y[2], (t.z0 + t.z1) / 2] })
  })

  const dist = (a: GraphNode, b: GraphNode) => Math.hypot(a.p[0] - b.p[0], a.p[2] - b.p[2])
  const nearest = (from: number, layer: Layer, count: number) =>
    nodes
      .map((n, i) => ({ i, d: n.layer === layer && i !== from ? dist(nodes[from], n) : Infinity }))
      .sort((x, y) => x.d - y.d)
      .slice(0, count)
      .filter((x) => x.d < Infinity)
      .map((x) => x.i)

  const seen = new Set<string>()
  const floor: Edge[] = []
  const ai: Edge[] = []
  const up: Edge[][] = [[], []]
  const link = (list: Edge[], a: number, b: number) => {
    const key = a < b ? `${a}-${b}` : `${b}-${a}`
    if (seen.has(key)) return
    seen.add(key)
    list.push({ a, b })
  }

  nodes.forEach((n, i) => {
    if (n.layer === 0) nearest(i, 0, 2).forEach((j) => link(floor, i, j))
    if (n.layer !== 1) return
    if (n.core) {
      nodes.forEach((m, j) => m.layer === 1 && j !== i && link(ai, i, j))
      nearest(i, 2, 1).forEach((j) => link(up[1], i, j))
    } else {
      nearest(i, 1, 2).forEach((j) => !nodes[j].core && link(ai, i, j))
      nearest(i, 0, 3).forEach((j) => link(up[0], j, i))
      nearest(i, 2, 1).forEach((j) => link(up[1], i, j))
    }
  })

  // Upward routes for signals: pillar → AI → interface tile
  const routes: [number, number, number][] = []
  up[0].forEach(({ a: s, b: mid }) =>
    up[1].filter((e) => e.a === mid).forEach(({ b: p }) => routes.push([s, mid, p])),
  )

  return { nodes, floor, ai, up, routes }
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
const pt = (p: Projected) => `${f(p.x)} ${f(p.y)}`

export function SystemGraph() {
  const graph = useMemo(buildGraph, [])
  const wrapRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const planeRefs = useRef<(SVGPathElement | null)[]>([])
  const floorDotsRef = useRef<SVGPathElement>(null)
  const stemsRef = useRef<SVGPathElement>(null)
  const aiGridRef = useRef<SVGPathElement>(null)
  const tileRefs = useRef<(SVGPathElement | null)[]>([])
  const tileFlashRefs = useRef<(SVGPathElement | null)[]>([])
  const tileLinesRef = useRef<SVGPathElement>(null)
  const nodeRefs = useRef<(SVGGElement | null)[]>([])
  const floorRefs = useRef<(SVGLineElement | null)[]>([])
  const aiRefs = useRef<(SVGLineElement | null)[]>([])
  const upRefs = useRef<(SVGLineElement | null)[][]>([[], []])
  const pulseRefs = useRef<(SVGGElement | null)[]>([])
  const coreRingRef = useRef<SVGCircleElement>(null)
  const flash = useRef(TILES.map(() => 0))

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
    const dt = Math.min(delta, 50) / 1000
    const k = intro.get()
    const spread = 0.35 + 0.65 * k
    const yaw = (reduce ? 0.62 : 0.62 + seconds * 0.07 - (1 - k) * 0.9) + tiltX.get() * 0.38
    const pitch = 0.5 + tiltY.get() * 0.14 + (1 - k) * 0.25
    const P = (p: Vec3) => project(p, yaw, pitch, spread)
    const { nodes, floor, ai, up, routes } = graph

    if (svgRef.current) svgRef.current.style.opacity = String(Math.min(1, k * 1.4))

    const pts = nodes.map((n) => P(n.p))
    const bases = nodes.map((n) => (n.base ? P(n.base) : null))

    // Planes
    for (let L = 0; L < 3; L++) {
      const y = LAYER_Y[L]
      const c = [[-HALF, -HALF], [HALF, -HALF], [HALF, HALF], [-HALF, HALF]].map(([x, z]) => P([x, y, z]))
      planeRefs.current[L]?.setAttribute('d', `M${c.map(pt).join('L')}Z`)
    }

    // Bottom: dotted data floor and pillar stems
    let dots = ''
    const step = (HALF * 2) / FLOOR_DOTS
    for (let i = 0; i < FLOOR_DOTS; i++)
      for (let j = 0; j < FLOOR_DOTS; j++) {
        const q = P([-HALF + step * (i + 0.5), LAYER_Y[0], -HALF + step * (j + 0.5)])
        dots += `M${f(q.x - 0.8)} ${f(q.y - 0.8)}h1.6v1.6h-1.6z`
      }
    floorDotsRef.current?.setAttribute('d', dots)
    let stems = ''
    nodes.forEach((_, i) => {
      const b = bases[i]
      if (b) stems += `M${pt(b)}L${pt(pts[i])}`
    })
    stemsRef.current?.setAttribute('d', stems)

    // Middle: dashed construction grid
    let grid = ''
    for (const g of [-0.5, 0, 0.5]) {
      const v = g * HALF
      grid += `M${pt(P([v, 0, -HALF]))}L${pt(P([v, 0, HALF]))}M${pt(P([-HALF, 0, v]))}L${pt(P([HALF, 0, v]))}`
    }
    aiGridRef.current?.setAttribute('d', grid)

    // Top: interface tiles with content lines
    let lines = ''
    TILES.forEach((t, i) => {
      const y = LAYER_Y[2]
      const quad = `M${[P([t.x0, y, t.z0]), P([t.x1, y, t.z0]), P([t.x1, y, t.z1]), P([t.x0, y, t.z1])].map(pt).join('L')}Z`
      tileRefs.current[i]?.setAttribute('d', quad)
      const flashEl = tileFlashRefs.current[i]
      if (flashEl) {
        flash.current[i] = Math.max(0, flash.current[i] - dt * 0.9)
        flashEl.setAttribute('d', quad)
        flashEl.setAttribute('opacity', (flash.current[i] * 0.9).toFixed(2))
      }
      const w = t.x1 - t.x0
      const d = t.z1 - t.z0
      for (let l = 0; l < t.lines; l++) {
        const z = t.z0 + d * (0.22 + l * (0.6 / Math.max(1, t.lines)))
        const len = l === 0 ? 0.55 : 0.75 - l * 0.12
        lines += `M${pt(P([t.x0 + w * 0.14, y, z]))}L${pt(P([t.x0 + w * (0.14 + len * 0.72), y, z]))}`
      }
    })
    tileLinesRef.current?.setAttribute('d', lines)

    const placeLine = (el: SVGLineElement | null, a: Projected, b: Projected) => {
      if (!el) return
      el.setAttribute('x1', f(a.x))
      el.setAttribute('y1', f(a.y))
      el.setAttribute('x2', f(b.x))
      el.setAttribute('y2', f(b.y))
    }
    floor.forEach((e, i) => placeLine(floorRefs.current[i], bases[e.a]!, bases[e.b]!))
    ai.forEach((e, i) => placeLine(aiRefs.current[i], pts[e.a], pts[e.b]))
    up.forEach((edges, L) => edges.forEach((e, i) => placeLine(upRefs.current[L][i], pts[e.a], pts[e.b])))

    pts.forEach((p, i) => {
      const el = nodeRefs.current[i]
      if (!el) return
      el.setAttribute('transform', `translate(${f(p.x)} ${f(p.y)}) scale(${p.s.toFixed(3)})`)
      el.setAttribute('opacity', (0.6 + Math.max(-0.4, Math.min(0.4, p.z * 0.4))).toFixed(2))
    })

    if (coreRingRef.current && !reduce) {
      const breath = Math.sin(seconds * 1.6)
      coreRingRef.current.setAttribute('r', (17 * (1 + breath * 0.12)).toFixed(1))
      coreRingRef.current.setAttribute('opacity', (0.32 - breath * 0.12).toFixed(2))
    }

    // Signals
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
      const [s, a, p] = routes[pulse.route]
      if (pulse.t >= 1) {
        const tile = nodes[p].tile
        if (tile !== undefined) flash.current[tile] = 1
        pulse.wait = 0.4 + Math.random() * 1.6
        el.setAttribute('opacity', '0')
        return
      }
      const u = pulse.t * 2
      const from = u < 1 ? nodes[s].p : nodes[a].p
      const to = u < 1 ? nodes[a].p : nodes[p].p
      const local = u < 1 ? u : u - 1
      const eased = local < 0.5 ? 4 * local ** 3 : 1 - (-2 * local + 2) ** 3 / 2
      const q = P([
        from[0] + (to[0] - from[0]) * eased,
        from[1] + (to[1] - from[1]) * eased,
        from[2] + (to[2] - from[2]) * eased,
      ])
      el.setAttribute('transform', `translate(${f(q.x)} ${f(q.y)}) scale(${q.s.toFixed(3)})`)
      el.setAttribute('opacity', Math.min(1, Math.sin(Math.PI * pulse.t) * 1.6).toFixed(2))
    })
  })

  const { nodes, floor, ai, up } = graph
  const nodesOf = (L: Layer) => nodes.map((n, i) => ({ n, i })).filter(({ n }) => n.layer === L)

  return (
    <div className="system-graph" ref={wrapRef}>
      <svg ref={svgRef} viewBox={`0 0 ${VIEW} ${VIEW}`} fill="none" style={{ opacity: 0 }}>
        <defs>
          <radialGradient id="sg-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0" className="sg-glow-stop" stopOpacity=".16" />
            <stop offset="1" className="sg-glow-stop" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="sg-pulse" cx="50%" cy="50%" r="50%">
            <stop offset="0" className="sg-pulse-stop" stopOpacity=".5" />
            <stop offset="1" className="sg-pulse-stop" stopOpacity="0" />
          </radialGradient>
        </defs>
        <ellipse cx={CX} cy={CY} rx="250" ry="210" fill="url(#sg-glow)" />

        {/* Systems */}
        <path ref={(el) => { planeRefs.current[0] = el }} className="sg-plane sg-plane--0" />
        <path ref={floorDotsRef} className="sg-floor-dots" />
        {floor.map((_, i) => <line key={i} ref={(el) => { floorRefs.current[i] = el }} className="sg-edge sg-edge--0" />)}
        <path ref={stemsRef} className="sg-stem" />
        {nodesOf(0).map(({ i }) => (
          <g key={i} ref={(el) => { nodeRefs.current[i] = el }}>
            <rect x="-4" y="-4" width="8" height="8" rx="1.5" className="sg-node sg-node--system" />
          </g>
        ))}
        {up[0].map((_, i) => <line key={i} ref={(el) => { upRefs.current[0][i] = el }} className="sg-link" />)}

        {/* AI layer */}
        <path ref={(el) => { planeRefs.current[1] = el }} className="sg-plane sg-plane--1" />
        <path ref={aiGridRef} className="sg-grid sg-grid--1" />
        {ai.map((_, i) => <line key={i} ref={(el) => { aiRefs.current[i] = el }} className="sg-edge sg-edge--1" />)}
        {nodesOf(1).map(({ n, i }) => (
          <g key={i} ref={(el) => { nodeRefs.current[i] = el }}>
            {n.core ? (
              <>
                <circle ref={coreRingRef} r="17" className="sg-core-ring" />
                <circle r="9" className="sg-node sg-node--core" />
              </>
            ) : (
              <circle r="5" className="sg-node sg-node--ai" />
            )}
          </g>
        ))}
        {up[1].map((_, i) => <line key={i} ref={(el) => { upRefs.current[1][i] = el }} className="sg-link" />)}

        {/* Product interface */}
        <path ref={(el) => { planeRefs.current[2] = el }} className="sg-plane sg-plane--2" />
        {TILES.map((_, i) => (
          <g key={i}>
            <path ref={(el) => { tileRefs.current[i] = el }} className={i === 0 ? 'sg-tile sg-tile--bar' : 'sg-tile'} />
            <path ref={(el) => { tileFlashRefs.current[i] = el }} className="sg-tile-flash" opacity="0" />
          </g>
        ))}
        <path ref={tileLinesRef} className="sg-tile-lines" />
        {nodesOf(2).map(({ i }) => (
          <g key={i} ref={(el) => { nodeRefs.current[i] = el }}>
            <circle r="3.5" className="sg-node sg-node--product" />
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
