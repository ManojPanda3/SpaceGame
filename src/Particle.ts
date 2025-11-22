import { Entity } from './Entity';

export class Particle extends Entity {
    alpha: number = 1;
    friction: number = 0.99;

    constructor(x: number, y: number, radius: number, color: string, velocity: { x: number, y: number }) {
        super(x, y, radius, color);
        this.velocity = velocity;
    }

    update(_canvas: HTMLCanvasElement): void {
        this.velocity.x *= this.friction;
        this.velocity.y *= this.friction;
        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;
        this.alpha -= 0.01;

        if (this.alpha <= 0) {
            this.markedForDeletion = true;
        }
    }

    override draw(ctx: CanvasRenderingContext2D): void {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        super.draw(ctx);
        ctx.restore();
    }
}
