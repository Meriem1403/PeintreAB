/** Styles d’apparence événement (surbrillance + badge). */

export const DEFAULT_EVENT_HIGHLIGHT = '#E07A5F';
export const DEFAULT_EVENT_BADGE = '#8A6A3D';

const TONE_BADGE_FALLBACK = {
  live: '#C45C3E',
  soon: '#E07A5F',
  past: '#6B6560',
  custom: '#8A6A3D',
  default: '#8A6A3D',
};

export const normalizeHexColor = (value, fallback = null) => {
  if (value == null || value === '') return fallback;
  let hex = String(value).trim();
  if (!hex.startsWith('#')) hex = `#${hex}`;
  if (/^#[0-9A-Fa-f]{3}$/.test(hex)) {
    hex = `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`;
  }
  if (!/^#[0-9A-Fa-f]{6}$/.test(hex)) return fallback;
  return hex.toUpperCase();
};

export const hexToRgb = (hex) => {
  const normalized = normalizeHexColor(hex);
  if (!normalized) return null;
  const int = parseInt(normalized.slice(1), 16);
  return `${(int >> 16) & 255}, ${(int >> 8) & 255}, ${int & 255}`;
};

/** Mélange une couleur avec du blanc (0–1). */
export const mixWithWhite = (hex, amount = 0.82) => {
  const normalized = normalizeHexColor(hex, DEFAULT_EVENT_HIGHLIGHT);
  const int = parseInt(normalized.slice(1), 16);
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  const mix = (c) => Math.round(c + (255 - c) * amount);
  const toHex = (n) => n.toString(16).padStart(2, '0');
  return `#${toHex(mix(r))}${toHex(mix(g))}${toHex(mix(b))}`.toUpperCase();
};

/**
 * Surbrillance uniquement si activée en admin.
 * @returns {{ color: string, soft: string, rgb: string } | null}
 */
export const resolveEventHighlightStyle = (event) => {
  if (!event || !(event.highlight_enabled === true || event.highlight_enabled === 'true')) {
    return null;
  }
  const color = normalizeHexColor(event.highlight_color, DEFAULT_EVENT_HIGHLIGHT);
  const rgb = hexToRgb(color);
  return {
    color,
    soft: mixWithWhite(color, 0.84),
    rgb: rgb || '224, 122, 95',
  };
};

/** Couleur de pastille badge (admin prioritaire, sinon selon le ton). */
export const resolveEventBadgeColor = (event, tone = 'soon') => {
  const custom = normalizeHexColor(event?.badge_color);
  if (custom) return custom;
  return TONE_BADGE_FALLBACK[tone] || DEFAULT_EVENT_BADGE;
};

export const eventHighlightCssVars = (highlight) => {
  if (!highlight) return undefined;
  return {
    '--event-hl': highlight.color,
    '--event-hl-soft': highlight.soft,
    '--event-hl-rgb': highlight.rgb,
  };
};
