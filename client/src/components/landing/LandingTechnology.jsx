import { Check, Gauge, Layers3, MapPinned, Satellite, SlidersHorizontal } from 'lucide-react'
import fieldAerial from '../../assets/field-aerial.jpg'
import { Reveal } from './Reveal.jsx'
import { useReveal } from '../../hooks/useLanding.js'
import { useNavigate } from 'react-router-dom'

const bullets = [
  'Sentinel-2 salinity indices refreshed every 5 days',
  'Low-cost EC probes over LoRaWAN mesh',
  'Tidal + aquifer intrusion simulation',
  'Voice advisories in regional languages',
]

const bars = [42, 61, 38, 74, 55, 88, 66, 49]

export function LandingTechnology() {
  const { ref, shown } = useReveal(0.25)
  const navigate = useNavigate()

  return (
    <section id="technology" className="lp-section">
      <div className="lp-container lp-tech-grid">
        {/* Left — text */}
        <Reveal from="left">
          <p className="lp-eyebrow">OUR TECHNOLOGY</p>
          <h2 className="lp-h2">
            Satellites. Sensors.<br />
            <span className="lp-text-gradient-lime">Better Decisions.</span>
          </h2>
          <p className="lp-body-text" style={{ marginTop: '1.25rem' }}>
            We combine remote sensing with ground truth from village-level probes, so the
            salinity map a farmer opens is measured, not guessed.
          </p>
          <ul className="lp-bullets">
            {bullets.map((b, i) => (
              <Reveal key={b} from="left" delay={140 + i * 90}>
                <li className="lp-bullet-item">
                  <span className="lp-bullet-icon">
                    <Check size={12} className="lp-lime" />
                  </span>
                  {b}
                </li>
              </Reveal>
            ))}
          </ul>
          <button
            className="lp-btn-lime"
            style={{ marginTop: '2.25rem' }}
            onClick={() => navigate('/')}
          >
            Open Platform Dashboard
          </button>
        </Reveal>

        {/* Right — dashboard widget */}
        <Reveal from="right" delay={100}>
          <div ref={ref} className="lp-panel lp-tech-widget">
            {/* Widget header */}
            <div className="lp-widget-header">
              <div className="lp-widget-title">
                <MapPinned size={16} className="lp-lime" />
                <span>Coastal Block Overview</span>
              </div>
              <span className="lp-badge-muted">Updated 4 min ago</span>
            </div>

            {/* 3 stat cards */}
            <div className="lp-widget-stats">
              <div className="lp-widget-stat-card">
                <p className="lp-widget-stat-label">Intrusion risk</p>
                <p className="lp-widget-stat-value lp-warn">Medium</p>
                <div className="lp-progress-track">
                  <div
                    className="lp-progress-bar"
                    style={{ width: shown ? '58%' : '0%', transition: 'width 1s ease-out' }}
                  />
                </div>
              </div>
              <div className="lp-widget-stat-card">
                <p className="lp-widget-stat-label">Safe irrigation window</p>
                <p className="lp-widget-stat-value lp-lime">36 h</p>
                <p className="lp-widget-stat-sub">Next high tide 04:10</p>
              </div>
              <div className="lp-widget-stat-card">
                <p className="lp-widget-stat-label">Plots monitored</p>
                <p className="lp-widget-stat-value">148</p>
                <p className="lp-widget-stat-sub lp-teal">12 flagged for leaching</p>
              </div>
            </div>

            {/* Image + EC chart */}
            <div className="lp-widget-bottom">
              {/* Aerial field image */}
              <div className="lp-field-img-wrap">
                <img
                  src={fieldAerial}
                  alt="Aerial view of coastal farm plots"
                  className="lp-field-img"
                  loading="lazy"
                />
                <div className="lp-field-img-overlay" />
                <div className="lp-field-badge">
                  <Satellite size={14} className="lp-teal" />
                  Salinity index overlay
                </div>
                {/* Pulsing markers */}
                <span className="lp-field-marker" style={{ left: '38%', top: '46%' }}>
                  <span className="lp-pulse-ring lp-warn-ring" />
                  <span className="lp-pulse-dot lp-warn-dot" />
                </span>
                <span className="lp-field-marker" style={{ left: '68%', top: '64%' }}>
                  <span className="lp-pulse-ring lp-lime-ring" />
                  <span className="lp-pulse-dot lp-lime-dot" />
                </span>
              </div>

              {/* EC bar chart */}
              <div className="lp-widget-stat-card lp-ec-chart">
                <div className="lp-ec-header">
                  <Gauge size={14} className="lp-lime" />
                  <span>EC trend · 8 weeks</span>
                </div>
                <div className="lp-bars-wrap">
                  {bars.map((h, i) => (
                    <span
                      key={i}
                      className={`lp-bar ${shown ? 'lp-bar-animated' : ''}`}
                      style={{ height: `${h}%`, animationDelay: `${i * 70}ms` }}
                    />
                  ))}
                </div>
                <div className="lp-ec-footer">
                  <span><Layers3 size={13} /> 3 layers</span>
                  <span><SlidersHorizontal size={13} /> Auto-tuned</span>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
