import { useEffect } from 'react';

const SITE_URL = 'https://www.alexandre-bindl.fr';
const DEFAULT_IMAGE = `${SITE_URL}/images/accueil.jpg`;
const DEFAULT_TITLE = 'Alexandre Bindl — Artiste peintre | Galerie d’art';
const DEFAULT_DESCRIPTION =
  'Galerie en ligne d’Alexandre Bindl, artiste peintre. Peintures, croquis, expositions et événements — Marseille & Aix-en-Provence.';

const upsertMeta = (attr, key, content) => {
  if (content == null || content === '') return;
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
};

const upsertLink = (rel, href) => {
  if (!href) return;
  let el = document.head.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
};

/**
 * Métadonnées SEO par page (title, description, canonical, Open Graph).
 */
const Seo = ({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
  path = '/',
  image = DEFAULT_IMAGE,
  noIndex = false,
}) => {
  useEffect(() => {
    const fullTitle = title.includes('Alexandre Bindl')
      ? title
      : `${title} | Alexandre Bindl`;
    const url = `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
    const img = image.startsWith('http') ? image : `${SITE_URL}${image}`;

    document.title = fullTitle;
    document.documentElement.lang = 'fr';

    upsertMeta('name', 'description', description);
    upsertMeta('name', 'robots', noIndex ? 'noindex, nofollow' : 'index, follow');
    upsertLink('canonical', url);

    upsertMeta('property', 'og:type', 'website');
    upsertMeta('property', 'og:url', url);
    upsertMeta('property', 'og:title', fullTitle);
    upsertMeta('property', 'og:description', description);
    upsertMeta('property', 'og:image', img);
    upsertMeta('property', 'og:locale', 'fr_FR');
    upsertMeta('property', 'og:site_name', 'Alexandre Bindl');

    upsertMeta('name', 'twitter:card', 'summary_large_image');
    upsertMeta('name', 'twitter:url', url);
    upsertMeta('name', 'twitter:title', fullTitle);
    upsertMeta('name', 'twitter:description', description);
    upsertMeta('name', 'twitter:image', img);
  }, [title, description, path, image, noIndex]);

  return null;
};

export default Seo;
export { SITE_URL, DEFAULT_DESCRIPTION, DEFAULT_TITLE };
