import { useEffect, useRef } from 'react';

export default function DataEcosystemParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];
    
    // Mouse properties
    const mouse = { x: -1000, y: -1000, radius: 200 };

    const handleResize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
      } else {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
      initParticles();
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };
    
    const handleMouseLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
    };

    class Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      color: string;
      baseX: number;
      baseY: number;

      constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
        this.baseX = x;
        this.baseY = y;
        this.size = Math.random() * 2 + 0.5;
        this.vx = (Math.random() - 0.5) * 1.2;
        this.vy = (Math.random() - 0.5) * 1.2;
        this.color = Math.random() > 0.5 ? '#00F0FF' : '#00BFFF';
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;

        // Gentle wandering force
        this.vx += (Math.random() - 0.5) * 0.04;
        this.vy += (Math.random() - 0.5) * 0.04;

        // Speed limit
        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        const maxSpeed = 1.5;
        if (speed > maxSpeed) {
          this.vx = (this.vx / speed) * maxSpeed;
          this.vy = (this.vy / speed) * maxSpeed;
        }

        // Bounce off walls gently
        if (this.x < 0) this.vx = Math.abs(this.vx);
        if (this.x > canvas.width) this.vx = -Math.abs(this.vx);
        if (this.y < 0) this.vy = Math.abs(this.vy);
        if (this.y > canvas.height) this.vy = -Math.abs(this.vy);

        // Mouse interaction
        let dx = mouse.x - this.x;
        let dy = mouse.y - this.y;
        let distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < mouse.radius) {
          // Attract/Repel logic. Let's make it create a swirling pattern
          const force = (mouse.radius - distance) / mouse.radius;
          const rotateForce = 0.05 * force;
          
          // Tangent vector for swirling
          const tx = -dy / distance;
          const ty = dx / distance;
          
          this.vx += tx * rotateForce * 5;
          this.vy += ty * rotateForce * 5;
          
          // Also slowly pull towards mouse
          this.vx += (dx / distance) * force * 0.2;
          this.vy += (dy / distance) * force * 0.2;
        }
      }

      draw() {
        if (!ctx) return;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        
        let dx = mouse.x - this.x;
        let dy = mouse.y - this.y;
        let distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < mouse.radius) {
           ctx.shadowBlur = 15;
           ctx.shadowColor = this.color;
           ctx.globalAlpha = 1;
        } else {
           ctx.shadowBlur = 0;
           ctx.globalAlpha = 0.4;
        }
        
        ctx.fill();
        ctx.globalAlpha = 1; // Reset alpha
        ctx.shadowBlur = 0;
      }
    }

    const initParticles = () => {
      particles = [];
      const density = window.innerWidth < 768 ? 8000 : 12000;
      const numParticles = Math.min(Math.floor((canvas.width * canvas.height) / density), 150);
      for (let i = 0; i < numParticles; i++) {
        particles.push(new Particle(Math.random() * canvas.width, Math.random() * canvas.height));
      }
    };

    const connectParticles = () => {
      const maxDistance = 140;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          let dx = particles[i].x - particles[j].x;
          let dy = particles[i].y - particles[j].y;
          let distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < maxDistance) {
            // Also check distance to mouse for brighter lines
            let mdx = mouse.x - particles[i].x;
            let mdy = mouse.y - particles[i].y;
            let mDistance = Math.sqrt(mdx * mdx + mdy * mdy);
            
            let opacity = 1 - (distance / maxDistance);
            let baseAlpha = mDistance < mouse.radius ? opacity * 0.4 : opacity * 0.15;
            
            ctx.beginPath();
            ctx.strokeStyle = `rgba(0, 240, 255, ${baseAlpha})`;
            ctx.lineWidth = 1;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particles.forEach(p => {
        p.update();
        p.draw();
      });
      
      connectParticles();
      
      animationFrameId = requestAnimationFrame(animate);
    };

    // Event Listeners
    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseout', handleMouseLeave); // Detect when mouse leaves the window

    // Initial Setup
    handleResize();
    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseout', handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute inset-0 w-full h-full pointer-events-none z-0 mix-blend-screen opacity-70"
    />
  );
}
