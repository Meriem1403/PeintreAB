/** Slug URL-safe pour un onglet galerie */
export function slugifyCategory(label) {
  return String(label || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

export const DEFAULT_GALLERY_CATEGORIES = [
  {
    slug: 'peintures',
    label: 'Peintures',
    lead: 'Toiles et acryliques — parcourez les œuvres présentées en galerie.',
    display_order: 0,
    kind: 'works',
    is_locked: false,
  },
  {
    slug: 'croquis',
    label: 'Croquis',
    lead: 'Carnets et études — le geste et la recherche avant la toile.',
    display_order: 1,
    kind: 'works',
    is_locked: false,
  },
  {
    slug: 'evenements',
    label: 'Événements',
    lead: 'Expositions et rencontres — l’atelier en mouvement.',
    display_order: 2,
    kind: 'events',
    is_locked: true,
  },
];

export const RESERVED_ADMIN_SLUGS = new Set([
  'hero-settings',
  'theme-settings',
  'artist-info',
  'contact-info',
  'site-qr',
  'notifications',
  'visiteurs',
  'scan',
  'onglets-galerie',
  'admin',
  'login',
  'galerie',
  'biographie',
  'contact',
  'confidentialite',
  'billet',
]);
