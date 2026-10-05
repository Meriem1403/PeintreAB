import { Link } from 'react-router-dom';
import './NotFound.css';

const NotFound = () => (
  <main className="not-found">
    <p className="not-found__code">404</p>
    <h1>Page introuvable</h1>
    <p className="not-found__lead">Cette adresse n&apos;existe pas ou a été déplacée.</p>
    <div className="not-found__actions">
      <Link to="/" className="not-found__btn">
        Accueil
      </Link>
      <Link to="/galerie" className="not-found__btn not-found__btn--ghost">
        Galerie
      </Link>
    </div>
  </main>
);

export default NotFound;
