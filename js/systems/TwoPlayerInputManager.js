import { CONFIG } from '../data/config.js';
import { clamp, degToRad } from '../utils/math.js';

// Input manager for two players with split-screen zones
// Bottom half controls Player 1, Top half controls Player 2
export class TwoPlayerInputManager {
    constructor(canvas) {
        this.canvas = canvas;

        // Player 1 (bottom) - aims upward
        this.p1 = {
            baseX: CONFIG.DESIGN_WIDTH / 2,
            baseY: CONFIG.DESIGN_HEIGHT - 40,
            aimAngle: 0,
            isAiming: false,
            wantsFire: false,
            activePointerId: null,
            direction: -1, // fires upward
        };

        // Player 2 (top) - aims downward
        this.p2 = {
            baseX: CONFIG.DESIGN_WIDTH / 2,
            baseY: 40,
            aimAngle: 0,
            isAiming: false,
            wantsFire: false,
            activePointerId: null,
            direction: 1, // fires downward
        };

        this._onPointerDown = this._onPointerDown.bind(this);
        this._onPointerMove = this._onPointerMove.bind(this);
        this._onPointerUp = this._onPointerUp.bind(this);

        canvas.addEventListener('pointerdown', this._onPointerDown);
        canvas.addEventListener('pointermove', this._onPointerMove);
        canvas.addEventListener('pointerup', this._onPointerUp);
        canvas.addEventListener('pointercancel', this._onPointerUp);
    }

    _screenToCanvas(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY,
        };
    }

    _getPlayerForPosition(pos) {
        // Top half = Player 2, Bottom half = Player 1
        return pos.y < CONFIG.DESIGN_HEIGHT / 2 ? this.p2 : this.p1;
    }

    _getPlayerForPointer(pointerId) {
        if (this.p1.activePointerId === pointerId) return this.p1;
        if (this.p2.activePointerId === pointerId) return this.p2;
        return null;
    }

    _updateAngle(player, pos) {
        const dx = pos.x - player.baseX;
        // For player 1, up is positive (baseY - pos.y)
        // For player 2, down is positive (pos.y - baseY)
        const dy = player.direction === -1
            ? player.baseY - pos.y
            : pos.y - player.baseY;

        if (dy <= 0) {
            // Pointer is on wrong side of harpoon base; keep previous angle
            return;
        }

        player.aimAngle = Math.atan2(dx, dy);
        const minRad = degToRad(CONFIG.AIM_ANGLE_MIN);
        const maxRad = degToRad(CONFIG.AIM_ANGLE_MAX);
        player.aimAngle = clamp(player.aimAngle, minRad, maxRad);
    }

    _onPointerDown(e) {
        const pos = this._screenToCanvas(e);
        const player = this._getPlayerForPosition(pos);

        // Allow each player to have one active pointer
        if (player.activePointerId !== null) return;

        player.activePointerId = e.pointerId;
        this.canvas.setPointerCapture(e.pointerId);
        this._updateAngle(player, pos);
        player.isAiming = true;
    }

    _onPointerMove(e) {
        const player = this._getPlayerForPointer(e.pointerId);
        if (!player) return;

        const pos = this._screenToCanvas(e);
        this._updateAngle(player, pos);
    }

    _onPointerUp(e) {
        const player = this._getPlayerForPointer(e.pointerId);
        if (!player) return;

        player.activePointerId = null;
        player.isAiming = false;
        player.wantsFire = true;
    }

    consumeFire(playerIndex) {
        const player = playerIndex === 0 ? this.p1 : this.p2;
        if (player.wantsFire) {
            player.wantsFire = false;
            return true;
        }
        return false;
    }

    getAimAngle(playerIndex) {
        return playerIndex === 0 ? this.p1.aimAngle : this.p2.aimAngle;
    }

    isAiming(playerIndex) {
        return playerIndex === 0 ? this.p1.isAiming : this.p2.isAiming;
    }

    destroy() {
        this.canvas.removeEventListener('pointerdown', this._onPointerDown);
        this.canvas.removeEventListener('pointermove', this._onPointerMove);
        this.canvas.removeEventListener('pointerup', this._onPointerUp);
        this.canvas.removeEventListener('pointercancel', this._onPointerUp);
    }
}
