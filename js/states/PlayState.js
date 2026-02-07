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
            });
        }

        this.treasureChest = new TreasureChest(this.treasureSheet);
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
        this.buybackHarpoons = 5;
    }

    enter() {
        for (const player of this.players) {
            player.scoreManager.reset();
            player.harpoon = new Harpoon(player.harpoon.playerIndex);
            player.shotTimer = player.shotTimerMax;
            player.shotTimerActive = false;
            player.gameOver = false;
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
                const { ScoreScreenState } = this.game._stateClasses;
                if (ScoreScreenState) {
                    if (this.isTwoPlayer) {
                        this.game.changeState(new ScoreScreenState(
                            this.game,
                            this.players[0].scoreManager.getSummary(),
                            this.creatureSheet,
                            this.players[1].scoreManager.getSummary(),
                            this.winner
                        ));
                    } else {
                        this.game.changeState(new ScoreScreenState(
                            this.game,
                            this.players[0].scoreManager.getSummary(),
                            this.creatureSheet
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
                const isSpeared = this.players.some(p => p.harpoon.spearedCreature === creature);
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
        if (player.gameOver) return;

        // Shot timer countdown
        if (player.shotTimerActive && !this.gameOverPending) {
            player.shotTimer -= dt;
            if (player.shotTimer <= 0) {
                player.shotTimer = 0;
                if (this.isTwoPlayer) {
                    const otherPlayer = this.players[1 - playerIndex];
                    if (!otherPlayer.gameOver && player.scoreManager.score >= this.buybackCost) {
                        player.scoreManager.score -= this.buybackCost;
                        player.scoreManager.harpoonsRemaining += this.buybackHarpoons;
                        player.shotTimer = player.shotTimerMax;
                        this.uiRenderer.addHarpoonBounce(playerIndex);
                    } else {
                        player.gameOver = true;
                    }
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
        const hadCreature = player.harpoon.spearedCreature !== null;
        player.harpoon.update(dt);

        // Play miss sound when harpoon returns idle without having caught anything
        if (prevState === 'retracting' && player.harpoon.state === 'idle' && !hadCreature) {
            audio.playMiss();
        }

        // Collision detection for this player's harpoon
        const hit = this.collision.check(player.harpoon, this.creatures);
        if (hit) {
            player.harpoon.latchCreature(hit);
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
                this.uiRenderer.addHarpoonBounce(playerIndex);
                audio.playBonusHarpoon();
            }
        }
    }

    _checkGameOver() {
        if (this.gameOverPending) return;

        if (this.isTwoPlayer) {
            // In 2 player mode, game ends when both players are out
            const p1Done = this.players[0].gameOver ||
                (this.players[0].scoreManager.isGameOver && this.players[0].harpoon.state === 'idle');
            const p2Done = this.players[1].gameOver ||
                (this.players[1].scoreManager.isGameOver && this.players[1].harpoon.state === 'idle');

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
            if ((p.scoreManager.isGameOver && p.harpoon.state === 'idle') || p.gameOver) {
                this.gameOverPending = true;
                this.gameOverTimer = 0;
                audio.playGameOver();
            }
        }
    }

    render(ctx, alpha) {
        this.waterRenderer.render(ctx);
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
            player.harpoon.render(ctx, aimAngle, isAiming);
        }

        // Particles on top
        this.particles.render(ctx);

        // UI overlay
        if (this.isTwoPlayer) {
            this.uiRenderer.render(
                ctx,
                this.players[0].scoreManager.harpoonsRemaining,
                this.players[0].shotTimerActive ? this.players[0].shotTimer : -1,
                this.players[1].scoreManager.harpoonsRemaining,
                this.players[1].shotTimerActive ? this.players[1].shotTimer : -1,
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

        // Game over overlay
        const allIdle = this.players.every(p => p.harpoon.state === 'idle');
        if (this.gameOverPending && allIdle) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
            ctx.fillRect(0, 0, CONFIG.DESIGN_WIDTH, CONFIG.DESIGN_HEIGHT);
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 48px monospace';
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

    exit() {
        this.input.destroy();
    }
}
