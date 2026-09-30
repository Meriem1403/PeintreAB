export const normalizeImageUrl = (url) => {
  if (!url || typeof url !== 'string') return url;

  const trimmed = url.trim();
  if (!trimmed) return trimmed;

  if (
    trimmed.startsWith('data:') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('//')
  ) {
    return trimmed;
  }

  if (trimmed.startsWith('public/')) {
    return `/${trimmed.slice('public/'.length)}`;
  }

  if (trimmed.startsWith('/')) {
    return trimmed;
  }

  return `/${trimmed}`;
};

export const normalizeWork = (work) => {
  if (!work) return work;
  return {
    ...work,
    image: normalizeImageUrl(work.image),
  };
};
