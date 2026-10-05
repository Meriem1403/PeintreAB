/**
 * Galerie — variantes via .env :
 *   VITE_GALLERY_VARIANT=editorial (défaut) — en-tête Collection + pastilles, grille classique
 *   VITE_GALLERY_VARIANT=classic        — page galerie entièrement ancienne
 */
import GalerieClassic from './GalerieClassic';
import GalerieEditorial from './GalerieEditorial';

const variant = (import.meta.env.VITE_GALLERY_VARIANT || 'editorial').toLowerCase();

const Galerie = () => {
  if (variant === 'classic') {
    return <GalerieClassic />;
  }
  return <GalerieEditorial />;
};

export default Galerie;
