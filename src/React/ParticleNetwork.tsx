import React, { useRef, useEffect } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface ParticleNetworkProps {
  particleColor?: string;
  lineColor?: string;
  particleCount?: number;
  maxDistance?: number;
  particleSize?: number;
  speed?: number;
}

const ParticleNetwork: React.FC<ParticleNetworkProps> = ({
  particleColor = "#A476FF",
  lineColor = "#5e4491",
  particleCount = 100,
  maxDistance = 120,
  particleSize = 2,
  speed = 1,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number | null>(null);

  // Inicializa partículas repartidas aleatoriamente
  const initParticles = (width: number, height: number) => {
    particlesRef.current = Array.from({ length: particleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * speed,
      vy: (Math.random() - 0.5) * speed,
    }));
  };

  const resizeCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = parent.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    return { width: rect.width, height: rect.height };
  };

  const animate = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);

    // Actualiza posición de cada partícula
    particlesRef.current.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;

      // Rebotar en los bordes
      if (p.x < 0 || p.x > width) p.vx = -p.vx;
      if (p.y < 0 || p.y > height) p.vy = -p.vy;
    });

    // Dibuja líneas entre partículas cercanas
    for (let i = 0; i < particlesRef.current.length; i++) {
      const p1 = particlesRef.current[i];
      for (let j = i + 1; j < particlesRef.current.length; j++) {
        const p2 = particlesRef.current[j];
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        const distance = Math.hypot(dx, dy);
        if (distance < maxDistance) {
          const opacity = 1 - distance / maxDistance;
          ctx.strokeStyle = hexToRGBA(lineColor, opacity);
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        }
      }
    }

    // Dibuja las partículas
    particlesRef.current.forEach((p) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, particleSize, 0, Math.PI * 2);
      ctx.fillStyle = particleColor;
      ctx.fill();
    });

    animationRef.current = requestAnimationFrame(animate);
  };

  // Función utilitaria para convertir hex a rgba con opacidad
  const hexToRGBA = (hex: string, alpha: number) => {
    let c: any;
    if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
      c = hex.substring(1).split("");
      if (c.length === 3) {
        c = [c[0], c[0], c[1], c[1], c[2], c[2]];
      }
      c = "0x" + c.join("");
      return "rgba(" + [(c >> 16) & 255, (c >> 8) & 255, c & 255].join(",") + `,${alpha})`;
    }
    throw new Error("Bad Hex");
  };

  useEffect(() => {
    const dims = resizeCanvas();
    if (dims) {
      initParticles(dims.width, dims.height);
    }
    animate();

    const handleResize = () => {
      if (canvasRef.current) {
        const dims = resizeCanvas();
        if (dims) {
          initParticles(dims.width, dims.height);
        }
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      window.removeEventListener("resize", handleResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [particleCount, maxDistance, particleSize, speed, particleColor, lineColor]);

  return (
    <div className="relative w-full h-full bg-[#101010] overflow-hidden">
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
};

export default ParticleNetwork;
