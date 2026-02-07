import { CONFIG } from '../data/config.js';
import { SpriteSheet } from '../rendering/SpriteSheet.js';
import { WaterRenderer } from '../rendering/WaterRenderer.js';
import { CREATURE_TYPES } from '../data/creatureData.js';

export class ScoreScreenState {
    constructor(game, summary1, creatureSheet, summary2 = null, winner = null) {
        this.game = game;
        this.summary1 = summary1;
        this.summary2 = summary2;
        this.winner = winner;
        this.isTwoPlayer = summary2 !== null;
        this.creatureSheet = creatureSheet;

        this.waterSheet = new SpriteSheet('Water+.png');
        this.waterRenderer = new WaterRenderer(this.waterSheet);

        this.time = 0;
        this.ready = false;
        this.displayScore1 = 0;
        this.displayScore2 = 0;

        this._onTap = this._onTap.bind(this);
    }

    enter() {
        this.time = 0;
        this.ready = false;
        this.displayScore1 = 0;
        this.displayScore2 = 0;
        setTimeout(() => { this.ready = true; }, 1500);
        this.game.canvas.addEventListener('pointerdown', this._onTap);
    }

    _onTap() {
        if (!this.ready) return;
        const { StartScreenState } = this.game._stateClasses;
        this.game.changeState(new StartScreenState(this.game));
    }

    update(dt) {
        this.time += dt;
        this.waterRenderer.update(dt);

        // Animate score counting up
        if (this.displayScore1 < this.summary1.score) {
            this.displayScore1 += Math.ceil((this.summary1.score - this.displayScore1) * 3 * dt);
            if (this.displayScore1 > this.summary1.score) this.displayScore1 = this.summary1.score;
        }

        if (this.isTwoPlayer && this.displayScore2 < this.summary2.score) {
            this.displayScore2 += Math.ceil((this.summary2.score - this.displayScore2) * 3 * dt);
            if (this.displayScore2 > this.summary2.score) this.displayScore2 = this.summary2.score;
        }
    }

    render(ctx, alpha) {
        this.waterRenderer.render(ctx);

        // Dark overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(0, 0, CONFIG.DESIGN_WIDTH, CONFIG.DESIGN_HEIGHT);

        if (this.isTwoPlayer) {
            this._renderTwoPlayer(ctx);
        } else {
            this._renderSinglePlayer(ctx);
        }
    }

    _renderSinglePlayer(ctx) {
        const cx = CONFIG.DESIGN_WIDTH / 2;

        ctx.save();
        ctx.textAlign = 'center';

        // Header
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 56px monospace';
        ctx.fillText('CATCH OF THE DAY', cx, 90);

        // Score
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 72px monospace';
        ctx.fillText(`${this.displayScore1}`, cx, 180);
        ctx.font = '28px monospace';
        ctx.fillStyle = '#cccccc';
        ctx.fillText('POINTS', cx, 215);

        // Stats
        this._renderStats(ctx, this.summary1, cx - 250, 270);

        // Caught creatures gallery
        this._renderGallery(ctx, this.summary1, cx, 455);

        // Play again prompt
        if (this.ready) {
            const pulseAlpha = 0.5 + 0.5 * Math.sin(this.time * 3);
            ctx.globalAlpha = pulseAlpha;
            ctx.textAlign = 'center';
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 36px monospace';
            ctx.fillText('TAP TO CONTINUE', cx, CONFIG.DESIGN_HEIGHT - 80);
            ctx.globalAlpha = 1;
        }

        ctx.restore();
    }

    _renderTwoPlayer(ctx) {
        const cx = CONFIG.DESIGN_WIDTH / 2;

        ctx.save();
        ctx.textAlign = 'center';

        // Winner announcement
        ctx.font = 'bold 48px monospace';
        if (this.winner === 0) {
            ctx.fillStyle = '#FFD700';
            ctx.fillText("IT'S A TIE!", cx, 70);
        } else if (this.winner === 1) {
            ctx.fillStyle = '#3498db';
            ctx.fillText('PLAYER 1 WINS!', cx, 70);
        } else {
            ctx.fillStyle = '#e74c3c';
            ctx.fillText('PLAYER 2 WINS!', cx, 70);
        }

        // Split screen - Player 1 (left), Player 2 (right)
        const leftX = CONFIG.DESIGN_WIDTH * 0.25;
        const rightX = CONFIG.DESIGN_WIDTH * 0.75;

        // Center divider
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx, 100);
        ctx.lineTo(cx, CONFIG.DESIGN_HEIGHT - 120);
        ctx.stroke();

        // Player 1 (left side)
        ctx.fillStyle = '#3498db';
        ctx.font = 'bold 36px monospace';
        ctx.fillText('PLAYER 1', leftX, 130);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 64px monospace';
        ctx.fillText(`${this.displayScore1}`, leftX, 200);
        ctx.font = '22px monospace';
        ctx.fillStyle = '#cccccc';
        ctx.fillText('POINTS', leftX, 230);

        // P1 mini stats
        ctx.font = '20px monospace';
        ctx.textAlign = 'left';
        const p1StatsX = leftX - 150;
        ctx.fillStyle = '#ffffff';
        ctx.fillText(`Catches: ${this.summary1.totalCatches}`, p1StatsX, 280);
        ctx.fillText(`Accuracy: ${this.summary1.accuracy}%`, p1StatsX, 310);
        if (this.summary1.bestCatch) {
            ctx.fillStyle = CONFIG.RARITY_COLORS[this.summary1.bestCatch.rarity];
            ctx.fillText(`Best: ${this.summary1.bestCatch.name}`, p1StatsX, 340);
        }

        // P1 mini gallery
        this._renderMiniGallery(ctx, this.summary1, leftX, 400);

        // Player 2 (right side)
        ctx.textAlign = 'center';
        ctx.fillStyle = '#e74c3c';
        ctx.font = 'bold 36px monospace';
        ctx.fillText('PLAYER 2', rightX, 130);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 64px monospace';
        ctx.fillText(`${this.displayScore2}`, rightX, 200);
        ctx.font = '22px monospace';
        ctx.fillStyle = '#cccccc';
        ctx.fillText('POINTS', rightX, 230);

        // P2 mini stats
        ctx.font = '20px monospace';
        ctx.textAlign = 'left';
        const p2StatsX = rightX - 150;
        ctx.fillStyle = '#ffffff';
        ctx.fillText(`Catches: ${this.summary2.totalCatches}`, p2StatsX, 280);
        ctx.fillText(`Accuracy: ${this.summary2.accuracy}%`, p2StatsX, 310);
        if (this.summary2.bestCatch) {
            ctx.fillStyle = CONFIG.RARITY_COLORS[this.summary2.bestCatch.rarity];
            ctx.fillText(`Best: ${this.summary2.bestCatch.name}`, p2StatsX, 340);
        }

        // P2 mini gallery
        this._renderMiniGallery(ctx, this.summary2, rightX, 400);

        // Play again prompt
        if (this.ready) {
            const pulseAlpha = 0.5 + 0.5 * Math.sin(this.time * 3);
            ctx.globalAlpha = pulseAlpha;
            ctx.textAlign = 'center';
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 36px monospace';
            ctx.fillText('TAP TO CONTINUE', cx, CONFIG.DESIGN_HEIGHT - 60);
            ctx.globalAlpha = 1;
        }

        ctx.restore();
    }

    _renderStats(ctx, summary, statsX, statsY) {
        ctx.font = '28px monospace';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'left';

        ctx.fillText(`Creatures Caught:`, statsX, statsY);
        ctx.fillStyle = '#2ECC71';
        ctx.fillText(`${summary.totalCatches}`, statsX + 380, statsY);

        ctx.fillStyle = '#ffffff';
        ctx.fillText(`Harpoons Fired:`, statsX, statsY + 40);
        ctx.fillStyle = '#3498DB';
        ctx.fillText(`${summary.harpoonsFired}`, statsX + 380, statsY + 40);

        ctx.fillStyle = '#ffffff';
        ctx.fillText(`Accuracy:`, statsX, statsY + 80);
        ctx.fillStyle = summary.accuracy >= 50 ? '#2ECC71' : '#E74C3C';
        ctx.fillText(`${summary.accuracy}%`, statsX + 380, statsY + 80);

        if (summary.bestCatch) {
            ctx.fillStyle = '#ffffff';
            ctx.fillText(`Best Catch:`, statsX, statsY + 120);
            ctx.fillStyle = CONFIG.RARITY_COLORS[summary.bestCatch.rarity];
            ctx.fillText(`${summary.bestCatch.name} (${summary.bestCatch.points}pts)`, statsX + 380, statsY + 120);
        }
    }

    _renderGallery(ctx, summary, cx, galleryY) {
        if (summary.catchesByType.length === 0) return;

        ctx.textAlign = 'center';
        ctx.fillStyle = '#cccccc';
        ctx.font = '22px monospace';
        ctx.fillText('- Catches -', cx, galleryY - 25);

        const itemWidth = 120;
        const totalWidth = Math.min(summary.catchesByType.length, 8) * itemWidth;
        let startX = cx - totalWidth / 2 + itemWidth / 2;

        for (let i = 0; i < Math.min(summary.catchesByType.length, 8); i++) {
            const item = summary.catchesByType[i];
            const ix = startX + i * itemWidth;

            // Draw creature sprite
            if (this.creatureSheet && this.creatureSheet.loaded) {
                const data = CREATURE_TYPES[item.typeKey];
                if (data) {
                    const frame = data.frames[0];
                    this.creatureSheet.drawFrame(
                        ctx,
                        frame.sx, frame.sy, frame.sw, frame.sh,
                        ix - 32, galleryY, 64, 64
                    );
                }
            }

            // Count
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 22px monospace';
            ctx.fillText(`x${item.count}`, ix, galleryY + 80);

            // Rarity label
            ctx.fillStyle = CONFIG.RARITY_COLORS[item.rarity];
            ctx.font = '16px monospace';
            ctx.fillText(item.rarity, ix, galleryY + 100);
        }
    }

    _renderMiniGallery(ctx, summary, cx, galleryY) {
        if (summary.catchesByType.length === 0) return;

        ctx.textAlign = 'center';

        const itemWidth = 70;
        const maxItems = 5;
        const totalWidth = Math.min(summary.catchesByType.length, maxItems) * itemWidth;
        let startX = cx - totalWidth / 2 + itemWidth / 2;

        for (let i = 0; i < Math.min(summary.catchesByType.length, maxItems); i++) {
            const item = summary.catchesByType[i];
            const ix = startX + i * itemWidth;

            // Draw creature sprite (smaller)
            if (this.creatureSheet && this.creatureSheet.loaded) {
                const data = CREATURE_TYPES[item.typeKey];
                if (data) {
                    const frame = data.frames[0];
                    this.creatureSheet.drawFrame(
                        ctx,
                        frame.sx, frame.sy, frame.sw, frame.sh,
                        ix - 24, galleryY, 48, 48
                    );
                }
            }

            // Count
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 18px monospace';
            ctx.fillText(`x${item.count}`, ix, galleryY + 60);
        }

        // Show "+N more" if there are more catches
        if (summary.catchesByType.length > maxItems) {
            ctx.fillStyle = '#999999';
            ctx.font = '16px monospace';
            ctx.fillText(`+${summary.catchesByType.length - maxItems} more`, cx, galleryY + 85);
        }
    }

    exit() {
        this.game.canvas.removeEventListener('pointerdown', this._onTap);
    }
}
