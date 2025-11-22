import { Player } from './Player';
import { Projectile } from './Projectile';
import { Enemy } from './Enemy';
import { Particle } from './Particle';
import { Background } from './Background';
import { FloatingText } from './FloatingText';
import { PowerUp, type PowerUpType } from './PowerUp';

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
    gameRunning: boolean = false;
    keys: { [key: string]: boolean } = {};
    spawnIntervalId: number = 0;
    isGameOver: boolean = false;

    isPaused: boolean = false;
    isMobile: boolean = false;
    joystick: { active: boolean, x: number, y: number, originX: number, originY: number } = { active: false, x: 0, y: 0, originX: 0, originY: 0 };

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d')!;
        this.canvas.width = innerWidth;
        this.canvas.height = innerHeight;

        // Mobile Detection
        this.isMobile = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
        if (this.isMobile) {
            const joystickContainer = document.getElementById('joystickContainer');
            if (joystickContainer) joystickContainer.style.display = 'block';
        }

        this.player = new Player(
            this.canvas.width / 2,
            this.canvas.height / 2,
            10,
            'white'
        );

        this.background = new Background(this.canvas);

        this.initEventListeners();
    }

    initEventListeners() {
        window.addEventListener('resize', () => {
            this.canvas.width = innerWidth;
            this.canvas.height = innerHeight;
            this.background.init();
        });

        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            if (e.code === 'Escape') {
                this.togglePause();
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });

        // Mouse Shoot
        window.addEventListener('click', (e) => {
            if (this.gameRunning && !this.isPaused && !this.isMobile) {
                const newProjectiles = this.player.shoot({ x: e.clientX, y: e.clientY });
                this.projectiles.push(...newProjectiles);
            }
        });

        // Touch Shoot (Anywhere on screen except joystick)
        window.addEventListener('touchstart', (e) => {
            if (this.gameRunning && !this.isPaused && this.isMobile) {
                const touch = e.touches[0];
                const joystickContainer = document.getElementById('joystickContainer');
                const rect = joystickContainer?.getBoundingClientRect();

                // Don't shoot if touching joystick area
                if (rect && (
                    touch.clientX >= rect.left &&
                    touch.clientX <= rect.right &&
                    touch.clientY >= rect.top &&
                    touch.clientY <= rect.bottom
                )) return;

                const newProjectiles = this.player.shoot({ x: touch.clientX, y: touch.clientY });
                this.projectiles.push(...newProjectiles);
            }
        });

        // Joystick Logic
        const joystickContainer = document.getElementById('joystickContainer');
        const joystickKnob = document.getElementById('joystickKnob');

        if (joystickContainer && joystickKnob) {
            joystickContainer.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.joystick.active = true;
                const touch = e.touches[0];
                const rect = joystickContainer.getBoundingClientRect();
                this.joystick.originX = rect.left + rect.width / 2;
                this.joystick.originY = rect.top + rect.height / 2;
                this.updateJoystick(touch.clientX, touch.clientY);
            }, { passive: false });

            joystickContainer.addEventListener('touchmove', (e) => {
                e.preventDefault();
                if (this.joystick.active) {
                    const touch = e.touches[0];
                    this.updateJoystick(touch.clientX, touch.clientY);
                }
            }, { passive: false });

            joystickContainer.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.joystick.active = false;
                this.joystick.x = 0;
                this.joystick.y = 0;
                joystickKnob.style.transform = `translate(-50%, -50%)`;
            });
        }

        const restartBtn = document.getElementById('restartBtn');
        if (restartBtn) {
            restartBtn.addEventListener('click', () => {
                this.start();
            });
        }
    }

    updateJoystick(clientX: number, clientY: number) {
        const joystickKnob = document.getElementById('joystickKnob');
        if (!joystickKnob) return;

        const dx = clientX - this.joystick.originX;
        const dy = clientY - this.joystick.originY;
        const distance = Math.min(Math.hypot(dx, dy), 40); // Max radius 40
        const angle = Math.atan2(dy, dx);

        this.joystick.x = Math.cos(angle) * (distance / 40);
        this.joystick.y = Math.sin(angle) * (distance / 40);

        const knobX = Math.cos(angle) * distance;
        const knobY = Math.sin(angle) * distance;

        joystickKnob.style.transform = `translate(calc(-50% + ${knobX}px), calc(-50% + ${knobY}px))`;
    }

    togglePause() {
        if (!this.gameRunning || this.isGameOver) return;

        this.isPaused = !this.isPaused;
        const pauseModalEl = document.getElementById('pauseModalEl');

        if (this.isPaused) {
            clearInterval(this.spawnIntervalId);
            if (pauseModalEl) pauseModalEl.style.display = 'flex';
        } else {
            this.spawnEnemies();
            if (pauseModalEl) pauseModalEl.style.display = 'none';
        }
    }

    start() {
        this.gameRunning = true;
        this.isGameOver = false;
        this.isPaused = false;
        this.score = 0;
        this.projectiles = [];
        this.enemies = [];
        this.particles = [];
        this.floatingTexts = [];
        this.powerUps = [];
        this.player.position = { x: this.canvas.width / 2, y: this.canvas.height / 2 };
        this.player.radius = 10; // Reset radius
        this.player.hp = this.player.maxHp;
        this.player.shieldTimer = 0;
        this.player.doubleShotTimer = 0;
        this.player.speedBoostTimer = 0;
        this.player.isInvulnerable = false;
        this.animate();
        this.spawnEnemies();

        const scoreEl = document.getElementById('scoreEl');
        const modalEl = document.getElementById('modalEl');
        const hpBarEl = document.getElementById('hpBarEl');
        const pauseModalEl = document.getElementById('pauseModalEl');

        if (scoreEl) scoreEl.innerHTML = '0';
        if (modalEl) modalEl.style.display = 'none';
        if (pauseModalEl) pauseModalEl.style.display = 'none';
        if (hpBarEl) hpBarEl.style.width = '100%';
    }

    spawnEnemies() {
        if (this.spawnIntervalId) clearInterval(this.spawnIntervalId);
        this.spawnIntervalId = setInterval(() => {
            if (!this.isPaused) {
                this.enemies.push(Enemy.spawn(this.canvas, this.player));
            }
        }, 1000);
    }

    handleInput() {
        const speed = this.player.speedBoostTimer > 0 ? 8 : 5;
        this.player.velocity = { x: 0, y: 0 };

        // Keyboard Input
        if (this.keys['KeyW'] || this.keys['ArrowUp']) this.player.velocity.y -= speed;
        if (this.keys['KeyS'] || this.keys['ArrowDown']) this.player.velocity.y += speed;
        if (this.keys['KeyA'] || this.keys['ArrowLeft']) this.player.velocity.x -= speed;
        if (this.keys['KeyD'] || this.keys['ArrowRight']) this.player.velocity.x += speed;

        // Joystick Input
        if (this.joystick.active || (this.joystick.x !== 0 || this.joystick.y !== 0)) {
            this.player.velocity.x += this.joystick.x * speed;
            this.player.velocity.y += this.joystick.y * speed;
        }
    }

    spawnPowerUp(x: number, y: number) {
        if (Math.random() < 0.1) { // 10% chance
            const types: PowerUpType[] = ['Shield', 'DoubleShot', 'SpeedBoost'];
            const type = types[Math.floor(Math.random() * types.length)];
            this.powerUps.push(new PowerUp(x, y, type));
        }
    }

    activatePowerUp(type: PowerUpType) {
        const duration = 300; // 5 seconds at 60fps
        if (type === 'Shield') {
            this.player.shieldTimer = duration;
        } else if (type === 'DoubleShot') {
            this.player.doubleShotTimer = duration;
        } else if (type === 'SpeedBoost') {
            this.player.speedBoostTimer = duration;
        }
    }

    updatePowerUpUI() {
        const shieldContainer = document.getElementById('shieldContainer');
        const doubleContainer = document.getElementById('doubleContainer');
        const speedContainer = document.getElementById('speedContainer');

        const shieldBar = document.getElementById('shieldBar');
        const doubleBar = document.getElementById('doubleBar');
        const speedBar = document.getElementById('speedBar');

        if (shieldContainer) shieldContainer.style.display = this.player.shieldTimer > 0 ? 'flex' : 'none';
        if (doubleContainer) doubleContainer.style.display = this.player.doubleShotTimer > 0 ? 'flex' : 'none';
        if (speedContainer) speedContainer.style.display = this.player.speedBoostTimer > 0 ? 'flex' : 'none';

        const maxDuration = 300; // 5 seconds * 60 fps

        if (shieldBar) shieldBar.style.width = `${(this.player.shieldTimer / maxDuration) * 100}%`;
        if (doubleBar) doubleBar.style.width = `${(this.player.doubleShotTimer / maxDuration) * 100}%`;
        if (speedBar) speedBar.style.width = `${(this.player.speedBoostTimer / maxDuration) * 100}%`;
    }

    animate = () => {
        this.animationId = requestAnimationFrame(this.animate);

        if (this.isPaused) return;

        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.background.update();
        this.background.draw(this.ctx);

        if (!this.isGameOver) { // Only update game logic if not in game over state
            this.handleInput();
            this.player.update(this.canvas);

            // Update Power-up UI
            this.updatePowerUpUI();
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

        if (!this.isGameOver) { // Only update projectiles and enemies if not in game over state
            // PowerUps
            this.powerUps.forEach((powerUp, index) => {
                powerUp.update(this.canvas);
                powerUp.draw(this.ctx);

                const dist = Math.hypot(this.player.position.x - powerUp.position.x, this.player.position.y - powerUp.position.y);

                // Collect PowerUp
                if (dist - this.player.radius - powerUp.radius < 1) {
                    this.activatePowerUp(powerUp.type);
                    this.powerUps.splice(index, 1);
                    this.floatingTexts.push(new FloatingText(powerUp.position.x, powerUp.position.y, powerUp.type, powerUp.color));
                }
            });

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
                        // Momentum = Mass * Velocity. We'll use Radius as Mass proxy.
                        // Relative velocity:
                        const relVelX = this.player.velocity.x - enemy.velocity.x;
                        const relVelY = this.player.velocity.y - enemy.velocity.y;
                        const relSpeed = Math.hypot(relVelX, relVelY);

                        // Base damage + Momentum bonus
                        // If player is stationary, damage is based on enemy speed (~1) * enemy radius
                        // If player moves into enemy, speed is higher -> more damage.
                        const damage = (enemy.radius * 0.5) + (relSpeed * enemy.radius * 0.2);

                        this.player.hp -= damage;

                        // Update UI
                        const hpBarEl = document.getElementById('hpBarEl');
                        if (hpBarEl) {
                            const hpPercent = Math.max(0, (this.player.hp / this.player.maxHp) * 100);
                            hpBarEl.style.width = `${hpPercent}%`;
                        }

                        // Feedback: Knockback
                        // Push player away from enemy
                        const angle = Math.atan2(
                            this.player.position.y - enemy.position.y,
                            this.player.position.x - enemy.position.x
                        );

                        // Apply impulse to knockback vector
                        this.player.knockback.x = Math.cos(angle) * 15;
                        this.player.knockback.y = Math.sin(angle) * 15;

                        // Feedback: Invulnerability
                        this.player.isInvulnerable = true;
                        this.player.invulnerabilityTimer = 60; // 1 second (60 frames)

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
                            this.spawnPowerUp(enemy.position.x, enemy.position.y); // Chance to spawn powerup
                            setTimeout(() => {
                                this.enemies.splice(index, 1);
                                this.projectiles.splice(pIndex, 1);
                            }, 0);
                        }

                        const scoreEl = document.getElementById('scoreEl');
                        if (scoreEl) scoreEl.innerHTML = this.score.toString();
                    }
                });
            });
        }
    }

    gameOver() {
        this.gameRunning = false;
        this.isGameOver = true;
        clearInterval(this.spawnIntervalId);

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
            cancelAnimationFrame(this.animationId);
            const modalEl = document.getElementById('modalEl');
            const bigScoreEl = document.getElementById('bigScoreEl');
            if (modalEl) modalEl.style.display = 'flex';
            if (bigScoreEl) bigScoreEl.innerHTML = this.score.toString();
        }, 2000); // Run for 2 more seconds to show explosion
    }
}
