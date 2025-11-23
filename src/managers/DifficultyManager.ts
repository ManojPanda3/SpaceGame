import { Enemy } from '../Enemy';
import { Player } from '../Player';

export class DifficultyManager {
    maxEnemies: number = 5;
    maxScreenEnemies: number = 12;
    difficultyLevel: number = 1;
    baseSpawnInterval: number = 1000;
    spawnIntervalId: number = 0;
    basePlayerSpeed: number = 5;

    private canvas: HTMLCanvasElement;
    private player: Player;
    private enemies: Enemy[];
    private isPaused: () => boolean;

    constructor(
        canvas: HTMLCanvasElement,
        player: Player,
        enemies: Enemy[],
        isPaused: () => boolean
    ) {
        this.canvas = canvas;
        this.player = player;
        this.enemies = enemies;
        this.isPaused = isPaused;

        this.adjustDifficultyBasedOnScreen();
    }

    spawnEnemies() {
        if (this.spawnIntervalId) clearInterval(this.spawnIntervalId);

        // Calculate spawn interval based on difficulty (gets faster as difficulty increases)
        const spawnInterval = Math.max(300, this.baseSpawnInterval / this.difficultyLevel);

        this.spawnIntervalId = setInterval(() => {
            if (!this.isPaused() && this.enemies.length < this.maxEnemies) {
                this.enemies.push(Enemy.spawn(this.canvas, this.player, this.difficultyLevel));
            }
        }, spawnInterval);
    }

    updateDifficulty(score: number) {
        // Increase difficulty every 2500 points
        const newDifficultyLevel = Math.floor(score / 2500) + 1;

        if (newDifficultyLevel !== this.difficultyLevel) {
            this.difficultyLevel = newDifficultyLevel;

            // Increase max enemies slower (cap based on screen size)
            this.maxEnemies = Math.min(this.maxScreenEnemies, 5 + (this.difficultyLevel - 1));

            // Restart spawning with new difficulty settings
            this.spawnEnemies();
        }
    }

    adjustDifficultyBasedOnScreen() {
        const area = this.canvas.width * this.canvas.height;
        const isMobile = this.canvas.width < 768;

        // Adjust Player Speed
        // Mobile: Slower (3), Desktop: Normal (5)
        this.basePlayerSpeed = isMobile ? 3 : 5;

        // Adjust Max Enemies Cap
        // Calculate based on area, clamp between 4 and 15
        // ~2M pixels (1920x1080) -> ~15 enemies
        // ~250k pixels (375x667) -> ~4 enemies
        const calculatedMax = Math.floor(area / 120000);
        this.maxScreenEnemies = Math.max(4, Math.min(15, calculatedMax));

        // Update current maxEnemies immediately to respect new cap
        this.maxEnemies = Math.min(this.maxScreenEnemies, 5 + (this.difficultyLevel - 1));

        console.log(`Screen Adjusted: Speed=${this.basePlayerSpeed}, MaxEnemiesCap=${this.maxScreenEnemies}`);
    }

    reset() {
        this.difficultyLevel = 1;
        this.maxEnemies = 5;
    }

    stopSpawning() {
        if (this.spawnIntervalId) clearInterval(this.spawnIntervalId);
    }
}
