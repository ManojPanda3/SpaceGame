interface Star {
    x: number;
    y: number;
    baseX: number;
    baseY: number;
    radius: number;
    alpha: number;
    layer: number; // Parallax layer (0 = far, 2 = close)
    color: string;
}

interface Nebula {
    x: number;
    y: number;
    baseX: number;
    baseY: number;
    radius: number;
    color: string;
    alpha: number;
    layer: number;
}



interface ShootingStar {
    x: number;
    y: number;
    length: number;
    speed: number;
    angle: number;
    alpha: number;
    active: boolean;
}

export class Background {
    canvas: HTMLCanvasElement;
    stars: Star[] = [];
    nebulas: Nebula[] = [];
    shootingStars: ShootingStar[] = [];
    starCount: number = 150;
    nebulaCount: number = 5;

    // Parallax offset
    offsetX: number = 0;
    offsetY: number = 0;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.init();
    }

    init() {
        this.stars = [];
        this.nebulas = [];
        this.shootingStars = [];

        // Create stars with different layers for parallax
        for (let i = 0; i < this.starCount; i++) {
            const layer = Math.floor(Math.random() * 3); // 0, 1, or 2
            const x = Math.random() * this.canvas.width;
            const y = Math.random() * this.canvas.height;

            // Different star colors for variety
            const colors = ['white', '#E8F4FF', '#FFE8E8', '#E8FFE8', '#FFE8FF'];
            const color = Math.random() > 0.8 ? colors[Math.floor(Math.random() * colors.length)] : 'white';

            this.stars.push({
                x,
                y,
                baseX: x,
                baseY: y,
                radius: (layer + 1) * 0.5 + Math.random() * 0.5,
                alpha: 0.5 + Math.random() * 0.5, // Static random alpha
                layer,
                color
            });
        }

        // Create nebulas (colorful gas clouds)
        const nebulaColors = [
            'rgba(138, 43, 226, 0.15)',  // Purple
            'rgba(0, 191, 255, 0.15)',   // Deep Sky Blue
            'rgba(255, 20, 147, 0.15)',  // Deep Pink
            'rgba(0, 255, 127, 0.15)',   // Spring Green
            'rgba(255, 69, 0, 0.15)'     // Red Orange
        ];

        for (let i = 0; i < this.nebulaCount; i++) {
            const x = Math.random() * this.canvas.width;
            const y = Math.random() * this.canvas.height;
            this.nebulas.push({
                x,
                y,
                baseX: x,
                baseY: y,
                radius: 100 + Math.random() * 150,
                color: nebulaColors[Math.floor(Math.random() * nebulaColors.length)],
                alpha: 0.3 + Math.random() * 0.3,
                layer: 0 // Nebulas are far away
            });
        }

        // Initialize shooting stars array (they spawn randomly)
        for (let i = 0; i < 3; i++) {
            this.shootingStars.push({
                x: 0,
                y: 0,
                length: 0,
                speed: 0,
                angle: 0,
                alpha: 0,
                active: false
            });
        }
    }

    updateParallax(playerVelocityX: number, playerVelocityY: number) {
        // Update parallax offset based on player movement
        this.offsetX += playerVelocityX * 0.4;
        this.offsetY += playerVelocityY * 0.4;

        // Update star positions with parallax
        this.stars.forEach(star => {
            const parallaxFactor = (star.layer + 1) * 0.15;
            star.x = star.baseX - this.offsetX * parallaxFactor;
            star.y = star.baseY - this.offsetY * parallaxFactor;

            // Wrap around screen
            if (star.x < -10) star.baseX += this.canvas.width + 20;
            if (star.x > this.canvas.width + 10) star.baseX -= this.canvas.width + 20;
            if (star.y < -10) star.baseY += this.canvas.height + 20;
            if (star.y > this.canvas.height + 10) star.baseY -= this.canvas.height + 20;
        });

        // Update nebula positions with parallax
        this.nebulas.forEach(nebula => {
            const parallaxFactor = 0.05;
            nebula.x = nebula.baseX - this.offsetX * parallaxFactor;
            nebula.y = nebula.baseY - this.offsetY * parallaxFactor;

            // Wrap around screen
            if (nebula.x < -nebula.radius) nebula.baseX += this.canvas.width + nebula.radius * 2;
            if (nebula.x > this.canvas.width + nebula.radius) nebula.baseX -= this.canvas.width + nebula.radius * 2;
            if (nebula.y < -nebula.radius) nebula.baseY += this.canvas.height + nebula.radius * 2;
            if (nebula.y > this.canvas.height + nebula.radius) nebula.baseY -= this.canvas.height + nebula.radius * 2;
        });

    }

    update(playerVelocityX: number = 0, playerVelocityY: number = 0) {
        // Update parallax
        this.updateParallax(playerVelocityX, playerVelocityY);

        // Spawn shooting stars randomly
        if (Math.random() < 0.01) { // 1% chance each frame
            const inactiveStar = this.shootingStars.find(s => !s.active);
            if (inactiveStar) {
                inactiveStar.x = Math.random() * this.canvas.width;
                inactiveStar.y = Math.random() * this.canvas.height * 0.5; // Top half
                inactiveStar.length = 30 + Math.random() * 50;
                inactiveStar.speed = 5 + Math.random() * 10;
                inactiveStar.angle = Math.PI / 4 + Math.random() * Math.PI / 4; // 45-90 degrees
                inactiveStar.alpha = 1;
                inactiveStar.active = true;
            }
        }

        // Update shooting stars
        this.shootingStars.forEach(star => {
            if (star.active) {
                star.x += Math.cos(star.angle) * star.speed;
                star.y += Math.sin(star.angle) * star.speed;
                star.alpha -= 0.02;

                if (star.alpha <= 0 || star.x > this.canvas.width || star.y > this.canvas.height) {
                    star.active = false;
                }
            }
        });
    }

    draw(ctx: CanvasRenderingContext2D) {
        // Draw nebulas (furthest back)
        this.nebulas.forEach(nebula => {
            const gradient = ctx.createRadialGradient(
                nebula.x, nebula.y, 0,
                nebula.x, nebula.y, nebula.radius
            );
            gradient.addColorStop(0, nebula.color);
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

            ctx.save();
            ctx.globalAlpha = nebula.alpha;
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(nebula.x, nebula.y, nebula.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });

        // Draw stars (layered by depth)
        for (let layer = 0; layer <= 2; layer++) {
            this.stars.filter(star => star.layer === layer).forEach(star => {
                ctx.save();
                ctx.globalAlpha = star.alpha * (layer === 0 ? 0.5 : 1);
                ctx.fillStyle = star.color;
                ctx.beginPath();
                ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            });
        }

        // Draw shooting stars (on top)
        this.shootingStars.forEach(star => {
            if (star.active) {
                ctx.save();
                ctx.globalAlpha = star.alpha;

                const gradient = ctx.createLinearGradient(
                    star.x,
                    star.y,
                    star.x - Math.cos(star.angle) * star.length,
                    star.y - Math.sin(star.angle) * star.length
                );
                gradient.addColorStop(0, 'white');
                gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

                ctx.strokeStyle = gradient;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(star.x, star.y);
                ctx.lineTo(
                    star.x - Math.cos(star.angle) * star.length,
                    star.y - Math.sin(star.angle) * star.length
                );
                ctx.stroke();
                ctx.restore();
            }
        });
    }
}
