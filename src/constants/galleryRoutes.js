export const GALLERY_CATEGORIES = ['peintures', 'croquis', 'evenements'];

export const DEFAULT_GALLERY_CATEGORY = 'peintures';

export function isValidGalleryCategory(category) {
  return typeof category === 'string' && GALLERY_CATEGORIES.includes(category);
}

export function galleryPath(category = DEFAULT_GALLERY_CATEGORY) {
  const cat = isValidGalleryCategory(category) ? category : DEFAULT_GALLERY_CATEGORY;
  return `/galerie/${cat}`;
}

export function workDetailPath(category, workId) {
  const cat = isValidGalleryCategory(category) ? category : DEFAULT_GALLERY_CATEGORY;
  return `/galerie/${cat}/${encodeURIComponent(String(workId))}`;
}
