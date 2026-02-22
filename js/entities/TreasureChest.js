import { CONFIG } from '../data/config.js';
import { CREATURE_TYPES, TREASURE_ITEMS } from '../data/creatureData.js';
import { Animator } from '../rendering/Animator.js';
import { randomRange, randomInt } from '../utils/math.js';

// Treasure item entity (similar to SeaCreature but for treasure)
class TreasureItem {
    constructor(x, y, treasureData, spriteSheet, creatureSheet) {
        this.x = x;
        this.y = y;
        this.renderY = y;
        this.spriteSheet = spriteSheet;
        this.creatureSheet = creatureSheet;
        this.alive = true;

        // Copy treasure data
        this.name = treasureData.name;
        this.points = treasureData.points;
        this.bonusHarpoons = treasureData.bonusHarpoons;
        this.rarity = 'legendary'; // all treasure is legendary
        this.typeKey = 'treasure_' + treasureData.name.toLowerCase().replace(/\s+/g, '_');

        // Sprite frame
        this.frame = { sx: treasureData.sx, sy: treasureData.sy, sw: 16, sh: 16 };

        // Display properties
        this.displaySize = 80;
        this.hitboxRadius = 30;

        // Animation
        this.bobPhase = Math.random() * Math.PI * 2;
        this.sparkleTimer = 0;

        // Tubeworm ring
        this.tubewormRingEnabled = Boolean(CONFIG.TREASURE_TUBEWORM_RING_ENABLED && this.creatureSheet);
        this.ringCreatures = [];
        if (this.tubewormRingEnabled && CREATURE_TYPES.tubeworm) {
            const twData = CREATURE_TYPES.tubeworm;
            this.tubewormRing = {
                count: 6,
                radius: 90,
                size: 86,
                angle: Math.random() * Math.PI * 2,
                speed: 0.35,
            };
            for (let i = 0; i < this.tubewormRing.count; i++) {
                const initAngle = this.tubewormRing.angle + (Math.PI * 2 * i) / this.tubewormRing.count;
                this.ringCreatures.push({
                    x: this.x + Math.cos(initAngle) * this.tubewormRing.radius,
                    y: this.y,
                    renderY: this.y + Math.sin(initAngle) * this.tubewormRing.radius,
                    vx: 0,
                    alive: true,
                    name: twData.name,
                    typeKey: 'tubeworm',
                    rarity: twData.rarity,
                    points: twData.points,
                    bonusHarpoons: twData.bonusHarpoons,
                    hitboxRadius: 30,
                    displaySize: this.tubewormRing.size,
                    spriteSheet: this.creatureSheet,
                    animator: new Animator(twData.frames, 3),
                    isOffScreen() { return false; },
                    update(dt) { this.animator.update(dt); },
                    render(ctx) {
                        if (!this.spriteSheet || !this.spriteSheet.loaded) return;
                        const frame = this.animator.getCurrentFrame();
                        const half = this.displaySize / 2;
                        this.spriteSheet.drawFrame(
                            ctx, frame.sx, frame.sy, frame.sw, frame.sh,
                            this.x - half, this.renderY - half,
                            this.displaySize, this.displaySize
                        );
                    },
                });
            }
        } else {
            this.tubewormRingEnabled = false;
            this.tubewormRing = null;
        }
    }

    update(dt) {
        this.bobPhase += dt * 2;
        this.sparkleTimer += dt;
        if (this.tubewormRingEnabled && this.tubewormRing) {
            this.tubewormRing.angle += dt * this.tubewormRing.speed;
            const bobOffset = Math.sin(this.bobPhase) * 5;
            const centerY = this.renderY + bobOffset;
            for (let i = 0; i < this.ringCreatures.length; i++) {
                if (!this.ringCreatures[i].alive) continue;
                const angle = this.tubewormRing.angle + (Math.PI * 2 * i) / this.tubewormRing.count;
                this.ringCreatures[i].x = this.x + Math.cos(angle) * this.tubewormRing.radius;
                this.ringCreatures[i].renderY = centerY + Math.sin(angle) * this.tubewormRing.radius;
            }
        }
    }

    killRingCreatures() {
        for (const rc of this.ringCreatures) {
            rc.alive = false;
        }
    }

    render(ctx) {
        if (!this.alive) return;

        const bobOffset = Math.sin(this.bobPhase) * 5;
        const half = this.displaySize / 2;
        const centerY = this.renderY + bobOffset;

        ctx.save();

        // Sparkle effect
        if (this.sparkleTimer % 0.5 < 0.25) {
            ctx.globalAlpha = 0.3;
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.arc(this.x, centerY, this.displaySize * 0.6, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        }

        // Draw treasure sprite
        if (this.spriteSheet && this.spriteSheet.loaded) {
            this.spriteSheet.drawFrame(
                ctx,
                this.frame.sx, this.frame.sy, this.frame.sw, this.frame.sh,
                this.x - half, centerY - half,
                this.displaySize, this.displaySize
            );
        }

        ctx.restore();
    }

    isOffScreen() {
        return false; // Treasure doesn't leave on its own
    }
}

// States: closed, opening, open, retreating, closing
export class TreasureChest {
    constructor(treasureSpriteSheet, creatureSpriteSheet) {
        this.treasureSheet = treasureSpriteSheet;
        this.creatureSheet = creatureSpriteSheet;
        this.x = CONFIG.CHEST_X;
        this.y = CONFIG.CHEST_Y;

        // Sprite coordinates (16x16 cells)
        this.closedFrame = { sx: 0, sy: 144, sw: 16, sh: 16 };   // col 9, row 0
        this.openFrame = { sx: 48, sy: 144, sw: 16, sh: 16 };    // col 9, row 3

        this.state = 'closed';
        this.timer = 0;
        this.nextOpenTime = randomRange(CONFIG.CHEST_OPEN_INTERVAL_MIN, CONFIG.CHEST_OPEN_INTERVAL_MAX) / 1000;
        this.openDuration = randomRange(3, 5); // 3-5 seconds visible
        this.transitionDuration = 0.5;
        this.transitionProgress = 0;

        // The treasure item that appears from the chest
        this.spawnedTreasure = null;
        this.retreatProgress = 0;

        this.glowPhase = 0;
        this.chestDisplaySize = 96;
    }

    update(dt, creatures) {
        this.glowPhase += dt * 3;

        switch (this.state) {
            case 'closed':
                this.timer += dt;
                if (this.timer >= this.nextOpenTime) {
                    this.state = 'opening';
                    this.timer = 0;
                    this.transitionProgress = 0;
                    this.spawnedTreasure = null;
                    this.retreatProgress = 0;
                    this.openDuration = randomRange(3, 5);
                }
                break;

            case 'opening':
                this.transitionProgress += dt / this.transitionDuration;
                if (this.transitionProgress >= 1) {
                    this.transitionProgress = 1;
                    this.state = 'open';
                    this.timer = 0;
                    // Spawn a random treasure item
                    const treasureData = TREASURE_ITEMS[randomInt(0, TREASURE_ITEMS.length - 1)];
                    this.spawnedTreasure = new TreasureItem(
                        this.x,
                        this.y,
                        treasureData,
                        this.treasureSheet,
                        this.creatureSheet
                    );
                    // Add to global creatures array so harpoon can hit it
                    creatures.push(this.spawnedTreasure);
                    for (const rc of this.spawnedTreasure.ringCreatures) {
                        creatures.push(rc);
                    }
                }
                break;

            case 'open':
                this.timer += dt;
                if (this.spawnedTreasure && this.spawnedTreasure.alive) {
                    this.spawnedTreasure.x = this.x;
                    this.spawnedTreasure.y = this.y;
                    this.spawnedTreasure.renderY = this.spawnedTreasure.y;
                    this.spawnedTreasure.update(dt);
                }

                if (this.timer >= this.openDuration) {
                    this.state = 'retreating';
                    this.timer = 0;
                    this.retreatProgress = 0;
                }
                break;

            case 'retreating':
                // Treasure retreats back down into the chest
                this.retreatProgress += dt / 1.0; // 1 second retreat
                if (this.retreatProgress >= 1) {
                    this.retreatProgress = 1;
                    // Remove the treasure if it wasn't caught
                    if (this.spawnedTreasure && this.spawnedTreasure.alive) {
                        this.spawnedTreasure.killRingCreatures();
                        this.spawnedTreasure.alive = false;
                    }
                    this.spawnedTreasure = null;
                    this.state = 'closing';
                    this.timer = 0;
                    this.transitionProgress = 1;
                } else if (this.spawnedTreasure && this.spawnedTreasure.alive) {
                    this.spawnedTreasure.update(dt);
                }
                break;

            case 'closing':
                this.transitionProgress -= dt / this.transitionDuration;
                if (this.transitionProgress <= 0) {
                    this.transitionProgress = 0;
                    this.state = 'closed';
                    this.timer = 0;
                    this.nextOpenTime = randomRange(
                        CONFIG.CHEST_OPEN_INTERVAL_MIN,
                        CONFIG.CHEST_OPEN_INTERVAL_MAX
                    ) / 1000;
                }
                break;
        }

        // If treasure was caught mid-display, skip to closing
        if (this.spawnedTreasure && !this.spawnedTreasure.alive &&
            (this.state === 'open' || this.state === 'retreating')) {
            this.spawnedTreasure.killRingCreatures();
            this.spawnedTreasure = null;
            this.state = 'closing';
            this.timer = 0;
            this.transitionProgress = 1;
        }
    }

    render(ctx) {
        const size = this.chestDisplaySize;
        const half = size / 2;

        // Glow effect when open or opening
        if (this.state !== 'closed') {
            const glowAlpha = 0.3 + 0.15 * Math.sin(this.glowPhase);
            const glowSize = size + 40;
            const gradient = ctx.createRadialGradient(
                this.x, this.y, 10,
                this.x, this.y, glowSize
            );
            gradient.addColorStop(0, `rgba(241, 196, 15, ${glowAlpha})`);
            gradient.addColorStop(1, 'rgba(241, 196, 15, 0)');
            ctx.fillStyle = gradient;
            ctx.fillRect(this.x - glowSize, this.y - glowSize, glowSize * 2, glowSize * 2);
        }

        // Draw chest sprite
        if (this.treasureSheet && this.treasureSheet.loaded) {
            const isOpen = this.state === 'open' || this.state === 'retreating' ||
                (this.state === 'opening' && this.transitionProgress > 0.5) ||
                (this.state === 'closing' && this.transitionProgress > 0.5);
            const frame = isOpen ? this.openFrame : this.closedFrame;

            this.treasureSheet.drawFrame(
                ctx,
                frame.sx, frame.sy, frame.sw, frame.sh,
                this.x - half, this.y - half,
                size, size
            );
        }
    }
}
