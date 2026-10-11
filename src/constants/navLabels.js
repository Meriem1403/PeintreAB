/** Libellés par défaut des onglets du header public. */
export const DEFAULT_NAV_LABELS = {
  nav_label_home: 'Accueil',
  nav_label_gallery: 'Galerie',
  nav_label_bio: 'Biographie',
  nav_label_contact: 'Contact',
  nav_label_admin: 'Admin',
};

export const NAV_LABEL_FIELDS = [
  {
    key: 'nav_label_home',
    routeHint: '/',
    hint: 'Page d’accueil',
  },
  {
    key: 'nav_label_gallery',
    routeHint: '/galerie',
    hint: 'Galerie',
  },
  {
    key: 'nav_label_bio',
    routeHint: '/biographie',
    hint: 'Biographie / artiste',
  },
  {
    key: 'nav_label_contact',
    routeHint: '/contact',
    hint: 'Contact',
  },
  {
    key: 'nav_label_admin',
    routeHint: '/admin',
    hint: 'Lien administration',
  },
];

export const normalizeNavLabels = (raw = {}) => {
  const next = {};
  for (const [key, fallback] of Object.entries(DEFAULT_NAV_LABELS)) {
    const value = raw[key] != null ? String(raw[key]).trim().slice(0, 40) : '';
    next[key] = value || fallback;
  }
  return next;
};
