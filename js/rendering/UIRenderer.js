import { CONFIG } from '../data/config.js';

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
        const bounceOffset = this.harpoonBounce > 0 ? Math.sin(this.harpoonBounce * 25) * 5 : 0;
        ctx.save();
        ctx.translate(30, 45 + bounceOffset);
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
        ctx.translate(CONFIG.DESIGN_WIDTH - 30, 45);
        ctx.scale(scoreScale, scoreScale);
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
            this._renderShotTimer(ctx, shotTimer, CONFIG.DESIGN_WIDTH / 2, 80);
        }
    }

    _renderTwoPlayer(ctx, p1Harpoons, p1ShotTimer, p2Harpoons, p2ShotTimer) {
        const cx = CONFIG.DESIGN_WIDTH / 2;

        // === PLAYER 2 (TOP) ===
        // Player 2 label and stats at top
        ctx.save();
        ctx.font = 'bold 24px monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#e74c3c';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        ctx.strokeText('PLAYER 2', cx, 25);
        ctx.fillText('PLAYER 2', cx, 25);
        ctx.restore();

        // P2 Harpoon count (top-left)
        const p2Bounce = this.p2.harpoonBounce > 0 ? Math.sin(this.p2.harpoonBounce * 25) * 5 : 0;
        ctx.save();
        ctx.translate(30, 55 + p2Bounce);
        this._drawHarpoonIcon(ctx, '#e74c3c');
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
        ctx.translate(CONFIG.DESIGN_WIDTH - 30, 55);
        ctx.scale(p2Scale, p2Scale);
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
            this._renderShotTimer(ctx, p2ShotTimer, cx, 70, 200, '#e74c3c');
        }

        // === PLAYER 1 (BOTTOM) ===
        // Player 1 label and stats at bottom
        ctx.save();
        ctx.font = 'bold 24px monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#3498db';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        ctx.strokeText('PLAYER 1', cx, CONFIG.DESIGN_HEIGHT - 55);
        ctx.fillText('PLAYER 1', cx, CONFIG.DESIGN_HEIGHT - 55);
        ctx.restore();

        // P1 Harpoon count (bottom-left)
        const p1Bounce = this.p1.harpoonBounce > 0 ? Math.sin(this.p1.harpoonBounce * 25) * 5 : 0;
        ctx.save();
        ctx.translate(30, CONFIG.DESIGN_HEIGHT - 35 + p1Bounce);
        this._drawHarpoonIcon(ctx, '#3498db');
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
        ctx.translate(CONFIG.DESIGN_WIDTH - 30, CONFIG.DESIGN_HEIGHT - 35);
        ctx.scale(p1Scale, p1Scale);
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
            this._renderShotTimer(ctx, p1ShotTimer, cx, CONFIG.DESIGN_HEIGHT - 90, 200, '#3498db');
        }

    }

    _drawHarpoonIcon(ctx, tintColor = null) {
        const metal = tintColor || '#d4d4d4';
        const metalDark = '#9aa0a6';
        const wood = '#8B5E3C';
        const woodDark = '#6f452c';

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
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(0, -12);
        ctx.lineTo(0, 6);
        ctx.stroke();

        ctx.restore();
    }

    _renderShotTimer(ctx, shotTimer, centerX, y, barWidth = 400, fillColor = '#3498db') {
        const barHeight = 16;
        const barX = centerX - barWidth / 2;
        const fraction = Math.max(0, shotTimer / 10);
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
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.beginPath();
        const r = barHeight / 2;
        ctx.moveTo(barX + r, y);
        ctx.lineTo(barX + barWidth - r, y);
        ctx.quadraticCurveTo(barX + barWidth, y, barX + barWidth, y + r);
        ctx.quadraticCurveTo(barX + barWidth, y + barHeight, barX + barWidth - r, y + barHeight);
        ctx.lineTo(barX + r, y + barHeight);
        ctx.quadraticCurveTo(barX, y + barHeight, barX, y + r);
        ctx.quadraticCurveTo(barX, y, barX + r, y);
        ctx.closePath();
        ctx.fill();

        // Fill bar
        const fillWidth = barWidth * fraction;
        if (fillWidth > 0) {
            ctx.fillStyle = isWarning ? '#e74c3c' : fillColor;
            ctx.beginPath();
            const fw = Math.max(fillWidth, barHeight);
            ctx.moveTo(barX + r, y);
            ctx.lineTo(barX + fw - r, y);
            ctx.quadraticCurveTo(barX + fw, y, barX + fw, y + r);
            ctx.quadraticCurveTo(barX + fw, y + barHeight, barX + fw - r, y + barHeight);
            ctx.lineTo(barX + r, y + barHeight);
            ctx.quadraticCurveTo(barX, y + barHeight, barX, y + r);
            ctx.quadraticCurveTo(barX, y, barX + r, y);
            ctx.closePath();
            ctx.fill();
        }

        // Timer text
        ctx.font = 'bold 14px monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        const timerText = Math.ceil(shotTimer).toString();
        ctx.strokeText(timerText, centerX, y + barHeight / 2 + 5);
        ctx.fillText(timerText, centerX, y + barHeight / 2 + 5);

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
        ctx.font = 'bold 42px monospace';

        if (isCritical) {
            const pulse = Math.sin(Date.now() * 0.01) * 0.5 + 0.5;
            ctx.globalAlpha = 0.5 + pulse * 0.5;
            ctx.fillStyle = '#e74c3c';
        } else if (isWarning) {
            ctx.fillStyle = '#f39c12';
        } else {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        }

        const y = this.isTwoPlayer ? CONFIG.DESIGN_HEIGHT / 2 + 8 : 56;
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
            ctx.font = 'bold 28px monospace';
            const metrics = ctx.measureText(text);
            const padding = 12;
            const w = metrics.width + padding * 2;

            ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            ctx.beginPath();
            const rx = -w / 2, ry = -20, rw = w, rh = 40, r = 8;
            ctx.moveTo(rx + r, ry);
            ctx.lineTo(rx + rw - r, ry);
            ctx.quadraticCurveTo(rx + rw, ry, rx + rw, ry + r);
            ctx.lineTo(rx + rw, ry + rh - r);
            ctx.quadraticCurveTo(rx + rw, ry + rh, rx + rw - r, ry + rh);
            ctx.lineTo(rx + r, ry + rh);
            ctx.quadraticCurveTo(rx, ry + rh, rx, ry + rh - r);
            ctx.lineTo(rx, ry + r);
            ctx.quadraticCurveTo(rx, ry, rx + r, ry);
            ctx.closePath();
            ctx.fill();

            // Text
            ctx.textAlign = 'center';
            ctx.fillStyle = CONFIG.RARITY_COLORS[toast.rarity] || '#ffffff';
            ctx.fillText(text, 0, 8);

            // Bonus harpoons indicator
            if (toast.bonusHarpoons > 0) {
                ctx.font = 'bold 22px monospace';
                ctx.fillStyle = '#2ECC71';
                ctx.fillText(`+${toast.bonusHarpoons} Harpoon${toast.bonusHarpoons > 1 ? 's' : ''}!`, 0, 38);
            }

            ctx.restore();
        }

        ctx.globalAlpha = 1;
    }
}
