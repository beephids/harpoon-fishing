import { CONFIG } from '../data/config.js';
import { randomRange } from '../utils/math.js';

class CoralPiece {
    constructor() {
        this.reset(true);
    }

    reset(initialPlacement) {
        // Coral types: colors and shapes
        const types = [
            { color: '#c0392b', width: 18, height: 30 },  // red branching
            { color: '#e67e22', width: 14, height: 22 },  // orange fan
            { color: '#8e44ad', width: 20, height: 26 },  // purple bush
            { color: '#27ae60', width: 16, height: 35 },  // green kelp
            { color: '#2980b9', width: 12, height: 20 },  // blue small
            { color: '#f39c12', width: 22, height: 18 },  // yellow flat
        ];
        const t = types[Math.floor(Math.random() * types.length)];
        this.color = t.color;
        this.width = t.width;
        this.height = t.height;

        this.x = randomRange(0, CONFIG.DESIGN_WIDTH);
        if (initialPlacement) {
            this.y = randomRange(0, CONFIG.DESIGN_HEIGHT);
        } else {
            this.y = CONFIG.DESIGN_HEIGHT + 20;
        }
        this.vy = randomRange(-8, -3); // slowly drift upward
        this.swayPhase = Math.random() * Math.PI * 2;
        this.swaySpeed = randomRange(0.5, 1.5);
        this.swayAmount = randomRange(3, 8);
        this.alpha = randomRange(0.45, 0.7);
    }

    update(dt) {
        this.y += this.vy * dt;
        this.swayPhase += this.swaySpeed * dt;
        if (this.y < -40) {
            this.reset(false);
        }
    }

    render(ctx) {
        const swayX = Math.sin(this.swayPhase) * this.swayAmount;

        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.translate(this.x + swayX, this.y);

        // Coral stalk
        ctx.fillStyle = this.color;
        ctx.fillRect(-2, 0, 4, this.height);

        // Coral branches/head
        const branches = 2 + Math.floor(this.height / 12);
        for (let i = 0; i < branches; i++) {
            const by = this.height * (0.2 + 0.6 * i / branches);
            const bw = this.width * (0.4 + 0.6 * (1 - i / branches));
            ctx.fillRect(-bw / 2, -by, bw, 6);
        }

        // Top blob
        ctx.beginPath();
        ctx.arc(0, -this.height + 4, this.width / 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

export class WaterRenderer {
    constructor(spriteSheet) {
        this.sheet = spriteSheet;
        // Dark teal scale/diamond pattern tile from Water+.png
        this.tileSize = 32;
        this.tileSrcX = 0;
        this.tileSrcY = 64;

        // Sparse coral decorations
        this.corals = [];
        for (let i = 0; i < 12; i++) {
            this.corals.push(new CoralPiece());
        }
    }

    update(dt) {
        for (const coral of this.corals) {
            coral.update(dt);
        }
    }

    render(ctx) {
        if (!this.sheet.loaded) {
            ctx.fillStyle = '#1a6ea0';
            ctx.fillRect(0, 0, CONFIG.DESIGN_WIDTH, CONFIG.DESIGN_HEIGHT);
        } else {
            // Static tiled water - no scroll offset
            const drawSize = this.tileSize * 3;
            const cols = Math.ceil(CONFIG.DESIGN_WIDTH / drawSize) + 1;
            const rows = Math.ceil(CONFIG.DESIGN_HEIGHT / drawSize) + 1;

            for (let row = 0; row < rows; row++) {
                for (let col = 0; col < cols; col++) {
                    this.sheet.drawFrame(
                        ctx,
                        this.tileSrcX, this.tileSrcY, this.tileSize, this.tileSize,
                        col * drawSize, row * drawSize, drawSize, drawSize
                    );
                }
            }
        }

        // Dark overlay to deepen the water color
        ctx.fillStyle = 'rgba(10, 40, 80, 0.35)';
        ctx.fillRect(0, 0, CONFIG.DESIGN_WIDTH, CONFIG.DESIGN_HEIGHT);

        // Render coral decorations
        for (const coral of this.corals) {
            coral.render(ctx);
        }
    }
}
