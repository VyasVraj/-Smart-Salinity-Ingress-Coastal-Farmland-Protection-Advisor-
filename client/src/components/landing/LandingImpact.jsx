import { Reveal } from './Reveal.jsx'

const steps = [
  {
    step: '01',
    title: 'Map',
    body: 'We baseline soil EC, groundwater and elevation across the block.',
  },
  {
    step: '02',
    title: 'Monitor',
    body: 'Probes and satellites track salt movement through the season.',
  },
  {
    step: '03',
    title: 'Warn',
    body: 'Farmers get an SMS or voice alert before intrusion peaks.',
  },
  {
    step: '04',
    title: 'Recover',
    body: 'Leaching, amendment and crop plans restore yields plot by plot.',
  },
]

const marquee = [
  'Mangrove buffers',
  'Salt-tolerant paddy',
  'Tidal sluice timing',
  'Aquifer recharge',
  'Gypsum dosing',
  'Drip + mulch',
  'Bund repair',
  'Agro-advisory SMS',
]

export function LandingImpact() {
  return (
    <section id="impact" className="lp-section lp-section-overflow">
      <div className="lp-container">
        <Reveal from="up">
          <p className="lp-eyebrow">HOW IT WORKS</p>
          <h2 className="lp-h2" style={{ maxWidth: '36rem' }}>
            Four steps from salt stress to steady harvest
          </h2>
        </Reveal>

        <div className="lp-cards-grid-4" style={{ marginTop: '3.5rem' }}>
          {steps.map((s, i) => (
            <Reveal key={s.step} from="scale" delay={i * 120}>
              <div className="lp-panel lp-step-card lp-step-card-hover">
                <p className="lp-step-num">{s.step}</p>
                <h3 className="lp-card-title" style={{ marginTop: '1rem' }}>{s.title}</h3>
                <p className="lp-card-body">{s.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>

      {/* Marquee strip */}
      <div className="lp-marquee-track">
        <div className="lp-marquee-inner">
          {[...marquee, ...marquee].map((m, i) => (
            <span key={`${m}-${i}`} className="lp-marquee-item">
              {m}
              <span className="lp-marquee-dot" />
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
