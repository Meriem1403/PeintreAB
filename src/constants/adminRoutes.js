export const DEFAULT_ADMIN_TAB = 'peintures';

export const ADMIN_TAB_IDS = [
  'peintures',
  'croquis',
  'evenements',
  'hero-settings',
  'theme-settings',
  'artist-info',
  'contact-info',
  'site-qr',
  'notifications',
  'visiteurs',
  'scan',
];

const ADMIN_TAB_SET = new Set(ADMIN_TAB_IDS);

export function isValidAdminTab(tab) {
  return typeof tab === 'string' && ADMIN_TAB_SET.has(tab);
}

export function adminTabPath(tab = DEFAULT_ADMIN_TAB) {
  const id = isValidAdminTab(tab) ? tab : DEFAULT_ADMIN_TAB;
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
