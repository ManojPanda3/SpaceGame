export class Background {
    stars: { x: number; y: number; radius: number; alpha: number }[] = [];
    canvas: HTMLCanvasElement;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.init();
    }

    init() {
        this.stars = [];
        for (let i = 0; i < 100; i++) {
            this.stars.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                radius: Math.random() * 2,
                alpha: Math.random()
            });
        }
    }

    update() {
        // Optional: Make stars twinkle or move slowly
        this.stars.forEach(star => {
            star.alpha -= 0.005;
            if (star.alpha <= 0) {
                star.alpha = 1;
                star.x = Math.random() * this.canvas.width;
                star.y = Math.random() * this.canvas.height;
            }
        });
    }

    draw(ctx: CanvasRenderingContext2D) {
        this.stars.forEach(star => {
            ctx.save();
            ctx.globalAlpha = star.alpha;
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2, false);
            ctx.fillStyle = 'white';
            ctx.fill();
            ctx.restore();
        });
    }
}
