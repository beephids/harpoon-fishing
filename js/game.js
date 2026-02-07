import { CONFIG } from './data/config.js';
import { StartScreenState } from './states/StartScreenState.js';
import { PlayState } from './states/PlayState.js';
import { ScoreScreenState } from './states/ScoreScreenState.js';

export class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        this.canvas.width = CONFIG.DESIGN_WIDTH;
        this.canvas.height = CONFIG.DESIGN_HEIGHT;
        this.ctx.imageSmoothingEnabled = false;

        // Register state classes so states can reference each other
        this._stateClasses = { StartScreenState, PlayState, ScoreScreenState };

        this.currentState = null;
        this.lastTime = 0;
        this.accumulator = 0;
        this.fixedDt = 1000 / 60;
        this.running = false;

        this._boundLoop = (timestamp) => this.loop(timestamp);

        // Pause when tab is hidden
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.running = false;
            } else {
                this.running = true;
                this.lastTime = performance.now();
                this.accumulator = 0;
                requestAnimationFrame(this._boundLoop);
            }
        });
    }

    start() {
        this.changeState(new StartScreenState(this));
        this.running = true;
        this.lastTime = performance.now();
        requestAnimationFrame(this._boundLoop);
    }

    loop(timestamp) {
        if (!this.running) return;

        const frameTime = Math.min(timestamp - this.lastTime, 50);
        this.lastTime = timestamp;
        this.accumulator += frameTime;

        while (this.accumulator >= this.fixedDt) {
            if (this.currentState) {
                this.currentState.update(this.fixedDt / 1000);
            }
            this.accumulator -= this.fixedDt;
        }

        const alpha = this.accumulator / this.fixedDt;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.imageSmoothingEnabled = false;

        if (this.currentState) {
            this.currentState.render(this.ctx, alpha);
        }

        requestAnimationFrame(this._boundLoop);
    }

    changeState(newState) {
        if (this.currentState && this.currentState.exit) {
            this.currentState.exit();
        }
        this.currentState = newState;
        if (this.currentState && this.currentState.enter) {
            this.currentState.enter();
        }
    }
}
