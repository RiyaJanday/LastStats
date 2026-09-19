import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence, useScroll, useMotionValue, useSpring } from 'motion/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import { useGSAP } from '@gsap/react'
import {
  ArrowUpRight,
  Bot,
  Briefcase,
  Calculator,
  CalendarClock,
  ChevronDown,
  ChevronRight,
  Globe,
  LineChart,
  Moon,
  Palette,
  ShieldCheck,
  Sparkles,
  Sun,
} from 'lucide-react'
import '../landing.css'
import logoDataUri from '../assets/logo.png'
import { accentSwatches, getLandingAccentIndex, getLandingTheme, setLandingAccentIndex, setLandingTheme } from '../lib/landingTheme'

// GSAP handles all scroll-triggered set-pieces on this page (parallax
// blobs, the pinned "How It Works" scrollytelling, SplitText title
// reveals, the CTA scrub-in). Motion (Framer) keeps handling the
// interaction-driven bits — magnetic buttons, tilt cards, ripples, the
// theme switcher, the intro shrink, and the headline word reveal.
gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP)

const navLinks = [
  { label: 'Features', href: '#features' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Tools', href: '#tools' },
  { label: 'Testimonials', href: '#testimonials' },
  { label: 'FAQ', href: '#faq' },
  { label: 'Contact', href: '#contact' },
]

const features = [
  { icon: Briefcase, title: 'Portfolio Tracking', description: 'Log every BUY, SELL, SIP, and dividend. Holdings, average NAV, and gains update automatically.' },
  { icon: CalendarClock, title: 'SIP Planning', description: 'Create, pause, and resume SIPs, and see a 5-year projected value for every plan.' },
  { icon: Globe, title: 'Live Market Data', description: 'Real-time Nifty 50, Sensex, S&P 500, and NASDAQ, plus individual stock and fund quotes.' },
  { icon: LineChart, title: 'Algo Engine', description: 'Run Monte Carlo simulations to see a range of possible portfolio outcomes over time.' },
  { icon: Bot, title: 'AI Assistant', description: 'Ask about SIPs, taxes, and strategy in plain language, with Indian market context built in.' },
  { icon: Calculator, title: 'XIRR & CAGR', description: 'Accurate return calculations for irregular SIP cash flows, not just simple average returns.' },
]

const steps = [
  { title: 'Create your account', description: 'Register in seconds with just your email and a password.' },
  { title: 'Add your investments', description: 'Log your holdings and transactions, or set up a new SIP plan.' },
  { title: 'Track and plan ahead', description: 'Watch your portfolio update live and simulate where it could go.' },
]

const testimonials = [
  { quote: 'Seeing my SIP\u2019s projected value alongside real market data finally made compounding click for me.', name: 'Priya S.', role: 'Software Engineer' },
  { quote: 'The Monte Carlo simulator is the first tool that showed me a realistic range of outcomes, not just one number.', name: 'Arjun M.', role: 'Product Manager' },
  { quote: 'I used to track my mutual funds in a spreadsheet. LastStats replaced it in a weekend.', name: 'Neha K.', role: 'Graduate Student' },
]

const faqs = [
  { q: 'Is LastStats free to use?', a: 'Yes. LastStats is currently free to use while it\u2019s in active development.' },
  { q: 'Is this real financial advice?', a: 'No. LastStats is an educational and portfolio-tracking tool. Always consult a SEBI-registered advisor before making investment decisions.' },
  { q: 'Where does the market data come from?', a: 'Live index and stock quotes are pulled from public market data sources and refreshed on demand.' },
  { q: 'Is my data private?', a: 'Your portfolio and account data are tied to your login and are not visible to other users.' },
]

const tickerItems = ['Nifty 50', 'Sensex', 'S&P 500', 'NASDAQ', 'Gold', 'SIP Tracking', 'XIRR & CAGR', 'Monte Carlo Simulations']

const sparkPath = 'M0,38 C20,30 35,42 55,28 C75,15 95,32 115,20 C135,10 150,24 170,12'

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
}

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09 } },
}

export default function LandingPage() {
  const [theme, setThemeState] = useState(getLandingTheme())
  const [accentIndex, setAccentIndex] = useState(getLandingAccentIndex())
  const [showSplash, setShowSplash] = useState(true)
  const accent = accentSwatches[accentIndex]

  useEffect(() => {
    setLandingTheme(theme)
  }, [theme])

  useEffect(() => {
    setLandingAccentIndex(accentIndex)
  }, [accentIndex])

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 900)
    return () => clearTimeout(timer)
  }, [])

  const { scrollYProgress } = useScroll()

  const rootStyle =
    theme === 'custom'
      ? { '--lp-accent': accent.accent, '--lp-accent-2': accent.accent2 }
      : undefined

  return (
    <div className="lp-root" data-lp-theme={theme} style={rootStyle}>
      <AnimatePresence>
        {showSplash && (
          <motion.div className="lp-splash" exit={{ opacity: 0 }} transition={{ duration: 0.5, ease: 'easeInOut' }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              style={{ display: 'flex', alignItems: 'center', gap: 12 }}
            >
              <img src={logoDataUri} alt="LastStats" style={{ height: 64, width: 'auto' }} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        style={{ scaleX: scrollYProgress, position: 'fixed', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, var(--lp-accent), var(--lp-accent-2))', transformOrigin: '0%', zIndex: 60 }}
      />

      <AmbientBlobs />

      <BackgroundLogo />

      <NavBar theme={theme} setTheme={setThemeState} accentIndex={accentIndex} setAccentIndex={setAccentIndex} />

      <Hero />

      <Marquee />

      <Section id="features" eyebrow="Features" title="Everything you need in one place" subtitle="From tracking to planning to insight, LastStats covers the full loop of managing your investments.">
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}
        >
          {features.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </motion.div>
      </Section>

      <HowItWorks />

      <Section id="tools" eyebrow="Tools" title="Built for real decisions, not guesswork" subtitle="Two purpose-built tools sit at the core of LastStats' planning experience.">
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}
        >
          <TiltCard>
            <LineChart size={22} color="var(--lp-accent)" style={{ marginBottom: 12 }} />
            <h3 className="lp-heading" style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Monte Carlo Simulator</h3>
            <p className="lp-muted" style={{ fontSize: 13, lineHeight: 1.65 }}>
              Runs 1,000 simulated futures for your portfolio using your SIP amount, time horizon, and expected return
              and volatility &mdash; then shows you the P10, P50, and P90 outcome bands instead of a single misleading number.
            </p>
          </TiltCard>
          <TiltCard>
            <Bot size={22} color="var(--lp-accent)" style={{ marginBottom: 12 }} />
            <h3 className="lp-heading" style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>AI Investment Assistant</h3>
            <p className="lp-muted" style={{ fontSize: 13, lineHeight: 1.65 }}>
              Ask plain-language questions about SIPs, mutual funds, taxes, and portfolio strategy, with responses
              grounded in Indian market context. Educational only &mdash; always paired with a reminder to consult a professional.
            </p>
          </TiltCard>
        </motion.div>
      </Section>

      <Section id="testimonials" eyebrow="Testimonials" title="What early users are saying">
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}
        >
          {testimonials.map((item) => (
            <motion.div key={item.name} variants={fadeUp} whileHover={{ y: -6 }} className="lp-glass" style={{ padding: 24, textAlign: 'left' }}>
              <p style={{ fontSize: 13, lineHeight: 1.75, marginBottom: 18 }}>&ldquo;{item.quote}&rdquo;</p>
              <p style={{ fontSize: 13, fontWeight: 700 }}>{item.name}</p>
              <p className="lp-muted" style={{ fontSize: 12 }}>{item.role}</p>
            </motion.div>
          ))}
        </motion.div>
      </Section>

      <Section id="faq" eyebrow="FAQ" title="Common questions">
        <div style={{ display: 'grid', gap: 12, maxWidth: 720, margin: '0 auto', textAlign: 'left' }}>
          {faqs.map((item, index) => (
            <FaqItem key={item.q} item={item} index={index} />
          ))}
        </div>
      </Section>

      <CtaBanner />

      <Footer />
    </div>
  )
}

function AmbientBlobs() {
  const wrapRefs = useRef([])
  wrapRefs.current = []
  const addWrapRef = (el) => {
    if (el) wrapRefs.current.push(el)
  }

  // GSAP scroll-linked parallax: each blob drifts at its own speed as
  // the whole page scrolls, layered on top of the existing CSS float
  // animation (which stays on the inner div so the two don't fight
  // over the same transform).
  useGSAP(() => {
    const speeds = [140, -110, 90]
    wrapRefs.current.forEach((el, i) => {
      gsap.to(el, {
        y: speeds[i] ?? 100,
        ease: 'none',
        scrollTrigger: {
          trigger: document.documentElement,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 1.2,
        },
      })
    })
  }, [])

  return (
    <>
      <div ref={addWrapRef} style={{ position: 'absolute', top: -160, right: -120, zIndex: 0 }}>
        <div className="lp-blob lp-blob-a" style={{ position: 'static', width: 480, height: 480, background: 'radial-gradient(circle, var(--lp-accent), transparent 70%)' }} />
      </div>
      <div ref={addWrapRef} style={{ position: 'absolute', top: 420, left: -160, zIndex: 0 }}>
        <div className="lp-blob lp-blob-b" style={{ position: 'static', width: 420, height: 420, background: 'radial-gradient(circle, var(--lp-accent-2), transparent 70%)' }} />
      </div>
      <div ref={addWrapRef} style={{ position: 'absolute', bottom: -140, right: 80, zIndex: 0 }}>
        <div className="lp-blob lp-blob-a" style={{ position: 'static', width: 360, height: 360, background: 'radial-gradient(circle, var(--lp-accent-2), transparent 70%)', animationDelay: '4s' }} />
      </div>
    </>
  )
}

function BackgroundLogo() {
  return (
    <div className="lp-bg-logo" aria-hidden="true">
      <img src={logoDataUri} alt="" />
    </div>
  )
}

function NavBar({ theme, setTheme, accentIndex, setAccentIndex }) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className={`lp-nav ${scrolled ? 'lp-nav-scrolled' : ''}`} style={{ zIndex: 50 }}>
      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src={logoDataUri} alt="LastStats" style={{ height: 40, width: 'auto' }} />
        </div>

        <nav className="lp-nav-links" style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
          {navLinks.map((link) => (
            <a key={link.href} href={link.href} className="lp-nav-link">{link.label}</a>
          ))}
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <ThemeSwitcher theme={theme} setTheme={setTheme} accentIndex={accentIndex} setAccentIndex={setAccentIndex} />
          <MagneticButton to="/login" className="lp-btn">Login</MagneticButton>
          <MagneticButton to="/register" className="lp-btn lp-gradient-btn">Register</MagneticButton>
        </div>
      </div>
    </header>
  )
}

function ThemeSwitcher({ theme, setTheme, accentIndex, setAccentIndex }) {
  const [open, setOpen] = useState(false)
  const modes = [
    { key: 'light', icon: Sun },
    { key: 'dark', icon: Moon },
    { key: 'custom', icon: Palette },
  ]

  return (
    <div style={{ position: 'relative' }}>
      <div className="lp-neu" style={{ display: 'flex', gap: 2, padding: 3, borderRadius: 999 }}>
        {modes.map(({ key, icon: Icon }) => (
          <button
            key={key}
            onClick={() => {
              setTheme(key)
              setOpen(key === 'custom')
            }}
            aria-label={key}
            style={{
              width: 30,
              height: 30,
              borderRadius: '50%',
              border: 'none',
              display: 'grid',
              placeItems: 'center',
              cursor: 'pointer',
              background: theme === key ? 'linear-gradient(135deg, var(--lp-accent), var(--lp-accent-2))' : 'transparent',
              color: theme === key ? '#0a0912' : 'var(--lp-text-muted)',
            }}
          >
            <Icon size={14} />
          </button>
        ))}
      </div>

      <AnimatePresence>
        {open && theme === 'custom' && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.18 }}
            className="lp-glass-strong"
            style={{ position: 'absolute', top: 42, right: 0, padding: 12, display: 'flex', gap: 8, zIndex: 10 }}
            onMouseLeave={() => setOpen(false)}
          >
            {accentSwatches.map((swatch, index) => (
              <button
                key={swatch.name}
                title={swatch.name}
                onClick={() => setAccentIndex(index)}
                className={`lp-swatch ${index === accentIndex ? 'lp-swatch-active' : ''}`}
                style={{ background: `linear-gradient(135deg, ${swatch.accent}, ${swatch.accent2})`, border: 'none', padding: 0 }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function MagneticButton({ to, children, className, style }) {
  const ref = useRef(null)
  const navigate = useNavigate()
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const springX = useSpring(x, { stiffness: 300, damping: 20, mass: 0.4 })
  const springY = useSpring(y, { stiffness: 300, damping: 20, mass: 0.4 })
  const [ripples, setRipples] = useState([])
  const [wiping, setWiping] = useState(false)

  const handleMove = (event) => {
    const rect = ref.current.getBoundingClientRect()
    x.set((event.clientX - rect.left - rect.width / 2) * 0.25)
    y.set((event.clientY - rect.top - rect.height / 2) * 0.25)
  }

  const handleLeave = () => {
    x.set(0)
    y.set(0)
  }

  const handlePointerDown = (event) => {
    const rect = ref.current.getBoundingClientRect()
    const id = Date.now()
    setRipples((prev) => [...prev, { id, x: event.clientX - rect.left, y: event.clientY - rect.top }])
    setTimeout(() => setRipples((prev) => prev.filter((r) => r.id !== id)), 550)
  }

  // Page transition wipe: a full-screen accent panel grows up from the
  // bottom on click, then the route change fires right as it finishes
  // covering the screen, so navigation reads as one motion instead of
  // an abrupt jump-cut. Rendered through a portal so it isn't affected
  // by this button's own x/y transform (which would otherwise become
  // its containing block and break the full-viewport coverage).
  const handleClick = (event) => {
    event.preventDefault()
    if (wiping) return
    setWiping(true)
    setTimeout(() => navigate(to), 480)
  }

  return (
    <>
      <motion.div ref={ref} onMouseMove={handleMove} onMouseLeave={handleLeave} onPointerDown={handlePointerDown} style={{ x: springX, y: springY, display: 'inline-block', position: 'relative' }}>
        <Link to={to} onClick={handleClick} className={className} style={{ position: 'relative', overflow: 'hidden', ...style }}>
          {children}
          {ripples.map((ripple) => (
            <motion.span
              key={ripple.id}
              initial={{ opacity: 0.35, scale: 0 }}
              animate={{ opacity: 0, scale: 4 }}
              transition={{ duration: 0.55, ease: 'easeOut' }}
              style={{
                position: 'absolute',
                left: ripple.x,
                top: ripple.y,
                width: 16,
                height: 16,
                marginLeft: -8,
                marginTop: -8,
                borderRadius: '50%',
                background: 'white',
                pointerEvents: 'none',
              }}
            />
          ))}
        </Link>
      </motion.div>
      {wiping &&
        createPortal(
          <motion.div
            className="lp-page-wipe"
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ duration: 0.48, ease: [0.76, 0, 0.24, 1] }}
          />,
          document.body
        )}
    </>
  )
}

function Headline({ style }) {
  return (
    <motion.h1 variants={fadeUp} className="lp-heading" style={style}>
      Track, plan, and <span className="lp-gradient-text">understand</span><br />your investments in one place
    </motion.h1>
  )
}

function Hero() {
  return (
    <section style={{ maxWidth: 1180, margin: '0 auto', padding: '96px 24px 64px', textAlign: 'center', position: 'relative', zIndex: 1 }}>
      <HeroStatWidget />
      <motion.div variants={stagger} initial="hidden" animate="show">
        <motion.div variants={fadeUp} className="lp-glass" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 16px', fontSize: 12, fontWeight: 700, marginBottom: 26 }}>
          <Sparkles size={13} color="var(--lp-accent)" /> AI-Powered Investment Platform
        </motion.div>

        <Headline style={{ fontSize: 'clamp(34px, 5.5vw, 58px)', fontWeight: 700, lineHeight: 1.12, marginBottom: 20 }} />

        <motion.p variants={fadeUp} className="lp-muted" style={{ fontSize: 16, maxWidth: 620, margin: '0 auto 34px', lineHeight: 1.75 }}>
          LastStats brings your portfolio, SIPs, live market data, and an AI assistant together &mdash;
          so you can see where your money actually stands, not just where you hope it is.
        </motion.p>

        <motion.div variants={fadeUp} style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
          <MagneticButton to="/login" className="lp-btn lp-gradient-btn" style={{ padding: '13px 26px', fontSize: 14 }}>
            Get Started <ChevronRight size={15} />
          </MagneticButton>
          <MagneticButton to="/register" className="lp-btn">Create an account</MagneticButton>
        </motion.div>

        <motion.div variants={fadeUp} className="lp-muted" style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 26, fontSize: 12 }}>
          <ShieldCheck size={14} /> Educational tool &mdash; not financial advice
        </motion.div>
      </motion.div>
    </section>
  )
}

function HeroStatWidget() {
  const wrapRef = useRef(null)
  const numRef = useRef(null)
  const pathRef = useRef(null)
  const rotateX = useMotionValue(0)
  const rotateY = useMotionValue(0)
  const springRX = useSpring(rotateX, { stiffness: 200, damping: 20 })
  const springRY = useSpring(rotateY, { stiffness: 200, damping: 20 })

  // Real-time-feeling hero widget: the number counts up and the little
  // trend line draws itself in on load, like live portfolio data
  // arriving rather than static copy sitting on the page.
  useGSAP(() => {
    const counter = { val: 0 }
    gsap.to(counter, {
      val: 1248320,
      duration: 1.8,
      delay: 0.6,
      ease: 'power2.out',
      onUpdate: () => {
        if (numRef.current) numRef.current.textContent = '\u20b9' + Math.round(counter.val).toLocaleString('en-IN')
      },
    })

    if (pathRef.current) {
      const length = pathRef.current.getTotalLength()
      gsap.set(pathRef.current, { strokeDasharray: length, strokeDashoffset: length })
      gsap.to(pathRef.current, { strokeDashoffset: 0, duration: 1.4, delay: 0.5, ease: 'power2.inOut' })
    }
  }, { scope: wrapRef })

  const handleMove = (event) => {
    const rect = wrapRef.current.getBoundingClientRect()
    const px = (event.clientX - rect.left) / rect.width - 0.5
    const py = (event.clientY - rect.top) / rect.height - 0.5
    rotateY.set(px * 12)
    rotateX.set(py * -12)
  }

  const handleLeave = () => {
    rotateX.set(0)
    rotateY.set(0)
  }

  return (
    <motion.div
      ref={wrapRef}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      initial={{ opacity: 0, y: 30, rotate: -4 }}
      animate={{ opacity: 1, y: 0, rotate: -4 }}
      transition={{ duration: 0.7, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
      style={{ rotateX: springRX, rotateY: springRY, transformPerspective: 900, position: 'absolute', top: 34, right: 'max(2vw, calc(50% - 640px))' }}
      className="lp-clay lp-hero-stat"
    >
      <div style={{ padding: '20px 22px', width: 190, textAlign: 'left' }}>
        <p className="lp-muted" style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Portfolio Value</p>
        <p ref={numRef} className="lp-heading" style={{ fontSize: 22, fontWeight: 700, marginBottom: 10 }}>&#8377;0</p>
        <svg viewBox="0 0 170 46" width="100%" height="40" fill="none">
          <path ref={pathRef} d={sparkPath} stroke="var(--lp-accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <p style={{ fontSize: 11, fontWeight: 700, color: '#3ecf8e', marginTop: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
          <ArrowUpRight size={12} /> +12.4% this year
        </p>
      </div>
    </motion.div>
  )
}

function Marquee() {
  const items = [...tickerItems, ...tickerItems]
  return (
    <div className="lp-marquee lp-glass" style={{ maxWidth: 1180, margin: '0 auto 24px', padding: '14px 0', position: 'relative', zIndex: 1 }}>
      <div className="lp-marquee-track">
        {items.map((item, index) => (
          <span key={index} className="lp-marquee-item">
            <span className="lp-marquee-dot" />
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}

function Section({ id, eyebrow, title, subtitle, children }) {
  const titleRef = useRef(null)

  // GSAP + SplitText: the heading splits into individual words and
  // each one flips up into place in a stagger as it scrolls into view
  // (and reverses cleanly if you scroll back up past it).
  useGSAP(() => {
    if (!titleRef.current) return
    const split = new SplitText(titleRef.current, { type: 'words' })
    gsap.fromTo(
      split.words,
      { opacity: 0, y: 26, rotateX: -50 },
      {
        opacity: 1,
        y: 0,
        rotateX: 0,
        duration: 0.65,
        ease: 'power3.out',
        stagger: 0.06,
        scrollTrigger: {
          trigger: titleRef.current,
          start: 'top 85%',
          toggleActions: 'play none none reverse',
        },
      }
    )
    return () => split.revert()
  }, { scope: titleRef, dependencies: [title] })

  return (
    <section id={id} style={{ padding: '68px 24px', position: 'relative', zIndex: 1, scrollMarginTop: 72 }}>
      <div style={{ maxWidth: 1180, margin: '0 auto', textAlign: 'center' }}>
        <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} style={{ fontSize: 12, fontWeight: 700, color: 'var(--lp-accent)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
          {eyebrow}
        </motion.p>
        <h2 ref={titleRef} className="lp-heading" style={{ fontSize: 'clamp(24px, 3vw, 34px)', fontWeight: 700, marginBottom: subtitle ? 14 : 40, perspective: 600 }}>
          {title}
        </h2>
        {subtitle && (
          <motion.p variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} className="lp-muted" style={{ fontSize: 14, maxWidth: 560, margin: '0 auto 40px', lineHeight: 1.75 }}>
            {subtitle}
          </motion.p>
        )}
        {children}
      </div>
    </section>
  )
}

function FeatureCard({ icon: Icon, title, description }) {
  return (
    <motion.div variants={fadeUp} whileHover={{ y: -6 }} className="lp-glass" style={{ padding: 24, textAlign: 'left' }}>
      <div className="lp-neu lp-feature-icon" style={{ width: 42, height: 42, display: 'grid', placeItems: 'center', marginBottom: 16, borderRadius: 14 }}>
        <Icon size={19} color="var(--lp-accent)" />
      </div>
      <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>{title}</h3>
      <p className="lp-muted" style={{ fontSize: 13, lineHeight: 1.65 }}>{description}</p>
    </motion.div>
  )
}

function TiltCard({ children }) {
  const ref = useRef(null)
  const rotateX = useMotionValue(0)
  const rotateY = useMotionValue(0)
  const springRX = useSpring(rotateX, { stiffness: 200, damping: 18 })
  const springRY = useSpring(rotateY, { stiffness: 200, damping: 18 })

  const handleMove = (event) => {
    const rect = ref.current.getBoundingClientRect()
    const px = (event.clientX - rect.left) / rect.width - 0.5
    const py = (event.clientY - rect.top) / rect.height - 0.5
    rotateY.set(px * 10)
    rotateX.set(py * -10)
  }

  const handleLeave = () => {
    rotateX.set(0)
    rotateY.set(0)
  }

  return (
    <motion.div
      ref={ref}
      variants={fadeUp}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={{ rotateX: springRX, rotateY: springRY, transformPerspective: 800 }}
      className="lp-glass"
    >
      <div style={{ padding: 26, textAlign: 'left' }}>{children}</div>
    </motion.div>
  )
}

function HowItWorks() {
  const containerRef = useRef(null)
  const railFillRef = useRef(null)
  const stepRefs = useRef([])
  stepRefs.current = []
  const addStepRef = (el) => {
    if (el) stepRefs.current.push(el)
  }

  // No pin here — pinning was fighting with the sticky nav above it and
  // getting stuck mid-animation. Instead: the rail fill scrubs smoothly
  // as the list scrolls past, and each step fades/slides in on its own
  // the moment it enters view (same reliable pattern as the section
  // titles and CTA elsewhere on this page), reversing cleanly on scroll-back.
  useGSAP(() => {
    gsap.fromTo(
      railFillRef.current,
      { height: '0%' },
      {
        height: '100%',
        ease: 'none',
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top 75%',
          end: 'bottom 55%',
          scrub: 0.6,
        },
      }
    )

    stepRefs.current.forEach((el) => {
      gsap.fromTo(
        el,
        { opacity: 0, x: -20, scale: 0.97 },
        {
          opacity: 1,
          x: 0,
          scale: 1,
          duration: 0.6,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 85%',
            toggleActions: 'play none none reverse',
          },
        }
      )
    })
  }, { scope: containerRef })

  return (
    <section id="how-it-works" style={{ padding: '68px 24px', position: 'relative', zIndex: 1, scrollMarginTop: 72 }}>
      <div style={{ maxWidth: 1180, margin: '0 auto', textAlign: 'center' }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--lp-accent)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>How It Works</p>
        <h2 className="lp-heading" style={{ fontSize: 'clamp(24px, 3vw, 34px)', fontWeight: 700, marginBottom: 48 }}>Up and running in three steps</h2>
      </div>

      <div ref={containerRef} style={{ maxWidth: 640, margin: '0 auto', position: 'relative', paddingLeft: 44 }}>
        <div className="lp-rail" />
        <div ref={railFillRef} className="lp-rail-fill" style={{ height: 0 }} />
        {steps.map((step, index) => (
          <div key={step.title} ref={addStepRef} style={{ textAlign: 'left', marginBottom: 44, position: 'relative' }}>
            <div
              className="lp-neu"
              style={{
                position: 'absolute',
                left: -44,
                top: 0,
                width: 40,
                height: 40,
                borderRadius: '50%',
                display: 'grid',
                placeItems: 'center',
                fontWeight: 800,
                fontSize: 15,
                color: 'var(--lp-accent)',
              }}
            >
              {index + 1}
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>{step.title}</h3>
            <p className="lp-muted" style={{ fontSize: 13, lineHeight: 1.65 }}>{step.description}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function FaqItem({ item, index }) {
  const [open, setOpen] = useState(index === 0)
  return (
    <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} className="lp-glass" style={{ overflow: 'hidden' }}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '18px 22px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'inherit', fontFamily: 'inherit', textAlign: 'left' }}
      >
        <span style={{ fontSize: 14, fontWeight: 700 }}>{item.q}</span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }} style={{ flexShrink: 0, color: 'var(--lp-accent)' }}>
          <ChevronDown size={16} />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <p className="lp-muted" style={{ fontSize: 13, lineHeight: 1.65, padding: '0 22px 20px' }}>{item.a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function CtaBanner() {
  const boxRef = useRef(null)

  useGSAP(() => {
    gsap.fromTo(
      boxRef.current,
      { opacity: 0, y: 40, scale: 0.94, rotateX: 10 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        rotateX: 0,
        duration: 0.9,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: boxRef.current,
          start: 'top 85%',
          toggleActions: 'play none none reverse',
        },
      }
    )
  }, { scope: boxRef })

  return (
    <section style={{ padding: '24px 24px 80px', position: 'relative', zIndex: 1 }}>
      <div
        ref={boxRef}
        className="lp-glass-strong"
        style={{ maxWidth: 900, margin: '0 auto', padding: '52px 32px', textAlign: 'center', backgroundImage: 'linear-gradient(120deg, var(--lp-accent), var(--lp-accent-2))', backgroundBlendMode: 'overlay', transformPerspective: 800 }}
      >
        <h2 className="lp-heading" style={{ fontSize: 26, fontWeight: 700, marginBottom: 10 }}>Ready to see your full picture?</h2>
        <p className="lp-muted" style={{ fontSize: 14, marginBottom: 26 }}>Log in or create a free account to add your first holding in under a minute.</p>
        <MagneticButton to="/login" className="lp-btn lp-gradient-btn" style={{ padding: '13px 26px', fontSize: 14 }}>
          Get Started <ChevronRight size={15} />
        </MagneticButton>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer id="contact" className="lp-glass" style={{ margin: '0 24px 24px', padding: '28px 24px', position: 'relative', zIndex: 1 }}>
      <div style={{ maxWidth: 1180, margin: '0 auto', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src={logoDataUri} alt="LastStats" style={{ height: 28, width: 'auto' }} />
        </div>
        <p className="lp-muted" style={{ fontSize: 12 }}>Educational only &mdash; not financial advice. Consult a SEBI-registered advisor.</p>
        <p className="lp-muted" style={{ fontSize: 12 }}>&copy; {new Date().getFullYear()} LastStats</p>
      </div>
    </footer>
  )
}
