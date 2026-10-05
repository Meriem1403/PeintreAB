import { useEffect, useState } from 'react';
import { normalizeImageUrl } from '../../utils/imageUrl';

/** Seuil de luminance moyenne (0–255) au-delà duquel le hero est considéré « clair ». */
const LIGHT_THRESHOLD = 158;

const sampleImageLuminance = (src) =>
  new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const size = 56;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.drawImage(img, 0, 0, size, size);
        const { data } = ctx.getImageData(0, 0, size, size);
        let sum = 0;
        const pixels = data.length / 4;
        for (let i = 0; i < data.length; i += 4) {
          sum += 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
        }
        resolve(sum / pixels);
      } catch {
        resolve(null);
      }
    };

    img.onerror = () => resolve(null);
    img.src = src;
  });

/**
 * Détecte si l'image de fond du hero est plutôt claire (texte illisible sans scrim).
 */
export function useHeroImageLuminance(heroImage) {
  const [isLightHero, setIsLightHero] = useState(false);

  useEffect(() => {
    const src = normalizeImageUrl(heroImage);
    if (!src) {
      setIsLightHero(false);
      return undefined;
    }

    let cancelled = false;

    (async () => {
      const avg = await sampleImageLuminance(src);
      if (cancelled) return;
      if (avg === null) {
        setIsLightHero(true);
        return;
      }
      setIsLightHero(avg >= LIGHT_THRESHOLD);
    })();

    return () => {
      cancelled = true;
    };
  }, [heroImage]);

  return isLightHero;
}
