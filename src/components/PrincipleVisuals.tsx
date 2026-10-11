import { motion } from 'motion/react'

const ease = [0.23, 1, 0.32, 1] as const
const inView = { once: true, margin: '0px 0px -15% 0px' }

/** "A direct working relationship": your team and ours on one line, no relay in between. */
export function DirectLineVisual() {
  return (
    <svg viewBox="0 0 200 140" aria-hidden="true">
      <motion.path
        className="pv-line"
        d="M40 70H160"
        initial={{ pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={inView}
        transition={{ duration: 1.2, ease, delay: 0.3 }}
      />
      {[40, 160].map((cx, i) => (
        <motion.g
          key={cx}
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={inView}
          transition={{ duration: 0.7, ease, delay: 0.1 + i * 0.15 }}
          style={{ transformOrigin: `${cx}px 70px` }}
        >
          <circle className="pv-node" cx={cx} cy="70" r="20" />
          <circle className={i === 1 ? 'pv-node pv-node--blue' : 'pv-node'} cx={cx} cy="70" r="7" />
        </motion.g>
      ))}
      <motion.circle
        className="pv-node pv-node--blue"
        r="3"
        cy="70"
        initial={{ cx: 60, opacity: 0 }}
        whileInView={{ cx: [60, 140], opacity: [0, 1, 1, 0] }}
        viewport={{ margin: '0px 0px -15% 0px' }}
        transition={{ duration: 2.4, ease: 'easeInOut', repeat: Infinity, repeatDelay: 0.8, delay: 1.4 }}
      />
    </svg>
  )
}

/** "Engineering that fits": the brand's pillar and arc sliding together. */
export function FitVisual() {
  return (
    <svg viewBox="0 0 200 140" aria-hidden="true">
      <g transform="translate(25 -6.5) scale(1.5)">
        <circle className="pv-ghost" cx="51" cy="38" r="24" />
        <motion.path
          className="pv-pillar"
          d="M47 30V88H37A12 12 0 0 1 25 76V42A12 12 0 0 1 37 30Z"
          initial={{ x: -18, opacity: 0 }}
          whileInView={{ x: 0, opacity: 1 }}
          viewport={inView}
          transition={{ type: 'spring', duration: 1.1, bounce: 0.18, delay: 0.25 }}
        />
        <motion.path
          className="pv-arc"
          d="M51 14A24 24 0 0 1 51 62Z"
          initial={{ x: 20, opacity: 0 }}
          whileInView={{ x: 0, opacity: 1 }}
          viewport={inView}
          transition={{ type: 'spring', duration: 1.1, bounce: 0.18, delay: 0.4 }}
        />
      </g>
    </svg>
  )
}
