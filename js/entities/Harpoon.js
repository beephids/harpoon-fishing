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

            // Harpoon head (detailed)
            ctx.save();
            ctx.translate(this.tipX, this.tipY);
            // Rotate based on direction - flip for player 2
            ctx.rotate(this.angle * (this.direction === 1 ? -1 : 1));
            if (this.direction === 1) ctx.scale(1, -1);
            this._drawHarpoonHead(ctx, true);
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
        const launcherScale = 1.5;
        ctx.save();
        ctx.scale(launcherScale, launcherScale);
        this._drawBallistaLauncher(ctx);
        ctx.restore();

        // Harpoon tip (when idle / ready to fire)
        if (this.state === 'idle') {
            ctx.save();
            ctx.translate(0, -30 * launcherScale);
            this._drawHarpoonHead(ctx, false);
            ctx.restore();
        }

        ctx.restore();
    }

    _drawHarpoonHead(ctx, withShaft = true) {
        const metal = '#d4d4d4';
        const metalDark = '#9aa0a6';
        const wood = '#8B5E3C';
        const woodDark = '#6f452c';
        const scale = 1.25;

        ctx.save();
        ctx.scale(scale, scale);
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';

        // Metal tip (base at y=0)
        ctx.fillStyle = metal;
        ctx.beginPath();
        ctx.moveTo(0, -20);
        ctx.lineTo(-6, 0);
        ctx.lineTo(6, 0);
        ctx.closePath();
        ctx.fill();

        // Side barbs
        ctx.fillStyle = metalDark;
        ctx.beginPath();
        ctx.moveTo(-6, -3);
        ctx.lineTo(-11, 0);
        ctx.lineTo(-6, 3);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(6, -3);
        ctx.lineTo(11, 0);
        ctx.lineTo(6, 3);
        ctx.closePath();
        ctx.fill();

        // Neck/ferrule
        ctx.fillStyle = metalDark;
        ctx.fillRect(-4, 0, 8, 4);

        if (withShaft) {
            // Shaft
            ctx.fillStyle = wood;
            ctx.fillRect(-3, 4, 6, 14);

            // Grip wraps
            ctx.fillStyle = woodDark;
            ctx.fillRect(-3, 7, 6, 2);
            ctx.fillRect(-3, 12, 6, 2);

            // Bottom cap
            ctx.fillRect(-4, 18, 8, 3);
        }

        // Highlight on tip
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(0, -18);
        ctx.lineTo(0, 0);
        ctx.stroke();

        ctx.restore();
    }

    _drawBallistaLauncher(ctx) {
        const wood = '#8B5E3C';
        const woodDark = '#6f452c';
        const metal = '#b0b6bb';
        const metalDark = '#7d868c';
        const stringColor = 'rgba(255, 255, 255, 0.6)';

        ctx.save();
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';

        // Stock
        ctx.fillStyle = wood;
        ctx.fillRect(-6, -34, 12, 40);
        ctx.strokeStyle = woodDark;
        ctx.lineWidth = 2;
        ctx.strokeRect(-6, -34, 12, 40);

        // Base plate
        ctx.fillStyle = woodDark;
        ctx.fillRect(-12, 2, 24, 8);

        // Crossbeam (metal)
        ctx.fillStyle = metalDark;
        ctx.fillRect(-10, -32, 20, 4);

        // Left arm
        ctx.fillStyle = wood;
        ctx.beginPath();
        ctx.moveTo(-6, -30);
        ctx.lineTo(-22, -38);
        ctx.lineTo(-20, -32);
        ctx.lineTo(-6, -24);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = woodDark;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Right arm
        ctx.beginPath();
        ctx.moveTo(6, -30);
        ctx.lineTo(22, -38);
        ctx.lineTo(20, -32);
        ctx.lineTo(6, -24);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Metal tips on arms
        ctx.fillStyle = metal;
        ctx.beginPath();
        ctx.moveTo(-22, -38);
        ctx.lineTo(-26, -36);
        ctx.lineTo(-21, -34);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(22, -38);
        ctx.lineTo(26, -36);
        ctx.lineTo(21, -34);
        ctx.closePath();
        ctx.fill();

        // String
        ctx.strokeStyle = stringColor;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-24, -36);
        ctx.lineTo(24, -36);
        ctx.stroke();

        // Trigger block
        ctx.fillStyle = woodDark;
        ctx.fillRect(-4, -6, 8, 6);

        ctx.restore();
    }
}
