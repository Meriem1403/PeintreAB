export const ADMIN_PAGE_SIZES = {
  inbox: 15,
  guests: 12,
  contacts: 12,
};

/** @returns {{ pageItems: unknown[], totalPages: number, safePage: number, total: number, from: number, to: number }} */
export function paginate(items, page, pageSize) {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize) || 1);
  const safePage = Math.min(Math.max(1, page), totalPages);
  const from = (safePage - 1) * pageSize;
  const to = Math.min(from + pageSize, total);
  return {
    pageItems: items.slice(from, to),
    totalPages,
    safePage,
    total,
    from: total === 0 ? 0 : from + 1,
    to,
  };
}
