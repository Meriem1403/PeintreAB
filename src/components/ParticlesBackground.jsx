import { useEffect, useRef } from 'react';
import './ParticlesBackground.css';

let particlesScriptPromise = null;

const loadParticlesScript = () => {
  if (typeof window === 'undefined') return Promise.resolve(false);
  if (window.particlesJS) return Promise.resolve(true);
  if (particlesScriptPromise) return particlesScriptPromise;

  particlesScriptPromise = new Promise((resolve) => {
    const existing = document.querySelector('script[data-particles-js]');
    if (existing) {
      existing.addEventListener('load', () => resolve(Boolean(window.particlesJS)));
      existing.addEventListener('error', () => resolve(false));
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/particles.js/2.0.0/particles.min.js';
    script.async = true;
    script.dataset.particlesJs = '1';
    script.onload = () => resolve(Boolean(window.particlesJS));
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });

  return particlesScriptPromise;
};

const destroyParticles = (containerId) => {
  try {
    const domList = window.pJSDom;
    if (Array.isArray(domList)) {
      for (let i = domList.length - 1; i >= 0; i -= 1) {
        const entry = domList[i];
        const canvasEl = entry?.pJS?.canvas?.el;
        const parent = canvasEl?.parentElement;
        if (parent?.id !== containerId) continue;
        try {
          if (entry.pJS?.fn?.drawAnimFrame) {
            cancelAnimationFrame(entry.pJS.fn.drawAnimFrame);
          }
        } catch {
          /* ignore */
        }
        domList.splice(i, 1);
      }
    }
  } catch {
    /* ignore */
  }

  const container = document.getElementById(containerId);
  if (!container) return;
  /* Ne jamais retirer le conteneur React — seulement les canvas injectés */
  container.querySelectorAll('canvas').forEach((canvas) => canvas.remove());
};

const ParticlesBackground = ({
  containerId = 'particles-container',
  particleColor = '#ffffff',
  density = 'normal',
  interactive = true,
}) => {
  const finalContainerId = containerId || 'particles-container';
  const readyRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    let resizeTimer = 0;

    const initParticles = () => {
      if (cancelled || !window.particlesJS) return;
      const container = document.getElementById(finalContainerId);
      if (!container) return;

      destroyParticles(finalContainerId);

      const config =
        density === 'low'
          ? {
              number: { value: 50, density: { enable: true, value_area: 1500 } },
              line_linked: {
                enable: true,
                distance: 120,
                color: particleColor,
                opacity: 0.5,
                width: 1,
              },
            }
          : density === 'medium'
            ? {
                number: { value: 70, density: { enable: true, value_area: 1200 } },
                line_linked: {
                  enable: true,
                  distance: 130,
                  color: particleColor,
                  opacity: 0.6,
                  width: 1,
                },
              }
            : {
                number: { value: 100, density: { enable: true, value_area: 800 } },
                line_linked: {
                  enable: true,
                  distance: 150,
                  color: particleColor,
                  opacity: 0.7,
                  width: 1,
                },
              };

      window.particlesJS(finalContainerId, {
        particles: {
          number: config.number,
          color: { value: particleColor },
          shape: {
            type: 'circle',
            stroke: { width: 0, color: particleColor },
          },
          opacity: {
            value: 0.85,
            random: false,
            anim: { enable: false },
          },
          size: {
            value: 3,
            random: true,
            anim: { enable: false },
          },
          line_linked: config.line_linked,
          move: {
            enable: true,
            speed: 0.8,
            direction: 'none',
            random: false,
            straight: false,
            out_mode: 'out',
            bounce: false,
            attract: { enable: false, rotateX: 600, rotateY: 1200 },
          },
        },
        interactivity: {
          detect_on: 'canvas',
          events: {
            onhover: { enable: interactive, mode: 'repulse' },
            onclick: { enable: interactive, mode: 'push' },
            resize: false,
          },
          modes: {
            grab: {
              distance: 200,
              line_linked: { opacity: 0.8 },
            },
            repulse: {
              distance: 140,
              duration: 0.85,
            },
            push: { particles_nb: 4 },
          },
        },
        retina_detect: true,
      });

      readyRef.current = true;
    };

    loadParticlesScript().then((ok) => {
      if (!ok || cancelled) return;
      initParticles();
    });

    const handleResize = () => {
      if (!readyRef.current) return;
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        if (cancelled) return;
        try {
          const entry = window.pJSDom?.find(
            (item) => item?.pJS?.canvas?.el?.parentElement?.id === finalContainerId
          );
          entry?.pJS?.fn?.vendors?.resize?.();
        } catch {
          /* ignore */
        }
      }, 150);
    };

    window.addEventListener('resize', handleResize);
    window.visualViewport?.addEventListener('resize', handleResize);

    return () => {
      cancelled = true;
      readyRef.current = false;
      window.clearTimeout(resizeTimer);
      window.removeEventListener('resize', handleResize);
      window.visualViewport?.removeEventListener('resize', handleResize);
      destroyParticles(finalContainerId);
    };
  }, [finalContainerId, particleColor, density, interactive]);

  return (
    <div
      id={finalContainerId}
      className={interactive ? 'particles-layer particles-layer--interactive' : 'particles-layer'}
      aria-hidden="true"
    />
  );
};

export default ParticlesBackground;
