import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaCalendar, FaMapMarkerAlt, FaEuroSign, FaChevronLeft, FaChevronRight, FaPalette, FaPencilAlt, FaEnvelope } from 'react-icons/fa';
import { useWorks } from '../contexts/WorksContext';
import ContactWorkForm from '../components/ContactWorkForm';
import { normalizeImageUrl } from '../utils/imageUrl';
import './WorkDetail.css';

const WorkDetail = () => {
  const { category, id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { works, loading } = useWorks();
  const [imageLoading, setImageLoading] = useState(true);
  const [isContactFormOpen, setIsContactFormOpen] = useState(false);

  // S'assurer que categoryItems est toujours un tableau
  const categoryItems = useMemo(() => {
    if (!works || typeof works !== 'object') return [];
    const items = works[category] || [];
    return Array.isArray(items) ? items : [];
  }, [works, category]);

  // Trouver l'œuvre actuelle - logique optimisée pour un chargement rapide
  const { currentWork, currentIndex } = useMemo(() => {
    // PRIORITÉ 1: Chercher dans categoryItems (données fraîches de la base) si disponible
    if (categoryItems && categoryItems.length > 0) {
      // Si on a un work dans location.state, chercher le même dans categoryItems pour avoir les données à jour
      if (location.state?.work) {
        const workFromState = location.state.work;
        const foundIndex = categoryItems.findIndex(item => 
          item && (item.id === workFromState.id || String(item.id) === String(workFromState.id))
        );
        if (foundIndex >= 0) {
          // Utiliser le work depuis categoryItems (données fraîches) plutôt que location.state
          const workFromDB = categoryItems[foundIndex];
          console.log('✅ Œuvre trouvée dans categoryItems:', { id: workFromDB.id, titre: workFromDB.titre, adresse: workFromDB.adresse, lieu: workFromDB.lieu });
          return { currentWork: workFromDB, currentIndex: foundIndex };
        }
        // Fallback par titre
        const byTitle = categoryItems.findIndex(item => 
          item && item.titre === workFromState.titre
        );
        if (byTitle >= 0) {
          return { currentWork: categoryItems[byTitle], currentIndex: byTitle };
        }
      }
      
      // PRIORITÉ 2: Chercher par ID dans l'URL si pas de location.state
      if (id) {
        const foundById = categoryItems.findIndex(item => {
          if (!item) return false;
          const itemId = String(item.id || '');
          const searchId = String(id || '');
          return itemId === searchId || itemId === String(Number(id)) || item.id === Number(id);
        });
        
        if (foundById >= 0) {
          console.log('✅ Œuvre trouvée via ID URL à l\'index', foundById);
          return { currentWork: categoryItems[foundById], currentIndex: foundById };
        }
      }
      
      // PRIORITÉ 3: Utiliser le premier item disponible
      if (categoryItems[0]) {
        console.log('✅ Utilisation du premier item disponible (index 0)');
        return { currentWork: categoryItems[0], currentIndex: 0 };
      }
    }
    
    // Fallback: Utiliser location.state.work si categoryItems n'est pas encore chargé
    if (location.state?.work && (!categoryItems || categoryItems.length === 0)) {
      return { currentWork: location.state.work, currentIndex: 0 };
    }

    // Si pas d'items ou chargement en cours, retourner null
    if (loading || !categoryItems || categoryItems.length === 0) {
      return { currentWork: null, currentIndex: -1 };
    }

    // PRIORITÉ 2: Chercher par ID dans l'URL (numérique ou string)
    if (id) {
      const foundById = categoryItems.findIndex(item => {
        if (!item) return false;
        const itemId = String(item.id || '');
        const searchId = String(id || '');
        return itemId === searchId || itemId === String(Number(id)) || item.id === Number(id);
      });
      
      if (foundById >= 0) {
        console.log('✅ Œuvre trouvée via ID URL à l\'index', foundById);
        return { currentWork: categoryItems[foundById], currentIndex: foundById };
      }
    }

    // PRIORITÉ 3: Utiliser le premier item disponible
    if (categoryItems[0]) {
      console.log('✅ Utilisation du premier item disponible (index 0)');
      return { currentWork: categoryItems[0], currentIndex: 0 };
    }

    // Aucun item trouvé
    console.warn('❌ Aucune œuvre trouvée avec les paramètres:', { category, id, itemsCount: categoryItems.length });
    return { currentWork: null, currentIndex: -1 };
  }, [loading, categoryItems, id, location.state, category]);

  // Navigation vers une œuvre
  const navigateToWork = useCallback((targetIndex) => {
    if (targetIndex < 0 || targetIndex >= categoryItems.length || !categoryItems[targetIndex]) {
      console.warn('⚠️ Index invalide pour navigation:', targetIndex);
      return;
    }
    
    const targetWork = categoryItems[targetIndex];
    if (!targetWork || !targetWork.id) {
      console.warn('⚠️ Work invalide à l\'index:', targetIndex);
      return;
    }

    setImageLoading(true);
    const workId = String(targetWork.id);
    console.log('🔄 Navigation vers œuvre:', workId, 'à l\'index', targetIndex);
    
    try {
      navigate(`/galerie/${category}/${workId}`, { state: { work: targetWork } });
    } catch (error) {
      console.error('❌ Erreur navigation:', error);
      setImageLoading(false);
    }
  }, [categoryItems, category, navigate]);

  const handlePrevious = useCallback((e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    if (currentIndex > 0) {
      navigateToWork(currentIndex - 1);
    }
  }, [currentIndex, navigateToWork]);

  const handleNext = useCallback((e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    if (currentIndex >= 0 && currentIndex < categoryItems.length - 1) {
      navigateToWork(currentIndex + 1);
    }
  }, [currentIndex, categoryItems.length, navigateToWork]);

  const handleClose = useCallback(() => {
    navigate('/galerie');
  }, [navigate]);

  // Navigation clavier
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      switch (e.key) {
        case 'Escape':
          handleClose();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          handlePrevious();
          break;
        case 'ArrowRight':
          e.preventDefault();
          handleNext();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleClose, handlePrevious, handleNext]);

  // Réinitialiser le chargement d'image quand l'œuvre change
  useEffect(() => {
    const nextImageUrl = normalizeImageUrl(currentWork?.image);
    if (nextImageUrl) {
      setImageLoading(true);
      // Vérifier si l'image est déjà chargée (en cache)
      const img = new Image();
      
      // Définir les handlers avant de définir src
      img.onload = () => {
        setImageLoading(false);
      };
      img.onerror = () => {
        setImageLoading(false);
      };
      
      // Définir src (déclenche le chargement si pas en cache)
      img.src = nextImageUrl;
      
      // Si l'image est déjà en cache, onLoad ne se déclenchera pas
      // Vérifier complete après un court délai pour permettre au navigateur de vérifier le cache
      setTimeout(() => {
        if (img.complete && img.naturalHeight !== 0) {
          setImageLoading(false);
        }
      }, 50);
    } else {
      setImageLoading(false);
    }
  }, [currentWork?.id, currentWork?.image]);

  // Scroll en haut lors de l'ouverture d'une œuvre
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname]);

  // ÉTAT: Chargement (seulement si pas de work dans location.state)
  if (loading && !location.state?.work) {
    return (
      <div className="work-detail">
        <div className="work-detail-loading">
          <div className="loading-spinner"></div>
          <p>Chargement de l'œuvre...</p>
        </div>
      </div>
    );
  }

  // ÉTAT: Pas d'œuvre trouvée (seulement après le chargement ou si vraiment pas trouvée)
  if (!loading && (!currentWork || currentIndex < 0)) {
    return (
      <div className="work-detail">
        <div className="work-detail-error">
          <h2>Œuvre non trouvée</h2>
          <p>L'œuvre que vous recherchez n'existe pas ou a été supprimée.</p>
          <p style={{ fontSize: '0.85rem', color: '#999', marginTop: '1rem' }}>
            Catégorie: {category || 'inconnue'}, ID: {id || 'inconnu'}
          </p>
          <button className="btn-back" onClick={handleClose}>
            Retour à la galerie
          </button>
        </div>
      </div>
    );
  }

  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < categoryItems.length - 1;
  const imageUrl = normalizeImageUrl(currentWork.image);

  // Rendu principal - TOUJOURS quelque chose si on arrive ici
  return (
    <div className="work-detail">
      <motion.div
        key={`work-${currentWork.id || 'unknown'}-${category}`}
        className="work-detail-container"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        {/* Bouton fermer */}
        <motion.button
          className="work-detail-close"
          onClick={handleClose}
          whileHover={{ scale: 1.1, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
          aria-label="Fermer"
        >
          <FaTimes />
        </motion.button>

        {/* Navigation gauche/droite */}
        {hasPrevious && (
          <motion.button
            className="work-detail-nav work-detail-nav-left"
            onClick={handlePrevious}
            whileHover={{ scale: 1.15, x: -5 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Œuvre précédente"
          >
            <FaChevronLeft />
          </motion.button>
        )}

        {hasNext && (
          <motion.button
            className="work-detail-nav work-detail-nav-right"
            onClick={handleNext}
            whileHover={{ scale: 1.15, x: 5 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Œuvre suivante"
          >
            <FaChevronRight />
          </motion.button>
        )}

        {/* Contenu principal */}
        <div className="work-detail-content">
          {/* Image */}
          {imageUrl && (
            <motion.div
              className="work-detail-image-wrapper"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
            >
              <div className="work-detail-image">
                {imageLoading && (
                  <div className="image-loader">
                    <div className="loader"></div>
                  </div>
                )}
                <img
                  src={imageUrl}
                  alt={currentWork.titre || 'Œuvre'}
                  onLoad={(e) => {
                    setImageLoading(false);
                    // S'assurer que l'image est visible même si elle était en cache
                    if (e.target.complete) {
                      setImageLoading(false);
                    }
                  }}
                  onError={() => {
                    console.warn('⚠️ Erreur chargement image:', imageUrl);
                    setImageLoading(false);
                  }}
                  style={{ opacity: imageLoading ? 0 : 1, transition: 'opacity 0.3s' }}
                />
              </div>
            </motion.div>
          )}

          {/* Informations */}
          <motion.div
            className="work-detail-info"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: 0.05 }}
          >
            <div className="work-detail-header">
              <h1>{currentWork.titre || 'Sans titre'}</h1>
              <div className="work-detail-counter">
                <span className="counter-current">{currentIndex + 1}</span>
                <span className="counter-separator">/</span>
                <span className="counter-total">{categoryItems.length}</span>
              </div>
            </div>

            {currentWork.description && (
              <p className="work-detail-description">
                {currentWork.description}
              </p>
            )}

            <div className="work-detail-meta">
              {(currentWork.prix || currentWork.is_sold) && (
                <div className="meta-item">
                  <div className="meta-icon-wrapper">
                    <FaEuroSign className="meta-icon" />
                  </div>
                  <div className="meta-content">
                    <span className="meta-label">Prix</span>
                    <span className={`meta-value ${currentWork.is_sold ? 'sold-status' : ''}`}>
                      {currentWork.is_sold ? 'Collection privée' : `${currentWork.prix}€`}
                    </span>
                  </div>
                </div>
              )}

              {(currentWork.date || currentWork.date_debut) && (
                <div className="meta-item">
                  <div className="meta-icon-wrapper">
                    <FaCalendar className="meta-icon" />
                  </div>
                  <div className="meta-content">
                    <span className="meta-label">Date</span>
                    <span className="meta-value">
                      {currentWork.date_debut && currentWork.date_fin ? (
                        <>
                          {new Date(currentWork.date_debut).toLocaleDateString('fr-FR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })} - {new Date(currentWork.date_fin).toLocaleDateString('fr-FR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </>
                      ) : (
                        new Date(currentWork.date_debut || currentWork.date).toLocaleDateString('fr-FR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })
                      )}
                    </span>
                  </div>
                </div>
              )}

              {(currentWork.lieu || currentWork.adresse) && (
                <div className="meta-item">
                  <div className="meta-icon-wrapper">
                    <FaMapMarkerAlt className="meta-icon" />
                  </div>
                  <div className="meta-content">
                    <span className="meta-label">Lieu</span>
                    {currentWork.adresse ? (
                      <a 
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(currentWork.adresse)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="meta-value meta-link"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {currentWork.lieu ? `${currentWork.lieu} - ${currentWork.adresse}` : currentWork.adresse}
                      </a>
                    ) : (
                      <span className="meta-value">{currentWork.lieu}</span>
                    )}
                  </div>
                </div>
              )}

              <div className="meta-item">
                <div className="meta-icon-wrapper">
                  {category === 'peintures' ? (
                    <FaPalette className="meta-icon" />
                  ) : category === 'croquis' ? (
                    <FaPencilAlt className="meta-icon" />
                  ) : (
                    <FaCalendar className="meta-icon" />
                  )}
                </div>
                <div className="meta-content">
                  <span className="meta-label">Type</span>
                  <span className="meta-value">
                    {category === 'peintures' ? 'Peinture' :
                     category === 'croquis' ? 'Croquis' :
                     'Événement'}
                  </span>
                </div>
              </div>
            </div>

            {/* Bouton "Cette œuvre m'intéresse" pour les œuvres disponibles */}
            {!currentWork.is_sold && (category === 'peintures' || category === 'croquis') && (
              <motion.button
                className="work-interest-button"
                onClick={() => setIsContactFormOpen(true)}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FaEnvelope />
                Cette œuvre m'intéresse
              </motion.button>
            )}
          </motion.div>
        </div>
      </motion.div>

      {/* Modal formulaire de contact */}
      <AnimatePresence>
        {isContactFormOpen && (
          <ContactWorkForm
            work={currentWork}
            onClose={() => setIsContactFormOpen(false)}
            onSuccess={() => {
              console.log('Message envoyé avec succès');
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default WorkDetail;
