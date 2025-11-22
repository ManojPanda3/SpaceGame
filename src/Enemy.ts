import { Entity } from './Entity';
import { Player } from './Player';

export class Enemy extends Entity {
    constructor(x: number, y: number, radius: number, color: string, velocity: { x: number, y: number }) {
        super(x, y, radius, color);
        this.velocity = velocity;
    }

    update(_canvas: HTMLCanvasElement, player?: Player): void {
        if (player) {
            const angle = Math.atan2(
                player.position.y - this.position.y,
                player.position.x - this.position.x
            );
            // Constant speed of 1 (matching original spawn velocity magnitude)
            // Or maybe slightly faster/slower? Original was just cos/sin so magnitude 1.
            this.velocity.x = Math.cos(angle);
            this.velocity.y = Math.sin(angle);
        }
        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;
    }

    static spawn(canvas: HTMLCanvasElement, player: Player): Enemy {
        const radius = Math.random() * (30 - 4) + 4;
        let x: number;
        let y: number;

        if (Math.random() < 0.5) {
            x = Math.random() < 0.5 ? 0 - radius : canvas.width + radius;
            y = Math.random() * canvas.height;
        } else {
            x = Math.random() * canvas.width;
            y = Math.random() < 0.5 ? 0 - radius : canvas.height + radius;
        }

        const color = `hsl(${Math.random() * 360}, 50%, 50%)`;

        const angle = Math.atan2(
            player.position.y - y,
            player.position.x - x
        );

        const velocity = {
            x: Math.cos(angle),
            y: Math.sin(angle)
        };

        return new Enemy(x, y, radius, color, velocity);
    }
}
