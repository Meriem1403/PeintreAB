import { useEffect } from 'react';

/** Renforce le scroll snap CSS entre hero et panneaux plein écran. */
export function useAtelierScrollSnap(containerRef) {
  useEffect(() => {
    const root = containerRef.current;
    if (!root) return undefined;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) return undefined;

    const getPanels = () => Array.from(root.querySelectorAll('.atelier-snap-panel'));

    const snapToNearest = () => {
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

      const threshold = Math.min(root.clientHeight * 0.2, 120);
      if (best > 4 && best < threshold) {
        nearest.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };

    let scrollTimer;
    const onScroll = () => {
      window.clearTimeout(scrollTimer);
      scrollTimer = window.setTimeout(snapToNearest, 85);
    };

    root.addEventListener('scroll', onScroll, { passive: true });
    root.addEventListener('scrollend', snapToNearest);

    return () => {
      window.clearTimeout(scrollTimer);
      root.removeEventListener('scroll', onScroll);
      root.removeEventListener('scrollend', snapToNearest);
    };
  }, [containerRef]);
}
