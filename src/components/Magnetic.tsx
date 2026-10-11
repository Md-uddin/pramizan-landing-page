import { useRef, type ReactNode } from 'react'
import { motion, useReducedMotion, useSpring } from 'motion/react'

/** Pulls its child a few pixels toward the cursor, then springs back. Mouse only. */
export function Magnetic({ children, strength = 0.22, max = 10 }: { children: ReactNode; strength?: number; max?: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const reduce = useReducedMotion()
  const spring = { stiffness: 260, damping: 20, mass: 0.6 }
  const x = useSpring(0, spring)
  const y = useSpring(0, spring)
  const clamp = (v: number) => Math.max(-max, Math.min(max, v))

  return (
    <motion.span
      ref={ref}
      className="magnetic"
      style={{ x, y }}
      onPointerMove={(e) => {
        if (reduce || e.pointerType !== 'mouse' || !ref.current) return
        const r = ref.current.getBoundingClientRect()
        x.set(clamp((e.clientX - (r.left + r.width / 2)) * strength))
        y.set(clamp((e.clientY - (r.top + r.height / 2)) * strength))
      }}
      onPointerLeave={() => {
        x.set(0)
        y.set(0)
      }}
    >
      {children}
    </motion.span>
  )
}
