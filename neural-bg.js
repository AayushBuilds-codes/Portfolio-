/**
 * Interactive Neural Network Canvas Background
 * Animates floating nodes that form connections with each other and the mouse pointer.
 * Pauses rendering when out of viewport for optimized performance.
 */

document.addEventListener('DOMContentLoaded', () => {
    initNeuralBackground();
});

function initNeuralBackground() {
    const canvas = document.getElementById('neural-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationId = null;
    let particles = [];
    let mouse = { x: null, y: null, active: false };
    let theme = document.documentElement.getAttribute('data-theme') || 'dark';

    // Particle Config
    const maxParticles = 75;
    const connectionDist = 105;
    const mouseConnectionDist = 150;
    
    // Theme Colors Mapping
    function getColor(opacity) {
        // Return colors matching var(--primary-light) / var(--primary) depending on theme
        return theme === 'dark' ? `rgba(45, 212, 191, ${opacity})` : `rgba(15, 118, 110, ${opacity})`;
    }

    // Handle Resize
    function resizeCanvas() {
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = canvas.parentElement.clientHeight;
        createParticles();
    }



    // Particle Class
    class Particle {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.size = Math.random() * 2 + 1;
            this.speedX = Math.random() * 0.4 - 0.2;
            this.speedY = Math.random() * 0.4 - 0.2;
        }

        update() {
            this.x += this.speedX;
            this.y += this.speedY;

            // Bounce off boundaries
            if (this.x < 0 || this.x > canvas.width) this.speedX *= -1;
            if (this.y < 0 || this.y > canvas.height) this.speedY *= -1;
        }

        draw() {
            ctx.fillStyle = getColor(0.5);
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function createParticles() {
        particles = [];
        const count = Math.min(maxParticles, Math.floor((canvas.width * canvas.height) / 11000));
        for (let i = 0; i < count; i++) {
            particles.push(new Particle());
        }
    }

    // Animation Loop
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw connections
        for (let i = 0; i < particles.length; i++) {
            particles[i].update();
            particles[i].draw();

            // Connect with other particles
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const dist = Math.hypot(dx, dy);

                if (dist < connectionDist) {
                    const opacity = (1 - dist / connectionDist) * 0.15;
                    ctx.strokeStyle = getColor(opacity);
                    ctx.lineWidth = 0.8;
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.stroke();
                }
            }

            // Connect with mouse
            if (mouse.active && mouse.x !== null && mouse.y !== null) {
                const dx = particles[i].x - mouse.x;
                const dy = particles[i].y - mouse.y;
                const dist = Math.hypot(dx, dy);

                if (dist < mouseConnectionDist) {
                    const opacity = (1 - dist / mouseConnectionDist) * 0.25;
                    ctx.strokeStyle = getColor(opacity);
                    ctx.lineWidth = 1.0;
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(mouse.x, mouse.y);
                    ctx.stroke();
                }
            }
        }

        animationId = requestAnimationFrame(animate);
    }

    // Mouse events
    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
        mouse.active = true;
    });

    canvas.addEventListener('mouseleave', () => {
        mouse.active = false;
    });

    // Theme changes updates color system
    document.addEventListener('themeChanged', (e) => {
        theme = e.detail.theme;
    });

    // Performance Optimization: Intersection Observer to pause rendering when canvas is out of viewport
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                if (!animationId) {
                    animate();
                }
            } else {
                if (animationId) {
                    cancelAnimationFrame(animationId);
                    animationId = null;
                }
            }
        });
    }, { threshold: 0.05 });

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    observer.observe(canvas);
}
