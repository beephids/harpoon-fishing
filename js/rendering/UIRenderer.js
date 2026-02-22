import { CONFIG } from '../data/config.js';
import { roundedRect } from '../utils/math.js';

class CatchToast {
    constructor(name, rarity, points, bonusHarpoons, x, y, playerIndex = 0) {
        this.name = name;
        this.rarity = rarity;
        this.points = points;
        this.bonusHarpoons = bonusHarpoons;
        this.x = x;
        this.y = y;
        this.playerIndex = playerIndex;
        this.life = 2.0;
        this.maxLife = 2.0;
    }

    update(dt) {
        this.life -= dt;
        this.y -= 30 * dt;
    }

    get alive() {
        return this.life > 0;
    }

    get alpha() {
        if (this.life > 1.5) return (this.maxLife - this.life) / 0.5; // fade in
        if (this.life < 0.5) return this.life / 0.5; // fade out
        return 1;
    }
}

export class UIRenderer {
    constructor(isTwoPlayer = false) {
        this.isTwoPlayer = isTwoPlayer;
        this.toasts = [];

        // Per-player animation states
        this.p1 = { harpoonBounce: 0, scorePop: 0, displayScore: 0 };
        this.p2 = { harpoonBounce: 0, scorePop: 0, displayScore: 0 };

        // Legacy single-player properties
        this.harpoonBounce = 0;
        this.scorePop = 0;
        this.displayScore = 0;
    }

    reset() {
        this.toasts = [];
        this.p1 = { harpoonBounce: 0, scorePop: 0, displayScore: 0 };
        this.p2 = { harpoonBounce: 0, scorePop: 0, displayScore: 0 };
        this.harpoonBounce = 0;
        this.scorePop = 0;
        this.displayScore = 0;
    }

    addCatchToast(name, rarity, points, bonusHarpoons, x, y, playerIndex = 0) {
        this.toasts.push(new CatchToast(name, rarity, points, bonusHarpoons, x, y, playerIndex));
        if (this.isTwoPlayer) {
            const player = playerIndex === 0 ? this.p1 : this.p2;
            player.scorePop = 0.3;
        } else {
            this.scorePop = 0.3;
        }
    }

    addHarpoonBounce(playerIndex = 0) {
        if (this.isTwoPlayer) {
            const player = playerIndex === 0 ? this.p1 : this.p2;
            player.harpoonBounce = 0.4;
        } else {
            this.harpoonBounce = 0.4;
        }
    }

    update(dt, targetScore1, targetScore2 = null) {
        // Update single player or player 1
        if (this.isTwoPlayer) {
            this._updatePlayerAnim(this.p1, dt, targetScore1);
            this._updatePlayerAnim(this.p2, dt, targetScore2);
        } else {
            // Legacy single-player update
            const delta = targetScore1 - this.displayScore;
            if (delta !== 0) {
                const step = Math.ceil(Math.abs(delta) * 8 * dt);
                this.displayScore += Math.sign(delta) * step;
                if ((delta > 0 && this.displayScore > targetScore1) ||
                    (delta < 0 && this.displayScore < targetScore1)) {
                    this.displayScore = targetScore1;
                }
            }
            if (this.harpoonBounce > 0) this.harpoonBounce -= dt;
            if (this.scorePop > 0) this.scorePop -= dt;
        }

        // Update toasts
        for (let i = this.toasts.length - 1; i >= 0; i--) {
            this.toasts[i].update(dt);
            if (!this.toasts[i].alive) {
                this.toasts.splice(i, 1);
            }
        }
    }

    _updatePlayerAnim(player, dt, targetScore) {
        const delta = targetScore - player.displayScore;
        if (delta !== 0) {
            const step = Math.ceil(Math.abs(delta) * 8 * dt);
            player.displayScore += Math.sign(delta) * step;
            if ((delta > 0 && player.displayScore > targetScore) ||
                (delta < 0 && player.displayScore < targetScore)) {
                player.displayScore = targetScore;
            }
        }
        if (player.harpoonBounce > 0) player.harpoonBounce -= dt;
        if (player.scorePop > 0) player.scorePop -= dt;
    }

    render(ctx, p1Harpoons, p1ShotTimer, p2Harpoons = null, p2ShotTimer = null, roundTimer = null) {
        if (this.isTwoPlayer) {
            this._renderTwoPlayer(ctx, p1Harpoons, p1ShotTimer, p2Harpoons, p2ShotTimer);
        } else {
            this._renderSinglePlayer(ctx, p1Harpoons, p1ShotTimer);
        }

        // Round timer
        if (roundTimer !== null) {
            this._renderRoundTimer(ctx, roundTimer);
        }

        // Catch toasts (shared)
        this._renderToasts(ctx);
    }

    _renderSinglePlayer(ctx, harpoonsRemaining, shotTimer) {
        // Harpoon count (top-left)
        const bounceOffset = this.harpoonBounce > 0 ? Math.sin(this.harpoonBounce * 25) * 8 : 0;
        ctx.save();
        ctx.translate(40, 55 + bounceOffset);
        ctx.scale(1.5, 1.5);
        this._drawHarpoonIcon(ctx);
        ctx.font = 'bold 36px monospace';
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 4;
        ctx.textAlign = 'left';
        ctx.strokeText(`x ${harpoonsRemaining}`, 20, 10);
        ctx.fillText(`x ${harpoonsRemaining}`, 20, 10);
        ctx.restore();

        // Score (top-right)
        const scoreScale = this.scorePop > 0 ? 1 + this.scorePop * 0.3 : 1;
        ctx.save();
        ctx.translate(CONFIG.DESIGN_WIDTH - 40, 55);
        ctx.scale(scoreScale * 1.5, scoreScale * 1.5);
        ctx.font = 'bold 36px monospace';
        ctx.textAlign = 'right';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 4;
        ctx.strokeText(`${this.displayScore}`, 0, 10);
        ctx.fillStyle = '#FFD700';
        ctx.fillText(`${this.displayScore}`, 0, 10);
        ctx.restore();

        // Shot timer bar (top center)
        if (shotTimer >= 0) {
            this._renderShotTimer(ctx, shotTimer, CONFIG.DESIGN_WIDTH / 2, 100, 600);
        }
    }

    _renderTwoPlayer(ctx, p1Harpoons, p1ShotTimer, p2Harpoons, p2ShotTimer) {
        const cx = CONFIG.DESIGN_WIDTH / 2;

        // === PLAYER 2 (TOP) ===
        // Player 2 label and stats at top
        ctx.save();
        ctx.font = 'bold 36px monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#e74c3c';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 4;
        ctx.strokeText('PLAYER 2', cx, 30);
        ctx.fillText('PLAYER 2', cx, 30);
        ctx.restore();

        const p2TimerExpired = p2ShotTimer === 0;
        const p1TimerExpired = p1ShotTimer === 0;

        // P2 Harpoon count (top-left)
        const p2Bounce = this.p2.harpoonBounce > 0 ? Math.sin(this.p2.harpoonBounce * 25) * 8 : 0;
        ctx.save();
        ctx.translate(40, 60 + p2Bounce);
        ctx.scale(1.5, 1.5);
        this._drawHarpoonIcon(ctx, '#e74c3c', p2TimerExpired);
        ctx.font = 'bold 28px monospace';
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        ctx.textAlign = 'left';
        ctx.strokeText(`x ${p2Harpoons}`, 18, 8);
        ctx.fillText(`x ${p2Harpoons}`, 18, 8);
        ctx.restore();

        // P2 Score (top-right)
        const p2Scale = this.p2.scorePop > 0 ? 1 + this.p2.scorePop * 0.3 : 1;
        ctx.save();
        ctx.translate(CONFIG.DESIGN_WIDTH - 40, 90);
        ctx.scale(p2Scale * 1.5, p2Scale * 1.5);
        ctx.font = 'bold 32px monospace';
        ctx.textAlign = 'right';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        ctx.strokeText(`${Math.floor(this.p2.displayScore)}`, 0, 8);
        ctx.fillStyle = '#e74c3c';
        ctx.fillText(`${Math.floor(this.p2.displayScore)}`, 0, 8);
        ctx.restore();

        // P2 Shot timer (smaller, near top)
        if (p2ShotTimer >= 0) {
            this._renderShotTimer(ctx, p2ShotTimer, 160, 460, 300, '#e74c3c');
        }

        // === PLAYER 1 (BOTTOM) ===
        // Player 1 label and stats at bottom
        ctx.save();
        ctx.font = 'bold 36px monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#3498db';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 4;
        ctx.strokeText('PLAYER 1', cx, CONFIG.DESIGN_HEIGHT - 10);
        ctx.fillText('PLAYER 1', cx, CONFIG.DESIGN_HEIGHT - 10);
        ctx.restore();

        // P1 Harpoon count (bottom-left)
        const p1Bounce = this.p1.harpoonBounce > 0 ? Math.sin(this.p1.harpoonBounce * 25) * 8 : 0;
        ctx.save();
        ctx.translate(40, CONFIG.DESIGN_HEIGHT - 80 + p1Bounce);
        ctx.scale(1.5, 1.5);
        this._drawHarpoonIcon(ctx, '#3498db', p1TimerExpired);
        ctx.font = 'bold 28px monospace';
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        ctx.textAlign = 'left';
        ctx.strokeText(`x ${p1Harpoons}`, 18, 8);
        ctx.fillText(`x ${p1Harpoons}`, 18, 8);
        ctx.restore();

        // P1 Score (bottom-right)
        const p1Scale = this.p1.scorePop > 0 ? 1 + this.p1.scorePop * 0.3 : 1;
        ctx.save();
        ctx.translate(CONFIG.DESIGN_WIDTH - 40, CONFIG.DESIGN_HEIGHT - 120);
        ctx.scale(p1Scale * 1.5, p1Scale * 1.5);
        ctx.font = 'bold 32px monospace';
        ctx.textAlign = 'right';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        ctx.strokeText(`${Math.floor(this.p1.displayScore)}`, 0, 8);
        ctx.fillStyle = '#3498db';
        ctx.fillText(`${Math.floor(this.p1.displayScore)}`, 0, 8);
        ctx.restore();

        // P1 Shot timer (smaller, near bottom)
        if (p1ShotTimer >= 0) {
            this._renderShotTimer(ctx, p1ShotTimer, 160, CONFIG.DESIGN_HEIGHT - 480, 300, '#3498db');
        }

    }

    _drawHarpoonIcon(ctx, tintColor = null, disabled = false) {
        const metal = disabled ? '#9aa0a6' : (tintColor || '#d4d4d4');
        const metalDark = disabled ? '#7d848a' : '#9aa0a6';
        const wood = disabled ? '#8a8f94' : '#8B5E3C';
        const woodDark = disabled ? '#6f7479' : '#6f452c';

        ctx.save();
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';

        // Metal tip
        ctx.fillStyle = metal;
        ctx.beginPath();
        ctx.moveTo(0, -14);
        ctx.lineTo(-6, 6);
        ctx.lineTo(6, 6);
        ctx.closePath();
        ctx.fill();

        // Side barbs
        ctx.fillStyle = metalDark;
        ctx.beginPath();
        ctx.moveTo(-6, 3);
        ctx.lineTo(-11, 6);
        ctx.lineTo(-6, 9);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(6, 3);
        ctx.lineTo(11, 6);
        ctx.lineTo(6, 9);
        ctx.closePath();
        ctx.fill();

        // Neck/ferrule
        ctx.fillStyle = metalDark;
        ctx.fillRect(-4, 6, 8, 4);

        // Shaft
        ctx.fillStyle = wood;
        ctx.fillRect(-3, 10, 6, 14);

        // Grip wraps
        ctx.fillStyle = woodDark;
        ctx.fillRect(-3, 13, 6, 2);
        ctx.fillRect(-3, 18, 6, 2);

        // Bottom cap
        ctx.fillStyle = woodDark;
        ctx.fillRect(-4, 24, 8, 3);

        // Highlight on tip
        ctx.strokeStyle = disabled ? 'rgba(255, 255, 255, 0.35)' : 'rgba(255, 255, 255, 0.6)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(0, -12);
        ctx.lineTo(0, 6);
        ctx.stroke();

        ctx.restore();
    }

    _renderShotTimer(ctx, shotTimer, centerX, y, barWidth = 600, fillColor = '#3498db', shotTimerMax = 10) {
        const barHeight = 32;
        const barX = centerX - barWidth / 2;
        const fraction = Math.max(0, shotTimer / shotTimerMax);
        const isWarning = shotTimer <= 3;

        ctx.save();

        // Pulsating alpha in warning zone
        let timerAlpha = 1;
        if (isWarning && shotTimer > 0) {
            const pulse = Math.sin(Date.now() * 0.012) * 0.5 + 0.5;
            timerAlpha = 0.5 + pulse * 0.5;
        }
        ctx.globalAlpha = timerAlpha;

        // Background bar
        const r = barHeight / 2;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        roundedRect(ctx, barX, y, barWidth, barHeight, r);
        ctx.fill();

        // Fill bar
        const fillWidth = barWidth * fraction;
        if (fillWidth > 0) {
            ctx.fillStyle = isWarning ? '#e74c3c' : fillColor;
            const fw = Math.max(fillWidth, barHeight);
            roundedRect(ctx, barX, y, fw, barHeight, r);
            ctx.fill();
        }

        // Timer text
        ctx.font = 'bold 28px system-ui';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        const timerText = Math.ceil(shotTimer).toString();
        ctx.strokeText(timerText, centerX, y + barHeight / 2 + 8);
        ctx.fillText(timerText, centerX, y + barHeight / 2 + 8);

        ctx.restore();
    }

    _renderRoundTimer(ctx, roundTimer) {
        const totalSeconds = Math.ceil(roundTimer);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        const display = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        const cx = this.isTwoPlayer ? CONFIG.DESIGN_WIDTH - 150 : CONFIG.DESIGN_WIDTH / 2;
        const isWarning = roundTimer <= 30;
        const isCritical = roundTimer <= 10;

        ctx.save();
        ctx.textAlign = 'center';
        ctx.font = 'bold 63px monospace';

        if (isCritical) {
            const pulse = Math.sin(Date.now() * 0.01) * 0.5 + 0.5;
            ctx.globalAlpha = 0.5 + pulse * 0.5;
            ctx.fillStyle = '#e74c3c';
        } else if (isWarning) {
            ctx.fillStyle = '#f39c12';
        } else {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        }

        const y = this.isTwoPlayer ? CONFIG.DESIGN_HEIGHT / 2 + 8 : 80;
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        ctx.strokeText(display, cx, y);
        ctx.fillText(display, cx, y);

        ctx.restore();
    }

    _renderToasts(ctx) {
        for (const toast of this.toasts) {
            ctx.save();
            ctx.globalAlpha = toast.alpha;
            ctx.translate(toast.x, toast.y);

            // Background pill
            const text = `${toast.name} +${toast.points}`;
            ctx.font = 'bold 42px monospace';
            const metrics = ctx.measureText(text);
            const padding = 18;
            const w = metrics.width + padding * 2;

            ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            roundedRect(ctx, -w / 2, -30, w, 60, 12);
            ctx.fill();

            // Text
            ctx.textAlign = 'center';
            ctx.fillStyle = CONFIG.RARITY_COLORS[toast.rarity] || '#ffffff';
            ctx.fillText(text, 0, 12);

            // Bonus harpoons indicator
            if (toast.bonusHarpoons > 0) {
                ctx.font = 'bold 33px monospace';
                ctx.fillStyle = '#2ECC71';
                ctx.fillText(`+${toast.bonusHarpoons} Harpoon${toast.bonusHarpoons > 1 ? 's' : ''}!`, 0, 52);
            }

            ctx.restore();
        }

        ctx.globalAlpha = 1;
    }
}
