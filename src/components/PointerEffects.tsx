import { useEffect, useState } from 'react'
import { motion, useMotionValue, useReducedMotion, useSpring } from 'motion/react'

const finePointer = '(hover: hover) and (pointer: fine)'

/**
 * Page-wide pointer effects, mouse only:
 *  1. A soft brand-blue light that trails the cursor on springs, sitting
 *     behind the content so it only tints the paper.
 *  2. Spotlights: inside any [data-spotlight-group], every [data-spotlight]
 *     child gets --mx/--my set to the pointer position relative to itself.
 *     CSS uses them for border light and surface glow (see styles.css).
 */
export function PointerEffects() {
  const reduce = useReducedMotion()
  const [enabled, setEnabled] = useState(false)
  const [visible, setVisible] = useState(false)

  const x = useMotionValue(-1000)
  const y = useMotionValue(-1000)
  const glowX = useSpring(x, { stiffness: 90, damping: 22, mass: 0.6 })
  const glowY = useSpring(y, { stiffness: 90, damping: 22, mass: 0.6 })

  useEffect(() => {
    const mq = window.matchMedia(finePointer)
    const update = () => setEnabled(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    if (!enabled) return

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      x.set(e.clientX)
      y.set(e.clientY)
      setVisible(true)

      const group = (e.target as Element | null)?.closest?.('[data-spotlight-group]')
      if (!group) return
      group.querySelectorAll<HTMLElement>('[data-spotlight]').forEach((el) => {
        const r = el.getBoundingClientRect()
        el.style.setProperty('--mx', `${(e.clientX - r.left).toFixed(0)}px`)
        el.style.setProperty('--my', `${(e.clientY - r.top).toFixed(0)}px`)
      })
    }
    const onLeave = () => setVisible(false)

    window.addEventListener('pointermove', onMove, { passive: true })
    document.documentElement.addEventListener('pointerleave', onLeave)
    return () => {
      window.removeEventListener('pointermove', onMove)
      document.documentElement.removeEventListener('pointerleave', onLeave)
    }
  }, [enabled, x, y])

  if (!enabled || reduce) return null

  return (
    <motion.div
      className="cursor-glow"
      aria-hidden="true"
      style={{ x: glowX, y: glowY }}
      initial={{ opacity: 0 }}
      animate={{ opacity: visible ? 1 : 0 }}
      transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
    />
  )
}
