import { segmentIntersectsCircle } from '../utils/math.js';

export class CollisionSystem {
    /**
     * Check if the harpoon hit any creature this frame.
     * Uses ray-segment vs circle to prevent tunneling.
     * Returns the hit creature or null.
     */
    check(harpoon, creatures) {
        if (harpoon.state !== 'traveling') return null;

        let closestCreature = null;
        let closestT = Infinity;

        for (const creature of creatures) {
            if (!creature.alive) continue;

            const t = segmentIntersectsCircle(
                harpoon.prevTipX, harpoon.prevTipY,
                harpoon.tipX, harpoon.tipY,
                creature.x, creature.renderY,
                creature.hitboxRadius
            );

            if (t >= 0 && t < closestT) {
                closestT = t;
                closestCreature = creature;
            }
        }

        return closestCreature;
    }
}
