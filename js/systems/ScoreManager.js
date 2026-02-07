import { CONFIG } from '../data/config.js';

export class ScoreManager {
    constructor() {
        this.reset();
    }

    reset() {
        this.score = 0;
        this.harpoonsRemaining = CONFIG.STARTING_HARPOONS;
        this.harpoonsFired = 0;
        this.catches = []; // array of { typeKey, name, rarity, points }
        this.bestCatch = null;
    }

    useHarpoon() {
        this.harpoonsRemaining--;
        this.harpoonsFired++;
    }

    addCatch(creature) {
        const catchRecord = {
            typeKey: creature.typeKey,
            name: creature.name,
            rarity: creature.rarity,
            points: creature.points,
        };
        this.catches.push(catchRecord);
        this.score += creature.points;

        if (!this.bestCatch || creature.points > this.bestCatch.points) {
            this.bestCatch = catchRecord;
        }

        if (creature.bonusHarpoons > 0) {
            this.harpoonsRemaining += creature.bonusHarpoons;
        }

        return creature.bonusHarpoons;
    }

    get accuracy() {
        if (this.harpoonsFired === 0) return 0;
        return this.catches.length / this.harpoonsFired;
    }

    get isGameOver() {
        return this.harpoonsRemaining <= 0;
    }

    getSummary() {
        const byType = {};
        for (const c of this.catches) {
            if (!byType[c.typeKey]) {
                byType[c.typeKey] = { ...c, count: 0 };
            }
            byType[c.typeKey].count++;
        }
        return {
            score: this.score,
            totalCatches: this.catches.length,
            harpoonsFired: this.harpoonsFired,
            accuracy: Math.round(this.accuracy * 100),
            bestCatch: this.bestCatch,
            catchesByType: Object.values(byType),
        };
    }
}
