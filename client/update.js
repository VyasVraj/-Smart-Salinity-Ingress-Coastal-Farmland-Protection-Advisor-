const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, 'src', 'index.css');
let css = fs.readFileSync(cssPath, 'utf8');

// 1. .btn-primary
css = css.replace(
  /\.btn-primary\s*\{\s*display:\s*inline-flex;[\s\S]*?transition:[^;]+;\s*\}/,
  `.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  background: #45D483;
  color: #06110E;
  padding: 0.5rem 1.125rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
  letter-spacing: 0.01em;
  white-space: nowrap;
  transition: background 0.15s, transform 0.1s, box-shadow 0.15s;
}`
);
css = css.replace(
  /\.btn-primary:hover\s*\{[^}]+\}/,
  `.btn-primary:hover   { background: #38C070; box-shadow: 0 4px 12px rgba(69,212,131,0.3); }`
);

// 2. .btn-cyan
css = css.replace(
  /\.btn-cyan\s*\{\s*display:\s*inline-flex;[\s\S]*?white-space:\s*nowrap;\s*\}/,
  `.btn-cyan {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  background: rgba(32,217,197,0.1);
  color: var(--accent-cyan);
  padding: 0.5rem 1.125rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  border: 1px solid rgba(32,217,197,0.2);
  cursor: pointer;
  letter-spacing: 0.01em;
  white-space: nowrap;
}`
);
css = css.replace(
  /\.btn-cyan:hover\s*\{[^}]+\}/,
  `.btn-cyan:hover   { background: rgba(32,217,197,0.18); border-color: rgba(32,217,197,0.4); }`
);

// 3. Risk badge colors for dark theme
css = css.replace(
  /:root \.risk-badge-LOW,[\s\S]*?\[data-theme="dark"\] \.risk-badge-CRITICAL\s*\{[^}]+\}/,
  `:root .risk-badge-LOW,
[data-theme="dark"] .risk-badge-LOW      { color: #45D483; background: rgba(69,212,131,0.1);  border-color: rgba(69,212,131,0.3); }
:root .risk-badge-MEDIUM,
[data-theme="dark"] .risk-badge-MEDIUM   { color: #F5B942; background: rgba(245,185,66,0.1); border-color: rgba(245,185,66,0.3); }
:root .risk-badge-HIGH,
[data-theme="dark"] .risk-badge-HIGH     { color: #FF554D; background: rgba(255,85,77,0.1);  border-color: rgba(255,85,77,0.3); }
:root .risk-badge-CRITICAL,
[data-theme="dark"] .risk-badge-CRITICAL { color: #FF2D78; background: rgba(255,45,120,0.1); border-color: rgba(255,45,120,0.3); }`
);

// 4. .card-command::before
css = css.replace(
  /\.card-command::before\s*\{([\s\S]*?)background:\s*linear-gradient\([^;]+;\s*opacity:\s*0\.4;\s*\}/,
  `.card-command::before {$1background: linear-gradient(90deg, transparent, var(--accent-green-primary), transparent);
  opacity: 0.35;
}`
);

// 5. ::-webkit-scrollbar-thumb:hover
css = css.replace(
  /::-webkit-scrollbar-thumb:hover\s*\{\s*background:\s*var\(--accent-cyan\);\s*\}/,
  `::-webkit-scrollbar-thumb:hover { background: var(--accent-green-primary); }`
);

// 6. .copilot-header
css = css.replace(
  /\.copilot-header\s*\{[\s\S]*?border-radius:\s*14px;[\s\S]*?margin-bottom:\s*1\.5rem;\s*\}/,
  `.copilot-header {
  background: linear-gradient(135deg, rgba(69,212,131,0.06) 0%, rgba(32,217,197,0.04) 100%);
  border: 1px solid rgba(69,212,131,0.15); border-radius: 14px;
  padding: 1.25rem 1.5rem; position: relative; overflow: hidden; margin-bottom: 1.5rem;
}`
);
css = css.replace(
  /\.copilot-header::before\s*\{([\s\S]*?)background:\s*linear-gradient\([^;]+;\s*\}/,
  `.copilot-header::before {$1background: linear-gradient(90deg, transparent 0%, rgba(69,212,131,0.5) 50%, transparent 100%);
}`
);
css = css.replace(
  /\[data-theme="light"\]\s*\.copilot-header\s*\{[\s\S]*?border-color:[^;]+;\s*\}/,
  `[data-theme="light"] .copilot-header {
  background: linear-gradient(135deg, rgba(0,121,80,0.05) 0%, rgba(0,137,123,0.03) 100%);
  border-color: rgba(0,121,80,0.15);
}`
);

// 7. .scenario-card.selected
css = css.replace(
  /\.scenario-card\.selected\s*\{[^}]+\}/,
  `.scenario-card.selected { border-color: rgba(69,212,131,0.45); background: rgba(69,212,131,0.06); }`
);

// 8. .risk-filter-pill.active-all
css = css.replace(
  /\.risk-filter-pill\.active-all\s*\{[^}]+\}/,
  `.risk-filter-pill.active-all { background: rgba(69,212,131,0.1); color: var(--accent-green-primary); border-color: rgba(69,212,131,0.25); }`
);

// 9. .suggestion-btn:hover
css = css.replace(
  /\.suggestion-btn:hover\s*\{[\s\S]*?\}/,
  `.suggestion-btn:hover {
  border-color: rgba(69,212,131,0.35); color: var(--accent-green-primary); background: rgba(69,212,131,0.06);
}`
);

// 10. .digital-twin::before
css = css.replace(
  /\.digital-twin::before\s*\{([\s\S]*?)background:\s*linear-gradient\([^;]+;\s*\}/,
  `.digital-twin::before {$1background: linear-gradient(90deg, transparent 0%, rgba(69,212,131,0.35) 50%, transparent 100%);\n}`
);

// 11. .page-header__inner::after
css = css.replace(
  /\.page-header__inner::after\s*\{([\s\S]*?)background:\s*var\(--accent-cyan\);\s*opacity:\s*0\.6;\s*\}/,
  `.page-header__inner::after {$1background: var(--accent-green-primary);\n}`
);

// 12. .sidebar-nav-item.active
css = css.replace(
  /\.sidebar-nav-item\.active\s*\{[\s\S]*?\}/,
  `.sidebar-nav-item.active {
  background: rgba(69,212,131,0.09) !important;
  color: var(--accent-green-primary) !important;
  border: 1px solid rgba(69,212,131,0.2) !important;
  font-weight: 600;
}`
);

// 13. Utilities
const utils = `

/* ── Agricultural background helpers ── */
.agri-bg-gradient {
  background: radial-gradient(ellipse at 20% 50%, rgba(69,212,131,0.04) 0%, transparent 60%),
              radial-gradient(ellipse at 80% 20%, rgba(32,217,197,0.03) 0%, transparent 50%),
              var(--bg-base);
}

/* Hero / situation card */
.card-hero {
  background: linear-gradient(135deg, rgba(69,212,131,0.08) 0%, rgba(32,217,197,0.05) 60%, var(--bg-card) 100%);
  border: 1px solid rgba(69,212,131,0.2);
  border-radius: 16px;
  position: relative;
  overflow: hidden;
}
.card-hero::before {
  content: '';
  position: absolute; top: 0; left: 0; right: 0; height: 1px;
  background: linear-gradient(90deg, transparent 0%, rgba(69,212,131,0.5) 50%, transparent 100%);
}

/* Farm health bar */
.health-bar-wrap { display: flex; gap: 3px; height: 6px; border-radius: 99px; overflow: hidden; }
.health-bar-seg { border-radius: 99px; transition: flex 0.4s ease; }

/* Stat strip item */
.stat-strip-item {
  display: flex; flex-direction: column; align-items: flex-start; gap: 0.125rem;
  padding: 0.875rem 1.125rem;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 12px;
}
.stat-strip-value {
  font-size: 1.75rem; font-weight: 800; line-height: 1;
  letter-spacing: -0.03em; font-family: 'Inter', monospace;
}
.stat-strip-label {
  font-size: 0.5625rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.1em; color: var(--text-muted);
}

/* AI insight panel */
.ai-insight-panel {
  background: linear-gradient(160deg, rgba(32,217,197,0.05) 0%, var(--bg-card) 60%);
  border: 1px solid rgba(32,217,197,0.15);
  border-radius: 14px; padding: 1.25rem;
  position: relative; overflow: hidden;
}
.ai-insight-panel::before {
  content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px;
  background: linear-gradient(90deg, transparent, rgba(32,217,197,0.4), transparent);
}
`;

css += utils;

fs.writeFileSync(cssPath, css, 'utf8');
console.log('Update successful');
