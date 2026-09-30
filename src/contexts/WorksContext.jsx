import { createContext, useContext, useState, useEffect } from 'react';
import { worksAPI } from '../utils/apiService';
import { normalizeImageUrl } from '../utils/imageUrl';

const WorksContext = createContext();

export const useWorks = () => {
  const context = useContext(WorksContext);
  if (!context) {
    throw new Error('useWorks must be used within WorksProvider');
  }
  return context;
};

export const WorksProvider = ({ children }) => {
  const [works, setWorks] = useState({
    peintures: [],
    croquis: [],
    evenements: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWorks();

    const handleFocus = () => {
      if (!works.peintures.length && !works.croquis.length && !works.evenements.length) {
        loadWorks();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const loadWorks = async () => {
    setLoading(true);
    const maxAttempts = 5;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        console.log(`🔄 Chargement des œuvres depuis l'API (tentative ${attempt}/${maxAttempts})...`);

        const [peintures, croquis, evenements] = await Promise.all([
          worksAPI.getAll('peintures'),
          worksAPI.getAll('croquis'),
          worksAPI.getAll('evenements'),
        ]);

        const normalizeWorks = (items = []) =>
          items.map((work) => ({
            ...work,
            image: normalizeImageUrl(work.image),
          }));

        setWorks({
          peintures: normalizeWorks(peintures),
          croquis: normalizeWorks(croquis),
          evenements: normalizeWorks(evenements),
        });

        console.log('✅ Données chargées:', {
          peintures: peintures?.length || 0,
          croquis: croquis?.length || 0,
          evenements: evenements?.length || 0,
        });
        setLoading(false);
        return;
      } catch (error) {
        console.error(`❌ Erreur chargement œuvres (tentative ${attempt}/${maxAttempts}):`, error.message);
        if (attempt < maxAttempts) {
          await sleep(attempt * 1000);
        }
      }
    }

    setWorks({
      peintures: [],
      croquis: [],
      evenements: [],
    });
    setLoading(false);
  };

  const addWork = async (type, work) => {
    try {
      const newWork = await worksAPI.create({ ...work, type });
      await loadWorks();
      return newWork;
    } catch (error) {
      console.error('Erreur lors de l\'ajout de l\'œuvre:', error);
      throw error;
    }
  };

  const updateWork = async (type, id, updates) => {
    try {
      await worksAPI.update(id, updates);
      await loadWorks();
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'œuvre:', error);
      throw error;
    }
  };

  const removeWork = async (type, id) => {
    try {
      await worksAPI.delete(id);
      await loadWorks();
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'œuvre:', error);
      throw error;
    }
  };

  return (
    <WorksContext.Provider value={{
      works,
      loading,
      addWork,
      updateWork,
      removeWork,
      refreshWorks: loadWorks
    }}>
      {children}
    </WorksContext.Provider>
  );
};
