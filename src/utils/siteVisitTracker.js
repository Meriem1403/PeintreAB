const SESSION_KEY = 'peintreab_visit_session';
const API_URL = import.meta.env.VITE_API_URL || '/api';

const shouldSkipPath = (path) =>
  path.startsWith('/admin') ||
  path.startsWith('/login') ||
  path.startsWith('/forgot-password') ||
  path.startsWith('/reset-password') ||
  path.startsWith('/billet') ||
  path === '/rejoindre';

const getSessionId = () => {
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (id && /^[a-zA-Z0-9_-]{8,64}$/.test(id)) return id;
    id =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID().replace(/-/g, '')
        : `s${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`;
    sessionStorage.setItem(SESSION_KEY, id);
    return id;
  } catch {
    return `s${Date.now().toString(36)}`;
  }
};

/** Envoie un hit analytics (silencieux en cas d’échec). */
export const trackSiteVisit = (pathname = '/') => {
  const path = String(pathname || '/');
  if (shouldSkipPath(path)) return;

  const sessionId = getSessionId();
  fetch(`${API_URL}/analytics/visit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, path }),
    keepalive: true,
  }).catch(() => {});
};
