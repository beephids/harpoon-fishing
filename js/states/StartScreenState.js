import { CONFIG } from '../data/config.js';
import { SpriteSheet } from '../rendering/SpriteSheet.js';
import { WaterRenderer } from '../rendering/WaterRenderer.js';
import { Animator } from '../rendering/Animator.js';
import { CREATURE_TYPES } from '../data/creatureData.js';
import { audio } from '../utils/audio.js';

export class StartScreenState {
    constructor(game) {
        this.game = game;
        this.waterSheet = new SpriteSheet('Water+.png');
        this.waterRenderer = new WaterRenderer(this.waterSheet);
        this.creatureSheet = new SpriteSheet('DeepseaCreatures_spritesheet.png');
        this.treasureSheet = new SpriteSheet('Treasure+.png');
        this.sillySheet = new SpriteSheet('Silly_Placeholders.png');
        this.time = 0;
        this.ready = false;
        this.roundMinutes = 3;

        // Background creatures swimming calmly
        const bgTypes = ['giant_isopod', 'lanternfish', 'siphonophore', 'dumbo_octopus',
            'fangtooth', 'winged_comb_jelly', 'viperfish', 'blobfish'];
        this.bgCreatures = bgTypes.map(typeKey => {
            const data = CREATURE_TYPES[typeKey];
            const dir = Math.random() < 0.5 ? -1 : 1;
            return {
                x: Math.random() * CONFIG.DESIGN_WIDTH,
                y: 80 + Math.random() * (CONFIG.DESIGN_HEIGHT - 160),
                vx: (30 + Math.random() * 40) * dir,
                displaySize: data.displaySize * 0.8,
                animator: new Animator(data.frames, 2 + Math.random() * 2),
            };
        });

        this._onTap = this._onTap.bind(this);
        this._onKeyDown = this._onKeyDown.bind(this);
        this._onFullscreenChange = this._onFullscreenChange.bind(this);

        this.fullscreenBtnBounds = { x: 24, y: 24, size: 46 };
        this.fullscreenSupported = this._isFullscreenSupported();
        this.fullscreenActive = false;
        this.touchHitPadding = 20;

        this.objectiveBtnBounds = { x: 24, y: CONFIG.DESIGN_HEIGHT - 150, w: 200, h: 52 };
        this.objectiveOpen = false;

        this.creditsBtnBounds = { x: 24, y: CONFIG.DESIGN_HEIGHT - 90, w: 160, h: 52 };
        this.creditsOpen = false;
        this.creditsInfo = {
            author: 'beephids',
            year: '2026',
            license: 'GPL v3.0',
            description: 'A game inspired by my daughter\'s fascination with an arcade game one time at a birthday party. Made with the help of Claude Code. See assets attributions in the repository.',
        };
    }

    enter() {
        this.time = 0;
        this.ready = false;
        // Delay readiness briefly to prevent accidental taps
        setTimeout(() => { this.ready = true; }, 500);
        this.game.canvas.addEventListener('pointerdown', this._onTap);
        window.addEventListener('keydown', this._onKeyDown);
        document.addEventListener('fullscreenchange', this._onFullscreenChange);
        document.addEventListener('webkitfullscreenchange', this._onFullscreenChange);
        this.fullscreenActive = Boolean(this._getFullscreenElement());
    }

    _onKeyDown(e) {
        if (!this.ready || e.repeat) return;
        if (this.creditsOpen) {
            if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.creditsOpen = false;
            }
            return;
        }
        if (this.objectiveOpen) {
            if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.objectiveOpen = false;
            }
            return;
        }
        if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
            e.preventDefault();
            if (this.roundMinutes > 1) this.roundMinutes--;
        }
        if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
            e.preventDefault();
            if (this.roundMinutes < 10) this.roundMinutes++;
        }
        if (e.key === '1') this._startGame(1);
        if (e.key === '2') this._startGame(2);
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            this._startGame(1);
        }
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
        const hitPad = this._getHitPadding(e);
        const cx = CONFIG.DESIGN_WIDTH / 2;
        const cy = CONFIG.DESIGN_HEIGHT / 2;

        if (this.creditsOpen) {
            if (this._isCreditsCloseHit(pos, hitPad) || !this._isPointInRect(pos, this._getCreditsModalBounds())) {
                this.creditsOpen = false;
            }
            return;
        }

        if (this.objectiveOpen) {
            if (this._isObjectiveCloseHit(pos, hitPad) || !this._isPointInRect(pos, this._getObjectiveModalBounds())) {
                this.objectiveOpen = false;
            }
            return;
        }

        // Fullscreen button
        if (this.fullscreenSupported && this._isFullscreenHit(pos, hitPad)) {
            this._toggleFullscreen();
            return;
        }

        // Objective button
        if (this._isPointInRect(pos, this.objectiveBtnBounds, hitPad)) {
            this.objectiveOpen = true;
            return;
        }

        // Credits button
        if (this._isPointInRect(pos, this.creditsBtnBounds, hitPad)) {
            this.creditsOpen = true;
            return;
        }

        // Timer spinner arrows (hit area around the arrow glyphs)
        const ts = CONFIG.textScale;
        const arrowCenterY = cy + 100 * ts;
        const arrowHH = 30;

        // Left arrow (decrease)
        if (pos.x >= cx - 150 - hitPad && pos.x <= cx - 70 + hitPad &&
            pos.y >= arrowCenterY - arrowHH - hitPad && pos.y <= arrowCenterY + arrowHH + hitPad) {
            if (this.roundMinutes > 1) this.roundMinutes--;
            return;
        }
        // Right arrow (increase)
        if (pos.x >= cx + 70 - hitPad && pos.x <= cx + 150 + hitPad &&
            pos.y >= arrowCenterY - arrowHH - hitPad && pos.y <= arrowCenterY + arrowHH + hitPad) {
            if (this.roundMinutes < 10) this.roundMinutes++;
            return;
        }

        // Mode selection buttons
        const buttonY = cy + 150 * ts;
        const buttonWidth = 200;
        const buttonHeight = 60;
        const buttonSpacing = 240;

        // Check if tap is on 1 Player button
        const btn1X = cx - buttonSpacing / 2 - buttonWidth / 2;
        if (this._isPointInRect(pos, { x: btn1X, y: buttonY, w: buttonWidth, h: buttonHeight }, hitPad)) {
            this._startGame(1);
            return;
        }

        // Check if tap is on 2 Players button
        const btn2X = cx + buttonSpacing / 2 - buttonWidth / 2;
        if (this._isPointInRect(pos, { x: btn2X, y: buttonY, w: buttonWidth, h: buttonHeight }, hitPad)) {
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

        // Move background creatures, wrapping around edges
        for (const c of this.bgCreatures) {
            c.x += c.vx * dt;
            c.animator.update(dt);
            if (c.vx > 0 && c.x > CONFIG.DESIGN_WIDTH + c.displaySize) {
                c.x = -c.displaySize;
            } else if (c.vx < 0 && c.x < -c.displaySize) {
                c.x = CONFIG.DESIGN_WIDTH + c.displaySize;
            }
        }
    }

    render(ctx, alpha) {
        this.waterRenderer.render(ctx);

        // Background creatures (rendered before overlay so they appear underwater)
        if (this.creatureSheet.loaded) {
            ctx.save();
            ctx.globalAlpha = 0.4;
            for (const c of this.bgCreatures) {
                const frame = c.animator.getCurrentFrame();
                const half = c.displaySize / 2;
                ctx.save();
                if (c.vx < 0) {
                    ctx.translate(c.x, c.y);
                    ctx.scale(-1, 1);
                    this.creatureSheet.drawFrame(ctx, frame.sx, frame.sy, frame.sw, frame.sh, -half, -half, c.displaySize, c.displaySize);
                } else {
                    this.creatureSheet.drawFrame(ctx, frame.sx, frame.sy, frame.sw, frame.sh, c.x - half, c.y - half, c.displaySize, c.displaySize);
                }
                ctx.restore();
            }
            ctx.restore();
        }

        const cx = CONFIG.DESIGN_WIDTH / 2;
        const cy = CONFIG.DESIGN_HEIGHT / 2;

        // Dark overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.fillRect(0, 0, CONFIG.DESIGN_WIDTH, CONFIG.DESIGN_HEIGHT);

        if (this.fullscreenSupported) {
            this._drawFullscreenButton(ctx);
        }
        this._drawCreditsButton(ctx);
        this._drawObjectiveButton(ctx);

        // Title
        ctx.save();
        ctx.textAlign = 'center';

        // Title shadow
        ctx.fillStyle = '#dd0a0a';
        ctx.font = 'bold 80px monospace';
        ctx.fillText('ABYSSAL', cx + 3, cy - 100 + 3);
        ctx.font = 'bold 60px monospace';
        ctx.fillText('FISHING', cx + 3, cy - 35 + 3);

        // Title text
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 80px monospace';
        ctx.fillText('ABYSSAL', cx, cy - 100);
        ctx.fillStyle = '#7ec8e3';
        ctx.font = 'bold 60px monospace';
        ctx.fillText('FISHING', cx, cy - 35);

        // Subtitle
        ctx.fillStyle = '#cccccc';
        ctx.font = '28px monospace';
        ctx.fillText('Use your harpoon to collect deep sea creatures for points!', cx, cy + 20);

        // Timer spinner — scale vertical spacing for mobile readability
        const ts = CONFIG.textScale;

        ctx.fillStyle = '#cccccc';
        ctx.font = '22px monospace';
        ctx.fillText('ROUND DURATION', cx, cy + 70 * ts);

        ctx.font = 'bold 36px monospace';
        ctx.fillStyle = '#FFD700';
        ctx.fillText(`${this.roundMinutes}:00`, cx, cy + 105 * ts);

        // Spinner arrows
        ctx.font = 'bold 36px monospace';
        ctx.fillStyle = this.roundMinutes > 1 ? '#ffffff' : '#555555';
        ctx.fillText('\u25C0', cx - 110, cy + 105 * ts);
        ctx.fillStyle = this.roundMinutes < 10 ? '#ffffff' : '#555555';
        ctx.fillText('\u25B6', cx + 85, cy + 105 * ts);

        // Mode selection buttons
        const buttonY = cy + 150 * ts;
        const buttonWidth = 200;
        const buttonHeight = 60;
        const buttonSpacing = 240;

        // 1 Player button
        this._drawButton(ctx, cx - buttonSpacing / 2, buttonY, buttonWidth, buttonHeight, '1 PLAYER', '#3498db');

        // 2 Players button
        this._drawButton(ctx, cx + buttonSpacing / 2, buttonY, buttonWidth, buttonHeight, '2 PLAYERS', '#e74c3c');

        // Controls hint
        ctx.fillStyle = '#ebe7e7';
        ctx.font = 'bold 28px monospace';
        ctx.fillText('Touch to aim, or use Arrow Keys', cx, cy + 260 * ts);

        // 2 player hint
        ctx.fillStyle = '#d4d4d4';
        ctx.font = 'bold 24px monospace';
        ctx.fillText('2 Players: Top half vs Bottom half', cx, cy + 295 * ts);

        // Session high score
        if (this.game.sessionHighScore > 0) {
            ctx.fillStyle = '#FFD700';
            ctx.font = 'bold 28px monospace';
            ctx.fillText(`BEST SCORE: ${this.game.sessionHighScore}`, cx, cy + 345 * ts);
        }

        ctx.restore();

        if (this.creditsOpen) {
            ctx.save();
            ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            ctx.fillRect(0, 0, CONFIG.DESIGN_WIDTH, CONFIG.DESIGN_HEIGHT);
            ctx.restore();
            this._drawCreditsModal(ctx);
        }

        if (this.objectiveOpen) {
            ctx.save();
            ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            ctx.fillRect(0, 0, CONFIG.DESIGN_WIDTH, CONFIG.DESIGN_HEIGHT);
            ctx.restore();
            this._drawObjectiveModal(ctx);
        }
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

    _drawSmallButton(ctx, x, y, w, h, text, color, textColor = '#ffffff') {
        ctx.save();
        ctx.translate(x + w / 2, y + h / 2);

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
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Button text
        ctx.fillStyle = textColor;
        ctx.font = 'bold 22px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(text, 0, 8);

        ctx.restore();
    }

    _drawCreditsButton(ctx) {
        const b = this.creditsBtnBounds;
        this._drawSmallButton(ctx, b.x, b.y, b.w, b.h, 'CREDITS', '#2c3e50');
    }

    _drawObjectiveButton(ctx) {
        const b = this.objectiveBtnBounds;
        this._drawSmallButton(ctx, b.x, b.y, b.w, b.h, 'OBJECTIVE', '#2c3e50');
    }

    _isFullscreenSupported() {
        const el = this.game.canvas;
        return Boolean(
            document.fullscreenEnabled ||
            document.webkitFullscreenEnabled ||
            el.requestFullscreen ||
            el.webkitRequestFullscreen
        );
    }

    _getFullscreenElement() {
        return document.fullscreenElement || document.webkitFullscreenElement || null;
    }

    _getHitPadding(e) {
        if (!e || !e.pointerType || e.pointerType === 'mouse') {
            return 0;
        }
        return this.touchHitPadding;
    }

    _isFullscreenHit(pos, pad = 0) {
        const b = this.fullscreenBtnBounds;
        return pos.x >= b.x - pad && pos.x <= b.x + b.size + pad &&
            pos.y >= b.y - pad && pos.y <= b.y + b.size + pad;
    }

    _toggleFullscreen() {
        const el = this.game.canvas;
        const fsEl = this._getFullscreenElement();
        if (fsEl) {
            const exit = document.exitFullscreen || document.webkitExitFullscreen;
            if (exit) {
                const result = exit.call(document);
                if (result && typeof result.catch === 'function') {
                    result.catch(() => { });
                }
            }
            return;
        }

        const request = el.requestFullscreen || el.webkitRequestFullscreen;
        if (request) {
            const result = request.call(el);
            if (result && typeof result.catch === 'function') {
                result.catch(() => { });
            }
        }
    }

    _onFullscreenChange() {
        this.fullscreenActive = Boolean(this._getFullscreenElement());
    }

    _drawFullscreenButton(ctx) {
        const b = this.fullscreenBtnBounds;
        const size = b.size;
        const r = 10;
        const left = b.x;
        const top = b.y;
        const isActive = this.fullscreenActive;

        ctx.save();
        ctx.globalAlpha = 0.9;

        // Button background
        ctx.fillStyle = isActive ? 'rgba(241, 196, 15, 0.25)' : 'rgba(0, 0, 0, 0.45)';
        ctx.beginPath();
        ctx.moveTo(left + r, top);
        ctx.lineTo(left + size - r, top);
        ctx.quadraticCurveTo(left + size, top, left + size, top + r);
        ctx.lineTo(left + size, top + size - r);
        ctx.quadraticCurveTo(left + size, top + size, left + size - r, top + size);
        ctx.lineTo(left + r, top + size);
        ctx.quadraticCurveTo(left, top + size, left, top + size - r);
        ctx.lineTo(left, top + r);
        ctx.quadraticCurveTo(left, top, left + r, top);
        ctx.closePath();
        ctx.fill();

        // Button border
        ctx.strokeStyle = isActive ? 'rgba(241, 196, 15, 0.9)' : 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Fullscreen icon (four corners / inward corners when active)
        const inset = 12;
        const arm = 8;
        const x0 = left + inset;
        const x1 = left + size - inset;
        const y0 = top + inset;
        const y1 = top + size - inset;

        ctx.strokeStyle = isActive ? '#f1c40f' : '#ffffff';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.beginPath();
        if (isActive) {
            const inArm = 6;
            // Top-left (inward)
            ctx.moveTo(x0, y0 + inArm);
            ctx.lineTo(x0, y0);
            ctx.lineTo(x0 + inArm, y0);
            // Top-right (inward)
            ctx.moveTo(x1 - inArm, y0);
            ctx.lineTo(x1, y0);
            ctx.lineTo(x1, y0 + inArm);
            // Bottom-left (inward)
            ctx.moveTo(x0, y1 - inArm);
            ctx.lineTo(x0, y1);
            ctx.lineTo(x0 + inArm, y1);
            // Bottom-right (inward)
            ctx.moveTo(x1 - inArm, y1);
            ctx.lineTo(x1, y1);
            ctx.lineTo(x1, y1 - inArm);
        } else {
            // Top-left
            ctx.moveTo(x0 + arm, y0);
            ctx.lineTo(x0, y0);
            ctx.lineTo(x0, y0 + arm);
            // Top-right
            ctx.moveTo(x1 - arm, y0);
            ctx.lineTo(x1, y0);
            ctx.lineTo(x1, y0 + arm);
            // Bottom-left
            ctx.moveTo(x0, y1 - arm);
            ctx.lineTo(x0, y1);
            ctx.lineTo(x0 + arm, y1);
            // Bottom-right
            ctx.moveTo(x1 - arm, y1);
            ctx.lineTo(x1, y1);
            ctx.lineTo(x1, y1 - arm);
        }
        ctx.stroke();

        ctx.restore();
    }

    _getCreditsModalBounds() {
        const w = 900;
        const h = 520;
        return {
            x: (CONFIG.DESIGN_WIDTH - w) / 2,
            y: (CONFIG.DESIGN_HEIGHT - h) / 2,
            w,
            h,
        };
    }

    _getCreditsCloseBounds() {
        const modal = this._getCreditsModalBounds();
        const w = 180;
        const h = 52;
        return {
            x: modal.x + (modal.w - w) / 2,
            y: modal.y + modal.h - h - 26,
            w,
            h,
        };
    }

    _isCreditsCloseHit(pos, pad = 0) {
        return this._isPointInRect(pos, this._getCreditsCloseBounds(), pad);
    }

    _isPointInRect(pos, rect, padX = 0, padY = padX) {
        return pos.x >= rect.x - padX && pos.x <= rect.x + rect.w + padX &&
            pos.y >= rect.y - padY && pos.y <= rect.y + rect.h + padY;
    }

    _wrapText(ctx, text, maxWidth) {
        const words = text.split(/\s+/);
        const lines = [];
        let line = '';
        for (const word of words) {
            const testLine = line ? `${line} ${word}` : word;
            if (ctx.measureText(testLine).width > maxWidth && line) {
                lines.push(line);
                line = word;
            } else {
                line = testLine;
            }
        }
        if (line) lines.push(line);
        return lines;
    }

    _drawCreditsModal(ctx) {
        const modal = this._getCreditsModalBounds();
        const closeBtn = this._getCreditsCloseBounds();

        ctx.save();

        // Modal background
        ctx.fillStyle = 'rgba(10, 16, 22, 0.96)';
        ctx.beginPath();
        const r = 16;
        ctx.moveTo(modal.x + r, modal.y);
        ctx.lineTo(modal.x + modal.w - r, modal.y);
        ctx.quadraticCurveTo(modal.x + modal.w, modal.y, modal.x + modal.w, modal.y + r);
        ctx.lineTo(modal.x + modal.w, modal.y + modal.h - r);
        ctx.quadraticCurveTo(modal.x + modal.w, modal.y + modal.h, modal.x + modal.w - r, modal.y + modal.h);
        ctx.lineTo(modal.x + r, modal.y + modal.h);
        ctx.quadraticCurveTo(modal.x, modal.y + modal.h, modal.x, modal.y + modal.h - r);
        ctx.lineTo(modal.x, modal.y + r);
        ctx.quadraticCurveTo(modal.x, modal.y, modal.x + r, modal.y);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.lineWidth = 2;
        ctx.stroke();

        const padding = 48;
        let x = modal.x + padding;
        let y = modal.y + padding;
        const contentWidth = modal.w - padding * 2;

        // Title
        ctx.fillStyle = '#f1c40f';
        ctx.font = 'bold 44px monospace';
        ctx.textAlign = 'left';
        ctx.fillText('CREDITS', x, y);
        y += 60;

        // Labels
        ctx.fillStyle = '#d7d7d7';
        ctx.font = 'bold 24px monospace';
        ctx.fillText('Author:', x, y);
        ctx.fillStyle = '#ffffff';
        ctx.font = '24px monospace';
        ctx.fillText(this.creditsInfo.author, x + 160, y);
        y += 40;

        ctx.fillStyle = '#d7d7d7';
        ctx.font = 'bold 24px monospace';
        ctx.fillText('Copyright:', x, y);
        ctx.fillStyle = '#ffffff';
        ctx.font = '24px monospace';
        ctx.fillText(this.creditsInfo.year, x + 200, y);
        y += 40;

        ctx.fillStyle = '#d7d7d7';
        ctx.font = 'bold 24px monospace';
        ctx.fillText('License:', x, y);
        ctx.fillStyle = '#ffffff';
        ctx.font = '24px monospace';
        ctx.fillText(this.creditsInfo.license, x + 160, y);
        y += 50;

        ctx.fillStyle = '#d7d7d7';
        ctx.font = 'bold 24px monospace';
        ctx.fillText('Description:', x, y);
        y += 34;

        ctx.fillStyle = '#ffffff';
        ctx.font = '24px monospace';
        const lines = this._wrapText(ctx, this.creditsInfo.description, contentWidth);
        for (const line of lines) {
            ctx.fillText(line, x, y);
            y += 30;
        }

        this._drawSmallButton(ctx, closeBtn.x, closeBtn.y, closeBtn.w, closeBtn.h, 'CLOSE', '#1f2d3a');

        ctx.restore();
    }

    _getObjectiveModalBounds() {
        const w = 1100;
        const h = 740;
        return {
            x: (CONFIG.DESIGN_WIDTH - w) / 2,
            y: (CONFIG.DESIGN_HEIGHT - h) / 2,
            w,
            h,
        };
    }

    _getObjectiveCloseBounds() {
        const modal = this._getObjectiveModalBounds();
        const w = 180;
        const h = 52;
        return {
            x: modal.x + (modal.w - w) / 2,
            y: modal.y + modal.h - h - 26,
            w,
            h,
        };
    }

    _isObjectiveCloseHit(pos, pad = 0) {
        return this._isPointInRect(pos, this._getObjectiveCloseBounds(), pad);
    }

    _drawObjectiveModal(ctx) {
        const modal = this._getObjectiveModalBounds();
        const closeBtn = this._getObjectiveCloseBounds();
        const RC = CONFIG.RARITY_COLORS;

        ctx.save();

        // Modal background
        ctx.fillStyle = 'rgba(10, 16, 22, 0.96)';
        ctx.beginPath();
        const r = 16;
        ctx.moveTo(modal.x + r, modal.y);
        ctx.lineTo(modal.x + modal.w - r, modal.y);
        ctx.quadraticCurveTo(modal.x + modal.w, modal.y, modal.x + modal.w, modal.y + r);
        ctx.lineTo(modal.x + modal.w, modal.y + modal.h - r);
        ctx.quadraticCurveTo(modal.x + modal.w, modal.y + modal.h, modal.x + modal.w - r, modal.y + modal.h);
        ctx.lineTo(modal.x + r, modal.y + modal.h);
        ctx.quadraticCurveTo(modal.x, modal.y + modal.h, modal.x, modal.y + modal.h - r);
        ctx.lineTo(modal.x, modal.y + r);
        ctx.quadraticCurveTo(modal.x, modal.y, modal.x + r, modal.y);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.lineWidth = 2;
        ctx.stroke();

        const pad = 44;
        let x = modal.x + pad;
        let y = modal.y + pad + 10;

        // Title
        ctx.fillStyle = '#f1c40f';
        ctx.font = 'bold 40px monospace';
        ctx.textAlign = 'left';
        ctx.fillText('HOW TO PLAY', x, y);
        y += 50;

        // Goal
        ctx.fillStyle = '#ffffff';
        ctx.font = '21px monospace';
        ctx.fillText('Score points by harpooning deep sea creatures. The game', x, y);
        y += 27;
        ctx.fillText('ends when time runs out or you have no harpoons left.', x, y);
        y += 44;

        // Creatures section
        ctx.fillStyle = '#f1c40f';
        ctx.font = 'bold 24px monospace';
        ctx.fillText('CREATURES', x, y);
        ctx.fillStyle = '#999999';
        ctx.font = '19px monospace';
        ctx.fillText('\u2014 Rarer creatures are worth more points', x + 200, y);
        y += 18;

        // Rarity icons row
        const iconSize = 44;
        const rarities = [
            { key: 'common', label: 'Common', row: 3 },
            { key: 'uncommon', label: 'Uncommon', row: 29 },
            { key: 'rare', label: 'Rare', row: 0 },
            { key: 'epic', label: 'Epic', row: 9 },
            { key: 'legendary', label: 'Legendary', row: 4 },
        ];
        const cw = modal.w - pad * 2;
        const colWidth = Math.floor(cw / rarities.length);
        if (this.creatureSheet.loaded) {
            for (let i = 0; i < rarities.length; i++) {
                const rar = rarities[i];
                const ix = x + i * colWidth;
                this.creatureSheet.drawFrame(ctx, 0, rar.row * 48, 48, 48, ix, y, iconSize, iconSize);
                ctx.fillStyle = RC[rar.key];
                ctx.font = 'bold 18px monospace';
                ctx.fillText(rar.label, ix + iconSize + 6, y + iconSize / 2 + 6);
            }
        }
        y += iconSize + 24;

        // Special section
        ctx.fillStyle = '#f1c40f';
        ctx.font = 'bold 24px monospace';
        ctx.fillText('SPECIAL', x, y);
        y += 16;

        // Ghost
        const sSize = 44;
        if (this.sillySheet.loaded) {
            this.sillySheet.drawFrame(ctx, 128, 48, 16, 16, x, y, sSize, sSize);
        }
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 21px monospace';
        ctx.fillText('Ghost', x + sSize + 10, y + 16);
        ctx.fillStyle = '#cccccc';
        ctx.font = '19px monospace';
        ctx.fillText('\u2014 No points, but restores many harpoons.', x + sSize + 84, y + 16);
        ctx.fillText('Appears periodically. Don\'t miss it!', x + sSize + 10, y + 40);
        y += 58;

        // Treasure
        if (this.treasureSheet.loaded) {
            this.treasureSheet.drawFrame(ctx, 48, 144, 16, 16, x, y, sSize, sSize);
        }
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 21px monospace';
        ctx.fillText('Treasure', x + sSize + 10, y + 16);
        ctx.fillStyle = '#cccccc';
        ctx.font = '19px monospace';
        ctx.fillText('\u2014 A chest opens periodically at the center.', x + sSize + 130, y + 16);
        ctx.fillText('Catch the item for big points + bonus harpoons.', x + sSize + 10, y + 40);
        y += 70;

        // Bonus harpoon hint
        if (this.creatureSheet.loaded) {
            this.creatureSheet.drawFrame(ctx, 0, 4 * 48, 48, 48, x, y - 16, sSize, sSize);
        }
        ctx.fillStyle = RC.legendary;
        ctx.font = 'bold 21px monospace';
        ctx.fillText('Bonus', x + sSize + 10, y + 16);
        ctx.fillStyle = '#cccccc';
        ctx.font = '19px monospace';
        ctx.fillText('\u2014 Some legendary creatures grant bonus harpoons.', x + sSize + 84, y + 16);
        y += 64;

        // Difficulty
        ctx.fillStyle = '#f1c40f';
        ctx.font = 'bold 24px monospace';
        ctx.fillText('DIFFICULTY', x, y);
        y += 28;
        ctx.fillStyle = '#cccccc';
        ctx.font = '19px monospace';
        ctx.fillText('As your harpoons run low, rarer creatures appear more often \u2014', x, y);
        y += 25;
        ctx.fillText('but everything moves faster!', x, y);

        // Close button
        this._drawSmallButton(ctx, closeBtn.x, closeBtn.y, closeBtn.w, closeBtn.h, 'CLOSE', '#1f2d3a');

        ctx.restore();
    }

    exit() {
        this.game.canvas.removeEventListener('pointerdown', this._onTap);
        window.removeEventListener('keydown', this._onKeyDown);
        document.removeEventListener('fullscreenchange', this._onFullscreenChange);
        document.removeEventListener('webkitfullscreenchange', this._onFullscreenChange);
    }
}
