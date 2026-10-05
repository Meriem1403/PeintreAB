import { useEffect, useRef } from 'react';
import './GeometricBackground.css';

const parsePrimaryRgb = () => {
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue('--color-primary-rgb')
    .trim();
  if (!raw) return '198, 172, 143';
  return raw;
};

const GeometricBackground = ({ density = 'normal', theme = 'light' }) => {
  const canvasRef = useRef(null);
  const frameRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const pointCount = density === 'low' ? 22 : density === 'high' ? 48 : 34;
    const linkDistance = density === 'low' ? 140 : 165;
    const speed = reducedMotion ? 0 : 0.16;

    let points = [];
    let w = 0;
    let h = 0;
    let rgb = parsePrimaryRgb();

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = parent.clientWidth;
      h = parent.clientHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      if (points.length === 0) {
        points = Array.from({ length: pointCount }, () => ({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * speed,
          vy: (Math.random() - 0.5) * speed,
          r: 1.2 + Math.random() * 1.4,
        }));
      }
    };

    const draw = () => {
      rgb = parsePrimaryRgb();
      ctx.clearRect(0, 0, w, h);

      for (const p of points) {
        if (!reducedMotion) {
          p.x += p.vx;
          p.y += p.vy;
          if (p.x <= 0 || p.x >= w) p.vx *= -1;
          if (p.y <= 0 || p.y >= h) p.vy *= -1;
        }
      }

      for (let i = 0; i < points.length; i += 1) {
        for (let j = i + 1; j < points.length; j += 1) {
          const a = points[i];
          const b = points[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.hypot(dx, dy);
          if (dist > linkDistance) continue;
          const t = 1 - dist / linkDistance;
          ctx.beginPath();
          const lineA = theme === 'dark' ? 0.06 + t * 0.12 : 0.09 + t * 0.18;
          const lineColor =
            theme === 'dark' ? `rgba(255, 255, 255, ${lineA})` : `rgba(${rgb}, ${lineA})`;
          ctx.strokeStyle = lineColor;
          ctx.lineWidth = 0.65 + t * 0.35;
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }

      for (const p of points) {
        ctx.beginPath();
        if (theme === 'dark') {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
          ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
        } else {
          ctx.strokeStyle = `rgba(${rgb}, 0.22)`;
          ctx.fillStyle = `rgba(${rgb}, 0.06)`;
        }
        ctx.lineWidth = 0.75;
        ctx.arc(p.x, p.y, p.r + 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = theme === 'dark' ? 'rgba(255, 255, 255, 0.28)' : `rgba(${rgb}, 0.35)`;
        ctx.fill();
      }

      frameRef.current = requestAnimationFrame(draw);
    };

    resize();
    draw();

    const ro = new ResizeObserver(resize);
    if (canvas.parentElement) ro.observe(canvas.parentElement);

    return () => {
      ro.disconnect();
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [density, theme]);

  return (
    <canvas
      ref={canvasRef}
      className="geometric-background"
      aria-hidden="true"
    />
  );
};

export default GeometricBackground;
