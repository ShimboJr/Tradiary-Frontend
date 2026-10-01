/**
 * components/trades/SourceBadge.jsx
 * Small badge/icon indicating how a trade was logged (manual, CSV, MetaTrader, email).
 * Shown next to the symbol in Trade List and Trade Detail views.
 */
import React from 'react';
import { Monitor, Upload, Mail, PenLine } from 'lucide-react';

const SOURCE_CONFIG = {
  manual: {
    icon: PenLine,
    label: 'Manual',
    color: 'var(--text-muted)',
    bg: 'var(--surface-200)',
  },
  csv_import: {
    icon: Upload,
    label: 'CSV Import',
    color: 'var(--brand-cyan)',
    bg: 'var(--brand-cyan-subtle)',
  },
  metatrader: {
    icon: Monitor,
    label: 'MetaTrader',
    color: 'var(--brand-indigo)',
    bg: 'var(--brand-indigo-subtle)',
  },
  email_import: {
    icon: Mail,
    label: 'Email Import',
    color: 'hsl(40 90% 55%)',
    bg: 'hsl(40 90% 20% / 0.3)',
  },
};

/**
 * @param {{ source?: string, showLabel?: boolean }} props
 */
const SourceBadge = ({ source = 'manual', showLabel = false }) => {
  const cfg = SOURCE_CONFIG[source] ?? SOURCE_CONFIG.manual;
  const Icon = cfg.icon;

  // Hide the badge entirely for plain manual trades (no clutter)
  if (source === 'manual' && !showLabel) return null;

  return (
    <span
      title={cfg.label}
      aria-label={`Source: ${cfg.label}`}
      className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold flex-shrink-0"
      style={{ color: cfg.color, background: cfg.bg }}
    >
      <Icon size={10} aria-hidden="true" />
      {showLabel && <span>{cfg.label}</span>}
    </span>
  );
};

export default SourceBadge;
