import { CONFIG } from '../data/config.js';
import { CREATURE_TYPES, CREATURES_BY_RARITY, GHOST_CREATURE } from '../data/creatureData.js';
import { SPAWN_EDGES, getTier } from '../data/spawnPatterns.js';
import { SeaCreature } from '../entities/SeaCreature.js';
import { randomRange, randomInt } from '../utils/math.js';

export class SpawnManager {
    constructor(creatureSpriteSheet, sillySpriteSheet, isTwoPlayer = false) {
        this.spriteSheet = creatureSpriteSheet;
        this.sillySpriteSheet = sillySpriteSheet;
        this.isTwoPlayer = isTwoPlayer;
        this.spawnTimer = 0;
        this.nextSpawnTime = 2; // first spawn after 2 seconds
        this.ghostTimer = 0;
        this.normalGhostInterval = CONFIG.GHOST_SPAWN_INTERVAL_NORMAL;
        this.boostedGhostInterval = CONFIG.GHOST_SPAWN_INTERVAL_BOOSTED;
    }

    update(dt, harpoonsRemaining, creatures, useBoostedGhostRate = this.isTwoPlayer) {
        this.spawnTimer += dt;
        this.ghostTimer += dt;

        // Regular creature spawning
        if (this.spawnTimer >= this.nextSpawnTime && creatures.length < CONFIG.MAX_CREATURES_ON_SCREEN) {
            this.spawnTimer = 0;
            const tier = getTier(harpoonsRemaining);
            const [minInterval, maxInterval] = tier.spawnInterval;
            this.nextSpawnTime = randomRange(minInterval, maxInterval);

            const spawnSchool = Math.random() < 0.3;
            if (spawnSchool) {
                this._spawnSchool(tier, creatures);
            } else {
                this._spawnIndividual(tier, creatures);
            }
        }

        const ghostInterval = useBoostedGhostRate ? this.boostedGhostInterval : this.normalGhostInterval;

        // Ghost spawning cadence can scale down when a 2P player is out
        if (this.ghostTimer >= ghostInterval) {
            this.ghostTimer = 0;
            this._spawnGhost(creatures);
        }
    }

    _pickRarity(tier) {
        const weights = tier.rarityWeights;
        const total = Object.values(weights).reduce((a, b) => a + b, 0);
        let roll = Math.random() * total;
        for (const [rarity, weight] of Object.entries(weights)) {
            roll -= weight;
            if (roll <= 0) return rarity;
        }
        return 'common';
    }

    _pickCreatureType(rarity) {
        const pool = CREATURES_BY_RARITY[rarity];
        if (!pool || pool.length === 0) return CREATURES_BY_RARITY.common[0];
        return pool[randomInt(0, pool.length - 1)];
    }

    _pickEdge() {
        const edges = Object.keys(SPAWN_EDGES);
        return edges[randomInt(0, edges.length - 1)];
    }

    _spawnIndividual(tier, creatures) {
        const rarity = this._pickRarity(tier);
        const typeKey = this._pickCreatureType(rarity);
        const data = CREATURE_TYPES[typeKey];
        const edgeKey = this._pickEdge();
        const edge = SPAWN_EDGES[edgeKey];

        const yFraction = randomRange(0.1, 0.75);
        const pos = edge.getPosition(yFraction);
        const speed = data.baseSpeed * tier.speedMultiplier;
        const vel = edge.getVelocity(speed);

        const creature = new SeaCreature(typeKey, pos.x, pos.y, vel.vx, vel.vy, this.spriteSheet);
        creatures.push(creature);
    }

    _spawnSchool(tier, creatures) {
        const pool = CREATURES_BY_RARITY.common;
        const typeKey = pool[randomInt(0, pool.length - 1)];
        const data = CREATURE_TYPES[typeKey];
        const edgeKey = this._pickEdge();
        const edge = SPAWN_EDGES[edgeKey];

        const yFraction = randomRange(0.15, 0.7);
        const basePos = edge.getPosition(yFraction);
        const speed = data.baseSpeed * tier.speedMultiplier;
        const baseVel = edge.getVelocity(speed);

        const count = randomInt(3, 6);
        for (let i = 0; i < count; i++) {
            const offsetX = randomRange(-40, 40) + (i % 3) * 50;
            const offsetY = randomRange(-30, 30) + Math.floor(i / 3) * 45;
            const creature = new SeaCreature(
                typeKey,
                basePos.x + offsetX,
                basePos.y + offsetY,
                baseVel.vx + randomRange(-10, 10),
                baseVel.vy + randomRange(-5, 5),
                this.spriteSheet
            );
            creatures.push(creature);
        }
    }

    _spawnGhost(creatures) {
        const edgeKey = this._pickEdge();
        const edge = SPAWN_EDGES[edgeKey];
        const yFraction = randomRange(0.15, 0.65);
        const pos = edge.getPosition(yFraction);
        const speed = GHOST_CREATURE.baseSpeed;
        const vel = edge.getVelocity(speed);

        const ghost = new SeaCreature(
            GHOST_CREATURE,
            pos.x, pos.y,
            vel.vx, vel.vy,
            this.sillySpriteSheet
        );
        creatures.push(ghost);
    }
}
