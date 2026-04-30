import React, { useEffect, useRef } from 'react';

// Configuration for the particle effect
export const PARTICLE_CONFIG = {
    enabled: true,         // Toggle the effect globally
    particleCount: 2,      // Particles spawned per mouse move frame
    colors: ['#3B82F6', '#8B5CF6', '#F59E0B', '#10B981'], // Blue, Purple, Orange, Emerald
    maxSize: 6,
    minSize: 2,
    speedModifier: 1.5,
    maxLife: 60,           // Frames of life before disappearing
};

export default function ParticleCursor() {
    const canvasRef = useRef(null);

    useEffect(() => {
        if (!PARTICLE_CONFIG.enabled) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d', { alpha: true });

        let width = window.innerWidth;
        let height = window.innerHeight;

        canvas.width = width;
        canvas.height = height;

        let particles = [];
        let mouse = { x: null, y: null };
        let animationFrameId;

        class Particle {
            constructor(x, y) {
                this.x = x;
                this.y = y;
                this.size = Math.random() * (PARTICLE_CONFIG.maxSize - PARTICLE_CONFIG.minSize) + PARTICLE_CONFIG.minSize;
                const angle = Math.random() * Math.PI * 2;
                const speed = Math.random() * PARTICLE_CONFIG.speedModifier;
                this.speedX = Math.cos(angle) * speed;
                this.speedY = Math.sin(angle) * speed;
                this.color = PARTICLE_CONFIG.colors[Math.floor(Math.random() * PARTICLE_CONFIG.colors.length)];
                this.life = PARTICLE_CONFIG.maxLife;
                this.maxLife = PARTICLE_CONFIG.maxLife;
            }

            update() {
                this.x += this.speedX;
                this.y += this.speedY;
                this.life--;

                // Shrink as it dies
                if (this.size > 0.1) this.size -= 0.1;
            }

            draw() {
                ctx.beginPath();
                ctx.arc(this.x, this.y, Math.max(0, this.size), 0, Math.PI * 2);
                ctx.fillStyle = this.color;

                // Fade out smoothly
                const alpha = Math.max(0, (this.life / this.maxLife) * 0.8);
                ctx.globalAlpha = alpha;

                // Add soft blur effect for premium look
                ctx.shadowBlur = 10;
                ctx.shadowColor = this.color;

                ctx.fill();

                // Reset to avoid affecting other draws performance
                ctx.globalAlpha = 1;
                ctx.shadowBlur = 0;
            }
        }

        const handleMouseMove = (e) => {
            mouse.x = e.clientX;
            mouse.y = e.clientY;

            // Only spawn particles if tab is active to save CPU
            if (!document.hidden) {
                for (let i = 0; i < PARTICLE_CONFIG.particleCount; i++) {
                    particles.push(new Particle(mouse.x, mouse.y));
                }
            }
        };

        const handleResize = () => {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width;
            canvas.height = height;
        };

        const animate = () => {
            if (!document.hidden) {
                // Clear the canvas efficiently
                ctx.clearRect(0, 0, width, height);

                // Update and draw all active particles
                for (let i = 0; i < particles.length; i++) {
                    particles[i].update();
                    particles[i].draw();

                    if (particles[i].life <= 0) {
                        particles.splice(i, 1);
                        i--; // Adjust index since we removed an element
                    }
                }
            }

            animationFrameId = requestAnimationFrame(animate);
        };

        window.addEventListener('mousemove', handleMouseMove, { passive: true });
        window.addEventListener('resize', handleResize, { passive: true });

        animate();

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    if (!PARTICLE_CONFIG.enabled) return null;

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                pointerEvents: 'none',   // Critical: Ensures clicks pass through to the UI
                zIndex: 0,               // Forces it behind main content
            }}
        />
    );
}
