/** Scroll d’accueil : comportement natif uniquement (plus de snap JS). */
export function useAtelierScrollSnap() {
  // no-op — le snap JS bloquait le défilement (surtout mobile / trackpad).
}

export function atelierScrollBehavior() {
  if (typeof window === 'undefined') return 'auto';
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return 'auto';
  return 'auto';
}
