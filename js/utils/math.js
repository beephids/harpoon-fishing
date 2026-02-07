export function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

export function lerp(a, b, t) {
    return a + (b - a) * t;
}

export function degToRad(deg) {
    return deg * (Math.PI / 180);
}

export function radToDeg(rad) {
    return rad * (180 / Math.PI);
}

export function distance(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
}

export function distanceSq(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return dx * dx + dy * dy;
}

export function randomRange(min, max) {
    return min + Math.random() * (max - min);
}

export function randomInt(min, max) {
    return Math.floor(randomRange(min, max + 1));
}

/**
 * Check if a line segment (ax,ay)-(bx,by) intersects a circle at (cx,cy) with radius r.
 * Returns the closest t parameter [0,1] of intersection, or -1 if no intersection.
 */
export function segmentIntersectsCircle(ax, ay, bx, by, cx, cy, r) {
    const dx = bx - ax;
    const dy = by - ay;
    const fx = ax - cx;
    const fy = ay - cy;

    const a = dx * dx + dy * dy;
    if (a === 0) {
        // Zero-length segment, just check point-in-circle
        return (fx * fx + fy * fy <= r * r) ? 0 : -1;
    }

    const b = 2 * (fx * dx + fy * dy);
    const c = fx * fx + fy * fy - r * r;
    let discriminant = b * b - 4 * a * c;

    if (discriminant < 0) return -1;

    discriminant = Math.sqrt(discriminant);
    const t1 = (-b - discriminant) / (2 * a);
    const t2 = (-b + discriminant) / (2 * a);

    // Return earliest intersection within [0, 1]
    if (t1 >= 0 && t1 <= 1) return t1;
    if (t2 >= 0 && t2 <= 1) return t2;
    // Segment is fully inside circle
    if (t1 < 0 && t2 > 1) return 0;

    return -1;
}
