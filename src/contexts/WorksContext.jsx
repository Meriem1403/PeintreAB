import { createContext, useContext, useState, useEffect } from 'react';
import { worksAPI } from '../utils/apiService';

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
  }, []);

  const loadWorks = async () => {
    try {
      setLoading(true);
      console.log('🔄 Chargement des œuvres depuis l\'API...');
      
      const [peintures, croquis, evenements] = await Promise.all([
        worksAPI.getAll('peintures'),
        worksAPI.getAll('croquis'),
        worksAPI.getAll('evenements'),
      ]);
      
      console.log('✅ Données chargées:', { 
        peintures: peintures?.length || 0, 
        croquis: croquis?.length || 0, 
        evenements: evenements?.length || 0 
      });
      
      setWorks({
        peintures: peintures || [],
        croquis: croquis || [],
        evenements: evenements || [],
      });
    } catch (error) {
      console.error('❌ Erreur lors du chargement des œuvres:', error);
      // En cas d'erreur, garder des tableaux vides pour éviter un crash
      setWorks({
        peintures: [],
        croquis: [],
        evenements: []
      });
    } finally {
      setLoading(false);
    }
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
