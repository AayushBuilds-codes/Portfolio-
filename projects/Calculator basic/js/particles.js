/**
 * Interactive Mathematical Particle Canvas Background
 * Animates floating math symbols (+, -, *, /, √, %, π, =, numbers) and nodes that form connections.
 * Interacts with mouse pointer and updates colors based on theme.
 */

document.addEventListener('DOMContentLoaded', () => {
    initMathParticles();
});

function initMathParticles() {
    const canvas = document.getElementById('particle-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationId = null;
    let particles = [];
    let mouse = { x: null, y: null, active: false };
    
    // Config
    const maxParticles = 60;
    const connectionDist = 110;
    const mouseRepelDist = 120;
    const mathSymbols = ['+', '−', '×', '÷', '=', '√', '%', 'π', '0', '1', '2', '3', '5', '8', 'x', 'y'];

    // Get current theme colors
    function getThemeColors() {
        const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
        return {
            nodeColor: isDark ? 'rgba(99, 102, 241, 0.45)' : 'rgba(79, 70, 229, 0.35)', // Indigo
            lineColor: isDark ? 'rgba(99, 102, 241, 0.08)' : 'rgba(79, 70, 229, 0.06)',
            textColor: isDark ? 'rgba(244, 63, 94, 0.25)' : 'rgba(225, 29, 72, 0.18)'     // Rose
        };
    }

    let colors = getThemeColors();

    // Handle Resize
    function resizeCanvas() {
        const parent = canvas.parentElement || document.body;
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
        createParticles();
    }

    window.addEventListener('resize', resizeCanvas);
    
    // Math Particle Class
    class MathParticle {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.size = Math.random() * 2 + 1.5;
            this.speedX = Math.random() * 0.5 - 0.25;
            this.speedY = Math.random() * 0.5 - 0.25;
            
            // Randomly assign either a node dot or a math symbol text
            this.isSymbol = Math.random() > 0.45;
            this.symbol = mathSymbols[Math.floor(Math.random() * mathSymbols.length)];
            this.fontSize = Math.floor(Math.random() * 10) + 12; // 12px to 22px
            this.rotation = Math.random() * Math.PI * 2;
            this.rotationSpeed = Math.random() * 0.02 - 0.01;
        }

        update() {
            // Apply speed
            this.x += this.speedX;
            this.y += this.speedY;
            this.rotation += this.rotationSpeed;

            // Mouse interaction (repel)
            if (mouse.active && mouse.x !== null && mouse.y !== null) {
                const dx = this.x - mouse.x;
                const dy = this.y - mouse.y;
                const dist = Math.hypot(dx, dy);
                if (dist < mouseRepelDist) {
                    const force = (mouseRepelDist - dist) / mouseRepelDist;
                    const angle = Math.atan2(dy, dx);
                    // Push particles away
                    this.x += Math.cos(angle) * force * 2;
                    this.y += Math.sin(angle) * force * 2;
                }
            }

            // Screen boundaries wrap around
            if (this.x < -30) this.x = canvas.width + 30;
            if (this.x > canvas.width + 30) this.x = -30;
            if (this.y < -30) this.y = canvas.height + 30;
            if (this.y > canvas.height + 30) this.y = -30;
        }

        draw() {
            if (this.isSymbol) {
                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.rotate(this.rotation);
                ctx.fillStyle = colors.textColor;
                ctx.font = `bold ${this.fontSize}px 'Roboto Mono', monospace`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(this.symbol, 0, 0);
                ctx.restore();
            } else {
                ctx.fillStyle = colors.nodeColor;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    function createParticles() {
        particles = [];
        const area = canvas.width * canvas.height;
        const count = Math.min(maxParticles, Math.floor(area / 15000));
        for (let i = 0; i < count; i++) {
            particles.push(new MathParticle());
        }
    }

    // Animation loop
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw connections between nodes
        for (let i = 0; i < particles.length; i++) {
            particles[i].update();
            particles[i].draw();

            // Connect lines
            for (let j = i + 1; j < particles.length; j++) {
                // Connect dot-to-dot or dot-to-symbol, only if close
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const dist = Math.hypot(dx, dy);

                if (dist < connectionDist) {
                    const opacity = (1 - dist / connectionDist) * 0.12;
                    ctx.strokeStyle = colors.lineColor.replace('0.08', opacity).replace('0.06', opacity);
                    ctx.lineWidth = 0.8;
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.stroke();
                }
            }
        }

        animationId = requestAnimationFrame(animate);
    }

    // Start
    resizeCanvas();
    animate();

    // Mouse Move listeners
    const interactionArea = document.body;
    interactionArea.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
        mouse.active = true;
    });

    interactionArea.addEventListener('mouseleave', () => {
        mouse.active = false;
    });

    // Handle Theme changes updates colors
    const observerTheme = new MutationObserver(() => {
        colors = getThemeColors();
    });
    observerTheme.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
}
