import { CONFIG } from '../data/config.js';
import { clamp, degToRad, screenToCanvas } from '../utils/math.js';

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
            keyboardAimActive: false,
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
            keyboardAimActive: false,
            direction: 1, // fires downward
        };

        this._onPointerDown = this._onPointerDown.bind(this);
        this._onPointerMove = this._onPointerMove.bind(this);
        this._onPointerUp = this._onPointerUp.bind(this);

        canvas.addEventListener('pointerdown', this._onPointerDown);
        canvas.addEventListener('pointermove', this._onPointerMove);
        canvas.addEventListener('pointerup', this._onPointerUp);
        canvas.addEventListener('pointercancel', this._onPointerUp);

        // Keyboard support: P1 = arrows, P2 = A/D/W
        this._keysHeld = new Set();
        this._onKeyDown = this._onKeyDown.bind(this);
        this._onKeyUp = this._onKeyUp.bind(this);
        window.addEventListener('keydown', this._onKeyDown);
        window.addEventListener('keyup', this._onKeyUp);
    }

    _updateIsAiming(player) {
        player.isAiming = player.activePointerId !== null || player.keyboardAimActive;
    }

    _onKeyDown(e) {
        if (e.repeat) return;
        // P1 aim
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
            e.preventDefault();
            this._keysHeld.add(e.key);
            this.p1.keyboardAimActive = true;
            this._updateIsAiming(this.p1);
        }
        // P1 fire
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            this.p1.wantsFire = true;
        }
        // P2 aim
        if (e.key === 'a' || e.key === 'A' || e.key === 'd' || e.key === 'D') {
            this._keysHeld.add(e.key.toLowerCase());
            this.p2.keyboardAimActive = true;
            this._updateIsAiming(this.p2);
        }
        // P2 fire
        if (e.key === 'w' || e.key === 'W') {
            this.p2.wantsFire = true;
        }
    }

    _onKeyUp(e) {
        this._keysHeld.delete(e.key);
        this._keysHeld.delete(e.key.toLowerCase());
        this._updateIsAiming(this.p1);
        this._updateIsAiming(this.p2);
    }

    update(dt) {
        const aimSpeed = 1.5;
        if (this._keysHeld.has('ArrowLeft')) this.p1.aimAngle -= aimSpeed * dt;
        if (this._keysHeld.has('ArrowRight')) this.p1.aimAngle += aimSpeed * dt;
        if (this._keysHeld.has('a')) this.p2.aimAngle -= aimSpeed * dt;
        if (this._keysHeld.has('d')) this.p2.aimAngle += aimSpeed * dt;

        const minRad = degToRad(CONFIG.AIM_ANGLE_MIN);
        const maxRad = degToRad(CONFIG.AIM_ANGLE_MAX);
        this.p1.aimAngle = clamp(this.p1.aimAngle, minRad, maxRad);
        this.p2.aimAngle = clamp(this.p2.aimAngle, minRad, maxRad);
    }

    _screenToCanvas(e) {
        return screenToCanvas(this.canvas, e);
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

        player.keyboardAimActive = false;
        player.activePointerId = e.pointerId;
        this.canvas.setPointerCapture(e.pointerId);
        this._updateAngle(player, pos);
        this._updateIsAiming(player);
    }

    _onPointerMove(e) {
        const player = this._getPlayerForPointer(e.pointerId);
        if (!player) return;

        player.keyboardAimActive = false;
        const pos = this._screenToCanvas(e);
        this._updateAngle(player, pos);
    }

    _onPointerUp(e) {
        const player = this._getPlayerForPointer(e.pointerId);
        if (!player) return;

        player.activePointerId = null;
        player.keyboardAimActive = false;
        this._updateIsAiming(player);
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
        window.removeEventListener('keydown', this._onKeyDown);
        window.removeEventListener('keyup', this._onKeyUp);
    }
}
