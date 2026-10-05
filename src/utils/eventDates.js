/** Dates calendrier YYYY-MM-DD (sans fuseau). */

export const parseDateOnly = (value) => {
  if (!value) return null;
  const s = String(value).slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const [y, m, d] = s.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) return null;
  return dt;
};

export const toDateOnlyString = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const todayDateOnlyString = () => toDateOnlyString(new Date());

export const listDaysInclusive = (dateDebut, dateFin) => {
  const start = parseDateOnly(dateDebut);
  const end = parseDateOnly(dateFin);
  if (!start || !end || end < start) return [];
  const days = [];
  const cur = new Date(start);
  while (cur <= end) {
    days.push(toDateOnlyString(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return days;
};

export const eventDurationDays = (dateDebut, dateFin) => listDaysInclusive(dateDebut, dateFin).length;

export const isEventPast = (dateFin, today = todayDateOnlyString()) => {
  const end = parseDateOnly(dateFin);
  if (!end) return false;
  return toDateOnlyString(end) < today;
};

export const formatDurationLabel = (dateDebut, dateFin) => {
  const days = eventDurationDays(dateDebut, dateFin);
  if (days === 0) return null;
  const start = parseDateOnly(dateDebut);
  const end = parseDateOnly(dateFin);
  const opts = { day: 'numeric', month: 'long', year: 'numeric' };
  const range = `${start.toLocaleDateString('fr-FR', opts)} — ${end.toLocaleDateString('fr-FR', opts)}`;
  const dayWord = days === 1 ? '1 jour' : `${days} jours`;
  return { dayWord, range, days };
};

const MONTHS_SHORT = [
  'janv.',
  'févr.',
  'mars',
  'avr.',
  'mai',
  'juin',
  'juil.',
  'août',
  'sept.',
  'oct.',
  'nov.',
  'déc.',
];

/** Affichage billet / fiche : "23 nov. 2026" (calendrier local, sans décalage UTC). */
export const formatDateTicketShort = (value) => {
  const d = parseDateOnly(value);
  if (!d) return null;
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`;
};

/** "samedi 23 novembre" */
export const formatDateTicketWeekday = (value) => {
  const d = parseDateOnly(value);
  if (!d) return null;
  const weekday = d.toLocaleDateString('fr-FR', { weekday: 'long' });
  const rest = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
  return `${weekday} ${rest}`;
};

/** Plage compacte : "23–29 nov. 2026", "28 nov. – 3 déc. 2026", etc. */
export const formatDateRangeCompact = (dateDebut, dateFin) => {
  const start = parseDateOnly(dateDebut);
  const end = parseDateOnly(dateFin);
  if (!start && !end) return null;
  if (start && !end) return formatDateTicketShort(dateDebut);
  if (!start && end) return formatDateTicketShort(dateFin);
  if (toDateOnlyString(start) === toDateOnlyString(end)) {
    return formatDateTicketShort(dateDebut);
  }

  const sy = start.getFullYear();
  const sm = start.getMonth();
  const sd = start.getDate();
  const ey = end.getFullYear();
  const em = end.getMonth();
  const ed = end.getDate();

  if (sy === ey && sm === em) {
    return `${sd}–${ed} ${MONTHS_SHORT[sm]} ${sy}`;
  }
  if (sy === ey) {
    return `${sd} ${MONTHS_SHORT[sm]} – ${ed} ${MONTHS_SHORT[em]} ${sy}`;
  }
  return `${formatDateTicketShort(dateDebut)} – ${formatDateTicketShort(dateFin)}`;
};

/** Bloc exposition pour billet : période + durée. */
export const formatExhibitionOnTicket = (dateDebut, dateFin) => {
  const days = eventDurationDays(dateDebut, dateFin);
  if (days === 0) return null;
  const range = formatDateRangeCompact(dateDebut, dateFin);
  const duration =
    days === 1 ? "1 jour d'exposition" : `${days} jours d'exposition`;
  return { range, duration, days };
};

/** Créneau billet : jour lisible + libellé sans répéter la date. */
export const formatSlotOnTicket = (slot) => {
  if (!slot?.label && !slot?.slot_date) return null;
  const dayLine = slot.slot_date ? formatDateTicketWeekday(slot.slot_date) : null;
  let title = slot.label?.trim() || '';
  if (title && dayLine) {
    const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
    title = cap(title);
  }
  return {
    dayLine: dayLine ? dayLine.charAt(0).toUpperCase() + dayLine.slice(1) : null,
    title,
  };
};

export const emptySlot = () => ({
  label: '',
  slot_date: '',
  capacity_mode: 'limited',
  capacity: '',
});

export const buildSlotsFromEventDates = (dateDebut, dateFin, previousSlots = []) => {
  const days = listDaysInclusive(dateDebut, dateFin);
  if (days.length === 0) return [emptySlot()];

  return days.map((dayIso, i) => {
    const prev = previousSlots[i];
    const dayNum = i + 1;
    let label = prev?.label?.trim() || '';
    const looksAuto = !label || /^Jour \d+( — vernissage)?$/i.test(label);
    if (looksAuto) {
      label = dayNum === 1 ? 'Jour 1 — vernissage' : `Jour ${dayNum}`;
    }
    return {
      label,
      slot_date: dayIso,
      capacity_mode: prev?.capacity_mode === 'unlimited' ? 'unlimited' : 'limited',
      capacity: prev?.capacity_mode === 'unlimited' ? '' : (prev?.capacity ?? ''),
    };
  });
};
