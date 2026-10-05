export const parseDateOnly = (value) => {
  if (!value) return null;
  const s = String(value).slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  return s;
};

export const todayDateOnlyString = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

/** Inscriptions fermées après le dernier jour (date_fin). */
export const isEventPast = (work) => {
  const fin = parseDateOnly(work?.date_fin);
  if (!fin) return false;
  return fin < todayDateOnlyString();
};

export const isEventRegistrationClosed = (work) => {
  if (!work || work.type !== 'evenements') return true;
  if ((work.ticket_mode || 'closed') === 'closed') return true;
  return isEventPast(work);
};
