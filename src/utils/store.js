// Store pour gérer les œuvres en localStorage
import { initialWorks } from './initialData';

const STORAGE_KEY = 'peintreab_works';
const INITIALIZED_KEY = 'peintreab_initialized';

export const saveWorks = (works) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(works));
};

export const getWorks = () => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    const works = JSON.parse(stored);
    // Si les tableaux sont vides, charger les données initiales
    const totalWorks = (works.peintures?.length || 0) + 
                      (works.croquis?.length || 0) + 
                      (works.evenements?.length || 0);
    if (totalWorks === 0) {
      saveWorks(initialWorks);
      localStorage.setItem(INITIALIZED_KEY, 'true');
      return initialWorks;
    }
    return works;
  }
  // Si pas de données, charger les données initiales
  saveWorks(initialWorks);
  localStorage.setItem(INITIALIZED_KEY, 'true');
  return initialWorks;
};

export const addWork = (type, work) => {
  const works = getWorks();
  const newWork = {
    id: Date.now().toString(),
    ...work,
    createdAt: new Date().toISOString()
  };
  works[type] = [...works[type], newWork];
  saveWorks(works);
  return newWork;
};

export const updateWork = (type, id, updates) => {
  const works = getWorks();
  works[type] = works[type].map(work => 
    work.id === id ? { ...work, ...updates } : work
  );
  saveWorks(works);
};

export const deleteWork = (type, id) => {
  const works = getWorks();
  works[type] = works[type].filter(work => work.id !== id);
  saveWorks(works);
};

// Fonction pour réinitialiser les données initiales
export const resetToInitialData = () => {
  saveWorks(initialWorks);
  return initialWorks;
};
