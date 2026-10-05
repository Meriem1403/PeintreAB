import { useEffect, useState, useCallback, useMemo, useRef, useLayoutEffect } from 'react';
import { useParams, useNavigate, useLocation, Navigate } from 'react-router-dom';
import {
  galleryPath,
  isValidGalleryCategory,
  workDetailPath,
} from '../constants/galleryRoutes';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaTimes,
  FaCalendar,
  FaMapMarkerAlt,
  FaEuroSign,
  FaChevronLeft,
  FaChevronRight,
  FaEnvelope,
  FaHashtag,
  FaTag,
  FaCheckCircle,
} from 'react-icons/fa';
import { useWorks } from '../contexts/WorksContext';
import ContactWorkForm from '../components/ContactWorkForm';
import { normalizeImageUrl } from '../utils/imageUrl';
import './WorkDetail.css';

const categoryLabel = (category) => {
  if (category === 'peintures') return 'Peinture';
  if (category === 'croquis') return 'Croquis';
  return 'Événement';
};

const categoryCollectionLabel = (category) => {
  if (category === 'peintures') return 'Collection peintures';
  if (category === 'croquis') return 'Collection croquis';
  return 'Agenda';
};

const isPlausibleDate = (value) => {
  if (!value) return false;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return false;
  const y = d.getFullYear();
  return y >= 1850 && y <= 2100;
};

const formatWorkDate = (value) => {
  if (!isPlausibleDate(value)) return null;
  return new Date(value).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

const formatWorkDateRange = (start, end) => {
  const a = formatWorkDate(start);
  const b = formatWorkDate(end);
  if (a && b) return `${a} — ${b}`;
  return a || b || null;
};

const fitArtDimensions = (naturalW, naturalH, maxW, maxH) => {
  if (!naturalW || !naturalH || maxW <= 0 || maxH <= 0) return null;
  const scale = Math.min(maxW / naturalW, maxH / naturalH, 1);
  return {
    width: Math.max(1, Math.floor(naturalW * scale)),
    height: Math.max(1, Math.floor(naturalH * scale)),
  };
};

const WorkDetail = () => {
  const { category, id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { works, loading } = useWorks();
  const [imageLoading, setImageLoading] = useState(true);
  const [artSize, setArtSize] = useState(null);
  const [naturalSize, setNaturalSize] = useState(null);
  const [isContactFormOpen, setIsContactFormOpen] = useState(false);
  const [isArtFullscreen, setIsArtFullscreen] = useState(false);
  const stageRef = useRef(null);
  const clusterRef = useRef(null);
  const frameMeasureRef = useRef(null);
  const [light, setLight] = useState({ x: 50, y: 40 });
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const categoryItems = useMemo(() => {
    if (!works || typeof works !== 'object') return [];
    const items = works[category] || [];
    return Array.isArray(items) ? items : [];
  }, [works, category]);

  const { currentWork, currentIndex } = useMemo(() => {
    if (categoryItems && categoryItems.length > 0) {
      if (location.state?.work) {
        const workFromState = location.state.work;
        const foundIndex = categoryItems.findIndex(
          (item) =>
            item && (item.id === workFromState.id || String(item.id) === String(workFromState.id))
        );
        if (foundIndex >= 0) {
          return { currentWork: categoryItems[foundIndex], currentIndex: foundIndex };
        }
        const byTitle = categoryItems.findIndex((item) => item && item.titre === workFromState.titre);
        if (byTitle >= 0) {
          return { currentWork: categoryItems[byTitle], currentIndex: byTitle };
        }
      }

      if (id) {
        const foundById = categoryItems.findIndex((item) => {
          if (!item) return false;
          const itemId = String(item.id || '');
          const searchId = String(id || '');
          return itemId === searchId || itemId === String(Number(id)) || item.id === Number(id);
        });
        if (foundById >= 0) {
          return { currentWork: categoryItems[foundById], currentIndex: foundById };
        }
      }
    }

    if (location.state?.work && (!categoryItems || categoryItems.length === 0)) {
      return { currentWork: location.state.work, currentIndex: 0 };
    }

    if (loading || !categoryItems || categoryItems.length === 0) {
      return { currentWork: null, currentIndex: -1 };
    }

    return { currentWork: null, currentIndex: -1 };
  }, [loading, categoryItems, id, location.state, category]);

  const navigateToWork = useCallback(
    (targetIndex) => {
      if (targetIndex < 0 || targetIndex >= categoryItems.length || !categoryItems[targetIndex]) return;
      const targetWork = categoryItems[targetIndex];
      if (!targetWork?.id) return;
      setImageLoading(true);
      navigate(workDetailPath(category, targetWork.id), { state: { work: targetWork } });
    },
    [categoryItems, category, navigate]
  );

  const handlePrevious = useCallback(
    (e) => {
      e?.preventDefault?.();
      e?.stopPropagation?.();
      if (currentIndex > 0) navigateToWork(currentIndex - 1);
    },
    [currentIndex, navigateToWork]
  );

  const handleNext = useCallback(
    (e) => {
      e?.preventDefault?.();
      e?.stopPropagation?.();
      if (currentIndex >= 0 && currentIndex < categoryItems.length - 1) navigateToWork(currentIndex + 1);
    },
    [currentIndex, categoryItems.length, navigateToWork]
  );

  const handleClose = useCallback(() => {
    navigate(isValidGalleryCategory(category) ? galleryPath(category) : '/galerie');
  }, [category, navigate]);

  useEffect(() => {
    document.body.classList.add('exhibition-mode');
    return () => document.body.classList.remove('exhibition-mode');
  }, []);

  useEffect(() => {
    setIsArtFullscreen(false);
  }, [currentWork?.id, category]);

  useEffect(() => {
    if (!isArtFullscreen) return undefined;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isArtFullscreen]);

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'Escape') {
        if (isArtFullscreen) {
          setIsArtFullscreen(false);
          return;
        }
        handleClose();
      }
      if (isArtFullscreen) return;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrevious();
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleClose, handlePrevious, handleNext, isArtFullscreen]);

  const recomputeArtSize = useCallback(() => {
    const naturalW = naturalSize?.width;
    const naturalH = naturalSize?.height;
    if (!naturalW || !naturalH) return;

    const cluster = clusterRef.current;
    const stage = stageRef.current;
    if (!cluster || !stage) return;

    const clusterStyle = getComputedStyle(cluster);
    const gap = parseFloat(clusterStyle.columnGap || clusterStyle.gap) || 8;
    const navButtons = cluster.querySelectorAll('.exhibition-nav');
    let navTotal = 0;
    navButtons.forEach((btn) => {
      navTotal += btn.getBoundingClientRect().width;
    });
    const gapsTotal = gap * 2;

    const maxFrameW = Math.max(
      120,
      cluster.clientWidth - navTotal - gapsTotal - 4
    );
    const maxFrameH = Math.max(120, stage.clientHeight - 8);

    const next = fitArtDimensions(naturalW, naturalH, maxFrameW, maxFrameH);
    if (!next) return;
    setArtSize((prev) =>
      prev && prev.width === next.width && prev.height === next.height ? prev : next
    );
  }, [naturalSize]);

  useEffect(() => {
    const nextImageUrl = normalizeImageUrl(currentWork?.image);
    setArtSize(null);
    setNaturalSize(null);
    if (!nextImageUrl) {
      setImageLoading(false);
      return;
    }
    setImageLoading(true);
    const img = new Image();
    const applyDimensions = () => {
      if (img.naturalWidth > 0 && img.naturalHeight > 0) {
        setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
      }
      setImageLoading(false);
    };
    img.onload = applyDimensions;
    img.onerror = () => setImageLoading(false);
    img.src = nextImageUrl;
    if (img.complete && img.naturalHeight !== 0) applyDimensions();
  }, [currentWork?.id, currentWork?.image]);

  useLayoutEffect(() => {
    recomputeArtSize();
  }, [recomputeArtSize, naturalSize, currentWork?.id]);

  useEffect(() => {
    const stage = stageRef.current;
    const cluster = clusterRef.current;
    if (!stage || !cluster) return undefined;

    let rafId = 0;
    const scheduleRecompute = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => recomputeArtSize());
    };

    const observer = new ResizeObserver(scheduleRecompute);
    observer.observe(stage);
    observer.observe(cluster);
    window.addEventListener('resize', scheduleRecompute);
    return () => {
      cancelAnimationFrame(rafId);
      observer.disconnect();
      window.removeEventListener('resize', scheduleRecompute);
    };
  }, [recomputeArtSize, currentWork?.id]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [location.pathname]);

  const onStageMove = (e) => {
    const el = stageRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setLight({ x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) });
    if (typeof window !== 'undefined' && window.innerWidth >= 1100) {
      setTilt({ x: 0, y: 0 });
      return;
    }
    setTilt({
      x: (y - 50) * 0.12,
      y: (x - 50) * -0.12,
    });
  };

  const onStageLeave = () => {
    setTilt({ x: 0, y: 0 });
    setLight({ x: 50, y: 40 });
  };

  if (!isValidGalleryCategory(category)) {
    return <Navigate to="/galerie" replace />;
  }

  if (loading && !location.state?.work) {
    return (
      <div className="exhibition exhibition--loading">
        <div className="exhibition-loader" />
        <p>Préparation de la salle…</p>
      </div>
    );
  }

  if (!loading && (!currentWork || currentIndex < 0)) {
    return (
      <div className="exhibition exhibition--error">
        <h2>Œuvre introuvable</h2>
        <button type="button" className="exhibition-btn" onClick={handleClose}>
          Retour à la galerie
        </button>
      </div>
    );
  }

  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < categoryItems.length - 1;
  const imageUrl = normalizeImageUrl(currentWork.image);
  const workKey = `${currentWork.id}-${category}`;
  const dateLabel = currentWork.date_debut
    ? formatWorkDateRange(currentWork.date_debut, currentWork.date_fin)
    : formatWorkDate(currentWork.date);
  const isArtwork = category === 'peintures' || category === 'croquis';
  const showPriceRow = isArtwork || currentWork.prix || currentWork.is_sold;
  let priceLabel = 'Sur demande';
  if (currentWork.is_sold) priceLabel = 'Collection privée';
  else if (currentWork.prix) priceLabel = `${currentWork.prix} €`;

  let availabilityLabel = 'Présenté en galerie';
  if (currentWork.is_sold) availabilityLabel = 'Acquise — hors vente';
  else if (isArtwork) availabilityLabel = 'Disponible à l’acquisition';
  else if (category === 'evenements') availabilityLabel = 'Événement à venir ou passé';

  const catalogLine = `${String(currentIndex + 1).padStart(2, '0')} / ${String(categoryItems.length).padStart(2, '0')} · ${categoryCollectionLabel(category)}`;
  const referenceLabel = currentWork.id
    ? `AB-${String(category).slice(0, 3).toUpperCase()}-${String(currentWork.id).padStart(4, '0')}`
    : null;

  const showContact = !currentWork.is_sold && isArtwork;

  return (
    <div
      className="exhibition"
      style={{
        '--light-x': `${light.x}%`,
        '--light-y': `${light.y}%`,
      }}
    >
      <div className="exhibition-veil" aria-hidden="true" />
      <div className="exhibition-ambient exhibition-ambient--a" aria-hidden="true" />
      <div className="exhibition-ambient exhibition-ambient--b" aria-hidden="true" />
      <div className="exhibition-spotlight" aria-hidden="true" />
      <div className="exhibition-vignette" aria-hidden="true" />
      <div className="exhibition-floor-glow" aria-hidden="true" />

      <header className="exhibition-toolbar">
        <button type="button" className="exhibition-icon-btn" onClick={handleClose} aria-label="Fermer">
          <FaTimes />
        </button>
        <div className="exhibition-toolbar-center">
          <span className="exhibition-room-label">{categoryLabel(category)}</span>
          <span className="exhibition-index">
            {String(currentIndex + 1).padStart(2, '0')}
            <span className="exhibition-index-sep">/</span>
            {String(categoryItems.length).padStart(2, '0')}
          </span>
        </div>
        <div className="exhibition-toolbar-spacer" />
      </header>

      <div className="exhibition-layout">
        <section
          className="exhibition-stage"
          ref={stageRef}
          onMouseMove={onStageMove}
          onMouseLeave={onStageLeave}
          onTouchMove={(e) => {
            const t = e.touches[0];
            if (t) onStageMove({ clientX: t.clientX, clientY: t.clientY });
          }}
        >
          <div className="exhibition-art-cluster" ref={clusterRef}>
            <button
              type="button"
              className={`exhibition-nav exhibition-nav--prev ${!hasPrevious ? 'is-hidden' : ''}`}
              onClick={handlePrevious}
              disabled={!hasPrevious}
              aria-label="Œuvre précédente"
            >
              <FaChevronLeft />
            </button>

            <AnimatePresence mode="wait">
              <motion.div
                key={workKey}
                className="exhibition-art-sculpt"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              >
                <motion.div
                  className="exhibition-art-float"
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <motion.div
                    className="exhibition-art-tilt"
                    style={{ rotateX: tilt.x, rotateY: tilt.y }}
                    transition={{ type: 'spring', stiffness: 140, damping: 20 }}
                  >
                    <motion.div
                      className="exhibition-art-piece"
                      ref={frameMeasureRef}
                      initial={{ opacity: 0.9 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <button
                        type="button"
                        className="exhibition-art-canvas exhibition-art-canvas--zoom"
                        style={
                          artSize
                            ? { width: artSize.width, height: artSize.height }
                            : undefined
                        }
                        onClick={() => imageUrl && !imageLoading && setIsArtFullscreen(true)}
                        disabled={!imageUrl || imageLoading}
                        aria-label="Voir l'œuvre en plein écran"
                      >
                        {imageLoading && <div className="exhibition-art-loader" />}
                        {imageUrl && (
                          <motion.img
                            src={imageUrl}
                            alt={currentWork.titre || 'Œuvre'}
                            className={imageLoading || !artSize ? 'is-loading' : ''}
                            width={artSize?.width}
                            height={artSize?.height}
                            draggable={false}
                            onLoad={(e) => {
                              const el = e.currentTarget;
                              if (el.naturalWidth > 0 && el.naturalHeight > 0) {
                                setNaturalSize({
                                  width: el.naturalWidth,
                                  height: el.naturalHeight,
                                });
                              }
                              setImageLoading(false);
                            }}
                            onError={() => setImageLoading(false)}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                          />
                        )}
                        {imageUrl && !imageLoading && (
                          <span className="exhibition-art-zoom-hint" aria-hidden>
                            Plein écran
                          </span>
                        )}
                      </button>
                    </motion.div>
                    <div className="exhibition-pedestal-shadow" aria-hidden="true" />
                  </motion.div>
                </motion.div>
              </motion.div>
            </AnimatePresence>

            <button
              type="button"
              className={`exhibition-nav exhibition-nav--next ${!hasNext ? 'is-hidden' : ''}`}
              onClick={handleNext}
              disabled={!hasNext}
              aria-label="Œuvre suivante"
            >
              <FaChevronRight />
            </button>
          </div>
        </section>

        <motion.footer
          className="exhibition-placard"
          key={`placard-${workKey}`}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="exhibition-placard-inner">
            <div className="exhibition-placard-intro">
              <span className="exhibition-placard-type">{categoryLabel(category)}</span>
              <p className="exhibition-placard-catalog">{catalogLine}</p>
              <h1>{currentWork.titre || 'Sans titre'}</h1>
            </div>

            {(currentWork.description || isArtwork) && (
              <section className="exhibition-placard-about" aria-labelledby="placard-about-heading">
                <h2 id="placard-about-heading" className="exhibition-placard-section-title">
                  À propos
                </h2>
                {currentWork.description ? (
                  <p className="exhibition-placard-desc">{currentWork.description}</p>
                ) : (
                  <p className="exhibition-placard-desc exhibition-placard-desc--muted">
                    Œuvre originale présentée dans la galerie en ligne. Renseignements sur la
                    technique, le format ou la disponibilité sur simple demande.
                  </p>
                )}
              </section>
            )}

            <div className="exhibition-placard-divider" aria-hidden="true" />

            <div className="exhibition-placard-facts">
              <div className="exhibition-fact">
                <FaCheckCircle className="exhibition-fact-icon" aria-hidden />
                <div>
                  <span className="exhibition-fact-label">Statut</span>
                  <span className="exhibition-fact-value">{availabilityLabel}</span>
                </div>
              </div>

              {showPriceRow && (
                <div className="exhibition-fact">
                  <FaEuroSign className="exhibition-fact-icon" aria-hidden />
                  <div>
                    <span className="exhibition-fact-label">Tarif</span>
                    <span className="exhibition-fact-value">{priceLabel}</span>
                  </div>
                </div>
              )}

              {dateLabel && (
                <div className="exhibition-fact">
                  <FaCalendar className="exhibition-fact-icon" aria-hidden />
                  <div>
                    <span className="exhibition-fact-label">Date</span>
                    <span className="exhibition-fact-value">{dateLabel}</span>
                  </div>
                </div>
              )}

              <div className="exhibition-fact">
                <FaTag className="exhibition-fact-icon" aria-hidden />
                <div>
                  <span className="exhibition-fact-label">Univers</span>
                  <span className="exhibition-fact-value">{categoryCollectionLabel(category)}</span>
                </div>
              </div>

              {referenceLabel && (
                <div className="exhibition-fact">
                  <FaHashtag className="exhibition-fact-icon" aria-hidden />
                  <div>
                    <span className="exhibition-fact-label">Référence</span>
                    <span className="exhibition-fact-value">{referenceLabel}</span>
                  </div>
                </div>
              )}

              {(currentWork.lieu || currentWork.adresse) && (
                <div className="exhibition-fact">
                  <FaMapMarkerAlt className="exhibition-fact-icon" aria-hidden />
                  <div>
                    <span className="exhibition-fact-label">Lieu</span>
                    {currentWork.adresse ? (
                      <a
                        className="exhibition-fact-value exhibition-fact-link"
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(currentWork.adresse)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {currentWork.lieu || currentWork.adresse}
                      </a>
                    ) : (
                      <span className="exhibition-fact-value">{currentWork.lieu}</span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {showContact && (
              <div className="exhibition-placard-cta">
                <p className="exhibition-placard-cta-hint">
                  Une question sur cette œuvre, une visite ou un achat ?
                </p>
                <button
                  type="button"
                  className="exhibition-btn exhibition-btn--primary"
                  onClick={() => setIsContactFormOpen(true)}
                >
                  <FaEnvelope aria-hidden />
                  Cette œuvre m&apos;intéresse
                </button>
              </div>
            )}
          </div>
        </motion.footer>
      </div>

      <AnimatePresence>
        {isArtFullscreen && imageUrl && (
          <motion.div
            className="exhibition-fullscreen"
            role="dialog"
            aria-modal="true"
            aria-label={`${currentWork.titre || 'Œuvre'} — plein écran`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={() => setIsArtFullscreen(false)}
          >
            <button
              type="button"
              className="exhibition-fullscreen-close"
              aria-label="Fermer le plein écran"
              onClick={() => setIsArtFullscreen(false)}
            >
              <FaTimes />
            </button>
            <img
              src={imageUrl}
              alt={currentWork.titre || 'Œuvre'}
              className="exhibition-fullscreen-img"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isContactFormOpen && (
          <ContactWorkForm
            work={currentWork}
            onClose={() => setIsContactFormOpen(false)}
            onSuccess={() => {}}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default WorkDetail;
