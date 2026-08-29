import { LandingNav }       from '../components/landing/LandingNav.jsx'
import { LandingHero }      from '../components/landing/LandingHero.jsx'
import { LandingAdvisory }  from '../components/landing/LandingAdvisory.jsx'
import { LandingTechnology} from '../components/landing/LandingTechnology.jsx'
import { LandingImpact }    from '../components/landing/LandingImpact.jsx'
import { LandingCtaFooter } from '../components/landing/LandingCtaFooter.jsx'

/**
 * LandingPage — Standalone full-page marketing site.
 * Renders OUTSIDE the sidebar/topbar shell (registered at /landing in App.jsx).
 */
export default function LandingPage() {
  return (
    <div className="lp-root">
      <LandingNav />
      <LandingHero />
      <LandingAdvisory />
      <LandingTechnology />
      <LandingImpact />
      <LandingCtaFooter />
    </div>
  )
}
