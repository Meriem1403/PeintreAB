import { useEffect, useRef } from 'react';

const ParticlesBackground = ({ containerId = 'particles-container', particleColor = '#ffffff' }) => {
  const finalContainerId = containerId || 'particles-container';
  const particlesInstanceRef = useRef(null);

  useEffect(() => {
    const loadParticles = async () => {
      try {
        // Charger particles.js depuis CDN
        if (!window.particlesJS) {
          const script = document.createElement('script');
          script.src = 'https://cdn.jsdelivr.net/particles.js/2.0.0/particles.min.js';
          
          script.onload = () => {
            if (window.particlesJS) {
              initParticles();
            }
          };
          
          script.onerror = () => {
            console.warn('⚠️ Impossible de charger particles.js');
          };
          
          document.head.appendChild(script);
        } else {
          // particles.js déjà chargé
          initParticles();
        }
      } catch (error) {
        console.error('❌ Erreur particles.js:', error);
      }
    };

    const initParticles = () => {
      try {
        // Détruire l'instance précédente si elle existe
        if (particlesInstanceRef.current) {
          try {
            // particles.js ne fournit pas de méthode destroy, on doit nettoyer manuellement
            const canvas = document.getElementById(finalContainerId);
            if (canvas && canvas.parentNode) {
              const ctx = canvas.getContext('2d');
              if (ctx) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
              }
            }
          } catch (e) {
            console.warn('⚠️ Erreur nettoyage particles:', e);
          }
        }

        if (window.particlesJS) {
          particlesInstanceRef.current = window.particlesJS(finalContainerId, {
            particles: {
              number: {
                value: 100,
                density: { enable: true, value_area: 800 }
              },
              color: { value: particleColor },
              shape: {
                type: 'circle',
                stroke: { width: 0, color: particleColor }
              },
              opacity: {
                value: 0.9,
                random: false,
                anim: { enable: false }
              },
              size: {
                value: 3,
                random: true,
                anim: { enable: false }
              },
              line_linked: {
                enable: true,
                distance: 150,
                color: particleColor,
                opacity: 0.7,
                width: 1
              },
              move: {
                enable: true,
                speed: 1,
                direction: 'none',
                random: false,
                straight: false,
                out_mode: 'out',
                bounce: false,
                attract: { enable: false, rotateX: 600, rotateY: 1200 }
              }
            },
            interactivity: {
              detect_on: 'canvas',
              events: {
                onhover: { enable: true, mode: 'repulse' },
                onclick: { enable: true, mode: 'push' },
                resize: true
              },
              modes: {
                repulse: { distance: 100, duration: 0.4 },
                push: { particles_nb: 4 }
              }
            },
            retina_detect: true
          });
        }
      } catch (error) {
        console.error('❌ Erreur initialisation particles:', error);
      }
    };

    loadParticles();

    // Cleanup function pour nettoyer les particules
    return () => {
      try {
        // Nettoyer le canvas des particules
        const canvas = document.getElementById(finalContainerId);
        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
          }
          // Supprimer le canvas du DOM
          if (canvas.parentNode) {
            canvas.parentNode.removeChild(canvas);
          }
        }
        particlesInstanceRef.current = null;
      } catch (error) {
        console.warn('⚠️ Erreur cleanup particles:', error);
      }
    };
  }, [finalContainerId, particleColor]); // Dépendances sur containerId et particleColor

  return (
    <div
      id={finalContainerId}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
        backgroundColor: 'transparent'
      }}
    />
  );
};

export default ParticlesBackground;
