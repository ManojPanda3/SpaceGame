import { PowerUp, type PowerUpType } from '../PowerUp';
import { Player } from '../Player';
import { FloatingText } from '../FloatingText';

export class PowerUpManager {
    private powerUps: PowerUp[];
    private player: Player;
    private floatingTexts: FloatingText[];

    constructor(powerUps: PowerUp[], player: Player, floatingTexts: FloatingText[]) {
        this.powerUps = powerUps;
        this.player = player;
        this.floatingTexts = floatingTexts;
    }

    spawnPowerUp(x: number, y: number) {
        const rand = Math.random();

        // 5% chance for HealthBoost (more accessible)
        if (rand < 0.05) {
            this.powerUps.push(new PowerUp(x, y, 'HealthBoost'));
        }
        // 10% chance for other power-ups
        else if (rand < 0.15) {
            const types: PowerUpType[] = ['Shield', 'DoubleShot', 'SpeedBoost'];
            const type = types[Math.floor(Math.random() * types.length)];
            this.powerUps.push(new PowerUp(x, y, type));
        }
    }

    activatePowerUp(type: PowerUpType): number {
        const duration = 300; // 5 seconds at 60fps

        if (type === 'Shield') {
            this.player.shieldTimer = duration;
            return 0;
        } else if (type === 'DoubleShot') {
            this.player.doubleShotTimer = duration;
            return 0;
        } else if (type === 'SpeedBoost') {
            this.player.speedBoostTimer = duration;
            return 0;
        } else if (type === 'HealthBoost') {
            // Restore 20 HP
            this.player.hp = Math.min(this.player.maxHp, this.player.hp + 20);
            return this.player.hp;
        }

        return 0;
    }

    checkPowerUpCollection(playerPosition: { x: number, y: number }, playerRadius: number): { collected: PowerUp | null, hpUpdated: number } {
        for (let i = this.powerUps.length - 1; i >= 0; i--) {
            const powerUp = this.powerUps[i];
            const dist = Math.hypot(playerPosition.x - powerUp.position.x, playerPosition.y - powerUp.position.y);

            // Collect PowerUp
            if (dist - playerRadius - powerUp.radius < 1) {
                const hpUpdated = this.activatePowerUp(powerUp.type);
                this.floatingTexts.push(new FloatingText(powerUp.position.x, powerUp.position.y, powerUp.type, powerUp.color));
                this.powerUps.splice(i, 1);
                return { collected: powerUp, hpUpdated };
            }
        }

        return { collected: null, hpUpdated: 0 };
    }
}
