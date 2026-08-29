import { ArrowRight, Waves } from 'lucide-react'
import { Reveal } from './Reveal.jsx'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'

export function LandingCtaFooter() {
  const navigate = useNavigate()
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    setSubmitted(true)
    setTimeout(() => setSubmitted(false), 3000)
  }

  return (
    <section id="contact" className="lp-cta-section">
      <Reveal from="up">
        <div className="lp-grain lp-panel lp-cta-card">
          <div className="lp-cta-grid">
            {/* Left copy */}
            <div>
              <h2 className="lp-cta-h2">
                Together, let&apos;s hold the line<br />
                <span className="lp-text-gradient-lime">against the salt.</span>
              </h2>
              <p className="lp-body-text" style={{ marginTop: '1.25rem', maxWidth: '32rem' }}>
                Join farmer collectives, panchayats and coastal research teams using
                Salinity Shield AI to keep farmland productive as seas rise.
              </p>
              <button
                className="lp-btn-lime"
                style={{ marginTop: '2rem' }}
                onClick={() => navigate('/')}
              >
                Open Dashboard <ArrowRight size={16} />
              </button>
            </div>

            {/* Right form */}
            <form className="lp-panel lp-contact-form" onSubmit={handleSubmit} aria-label="Request advisory access">
              <label className="lp-form-label" htmlFor="village">
                YOUR VILLAGE OR BLOCK
              </label>
              <input
                id="village"
                placeholder="e.g. Kutch, Block 4"
                className="lp-input"
              />
              <label className="lp-form-label" style={{ marginTop: '1rem', display: 'block' }} htmlFor="phone">
                MOBILE NUMBER
              </label>
              <input
                id="phone"
                inputMode="tel"
                placeholder="+91 00000 00000"
                className="lp-input"
              />
              <button type="submit" className="lp-btn-lime lp-btn-full" style={{ marginTop: '1.25rem' }}>
                {submitted ? '✓ Request received!' : (
                  <>Get my salinity report <ArrowRight size={16} className="lp-btn-arrow" /></>
                )}
              </button>
            </form>
          </div>
        </div>
      </Reveal>

      {/* Footer */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div className="lp-footer-brand">
            <span className="lp-logo-icon">
              <Waves size={16} />
            </span>
            <span className="lp-footer-name">Salinity Shield AI · Coastal Farmland Protection Advisor</span>
          </div>
          <p className="lp-footer-copy">© {new Date().getFullYear()} Salinity Shield AI · Gujarat Hackathon 2026</p>
        </div>
      </footer>
    </section>
  )
}
