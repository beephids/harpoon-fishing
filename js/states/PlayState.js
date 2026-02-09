import { CONFIG } from '../data/config.js';
import { SpriteSheet } from '../rendering/SpriteSheet.js';
import { WaterRenderer } from '../rendering/WaterRenderer.js';
import { UIRenderer } from '../rendering/UIRenderer.js';
import { InputManager } from '../systems/InputManager.js';
import { TwoPlayerInputManager } from '../systems/TwoPlayerInputManager.js';
import { SpawnManager } from '../systems/SpawnManager.js';
import { CollisionSystem } from '../systems/CollisionSystem.js';
import { ScoreManager } from '../systems/ScoreManager.js';
import { ParticleSystem } from '../systems/ParticleSystem.js';
import { Harpoon } from '../entities/Harpoon.js';
import { TreasureChest } from '../entities/TreasureChest.js';
import { audio } from '../utils/audio.js';

export class PlayState {
    constructor(game, playerCount = 1, roundTime = 180) {
        this.game = game;
        this.playerCount = playerCount;
        this.isTwoPlayer = playerCount === 2;

        // Load sprite sheets
        this.waterSheet = new SpriteSheet('Water+.png');
        this.creatureSheet = new SpriteSheet('DeepseaCreatures_spritesheet.png');
        this.treasureSheet = new SpriteSheet('Treasure+.png');
        this.sillySheet = new SpriteSheet('Silly_Placeholders.png');

        // Renderers
        this.waterRenderer = new WaterRenderer(this.waterSheet);
        this.uiRenderer = new UIRenderer(this.isTwoPlayer);

        // Systems
        if (this.isTwoPlayer) {
            this.input = new TwoPlayerInputManager(game.canvas);
        } else {
            this.input = new InputManager(game.canvas);
        }
        this.spawnManager = new SpawnManager(this.creatureSheet, this.sillySheet);
        this.collision = new CollisionSystem();
        this.particles = new ParticleSystem();

        // Per-player systems
        this.players = [];
        for (let i = 0; i < playerCount; i++) {
            this.players.push({
                harpoon: new Harpoon(i),
                scoreManager: new ScoreManager(),
                shotTimer: 10,
                shotTimerMax: 10,
                shotTimerActive: false,
                gameOver: false,
                buybackPending: false,
            });
        }

        this.treasureChest = new TreasureChest(this.treasureSheet, this.creatureSheet);
        this.creatures = [];

        // Global game over state
        this.gameOverPending = false;
        this.gameOverTimer = 0;
        this.winner = null; // for 2 player mode

        // Round timer
        this.roundTimeLimit = roundTime;
        this.roundTimer = roundTime;

        // Buyback (2P only): spend points for more harpoons when shot timer expires
        this.buybackCost = 500;
        this.buybackHarpoons = 1;

        // Buyback button bounds (set during render, checked during input)
        // Each entry: { accept: {x,y,w,h}, reject: {x,y,w,h} }
        this.buybackButtons = [null, null];

        // Buyback pointer handler
        this._onBuybackPointerDown = this._onBuybackPointerDown.bind(this);
        game.canvas.addEventListener('pointerdown', this._onBuybackPointerDown, true);

        // Dev key handler
        this._onDevKeyDown = this._onDevKeyDown.bind(this);
        window.addEventListener('keydown', this._onDevKeyDown);
    }

    enter() {
        for (const player of this.players) {
            player.scoreManager.reset();
            player.harpoon = new Harpoon(player.harpoon.playerIndex);
            player.shotTimer = player.shotTimerMax;
            player.shotTimerActive = false;
            player.gameOver = false;
            player.buybackPending = false;
        }
        this.creatures = [];
        this.gameOverPending = false;
        this.gameOverTimer = 0;
        this.winner = null;
        this.roundTimer = this.roundTimeLimit;
        this.uiRenderer.reset();
    }

    update(dt) {
        this.waterRenderer.update(dt);
        this.particles.update(dt);
        this.input.update(dt);

        // Update UI with scores
        if (this.isTwoPlayer) {
            this.uiRenderer.update(dt, this.players[0].scoreManager.score, this.players[1].scoreManager.score);
        } else {
            this.uiRenderer.update(dt, this.players[0].scoreManager.score);
        }

        // Round timer countdown
        if (!this.gameOverPending && this.roundTimer > 0) {
            this.roundTimer -= dt;
            if (this.roundTimer <= 0) {
                this.roundTimer = 0;
                for (const player of this.players) {
                    player.gameOver = true;
                }
            }
        }

        // Game over check - transition to score screen
        if (this.gameOverPending) {
            this.gameOverTimer += dt;
            const allIdle = this.players.every(p => p.harpoon.state === 'idle');
            if (allIdle && this.gameOverTimer > 1) {
                // Update session high score
                for (const player of this.players) {
                    if (player.scoreManager.score > this.game.sessionHighScore) {
                        this.game.sessionHighScore = player.scoreManager.score;
                    }
                }

                const { ScoreScreenState } = this.game._stateClasses;
                if (ScoreScreenState) {
                    if (this.isTwoPlayer) {
                        this.game.changeState(new ScoreScreenState(
                            this.game,
                            this.players[0].scoreManager.getSummary(),
                            this.creatureSheet,
                            this.treasureSheet,
                            this.players[1].scoreManager.getSummary(),
                            this.winner
                        ));
                    } else {
                        this.game.changeState(new ScoreScreenState(
                            this.game,
                            this.players[0].scoreManager.getSummary(),
                            this.creatureSheet,
                            this.treasureSheet
                        ));
                    }
                }
                return;
            }
        }

        // Update each player
        for (let i = 0; i < this.players.length; i++) {
            this._updatePlayer(i, dt);
        }

        // Spawn creatures (use average harpoons remaining for difficulty)
        if (!this.gameOverPending) {
            const avgHarpoons = this.players.reduce((sum, p) => sum + p.scoreManager.harpoonsRemaining, 0) / this.players.length;
            this.spawnManager.update(dt, avgHarpoons, this.creatures);
        }

        // Treasure chest
        const prevChestState = this.treasureChest.state;
        this.treasureChest.update(dt, this.creatures);
        if (prevChestState === 'closed' && this.treasureChest.state === 'opening') {
            audio.playChestOpen();
        }

        // Update creatures
        for (let i = this.creatures.length - 1; i >= 0; i--) {
            this.creatures[i].update(dt);
            if (this.creatures[i].isOffScreen() && this.creatures[i].alive) {
                this.creatures.splice(i, 1);
            }
        }

        // Remove dead creatures that have been fully retracted
        for (let i = this.creatures.length - 1; i >= 0; i--) {
            const creature = this.creatures[i];
            if (!creature.alive) {
                const isSpeared = this.players.some(p => p.harpoon.spearedCreatures.includes(creature));
                if (!isSpeared) {
                    this.creatures.splice(i, 1);
                }
            }
        }

        // Check for game over conditions
        this._checkGameOver();
    }

    _updatePlayer(playerIndex, dt) {
        const player = this.players[playerIndex];
        if (player.gameOver || player.buybackPending) return;

        // Shot timer countdown
        if (player.shotTimerActive && !this.gameOverPending) {
            player.shotTimer -= dt;
            if (player.shotTimer <= 0) {
                player.shotTimer = 0;
                if (player.scoreManager.score >= this.buybackCost) {
                    // Show buyback prompt
                    player.buybackPending = true;
                } else {
                    player.gameOver = true;
                }
            }
        }

        // Handle fire input
        const wantsFire = this.isTwoPlayer
            ? this.input.consumeFire(playerIndex)
            : this.input.consumeFire();

        if (!this.gameOverPending && !player.gameOver && wantsFire) {
            if (player.harpoon.state === 'idle' && player.scoreManager.harpoonsRemaining > 0) {
                const aimAngle = this.isTwoPlayer
                    ? this.input.getAimAngle(playerIndex)
                    : this.input.aimAngle;

                if (player.harpoon.fire(aimAngle)) {
                    player.scoreManager.useHarpoon();
                    this.particles.emitSplash(player.harpoon.baseX, player.harpoon.baseY);
                    audio.playSplash();
                    // Reset shot timer
                    player.shotTimer = player.shotTimerMax;
                    player.shotTimerActive = true;
                }
            }
        }

        const prevState = player.harpoon.state;
        const hadCreatures = player.harpoon.spearedCreatures.length > 0;
        player.harpoon.update(dt);

        // Play miss sound when harpoon returns idle without having caught anything
        if (prevState === 'retracting' && player.harpoon.state === 'idle' && !hadCreatures) {
            audio.playMiss();
        }

        // Collision detection for this player's harpoon (returns array, supports pierce)
        const hits = this.collision.check(player.harpoon, this.creatures);
        if (hits.length > 0) {
            player.harpoon.latchCreatures(hits);

            let anyBonus = false;
            for (const hit of hits) {
                const bonusHarpoons = player.scoreManager.addCatch(hit);

                // Audio
                if (hit.rarity === 'legendary') {
                    audio.playLegendary();
                } else {
                    audio.playHit();
                }

                // Particles
                if (hit.rarity === 'legendary' || hit.rarity === 'epic') {
                    this.particles.emitLegendary(hit.x, hit.renderY);
                } else {
                    this.particles.emitHit(hit.x, hit.renderY, CONFIG.RARITY_COLORS[hit.rarity]);
                }

                // Toast
                this.uiRenderer.addCatchToast(hit.name, hit.rarity, hit.points, hit.bonusHarpoons, hit.x, hit.renderY - 40, playerIndex);

                if (bonusHarpoons > 0) {
                    anyBonus = true;
                }
            }

            if (anyBonus) {
                this.uiRenderer.addHarpoonBounce(playerIndex);
                audio.playBonusHarpoon();
            }
        }
    }

    _checkGameOver() {
        if (this.gameOverPending) return;

        // Offer buyback to any player who ran out of harpoons and can afford it
        for (const player of this.players) {
            if (!player.gameOver && !player.buybackPending &&
                player.scoreManager.isGameOver && player.harpoon.state === 'idle' &&
                player.scoreManager.score >= this.buybackCost) {
                player.buybackPending = true;
            }
        }

        if (this.isTwoPlayer) {
            // In 2 player mode, game ends when both players are out (not just pending buyback)
            const p1Done = !this.players[0].buybackPending && (this.players[0].gameOver ||
                (this.players[0].scoreManager.isGameOver && this.players[0].harpoon.state === 'idle'));
            const p2Done = !this.players[1].buybackPending && (this.players[1].gameOver ||
                (this.players[1].scoreManager.isGameOver && this.players[1].harpoon.state === 'idle'));

            if (p1Done && p2Done) {
                this.gameOverPending = true;
                this.gameOverTimer = 0;
                // Determine winner
                const score1 = this.players[0].scoreManager.score;
                const score2 = this.players[1].scoreManager.score;
                if (score1 > score2) this.winner = 1;
                else if (score2 > score1) this.winner = 2;
                else this.winner = 0; // tie
                audio.playGameOver();
            }
        } else {
            // Single player: game over when out of harpoons or shot timer expires
            const p = this.players[0];
            if (!p.buybackPending && ((p.scoreManager.isGameOver && p.harpoon.state === 'idle') || p.gameOver)) {
                this.gameOverPending = true;
                this.gameOverTimer = 0;
                audio.playGameOver();
            }
        }
    }

    render(ctx, alpha) {
        this.waterRenderer.render(ctx);

        // Center divider line behind all sprites (2P only)
        if (this.isTwoPlayer) {
            ctx.save();
            ctx.strokeStyle = 'rgba(255, 255, 0, 0.5)';
            ctx.lineWidth = 2;
            ctx.setLineDash([20, 20]);
            ctx.beginPath();
            ctx.moveTo(0, CONFIG.DESIGN_HEIGHT / 2);
            ctx.lineTo(CONFIG.DESIGN_WIDTH, CONFIG.DESIGN_HEIGHT / 2);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.restore();
        }

        this.treasureChest.render(ctx);

        // Draw creatures
        for (const creature of this.creatures) {
            creature.render(ctx);
        }

        // Draw harpoons
        for (let i = 0; i < this.players.length; i++) {
            const player = this.players[i];
            const aimAngle = this.isTwoPlayer
                ? this.input.getAimAngle(i)
                : this.input.aimAngle;
            const isAiming = this.isTwoPlayer
                ? this.input.isAiming(i)
                : this.input.isAiming;
            const isTimerExpired = this.isTwoPlayer && player.shotTimer <= 0;
            player.harpoon.render(ctx, aimAngle, isAiming, isTimerExpired);
        }

        // Particles on top
        this.particles.render(ctx);

        // UI overlay
        if (this.isTwoPlayer) {
            const p1ShotTimerDisplay = this.players[0].shotTimerActive
                ? this.players[0].shotTimer
                : (this.players[0].shotTimer <= 0 ? 0 : -1);
            const p2ShotTimerDisplay = this.players[1].shotTimerActive
                ? this.players[1].shotTimer
                : (this.players[1].shotTimer <= 0 ? 0 : -1);
            this.uiRenderer.render(
                ctx,
                this.players[0].scoreManager.harpoonsRemaining,
                p1ShotTimerDisplay,
                this.players[1].scoreManager.harpoonsRemaining,
                p2ShotTimerDisplay,
                this.roundTimer
            );
        } else {
            this.uiRenderer.render(
                ctx,
                this.players[0].scoreManager.harpoonsRemaining,
                this.players[0].shotTimerActive ? this.players[0].shotTimer : -1,
                null,
                null,
                this.roundTimer
            );
        }

        // Buyback prompts
        for (let i = 0; i < this.players.length; i++) {
            if (this.players[i].buybackPending) {
                this._renderBuybackPrompt(ctx, i);
            }
        }

        // Game over overlay
        const allIdle = this.players.every(p => p.harpoon.state === 'idle');
        if (this.gameOverPending && allIdle) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
            ctx.fillRect(0, 0, CONFIG.DESIGN_WIDTH, CONFIG.DESIGN_HEIGHT);
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 72px monospace';
            ctx.textAlign = 'center';

            if (this.isTwoPlayer && this.winner !== null) {
                if (this.winner === 0) {
                    ctx.fillText("It's a Tie!", CONFIG.DESIGN_WIDTH / 2, CONFIG.DESIGN_HEIGHT / 2);
                } else {
                    ctx.fillStyle = this.winner === 1 ? '#3498db' : '#e74c3c';
                    ctx.fillText(`Player ${this.winner} Wins!`, CONFIG.DESIGN_WIDTH / 2, CONFIG.DESIGN_HEIGHT / 2);
                }
            } else {
                ctx.fillText('Game Over', CONFIG.DESIGN_WIDTH / 2, CONFIG.DESIGN_HEIGHT / 2);
            }
            ctx.textAlign = 'left';
        }
    }

    _renderBuybackPrompt(ctx, playerIndex) {
        const cx = CONFIG.DESIGN_WIDTH / 2;
        // SP: center, 2P: P1 in lower quarter, P2 in upper quarter
        const cy = this.isTwoPlayer
            ? (playerIndex === 0 ? CONFIG.DESIGN_HEIGHT * 3 / 4 : CONFIG.DESIGN_HEIGHT * 1 / 4)
            : CONFIG.DESIGN_HEIGHT / 2;

        // Semi-transparent backdrop
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        const bw = 690, bh = 150, br = 18;
        const bx = cx - bw / 2, by = cy - bh / 2;
        ctx.beginPath();
        ctx.moveTo(bx + br, by);
        ctx.lineTo(bx + bw - br, by);
        ctx.quadraticCurveTo(bx + bw, by, bx + bw, by + br);
        ctx.lineTo(bx + bw, by + bh - br);
        ctx.quadraticCurveTo(bx + bw, by + bh, bx + bw - br, by + bh);
        ctx.lineTo(bx + br, by + bh);
        ctx.quadraticCurveTo(bx, by + bh, bx, by + bh - br);
        ctx.lineTo(bx, by + br);
        ctx.quadraticCurveTo(bx, by, bx + br, by);
        ctx.closePath();
        ctx.fill();

        // Text: "500 pts = 1 harpoon + keep going!"
        ctx.font = 'bold 42px monospace';
        ctx.textAlign = 'center';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 4;
        ctx.fillStyle = '#FFD700';
        ctx.strokeText('500 pts = 1 harpoon + keep going!', cx, cy - 15);
        ctx.fillText('500 pts = 1 harpoon + keep going!', cx, cy - 15);

        // Accept and reject buttons using Silly Placeholders spritesheet
        const btnSize = 72;
        const btnGap = 45;
        const btnY = cy + 15;

        // Reject button (red X) - left
        const rejectX = cx - btnGap - btnSize;
        this.sillySheet.drawFrame(ctx, 112, 176, 16, 16, rejectX, btnY, btnSize, btnSize);
        this.buybackButtons[playerIndex] = this.buybackButtons[playerIndex] || {};
        this.buybackButtons[playerIndex].reject = { x: rejectX, y: btnY, w: btnSize, h: btnSize };

        // Accept button (green check) - right
        const acceptX = cx + btnGap;
        this.sillySheet.drawFrame(ctx, 128, 176, 16, 16, acceptX, btnY, btnSize, btnSize);
        this.buybackButtons[playerIndex].accept = { x: acceptX, y: btnY, w: btnSize, h: btnSize };

        ctx.restore();
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

    _hitTest(pos, bounds) {
        return bounds && pos.x >= bounds.x && pos.x <= bounds.x + bounds.w
            && pos.y >= bounds.y && pos.y <= bounds.y + bounds.h;
    }

    _onBuybackPointerDown(e) {
        const pos = this._screenToCanvas(e);
        for (let i = 0; i < this.players.length; i++) {
            if (!this.players[i].buybackPending) continue;
            const btns = this.buybackButtons[i];
            if (!btns) continue;

            if (this._hitTest(pos, btns.accept)) {
                this._acceptBuyback(i);
                e.stopPropagation();
                return;
            }
            if (this._hitTest(pos, btns.reject)) {
                this._rejectBuyback(i);
                e.stopPropagation();
                return;
            }
        }
    }

    _acceptBuyback(playerIndex) {
        const player = this.players[playerIndex];
        player.scoreManager.score -= this.buybackCost;
        player.scoreManager.harpoonsRemaining += this.buybackHarpoons;
        player.shotTimer = player.shotTimerMax;
        player.shotTimerActive = true;
        player.buybackPending = false;
        this.uiRenderer.addHarpoonBounce(playerIndex);
        audio.playBonusHarpoon();
    }

    _rejectBuyback(playerIndex) {
        this.players[playerIndex].buybackPending = false;
        this.players[playerIndex].gameOver = true;
    }

    _onDevKeyDown(e) {
        if (e.repeat) return;

        // Dev: G adds 500 score
        if (e.key === 'g' || e.key === 'G') {
            for (const player of this.players) {
                player.scoreManager.score += 500;
            }
            return;
        }

        // Buyback keyboard controls
        // P1: ArrowUp = accept, ArrowDown = reject
        if (this.players[0].buybackPending) {
            if (e.key === 'ArrowUp') { this._acceptBuyback(0); return; }
            if (e.key === 'ArrowDown') { this._rejectBuyback(0); return; }
        }
        // P2: W = accept, S = reject
        if (this.isTwoPlayer && this.players[1].buybackPending) {
            if (e.key === 'w' || e.key === 'W') { this._acceptBuyback(1); return; }
            if (e.key === 's' || e.key === 'S') { this._rejectBuyback(1); return; }
        }
    }

    exit() {
        this.input.destroy();
        this.game.canvas.removeEventListener('pointerdown', this._onBuybackPointerDown, true);
        window.removeEventListener('keydown', this._onDevKeyDown);
    }
}
