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
    joystick: {
        active: boolean,
        x: number,
        y: number,
        originX: number,
        originY: number,
        touchId: number | null,
        startTime: number,
        isTap: boolean,
        locked: boolean,
        timeoutId: number | null
    } = {
            active: false,
            x: 0,
            y: 0,
            originX: 0,
            originY: 0,
            touchId: null,
            startTime: 0,
            isTap: false,
            locked: false,
            timeoutId: null
        };

    // Difficulty Scaling
    maxEnemies: number = 5; // Maximum enemies on screen at once
    difficultyLevel: number = 1; // Current difficulty level
    baseSpawnInterval: number = 1000; // Base spawn interval in ms

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d')!;
        this.canvas.width = innerWidth;
        this.canvas.height = innerHeight;

        // Mobile Detection
        this.isMobile = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
        if (this.isMobile) {
            const mobileControls = document.getElementById('mobileControls');
            const leftTouchZone = document.getElementById('leftTouchZone');
            if (mobileControls) mobileControls.style.display = 'flex';
            if (leftTouchZone) leftTouchZone.style.display = 'block';
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

        // Mobile Touch Handling
        if (this.isMobile) {
            const joystickContainer = document.getElementById('joystickContainer');
            const joystickKnob = document.getElementById('joystickKnob');
            const leftTouchZone = document.getElementById('leftTouchZone');

            // Fixed Joystick Logic
            if (joystickContainer && joystickKnob) {
                // Ensure joystick is visible
                joystickContainer.style.display = 'block';

                joystickContainer.addEventListener('touchstart', (e) => {
                    e.preventDefault();

                    if (!this.joystick.active) {
                        const touch = e.changedTouches[0];
                        this.joystick.active = true;
                        this.joystick.touchId = touch.identifier;
                        this.joystick.startTime = Date.now();
                        this.joystick.isTap = true; // Assume tap initially
                        this.joystick.locked = false; // Not locked yet

                        // Set origin to center of fixed joystick
                        const rect = joystickContainer.getBoundingClientRect();
                        this.joystick.originX = rect.left + rect.width / 2;
                        this.joystick.originY = rect.top + rect.height / 2;

                        // Visual feedback: Full opacity
                        joystickContainer.style.opacity = '1.0';

                        // Start delay timer (250ms)
                        if (this.joystick.timeoutId) clearTimeout(this.joystick.timeoutId);
                        this.joystick.timeoutId = window.setTimeout(() => {
                            this.joystick.locked = true;
                            this.joystick.isTap = false;
                            this.updateJoystick(touch.clientX, touch.clientY);
                        }, 72);
                    }
                }, { passive: false });

                // Also allow leftTouchZone to trigger joystick if it overlaps or is used for loose detection
                // For now, let's stick to the joystick container for strict control, 
                // OR we can make the leftTouchZone redirect to joystick logic if it's near the bottom-left.
                // User asked for "left bottom corner (50% width 50% height)".
                // Let's use the leftTouchZone to capture touches in that quadrant.

                if (leftTouchZone) {
                    leftTouchZone.addEventListener('touchstart', (e) => {
                        // Check if touch is in bottom-left quadrant
                        const touch = e.changedTouches[0];
                        const isBottomLeft = touch.clientX < window.innerWidth / 2 && touch.clientY > window.innerHeight / 2;

                        if (isBottomLeft && !this.joystick.active) {
                            e.preventDefault();
                            this.joystick.active = true;
                            this.joystick.touchId = touch.identifier;
                            this.joystick.startTime = Date.now();
                            this.joystick.isTap = true;
                            this.joystick.locked = false;

                            // Set origin to center of FIXED joystick (not touch point)
                            const rect = joystickContainer.getBoundingClientRect();
                            this.joystick.originX = rect.left + rect.width / 2;
                            this.joystick.originY = rect.top + rect.height / 2;

                            joystickContainer.style.opacity = '1.0';

                            // Start delay timer (250ms)
                            if (this.joystick.timeoutId) clearTimeout(this.joystick.timeoutId);
                            this.joystick.timeoutId = window.setTimeout(() => {
                                this.joystick.locked = true;
                                this.joystick.isTap = false;
                                this.updateJoystick(touch.clientX, touch.clientY);
                            }, 69);
                        }
                    }, { passive: false });
                }
            }

            // Global Touch Move (for Joystick)
            window.addEventListener('touchmove', (e) => {
                if (this.joystick.active) {
                    for (let i = 0; i < e.changedTouches.length; i++) {
                        const touch = e.changedTouches[i];
                        if (touch.identifier === this.joystick.touchId) {
                            e.preventDefault();

                            // Only move if locked (timer finished)
                            if (this.joystick.locked) {
                                this.updateJoystick(touch.clientX, touch.clientY);
                            } else {
                                // Optional: If moved significantly, maybe force lock?
                                // User said "if not locked move the joystick" in context of timeout finishing.
                                // But usually if you drag far, you want to move.
                                // Let's stick to strict timer as requested to avoid accidental drags during taps.
                            }
                            break;
                        }
                    }
                }
            }, { passive: false });

            // Global Touch End (for Joystick)
            window.addEventListener('touchend', (e) => {
                if (this.joystick.active) {
                    for (let i = 0; i < e.changedTouches.length; i++) {
                        const touch = e.changedTouches[i];
                        if (touch.identifier === this.joystick.touchId) {
                            // Clear timeout if it hasn't fired
                            if (this.joystick.timeoutId) {
                                clearTimeout(this.joystick.timeoutId);
                                this.joystick.timeoutId = null;
                            }

                            // Tap to Shoot Logic (If not locked)
                            if (!this.joystick.locked) {
                                // Fire shot!
                                const newProjectiles = this.player.shoot({ x: touch.clientX, y: touch.clientY }); // Shoot towards touch (or forward?)
                                // Actually, shooting towards the touch on the joystick might be weird if it's just a tap.
                                // Maybe shoot forward or towards the center of screen? 
                                // User said "click on that area... then fire". 
                                // Let's shoot towards the touch point relative to player, which is standard.
                                this.projectiles.push(...newProjectiles);
                            }

                            // Reset Joystick
                            this.joystick.active = false;
                            this.joystick.touchId = null;
                            this.joystick.x = 0;
                            this.joystick.y = 0;

                            if (joystickContainer) {
                                joystickContainer.style.opacity = '0.5'; // Dim opacity
                            }
                            if (joystickKnob) {
                                joystickKnob.style.transform = ``;
                            }
                            break;
                        }
                    }
                }
            });

            // Shooting (Right side or non-joystick touches)
            window.addEventListener('touchstart', (e) => {
                if (!this.gameRunning || this.isPaused) return;

                for (let i = 0; i < e.changedTouches.length; i++) {
                    const touch = e.changedTouches[i];

                    // Ignore if this is the joystick touch
                    if (touch.identifier === this.joystick.touchId) continue;

                    // Ignore if touching UI elements
                    const target = e.target as HTMLElement;
                    if (target.closest('#mobileControls') || target.closest('#pauseModalEl') || target.closest('#modalEl')) continue;

                    // Ignore if touching joystick container directly (handled above)
                    if (target.closest('#joystickContainer')) continue;

                    // Ignore if touching bottom-left zone (handled as joystick)
                    const isBottomLeft = touch.clientX < window.innerWidth / 2 && touch.clientY > window.innerHeight / 2;
                    if (isBottomLeft) continue;

                    const newProjectiles = this.player.shoot({ x: touch.clientX, y: touch.clientY });
                    this.projectiles.push(...newProjectiles);
                }
            });
        }

        const resumeBtn = document.getElementById('resumeBtn');
        if (resumeBtn) {
            resumeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.togglePause();
            });
            resumeBtn.addEventListener('touchstart', (e) => {
                e.stopPropagation();
                // Prevent default to avoid double-firing if click also fires
                e.preventDefault();
                this.togglePause();
            });
        }

        const restartBtn = document.getElementById('restartBtn');
        if (restartBtn) {
            restartBtn.addEventListener('click', () => {
                this.start();
            });
        }

        // Mobile Controls
        const pauseBtn = document.getElementById('pauseBtn');
        const fullscreenBtn = document.getElementById('fullscreenBtn');

        if (pauseBtn) {
            pauseBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent shooting
                this.togglePause();
            });
        }

        if (fullscreenBtn) {
            fullscreenBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent shooting
                this.toggleFullscreen();
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

    async toggleFullscreen() {
        if (!document.fullscreenElement) {
            try {
                await document.documentElement.requestFullscreen();
                // Lock orientation to landscape after entering fullscreen
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
                // Unlock orientation when exiting fullscreen
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

        // Reset difficulty
        this.difficultyLevel = 1;
        this.maxEnemies = 5;

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

        // Calculate spawn interval based on difficulty (gets faster as difficulty increases)
        const spawnInterval = Math.max(300, this.baseSpawnInterval / this.difficultyLevel);

        this.spawnIntervalId = setInterval(() => {
            if (!this.isPaused && this.enemies.length < this.maxEnemies) {
                this.enemies.push(Enemy.spawn(this.canvas, this.player, this.difficultyLevel));
            }
        }, spawnInterval);
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

    updateDifficulty() {
        // Increase difficulty every 2500 points (was 1000)
        const newDifficultyLevel = Math.floor(this.score / 2500) + 1;

        if (newDifficultyLevel !== this.difficultyLevel) {
            this.difficultyLevel = newDifficultyLevel;

            // Increase max enemies slower (cap at 12 instead of 15)
            // Increases by 1 per level instead of 2
            this.maxEnemies = Math.min(12, 5 + (this.difficultyLevel - 1));

            // Restart spawning with new difficulty settings
            this.spawnEnemies();
        }
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

    activatePowerUp(type: PowerUpType) {
        const duration = 300; // 5 seconds at 60fps
        if (type === 'Shield') {
            this.player.shieldTimer = duration;
        } else if (type === 'DoubleShot') {
            this.player.doubleShotTimer = duration;
        } else if (type === 'SpeedBoost') {
            this.player.speedBoostTimer = duration;
        } else if (type === 'HealthBoost') {
            // Restore 20 HP
            this.player.hp = Math.min(this.player.maxHp, this.player.hp + 20);
            // Update HP bar display
            const hpBarEl = document.getElementById('hpBarEl');
            if (hpBarEl) {
                const hpPercent = (this.player.hp / this.player.maxHp) * 100;
                hpBarEl.style.width = `${hpPercent}%`;
            }
        }
    }

    updatePowerUpUI() {
        const shieldContainer = document.getElementById('shieldContainer');
        const doubleContainer = document.getElementById('doubleContainer');
        const speedContainer = document.getElementById('speedContainer');

        const shieldBar = document.getElementById('shieldBar');
        const doubleBar = document.getElementById('doubleBar');
        const speedBar = document.getElementById('speedBar');

        if (shieldContainer) shieldContainer.style.display = this.player.shieldTimer > 0 ? 'block' : 'none';
        if (doubleContainer) doubleContainer.style.display = this.player.doubleShotTimer > 0 ? 'block' : 'none';
        if (speedContainer) speedContainer.style.display = this.player.speedBoostTimer > 0 ? 'block' : 'none';

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

                        // Update difficulty based on new score
                        this.updateDifficulty();
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
