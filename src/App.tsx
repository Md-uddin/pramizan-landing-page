import { MotionConfig, motion } from 'motion/react'
import { Header } from './components/Header'
import { SystemGraph } from './components/SystemGraph'
import { Reveal, rise, stagger, viewport } from './components/Reveal'
import { ArrowDown, ArrowUp, ArrowUpRight, CubeIcon, DevicesIcon, FlowIcon } from './components/Icons'

const capabilities = [
  {
    icon: <CubeIcon />,
    title: 'AI product engineering',
    body: 'Develop practical AI capabilities around your product goals, user needs, and business context. We help turn an idea into working software, with attention to how it behaves and where it fits in the wider product.',
  },
  {
    icon: <DevicesIcon />,
    title: 'Web and mobile development',
    body: 'Build new applications or extend existing products with interfaces and functionality shaped around how people use them. We connect the experience people see with the application logic and AI capabilities behind it.',
  },
  {
    icon: <FlowIcon />,
    title: 'Integration and automation',
    body: 'Connect AI with existing software, data, and workflows to support useful automation and reduce repetitive work. We consider the systems you already rely on, so new functionality works within your business context.',
  },
]

const principles = [
  ['A direct working relationship', 'Communicate with the people doing the work, so questions and decisions stay close to implementation.'],
  ['Clarity from the outset', 'Define priorities, scope, and responsibilities together, with a shared understanding of what we are building.'],
  ['Progress you can review', 'Make room for regular reviews and feedback, keeping you involved as the solution takes shape.'],
  ['Engineering that fits', 'Develop with your existing product and systems in mind, considering how the new work connects with what is already there.'],
]

const steps = [
  ['Understand', 'Clarify the business need, existing systems, and where AI can be useful.'],
  ['Define', 'Agree on the scope, technical approach, and a practical first milestone.'],
  ['Build and refine', 'Develop the solution, review progress together, and test and refine it against the agreed requirements.'],
]

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <a className="skip-link" href="#main">Skip to content</a>
      <Header />

      <main id="main">
        <section className="hero wrap" id="top" aria-labelledby="hero-title">
          <div className="hero-copy">
            <h1 id="hero-title">
              <span className="line"><span>Your AI engineering partner.</span></span>
              <span className="line line--accent"><span>An extension of your team.</span></span>
            </h1>
            <p className="hero-intro">We help you build AI-enabled products and integrate AI into existing software—with specialist engineering, clear communication, and ownership of delivery.</p>
            <div className="hero-actions">
              <a className="button" href="#contact">
                <span>Discuss your project</span>
                <span className="button-icon" aria-hidden="true"><ArrowUpRight /></span>
              </a>
              <a className="text-link text-link--down" href="#capabilities"><span>Explore our capabilities</span><ArrowDown /></a>
            </div>
          </div>

          <figure className="hero-art" aria-hidden="true">
            <SystemGraph />
            <figcaption className="art-caption">
              <span>Your product</span><span>AI layer</span><span>Your systems</span>
            </figcaption>
          </figure>

          <div className="hero-note">
            <span>Built around your product.</span>
            <span>Connected to your business.</span>
          </div>
        </section>

        <section className="section wrap" id="capabilities" aria-labelledby="capabilities-title">
          <div className="section-head">
            <Reveal as="h2"><span id="capabilities-title">Practical AI.<br /><em>Thoughtful engineering.</em></span></Reveal>
            <Reveal as="p" className="section-intro">From a defined part of an existing product to a new application, we bring software development and applied AI together around what your business needs.</Reveal>
          </div>
          <motion.ul className="capability-list" role="list" variants={stagger} initial="hidden" whileInView="shown" viewport={viewport}>
            {capabilities.map((c) => (
              <motion.li className="capability" key={c.title} variants={rise}>
                <div className="capability-icon">{c.icon}</div>
                <h3>{c.title}</h3>
                <p>{c.body}</p>
              </motion.li>
            ))}
          </motion.ul>
        </section>

        <section className="relationship" id="how-we-work" aria-labelledby="relationship-title">
          <div className="wrap relationship-inner">
            <motion.div className="relationship-copy" variants={stagger} initial="hidden" whileInView="shown" viewport={viewport}>
              <motion.h2 id="relationship-title" variants={rise}>Specialist capability.<br />Shared context.<br /><em>Clear ownership.</em></motion.h2>
              <motion.p variants={rise}>We work as an extension of your team: close enough to understand the wider product, with responsibility for an agreed scope of engineering work.</motion.p>
              <motion.p variants={rise}>You gain specialist capability without needing to assemble and manage a dedicated AI engineering team. Together, we keep the work connected to your priorities and make technical decisions with the broader product in mind. The starting point is the work you need delivered, whether your team needs focused support or a broader engineering contribution.</motion.p>
            </motion.div>
            <motion.ul className="principles" role="list" variants={stagger} initial="hidden" whileInView="shown" viewport={viewport}>
              {principles.map(([title, body]) => (
                <motion.li className="principle" key={title} variants={rise}>
                  <h3>{title}</h3>
                  <p>{body}</p>
                </motion.li>
              ))}
            </motion.ul>
          </div>
        </section>

        <section className="section process-section wrap" id="process" aria-labelledby="process-title">
          <div className="section-head section-head--process">
            <Reveal as="h2"><span id="process-title">A clear path to <em>working software.</em></span></Reveal>
          </div>
          <motion.ol className="process" variants={stagger} initial="hidden" whileInView="shown" viewport={viewport}>
            <motion.span
              className="process-track"
              aria-hidden="true"
              variants={{
                hidden: { '--fill': 0 } as never,
                shown: { '--fill': 1, transition: { duration: 1.6, ease: [0.77, 0, 0.175, 1], delay: 0.2 } } as never,
              }}
            />
            {steps.map(([title, body], i) => (
              <motion.li key={title} variants={rise}>
                <span className="step"><span className="step-dot" aria-hidden="true" />Step 0{i + 1}</span>
                <h3>{title}</h3>
                <p>{body}</p>
              </motion.li>
            ))}
          </motion.ol>
        </section>

        <section className="contact wrap" id="contact" aria-labelledby="contact-title">
          <Reveal className="contact-shell">
            <div className="contact-panel">
              <div className="contact-copy">
                <h2 id="contact-title">Let’s talk about<br /><em>what you’re building.</em></h2>
                <p>Tell us about your product, the challenge you’re solving, or where you want to introduce AI.</p>
              </div>
              <div className="contact-action">
                {/* Replace with: <a className="email-button" href="mailto:YOUR_REAL_EMAIL">…</a> — see README */}
                <button className="email-button" type="button" disabled aria-describedby="email-status">
                  <span>[Contact Email]</span>
                  <span className="button-icon" aria-hidden="true"><ArrowUpRight /></span>
                </button>
                <p id="email-status">Preview only — contact email to be added.</p>
              </div>
            </div>
          </Reveal>
        </section>
      </main>

      <footer className="footer">
        <div className="wrap footer-row">
          <span className="wordmark"><span className="brand-mark" aria-hidden="true" /><span className="wordmark-name"><strong>PRAMIZAN</strong> PRIVATE LIMITED</span></span>
          <p>AI product engineering. Built together.</p>
          <a className="text-link text-link--up" href="#top"><span>Back to top</span><ArrowUp /></a>
        </div>
        <div className="footer-giant wrap" aria-hidden="true">PRAMIZAN</div>
      </footer>
    </MotionConfig>
  )
}
