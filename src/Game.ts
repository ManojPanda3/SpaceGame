import { Player } from './Player';
import { Projectile } from './Projectile';
import { Enemy } from './Enemy';
import { Particle } from './Particle';
import { Background } from './Background';
import { FloatingText } from './FloatingText';
import { PowerUp } from './PowerUp';
import { InputManager } from './managers/InputManager';
import { UIManager } from './managers/UIManager';
import { DifficultyManager } from './managers/DifficultyManager';
import { PowerUpManager } from './managers/PowerUpManager';
import { LeaderboardManager } from './managers/LeaderboardManager';

export class Game {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    player: Player;
    projectiles: Projectile[] = [];
    enemies: Enemy[] = [];
    particles: Particle[] = [];
    floatingTexts: FloatingText[] = [];
    powerUps: PowerUp[] = [];
    background: Background;
    animationId: number = 0;
    score: number = 0;
    highScore: number = 0;
    gameRunning: boolean = false;
    isGameOver: boolean = false;
    isPaused: boolean = false;

    // Managers
    inputManager: InputManager;
    uiManager: UIManager;
    difficultyManager: DifficultyManager;
    powerUpManager: PowerUpManager;
    leaderboardManager: LeaderboardManager;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d')!;
        this.canvas.width = innerWidth;
        this.canvas.height = innerHeight;

        // Load High Score
        const savedScore = localStorage.getItem('spaceGameHighScore');
        this.highScore = savedScore ? parseInt(savedScore) : 0;

        this.player = new Player(
            this.canvas.width / 2,
            this.canvas.height / 2,
            10,
            'white'
        );

        this.background = new Background(this.canvas);

        // Initialize managers
        this.uiManager = new UIManager();

        this.difficultyManager = new DifficultyManager(
            this.canvas,
            this.player,
            this.enemies,
            () => this.isPaused
        );

        this.powerUpManager = new PowerUpManager(
            this.powerUps,
            this.player,
            this.floatingTexts
        );

        this.leaderboardManager = new LeaderboardManager();

        this.inputManager = new InputManager(
            this.player,
            () => this.gameRunning,
            () => this.isPaused,
            () => this.togglePause(),
            () => this.toggleFullscreen(),
            () => this.start(),
            (projectiles) => this.projectiles.push(...projectiles)
        );

        // Show mobile controls if needed
        if (this.inputManager.isMobile) {
            this.inputManager.showMobileControls();
        }

        // Show initial high score
        this.uiManager.updateHighScoreUI(this.highScore);

        // Leaderboard Button Logic
        const leaderboardBtn = document.getElementById('leaderboardBtn');
        const pauseLeaderboardBtn = document.getElementById('pauseLeaderboardBtn');
        const closeLeaderboardBtn = document.getElementById('closeLeaderboardBtn');

        const showLeaderboard = () => {
            this.leaderboardManager.update(this.score);
            this.uiManager.showLeaderboard(this.leaderboardManager.getLeaderboardView());
        };

        if (leaderboardBtn) {
            leaderboardBtn.addEventListener('click', showLeaderboard);
        }

        if (pauseLeaderboardBtn) {
            pauseLeaderboardBtn.addEventListener('click', showLeaderboard);
        }

        if (closeLeaderboardBtn) {
            closeLeaderboardBtn.addEventListener('click', () => {
                this.uiManager.hideLeaderboard();
            });
        }

        // Setup resize listener
        window.addEventListener('resize', () => {
            this.canvas.width = innerWidth;
            this.canvas.height = innerHeight;
            this.background.init();
            this.difficultyManager.adjustDifficultyBasedOnScreen();
        });

        // Start animation loop immediately for background
        this.animate();
    }

    togglePause() {
        if (!this.gameRunning || this.isGameOver) return;

        this.isPaused = !this.isPaused;

        if (this.isPaused) {
            this.difficultyManager.stopSpawning();
            this.uiManager.showPauseModal();
        } else {
            this.difficultyManager.spawnEnemies();
            this.uiManager.hidePauseModal();
        }
    }

    async toggleFullscreen() {
        if (!document.fullscreenElement) {
            try {
                await document.documentElement.requestFullscreen();
                if (screen.orientation && 'lock' in screen.orientation) {
                    try {
                        await (screen.orientation as any).lock('landscape');
                    } catch (err) {
                        console.log('Orientation lock not supported or failed:', err);
                    }
                }
            } catch (err) {
                console.error(`Error attempting to enable fullscreen: ${err}`);
            }
        } else {
            if (document.exitFullscreen) {
                await document.exitFullscreen();
                if (screen.orientation && 'unlock' in screen.orientation) {
                    (screen.orientation as any).unlock();
                }
            }
        }
    }

    start() {
        this.gameRunning = true;
        this.isGameOver = false;
        this.isPaused = false;
        this.score = 0;
        // Clear arrays instead of reassigning to preserve manager references
        this.projectiles.length = 0;
        this.enemies.length = 0;
        this.particles.length = 0;
        this.floatingTexts.length = 0;
        this.powerUps.length = 0;
        this.player.position = { x: this.canvas.width / 2, y: this.canvas.height / 2 };
        this.player.radius = 10;
        this.player.hp = this.player.maxHp;
        this.player.shieldTimer = 0;
        this.player.doubleShotTimer = 0;
        this.player.speedBoostTimer = 0;
        this.player.isInvulnerable = false;

        // Reset difficulty
        this.difficultyManager.reset();

        // Note: animate() is already running
        this.difficultyManager.spawnEnemies();

        this.uiManager.resetUI();
    }

    handleInput() {
        const speed = this.player.speedBoostTimer > 0
            ? this.difficultyManager.basePlayerSpeed * 1.6
            : this.difficultyManager.basePlayerSpeed;

        this.player.velocity = this.inputManager.getPlayerVelocity(speed);
    }

    animate = () => {
        this.animationId = requestAnimationFrame(this.animate);

        if (this.isPaused) return;

        // Update Leaderboard Simulation
        if (this.gameRunning) {
            this.leaderboardManager.update(this.score);
        }

        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.background.update(this.player.velocity.x, this.player.velocity.y);
        this.background.draw(this.ctx);

        // Only update game entities if game is running
        if (this.gameRunning && !this.isGameOver) {
            this.handleInput();
            this.player.update(this.canvas);

            // Update Power-up UI
            this.uiManager.updatePowerUpUI(this.player);
        } else {
            // Shrink player on game over
            if (this.player.radius > 0.1) {
                this.player.radius -= 0.4;
            } else {
                this.player.radius = 0;
            }
        }
        this.player.draw(this.ctx);

        this.particles.forEach((particle, index) => {
            if (particle.alpha <= 0) {
                this.particles.splice(index, 1);
            } else {
                particle.update(this.canvas);
                particle.draw(this.ctx);
            }
        });

        this.floatingTexts.forEach((text, index) => {
            if (text.markedForDeletion) {
                this.floatingTexts.splice(index, 1);
            } else {
                text.update();
                text.draw(this.ctx);
            }
        });

        if (this.gameRunning && !this.isGameOver) {
            // PowerUps
            this.powerUps.forEach((powerUp, index) => {
                powerUp.update(this.canvas);
                powerUp.draw(this.ctx);
            });

            // Check power-up collection
            const result = this.powerUpManager.checkPowerUpCollection(
                this.player.position,
                this.player.radius
            );
            if (result.collected && result.hpUpdated > 0) {
                this.uiManager.updateHP(result.hpUpdated, this.player.maxHp);
            }

            this.projectiles.forEach((projectile, index) => {
                projectile.update(this.canvas);
                projectile.draw(this.ctx);

                if (projectile.markedForDeletion) {
                    this.projectiles.splice(index, 1);
                }
            });

            this.enemies.forEach((enemy, index) => {
                enemy.update(this.canvas, this.player);
                enemy.draw(this.ctx);

                const dist = Math.hypot(this.player.position.x - enemy.position.x, this.player.position.y - enemy.position.y);

                // End Game or Shield Hit or Damage
                if (dist - enemy.radius - this.player.radius < 1) {
                    if (this.player.shieldTimer > 0) {
                        // Shield active: Destroy enemy, no damage
                        this.enemies.splice(index, 1);
                        for (let i = 0; i < enemy.radius; i++) {
                            this.particles.push(new Particle(
                                enemy.position.x,
                                enemy.position.y,
                                Math.random() * 2,
                                enemy.color,
                                { x: (Math.random() - 0.5) * 4, y: (Math.random() - 0.5) * 4 }
                            ));
                        }
                    } else if (!this.player.isInvulnerable) {
                        // Calculate damage based on momentum
                        const relVelX = this.player.velocity.x - enemy.velocity.x;
                        const relVelY = this.player.velocity.y - enemy.velocity.y;
                        const relSpeed = Math.hypot(relVelX, relVelY);

                        const damage = (enemy.radius * 0.5) + (relSpeed * enemy.radius * 0.2);

                        this.player.hp -= damage;

                        // Update UI
                        this.uiManager.updateHP(this.player.hp, this.player.maxHp);

                        // Feedback: Knockback
                        const angle = Math.atan2(
                            this.player.position.y - enemy.position.y,
                            this.player.position.x - enemy.position.x
                        );

                        this.player.knockback.x = Math.cos(angle) * 15;
                        this.player.knockback.y = Math.sin(angle) * 15;

                        // Feedback: Invulnerability
                        this.player.isInvulnerable = true;
                        this.player.invulnerabilityTimer = 60;

                        // Destroy enemy on impact
                        this.enemies.splice(index, 1);
                        for (let i = 0; i < enemy.radius; i++) {
                            this.particles.push(new Particle(
                                enemy.position.x,
                                enemy.position.y,
                                Math.random() * 2,
                                enemy.color,
                                { x: (Math.random() - 0.5) * 4, y: (Math.random() - 0.5) * 4 }
                            ));
                        }

                        if (this.player.hp <= 0) {
                            this.gameOver();
                        }
                    }
                }

                this.projectiles.forEach((projectile, pIndex) => {
                    const dist = Math.hypot(projectile.position.x - enemy.position.x, projectile.position.y - enemy.position.y);

                    // Projectile hits Enemy
                    if (dist - enemy.radius - projectile.radius < 1) {
                        // Create explosions
                        for (let i = 0; i < enemy.radius * 2; i++) {
                            this.particles.push(new Particle(
                                projectile.position.x,
                                projectile.position.y,
                                Math.random() * 2,
                                enemy.color,
                                {
                                    x: (Math.random() - 0.5) * (Math.random() * 6),
                                    y: (Math.random() - 0.5) * (Math.random() * 6)
                                }
                            ));
                        }

                        if (enemy.radius - 10 > 5) {
                            // Shrink enemy
                            this.score += 100;
                            this.floatingTexts.push(new FloatingText(enemy.position.x, enemy.position.y, '+100', 'white'));
                            enemy.radius -= 10;
                            setTimeout(() => {
                                this.projectiles.splice(pIndex, 1);
                            }, 0);
                        } else {
                            // Remove enemy completely
                            this.score += 250;
                            this.floatingTexts.push(new FloatingText(enemy.position.x, enemy.position.y, '+250', 'gold'));
                            this.powerUpManager.spawnPowerUp(enemy.position.x, enemy.position.y);
                            setTimeout(() => {
                                this.enemies.splice(index, 1);
                                this.projectiles.splice(pIndex, 1);
                            }, 0);
                        }

                        this.uiManager.updateScore(this.score);

                        // Update difficulty based on new score
                        this.difficultyManager.updateDifficulty(this.score);
                    }
                });
            });
        }
    }

    gameOver() {
        this.gameRunning = false;
        this.isGameOver = true;
        this.difficultyManager.stopSpawning();

        // Update High Score
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('spaceGameHighScore', this.highScore.toString());
            this.uiManager.updateHighScoreUI(this.highScore);
        }

        // Create player explosion
        for (let i = 0; i < 50; i++) {
            this.particles.push(new Particle(
                this.player.position.x,
                this.player.position.y,
                Math.random() * 3,
                'white',
                {
                    x: (Math.random() - 0.5) * (Math.random() * 10),
                    y: (Math.random() - 0.5) * (Math.random() * 10)
                }
            ));
        }

        setTimeout(() => {
            // Don't cancel animation frame so background keeps moving
            // cancelAnimationFrame(this.animationId);
            this.uiManager.showGameOverModal(this.score);
        }, 2000);
    }
}
