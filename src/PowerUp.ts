import { Entity } from './Entity';

export type PowerUpType = 'Shield' | 'DoubleShot' | 'SpeedBoost' | 'HealthBoost';

export class PowerUp extends Entity {
    type: PowerUpType;
    image: HTMLImageElement;

    constructor(x: number, y: number, type: PowerUpType) {
        let color = 'white';
        let imageSrc = '';
        switch (type) {
            case 'Shield':
                color = 'cyan';
                imageSrc = '/shield.png';
                break;
            case 'DoubleShot':
                color = 'lime';
                imageSrc = '/double.png';
                break;
            case 'SpeedBoost':
                color = 'yellow';
                imageSrc = '/speed.png';
                break;
            case 'HealthBoost':
                color = 'lime';
                imageSrc = '/health.png';
                break;
        }
        super(x, y, 35, color); // Increased radius to 35 for better visibility
        this.type = type;
        this.velocity = { x: 0, y: 0 }; // Stationary or slowly floating

        // Load image
        this.image = new Image();
        this.image.src = imageSrc;
    }

    update(_canvas: HTMLCanvasElement): void {
        // Maybe float a bit?
        this.position.y += Math.sin(Date.now() / 200) * 0.5;
    }

    override draw(ctx: CanvasRenderingContext2D): void {
        ctx.save();

        // Draw the image if loaded
        if (this.image.complete) {
            const maxSize = this.radius * 1.5;

            // Calculate aspect ratio and maintain it
            const aspectRatio = this.image.naturalWidth / this.image.naturalHeight;
            let width, height;

            if (aspectRatio > 1) {
                // Wider than tall
                width = maxSize;
                height = maxSize / aspectRatio;
            } else {
                // Taller than wide or square
                height = maxSize;
                width = maxSize * aspectRatio;
            }

            ctx.drawImage(
                this.image,
                this.position.x - width / 2,
                this.position.y - height / 2,
                width,
                height
            );
        }

        ctx.restore();
    }
}
