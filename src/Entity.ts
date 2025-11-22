export interface Vector2 {
  x: number;
  y: number;
}

export abstract class Entity {
  position: Vector2;
  velocity: Vector2;
  radius: number;
  color: string;
  markedForDeletion: boolean = false;

  constructor(x: number, y: number, radius: number, color: string) {
    this.position = { x, y };
    this.velocity = { x: 0, y: 0 };
    this.radius = radius;
    this.color = color;
  }

  abstract update(canvas: HTMLCanvasElement): void;
  
  draw(ctx: CanvasRenderingContext2D): void {
    ctx.beginPath();
    ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2, false);
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.closePath();
  }
}
