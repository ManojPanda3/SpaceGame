import { Entity } from './Entity';
import { Player } from './Player';

export class Enemy extends Entity {
    constructor(x: number, y: number, radius: number, color: string, velocity: { x: number, y: number }) {
        super(x, y, radius, color);
        this.velocity = velocity;
    }

    update(_canvas: HTMLCanvasElement, player?: Player): void {
        if (player) {
            // Calculate current speed (magnitude)
            const currentSpeed = Math.hypot(this.velocity.x, this.velocity.y);

            const angle = Math.atan2(
                player.position.y - this.position.y,
                player.position.x - this.position.x
            );

            // Update direction while preserving speed
            this.velocity.x = Math.cos(angle) * currentSpeed;
            this.velocity.y = Math.sin(angle) * currentSpeed;
        }
        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;
    }

    static spawn(canvas: HTMLCanvasElement, player: Player, difficulty: number = 1): Enemy {
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

        // Scale speed based on difficulty (increases with difficulty)
        const baseSpeed = 1;
        const speedMultiplier = 1 + (difficulty - 1) * 0.1; // +10% speed per difficulty level (was 20%)
        const speed = baseSpeed * speedMultiplier;

        const velocity = {
            x: Math.cos(angle) * speed,
            y: Math.sin(angle) * speed
        };

        return new Enemy(x, y, radius, color, velocity);
    }
}
