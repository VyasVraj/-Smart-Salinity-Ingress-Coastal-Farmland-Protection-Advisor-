import { ArrowRight, Droplets, Play, Sprout, Thermometer } from 'lucide-react'
import heroCoast from '../../assets/hero-coast.jpg'
import { Reveal } from './Reveal.jsx'
import { useCountUp, useReveal, useScrollY } from '../../hooks/useLanding.js'
import { useNavigate } from 'react-router-dom'

const stats = [
  { value: 18400, suffix: '+',     label: 'Farmers advised',      decimals: 0 },
  { value: 92,    suffix: 'k ha',  label: 'Coastline monitored',  decimals: 0 },
  { value: 37,    suffix: '%',     label: 'Salt damage avoided',  decimals: 0 },
  { value: 2.4,   suffix: ' dS/m', label: 'Avg. EC reduction',   decimals: 1 },
]

function Stat({ value, suffix, label, decimals, active }) {
  const n = useCountUp(value, active)
  return (
    <div className="lp-stat">
      <p className="lp-stat-value">
        {n >= 1000 ? `${(n / 1000).toFixed(1)}k` : n.toFixed(decimals)}
        <span className="lp-lime">{suffix}</span>
      </p>
      <p className="lp-stat-label">{label}</p>
    </div>
  )
}

const readings = [
  { icon: Droplets,    label: 'Soil salinity (EC)',  value: '3.1 dS/m', tone: 'lp-warn' },
  { icon: Thermometer, label: 'Groundwater depth',   value: '4.2 m',    tone: 'lp-teal' },
  { icon: Sprout,      label: 'Crop stress index',   value: 'Low',      tone: 'lp-lime' },
]

export function LandingHero() {
  const y = useScrollY()
  const { ref, shown } = useReveal(0.2)
  const navigate = useNavigate()

  return (
    <section id="top" className="lp-hero-section">
      <div className="lp-hero-grain lp-hero-inner">
        {/* Background image with parallax */}
        <img
          src={heroCoast}
          alt="Farmer reviewing salinity data above coastal paddy fields"
          className="lp-hero-img"
          style={{ transform: `translateY(${y * 0.1}px) scale(1.1)` }}
        />
        {/* Dark gradient overlay */}
        <div className="lp-hero-overlay" />

        <div className="lp-hero-content">
          {/* Headline block */}
          <div className="lp-hero-text">
            <Reveal from="left">
              <span className="lp-hero-badge">
                <span className="lp-pulse-wrap">
                  <span className="lp-pulse-ring" />
                  <span className="lp-pulse-dot" />
                </span>
                SALINITY INGRESS EARLY WARNING
              </span>
            </Reveal>
            <Reveal from="up" delay={120}>
              <h1 className="lp-hero-h1">
                Guarding Soil.<br />
                <span className="lp-text-gradient-lime">Growing Coastlines.</span>
              </h1>
            </Reveal>
            <Reveal from="up" delay={220}>
              <p className="lp-hero-lead">
                Salinity Shield AI fuses satellite imagery, tidal models and in-field sensors to
                predict saltwater intrusion before it reaches the root zone — then tells
                each farmer exactly what to irrigate, plant and amend.
              </p>
            </Reveal>
            <Reveal from="up" delay={320}>
              <div className="lp-hero-ctas">
                <a href="#advisory" className="lp-btn-lime lp-btn-glow">
                  Explore Advisory
                  <ArrowRight size={16} className="lp-btn-arrow" />
                </a>
                <button
                  className="lp-btn-outline"
                  onClick={() => navigate('/')}
                >
                  <span className="lp-play-wrap">
                    <Play size={14} />
                  </span>
                  Open Dashboard
                </button>
              </div>
            </Reveal>
          </div>

          {/* Stats strip */}
          <div ref={ref} className="lp-panel lp-stats-grid">
            {stats.map((s) => (
              <Stat key={s.label} {...s} active={shown} />
            ))}
          </div>
        </div>

        {/* Floating probe card */}
        <Reveal from="right" delay={400} className="lp-probe-card-wrap">
          <div className="lp-panel lp-probe-card lp-float">
            <div className="lp-probe-header">
              <span className="lp-lime lp-text-xs lp-semibold">Live field probe</span>
              <span className="lp-muted lp-text-xs">Kutch · P-14</span>
            </div>
            <ul className="lp-probe-list">
              {readings.map((r) => {
                const Icon = r.icon
                return (
                  <li key={r.label} className="lp-probe-item">
                    <span className="lp-probe-icon-wrap">
                      <Icon size={16} className={r.tone} />
                    </span>
                    <span className="lp-probe-text">
                      <span className="lp-muted lp-text-xs">{r.label}</span>
                      <span className={`lp-semibold lp-text-sm ${r.tone}`}>{r.value}</span>
                    </span>
                  </li>
                )
              })}
            </ul>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
