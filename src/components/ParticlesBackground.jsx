import { useEffect, useRef } from 'react';

const ParticlesBackground = ({ containerId = 'particles-container', particleColor = '#ffffff', density = 'normal' }) => {
  const finalContainerId = containerId || 'particles-container';
  const particlesInstanceRef = useRef(null);

  useEffect(() => {
    const loadParticles = async () => {
      try {
        if (!window.particlesJS) {
          const script = document.createElement('script');
          script.src = 'https://cdn.jsdelivr.net/particles.js/2.0.0/particles.min.js';

          script.onload = () => {
            if (window.particlesJS) {
              setTimeout(() => {
                initParticles();
              }, 100);
            }
          };

          script.onerror = () => {
            console.warn('⚠️ Impossible de charger particles.js');
          };

          document.head.appendChild(script);
        } else {
          setTimeout(() => {
            initParticles();
          }, 100);
        }
      } catch (error) {
        console.error('❌ Erreur particles.js:', error);
      }
    };

    const initParticles = () => {
      try {
        if (particlesInstanceRef.current) {
          try {
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
          const config = density === 'low' ? {
            number: { value: 50, density: { enable: true, value_area: 1500 } },
            line_linked: { enable: true, distance: 120, color: particleColor, opacity: 0.5, width: 1 },
          } : density === 'medium' ? {
            number: { value: 70, density: { enable: true, value_area: 1200 } },
            line_linked: { enable: true, distance: 130, color: particleColor, opacity: 0.6, width: 1 },
          } : {
            number: { value: 100, density: { enable: true, value_area: 800 } },
            line_linked: { enable: true, distance: 150, color: particleColor, opacity: 0.7, width: 1 },
          };

          particlesInstanceRef.current = window.particlesJS(finalContainerId, {
            particles: {
              number: config.number,
              color: { value: particleColor },
              shape: {
                type: 'circle',
                stroke: { width: 0, color: particleColor },
              },
              opacity: {
                value: 0.9,
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
                onhover: { enable: true, mode: 'repulse' },
                onclick: { enable: true, mode: 'push' },
                resize: true,
              },
              modes: {
                grab: {
                  distance: 200,
                  line_linked: { opacity: 0.8 },
                },
                repulse: {
                  distance: 200,
                  duration: 1.2,
                },
                push: { particles_nb: 4 },
              },
            },
            retina_detect: true,
          });

          if (particlesInstanceRef.current?.pJSDom?.[0]) {
            const pJS = particlesInstanceRef.current.pJSDom[0].pJS;
            if (pJS?.fn?.vendors?.resize) {
              setTimeout(() => {
                pJS.fn.vendors.resize();
              }, 200);
            }
          }
        }
      } catch (error) {
        console.error('❌ Erreur initialisation particles:', error);
      }
    };

    loadParticles();

    const handleResize = () => {
      if (particlesInstanceRef.current?.pJSDom?.[0]) {
        const pJS = particlesInstanceRef.current.pJSDom[0].pJS;
        if (pJS?.fn?.vendors?.resize) {
          pJS.fn.vendors.resize();
        }
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      try {
        const canvas = document.getElementById(finalContainerId);
        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
          }
          if (canvas.parentNode) {
            canvas.parentNode.removeChild(canvas);
          }
        }
        particlesInstanceRef.current = null;
      } catch (error) {
        console.warn('⚠️ Erreur cleanup particles:', error);
      }
    };
  }, [finalContainerId, particleColor, density]);

  return (
    <div
      id={finalContainerId}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 1,
        pointerEvents: 'none',
        backgroundColor: 'transparent',
        overflow: 'hidden',
      }}
    />
  );
};

export default ParticlesBackground;
