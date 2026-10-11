export const DEFAULT_ADMIN_TAB = 'peintures';

/** Onglets admin fixes (hors galerie dynamique) */
export const FIXED_ADMIN_TAB_IDS = [
  'onglets-galerie',
  'hero-settings',
  'theme-settings',
  'artist-info',
  'contact-info',
  'site-qr',
  'notifications',
  'visiteurs',
  'scan',
];

const FIXED_ADMIN_TAB_SET = new Set(FIXED_ADMIN_TAB_IDS);

/** Anciens slugs toujours acceptés en secours */
const LEGACY_GALLERY_SLUGS = new Set(['peintures', 'croquis', 'evenements']);

export function isFixedAdminTab(tab) {
  return typeof tab === 'string' && FIXED_ADMIN_TAB_SET.has(tab);
}

/**
 * @param {string} tab
 * @param {string[]} [gallerySlugs] slugs d’onglets galerie connus
 */
export function isValidAdminTab(tab, gallerySlugs) {
  if (typeof tab !== 'string') return false;
  if (FIXED_ADMIN_TAB_SET.has(tab)) return true;
  if (LEGACY_GALLERY_SLUGS.has(tab)) return true;
  if (Array.isArray(gallerySlugs) && gallerySlugs.includes(tab)) return true;
  /* slug plausible avant chargement API */
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(tab);
}

export function adminTabPath(tab = DEFAULT_ADMIN_TAB) {
  const id = typeof tab === 'string' && tab ? tab : DEFAULT_ADMIN_TAB;
  return `/admin/${id}`;
}

const ADMIN_LAST_TAB_KEY = 'adminLastTab';

export function rememberAdminTab(tab) {
  if (typeof sessionStorage === 'undefined' || !isValidAdminTab(tab)) return;
  sessionStorage.setItem(ADMIN_LAST_TAB_KEY, tab);
}

/** Lien navbar Admin : onglet courant ou dernier onglet visité. */
export function resolveAdminLinkPath(pathname) {
  if (typeof pathname === 'string' && pathname.startsWith('/admin/')) {
    const tab = pathname.slice('/admin/'.length).split(/[/?#]/)[0];
    if (isValidAdminTab(tab)) return adminTabPath(tab);
  }
  if (typeof sessionStorage !== 'undefined') {
    const last = sessionStorage.getItem(ADMIN_LAST_TAB_KEY);
    if (isValidAdminTab(last)) return adminTabPath(last);
  }
  return adminTabPath(DEFAULT_ADMIN_TAB);
}
