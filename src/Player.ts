import { Entity } from './Entity';
import { Projectile } from './Projectile';

export class Player extends Entity {
    shieldTimer: number = 0;
    doubleShotTimer: number = 0;
    speedBoostTimer: number = 0;
    hp: number = 100;
    maxHp: number = 100;
    isInvulnerable: boolean = false;
    invulnerabilityTimer: number = 0;
    knockback: { x: number, y: number } = { x: 0, y: 0 };

    constructor(x: number, y: number, radius: number, color: string) {
        super(x, y, radius, color);
    }

    update(canvas: HTMLCanvasElement): void {
        // Power-up Timers
        if (this.shieldTimer > 0) this.shieldTimer--;
        if (this.doubleShotTimer > 0) this.doubleShotTimer--;
        if (this.speedBoostTimer > 0) this.speedBoostTimer--;

        // Invulnerability Timer
        if (this.isInvulnerable) {
            this.invulnerabilityTimer--;
            if (this.invulnerabilityTimer <= 0) {
                this.isInvulnerable = false;
            }
        }

        // Apply Knockback
        this.position.x += this.knockback.x;
        this.position.y += this.knockback.y;

        // Friction / Decay
        this.knockback.x *= 0.9;
        this.knockback.y *= 0.9;

        // Stop very small movements
        if (Math.abs(this.knockback.x) < 0.1) this.knockback.x = 0;
        if (Math.abs(this.knockback.y) < 0.1) this.knockback.y = 0;

        // Boundary checks
        if (this.position.x + this.radius < 0) {
            this.position.x = canvas.width + this.radius;
        } else if (this.position.x - this.radius > canvas.width) {
            this.position.x = 0 - this.radius;
        }

        if (this.position.y + this.radius < 0) {
            this.position.y = canvas.height + this.radius;
        } else if (this.position.y - this.radius > canvas.height) {
            this.position.y = 0 - this.radius;
        }

        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;
    }

    override draw(ctx: CanvasRenderingContext2D): void {
        // Flickering effect
        if (this.isInvulnerable && Math.floor(Date.now() / 50) % 2 === 0) {
            // Skip drawing every other frame (approx) for flicker
            return;
        }

        super.draw(ctx);

        if (this.shieldTimer > 0) {
            ctx.beginPath();
            ctx.arc(this.position.x, this.position.y, this.radius + 5, 0, Math.PI * 2, false);
            ctx.strokeStyle = 'cyan';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.closePath();
        }
    }

    shoot(mouse: { x: number, y: number }): Projectile[] {
        const projectiles: Projectile[] = [];
        const angle = Math.atan2(
            mouse.y - this.position.y,
            mouse.x - this.position.x
        );
        const velocity = {
            x: Math.cos(angle) * 5,
            y: Math.sin(angle) * 5
        };
        const color = 'white';

        projectiles.push(new Projectile(
            this.position.x,
            this.position.y,
            5,
            color,
            velocity
        ));

        if (this.doubleShotTimer > 0) {
            // Second bullet slightly offset or angled? 
            // Let's do parallel bullets
            const offset = 10;
            const perpAngle = angle + Math.PI / 2;

            // Adjust first bullet
            projectiles[0].position.x += Math.cos(perpAngle) * offset;
            projectiles[0].position.y += Math.sin(perpAngle) * offset;

            // Add second bullet
            projectiles.push(new Projectile(
                this.position.x - Math.cos(perpAngle) * offset,
                this.position.y - Math.sin(perpAngle) * offset,
                5,
                color,
                velocity
            ));
        }

        return projectiles;
    }
}
