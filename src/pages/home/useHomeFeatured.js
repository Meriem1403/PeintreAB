import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorks } from '../../contexts/WorksContext';
import { mergeAtelierHeroCopy, mergeAtelierSectionCopy } from '../../constants/atelierHeroCopy';
import { workDetailPath } from '../../constants/galleryRoutes';
import { siteSettingsAPI } from '../../utils/apiService';
import { normalizeImageUrl } from '../../utils/imageUrl';

export const workCategoryLabel = (category, labelLookup) => {
  if (typeof labelLookup === 'function') return labelLookup(category);
  if (category === 'croquis') return 'Croquis';
  if (category === 'evenements') return 'Événement';
  if (category === 'peintures') return 'Peinture';
  return category || 'Œuvre';
};

/** Grille carrousel : colonnes réelles + mode compact si la ligne n’est pas pleine */
export function getAtelierCarouselGridLayout(visibleCount, perView) {
  const cols = Math.max(1, Math.min(perView, visibleCount));
  const compact = visibleCount < perView;
  return { cols, compact };
}

const getWorksPerView = (width) => {
  if (width < 640) return 1;
  if (width < 1024) return 2;
  return 3;
};

const getEventsPerView = (width) => {
  if (width < 640) return 1;
  if (width < 1024) return 2;
  return 3;
};

const sortByDisplayOrder = (a, b) => {
  const orderA = a.display_order !== undefined && a.display_order !== null ? a.display_order : 999999;
  const orderB = b.display_order !== undefined && b.display_order !== null ? b.display_order : 999999;
  if (orderA !== orderB) return orderA - orderB;
  const dateA = a.created_at ? new Date(a.created_at) : new Date(0);
  const dateB = b.created_at ? new Date(b.created_at) : new Date(0);
  return dateB - dateA;
};

export function useHomeFeatured({ measureNavForClassic = false, measureNavForAtelier = false } = {}) {
  const homeRef = useRef(null);
  const { works, loading } = useWorks();
  const navigate = useNavigate();
  const [featuredWorks, setFeaturedWorks] = useState([]);
  const [featuredEvents, setFeaturedEvents] = useState([]);
  const [heroImage, setHeroImage] = useState('/images/peintures/2025-2-le-cours.jpg');
  const [atelierHeroCopy, setAtelierHeroCopy] = useState(() => mergeAtelierHeroCopy());
  const [atelierSectionCopy, setAtelierSectionCopy] = useState(() => mergeAtelierSectionCopy());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isEventPaused, setIsEventPaused] = useState(false);
  const [worksPerView, setWorksPerView] = useState(() => getWorksPerView(window.innerWidth));
  const [eventsPerView, setEventsPerView] = useState(() => getEventsPerView(window.innerWidth));
  const [heroViewportPx, setHeroViewportPx] = useState(() =>
    Math.max(280, Math.round(window.innerHeight - 76))
  );

  useEffect(() => {
    if (!measureNavForClassic && !measureNavForAtelier) return undefined;

    let lastHeroPx = -1;
    let lastNavPx = -1;
    let lastBottomPx = -1;
    let debounceId = 0;

    const measureNav = () => {
      const nav = document.querySelector('.navbar');
      const bottomNav = document.querySelector('.site-bottom-nav');
      const navPx = nav ? Math.round(nav.getBoundingClientRect().height) : 76;
      const bottomVisible =
        bottomNav &&
        window.getComputedStyle(bottomNav).display !== 'none' &&
        bottomNav.getBoundingClientRect().height > 0;
      const bottomPx = bottomVisible
        ? Math.round(bottomNav.getBoundingClientRect().height)
        : 0;
      const offset = `${navPx}px`;
      const root = homeRef.current;

      if (measureNavForClassic) {
        document.documentElement.style.setProperty('--home-nav-offset', offset);
        root?.style.setProperty('--home-nav-offset', offset);
      }

      if (measureNavForAtelier) {
        /* Prefer visualViewport (évite le thrash de la barre d’URL mobile) */
        const viewportH = Math.round(
          window.visualViewport?.height || window.innerHeight
        );
        const heroPx = Math.max(280, viewportH - navPx - bottomPx);
        /* Ignore les micro-variations (±2px) qui font clignoter les canvas */
        const heroStable =
          lastHeroPx < 0 || Math.abs(heroPx - lastHeroPx) >= 3;
        const chromeStable =
          navPx !== lastNavPx || bottomPx !== lastBottomPx;

        if (!heroStable && !chromeStable) return;

        lastHeroPx = heroPx;
        lastNavPx = navPx;
        lastBottomPx = bottomPx;

        const heroValue = `${heroPx}px`;
        const chromePx = `${navPx + bottomPx}px`;

        setHeroViewportPx((prev) => (prev === heroPx ? prev : heroPx));
        document.documentElement.style.setProperty('--atelier-nav-h', offset);
        document.documentElement.style.setProperty('--atelier-bottom-nav-h', `${bottomPx}px`);
        document.documentElement.style.setProperty('--atelier-chrome-h', chromePx);
        document.documentElement.style.setProperty('--atelier-viewport-h', heroValue);
        root?.style.setProperty('--atelier-nav-h', offset);
        root?.style.setProperty('--atelier-bottom-nav-h', `${bottomPx}px`);
        root?.style.setProperty('--atelier-chrome-h', chromePx);
        root?.style.setProperty('--atelier-viewport-h', heroValue);
      }
    };

    const scheduleMeasure = () => {
      window.clearTimeout(debounceId);
      debounceId = window.setTimeout(measureNav, 80);
    };

    measureNav();
    const raf = requestAnimationFrame(measureNav);
    const t1 = window.setTimeout(measureNav, 120);

    const nav = document.querySelector('.navbar');
    const bottomNav = document.querySelector('.site-bottom-nav');
    const navObserver = new ResizeObserver(scheduleMeasure);
    if (nav) navObserver.observe(nav);
    if (bottomNav) navObserver.observe(bottomNav);

    window.addEventListener('resize', scheduleMeasure);
    window.addEventListener('orientationchange', scheduleMeasure);
    window.visualViewport?.addEventListener('resize', scheduleMeasure);

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(t1);
      window.clearTimeout(debounceId);
      navObserver.disconnect();
      window.removeEventListener('resize', scheduleMeasure);
      window.removeEventListener('orientationchange', scheduleMeasure);
      window.visualViewport?.removeEventListener('resize', scheduleMeasure);
    };
  }, [measureNavForClassic, measureNavForAtelier]);

  useEffect(() => {
    const onResize = () => {
      setWorksPerView(getWorksPerView(window.innerWidth));
      setEventsPerView(getEventsPerView(window.innerWidth));
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    setCurrentIndex((i) => {
      const max = Math.max(0, featuredWorks.length - worksPerView);
      return Math.min(i, max);
    });
  }, [worksPerView, featuredWorks.length]);

  useEffect(() => {
    setCurrentEventIndex((i) => {
      const max = Math.max(0, featuredEvents.length - eventsPerView);
      return Math.min(i, max);
    });
  }, [eventsPerView, featuredEvents.length]);

  useEffect(() => {
    const loadSiteSettings = async () => {
      try {
        const settings = await siteSettingsAPI.get();
        if (settings.hero_image) {
          setHeroImage(normalizeImageUrl(settings.hero_image));
        }
        setAtelierHeroCopy(mergeAtelierHeroCopy(settings));
        setAtelierSectionCopy(mergeAtelierSectionCopy(settings));
      } catch (error) {
        console.error('Erreur lors du chargement des paramètres accueil:', error);
      }
    };
    loadSiteSettings();
  }, []);

  useEffect(() => {
    if (!loading && works) {
      const featured = [];
      const events = [];
      Object.keys(works).forEach((category) => {
        if (Array.isArray(works[category])) {
          works[category].forEach((work) => {
            if (work.is_featured) {
              if (category === 'evenements') {
                events.push({ ...work, category });
              } else {
                featured.push({ ...work, category });
              }
            }
          });
        }
      });
      setFeaturedWorks(featured.sort(sortByDisplayOrder));
      setFeaturedEvents(events.sort(sortByDisplayOrder));
    }
  }, [works, loading]);

  const worksMaxIndex = Math.max(0, featuredWorks.length - worksPerView);
  const eventsMaxIndex = Math.max(0, featuredEvents.length - eventsPerView);
  const worksPageCount = Math.max(1, Math.ceil(featuredWorks.length / worksPerView));
  const eventsPageCount = Math.max(1, Math.ceil(featuredEvents.length / eventsPerView));

  useEffect(() => {
    if (featuredWorks.length <= worksPerView || isPaused) return undefined;
    const id = setInterval(() => {
      setCurrentIndex((prev) => (prev >= worksMaxIndex ? 0 : prev + 1));
    }, 4000);
    return () => clearInterval(id);
  }, [featuredWorks.length, isPaused, worksPerView, worksMaxIndex]);

  useEffect(() => {
    if (featuredEvents.length <= eventsPerView || isEventPaused) return undefined;
    const id = setInterval(() => {
      setCurrentEventIndex((prev) => (prev >= eventsMaxIndex ? 0 : prev + 1));
    }, 4000);
    return () => clearInterval(id);
  }, [featuredEvents.length, isEventPaused, eventsPerView, eventsMaxIndex]);

  const getVisibleWorks = () => {
    if (!featuredWorks.length) return [];
    if (featuredWorks.length <= worksPerView) return featuredWorks;
    const start = Math.min(currentIndex, worksMaxIndex);
    const slice = featuredWorks.slice(start, start + worksPerView);
    return slice.length > 0 ? slice : featuredWorks.slice(0, worksPerView);
  };

  const getVisibleEvents = () => {
    if (!featuredEvents.length) return [];
    if (featuredEvents.length <= eventsPerView) return featuredEvents;
    const start = Math.min(currentEventIndex, eventsMaxIndex);
    const slice = featuredEvents.slice(start, start + eventsPerView);
    return slice.length > 0 ? slice : featuredEvents.slice(0, eventsPerView);
  };

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev <= 0 ? worksMaxIndex : prev - 1));
    setIsPaused(true);
    setTimeout(() => setIsPaused(false), 10000);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev >= worksMaxIndex ? 0 : prev + 1));
    setIsPaused(true);
    setTimeout(() => setIsPaused(false), 10000);
  };

  const handleEventPrevious = () => {
    setCurrentEventIndex((prev) => (prev <= 0 ? eventsMaxIndex : prev - 1));
    setIsEventPaused(true);
    setTimeout(() => setIsEventPaused(false), 10000);
  };

  const handleEventNext = () => {
    setCurrentEventIndex((prev) => (prev >= eventsMaxIndex ? 0 : prev + 1));
    setIsEventPaused(true);
    setTimeout(() => setIsEventPaused(false), 10000);
  };

  const handleWorkClick = (work, category) => {
    const workId = work.id || work.titre?.replace(/\s+/g, '-').toLowerCase();
    navigate(workDetailPath(category, workId), { state: { work } });
  };

  const formatEventDate = (event) => {
    if (event.date_debut && event.date_fin) {
      const start = new Date(event.date_debut).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
      });
      const end = new Date(event.date_fin).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
      return `${start} — ${end}`;
    }
    if (event.date_debut || event.date) {
      return new Date(event.date_debut || event.date).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    }
    return null;
  };

  const heroViewportStyle = measureNavForAtelier
    ? {
        height: `${heroViewportPx}px`,
        minHeight: `${heroViewportPx}px`,
        maxHeight: 'none',
      }
    : undefined;

  return {
    homeRef,
    heroImage,
    heroViewportStyle,
    atelierHeroCopy,
    atelierSectionCopy,
    featuredWorks,
    featuredEvents,
    loading,
    currentIndex,
    setCurrentIndex,
    currentEventIndex,
    setCurrentEventIndex,
    worksPerView,
    eventsPerView,
    worksMaxIndex,
    eventsMaxIndex,
    worksPageCount,
    eventsPageCount,
    setIsPaused,
    setIsEventPaused,
    getVisibleWorks,
    getVisibleEvents,
    handlePrevious,
    handleNext,
    handleEventPrevious,
    handleEventNext,
    handleWorkClick,
    formatEventDate,
  };
}
