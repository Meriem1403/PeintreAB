/**
 * Accueil — bascule entre deux variantes via .env :
 *   VITE_HOME_VARIANT=atelier   (défaut) — refonte éditoriale « Atelier »
 *   VITE_HOME_VARIANT=classic   — ancienne page (snap, carrousels, particules)
 */
import HomeAtelier from './HomeAtelier';
import HomeClassic from './HomeClassic';

const variant = (import.meta.env.VITE_HOME_VARIANT || 'atelier').toLowerCase();

const Home = () => {
  if (variant === 'classic') {
    return <HomeClassic />;
  }
  return <HomeAtelier />;
};

export default Home;
