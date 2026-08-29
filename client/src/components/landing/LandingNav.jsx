import { useEffect, useState } from 'react'
import { Waves } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const links = [
  { label: 'Overview',   href: '#top' },
  { label: 'Advisory',   href: '#advisory' },
  { label: 'Technology', href: '#technology' },
  { label: 'Impact',     href: '#impact' },
  { label: 'Contact',    href: '#contact' },
]

export function LandingNav() {
  const [solid, setSolid] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className="lp-nav-header">
      <nav className={`lp-nav-inner ${solid ? 'lp-nav-solid' : 'lp-nav-transparent'}`}>
        {/* Logo */}
        <a href="#top" className="lp-logo">
          <span className="lp-logo-icon">
            <Waves size={18} />
          </span>
          <span className="lp-logo-text">
            <span className="lp-logo-name">Salinity Shield AI</span>
            <span className="lp-logo-sub">COASTAL FARMLAND ADVISOR</span>
          </span>
        </a>

        {/* Nav links + CTA */}
        <div className="lp-nav-right">
          <ul className="lp-nav-links">
            {links.map((l) => (
              <li key={l.label}>
                <a href={l.href} className="lp-nav-link">{l.label}</a>
              </li>
            ))}
          </ul>
          <button
            className="lp-btn-lime"
            onClick={() => navigate('/')}
          >
            Open Dashboard
          </button>
        </div>
      </nav>
    </header>
  )
}
