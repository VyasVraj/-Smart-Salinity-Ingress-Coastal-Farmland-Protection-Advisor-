import { useReveal } from '../../hooks/useLanding.js'

/**
 * Reveal — wraps children in an animated entry.
 * from: 'up' | 'left' | 'right' | 'scale'
 */
export function Reveal({ children, className = '', delay = 0, from = 'up' }) {
  const { ref, shown } = useReveal()

  const hidden = {
    up:    'lp-reveal-up',
    left:  'lp-reveal-left',
    right: 'lp-reveal-right',
    scale: 'lp-reveal-scale',
  }

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`lp-reveal ${shown ? 'lp-revealed' : hidden[from]} ${className}`}
    >
      {children}
    </div>
  )
}
