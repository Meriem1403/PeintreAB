import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackSiteVisit } from '../utils/siteVisitTracker';

/** Compte les visites publiques (une fois par navigation). */
const SiteVisitTracker = () => {
  const location = useLocation();

  useEffect(() => {
    trackSiteVisit(location.pathname);
  }, [location.pathname]);

  return null;
};

export default SiteVisitTracker;
