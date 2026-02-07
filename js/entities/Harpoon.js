import { CONFIG } from '../data/config.js';

// States: idle, aiming, traveling, retracting
export class Harpoon {
    constructor(playerIndex = 0) {
        this.playerIndex = playerIndex;

        // Player 1 (bottom) vs Player 2 (top)
        if (playerIndex === 0) {
            this.baseX = CONFIG.DESIGN_WIDTH / 2;
            this.baseY = CONFIG.DESIGN_HEIGHT - 40;
            this.direction = -1; // fires upward (negative Y)
        } else {
            this.baseX = CONFIG.DESIGN_WIDTH / 2;
            this.baseY = 40;
            this.direction = 1; // fires downward (positive Y)
        }

        this.angle = 0;
        this.state = 'idle';

        this.tipX = this.baseX;
        this.tipY = this.baseY;
        this.prevTipX = this.baseX;
        this.prevTipY = this.baseY;
        this.currentRopeLength = 0;

        this.spearedCreature = null;

        // Player colors
        this.color = playerIndex === 0 ? '#3498db' : '#e74c3c';
        this.ropeColor = playerIndex === 0 ? '#c8a86e' : '#d4a574';
    }

    fire(angle) {
        if (this.state !== 'idle') return false;
        this.angle = angle;
        this.tipX = this.baseX;
        this.tipY = this.baseY;
        this.prevTipX = this.baseX;
        this.prevTipY = this.baseY;
        this.currentRopeLength = 0;
        this.spearedCreature = null;
        this.state = 'traveling';
        return true;
    }

    latchCreature(creature) {
        this.spearedCreature = creature;
        creature.alive = false;
        this.state = 'retracting';
    }

    update(dt) {
        if (this.state === 'traveling') {
            this.prevTipX = this.tipX;
            this.prevTipY = this.tipY;

            const speed = CONFIG.HARPOON_SPEED;
            const dx = Math.sin(this.angle) * speed * dt;
            const dy = this.direction * Math.cos(this.angle) * speed * dt;
            this.tipX += dx;
            this.tipY += dy;
            this.currentRopeLength += speed * dt;

            // Retract when past max rope or off-screen
            const offScreen = this.tipX < -50 || this.tipX > CONFIG.DESIGN_WIDTH + 50 ||
                              this.tipY < -50 || this.tipY > CONFIG.DESIGN_HEIGHT + 50;
            if (this.currentRopeLength >= CONFIG.HARPOON_MAX_ROPE || offScreen) {
                this.state = 'retracting';
            }
        } else if (this.state === 'retracting') {
            const speed = CONFIG.RETRACT_SPEED;
            const dxToBase = this.baseX - this.tipX;
            const dyToBase = this.baseY - this.tipY;
            const dist = Math.sqrt(dxToBase * dxToBase + dyToBase * dyToBase);

            if (dist <= speed * dt) {
                this.tipX = this.baseX;
                this.tipY = this.baseY;
                this.state = 'idle';
                this.spearedCreature = null;
            } else {
                const nx = dxToBase / dist;
                const ny = dyToBase / dist;
                this.tipX += nx * speed * dt;
                this.tipY += ny * speed * dt;
            }

            // Move speared creature with tip
            if (this.spearedCreature) {
                this.spearedCreature.x = this.tipX;
                this.spearedCreature.y = this.tipY;
                this.spearedCreature.renderY = this.tipY;
            }
        }
    }

    render(ctx, aimAngle, isAiming) {
        // Draw aim guide when aiming and idle
        if ((this.state === 'idle') && isAiming) {
            ctx.save();
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.lineWidth = 2;
            ctx.setLineDash([12, 12]);
            const guideLength = 600;
            const endX = this.baseX + Math.sin(aimAngle) * guideLength;
            const endY = this.baseY + this.direction * Math.cos(aimAngle) * guideLength;
            ctx.beginPath();
            ctx.moveTo(this.baseX, this.baseY);
            ctx.lineTo(endX, endY);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.restore();
        }

        // Draw rope and harpoon when traveling or retracting
        if (this.state === 'traveling' || this.state === 'retracting') {
            // Rope
            ctx.strokeStyle = this.ropeColor;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(this.baseX, this.baseY);
            ctx.lineTo(this.tipX, this.tipY);
            ctx.stroke();

            // Harpoon head (arrow triangle)
            ctx.save();
            ctx.translate(this.tipX, this.tipY);
            // Rotate based on direction - flip for player 2
            ctx.rotate(this.angle * (this.direction === 1 ? -1 : 1));
            if (this.direction === 1) ctx.scale(1, -1);
            ctx.fillStyle = '#d4d4d4';
            ctx.strokeStyle = '#666666';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, -18);
            ctx.lineTo(-7, 6);
            ctx.lineTo(7, 6);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.restore();
        }

        // Draw harpoon launcher at base
        ctx.save();
        ctx.translate(this.baseX, this.baseY);
        const drawAngle = (this.state === 'idle') ? aimAngle : this.angle;
        // Flip rotation for player 2
        ctx.rotate(drawAngle * (this.direction === 1 ? -1 : 1));
        if (this.direction === 1) ctx.scale(1, -1);

        // Launcher body
        ctx.fillStyle = '#8B5E3C';
        ctx.fillRect(-8, -35, 16, 40);
        ctx.strokeStyle = '#5C3A1E';
        ctx.lineWidth = 2;
        ctx.strokeRect(-8, -35, 16, 40);

        // Harpoon tip (when idle / ready to fire)
        if (this.state === 'idle') {
            ctx.fillStyle = '#d4d4d4';
            ctx.beginPath();
            ctx.moveTo(0, -50);
            ctx.lineTo(-7, -30);
            ctx.lineTo(7, -30);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#666666';
            ctx.stroke();
        }

        ctx.restore();
    }
}
