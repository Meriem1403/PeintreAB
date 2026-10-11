import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { worksAPI } from '../utils/apiService';
import { normalizeImageUrl } from '../utils/imageUrl';
import { useGalleryCategories } from './GalleryCategoriesContext';

const WorksContext = createContext();

export const useWorks = () => {
  const context = useContext(WorksContext);
  if (!context) {
    throw new Error('useWorks must be used within WorksProvider');
  }
  return context;
};

const emptyBuckets = (slugs) =>
  Object.fromEntries((slugs.length ? slugs : ['peintures', 'croquis', 'evenements']).map((s) => [s, []]));

export const WorksProvider = ({ children }) => {
  const { categories, loading: categoriesLoading } = useGalleryCategories();
  const [works, setWorks] = useState(() => emptyBuckets([]));
  const [loading, setLoading] = useState(true);

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const loadWorks = useCallback(async () => {
    setLoading(true);
    const slugs = categories.map((c) => c.slug);
    const maxAttempts = 5;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        const all = await worksAPI.getAll();
        const normalizeWorks = (items = []) =>
          items.map((work) => ({
            ...work,
            image: normalizeImageUrl(work.image),
          }));

        const buckets = emptyBuckets(slugs);
        normalizeWorks(all).forEach((work) => {
          const key = work.type;
          if (!buckets[key]) buckets[key] = [];
          buckets[key].push(work);
        });

        setWorks(buckets);
        setLoading(false);
        return;
      } catch (error) {
        console.error(`Erreur chargement œuvres (tentative ${attempt}/${maxAttempts}):`, error.message);
        if (attempt < maxAttempts) {
          await sleep(attempt * 1000);
        }
      }
    }

    setWorks(emptyBuckets(slugs));
    setLoading(false);
  }, [categories]);

  useEffect(() => {
    if (categoriesLoading) return;
    loadWorks();
  }, [categoriesLoading, loadWorks]);

  const addWork = async (type, work) => {
    try {
      const newWork = await worksAPI.create({ ...work, type });
      await loadWorks();
      return newWork;
    } catch (error) {
      console.error("Erreur lors de l'ajout de l'œuvre:", error);
      throw error;
    }
  };

  const updateWork = async (type, id, updates) => {
    try {
      await worksAPI.update(id, updates);
      await loadWorks();
    } catch (error) {
      console.error("Erreur lors de la mise à jour de l'œuvre:", error);
      throw error;
    }
  };

  const removeWork = async (type, id) => {
    try {
      await worksAPI.delete(id);
      await loadWorks();
    } catch (error) {
      console.error("Erreur lors de la suppression de l'œuvre:", error);
      throw error;
    }
  };

  return (
    <WorksContext.Provider
      value={{
        works,
        loading: loading || categoriesLoading,
        addWork,
        updateWork,
        removeWork,
        refreshWorks: loadWorks,
      }}
    >
      {children}
    </WorksContext.Provider>
  );
};
