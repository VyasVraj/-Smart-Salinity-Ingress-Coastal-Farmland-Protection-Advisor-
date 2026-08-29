import { ArrowUpRight, CloudRain, FlaskConical, Layers, Waves } from 'lucide-react'
import { Reveal } from './Reveal.jsx'

const cards = [
  {
    icon: Waves,
    title: 'Ingress Forecasting',
    body: 'Tide, river discharge and groundwater models predict saltwater advance 14 days ahead, plot by plot.',
    tone: 'lp-teal',
  },
  {
    icon: CloudRain,
    title: 'Smart Irrigation',
    body: 'Leaching schedules that flush salts using the least freshwater, timed to rainfall windows.',
    tone: 'lp-lime',
  },
  {
    icon: FlaskConical,
    title: 'Soil Remediation',
    body: 'Gypsum, biochar and organic amendment dosing based on measured EC, pH and sodium ratios.',
    tone: 'lp-warn',
  },
  {
    icon: Layers,
    title: 'Crop Substitution',
    body: "Salt-tolerant varieties and rotations matched to each field's tolerance and market price.",
    tone: 'lp-salt',
  },
]

export function LandingAdvisory() {
  return (
    <section id="advisory" className="lp-section">
      <div className="lp-container">
        <div className="lp-advisory-header">
          <Reveal from="left">
            <p className="lp-eyebrow">WHAT WE ADVISE</p>
            <h2 className="lp-h2">
              Protection Plans<br />
              for Every Coastal Plot
            </h2>
          </Reveal>
          <Reveal from="right" delay={120}>
            <p className="lp-body-text">
              From aquifer to acre, Salinity Shield AI turns salinity data into decisions a farmer
              can act on this week — and a coastline that stays farmable for decades.
            </p>
          </Reveal>
        </div>

        <div className="lp-cards-grid-4">
          {cards.map((c, i) => {
            const Icon = c.icon
            return (
              <Reveal key={c.title} from="up" delay={i * 110}>
                <article className="lp-panel lp-advisory-card lp-advisory-card-hover">
                  <span className="lp-card-icon-wrap lp-card-icon-hover">
                    <Icon size={22} className={c.tone} />
                  </span>
                  <h3 className="lp-card-title">{c.title}</h3>
                  <p className="lp-card-body">{c.body}</p>
                  <span className="lp-card-arrow-wrap lp-card-arrow-hover">
                    <ArrowUpRight size={16} className="lp-card-arrow-icon" />
                  </span>
                </article>
              </Reveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}
