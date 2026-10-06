import { useEffect } from 'react';

const MOBILE_SCROLL_QUERY = '(max-width: 900px), (pointer: coarse)';

/** Renforce le scroll snap CSS entre hero et panneaux plein écran (desktop uniquement). */
export function useAtelierScrollSnap(containerRef) {
  useEffect(() => {
    const root = containerRef.current;
    if (!root) return undefined;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const mobileScroll = window.matchMedia(MOBILE_SCROLL_QUERY);
    if (reducedMotion || mobileScroll.matches) return undefined;

    const getPanels = () => Array.from(root.querySelectorAll('.atelier-snap-panel'));

    let snapLock = false;
    let snapUnlockTimer;

    const releaseSnapLock = () => {
      window.clearTimeout(snapUnlockTimer);
      snapUnlockTimer = window.setTimeout(() => {
        snapLock = false;
      }, 480);
    };

    const snapToNearest = () => {
      if (snapLock) return;

      const panels = getPanels();
      if (panels.length === 0) return;

      const footer = root.querySelector('.atelier-footer');
      const scrollTop = root.scrollTop;
      const maxScroll = root.scrollHeight - root.clientHeight;

      if (scrollTop >= maxScroll - 24) return;

      const lastPanel = panels[panels.length - 1];
      const lastPanelHeight = lastPanel.offsetHeight || lastPanel.clientHeight;
      const progressInLastPanel =
        (scrollTop - lastPanel.offsetTop) / Math.max(lastPanelHeight, 1);

      if (footer) {
        const footerTop = footer.offsetTop;
        if (scrollTop + root.clientHeight * 0.35 >= footerTop) return;
        if (scrollTop >= footerTop - root.clientHeight * 0.55) return;
      }

      if (progressInLastPanel > 0.42) return;

      let nearest = panels[0];
      let best = Math.abs(nearest.offsetTop - scrollTop);

      panels.forEach((panel) => {
        const dist = Math.abs(panel.offsetTop - scrollTop);
        if (dist < best) {
          best = dist;
          nearest = panel;
        }
      });

      if (scrollTop > lastPanel.offsetTop + lastPanelHeight - root.clientHeight * 0.4) return;

      const threshold = Math.min(root.clientHeight * 0.22, 140);
      if (best <= 4 || best >= threshold) return;

      snapLock = true;
      root.scrollTo({ top: nearest.offsetTop, behavior: 'smooth' });
      releaseSnapLock();
    };

    let scrollTimer;
    const onScroll = () => {
      if (snapLock) return;
      window.clearTimeout(scrollTimer);
      scrollTimer = window.setTimeout(snapToNearest, 140);
    };

    root.addEventListener('scroll', onScroll, { passive: true });
    if ('onscrollend' in window) {
      root.addEventListener('scrollend', snapToNearest);
    }

    return () => {
      window.clearTimeout(scrollTimer);
      window.clearTimeout(snapUnlockTimer);
      root.removeEventListener('scroll', onScroll);
      root.removeEventListener('scrollend', snapToNearest);
    };
  }, [containerRef]);
}

export function atelierScrollBehavior() {
  if (typeof window === 'undefined') return 'smooth';
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return 'auto';
  if (window.matchMedia(MOBILE_SCROLL_QUERY).matches) return 'auto';
  return 'smooth';
}
