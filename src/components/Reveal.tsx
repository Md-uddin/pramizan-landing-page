import type { ReactNode } from 'react'
import { motion, type Variants } from 'motion/react'

export const ease = [0.23, 1, 0.32, 1] as const

export const rise: Variants = {
  hidden: { opacity: 0, y: 28, filter: 'blur(6px)' },
  shown: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.95, ease } },
}

export const stagger: Variants = {
  hidden: {},
  shown: { transition: { staggerChildren: 0.08 } },
}

export const viewport = { once: true, margin: '0px 0px -10% 0px' }

type Tag = 'div' | 'p' | 'h2' | 'ul' | 'ol' | 'li'

/** Fades a block up as it scrolls into view. */
export function Reveal({ as = 'div', className, children, id }: { as?: Tag; className?: string; children: ReactNode; id?: string }) {
  const Comp = motion[as] as typeof motion.div
  return (
    <Comp id={id} className={className} variants={rise} initial="hidden" whileInView="shown" viewport={viewport}>
      {children}
    </Comp>
  )
}
