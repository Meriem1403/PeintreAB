import './AdminPagination.css';

/**
 * @param {object} props
 * @param {number} props.page
 * @param {number} props.totalPages
 * @param {number} props.total
 * @param {number} [props.from] — 1-based start index shown
 * @param {number} [props.to] — 1-based end index shown
 * @param {(page: number) => void} props.onPageChange
 * @param {string} [props.itemLabel] — e.g. "inscrits"
 * @param {string} [props.ariaLabel]
 */
const AdminPagination = ({
  page,
  totalPages,
  total,
  from,
  to,
  onPageChange,
  itemLabel = 'éléments',
  ariaLabel = 'Pagination',
}) => {
  if (totalPages <= 1 || total === 0) return null;

  const showRange = from != null && to != null && total > 0;

  return (
    <nav className="admin-pagination" aria-label={ariaLabel}>
      <button
        type="button"
        className="admin-pagination__btn"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        Précédent
      </button>
      <div className="admin-pagination__info">
        <span className="admin-pagination__page">
          Page {page} sur {totalPages}
        </span>
        {showRange && (
          <span className="admin-pagination__range">
            {from}–{to} sur {total} {itemLabel}
          </span>
        )}
      </div>
      <button
        type="button"
        className="admin-pagination__btn"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        Suivant
      </button>
    </nav>
  );
};

export default AdminPagination;
