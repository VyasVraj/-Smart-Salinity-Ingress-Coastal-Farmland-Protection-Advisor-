/**
 * PageHeader — Consistent futuristic page header.
 * Props:
 *   icon        {ReactNode}  Lucide icon element
 *   title       {string}     Page title
 *   subtitle    {string}     Optional subtitle / description
 *   actions     {ReactNode}  Right-side action buttons / badges
 *   accentColor {string}     Optional icon color (default: var(--accent-cyan))
 */
export default function PageHeader({ icon, title, subtitle, actions, accentColor }) {
  const iconColor = accentColor || 'var(--accent-cyan)'
  return (
    <div className="page-header">
      <div className="page-header__inner">
        <div>
          <h1 className="page-header__title">
            {icon && (
              <span style={{ color: iconColor, display: 'inline-flex', alignItems: 'center', flexShrink: 0 }}>
                {icon}
              </span>
            )}
            {title}
          </h1>
          {subtitle && <p className="page-header__sub">{subtitle}</p>}
        </div>
        {actions && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap', flexShrink: 0 }}>
            {actions}
          </div>
        )}
      </div>
    </div>
  )
}
