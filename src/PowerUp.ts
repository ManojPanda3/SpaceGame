import { Entity } from './Entity';

export type PowerUpType = 'Shield' | 'DoubleShot' | 'SpeedBoost';

export class PowerUp extends Entity {
    type: PowerUpType;
    image: HTMLImageElement | null = null; // Could use images, but we'll use colors for now

    constructor(x: number, y: number, type: PowerUpType) {
        let color = 'white';
        switch (type) {
            case 'Shield': color = 'cyan'; break;
            case 'DoubleShot': color = 'lime'; break;
            case 'SpeedBoost': color = 'yellow'; break;
        }
        super(x, y, 15, color);
        this.type = type;
        this.velocity = { x: 0, y: 0 }; // Stationary or slowly floating
    }

    update(_canvas: HTMLCanvasElement): void {
        // Maybe float a bit?
        this.position.y += Math.sin(Date.now() / 200) * 0.5;
    }

    override draw(ctx: CanvasRenderingContext2D): void {
        ctx.save();
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2, false);
        ctx.fillStyle = this.color;
        ctx.fill();

        // Add an icon or letter
        ctx.fillStyle = 'black';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        let label = '';
        switch (this.type) {
            case 'Shield': label = 'S'; break;
            case 'DoubleShot': label = 'D'; break;
            case 'SpeedBoost': label = 'B'; break;
        }
        ctx.fillText(label, this.position.x, this.position.y);
        ctx.restore();
    }
}
