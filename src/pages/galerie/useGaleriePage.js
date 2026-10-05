import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import {
  DEFAULT_GALLERY_CATEGORY,
  galleryPath,
  isValidGalleryCategory,
  workDetailPath,
} from '../../constants/galleryRoutes';
import { useWorks } from '../../contexts/WorksContext';

export const ITEMS_PER_PAGE = 12;

export const GALLERY_CATEGORIES = [
  { id: 'peintures', label: 'Peintures' },
  { id: 'croquis', label: 'Croquis' },
  { id: 'evenements', label: 'Événements' },
];

const CATEGORY_LEADS = {
  peintures: 'Toiles et acryliques — parcourez les œuvres présentées en galerie.',
  croquis: 'Carnets et études — le geste et la recherche avant la toile.',
  evenements: 'Expositions et rencontres — l’atelier en mouvement.',
};

export function categoryLead(categoryId) {
  return CATEGORY_LEADS[categoryId] || 'Explorez la collection.';
}

export function useGaleriePage() {
  const { category: categoryParam } = useParams();
  const activeCategory = isValidGalleryCategory(categoryParam)
    ? categoryParam
    : DEFAULT_GALLERY_CATEGORY;
  const [currentPage, setCurrentPage] = useState(1);
  const { works, loading } = useWorks();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setCurrentPage(1);
  }, [activeCategory, location.pathname]);

  const items = useMemo(() => {
    if (!works || typeof works !== 'object') return [];
    const categoryItems = works[activeCategory] || [];
    if (!Array.isArray(categoryItems)) return [];
    return [...categoryItems].sort((a, b) => {
      const orderA =
        a.display_order !== undefined && a.display_order !== null ? a.display_order : 999999;
      const orderB =
        b.display_order !== undefined && b.display_order !== null ? b.display_order : 999999;
      if (orderA !== orderB) return orderA - orderB;
      const dateA = a.created_at ? new Date(a.created_at) : new Date(0);
      const dateB = b.created_at ? new Date(b.created_at) : new Date(0);
      return dateB - dateA;
    });
  }, [works, activeCategory]);

  const handleWorkClick = (work) => {
    if (!work) return;
    try {
      const workId = work.id || work.titre?.replace(/\s+/g, '-').toLowerCase();
      if (workId) {
        navigate(workDetailPath(activeCategory, workId), { state: { work } });
      }
    } catch (error) {
      console.error('Erreur navigation galerie:', error);
    }
  };

  const handleCategoryChange = (categoryId) => {
    if (categoryId && GALLERY_CATEGORIES.find((cat) => cat.id === categoryId)) {
      navigate(galleryPath(categoryId));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const totalPages = Math.ceil(items.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedItems = items.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else if (currentPage <= 3) {
      for (let i = 1; i <= 4; i++) pages.push(i);
      pages.push('ellipsis');
      pages.push(totalPages);
    } else if (currentPage >= totalPages - 2) {
      pages.push(1);
      pages.push('ellipsis');
      for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      pages.push('ellipsis');
      for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
      pages.push('ellipsis');
      pages.push(totalPages);
    }

    return pages;
  };

  const invalidCategory =
    Boolean(categoryParam) && !isValidGalleryCategory(categoryParam);

  const activeCategoryLabel =
    GALLERY_CATEGORIES.find((c) => c.id === activeCategory)?.label ?? 'Galerie';

  return {
    activeCategory,
    activeCategoryLabel,
    currentPage,
    loading,
    items,
    paginatedItems,
    startIndex,
    totalPages,
    handleWorkClick,
    handleCategoryChange,
    handlePageChange,
    getPageNumbers,
    invalidCategory,
  };
}
