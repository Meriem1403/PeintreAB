/** Fallbacks si les catégories API ne sont pas encore chargées */
export const FALLBACK_GALLERY_SLUGS = ['peintures', 'croquis', 'evenements'];

export const DEFAULT_GALLERY_CATEGORY = 'peintures';

/** @deprecated Préférer useGalleryCategories().isValidSlug */
export function isValidGalleryCategory(category, allowedSlugs = FALLBACK_GALLERY_SLUGS) {
  return typeof category === 'string' && allowedSlugs.includes(category);
}

export function galleryPath(category = DEFAULT_GALLERY_CATEGORY, allowedSlugs = FALLBACK_GALLERY_SLUGS) {
  const cat = isValidGalleryCategory(category, allowedSlugs) ? category : allowedSlugs[0] || DEFAULT_GALLERY_CATEGORY;
  return `/galerie/${cat}`;
}

export function workDetailPath(category, workId, allowedSlugs = FALLBACK_GALLERY_SLUGS) {
  const cat = isValidGalleryCategory(category, allowedSlugs) ? category : allowedSlugs[0] || DEFAULT_GALLERY_CATEGORY;
  return `/galerie/${cat}/${encodeURIComponent(String(workId))}`;
}
