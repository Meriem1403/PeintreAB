import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { galleryCategoriesAPI } from '../utils/apiService';

const FALLBACK_CATEGORIES = [
  {
    id: 1,
    slug: 'peintures',
    label: 'Peintures',
    lead: 'Toiles et acryliques — parcourez les œuvres présentées en galerie.',
    display_order: 0,
    kind: 'works',
    is_locked: false,
  },
  {
    id: 2,
    slug: 'croquis',
    label: 'Croquis',
    lead: 'Carnets et études — le geste et la recherche avant la toile.',
    display_order: 1,
    kind: 'works',
    is_locked: false,
  },
  {
    id: 3,
    slug: 'evenements',
    label: 'Événements',
    lead: 'Expositions et rencontres — l’atelier en mouvement.',
    display_order: 2,
    kind: 'events',
    is_locked: true,
  },
];

const GalleryCategoriesContext = createContext(null);

export function useGalleryCategories() {
  const ctx = useContext(GalleryCategoriesContext);
  if (!ctx) {
    throw new Error('useGalleryCategories must be used within GalleryCategoriesProvider');
  }
  return ctx;
}

export function GalleryCategoriesProvider({ children }) {
  const [categories, setCategories] = useState(FALLBACK_CATEGORIES);
  const [loading, setLoading] = useState(true);

  const loadCategories = useCallback(async () => {
    try {
      const data = await galleryCategoriesAPI.getAll();
      if (Array.isArray(data) && data.length > 0) {
        setCategories(data);
      }
    } catch (error) {
      console.error('Erreur chargement onglets galerie:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const bySlug = useMemo(() => {
    const map = {};
    categories.forEach((c) => {
      map[c.slug] = c;
    });
    return map;
  }, [categories]);

  const defaultSlug = categories[0]?.slug || 'peintures';

  const isValidSlug = useCallback(
    (slug) => typeof slug === 'string' && Boolean(bySlug[slug]),
    [bySlug]
  );

  const getLabel = useCallback(
    (slug) => bySlug[slug]?.label || slug,
    [bySlug]
  );

  const getLead = useCallback(
    (slug) => bySlug[slug]?.lead || 'Explorez la collection.',
    [bySlug]
  );

  const isEventsSlug = useCallback(
    (slug) => bySlug[slug]?.kind === 'events' || slug === 'evenements',
    [bySlug]
  );

  const value = useMemo(
    () => ({
      categories,
      loading,
      bySlug,
      defaultSlug,
      isValidSlug,
      getLabel,
      getLead,
      isEventsSlug,
      refreshCategories: loadCategories,
      setCategories,
    }),
    [
      categories,
      loading,
      bySlug,
      defaultSlug,
      isValidSlug,
      getLabel,
      getLead,
      isEventsSlug,
      loadCategories,
    ]
  );

  return (
    <GalleryCategoriesContext.Provider value={value}>
      {children}
    </GalleryCategoriesContext.Provider>
  );
}
