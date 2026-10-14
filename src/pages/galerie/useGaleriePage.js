import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { galleryPath, workDetailPath } from '../../constants/galleryRoutes';
import { useWorks } from '../../contexts/WorksContext';
import { useGalleryCategories } from '../../contexts/GalleryCategoriesContext';

export const ITEMS_PER_PAGE = 12;

export function useGaleriePage() {
  const { category: categoryParam } = useParams();
  const { categories, defaultSlug, isValidSlug, getLabel, getLead } = useGalleryCategories();
  const slugs = useMemo(() => categories.map((c) => c.slug), [categories]);

  const activeCategory = isValidSlug(categoryParam) ? categoryParam : defaultSlug;
  const [currentPage, setCurrentPage] = useState(1);
  const { works, loading } = useWorks();
  const navigate = useNavigate();
  const location = useLocation();

  const activeCategoryMeta = useMemo(
    () => categories.find((c) => c.slug === activeCategory) || null,
    [categories, activeCategory]
  );

  const paginationEnabled =
    activeCategoryMeta?.pagination_enabled === undefined ||
    activeCategoryMeta?.pagination_enabled === null
      ? true
      : Boolean(activeCategoryMeta.pagination_enabled);

  const itemsPerPage = (() => {
    const n = parseInt(activeCategoryMeta?.items_per_page, 10);
    if (!Number.isFinite(n) || n < 1) return ITEMS_PER_PAGE;
    return Math.min(100, n);
  })();

  useEffect(() => {
    setCurrentPage(1);
  }, [activeCategory, location.pathname, paginationEnabled, itemsPerPage]);

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
        navigate(workDetailPath(activeCategory, workId, slugs), { state: { work } });
      }
    } catch (error) {
      console.error('Erreur navigation galerie:', error);
    }
  };

  const handleCategoryChange = (categoryId) => {
    if (categoryId && isValidSlug(categoryId)) {
      navigate(galleryPath(categoryId, slugs));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const totalPages = paginationEnabled
    ? Math.max(1, Math.ceil(items.length / itemsPerPage) || 1)
    : 1;
  const startIndex = paginationEnabled ? (currentPage - 1) * itemsPerPage : 0;
  const paginatedItems = paginationEnabled
    ? items.slice(startIndex, startIndex + itemsPerPage)
    : items;

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

  const invalidCategory = Boolean(categoryParam) && !isValidSlug(categoryParam);

  return {
    activeCategory,
    activeCategoryLabel: getLabel(activeCategory),
    activeCategoryLead: getLead(activeCategory),
    galleryCategories: categories.map((c) => ({ id: c.slug, label: c.label })),
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
