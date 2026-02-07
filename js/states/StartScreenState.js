import { CONFIG } from '../data/config.js';
import { SpriteSheet } from '../rendering/SpriteSheet.js';
import { WaterRenderer } from '../rendering/WaterRenderer.js';
import { audio } from '../utils/audio.js';

export class StartScreenState {
    constructor(game) {
        this.game = game;
        this.waterSheet = new SpriteSheet('Water+.png');
        this.waterRenderer = new WaterRenderer(this.waterSheet);
        this.time = 0;
        this.ready = false;
        this.roundMinutes = 3;

        this._onTap = this._onTap.bind(this);
    }

    enter() {
        this.time = 0;
        this.ready = false;
        // Delay readiness briefly to prevent accidental taps
        setTimeout(() => { this.ready = true; }, 500);
        this.game.canvas.addEventListener('pointerdown', this._onTap);
    }

    _screenToCanvas(e) {
        const rect = this.game.canvas.getBoundingClientRect();
        const scaleX = this.game.canvas.width / rect.width;
        const scaleY = this.game.canvas.height / rect.height;
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY,
        };
    }

    _onTap(e) {
        if (!this.ready) return;

        const pos = this._screenToCanvas(e);
        const cx = CONFIG.DESIGN_WIDTH / 2;
        const cy = CONFIG.DESIGN_HEIGHT / 2;

        // Timer spinner arrows (hit area around the arrow glyphs)
        const arrowCenterY = cy + 100;
        const arrowHH = 30;

        // Left arrow (decrease)
        if (pos.x >= cx - 150 && pos.x <= cx - 70 &&
            pos.y >= arrowCenterY - arrowHH && pos.y <= arrowCenterY + arrowHH) {
            if (this.roundMinutes > 1) this.roundMinutes--;
            return;
        }
        // Right arrow (increase)
        if (pos.x >= cx + 70 && pos.x <= cx + 150 &&
            pos.y >= arrowCenterY - arrowHH && pos.y <= arrowCenterY + arrowHH) {
            if (this.roundMinutes < 10) this.roundMinutes++;
            return;
        }

        // Mode selection buttons
        const buttonY = cy + 150;
        const buttonWidth = 200;
        const buttonHeight = 60;
        const buttonSpacing = 240;

        // Check if tap is on 1 Player button
        const btn1X = cx - buttonSpacing / 2 - buttonWidth / 2;
        if (pos.x >= btn1X && pos.x <= btn1X + buttonWidth &&
            pos.y >= buttonY && pos.y <= buttonY + buttonHeight) {
            this._startGame(1);
            return;
        }

        // Check if tap is on 2 Players button
        const btn2X = cx + buttonSpacing / 2 - buttonWidth / 2;
        if (pos.x >= btn2X && pos.x <= btn2X + buttonWidth &&
            pos.y >= buttonY && pos.y <= buttonY + buttonHeight) {
            this._startGame(2);
            return;
        }
    }

    _startGame(playerCount) {
        // Initialize audio on first user gesture (required for mobile)
        audio.init();
        audio.resume();
        const { PlayState } = this.game._stateClasses;
        this.game.changeState(new PlayState(this.game, playerCount, this.roundMinutes * 60));
    }

    update(dt) {
        this.time += dt;
        this.waterRenderer.update(dt);
    }

    render(ctx, alpha) {
        this.waterRenderer.render(ctx);

        const cx = CONFIG.DESIGN_WIDTH / 2;
        const cy = CONFIG.DESIGN_HEIGHT / 2;

        // Dark overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.fillRect(0, 0, CONFIG.DESIGN_WIDTH, CONFIG.DESIGN_HEIGHT);

        // Title
        ctx.save();
        ctx.textAlign = 'center';

        // Title shadow
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 80px monospace';
        ctx.fillText('HARPOON', cx + 3, cy - 100 + 3);
        ctx.font = 'bold 60px monospace';
        ctx.fillText('FISHING', cx + 3, cy - 35 + 3);

        // Title text
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 80px monospace';
        ctx.fillText('HARPOON', cx, cy - 100);
        ctx.fillStyle = '#7ec8e3';
        ctx.font = 'bold 60px monospace';
        ctx.fillText('FISHING', cx, cy - 35);

        // Subtitle
        ctx.fillStyle = '#cccccc';
        ctx.font = '28px monospace';
        ctx.fillText('Aim and spear sea creatures for points!', cx, cy + 20);

        // Timer spinner
        ctx.fillStyle = '#cccccc';
        ctx.font = '22px monospace';
        ctx.fillText('ROUND TIME', cx, cy + 70);

        ctx.font = 'bold 36px monospace';
        ctx.fillStyle = '#FFD700';
        ctx.fillText(`${this.roundMinutes}:00`, cx, cy + 105);

        // Spinner arrows
        ctx.font = 'bold 36px monospace';
        ctx.fillStyle = this.roundMinutes > 1 ? '#ffffff' : '#555555';
        ctx.fillText('\u25C0', cx - 110, cy + 105);
        ctx.fillStyle = this.roundMinutes < 10 ? '#ffffff' : '#555555';
        ctx.fillText('\u25B6', cx + 85, cy + 105);

        // Mode selection buttons
        const buttonY = cy + 150;
        const buttonWidth = 200;
        const buttonHeight = 60;
        const buttonSpacing = 240;

        // 1 Player button
        this._drawButton(ctx, cx - buttonSpacing / 2, buttonY, buttonWidth, buttonHeight, '1 PLAYER', '#3498db');

        // 2 Players button
        this._drawButton(ctx, cx + buttonSpacing / 2, buttonY, buttonWidth, buttonHeight, '2 PLAYERS', '#e74c3c');

        // Controls hint
        ctx.fillStyle = '#999999';
        ctx.font = '24px monospace';
        ctx.fillText('Touch & drag to aim, release to fire', cx, cy + 260);

        // 2 player hint
        ctx.fillStyle = '#777777';
        ctx.font = '20px monospace';
        ctx.fillText('2 Players: Top half vs Bottom half', cx, cy + 295);

        ctx.restore();
    }

    _drawButton(ctx, x, y, w, h, text, color) {
        const pulse = 0.9 + 0.1 * Math.sin(this.time * 4);

        ctx.save();
        ctx.translate(x, y + h / 2);
        ctx.scale(pulse, pulse);

        // Button background
        ctx.fillStyle = color;
        ctx.beginPath();
        const r = 10;
        const rx = -w / 2, ry = -h / 2;
        ctx.moveTo(rx + r, ry);
        ctx.lineTo(rx + w - r, ry);
        ctx.quadraticCurveTo(rx + w, ry, rx + w, ry + r);
        ctx.lineTo(rx + w, ry + h - r);
        ctx.quadraticCurveTo(rx + w, ry + h, rx + w - r, ry + h);
        ctx.lineTo(rx + r, ry + h);
        ctx.quadraticCurveTo(rx, ry + h, rx, ry + h - r);
        ctx.lineTo(rx, ry + r);
        ctx.quadraticCurveTo(rx, ry, rx + r, ry);
        ctx.closePath();
        ctx.fill();

        // Button border
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Button text
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 28px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(text, 0, 10);

        ctx.restore();
    }

    exit() {
        this.game.canvas.removeEventListener('pointerdown', this._onTap);
    }
}
