/** Texte hero accueil « Atelier » — valeurs par défaut (alignées backend). */
export const DEFAULT_ATELIER_HERO_COPY = {
  atelier_hero_eyebrow: 'Espace de création',
  atelier_hero_title_line1: 'Entrer',
  atelier_hero_title_line2_prefix: 'dans la ',
  atelier_hero_title_emphasis: 'couleur',
  atelier_hero_lead_prefix: 'Peintures et croquis choisis comme on ouvre un ',
  atelier_hero_lead_emphasis: 'carnet',
  atelier_hero_lead_suffix: ' — lentement, sans vitrine.',
};

const pickTrimmed = (value, fallback) => {
  const trimmed = typeof value === 'string' ? value.trim() : '';
  return trimmed || fallback;
};

/** Texte avant un mot mis en avant : un espace est garanti avant le fragment suivant. */
const pickPrefixBeforeEmphasis = (value, fallback) => {
  const source =
    typeof value === 'string' && value.trim() !== '' ? value : fallback;
  const inner = source.trim();
  if (!inner) return fallback.trim();
  return inner.endsWith(' ') ? inner : `${inner} `;
};

export function mergeAtelierHeroCopy(settings = {}) {
  return {
    eyebrow: pickTrimmed(settings.atelier_hero_eyebrow, DEFAULT_ATELIER_HERO_COPY.atelier_hero_eyebrow),
    titleLine1: pickTrimmed(
      settings.atelier_hero_title_line1,
      DEFAULT_ATELIER_HERO_COPY.atelier_hero_title_line1
    ),
    titleLine2Prefix: pickPrefixBeforeEmphasis(
      settings.atelier_hero_title_line2_prefix,
      DEFAULT_ATELIER_HERO_COPY.atelier_hero_title_line2_prefix
    ),
    titleEmphasis: pickTrimmed(
      settings.atelier_hero_title_emphasis,
      DEFAULT_ATELIER_HERO_COPY.atelier_hero_title_emphasis
    ),
    leadPrefix: pickPrefixBeforeEmphasis(
      settings.atelier_hero_lead_prefix,
      DEFAULT_ATELIER_HERO_COPY.atelier_hero_lead_prefix
    ),
    leadEmphasis: pickTrimmed(
      settings.atelier_hero_lead_emphasis,
      DEFAULT_ATELIER_HERO_COPY.atelier_hero_lead_emphasis
    ),
    leadSuffix: pickTrimmed(
      settings.atelier_hero_lead_suffix,
      DEFAULT_ATELIER_HERO_COPY.atelier_hero_lead_suffix
    ),
  };
}

/** En-têtes des sections Agenda / Sélection sur l'accueil Atelier. */
export const DEFAULT_ATELIER_SECTION_COPY = {
  atelier_events_index: 'Agenda',
  atelier_events_title: 'Rencontres & expositions',
  atelier_events_intro:
    'Vernissages, salons et parcours commentés — faites défiler les prochaines dates.',
  atelier_works_index: 'Sélection',
  atelier_works_title: 'Œuvres choisies',
  atelier_works_intro:
    'Un carrousel de toiles et croquis — chaque slide révèle une nouvelle présence au mur.',
};

export function mergeAtelierSectionCopy(settings = {}) {
  return {
    events: {
      index: settings.atelier_events_index?.trim() || DEFAULT_ATELIER_SECTION_COPY.atelier_events_index,
      title: settings.atelier_events_title?.trim() || DEFAULT_ATELIER_SECTION_COPY.atelier_events_title,
      intro: settings.atelier_events_intro?.trim() || DEFAULT_ATELIER_SECTION_COPY.atelier_events_intro,
    },
    works: {
      index: settings.atelier_works_index?.trim() || DEFAULT_ATELIER_SECTION_COPY.atelier_works_index,
      title: settings.atelier_works_title?.trim() || DEFAULT_ATELIER_SECTION_COPY.atelier_works_title,
      intro: settings.atelier_works_intro?.trim() || DEFAULT_ATELIER_SECTION_COPY.atelier_works_intro,
    },
  };
}
