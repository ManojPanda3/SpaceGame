import { Entity } from './Entity';

export class Projectile extends Entity {
    constructor(x: number, y: number, radius: number, color: string, velocity: { x: number, y: number }) {
        super(x, y, radius, color);
        this.velocity = velocity;
    }

    update(canvas: HTMLCanvasElement): void {
        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;

        if (
            this.position.x + this.radius < 0 ||
            this.position.x - this.radius > canvas.width ||
            this.position.y + this.radius < 0 ||
            this.position.y - this.radius > canvas.height
        ) {
            this.markedForDeletion = true;
        }
    }
}
