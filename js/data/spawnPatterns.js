import { CONFIG } from './config.js';

// Edge definitions for spawning creatures
// Each pattern defines: where they enter, velocity direction, Y range
export const SPAWN_EDGES = {
    left: {
        getPosition: (yFraction) => ({
            x: -60,
            y: yFraction * CONFIG.DESIGN_HEIGHT,
        }),
        getVelocity: (speed) => ({ vx: speed, vy: 0 }),
    },
    right: {
        getPosition: (yFraction) => ({
            x: CONFIG.DESIGN_WIDTH + 60,
            y: yFraction * CONFIG.DESIGN_HEIGHT,
        }),
        getVelocity: (speed) => ({ vx: -speed, vy: 0 }),
    },
    topLeft: {
        getPosition: () => ({
            x: -60,
            y: -60,
        }),
        getVelocity: (speed) => ({ vx: speed * 0.8, vy: speed * 0.5 }),
    },
    topRight: {
        getPosition: () => ({
            x: CONFIG.DESIGN_WIDTH + 60,
            y: -60,
        }),
        getVelocity: (speed) => ({ vx: -speed * 0.8, vy: speed * 0.5 }),
    },
    top: {
        getPosition: (xFraction) => ({
            x: xFraction * CONFIG.DESIGN_WIDTH,
            y: -60,
        }),
        getVelocity: (speed) => ({ vx: 0, vy: speed }),
    },
};

// Difficulty tiers - which rarities can spawn at each tier
export const DIFFICULTY_TIERS = {
    early: {
        rarityWeights: { common: 70, uncommon: 25, rare: 5, epic: 0, legendary: 0 },
        speedMultiplier: 1.0,
        spawnInterval: [1.5, 3.0], // seconds between spawns
    },
    mid: {
        rarityWeights: { common: 40, uncommon: 35, rare: 20, epic: 5, legendary: 0 },
        speedMultiplier: 1.3,
        spawnInterval: [1.0, 2.5],
    },
    late: {
        rarityWeights: { common: 20, uncommon: 25, rare: 30, epic: 20, legendary: 5 },
        speedMultiplier: 1.6,
        spawnInterval: [0.8, 2.0],
    },
};

export function getTier(harpoonsRemaining) {
    if (harpoonsRemaining >= 7) return DIFFICULTY_TIERS.early;
    if (harpoonsRemaining >= 4) return DIFFICULTY_TIERS.mid;
    return DIFFICULTY_TIERS.late;
}
