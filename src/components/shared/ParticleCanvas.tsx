"use client";

import { useEffect, useRef } from "react";

/**
 * Enhanced floating particle visualization — 100 glowing dots with mouse reactivity.
 * Pink-tinted particles with bloom/glow effect to match the cherry blossom tree theme.
 */
export function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef(0);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: (e.clientX - rect.left) / rect.width,
        y: (e.clientY - rect.top) / rect.height,
      };
    };
    canvas.addEventListener("mousemove", handleMouseMove);

    // More particles, varied sizes
    const COUNT = 100;
    const particles = Array.from({ length: COUNT }, (_, i) => {
      const seed = i * 1.618;
      return {
        bx: (seed * 127.1) % 1,
        by: (seed * 311.7) % 1,
        phase: seed * Math.PI * 2,
        speed: 0.3 + (seed % 0.5),
        radius: 1.0 + (seed % 3.0),
        // Some particles are pink, others white
        pink: i % 3 === 0,
      };
    });

    let time = 0;
    const render = () => {
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;

      ctx.clearRect(0, 0, w, h);

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      particles.forEach((p) => {
        const flowX = Math.sin(time * p.speed * 0.4 + p.phase) * 42;
        const flowY = Math.cos(time * p.speed * 0.3 + p.phase * 0.7) * 28;

        const bx = p.bx * w;
        const by = p.by * h;
        const dx = p.bx - mx;
        const dy = p.by - my;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const influence = Math.max(0, 1 - dist * 2.5);

        const x = bx + flowX + influence * Math.cos(time + p.phase) * 40;
        const y = by + flowY + influence * Math.sin(time + p.phase) * 40;

        const pulse = Math.sin(time * p.speed + p.phase) * 0.5 + 0.5;
        const alpha = 0.12 + pulse * 0.25 + influence * 0.4;
        const r = p.radius + pulse * 1.2;

        // Glow effect
        ctx.shadowBlur = p.pink ? 12 : 8;
        ctx.shadowColor = p.pink
          ? `rgba(194, 24, 91, ${alpha * 0.8})`
          : `rgba(255, 255, 255, ${alpha * 0.5})`;

        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = p.pink
          ? `rgba(220, 80, 140, ${alpha})`
          : `rgba(255, 255, 255, ${alpha})`;
        ctx.fill();
      });

      // Reset shadow for next frame
      ctx.shadowBlur = 0;

      time += 0.028; // was 0.016 — ~1.75× faster particle flow
      frameRef.current = requestAnimationFrame(render);
    };
    render();

    return () => {
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(frameRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-auto"
      style={{ width: "100%", height: "100%" }}
    />
  );
}
