export class FloatingText {
    x: number;
    y: number;
    text: string;
    color: string;
    velocity: { x: number, y: number };
    alpha: number = 1;
    markedForDeletion: boolean = false;

    constructor(x: number, y: number, text: string, color: string) {
        this.x = x;
        this.y = y;
        this.text = text;
        this.color = color;
        this.velocity = {
            x: (Math.random() - 0.5) * 2,
            y: -2 // Move up
        };
    }

    update() {
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        this.alpha -= 0.02;
        if (this.alpha <= 0) this.markedForDeletion = true;
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.font = '16px sans-serif';
        ctx.fillStyle = this.color;
        ctx.fillText(this.text, this.x, this.y);
        ctx.restore();
    }
}
