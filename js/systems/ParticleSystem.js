import { randomRange } from '../utils/math.js';

class Particle {
    constructor(x, y, vx, vy, life, size, color) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.life = life;
        this.maxLife = life;
        this.size = size;
        this.color = color;
    }

    update(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.vy += 200 * dt; // gravity
        this.life -= dt;
    }

    get alpha() {
        return Math.max(0, this.life / this.maxLife);
    }

    get alive() {
        return this.life > 0;
    }
}

export class ParticleSystem {
    constructor() {
        this.particles = [];
    }

    emitSplash(x, y) {
        for (let i = 0; i < 12; i++) {
            this.particles.push(new Particle(
                x, y,
                randomRange(-150, 150),
                randomRange(-250, -50),
                randomRange(0.3, 0.7),
                randomRange(3, 7),
                '#7ec8e3'
            ));
        }
    }

    emitHit(x, y, color = '#FFD700') {
        for (let i = 0; i < 15; i++) {
            const angle = (Math.PI * 2 * i) / 15;
            const speed = randomRange(80, 200);
            this.particles.push(new Particle(
                x, y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                randomRange(0.4, 0.8),
                randomRange(3, 6),
                color
            ));
        }
    }

    emitLegendary(x, y) {
        for (let i = 0; i < 25; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = randomRange(50, 250);
            this.particles.push(new Particle(
                x, y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                randomRange(0.6, 1.2),
                randomRange(4, 9),
                Math.random() > 0.5 ? '#FFD700' : '#FFA500'
            ));
        }
    }

    emitBubbles(x, y, count = 5) {
        for (let i = 0; i < count; i++) {
            this.particles.push(new Particle(
                x + randomRange(-20, 20),
                y,
                randomRange(-10, 10),
                randomRange(-80, -30),
                randomRange(0.8, 1.5),
                randomRange(2, 5),
                'rgba(200, 230, 255, 0.6)'
            ));
        }
    }

    update(dt) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].update(dt);
            if (!this.particles[i].alive) {
                this.particles.splice(i, 1);
            }
        }
    }

    render(ctx) {
        for (const p of this.particles) {
            ctx.globalAlpha = p.alpha;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }
}
