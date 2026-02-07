import { CONFIG } from '../data/config.js';
import { CREATURE_TYPES } from '../data/creatureData.js';
import { Animator } from '../rendering/Animator.js';

export class SeaCreature {
    constructor(typeKey, x, y, vx, vy, spriteSheet) {
        const data = typeof typeKey === 'string' ? CREATURE_TYPES[typeKey] : typeKey;
        this.typeKey = typeof typeKey === 'string' ? typeKey : 'treasure';
        this.name = data.name;
        this.rarity = data.rarity;
        this.points = data.points;
        this.bonusHarpoons = data.bonusHarpoons;
        this.displaySize = data.displaySize;
        this.hitboxRadius = data.hitboxRadius;
        this.spriteSheet = spriteSheet;

        this.x = x;
        this.y = y;
        this.renderY = y;
        this.vx = vx;
        this.vy = vy;
        this.alive = true;

        this.waveAmplitude = data.waveAmplitude || 0;
        this.waveFrequency = data.waveFrequency || 0;
        this.wavePhase = Math.random() * Math.PI * 2;

        this.animator = new Animator(data.frames, 3);
    }

    update(dt) {
        if (!this.alive) return;

        this.x += this.vx * dt;
        this.y += this.vy * dt;

        if (this.waveAmplitude > 0) {
            this.wavePhase += this.waveFrequency * dt;
            this.renderY = this.y + Math.sin(this.wavePhase) * this.waveAmplitude;
        } else {
            this.renderY = this.y;
        }

        this.animator.update(dt);
    }

    isOffScreen() {
        const margin = CONFIG.CREATURE_DESPAWN_MARGIN + this.displaySize;
        return (
            this.x < -margin ||
            this.x > CONFIG.DESIGN_WIDTH + margin ||
            this.y < -margin ||
            this.y > CONFIG.DESIGN_HEIGHT + margin
        );
    }

    render(ctx) {
        if (!this.spriteSheet || !this.spriteSheet.loaded) return;

        const frame = this.animator.getCurrentFrame();
        const half = this.displaySize / 2;

        ctx.save();

        // Flip sprite to face movement direction
        if (this.vx < 0) {
            ctx.translate(this.x, this.renderY);
            ctx.scale(-1, 1);
            this.spriteSheet.drawFrame(
                ctx,
                frame.sx, frame.sy, frame.sw, frame.sh,
                -half, -half, this.displaySize, this.displaySize
            );
        } else {
            this.spriteSheet.drawFrame(
                ctx,
                frame.sx, frame.sy, frame.sw, frame.sh,
                this.x - half, this.renderY - half, this.displaySize, this.displaySize
            );
        }

        ctx.restore();
    }
}
