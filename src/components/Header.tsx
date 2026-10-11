import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from 'motion/react'
import { ArrowUpRight } from './Icons'
import { Wordmark } from './Logo'
import { Magnetic } from './Magnetic'

const links = [
  { href: '#capabilities', label: 'Capabilities' },
  { href: '#how-we-work', label: 'How we work' },
  { href: '#process', label: 'Process' },
  { href: '#contact', label: 'Contact' },
]

const ease = [0.23, 1, 0.32, 1] as const

export function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const { scrollY } = useScroll()
  useMotionValueEvent(scrollY, 'change', (y) => setScrolled(y > 24))

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    const mq = window.matchMedia('(min-width: 721px)')
    const onWide = () => mq.matches && setOpen(false)
    window.addEventListener('keydown', onKey)
    mq.addEventListener('change', onWide)
    return () => {
      window.removeEventListener('keydown', onKey)
      mq.removeEventListener('change', onWide)
    }
  }, [open])

  return (
    <header className={`site-header${scrolled ? ' is-scrolled' : ''}${open ? ' menu-open' : ''}`}>
      <div className="header-bar wrap">
        <a className="wordmark" href="#top" aria-label="PRAMIZAN PRIVATE LIMITED, home">
          <Wordmark />
        </a>
        <nav className="nav" aria-label="Main navigation">
          {links.map((l) => <a key={l.href} href={l.href}>{l.label}</a>)}
        </nav>
        <span className="header-cta">
          <Magnetic strength={0.18} max={6}>
            <a className="button button--compact" href="#contact">
              <span>Discuss your project</span>
              <span className="button-icon" aria-hidden="true"><ArrowUpRight /></span>
            </a>
          </Magnetic>
        </span>
        <button
          className="menu-toggle"
          type="button"
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen((v) => !v)}
        >
          <span className="visually-hidden">Menu</span>
          <span className="menu-toggle-lines" aria-hidden="true"><span /><span /></span>
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            className="mobile-menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.2 } }}
            transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
            onClick={(e) => (e.target as HTMLElement).closest('a') && setOpen(false)}
          >
            <motion.nav
              aria-label="Mobile navigation"
              initial="hidden"
              animate="shown"
              variants={{ shown: { transition: { staggerChildren: 0.05, delayChildren: 0.05 } } }}
            >
              {links.map((l) => (
                <motion.a
                  key={l.href}
                  href={l.href}
                  variants={{
                    hidden: { opacity: 0, y: 24 },
                    shown: { opacity: 1, y: 0, transition: { duration: 0.6, ease } },
                  }}
                >
                  {l.label}
                </motion.a>
              ))}
            </motion.nav>
            <a className="button" href="#contact">
              <span>Discuss your project</span>
              <span className="button-icon" aria-hidden="true"><ArrowUpRight /></span>
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
