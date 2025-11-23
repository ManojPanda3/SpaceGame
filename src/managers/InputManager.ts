import { Player } from '../Player';
import { Projectile } from '../Projectile';

export class InputManager {
    keys: { [key: string]: boolean } = {};
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

    private onTogglePause: () => void;
    private onToggleFullscreen: () => void;
    private onStart: () => void;
    private onShoot: (projectiles: Projectile[]) => void;
    private player: Player;
    private gameRunning: () => boolean;
    private isPaused: () => boolean;

    constructor(
        player: Player,
        gameRunning: () => boolean,
        isPaused: () => boolean,
        onTogglePause: () => void,
        onToggleFullscreen: () => void,
        onStart: () => void,
        onShoot: (projectiles: Projectile[]) => void
    ) {
        this.player = player;
        this.gameRunning = gameRunning;
        this.isPaused = isPaused;
        this.onTogglePause = onTogglePause;
        this.onToggleFullscreen = onToggleFullscreen;
        this.onStart = onStart;
        this.onShoot = onShoot;
        this.isMobile = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;

        this.initEventListeners();
    }

    private initEventListeners() {
        // Keyboard input
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            if (e.code === 'Escape') {
                this.onTogglePause();
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });

        // Mouse shooting
        window.addEventListener('click', (e) => {
            if (this.gameRunning() && !this.isPaused() && !this.isMobile) {
                const newProjectiles = this.player.shoot({ x: e.clientX, y: e.clientY });
                this.onShoot(newProjectiles);
            }
        });

        // Mobile touch handling
        if (this.isMobile) {
            this.initMobileControls();
        }

        // UI button handlers
        this.initUIButtonHandlers();
    }

    private initMobileControls() {
        const joystickContainer = document.getElementById('joystickContainer');
        const joystickKnob = document.getElementById('joystickKnob');
        const leftTouchZone = document.getElementById('leftTouchZone');

        // Fixed Joystick Logic
        if (joystickContainer && joystickKnob) {
            joystickContainer.style.display = 'block';

            joystickContainer.addEventListener('touchstart', (e) => {
                e.preventDefault();

                if (!this.joystick.active) {
                    const touch = e.changedTouches[0];
                    this.joystick.active = true;
                    this.joystick.touchId = touch.identifier;
                    this.joystick.startTime = Date.now();
                    this.joystick.isTap = true;
                    this.joystick.locked = false;

                    const rect = joystickContainer.getBoundingClientRect();
                    this.joystick.originX = rect.left + rect.width / 2;
                    this.joystick.originY = rect.top + rect.height / 2;

                    joystickContainer.style.opacity = '1.0';

                    if (this.joystick.timeoutId) clearTimeout(this.joystick.timeoutId);
                    this.joystick.timeoutId = window.setTimeout(() => {
                        this.joystick.locked = true;
                        this.joystick.isTap = false;
                        this.updateJoystick(touch.clientX, touch.clientY);
                    }, 72);
                }
            }, { passive: false });

            if (leftTouchZone) {
                leftTouchZone.addEventListener('touchstart', (e) => {
                    const touch = e.changedTouches[0];
                    const isBottomLeft = touch.clientX < window.innerWidth / 2 && touch.clientY > window.innerHeight / 2;

                    if (isBottomLeft && !this.joystick.active) {
                        e.preventDefault();
                        this.joystick.active = true;
                        this.joystick.touchId = touch.identifier;
                        this.joystick.startTime = Date.now();
                        this.joystick.isTap = true;
                        this.joystick.locked = false;

                        const rect = joystickContainer.getBoundingClientRect();
                        this.joystick.originX = rect.left + rect.width / 2;
                        this.joystick.originY = rect.top + rect.height / 2;

                        joystickContainer.style.opacity = '1.0';

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

                        if (this.joystick.locked) {
                            this.updateJoystick(touch.clientX, touch.clientY);
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
                        if (this.joystick.timeoutId) {
                            clearTimeout(this.joystick.timeoutId);
                            this.joystick.timeoutId = null;
                        }

                        // Tap to Shoot Logic (If not locked)
                        if (!this.joystick.locked) {
                            const newProjectiles = this.player.shoot({ x: touch.clientX, y: touch.clientY });
                            this.onShoot(newProjectiles);
                        }

                        // Reset Joystick
                        this.joystick.active = false;
                        this.joystick.touchId = null;
                        this.joystick.x = 0;
                        this.joystick.y = 0;

                        if (joystickContainer) {
                            joystickContainer.style.opacity = '0.5';
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
            if (!this.gameRunning() || this.isPaused()) return;

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
                this.onShoot(newProjectiles);
            }
        });
    }

    private initUIButtonHandlers() {
        const resumeBtn = document.getElementById('resumeBtn');
        if (resumeBtn) {
            resumeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.onTogglePause();
            });
            resumeBtn.addEventListener('touchstart', (e) => {
                e.stopPropagation();
                e.preventDefault();
                this.onTogglePause();
            });
        }

        const restartBtn = document.getElementById('restartBtn');
        if (restartBtn) {
            restartBtn.addEventListener('click', () => {
                this.onStart();
            });
        }

        const pauseBtn = document.getElementById('pauseBtn');
        const fullscreenBtn = document.getElementById('fullscreenBtn');

        if (pauseBtn) {
            pauseBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.onTogglePause();
            });
        }

        if (fullscreenBtn) {
            fullscreenBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.onToggleFullscreen();
            });
        }
    }

    private updateJoystick(clientX: number, clientY: number) {
        const joystickKnob = document.getElementById('joystickKnob');
        if (!joystickKnob) return;

        const dx = clientX - this.joystick.originX;
        const dy = clientY - this.joystick.originY;
        const distance = Math.min(Math.hypot(dx, dy), 40);
        const angle = Math.atan2(dy, dx);

        this.joystick.x = Math.cos(angle) * (distance / 40);
        this.joystick.y = Math.sin(angle) * (distance / 40);

        const knobX = Math.cos(angle) * distance;
        const knobY = Math.sin(angle) * distance;

        joystickKnob.style.transform = `translate(calc(-50% + ${knobX}px), calc(-50% + ${knobY}px))`;
    }

    getPlayerVelocity(baseSpeed: number): { x: number, y: number } {
        let velocity = { x: 0, y: 0 };

        // Keyboard Input
        if (this.keys['KeyW'] || this.keys['ArrowUp']) velocity.y -= baseSpeed;
        if (this.keys['KeyS'] || this.keys['ArrowDown']) velocity.y += baseSpeed;
        if (this.keys['KeyA'] || this.keys['ArrowLeft']) velocity.x -= baseSpeed;
        if (this.keys['KeyD'] || this.keys['ArrowRight']) velocity.x += baseSpeed;

        // Joystick Input
        if (this.joystick.active || (this.joystick.x !== 0 || this.joystick.y !== 0)) {
            velocity.x += this.joystick.x * baseSpeed;
            velocity.y += this.joystick.y * baseSpeed;
        }

        return velocity;
    }

    showMobileControls() {
        const mobileControls = document.getElementById('mobileControls');
        const leftTouchZone = document.getElementById('leftTouchZone');
        if (mobileControls) mobileControls.style.display = 'flex';
        if (leftTouchZone) leftTouchZone.style.display = 'block';
    }
}
